const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function testFrontVisibility() {
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

  // Test script: inspect every child of Front, hide "border", hide "SELECT BACKGROUND"
  const pngSize = await page.evaluate(() => {
    return new Promise(resolve => {
      let size = 0;
      window.addEventListener('message', e => {
        if (e.data instanceof ArrayBuffer) {
          size = e.data.byteLength;
        } else if (e.data === 'done' && size > 0) {
          resolve(size);
        }
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
        var bg = find(doc, "SELECT BACKGROUND");

        if (back) back.visible = false;
        if (front) front.visible = true;

        // Check border
        var border = find(front, "border");
        if (border) {
          app.echoToOE("Found border in front, hiding it");
          border.visible = false;
        }

        doc.saveToOE("png");
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  console.log('Export PNG size without border:', pngSize);

  await browser.close();
  server.close();
}

testFrontVisibility().catch(console.error);
