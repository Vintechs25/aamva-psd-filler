const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { preparePortraitDataUri } = require('../src/photopea-script');

async function debugStep2() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
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
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() => window.isReady === true, { timeout: 45000 });

  const psdBytes = fs.readFileSync(psdPath);
  await page.evaluate((base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    document.getElementById('pp').contentWindow.postMessage(bytes.buffer, '*');
  }, psdBytes.toString('base64'));

  await page.evaluate(() => new Promise(res => {
    const h = (e) => { if (e.data === 'done') { window.removeEventListener('message', h); res(); } };
    window.addEventListener('message', h);
  }));

  const photoPath = 'C:/Users/Vintech Systems/Downloads/6a59f2d7e1e70_download-removebg-preview.png';
  const portraitDataUri = await preparePortraitDataUri(photoPath, 666, 775);

  const step2Result = await page.evaluate((dataUri) => {
    return new Promise(resolve => {
      let sz = 0;
      let echoes = [];
      window.addEventListener('message', e => {
        if (e.data instanceof ArrayBuffer) {
          sz = e.data.byteLength;
        } else if (typeof e.data === 'string') {
          echoes.push(e.data);
          if (e.data === 'done' && sz > 0) resolve({ sz, echoes });
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

        // Try replacing Photo Big
        var photoBig = find(front, "Photo Big");
        app.echoToOE("Found Photo Big: " + !!photoBig);
        if (photoBig) {
          var tb = photoBig.bounds;
          app.echoToOE("PhotoBig bounds: " + tb[0].value + "," + tb[1].value + "," + tb[2].value + "," + tb[3].value);
          app.open("${dataUri}", null, true);
          var newL = doc.activeLayer;
          app.echoToOE("New layer created: " + newL.name + ", activeDoc: " + app.activeDocument.name);
        }

        doc.saveToOE("png");
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
      setTimeout(() => resolve({ timeout: true, echoes, sz }), 25000);
    });
  }, portraitDataUri);

  console.log('Step 2 Result:', step2Result);

  await browser.close();
  server.close();
}

debugStep2().catch(console.error);
