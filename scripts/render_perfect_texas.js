/**
 * High-Fidelity Texas DL Card Generator (Front & Back)
 * Uses the AI-analyzed schema with real portrait photo, real signature,
 * AAMVA 2025 PDF417 barcode, and precise typography.
 */

const { readPsd, writePsd, initializeCanvas } = require('ag-psd');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const { PRESET_PROFILES, generateAamvaBarcodePayload, decodeAamvaBarcode } = require('../src/aamva-standard');

async function generatePerfectTexasCards() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  console.log('Reading PSD:', psdPath);
  const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });

  // 1. Normalize bit depth to 8-bit to ensure safe writing
  psd.bitsPerChannel = 8;

  // Data Profile (Texas CDL)
  const profile = PRESET_PROFILES.texas_cdl.data;
  console.log(`Processing card for: ${profile.DAC} ${profile.DAD} ${profile.DCS}`);

  // Load real portrait photo and transparent signature from Downloads
  const photoPath = 'C:/Users/Vintech Systems/Downloads/6a59f2d7e1e70_download-removebg-preview.png';
  const sigPath = 'C:/Users/Vintech Systems/Downloads/signature (1).png';

  const userPhotoImg = await loadImage(photoPath);
  const userSigImg = await loadImage(sigPath);
  console.log(`Loaded Photo: ${userPhotoImg.width}x${userPhotoImg.height}`);
  console.log(`Loaded Signature: ${userSigImg.width}x${userSigImg.height}`);

  // Find Front and Back groups
  const frontGroup = psd.children.find(c => c.name === 'Front');
  const backGroup = psd.children.find(c => c.name === 'Back');
  const bgGroup = psd.children.find(c => c.name === 'SELECT BACKGROUND');

  // ==========================================
  // PART A: PROCESS FRONT CARD
  // ==========================================
  console.log('\n--- Processing Front Card ---');
  frontGroup.visible = true;
  frontGroup.hidden = false;
  if (backGroup) {
    backGroup.visible = false;
    backGroup.hidden = true;
  }

  // 1. Photo Placement (Photo Big)
  const photoGroup = frontGroup.children.find(c => c.name === 'Photo');
  const photoBig = photoGroup.children[0].children.find(c => c.name === 'Photo Big');
  const photoGhost = photoGroup.children[0].children.find(c => c.name === 'Photo Ghost');

  const pWidth = photoBig.right - photoBig.left;
  const pHeight = photoBig.bottom - photoBig.top;
  const pCanvas = createCanvas(pWidth, pHeight);
  const pCtx = pCanvas.getContext('2d');

  // Clean neutral background
  pCtx.fillStyle = '#f8fafc';
  pCtx.fillRect(0, 0, pWidth, pHeight);

  // Aspect-fit portrait
  const pScale = Math.max(pWidth / userPhotoImg.width, pHeight / userPhotoImg.height);
  const pDrawW = userPhotoImg.width * pScale;
  const pDrawH = userPhotoImg.height * pScale;
  const pX = (pWidth - pDrawW) / 2;
  const pY = (pHeight - pDrawH) / 2;
  pCtx.drawImage(userPhotoImg, pX, pY, pDrawW, pDrawH);
  photoBig.canvas = pCanvas;
  console.log(`  ✓ Primary Portrait placed in Photo Big: ${pWidth}x${pHeight}`);

  // 2. Ghost Portrait Placement
  if (photoGhost) {
    const gWidth = photoGhost.right - photoGhost.left;
    const gHeight = photoGhost.bottom - photoGhost.top;
    const gCanvas = createCanvas(gWidth, gHeight);
    const gCtx = gCanvas.getContext('2d');

    // Draw portrait
    const gScale = Math.max(gWidth / userPhotoImg.width, gHeight / userPhotoImg.height);
    const gDrawW = userPhotoImg.width * gScale;
    const gDrawH = userPhotoImg.height * gScale;
    const gX = (gWidth - gDrawW) / 2;
    const gY = (gHeight - gDrawH) / 2;
    gCtx.drawImage(userPhotoImg, gX, gY, gDrawW, gDrawH);

    // Convert to high-key semi-transparent grayscale ghost
    const imgData = gCtx.getImageData(0, 0, gWidth, gHeight);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // High-key contrast boost
      const highKey = Math.min(255, Math.round(avg * 1.15));
      data[i] = highKey;
      data[i + 1] = highKey;
      data[i + 2] = highKey;
      // Semi-transparent alpha (35%)
      data[i + 3] = Math.round(data[i + 3] * 0.38);
    }
    gCtx.putImageData(imgData, 0, 0);
    photoGhost.canvas = gCanvas;
    console.log(`  ✓ Ghost Portrait placed: ${gWidth}x${gHeight}`);
  }

  // 3. Signature Placement
  const sigGroup = frontGroup.children.find(c => c.name === 'Signatue');
  // Find visible pixel layer (which previously held "Edward Cullen")
  const visibleSigLayer = sigGroup.children.find(c => (c.visible !== false) && !c.hidden && c.canvas && !c.text);
  if (visibleSigLayer) {
    const sWidth = visibleSigLayer.right - visibleSigLayer.left;
    const sHeight = visibleSigLayer.bottom - visibleSigLayer.top;
    const sCanvas = createCanvas(sWidth, sHeight);
    const sCtx = sCanvas.getContext('2d');

    // Fit transparent signature image
    const sScale = Math.min((sWidth - 20) / userSigImg.width, (sHeight - 20) / userSigImg.height);
    const sDrawW = userSigImg.width * sScale;
    const sDrawH = userSigImg.height * sScale;
    const sX = (sWidth - sDrawW) / 2;
    const sY = (sHeight - sDrawH) / 2;
    sCtx.drawImage(userSigImg, sX, sY, sDrawW, sDrawH);

    visibleSigLayer.canvas = sCanvas;
    console.log(`  ✓ Signature placed in visible layer: ${sWidth}x${sHeight}`);
  }

  // 4. Text Layers Placement in Front / Data
  const dataGroup = frontGroup.children.find(c => c.name === 'Data');

  function renderDataText(layer, newText) {
    const width = Math.max(1, (layer.right || 0) - (layer.left || 0));
    const height = Math.max(1, (layer.bottom || 0) - (layer.top || 0));
    const tCanvas = createCanvas(width, height);
    const tCtx = tCanvas.getContext('2d');

    const style = layer.text?.style || {};
    let fontSize = style.fontSize || Math.round(height * 0.75);
    const fontName = style.font?.name || 'Arial-BoldMT';
    const isBold = /bold/i.test(fontName);

    tCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;

    // Auto-fit calculation
    let textWidth = tCtx.measureText(newText).width;
    if (textWidth > width && width > 30) {
      const scale = width / textWidth;
      fontSize = Math.max(12, Math.floor(fontSize * scale * 0.96));
      tCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
    }

    const fc = style.fillColor || { r: 0, g: 0, b: 0 };
    tCtx.fillStyle = `rgb(${Math.round(fc.r)}, ${Math.round(fc.g)}, ${Math.round(fc.b)})`;
    tCtx.textBaseline = 'middle';
    tCtx.textAlign = 'left';

    if (newText.includes('\n') || newText.includes('\r')) {
      const lines = newText.split(/\r\n|\r|\n/);
      const lineHeight = fontSize * 1.18;
      const startY = (height - (lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, idx) => {
        tCtx.fillText(line, 0, startY + idx * lineHeight);
      });
    } else {
      tCtx.fillText(newText, 0, height / 2);
    }

    layer.text.text = newText;
    layer.canvas = tCanvas;
  }

  for (const layer of dataGroup.children) {
    if (!layer.text) continue;
    switch (layer.name) {
      case 'CARLISLE':
        renderDataText(layer, profile.DCS);
        break;
      case 'EDWARD CULLEN':
        renderDataText(layer, `${profile.DAC} ${profile.DAD}`);
        break;
      case '85316244':
        renderDataText(layer, profile.DAQ);
        break;
      case '09/21/1990':
        // Primary DOB or Ghost DOB
        renderDataText(layer, '04/12/1984');
        break;
      case '09/21/2026':
        renderDataText(layer, '04/12/2030');
        break;
      case '07/11/2020':
        renderDataText(layer, '04/12/2025');
        break;
      case '123 STREET CITY,tx 70000':
        renderDataText(layer, `${profile.DAG}\r${profile.DAI}, ${profile.DAJ} ${profile.DAK.slice(0, 5)}`);
        break;
      case 'A':
        renderDataText(layer, profile.DCA);
        break;
      case 'NONE':
        renderDataText(layer, profile.DCB);
        break;
      case 'NONE копия':
        renderDataText(layer, profile.DCD);
        break;
      case '5\'-10\'\'':
        renderDataText(layer, '5\'-11\'\'');
        break;
      case 'M':
        renderDataText(layer, 'M');
        break;
      case 'BRO':
        renderDataText(layer, profile.DAY);
        break;
      case '35838232126640572484':
        renderDataText(layer, profile.DCF);
        break;
    }
  }
  console.log('  ✓ All Front text layers updated with original typography & auto-fit');

  // Compositor Function
  function renderComposite(activeGroup) {
    const compCanvas = createCanvas(psd.width, psd.height);
    const ctx = compCanvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, psd.width, psd.height);

    function walkLayer(l) {
      const isVisible = (l.visible !== false) && !l.hidden;
      if (!isVisible) return;
      if (l.children && l.children.length) {
        for (const child of l.children) walkLayer(child);
        return;
      }
      if (l.fillOpacity === 0) return;

      ctx.save();
      if (l.opacity !== undefined) ctx.globalAlpha = l.opacity;
      if (l.blendMode && l.blendMode !== 'normal') {
        const blendMap = {
          'multiply': 'multiply',
          'screen': 'screen',
          'overlay': 'overlay',
          'darken': 'darken',
          'lighten': 'lighten'
        };
        if (blendMap[l.blendMode]) ctx.globalCompositeOperation = blendMap[l.blendMode];
      }
      if (l.canvas) {
        ctx.drawImage(l.canvas, l.left || 0, l.top || 0);
      }
      ctx.restore();
    }

    if (bgGroup) walkLayer(bgGroup);
    walkLayer(activeGroup);
    return compCanvas;
  }

  // Render & Save Front Card
  const frontCanvas = renderComposite(frontGroup);
  const frontPngPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template (Front&Back)_Filled.png';
  fs.writeFileSync(frontPngPath, frontCanvas.toBuffer('image/png'));
  console.log(`\n>>> Successfully generated Front PNG: ${frontPngPath} (${Math.round(fs.statSync(frontPngPath).size / 1024)} KB)`);

  // ==========================================
  // PART B: PROCESS BACK CARD (ZONE V BARCODE)
  // ==========================================
  console.log('\n--- Processing Back Card (Zone V Barcode) ---');
  frontGroup.visible = false;
  frontGroup.hidden = true;
  backGroup.visible = true;
  backGroup.hidden = false;

  const barcodePayload = generateAamvaBarcodePayload(profile);
  console.log(`  Payload bytes: ${barcodePayload.length}`);

  const barcodeGroup = backGroup.children.find(c => c.name === 'Barcode');
  const pdf417Layer = barcodeGroup.children.find(c => c.name.includes('PDF417'));
  const bWidth = pdf417Layer.right - pdf417Layer.left;
  const bHeight = pdf417Layer.bottom - pdf417Layer.top;

  const bPngBuf = await bwipjs.toBuffer({
    bcid: 'pdf417',
    text: barcodePayload,
    scale: 3,
    eclevel: 5,
    columns: 14,
    width: Math.round(bWidth / 4),
    height: Math.round(bHeight / 4)
  });

  const bImg = await loadImage(bPngBuf);
  const bCanvas = createCanvas(bWidth, bHeight);
  const bCtx = bCanvas.getContext('2d');
  bCtx.fillStyle = '#FFFFFF';
  bCtx.fillRect(0, 0, bWidth, bHeight);

  const bScale = Math.min((bWidth - 10) / bImg.width, (bHeight - 10) / bImg.height);
  const bw = bImg.width * bScale;
  const bh = bImg.height * bScale;
  bCtx.drawImage(bImg, (bWidth - bw) / 2, (bHeight - bh) / 2, bw, bh);
  pdf417Layer.canvas = bCanvas;
  console.log(`  ✓ Zone V PDF417 barcode placed: ${bWidth}x${bHeight}`);

  // Update back data
  const backDataGroup = backGroup.children.find(c => c.name === 'Data');
  if (backDataGroup) {
    for (const l of backDataGroup.children) {
      if (!l.text) continue;
      if (l.name.includes('REST:')) renderDataText(l, `REST: ${profile.DCB}`);
      if (l.name.includes('END:')) renderDataText(l, `END: ${profile.DCD}`);
      if (l.name.includes('DOB:')) renderDataText(l, `DOB: 04/12/1984`);
    }
  }

  // Render & Save Back Card
  const backCanvas = renderComposite(backGroup);
  const backPngPath = 'C:/Users/Vintech Systems/psd-test/Texas_Back_Filled.png';
  fs.writeFileSync(backPngPath, backCanvas.toBuffer('image/png'));
  console.log(`>>> Successfully generated Back PNG: ${backPngPath} (${Math.round(fs.statSync(backPngPath).size / 1024)} KB)`);

  // ==========================================
  // PART C: SAVE MULTI-LAYER EDITABLE PSD
  // ==========================================
  // Make Front visible and Back hidden for standard default state in Photoshop
  frontGroup.visible = true;
  frontGroup.hidden = false;
  backGroup.visible = false;
  backGroup.hidden = true;
  psd.canvas = frontCanvas;

  const frontPsdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template (Front&Back)_Filled.psd';
  const psdBuf = Buffer.from(writePsd(psd, { generateThumbnail: true }));
  fs.writeFileSync(frontPsdPath, psdBuf);
  console.log(`>>> Successfully generated Editable PSD: ${frontPsdPath} (${Math.round(psdBuf.length / 1024)} KB)`);

  console.log('\n================================================================');
  console.log(' ALL CARDS RE-GENERATED WITH HIGH FIDELITY!');
  console.log('================================================================');
}

generatePerfectTexasCards().catch(console.error);
