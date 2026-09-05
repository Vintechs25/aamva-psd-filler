/**
 * Photopea Rendering Engine
 * Embeds Photopea (https://www.photopea.com) as the native Photoshop engine
 * with perfect preservation of typography, smart objects, blend modes,
 * guilloche security patterns, holograms, and multi-layer structures.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { readPsd, writePsd, initializeCanvas } = require('ag-psd');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const { PDFDocument } = require('pdf-lib');
const bwipjs = require('bwip-js');
const {
  generateAamvaBarcodePayload,
  cleanAamvaText,
  formatDisplayDate,
  formatAamvaDate,
  formatAamvaHeight
} = require('./aamva-standard');

// Locate installed Chrome or Edge executable on Windows
function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No compatible browser (Chrome or Edge) found for Photopea engine.');
}

/**
 * Helper to recursively find a layer in ag-psd tree
 */
function findLayerInPsd(parent, name) {
  if (!parent || !parent.children) return null;
  const leaf = String(name).split('/').pop().trim().toLowerCase();
  for (const c of parent.children) {
    if (c.name.toLowerCase() === leaf) return c;
    const found = findLayerInPsd(c, name);
    if (found) return found;
  }
  return null;
}

/**
 * Formats height for human-readable card display (e.g. 5'-10")
 */
function formatDisplayHeight(val) {
  if (!val) return "5'-10\"";
  const str = String(val).trim();
  const m = str.match(/^(\d)['\-\s]+(\d{1,2})["']?$/);
  if (m) return `${m[1]}'-${m[2]}"`;
  const num = parseInt(str.replace(/\D/g, ''), 10);
  if (num >= 36 && num <= 96) {
    const ft = Math.floor(num / 12);
    const inches = num % 12;
    return `${ft}'-${String(inches).padStart(2, '0')}"`;
  }
  return "5'-10\"";
}

/**
 * Returns authentic Texas Class description for the back of the card
 */
function getTexasClassDescription(cls) {
  const c = String(cls || 'C').trim().toUpperCase();
  if (c === 'A') return 'CLASS: A-Comb veh w/ GVWR ≥ 26,001 lbs provided towed veh ≥ 10,001 lbs';
  if (c === 'B') return 'CLASS: B-Heavy straight vehicles w/ GVWR ≥ 26,001 lbs';
  if (c === 'M') return 'CLASS: M-Motorcycles and mopeds';
  return 'CLASS: C-Vehicles/passenger cars and light trucks w/ GVWR ≤ 26,000 lbs';
}

/**
 * Formats value for AAMVA element code
 */
function getValueForAamvaField(fieldKey, formData) {
  switch (fieldKey) {
    case 'DCS': return cleanAamvaText(formData.DCS || formData.lastName);
    case 'DAC': return cleanAamvaText(formData.DAC || formData.firstName);
    case 'DAD': return cleanAamvaText(formData.DAD || formData.middleName);
    case 'NAME_FIRST_MIDDLE': {
      const fn = cleanAamvaText(formData.DAC || formData.firstName);
      const mn = cleanAamvaText(formData.DAD || formData.middleName);
      return `${fn} ${mn}`.trim();
    }
    case 'NAME_FULL': {
      const parts = [
        formData.DAC || formData.firstName,
        formData.DAD || formData.middleName,
        formData.DCS || formData.lastName
      ].filter(Boolean);
      return cleanAamvaText(parts.join(' '));
    }
    case 'DBB':
    case 'DBB_GHOST':
      return formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob));
    case 'DBA':
      return formatDisplayDate(formatAamvaDate(formData.DBA || formData.expDate));
    case 'DBD':
      return formatDisplayDate(formatAamvaDate(formData.DBD || formData.issueDate));
    case 'DAQ':
      return cleanAamvaText(formData.DAQ || formData.licenseNumber);
    case 'DAG':
      return cleanAamvaText(formData.DAG || formData.address);
    case 'DAH':
      return cleanAamvaText(formData.DAH || formData.address2);
    case 'DAI':
      return cleanAamvaText(formData.DAI || formData.city);
    case 'DAJ':
      return cleanAamvaText(formData.DAJ || formData.state);
    case 'DAK':
      return cleanAamvaText(formData.DAK || formData.zip);
    case 'CITY_STATE_ZIP': {
      const c = cleanAamvaText(formData.DAI || formData.city);
      const s = cleanAamvaText(formData.DAJ || formData.state);
      const z = cleanAamvaText(formData.DAK || formData.zip);
      return `${c}, ${s} ${z}`.trim();
    }
    case 'DBC': {
      const s = String(formData.DBC || formData.sex || '1');
      return (s === '2' || s === 'F' || formData.sex === 'F') ? 'F' : 'M';
    }
    case 'DAU':
      return formatDisplayHeight(formData.DAU || formData.height);
    case 'DAW':
      return cleanAamvaText(formData.DAW || formData.weight);
    case 'DAY':
      return cleanAamvaText(formData.DAY || formData.eyes).slice(0, 3);
    case 'DAZ':
      return cleanAamvaText(formData.DAZ || formData.hair).slice(0, 3);
    case 'DCA':
      return cleanAamvaText(formData.DCA || formData.class || 'C');
    case 'DCB':
      return cleanAamvaText(formData.DCB || formData.restrictions || 'NONE');
    case 'DCD':
      return cleanAamvaText(formData.DCD || formData.endorsements || 'NONE');
    case 'DCF':
      return cleanAamvaText(formData.DCF || formData.discriminator);
    case 'DDA':
      return cleanAamvaText(formData.DDA || formData.complianceType);
    case 'DCA_DESC':
      return getTexasClassDescription(formData.DCA || formData.class);
    case 'DCB_BACK':
      return `REST: ${cleanAamvaText(formData.DCB || formData.restrictions || 'NONE')}`;
    case 'DCD_BACK':
      return `END: ${cleanAamvaText(formData.DCD || formData.endorsements || 'NONE')}`;
    case 'DBB_BACK':
      return `DOB: ${formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob))}`;
    default:
      return formData[fieldKey] !== undefined ? cleanAamvaText(formData[fieldKey]) : null;
  }
}

