const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function testPlace() {
  const ppUrl = 'https://www.photopea.com#' + encodeURIComponent(JSON.stringify({
    environment: { theme: 2, vmode: 2 }
  }));

  const samplePsdPath = path.resolve(__dirname, '../samples/CR80_AAMVA_Front_Template.psd');
  const psdBytes = fs.readFileSync(samplePsdPath);

  // Simple 50x50 red test image data URI
  const { createCanvas } = require('@napi-rs/canvas');
  const testCanvas = createCanvas(100, 100);
  const ctx = testCanvas.getContext('2d');
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 100, 100);
  const testDataUri = testCanvas.toDataURL('image/png');

  const html = `<!DOCTYPE html>
<html>
<body>
  <iframe id="pp" src="${ppUrl}" style="width:1000px; height:800px;"></iframe>
  <script>
    window.isReady = false;
    window.addEventListener('message', (e) => {
      if (e.data === 'done' && !window.isReady) window.isReady = true;
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

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });

  // Load PSD
  await page.evaluate((base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    document.getElementById('pp').contentWindow.postMessage(bytes.buffer, '*');
  }, psdBytes.toString('base64'));

  // Wait for PSD load
  await page.evaluate(() => {
    return new Promise(resolve => {
      const handler = (e) => {
        if (e.data === 'done') {
          window.removeEventListener('message', handler);
          resolve();
        }
      };
      window.addEventListener('message', handler);
    });
  });

  console.log('PSD loaded. Testing layer placement script...');

  const placeResult = await page.evaluate((dataUri) => {
    return new Promise(resolve => {
      const iframe = document.getElementById('pp');
      let echoes = [];

      window.addEventListener('message', (e) => {
        if (typeof e.data === 'string' && e.data !== 'done') {
          echoes.push(e.data);
        } else if (e.data === 'done' && echoes.length > 0) {
          resolve({ success: true, echoes });
        }
      });

      const script = `
        var doc = app.activeDocument;
        var target = doc.layers[0];
        app.echoToOE("TargetLayer: " + target.name + ", bounds: " + target.bounds);
        
        // Open dataUri as smart object
        app.open("${dataUri}", null, true);
        
        var newLayer = doc.activeLayer;
        app.echoToOE("NewLayer: " + newLayer.name + ", bounds: " + newLayer.bounds);
        
        // Move newLayer to target position
        var curBounds = newLayer.bounds;
        var curW = curBounds[2].value - curBounds[0].value;
        var curH = curBounds[3].value - curBounds[1].value;
        var targetBounds = target.bounds;
        var targetW = targetBounds[2].value - targetBounds[0].value;
        var targetH = targetBounds[3].value - targetBounds[1].value;
        
        var scaleX = (targetW / curW) * 100;
        var scaleY = (targetH / curH) * 100;
        newLayer.resize(scaleX, scaleY, AnchorPosition.TOPLEFT);
        
        var postResize = newLayer.bounds;
        var dx = targetBounds[0].value - postResize[0].value;
        var dy = targetBounds[1].value - postResize[1].value;
        newLayer.translate(dx, dy);
        
        app.echoToOE("Transformed NewLayer bounds: " + newLayer.bounds);
        app.activeDocument.saveToOE("png");
      `;

      iframe.contentWindow.postMessage(script, '*');
      setTimeout(() => resolve({ success: false, echoes, timeout: true }), 25000);
    });
  }, testDataUri);

  console.log('Place Result:', placeResult);

  await browser.close();
  server.close();
}

testPlace().catch(console.error);
