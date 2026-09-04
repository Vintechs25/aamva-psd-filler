const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testFullFlow() {
  const ppConfig = {
    environment: {
      theme: 2,
      vmode: 2
    }
  };
  const ppUrl = 'https://www.photopea.com#' + encodeURIComponent(JSON.stringify(ppConfig));

  const samplePsdPath = path.resolve(__dirname, '../samples/CR80_AAMVA_Front_Template.psd');
  const psdBytes = fs.readFileSync(samplePsdPath);
  console.log(`Loaded sample PSD: ${psdBytes.length} bytes`);

  // Include the message listener directly in the HTML so NO messages can ever be missed!
  const html = `<!DOCTYPE html>
<html>
<body>
  <iframe id="pp" src="${ppUrl}" style="width:1000px; height:800px;"></iframe>
  <script>
    window.messageQueue = [];
    window.isReady = false;
    window.addEventListener('message', (e) => {
      console.log('[MSG]', typeof e.data === 'string' ? e.data : ('ArrayBuffer ' + e.data.byteLength));
      if (e.data === 'done' && !window.isReady) {
        window.isReady = true;
      }
      window.messageQueue.push(e.data);
    });
  </script>
</body>
</html>`;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.goto(`http://127.0.0.1:${port}`);

  console.log('Waiting for window.isReady...');
  await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });
  console.log('Photopea is READY!');

  // Now send the PSD ArrayBuffer
  console.log('Sending PSD ArrayBuffer to Photopea...');
  await page.evaluate((base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    document.getElementById('pp').contentWindow.postMessage(bytes.buffer, '*');
  }, psdBytes.toString('base64'));

  // Wait for "done" after opening PSD
  console.log('Waiting for PSD load complete ("done")...');
  const opened = await page.evaluate(() => {
    return new Promise((resolve) => {
      const handler = (e) => {
        if (e.data === 'done') {
          window.removeEventListener('message', handler);
          resolve(true);
        }
      };
      window.addEventListener('message', handler);
      setTimeout(() => resolve(false), 20000);
    });
  });
  console.log('PSD load finished:', opened);

  // Now execute a script to inspect layers and export PNG
  console.log('Executing script to export PNG...');
  const exportResult = await page.evaluate(() => {
    return new Promise((resolve) => {
      let pngBytes = null;
      let echoMsg = null;

      const handler = (e) => {
        if (e.data instanceof ArrayBuffer) {
          pngBytes = e.data.byteLength;
        } else if (typeof e.data === 'string' && e.data !== 'done') {
          echoMsg = e.data;
        } else if (e.data === 'done' && pngBytes) {
          window.removeEventListener('message', handler);
          resolve({ success: true, pngSize: pngBytes, echo: echoMsg });
        }
      };
      window.addEventListener('message', handler);

      const script = `
        app.echoToOE("ACTIVE_DOC=" + app.activeDocument.name + ", LAYERS=" + app.activeDocument.layers.length);
        app.activeDocument.saveToOE("png");
      `;
      document.getElementById('pp').contentWindow.postMessage(script, '*');
      setTimeout(() => resolve({ success: false, timeout: true }), 25000);
    });
  });

  console.log('Export Result:', exportResult);

  await browser.close();
  server.close();
}

testFullFlow().catch(console.error);
