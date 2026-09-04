const { readPsd, initializeCanvas } = require('ag-psd');
const { createCanvas } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');

const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });

console.log('--- Checking layers in Front group ---');
const frontGroup = psd.children.find(c => c.name === 'Front');
console.log('Front group found:', !!frontGroup, 'visible:', frontGroup?.visible);

function inspectCanvas(c, indent = '') {
  const isVis = c.visible !== false && !c.hidden;
  console.log(`${indent}${c.name} | hasCanvas: ${!!c.canvas} | canvasSize: ${c.canvas ? `${c.canvas.width}x${c.canvas.height}` : 'none'} | bounds: [${c.left},${c.top} -> ${c.right},${c.bottom}] | visible: ${isVis}`);
  if (c.children) {
    c.children.forEach(child => inspectCanvas(child, indent + '  '));
  }
}

inspectCanvas(frontGroup);

console.log('\n--- Checking composite canvas of original PSD ---');
console.log('psd.canvas exists:', !!psd.canvas);
if (psd.canvas) {
  console.log('psd.canvas dimensions:', psd.canvas.width, 'x', psd.canvas.height);
  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/original_composite.png', psd.canvas.toBuffer('image/png'));
  console.log('Saved original_composite.png');
}
