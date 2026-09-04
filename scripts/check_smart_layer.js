const http = require('http');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function checkWhereNewLayerIs() {
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

  const result = await page.evaluate(() => {
    return new Promise(resolve => {
      window.addEventListener('message', e => {
        if (typeof e.data === 'string' && e.data.startsWith('TEST:')) resolve(e.data);
      });
      const s = `
        app.documents.add(500, 500, 72, "TestDoc", NewDocumentMode.RGB);
        var doc = app.activeDocument;
        var initialLayers = [];
        for (var i=0; i<doc.layers.length; i++) initialLayers.push(doc.layers[i].name);

        // Open small 10x10 png data uri as smart object
        var tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJAD/sY6DeFAAAAAElFTkSuQmCC";
        app.open(tinyPng, null, true);

        var afterLayers = [];
        for (var j=0; j<doc.layers.length; j++) afterLayers.push(doc.layers[j].name);

        app.echoToOE("TEST: initial=[" + initialLayers.join(",") + "], after=[" + afterLayers.join(",") + "], activeLayer=" + doc.activeLayer.name);
      `;
      document.getElementById('pp').contentWindow.postMessage(s, '*');
    });
  });

  console.log('Result:', result);
  await browser.close();
  server.close();
}

checkWhereNewLayerIs().catch(console.error);
