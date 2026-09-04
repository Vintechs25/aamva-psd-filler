const { readPsd, writePsd, initializeCanvas } = require('ag-psd');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');
const bwipjs = require('bwip-js');
const { PRESET_PROFILES, generateAamvaBarcodePayload, decodeAamvaBarcode } = require('../src/aamva-standard');

async function testTexasBack() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  console.log('Loading Texas PSD for BACK processing:', psdPath);
  const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });

  const profile = PRESET_PROFILES.texas_cdl.data;
  console.log('Generating AAMVA 2025 PDF417 barcode for Texas CDL...');
  const barcodePayload = generateAamvaBarcodePayload(profile);
  console.log('Payload length:', barcodePayload.length);
  console.log('Decoded summary:', decodeAamvaBarcode(barcodePayload).elements);

  // Find Back group
  const backGroup = psd.children.find(c => c.name === 'Back');
  if (!backGroup) throw new Error('Back group not found');

  // Make Back visible, hide Front
  backGroup.visible = true;
  backGroup.hidden = false;

  const frontGroup = psd.children.find(c => c.name === 'Front');
  if (frontGroup) {
    frontGroup.visible = false;
    frontGroup.hidden = true;
  }

  // Find Barcode layer in Back / Barcode
  const barcodeGroup = backGroup.children.find(c => c.name === 'Barcode');
  const pdf417Layer = barcodeGroup.children.find(c => c.name.includes('PDF417'));
  console.log('Found PDF417 layer:', pdf417Layer.name, 'bounds:', pdf417Layer.left, pdf417Layer.top, pdf417Layer.right, pdf417Layer.bottom);

  const bWidth = pdf417Layer.right - pdf417Layer.left;
  const bHeight = pdf417Layer.bottom - pdf417Layer.top;

  // Generate high-resolution PDF417
  const pngBuf = await bwipjs.toBuffer({
    bcid: 'pdf417',
    text: barcodePayload,
    scale: 3,
    eclevel: 5,
    columns: 14,
    width: Math.round(bWidth / 4),
    height: Math.round(bHeight / 4)
  });

  const bImg = await loadImage(pngBuf);
  const bCanvas = createCanvas(bWidth, bHeight);
  const bCtx = bCanvas.getContext('2d');
  bCtx.fillStyle = '#FFFFFF';
  bCtx.fillRect(0, 0, bWidth, bHeight);

  // Scale and center barcode
  const scale = Math.min((bWidth - 10) / bImg.width, (bHeight - 10) / bImg.height);
  const w = bImg.width * scale;
  const h = bImg.height * scale;
  bCtx.drawImage(bImg, (bWidth - w) / 2, (bHeight - h) / 2, w, h);

  pdf417Layer.canvas = bCanvas;
  console.log('Replaced PDF417 layer canvas with AAMVA 2025 barcode');

  // Update Data in Back / Data
  const backDataGroup = backGroup.children.find(c => c.name === 'Data');
  if (backDataGroup) {
    for (const l of backDataGroup.children) {
      if (!l.text) continue;
      if (l.name.includes('REST:')) {
        l.text.text = `REST: ${profile.DCB}`;
      } else if (l.name.includes('END:')) {
        l.text.text = `END: ${profile.DCD}`;
      } else if (l.name.includes('DOB:')) {
        l.text.text = `DOB: 04/12/1984`;
      } else if (l.name.includes('CLASS:')) {
        l.text.text = `CLASS: A-Comb veh w/ GVWR ≥ 26,001 lbs`;
      }
    }
  }

  // Render Back Composite
  const compCanvas = createCanvas(psd.width, psd.height);
  const ctx = compCanvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, psd.width, psd.height);

  function render(layer) {
    const isVisible = (layer.visible !== false) && !layer.hidden;
    if (!isVisible) return;
    if (layer.children && layer.children.length) {
      for (const child of layer.children) render(child);
      return;
    }
    if (layer.fillOpacity === 0) return;

    ctx.save();
    if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;
    if (layer.canvas) {
      ctx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
    }
    ctx.restore();
  }

  const bgGroup = psd.children.find(c => c.name === 'SELECT BACKGROUND');
  if (bgGroup) render(bgGroup);
  render(backGroup);

  const outPng = 'C:/Users/Vintech Systems/psd-test/Texas_Back_Filled.png';
  const outBuf = compCanvas.toBuffer('image/png');
  fs.writeFileSync(outPng, outBuf);
  console.log(`Saved Texas_Back_Filled.png (${Math.round(outBuf.length / 1024)} KB)`);
}

testTexasBack().catch(console.error);
