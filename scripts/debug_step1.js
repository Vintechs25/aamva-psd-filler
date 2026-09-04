const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function debugStepByStep() {
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

  // Step 1: Just update text and check PNG
  const step1Size = await page.evaluate(() => {
    return new Promise(resolve => {
      let sz = 0;
      window.addEventListener('message', e => {
        if (e.data instanceof ArrayBuffer) sz = e.data.byteLength;
        else if (e.data === 'done' && sz > 0) resolve(sz);
      });
      const s = `
        var doc = app.activeDocument;
        function find(p, n) {
          for (var i=0; i<p.layers.length; i++) {
            if (p.layers[i].name.toLowerCase() === n.toLowerCase()) return p.layers[i];
          }
          return null;
        }
        var front = find(doc, "Front");
        var back = find(doc, "Back");
        if (back) back.visible = false;
        if (front) front.visible = true;
        var border = find(front, "border");
        if (border) border.visible = false;

        // Text update test
        var dataGroup = find(front, "Data");
        var dcs = find(dataGroup, "CARLISLE");
        if (dcs) dcs.textItem.contents = "RODRIGUEZ";

        doc.saveToOE("png");
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  console.log('Step 1 (Text update only) PNG size:', step1Size);

  await browser.close();
  server.close();
}

debugStepByStep().catch(console.error);
