const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { PRESET_PROFILES } = require('../src/aamva-standard');
const { buildPhotopeaScript, generateBarcodeDataUri, preparePortraitDataUri, prepareGhostDataUri, prepareSignatureDataUri } = require('../src/photopea-script');

async function debugScript() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  const schema = JSON.parse(fs.readFileSync('C:/Users/Vintech Systems/psd-test/gemini_multimodal_schema.json', 'utf8'));
  const profile = PRESET_PROFILES.texas_cdl.data;
  const photoPath = 'C:/Users/Vintech Systems/Downloads/6a59f2d7e1e70_download-removebg-preview.png';
  const sigPath = 'C:/Users/Vintech Systems/Downloads/signature (1).png';

  const portrait = await preparePortraitDataUri(photoPath, 666, 775);
  const ghost = await prepareGhostDataUri(photoPath, 237, 272);
  const signature = await prepareSignatureDataUri(sigPath);
  const { dataUri: barcode } = await generateBarcodeDataUri(profile);

  const script = buildPhotopeaScript({
    formData: profile,
    schema,
    assets: { portrait, ghost, signature, barcode },
    action: 'render_front'
  });

  // Wrap with detailed logging
  const wrappedScript = `
    try {
      app.echoToOE("STARTING_FRONT_SCRIPT");
      ${script}
      app.echoToOE("FINISHED_FRONT_SCRIPT");
    } catch(err) {
      app.echoToOE("SCRIPT_ERROR: " + err + " (line " + err.line + ")");
    }
  `;

  // Start test server
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
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() => window.isReady === true, { timeout: 45000 });

  console.log('Photopea ready. Sending PSD...');
  const psdBytes = fs.readFileSync(psdPath);
  await page.evaluate((base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    document.getElementById('pp').contentWindow.postMessage(bytes.buffer, '*');
  }, psdBytes.toString('base64'));

  await page.evaluate(() => {
    return new Promise(resolve => {
      const handler = (e) => { if (e.data === 'done') { window.removeEventListener('message', handler); resolve(); } };
      window.addEventListener('message', handler);
    });
  });

  console.log('PSD loaded. Executing wrapped script...');

  const result = await page.evaluate((s) => {
    return new Promise((resolve) => {
      let echoes = [];
      let arrayBufferLength = 0;

      window.addEventListener('message', (e) => {
        if (e.data instanceof ArrayBuffer) {
          arrayBufferLength = e.data.byteLength;
        } else if (typeof e.data === 'string') {
          echoes.push(e.data);
          if (e.data === 'done' && arrayBufferLength > 0) {
            resolve({ success: true, echoes, arrayBufferLength });
          }
        }
      });

      document.getElementById('pp').contentWindow.postMessage(s, '*');
      setTimeout(() => resolve({ success: false, timeout: true, echoes, arrayBufferLength }), 25000);
    });
  }, wrappedScript);

  console.log('Script execution result:');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  server.close();
}

debugScript().catch(console.error);
