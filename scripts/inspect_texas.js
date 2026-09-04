const { readPsd, initializeCanvas } = require('ag-psd');
const { createCanvas } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');

const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
console.log('Reading PSD:', psdPath);
const buf = fs.readFileSync(psdPath);
const psd = readPsd(buf, { skipCompositeImageData: false, skipLayerImageData: false });

console.log('=== PSD METADATA ===');
console.log(`Dimensions: ${psd.width} x ${psd.height}`);
console.log(`Channels: ${psd.channels}, BitsPerChannel: ${psd.bitsPerChannel}, ColorMode: ${psd.colorMode}`);
console.log(`Top-level children: ${psd.children?.length}`);

const layersReport = [];

function walk(c, depth = 0, path = []) {
  const currentPath = [...path, c.name];
  const isGroup = !!(c.children && c.children.length);
  const hasText = !!c.text;
  const isVisible = c.visible !== false && !c.hidden;
  let type = 'pixel';
  if (isGroup) type = 'group';
  else if (hasText) type = 'text';
  else if (c.placedLayer || c.smartObject) type = 'smart object';

  const info = {
    name: c.name,
    path: currentPath.join(' / '),
    type,
    visible: isVisible,
    opacity: c.opacity !== undefined ? c.opacity : 1,
    blendMode: c.blendMode || 'normal',
    bounds: { left: c.left, top: c.top, right: c.right, bottom: c.bottom, width: (c.right || 0) - (c.left || 0), height: (c.bottom || 0) - (c.top || 0) },
    hasCanvas: !!c.canvas,
    text: hasText ? (c.text.text || '').replace(/\r|\n/g, ' ') : null,
    font: hasText ? c.text.style?.font?.name : null,
    fontSize: hasText ? c.text.style?.fontSize : null,
    color: hasText ? c.text.style?.fillColor : null
  };

  layersReport.push(info);
  const indent = '  '.repeat(depth);
  console.log(`${indent}[${type.toUpperCase()}] "${c.name}" | visible: ${isVisible} | bounds: [${info.bounds.left},${info.bounds.top} -> ${info.bounds.right},${info.bounds.bottom}] (${info.bounds.width}x${info.bounds.height}) ${hasText ? `| Text: "${info.text}" | Font: ${info.font}` : ''}`);

  if (c.children) {
    for (const child of c.children) {
      walk(child, depth + 1, currentPath);
    }
  }
}

for (const child of psd.children) {
  walk(child, 0, []);
}

fs.writeFileSync('C:/Users/Vintech Systems/psd-test/texas_layers_report.json', JSON.stringify({
  width: psd.width,
  height: psd.height,
  totalLayers: layersReport.length,
  layers: layersReport
}, null, 2));

console.log(`\nReport written to C:/Users/Vintech Systems/psd-test/texas_layers_report.json (Total layers: ${layersReport.length})`);
