const { readPsd, writePsd, initializeCanvas } = require('ag-psd');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const { PRESET_PROFILES, generateAamvaBarcodePayload } = require('../src/aamva-standard');

async function testHybrid() {
  console.log('=== TESTING PHOTOPEA PSD RENDERING WITH PRE-POPULATED IMAGES ===');
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  const profile = PRESET_PROFILES.texas_cdl.data;
  const photoPath = 'C:/Users/Vintech Systems/Downloads/6a59f2d7e1e70_download-removebg-preview.png';
  const sigPath = 'C:/Users/Vintech Systems/Downloads/signature (1).png';

  console.log('1. Reading PSD with ag-psd...');
  const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });
  psd.bitsPerChannel = 8;

  const userPhotoImg = await loadImage(photoPath);
  const userSigImg = await loadImage(sigPath);

  // Helper to find layer by name in psd tree
  function findPsdLayer(parent, name) {
    if (!parent || !parent.children) return null;
    const lower = name.toLowerCase();
    for (const c of parent.children) {
      if (c.name.toLowerCase() === lower) return c;
      const found = findPsdLayer(c, name);
      if (found) return found;
    }
    return null;
  }

  const frontGroup = psd.children.find(c => c.name === 'Front');
  const backGroup = psd.children.find(c => c.name === 'Back');

  // Place portrait
  const photoBig = findPsdLayer(frontGroup, 'Photo Big');
  if (photoBig) {
    const w = photoBig.right - photoBig.left;
    const h = photoBig.bottom - photoBig.top;
    const pCanvas = createCanvas(w, h);
    const pCtx = pCanvas.getContext('2d');
    pCtx.fillStyle = '#f8fafc';
    pCtx.fillRect(0, 0, w, h);
    const scale = Math.max(w / userPhotoImg.width, h / userPhotoImg.height);
    const dw = userPhotoImg.width * scale;
    const dh = userPhotoImg.height * scale;
    pCtx.drawImage(userPhotoImg, (w - dw)/2, (h - dh)/2, dw, dh);
    photoBig.canvas = pCanvas;
    console.log('  ✓ Placed portrait photo into Photo Big');
  }

  // Place ghost
  const photoGhost = findPsdLayer(frontGroup, 'Photo Ghost');
  if (photoGhost) {
    const w = photoGhost.right - photoGhost.left;
    const h = photoGhost.bottom - photoGhost.top;
    const gCanvas = createCanvas(w, h);
    const gCtx = gCanvas.getContext('2d');
    const scale = Math.max(w / userPhotoImg.width, h / userPhotoImg.height);
    const dw = userPhotoImg.width * scale;
    const dh = userPhotoImg.height * scale;
    gCtx.drawImage(userPhotoImg, (w - dw)/2, (h - dh)/2, dw, dh);
    const imgData = gCtx.getImageData(0, 0, w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const avg = 0.299 * imgData.data[i] + 0.587 * imgData.data[i+1] + 0.114 * imgData.data[i+2];
      const highKey = Math.min(255, Math.round(avg * 1.15));
      imgData.data[i] = highKey;
      imgData.data[i+1] = highKey;
      imgData.data[i+2] = highKey;
      imgData.data[i+3] = Math.round(imgData.data[i+3] * 0.38);
    }
    gCtx.putImageData(imgData, 0, 0);
    photoGhost.canvas = gCanvas;
    console.log('  ✓ Placed ghost photo into Photo Ghost');
  }

  // Place signature
  const sigGroup = findPsdLayer(frontGroup, 'Signatue');
  const visibleSig = sigGroup ? sigGroup.children.find(c => c.visible !== false && !c.hidden && c.canvas && !c.text) : null;
  if (visibleSig) {
    const w = visibleSig.right - visibleSig.left;
    const h = visibleSig.bottom - visibleSig.top;
    const sCanvas = createCanvas(w, h);
    const sCtx = sCanvas.getContext('2d');
    const scale = Math.min((w - 20) / userSigImg.width, (h - 20) / userSigImg.height);
    const dw = userSigImg.width * scale;
    const dh = userSigImg.height * scale;
    sCtx.drawImage(userSigImg, (w - dw)/2, (h - dh)/2, dw, dh);
    visibleSig.canvas = sCanvas;
    console.log('  ✓ Placed signature into Signature layer');
  }

  // Place barcode on back
  const pdf417Layer = findPsdLayer(backGroup, 'PDF417_A1181102_202105110338');
  if (pdf417Layer) {
    const w = pdf417Layer.right - pdf417Layer.left;
    const h = pdf417Layer.bottom - pdf417Layer.top;
    const payload = generateAamvaBarcodePayload(profile);
    const bPng = await bwipjs.toBuffer({
      bcid: 'pdf417',
      text: payload,
      scale: 3,
      eclevel: 5,
      columns: 14,
      width: Math.round(w / 4),
      height: Math.round(h / 4)
    });
    const bImg = await loadImage(bPng);
    const bCanvas = createCanvas(w, h);
    const bCtx = bCanvas.getContext('2d');
    bCtx.fillStyle = '#FFFFFF';
    bCtx.fillRect(0, 0, w, h);
    const scale = Math.min((w - 10) / bImg.width, (h - 10) / bImg.height);
    const dw = bImg.width * scale;
    const dh = bImg.height * scale;
    bCtx.drawImage(bImg, (w - dw)/2, (h - dh)/2, dw, dh);
    pdf417Layer.canvas = bCanvas;
    console.log('  ✓ Placed AAMVA PDF417 barcode');
  }

  console.log('2. Writing modified PSD buffer for Photopea...');
  const preparedPsdBytes = Buffer.from(writePsd(psd, { generateThumbnail: true }));
  console.log(`  ✓ PSD bytes ready: ${Math.round(preparedPsdBytes.length / 1024)} KB`);

  // 3. Load into Photopea, update text, export Front PNG and Back PNG!
  console.log('3. Loading into Photopea...');
  const ppUrl = 'https://www.photopea.com#' + encodeURIComponent(JSON.stringify({ environment: { theme: 2, vmode: 2 } }));
  const html = `<!DOCTYPE html><html><body><iframe id="pp" src="${ppUrl}" style="width:1200px; height:900px;"></iframe><script>window.isReady=false; window.addEventListener('message', e => { if (e.data==='done') window.isReady=true; });</script></body></html>`;
  const server = http.createServer((req, res) => { res.writeHead(200, {'Content-Type':'text/html'}); res.end(html); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() => window.isReady === true, { timeout: 45000 });

  // Send PSD
  await page.evaluate((base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    document.getElementById('pp').contentWindow.postMessage(bytes.buffer, '*');
  }, preparedPsdBytes.toString('base64'));

  await page.evaluate(() => new Promise(res => {
    const h = (e) => { if (e.data === 'done') { window.removeEventListener('message', h); res(); } };
    window.addEventListener('message', h);
  }));

  console.log('PSD loaded into Photopea! Updating text layers and rendering Front PNG...');

  const frontPngBase64 = await page.evaluate(() => {
    return new Promise(resolve => {
      let buf = null;
      window.addEventListener('message', e => {
        if (e.data instanceof ArrayBuffer) buf = e.data;
        else if (e.data === 'done' && buf) {
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          resolve(btoa(binary));
        }
      });

      const s = `
        var doc = app.activeDocument;
        function find(p, n) {
          if (!p || !p.layers) return null;
          var lower = n.toLowerCase();
          for (var i=0; i<p.layers.length; i++) {
            if (p.layers[i].name.toLowerCase() === lower) return p.layers[i];
            var f = find(p.layers[i], n);
            if (f) return f;
          }
          return null;
        }

        var front = find(doc, "Front");
        var back = find(doc, "Back");
        if (back) back.visible = false;
        if (front) front.visible = true;
        var border = find(front, "border");
        if (border) border.visible = false;

        // Update cardholder text
        var dataGroup = find(front, "Data");
        function setT(n, val) {
          var l = find(dataGroup, n);
          if (l && l.kind == LayerKind.TEXT) l.textItem.contents = val;
        }

        setT("CARLISLE", "RODRIGUEZ");
        setT("EDWARD CULLEN", "CARLOS JAVIER");
        setT("85316244", "28409184");
        setT("09/21/1990", "04/12/1984");
        setT("09/21/2026", "04/12/2030");
        setT("07/11/2020", "04/12/2024");
        setT("123 STREET CITY,tx 70000", "742 EVERGREEN TERRACE\\rAUSTIN, TX 78701");
        setT("A", "A");
        setT("NONE", "NONE");
        setT("NONE копия", "NONE");
        setT("5'-10''", "5'-11''");
        setT("M", "M");
        setT("BRO", "BRO");
        setT("35838232126640572484", "89201948201948201928");

        doc.saveToOE("png");
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  const frontPngBuffer = Buffer.from(frontPngBase64, 'base64');
  console.log(`✓ Front PNG rendered: ${Math.round(frontPngBuffer.length / 1024)} KB`);
  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/Texas_Photopea_Front_Perfect.png', frontPngBuffer);

  // Render Back PNG
  console.log('Rendering Back PNG...');
  const backPngBase64 = await page.evaluate(() => {
    return new Promise(resolve => {
      let buf = null;
      window.addEventListener('message', e => {
        if (e.data instanceof ArrayBuffer) buf = e.data;
        else if (e.data === 'done' && buf) {
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          resolve(btoa(binary));
        }
      });

      const s = `
        var doc = app.activeDocument;
        function find(p, n) {
          if (!p || !p.layers) return null;
          var lower = n.toLowerCase();
          for (var i=0; i<p.layers.length; i++) {
            if (p.layers[i].name.toLowerCase() === lower) return p.layers[i];
            var f = find(p.layers[i], n);
            if (f) return f;
          }
          return null;
        }
        var front = find(doc, "Front");
        var back = find(doc, "Back");
        if (front) front.visible = false;
        if (back) back.visible = true;
        var bBorder = find(back, "border");
        if (bBorder) bBorder.visible = false;

        doc.saveToOE("png");
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  const backPngBuffer = Buffer.from(backPngBase64, 'base64');
  console.log(`✓ Back PNG rendered: ${Math.round(backPngBuffer.length / 1024)} KB`);
  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/Texas_Photopea_Back_Perfect.png', backPngBuffer);

  // Save editable PSD from Photopea
  console.log('Saving editable PSD from Photopea...');
  const psdBase64 = await page.evaluate(() => {
    return new Promise(resolve => {
      let buf = null;
      window.addEventListener('message', e => {
        if (e.data instanceof ArrayBuffer) buf = e.data;
        else if (e.data === 'done' && buf) {
          const bytes = new Uint8Array(buf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          resolve(btoa(binary));
        }
      });

      const s = `
        var doc = app.activeDocument;
        function find(p, n) {
          if (!p || !p.layers) return null;
          var lower = n.toLowerCase();
          for (var i=0; i<p.layers.length; i++) {
            if (p.layers[i].name.toLowerCase() === lower) return p.layers[i];
            var f = find(p.layers[i], n);
            if (f) return f;
          }
          return null;
        }
        var front = find(doc, "Front");
        var back = find(doc, "Back");
        if (front) front.visible = true;
        if (back) back.visible = false;
        var fBorder = find(front, "border");
        if (fBorder) fBorder.visible = false;
        var bBorder = find(back, "border");
        if (bBorder) bBorder.visible = false;

        doc.saveToOE("psd");
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  const outPsdBuffer = Buffer.from(psdBase64, 'base64');
  console.log(`✓ Editable PSD saved: ${Math.round(outPsdBuffer.length / 1024)} KB`);
  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/Texas_Photopea_Filled_Perfect.psd', outPsdBuffer);

  console.log('\n=== ALL PERFECT FILES GENERATED! ===');
  await browser.close();
  server.close();
}

testHybrid().catch(console.error);
