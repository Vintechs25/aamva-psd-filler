const http = require('http');
const puppeteer = require('puppeteer-core');

async function test() {
  const ppUrl = 'https://www.photopea.com#' + encodeURIComponent(JSON.stringify({
    environment: {
      theme: 2,
      vmode: 2
    }
  }));

  const html = `<!DOCTYPE html>
<html>
<body>
  <iframe id="pp" src="${ppUrl}" style="width:800px; height:600px;"></iframe>
  <script>
    window.addEventListener('message', e => {
      console.log('PARENT_MSG_EVENT:', typeof e.data, e.data);
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
  console.log('Server running on port:', port);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto(`http://127.0.0.1:${port}`);
  
  await new Promise(r => setTimeout(r, 15000));

  await browser.close();
  server.close();
}

test().catch(console.error);
