const { readPsd, initializeCanvas } = require('ag-psd');
const { createCanvas } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');

const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });

console.log('Rendering Front card directly with fillOpacity check...');

const canvas = createCanvas(psd.width, psd.height);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, psd.width, psd.height);

function render(layer) {
  const isVisible = (layer.visible !== false) && !layer.hidden;
  if (!isVisible) return;

  if (layer.children && layer.children.length) {
    for (const child of layer.children) {
      render(child);
    }
    return;
  }

  // Check fill opacity
  if (layer.fillOpacity === 0) {
    console.log(`Skipping layer fill with fillOpacity 0: "${layer.name}"`);
    return;
  }

  ctx.save();
  if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;

  if (layer.canvas) {
    ctx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
  }
  ctx.restore();
}

// Only render background and Front
const bgGroup = psd.children.find(c => c.name === 'SELECT BACKGROUND');
const frontGroup = psd.children.find(c => c.name === 'Front');

if (bgGroup) render(bgGroup);
if (frontGroup) render(frontGroup);

const outBuf = canvas.toBuffer('image/png');
fs.writeFileSync('C:/Users/Vintech Systems/psd-test/test_front_rendered.png', outBuf);
console.log('Successfully saved test_front_rendered.png! Size:', outBuf.length);
