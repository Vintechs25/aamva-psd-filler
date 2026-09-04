const { readPsd, writePsd, initializeCanvas } = require('ag-psd');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');
const path = require('path');
const { PRESET_PROFILES, generateAamvaBarcodePayload } = require('../src/aamva-standard');

async function testTexasFilling() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  console.log('Loading Texas PSD:', psdPath);
  const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });

  console.log(`Dimensions: ${psd.width} x ${psd.height}`);

  // Texas CDL Test Profile
  const profile = PRESET_PROFILES.texas_cdl.data;
  console.log(`Cardholder: ${profile.DAC} ${profile.DAD} ${profile.DCS}`);
  console.log(`License: ${profile.DAQ}, Class: ${profile.DCA}`);

  // Find Front group
  const frontGroup = psd.children.find(c => c.name === 'Front');
  if (!frontGroup) throw new Error('Front group not found in PSD');

  // Find Photo layers
  const photoGroup = frontGroup.children.find(c => c.name === 'Photo');
  const photoBig = photoGroup.children[0].children.find(c => c.name === 'Photo Big');
  const photoGhost = photoGroup.children[0].children.find(c => c.name === 'Photo Ghost');

  // Load sample portrait photo
  // Let's create a realistic professional portrait photo
  const pWidth = photoBig.right - photoBig.left;
  const pHeight = photoBig.bottom - photoBig.top;
  console.log(`Photo Big bounds: ${pWidth}x${pHeight} at (${photoBig.left}, ${photoBig.top})`);

  const pCanvas = createCanvas(pWidth, pHeight);
  const pCtx = pCanvas.getContext('2d');
  // Gradient portrait backdrop
  const pGrad = pCtx.createLinearGradient(0, 0, 0, pHeight);
  pGrad.addColorStop(0, '#e2e8f0');
  pGrad.addColorStop(1, '#94a3b8');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, pWidth, pHeight);
  // Head & shoulders silhouette
  pCtx.fillStyle = '#334155';
  pCtx.beginPath();
  pCtx.arc(pWidth / 2, pHeight * 0.38, pWidth * 0.22, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.beginPath();
  pCtx.ellipse(pWidth / 2, pHeight * 0.95, pWidth * 0.42, pHeight * 0.42, 0, Math.PI, 0, true);
  pCtx.fill();

  photoBig.canvas = pCanvas;

  // Ghost photo
  if (photoGhost) {
    const gWidth = photoGhost.right - photoGhost.left;
    const gHeight = photoGhost.bottom - photoGhost.top;
    const gCanvas = createCanvas(gWidth, gHeight);
    const gCtx = gCanvas.getContext('2d');
    gCtx.globalAlpha = 0.35;
    gCtx.drawImage(pCanvas, 0, 0, gWidth, gHeight);
    photoGhost.canvas = gCanvas;
    console.log(`Photo Ghost updated: ${gWidth}x${gHeight}`);
  }

  // Signature
  const sigGroup = frontGroup.children.find(c => c.name === 'Signatue');
  const sigLayer = sigGroup.children.find(c => c.name === 'Signature' && c.canvas);
  if (sigLayer) {
    const sWidth = sigLayer.right - sigLayer.left;
    const sHeight = sigLayer.bottom - sigLayer.top;
    const sCanvas = createCanvas(sWidth, sHeight);
    const sCtx = sCanvas.getContext('2d');
    sCtx.strokeStyle = '#0f172a';
    sCtx.lineWidth = 4;
    sCtx.beginPath();
    sCtx.moveTo(40, sHeight * 0.65);
    sCtx.bezierCurveTo(sWidth * 0.25, sHeight * 0.2, sWidth * 0.4, sHeight * 0.8, sWidth * 0.65, sHeight * 0.4);
    sCtx.bezierCurveTo(sWidth * 0.75, sHeight * 0.25, sWidth * 0.85, sHeight * 0.7, sWidth - 40, sHeight * 0.5);
    sCtx.stroke();
    sigLayer.canvas = sCanvas;
    console.log(`Signature updated: ${sWidth}x${sHeight}`);
  }

  // Data layers in Front / Data
  const dataGroup = frontGroup.children.find(c => c.name === 'Data');
  console.log(`Found Data group with ${dataGroup.children.length} layers`);

  // Helper to re-render text layer canvas
  function updateText(layer, newText, customFontSize = null) {
    const width = Math.max(1, (layer.right || 0) - (layer.left || 0));
    const height = Math.max(1, (layer.bottom || 0) - (layer.top || 0));
    const tCanvas = createCanvas(width, height);
    const tCtx = tCanvas.getContext('2d');

    const style = layer.text?.style || {};
    let fontSize = customFontSize || style.fontSize || Math.round(height * 0.8);
    const fontName = style.font?.name || 'Arial';
    const isBold = /bold/i.test(fontName);

    tCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
    let textWidth = tCtx.measureText(newText).width;
    if (textWidth > width && width > 30) {
      const scale = width / textWidth;
      fontSize = Math.max(10, Math.floor(fontSize * scale * 0.95));
      tCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
    }

    const fc = style.fillColor || { r: 0, g: 0, b: 0 };
    tCtx.fillStyle = `rgb(${Math.round(fc.r)}, ${Math.round(fc.g)}, ${Math.round(fc.b)})`;
    tCtx.textBaseline = 'middle';
    tCtx.textAlign = 'left';

    // Check multi-line
    if (newText.includes('\n') || newText.includes('\r')) {
      const lines = newText.split(/\r\n|\r|\n/);
      const lineHeight = fontSize * 1.15;
      const startY = (height - (lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, idx) => {
        tCtx.fillText(line, 0, startY + idx * lineHeight);
      });
    } else {
      tCtx.fillText(newText, 0, height / 2);
    }

    layer.text.text = newText;
    layer.canvas = tCanvas;
    console.log(`  Updated text layer "${layer.name}": "${newText}" (font: ${fontSize}px)`);
  }

  // Map and update each layer in Data
  for (const layer of dataGroup.children) {
    if (!layer.text) continue;

    switch (layer.name) {
      case 'CARLISLE':
        // Last Name
        updateText(layer, profile.DCS);
        break;
      case 'EDWARD CULLEN':
        // First and Middle Name
        updateText(layer, `${profile.DAC} ${profile.DAD}`.trim());
        break;
      case '85316244':
        // License Number
        updateText(layer, profile.DAQ);
        break;
      case '09/21/1990':
        // DOB (or ghost DOB if bottom right)
        if (layer.top < 1000) {
          updateText(layer, '04/12/1984');
        } else {
          updateText(layer, '04/12/1984');
        }
        break;
      case '09/21/2026':
        // Expiration Date
        updateText(layer, '04/12/2030');
        break;
      case '07/11/2020':
        // Issue Date
        updateText(layer, '04/12/2025');
        break;
      case '123 STREET CITY,tx 70000':
        // Address & City State Zip
        updateText(layer, `${profile.DAG}\r${profile.DAI}, ${profile.DAJ} ${profile.DAK.slice(0, 5)}`);
        break;
      case 'A':
        // Vehicle Class
        updateText(layer, profile.DCA);
        break;
      case 'NONE':
        // Restrictions
        updateText(layer, profile.DCB);
        break;
      case 'NONE копия':
        // Endorsements
        updateText(layer, profile.DCD);
        break;
      case '5\'-10\'\'':
        // Height
        updateText(layer, '5\'-11\'\'');
        break;
      case 'M':
        // Sex
        updateText(layer, 'M');
        break;
      case 'BRO':
        // Eyes
        updateText(layer, profile.DAY);
        break;
      case '35838232126640572484':
        // Document Discriminator
        updateText(layer, profile.DCF);
        break;
      default:
        console.log(`  Keeping layer unchanged: "${layer.name}"`);
    }
  }

  // Composite rendering
  console.log('\nRendering final card composite...');
  const compCanvas = createCanvas(psd.width, psd.height);
  const ctx = compCanvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, psd.width, psd.height);

  function renderLayer(layer) {
    const isVisible = (layer.visible !== false) && !layer.hidden;
    if (!isVisible) return;

    if (layer.children && layer.children.length) {
      for (const child of layer.children) {
        renderLayer(child);
      }
      return;
    }

    // Skip layers with fillOpacity === 0 (e.g. Rounded Rectangle 1 copy)
    if (layer.fillOpacity === 0) {
      console.log(`  Skipped layer fillOpacity 0: "${layer.name}"`);
      return;
    }

    ctx.save();
    if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;

    if (layer.blendMode && layer.blendMode !== 'normal') {
      const blendMap = {
        'multiply': 'multiply',
        'screen': 'screen',
        'overlay': 'overlay',
        'darken': 'darken',
        'lighten': 'lighten'
      };
      if (blendMap[layer.blendMode]) ctx.globalCompositeOperation = blendMap[layer.blendMode];
    }

    if (layer.canvas) {
      ctx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
    }
    ctx.restore();
  }

  // Render Background & Front
  const bgGroup = psd.children.find(c => c.name === 'SELECT BACKGROUND');
  if (bgGroup) renderLayer(bgGroup);
  renderLayer(frontGroup);

  // Save Outputs
  const outPng = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template (Front&Back)_Filled.png';
  const outPsd = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template (Front&Back)_Filled.psd';
  
  const pngBuf = compCanvas.toBuffer('image/png');
  fs.writeFileSync(outPng, pngBuf);
  console.log(`\nSuccessfully written filled PNG: ${outPng} (${Math.round(pngBuf.length / 1024)} KB)`);

  psd.canvas = compCanvas;
  const psdBuf = Buffer.from(writePsd(psd, { generateThumbnail: true }));
  fs.writeFileSync(outPsd, psdBuf);
  console.log(`Successfully written filled PSD: ${outPsd} (${Math.round(psdBuf.length / 1024)} KB)`);
}

testTexasFilling().catch(console.error);
