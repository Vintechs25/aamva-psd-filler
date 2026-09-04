const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function checkLayers() {
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

  const info = await page.evaluate(() => {
    return new Promise(resolve => {
      window.addEventListener('message', e => {
        if (typeof e.data === 'string' && e.data.startsWith('INFO:')) {
          resolve(e.data);
        }
      });
      const s = `
        var doc = app.activeDocument;
        var msg = "INFO: ";
        for (var i = 0; i < doc.layers.length; i++) {
          var l = doc.layers[i];
          msg += "[" + i + ": " + l.name + ", vis=" + l.visible + ", kind=" + l.typename + "] ";
        }
        app.echoToOE(msg);
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  console.log('Document top-level layers in Photopea:');
  console.log(info);

  await browser.close();
  server.close();
}

checkLayers().catch(console.error);