/**
 * Main rendering engine using Photopea
 */
async function renderWithPhotopea(psdInput, formData, options = {}) {
  const startTime = Date.now();
  console.log('[PhotopeaEngine] Initializing Photopea rendering pipeline...');

  // 1. Load PSD
  let psdRaw;
  if (Buffer.isBuffer(psdInput)) {
    psdRaw = psdInput;
  } else if (typeof psdInput === 'string' && fs.existsSync(psdInput)) {
    psdRaw = fs.readFileSync(psdInput);
  } else {
    throw new Error(`Invalid PSD input: ${psdInput}`);
  }

  const psd = readPsd(psdRaw, { skipCompositeImageData: false, skipLayerImageData: false });
  psd.bitsPerChannel = 8;

  const schema = options.schema || options.aiSchema || {};
  const assets = options.assets || {};

  // Front & Back groups (exclude SELECT BACKGROUND)
  const frontGroup = psd.children?.find(c => c.name.toLowerCase() === 'front')
    || psd.children?.find(c => c.name.toLowerCase().includes('front') && !c.name.toLowerCase().includes('select'));
  const backGroup = psd.children?.find(c => c.name.toLowerCase() === 'back')
    || psd.children?.find(c => c.name.toLowerCase().includes('back') && !c.name.toLowerCase().includes('select'));

  const hasBackSide = !!(backGroup || schema.hasFrontAndBack || (schema.sides && schema.sides.back));

  // 2. Prepare and place image layers (Portrait, Ghost, Signature, Barcode)
  // Portrait
  let userPhotoImg = null;
  const photoInput = assets.photo || options.photo || path.join(__dirname, '../assets/default_portrait.png');
  if (photoInput) {
    if (Buffer.isBuffer(photoInput)) userPhotoImg = await loadImage(photoInput);
    else if (typeof photoInput === 'string' && photoInput.startsWith('data:')) {
      const b64 = photoInput.replace(/^data:image\/\w+;base64,/, '');
      userPhotoImg = await loadImage(Buffer.from(b64, 'base64'));
    } else if (typeof photoInput === 'string' && fs.existsSync(photoInput)) {
      userPhotoImg = await loadImage(photoInput);
    }
  }

  // Signature
  let userSigImg = null;
  const sigInput = assets.signature || options.signature || path.join(__dirname, '../assets/default_signature.png');
  if (sigInput) {
    if (Buffer.isBuffer(sigInput)) userSigImg = await loadImage(sigInput);
    else if (typeof sigInput === 'string' && sigInput.startsWith('data:')) {
      const b64 = sigInput.replace(/^data:image\/\w+;base64,/, '');
      userSigImg = await loadImage(Buffer.from(b64, 'base64'));
    } else if (typeof sigInput === 'string' && fs.existsSync(sigInput)) {
      userSigImg = await loadImage(sigInput);
    }
  }

  // Place Portrait (Photo Big)
  const photoTargetName = schema.sides?.front?.photoPlacement?.layerName || 'Photo Big';
  const photoBigLayer = findLayerInPsd(frontGroup || psd, photoTargetName);
  if (photoBigLayer && userPhotoImg) {
    const w = (photoBigLayer.right || 0) - (photoBigLayer.left || 0);
    const h = (photoBigLayer.bottom || 0) - (photoBigLayer.top || 0);
    if (w > 0 && h > 0) {
      const pCanvas = createCanvas(w, h);
      const pCtx = pCanvas.getContext('2d');
      const scale = Math.max(w / userPhotoImg.width, h / userPhotoImg.height);
      const dw = userPhotoImg.width * scale;
      const dh = userPhotoImg.height * scale;
      pCtx.drawImage(userPhotoImg, (w - dw)/2, (h - dh)/2, dw, dh);
      photoBigLayer.canvas = pCanvas;
      photoBigLayer.opacity = 0.98; // Ensure rich, vivid portrait without background bleed
      console.log(`[PhotopeaEngine] Updated portrait layer: ${photoBigLayer.name} (${w}x${h})`);
    }
  }

  // Calibrate facial security overlay strength (reduce gray/washed haze while keeping security pattern)
  const photoGroup = findLayerInPsd(frontGroup || psd, 'Photo');
  if (photoGroup && photoGroup.children) {
    const photoOverlay = photoGroup.children.find(c => c.name.toLowerCase() === 'dont touch');
    if (photoOverlay) {
      photoOverlay.opacity = 0.22; // Reduced from 50% to 22% for clear, natural facial skin
      console.log('[PhotopeaEngine] Calibrated facial security pattern opacity to 22% (clear & natural face)');
    }
  }

  // Place Ghost Portrait (Photo Ghost)
  const ghostTargetName = schema.sides?.front?.ghostPlacement?.layerName || 'Photo Ghost';
  const photoGhostLayer = findLayerInPsd(frontGroup || psd, ghostTargetName);
  if (photoGhostLayer && userPhotoImg) {
    const w = (photoGhostLayer.right || 0) - (photoGhostLayer.left || 0);
    const h = (photoGhostLayer.bottom || 0) - (photoGhostLayer.top || 0);
    if (w > 0 && h > 0) {
      const gCanvas = createCanvas(w, h);
      const gCtx = gCanvas.getContext('2d');
      const scale = Math.max(w / userPhotoImg.width, h / userPhotoImg.height);
      const dw = userPhotoImg.width * scale;
      const dh = userPhotoImg.height * scale;
      gCtx.drawImage(userPhotoImg, (w - dw)/2, (h - dh)/2, dw, dh);

      // Clean, contrasted grayscale with solid alpha
      const imgData = gCtx.getImageData(0, 0, w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const avg = 0.299 * imgData.data[i] + 0.587 * imgData.data[i+1] + 0.114 * imgData.data[i+2];
        const contrasted = Math.max(0, Math.min(255, Math.round((avg - 128) * 1.25 + 128)));
        imgData.data[i] = contrasted;
        imgData.data[i+1] = contrasted;
        imgData.data[i+2] = contrasted;
        imgData.data[i+3] = 255;
      }
      gCtx.putImageData(imgData, 0, 0);
      photoGhostLayer.canvas = gCanvas;
      photoGhostLayer.opacity = 0.62; // 62% semi-transparent, cleanly visible
      console.log(`[PhotopeaEngine] Updated ghost portrait layer: ${photoGhostLayer.name} (${w}x${h})`);
    }
  }

  // Place Signature - accurately resolve visible pixel signature layer
  const sigTargetName = schema.sides?.front?.signaturePlacement?.layerName || 'Signature';
  const sigGroup = findLayerInPsd(frontGroup || psd, 'Signatue') || findLayerInPsd(frontGroup || psd, 'Signature');
  let sigLayer = null;
  if (sigGroup && sigGroup.children) {
    sigLayer = sigGroup.children.find(c => !c.hidden && !c.text && c.canvas)
            || sigGroup.children.find(c => !c.text && c.canvas)
            || sigGroup.children[sigGroup.children.length - 1];
  } else {
    sigLayer = findLayerInPsd(frontGroup || psd, sigTargetName);
  }

  if (sigLayer && userSigImg) {
    const w = (sigLayer.right || 0) - (sigLayer.left || 0);
    const h = (sigLayer.bottom || 0) - (sigLayer.top || 0);
    if (w > 0 && h > 0) {
      const sCanvas = createCanvas(w, h);
      const sCtx = sCanvas.getContext('2d');
      const scale = Math.min((w - 20) / userSigImg.width, (h - 20) / userSigImg.height);
      const dw = userSigImg.width * scale;
      const dh = userSigImg.height * scale;
      sCtx.drawImage(userSigImg, (w - dw)/2, (h - dh)/2, dw, dh);
      sigLayer.canvas = sCanvas;
      console.log(`[PhotopeaEngine] Updated signature layer: ${sigLayer.name} (${w}x${h})`);
    }
  }

  // Place AAMVA 2025 PDF417 Barcode
  const barcodePayload = generateAamvaBarcodePayload(formData);
  const barcodeTargetName = schema.sides?.back?.barcodePlacement?.layerName || 'PDF417_A1181102_202105110338';
  let barcodeLayer = findLayerInPsd(backGroup, barcodeTargetName)
    || findLayerInPsd(psd, barcodeTargetName);

  if (!barcodeLayer) {
    function findAnyBarcode(p) {
      if (!p || !p.children) return null;
      for (const c of p.children) {
        const lower = c.name.toLowerCase();
        if (lower.includes('pdf417') || (lower.includes('barcode') && !c.children)) return c;
        const f = findAnyBarcode(c);
        if (f) return f;
      }
      return null;
    }
    barcodeLayer = findAnyBarcode(backGroup) || findAnyBarcode(psd);
  }

  if (barcodeLayer) {
    const w = (barcodeLayer.right || 0) - (barcodeLayer.left || 0);
    const h = (barcodeLayer.bottom || 0) - (barcodeLayer.top || 0);
    if (w > 0 && h > 0) {
      const bPng = await bwipjs.toBuffer({
        bcid: 'pdf417',
        text: barcodePayload,
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
      barcodeLayer.canvas = bCanvas;
      console.log(`[PhotopeaEngine] Updated AAMVA PDF417 barcode: ${barcodeLayer.name} (${w}x${h})`);
    }
  }

  // Place Code 128 1D inventory barcode on the back
  const barcode1dLayer = findLayerInPsd(backGroup, 'code128') || findLayerInPsd(psd, 'code128');
  if (barcode1dLayer) {
    const w = (barcode1dLayer.right || 0) - (barcode1dLayer.left || 0);
    const h = (barcode1dLayer.bottom || 0) - (barcode1dLayer.top || 0);
    if (w > 0 && h > 0) {
      try {
        const code128Text = cleanAamvaText(formData.inventoryNumber || formData.DCF || '10000415244').slice(0, 11);
        const b1Png = await bwipjs.toBuffer({
          bcid: 'code128',
          text: code128Text,
          scale: 3,
          rotate: 'L',
          includetext: false
        });
        const b1Img = await loadImage(b1Png);
        const b1Canvas = createCanvas(w, h);
        const b1Ctx = b1Canvas.getContext('2d');
        b1Ctx.fillStyle = '#FFFFFF';
        b1Ctx.fillRect(0, 0, w, h);
        const scale = Math.min(w / b1Img.width, h / b1Img.height);
        const dw = b1Img.width * scale;
        const dh = b1Img.height * scale;
        b1Ctx.drawImage(b1Img, (w - dw)/2, (h - dh)/2, dw, dh);
        barcode1dLayer.canvas = b1Canvas;
        console.log(`[PhotopeaEngine] Updated Code 128 barcode: ${barcode1dLayer.name} (${w}x${h})`);
      } catch (e) {
        console.warn('[PhotopeaEngine] 1D Code 128 warning:', e.message);
      }
    }
  }

  // 3. Write pre-populated PSD buffer
  console.log('[PhotopeaEngine] Serializing pre-populated PSD for Photopea...');
  const preparedPsdBytes = Buffer.from(writePsd(psd, { generateThumbnail: true }));
  console.log(`[PhotopeaEngine] PSD ready: ${Math.round(preparedPsdBytes.length / 1024)} KB`);

  // 4. Build text operations list for Photopea ExtendScript
  const cleanName = (s) => {
    const str = String(s || '').trim();
    if (str.includes(' / ')) return str.split(' / ').pop().trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    return str;
  };
  const frontMappings = schema.sides?.front?.fieldMappings || {};
  const backMappings = schema.sides?.back?.fieldMappings || {};

  // Auto-populate official Texas AAMVA 2025 mappings if not already supplied
  const isTexasTemplate = (formData.DAJ || formData.state || 'TX').toUpperCase() === 'TX'
    || !!findLayerInPsd(frontGroup || psd, 'CARLISLE')
    || !!findLayerInPsd(frontGroup || psd, 'EDWARD CULLEN');

  if (Object.keys(frontMappings).length === 0 && isTexasTemplate) {
    console.log('[PhotopeaEngine] Using official Texas AAMVA 2025 field mappings.');
    const txMappings = {
      'DCS': 'CARLISLE',
      'NAME_FIRST_MIDDLE': 'EDWARD CULLEN',
      'DAQ': '85316244',
      'DBB': '09/21/1990',
      'DBA': '09/21/2026',
      'DBD': '07/11/2020',
      'DAG': '123 STREET CITY,tx 70000',
      'DCA': 'A',
      'DCB': 'NONE',
      'DCD': 'NONE копия',
      'DAU': "5'-10''",
      'DBC': 'M',
      'DAY': 'BRO',
      'DCF': '35838232126640572484',
      'DBB_GHOST': '09/21/1990'
    };
    for (const [code, lName] of Object.entries(txMappings)) {
      frontMappings[code] = { layerName: lName };
    }
  }

  if (Object.keys(backMappings).length === 0 && isTexasTemplate) {
    console.log('[PhotopeaEngine] Using official Texas Back field mappings.');
    const txBack = {
      'DCA_DESC': 'CLASS: A-Comb veh w/ GVWR ≥ 26,001 lbs provided towed veh ≥ 10,',
      'DCB_BACK': 'REST: NONE',
      'DCD_BACK': 'END: NONE',
      'DBB_BACK': 'DOB: 09/21/1990'
    };
    for (const [code, lName] of Object.entries(txBack)) {
      backMappings[code] = { layerName: lName };
    }
  }

  const frontTextOps = [];
  for (const [code, info] of Object.entries(frontMappings)) {
    const layerName = cleanName(typeof info === 'string' ? info : (info.layerName || info.name));
    let val = getValueForAamvaField(code, formData);
    if (val !== null && val !== undefined && layerName) {
      if (code === 'DAG') {
        const city = cleanAamvaText(formData.DAI || formData.city || 'AUSTIN');
        const state = cleanAamvaText(formData.DAJ || formData.state || 'TX');
        const zip = cleanAamvaText(formData.DAK || formData.zip || '78701').slice(0, 5);
        val = `${val}\r${city}, ${state} ${zip}`.trim();
      }
      frontTextOps.push({
        layerName,
        newText: String(val)
      });
    }
  }

  const backTextOps = [];
  for (const [code, info] of Object.entries(backMappings)) {
    const layerName = cleanName(typeof info === 'string' ? info : (info.layerName || info.name));
    let val = getValueForAamvaField(code, formData);
    if (val !== null && val !== undefined && layerName) {
      backTextOps.push({
        layerName,
        newText: String(val).replace(/"/g, '\\"').replace(/\n/g, '\\r')
      });
    }
  }

  // Auto-synchronize Back text layers with Front cardholder data
  if (backGroup && backGroup.children) {
    function syncBackGroup(p) {
      for (const l of p.children || []) {
        const lower = l.name.toLowerCase();
        if (l.text || (l.canvas && !l.children)) {
          if (lower.includes('dob:') || lower.startsWith('dob')) {
            backTextOps.push({
              layerName: l.name,
              newText: `DOB: ${formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob))}`
            });
          } else if (lower.includes('rest:') || lower.startsWith('rest')) {
            backTextOps.push({
              layerName: l.name,
              newText: `REST: ${cleanAamvaText(formData.DCB || formData.restrictions || 'NONE')}`
            });
          } else if (lower.includes('end:') || lower.startsWith('end')) {
            backTextOps.push({
              layerName: l.name,
              newText: `END: ${cleanAamvaText(formData.DCD || formData.endorsements || 'NONE')}`
            });
          } else if (lower.includes('class:') || lower.startsWith('class')) {
            backTextOps.push({
              layerName: l.name,
              newText: getTexasClassDescription(formData.DCA || formData.class)
            });
          } else if (lower === '10000415244') {
            const inv = cleanAamvaText(formData.inventoryNumber || formData.DCF || '10000415244').slice(0, 11);
            backTextOps.push({
              layerName: l.name,
              newText: inv
            });
          }
        }
        if (l.children) syncBackGroup(l);
      }
    }
    syncBackGroup(backGroup);
  }

  // 5. Launch hidden Photopea instance in headless Chrome
  const ppConfig = { environment: { theme: 2, vmode: 2 } };
  const ppUrl = 'https://www.photopea.com#' + encodeURIComponent(JSON.stringify(ppConfig));

  const bridgeHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Photopea Native Renderer</title>
  <script>
    window.isReady = false;
    window.addEventListener('message', function(e) {
      if (e.data === 'done') window.isReady = true;
    });
  </script>
</head>
<body>
  <iframe id="pp" src="${ppUrl}" style="width:1200px; height:900px; border:none;"></iframe>
</body>
</html>`;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(bridgeHtml);
  });

  await new Promise(res => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;

  const executablePath = findBrowserExecutable();
  console.log(`[PhotopeaEngine] Launching browser engine: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('[ChromePage]', msg.text()));
    await page.goto(`http://127.0.0.1:${port}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
    console.log('[PhotopeaEngine] Waiting for Photopea initialization...');
    try {
      await page.waitForFunction(() => window.isReady === true, { timeout: 60000 });
    } catch (e) {
      console.log('[PhotopeaEngine] Handshake ping fallback...');
      await page.evaluate(() => new Promise((resolve) => {
        const iframe = document.getElementById('pp');
        const h = (ev) => {
          if (ev.data === 'done') {
            window.removeEventListener('message', h);
            resolve();
          }
        };
        window.addEventListener('message', h);
        iframe.contentWindow.postMessage('app.echo("ready");', '*');
        setTimeout(resolve, 8000);
      }));
    }
    console.log('[PhotopeaEngine] Photopea ready!');

    // 6. Send PSD buffer to Photopea (atomic listener + postMessage)
    console.log('[PhotopeaEngine] Sending PSD buffer to Photopea...');
    await page.evaluate((base64) => {
      return new Promise((res, rej) => {
        const timer = setTimeout(() => rej(new Error('Timeout opening PSD in Photopea')), 90000);
        const h = (e) => {
          if (e.data === 'done') {
            window.removeEventListener('message', h);
            clearTimeout(timer);
            res();
          }
        };
        window.addEventListener('message', h);

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        document.getElementById('pp').contentWindow.postMessage(bytes.buffer, '*');
      });
    }, preparedPsdBytes.toString('base64'));
    console.log('[PhotopeaEngine] PSD opened in Photopea successfully!');

    // 7. Render Front PNG
    console.log('[PhotopeaEngine] Updating typography and rendering Front PNG...');
    const frontScript = `
      (function() {
        var doc = app.activeDocument;

        function find(p, n) {
          if (!p || !p.layers) return null;
          var lower = String(n).toLowerCase();
          if (lower.indexOf(' / ') !== -1) lower = lower.split(' / ').pop();
          lower = lower.replace(/^\\s+|\\s+$/g, '');
          for (var i = 0; i < p.layers.length; i++) {
            if (p.layers[i].name.toLowerCase() === lower) return p.layers[i];
            if (p.layers[i].typename === "LayerSet" || (p.layers[i].layers && p.layers[i].layers.length > 0)) {
              var f = find(p.layers[i], n);
              if (f) return f;
            }
          }
          return null;
        }

        var front = find(doc, "Front");
        var back = find(doc, "Back");
        if (back) back.visible = false;
        if (front) front.visible = true;

        var fBorder = find(front || doc, "border");
        if (fBorder) fBorder.visible = false;

        // Calibrate Photo Opacity and Facial Security Pattern
        try {
          var photoGroup = find(front || doc, "Photo");
          if (photoGroup) {
            var photoOverlay = find(photoGroup, "Dont touch");
            if (photoOverlay) { try { photoOverlay.opacity = 22; } catch(e) {} }
            var photoBig = find(photoGroup, "Photo Big");
            if (photoBig) { try { photoBig.opacity = 98; photoBig.visible = true; } catch(e) {} }
            var photoGhost = find(photoGroup, "Photo Ghost");
            if (photoGhost) { try { photoGhost.opacity = 62; photoGhost.visible = true; } catch(e) {} }
          }
        } catch(e) {}

        // Update front text layers
        var dataGroup = find(front || doc, "Data") || front || doc;

        function setT(n, val) {
          if (!dataGroup || val === null || val === undefined) return;
          var l = find(dataGroup, n);
          if (l) {
            try {
              if (typeof LayerKind !== 'undefined' && l.kind == LayerKind.TEXT) {
                l.textItem.contents = val;
              } else if (l.kind == 2 || l.textItem) {
                l.textItem.contents = val;
              }
            } catch(e) {}
          }
        }

        // 1. From frontTextOps
        var ops = ${JSON.stringify(frontTextOps)};
        for (var j = 0; j < ops.length; j++) {
          setT(ops[j].layerName, ops[j].newText);
        }

        // 2. Direct named layers in Texas Data group
        var lastNameVal = ${JSON.stringify(cleanAamvaText(formData.DCS || formData.lastName || ''))};
        var firstNameVal = ${JSON.stringify(cleanAamvaText(formData.DAC || formData.firstName || ''))};
        var middleNameVal = ${JSON.stringify(cleanAamvaText(formData.DAD || formData.middleName || ''))};
        var firstMiddleVal = (firstNameVal + ' ' + middleNameVal).replace(/^\\s+|\\s+$/g, '');
        var dlNumVal = ${JSON.stringify(cleanAamvaText(formData.DAQ || formData.licenseNumber || ''))};
        var classVal = ${JSON.stringify(cleanAamvaText(formData.DCA || formData.class || 'C'))};
        var expVal = ${JSON.stringify(formatDisplayDate(formatAamvaDate(formData.DBA || formData.expDate)))};
        var issVal = ${JSON.stringify(formatDisplayDate(formatAamvaDate(formData.DBD || formData.issueDate)))};
        var dobVal = ${JSON.stringify(formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob)))};
        var addrVal = ${JSON.stringify(cleanAamvaText(formData.DAG || formData.address || ''))};
        var cityVal = ${JSON.stringify(cleanAamvaText(formData.DAI || formData.city || 'AUSTIN'))};
        var stVal = ${JSON.stringify(cleanAamvaText(formData.DAJ || formData.state || 'TX'))};
        var zipVal = ${JSON.stringify(cleanAamvaText(formData.DAK || formData.zip || '78701').slice(0, 5))};
        var fullAddrVal = addrVal + "\\r" + cityVal + ", " + stVal + " " + zipVal;
        var restVal = ${JSON.stringify(cleanAamvaText(formData.DCB || formData.restrictions || 'NONE'))};
        var endVal = ${JSON.stringify(cleanAamvaText(formData.DCD || formData.endorsements || 'NONE'))};
        var hgtVal = ${JSON.stringify(formatDisplayHeight(formData.DAU || formData.height))};
        var rawSex = ${JSON.stringify(String(formData.DBC || formData.sex || '1'))};
        var sexVal = (rawSex === '2' || rawSex === 'F') ? 'F' : 'M';
        var eyeVal = ${JSON.stringify(cleanAamvaText(formData.DAY || formData.eyes || 'BRO').slice(0, 3))};
        var ddVal = ${JSON.stringify(cleanAamvaText(formData.DCF || formData.discriminator || '35838232126640572484'))};

        if (lastNameVal) setT("CARLISLE", lastNameVal);
        if (firstMiddleVal) setT("EDWARD CULLEN", firstMiddleVal);
        if (dlNumVal) setT("85316244", dlNumVal);
        if (classVal) setT("A", classVal);
        if (expVal) setT("09/21/2026", expVal);
        if (issVal) setT("07/11/2020", issVal);
        if (addrVal) setT("123 STREET CITY,tx 70000", fullAddrVal);
        if (restVal) setT("NONE", restVal);
        if (endVal) setT("NONE копия", endVal);
        if (hgtVal) setT("5'-10''", hgtVal);
        if (sexVal) setT("M", sexVal);
        if (eyeVal) setT("BRO", eyeVal);
        if (ddVal) setT("35838232126640572484", ddVal);

        // Synchronize all DOB layers (both main DOB and ghost DOB named '09/21/1990')
        if (dobVal && dataGroup && dataGroup.layers) {
          for (var k = 0; k < dataGroup.layers.length; k++) {
            var dl = dataGroup.layers[k];
            if (dl.name === "09/21/1990") {
              try {
                if (typeof LayerKind !== 'undefined' && dl.kind == LayerKind.TEXT) {
                  dl.textItem.contents = dobVal;
                } else if (dl.kind == 2 || dl.textItem) {
                  dl.textItem.contents = dobVal;
                }
              } catch(e) {}
            }
          }
        }

        // Ensure border remains hidden
        if (fBorder) fBorder.visible = false;
        doc.saveToOE("png");
      })();
    `;

    const frontPngBase64 = await page.evaluate((script) => {
      return new Promise((resolve, reject) => {
        const iframe = document.getElementById('pp');
        let buf = null;
        const handler = (e) => {
          if (e.data instanceof ArrayBuffer) {
            buf = e.data;
          } else if (e.data === 'done' && buf) {
            window.removeEventListener('message', handler);
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            resolve(btoa(binary));
          }
        };
        window.addEventListener('message', handler);
        iframe.contentWindow.postMessage(script, '*');
        setTimeout(() => {
          if (buf) {
            window.removeEventListener('message', handler);
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            resolve(btoa(binary));
          } else {
            reject(new Error('Timeout exporting Front PNG'));
          }
        }, 50000);
      });
    }, frontScript);

    const frontPngBuffer = Buffer.from(frontPngBase64, 'base64');
    console.log(`[PhotopeaEngine] Front PNG rendered: ${Math.round(frontPngBuffer.length / 1024)} KB`);

    // 8. Render Back PNG (if template has back side)
    let backPngBuffer = null;
    if (hasBackSide) {
      console.log('[PhotopeaEngine] Updating Back typography and rendering Back PNG...');
      const backScript = `
        (function() {
          var doc = app.activeDocument;

          function find(p, n) {
            if (!p || !p.layers) return null;
            var lower = String(n).toLowerCase();
            if (lower.indexOf(' / ') !== -1) lower = lower.split(' / ').pop();
            lower = lower.replace(/^\\s+|\\s+$/g, '');
            for (var i = 0; i < p.layers.length; i++) {
              if (p.layers[i].name.toLowerCase() === lower) return p.layers[i];
              if (p.layers[i].typename === "LayerSet" || (p.layers[i].layers && p.layers[i].layers.length > 0)) {
                var f = find(p.layers[i], n);
                if (f) return f;
              }
            }
            return null;
          }

          var front = find(doc, "Front");
          var back = find(doc, "Back");
          if (front) front.visible = false;
          if (back) back.visible = true;

          var bBorder = find(back || doc, "border");
          if (bBorder) bBorder.visible = false;

          var bDataGroup = find(back || doc, "Data") || back || doc;

          function setBT(n, val) {
            if (!bDataGroup || val === null || val === undefined) return;
            var l = find(bDataGroup, n);
            if (l) {
              try {
                if (typeof LayerKind !== 'undefined' && l.kind == LayerKind.TEXT) {
                  l.textItem.contents = val;
                } else if (l.kind == 2 || l.textItem) {
                  l.textItem.contents = val;
                }
              } catch(e) {}
            }
          }

          // Update back text layers from bOps
          var bOps = ${JSON.stringify(backTextOps)};
          for (var k = 0; k < bOps.length; k++) {
            setBT(bOps[k].layerName, bOps[k].newText);
          }

          // Direct Back Data layers synchronization
          if (bDataGroup && bDataGroup.layers) {
            var classDesc = ${JSON.stringify(getTexasClassDescription(formData.DCA || formData.class))};
            var restText = "REST: " + ${JSON.stringify(cleanAamvaText(formData.DCB || formData.restrictions || 'NONE'))};
            var endText = "END: " + ${JSON.stringify(cleanAamvaText(formData.DCD || formData.endorsements || 'NONE'))};
            var dobText = "DOB: " + ${JSON.stringify(formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob)))};
            var invText = ${JSON.stringify(cleanAamvaText(formData.inventoryNumber || formData.DCF || '10000415244').slice(0, 11))};

            for (var m = 0; m < bDataGroup.layers.length; m++) {
              var bLayer = bDataGroup.layers[m];
              var bln = bLayer.name.toLowerCase();
              try {
                if (bln.indexOf('class:') === 0 || bln.indexOf('class') === 0) {
                  bLayer.textItem.contents = classDesc;
                } else if (bln.indexOf('rest:') === 0 || bln.indexOf('rest') === 0) {
                  bLayer.textItem.contents = restText;
                } else if (bln.indexOf('end:') === 0 || bln.indexOf('end') === 0) {
                  bLayer.textItem.contents = endText;
                } else if (bln.indexOf('dob:') === 0 || bln.indexOf('dob') === 0) {
                  bLayer.textItem.contents = dobText;
                } else if (bln === '10000415244' || bln.indexOf('10000') === 0) {
                  bLayer.textItem.contents = invText;
                }
              } catch(e) {}
            }
          }

          if (bBorder) bBorder.visible = false;
          doc.saveToOE("png");
        })();
      `;

      const backPngBase64 = await page.evaluate((script) => {
        return new Promise((resolve, reject) => {
          const iframe = document.getElementById('pp');
          let buf = null;
          const handler = (e) => {
            if (e.data instanceof ArrayBuffer) {
              buf = e.data;
            } else if (e.data === 'done' && buf) {
              window.removeEventListener('message', handler);
              const bytes = new Uint8Array(buf);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              resolve(btoa(binary));
            }
          };
          window.addEventListener('message', handler);
          iframe.contentWindow.postMessage(script, '*');
          setTimeout(() => {
            if (buf) {
              window.removeEventListener('message', handler);
              const bytes = new Uint8Array(buf);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              resolve(btoa(binary));
            } else {
              reject(new Error('Timeout exporting Back PNG'));
            }
          }, 50000);
        });
      }, backScript);

      backPngBuffer = Buffer.from(backPngBase64, 'base64');
      console.log(`[PhotopeaEngine] Back PNG rendered: ${Math.round(backPngBuffer.length / 1024)} KB`);
    }

    // 9. Export Full Editable PSD
    console.log('[PhotopeaEngine] Exporting complete multi-layer editable PSD...');
    const psdScript = `
      (function() {
        var doc = app.activeDocument;
        function find(p, n) {
          if (!p || !p.layers) return null;
          var leaf = String(n).split('/').pop().replace(/^\\s+|\\s+$/g, '').toLowerCase();
          for (var i = 0; i < p.layers.length; i++) {
            if (p.layers[i].name.toLowerCase() === leaf) return p.layers[i];
            if (p.layers[i].typename === "LayerSet" || (p.layers[i].layers && p.layers[i].layers.length > 0)) {
              var f = find(p.layers[i], n);
              if (f) return f;
            }
          }
          return null;
        }
        var front = find(doc, "Front");
        var back = find(doc, "Back");
        if (front) front.visible = true;
        if (back) back.visible = false;
        var fb = find(front || doc, "border");
        if (fb) fb.visible = false;
        var bb = find(back || doc, "border");
        if (bb) bb.visible = false;
        doc.saveToOE("psd");
      })();
    `;

    const psdBase64 = await page.evaluate((script) => {
      return new Promise((resolve, reject) => {
        const iframe = document.getElementById('pp');
        let buf = null;
        const handler = (e) => {
          if (e.data instanceof ArrayBuffer) {
            buf = e.data;
          } else if (e.data === 'done' && buf) {
            window.removeEventListener('message', handler);
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            resolve(btoa(binary));
          }
        };
        window.addEventListener('message', handler);
        iframe.contentWindow.postMessage(script, '*');
        setTimeout(() => reject(new Error('Timeout exporting PSD')), 45000);
      });
    }, psdScript);

    const outPsdBuffer = Buffer.from(psdBase64, 'base64');
    console.log(`[PhotopeaEngine] Complete PSD exported: ${Math.round(outPsdBuffer.length / 1024)} KB`);

    // 10. Generate ISO CR80 Print-Ready PDF
    console.log('[PhotopeaEngine] Generating ISO/IEC 7810 CR80 Print-Ready PDF...');
    const pdfDoc = await PDFDocument.create();
    const cr80WidthPt = 242.64; // 85.6 mm
    const cr80HeightPt = 153.00; // 53.98 mm

    const page1 = pdfDoc.addPage([cr80WidthPt, cr80HeightPt]);
    const embFront = await pdfDoc.embedPng(frontPngBuffer);
    page1.drawImage(embFront, { x: 0, y: 0, width: cr80WidthPt, height: cr80HeightPt });

    if (backPngBuffer) {
      const page2 = pdfDoc.addPage([cr80WidthPt, cr80HeightPt]);
      const embBack = await pdfDoc.embedPng(backPngBuffer);
      page2.drawImage(embBack, { x: 0, y: 0, width: cr80WidthPt, height: cr80HeightPt });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log(`[PhotopeaEngine] Print-Ready PDF generated: ${Math.round(pdfBuffer.length / 1024)} KB`);

    const duration = Date.now() - startTime;
    console.log(`[PhotopeaEngine] All operations completed in ${duration}ms!`);

    return {
      success: true,
      psdBuffer: outPsdBuffer,
      pngBuffer: frontPngBuffer,
      frontPngBuffer,
      backPngBuffer,
      pdfBuffer,
      barcodePayload,
      width: psd.width,
      height: psd.height,
      duration
    };
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = {
  renderWithPhotopea
};
