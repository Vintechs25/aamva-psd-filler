const { readPsd, initializeCanvas } = require('ag-psd');
const { createCanvas } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');

const psd = readPsd(fs.readFileSync('./samples/Filled_Front_Test.psd'));
console.log('--- VERIFYING FILLED PSD STRUCTURE ---');
console.log(`Resolution: ${psd.width} x ${psd.height}`);
console.log(`Root Layer Count: ${psd.children.length}`);

function printLayers(children, indent = '  ') {
  for (const c of children) {
    let extra = '';
    if (c.text) extra += ` | TEXT: "${c.text.text}" | FONT: ${c.text.style?.font?.name || 'inherit'}`;
    if (c.children) extra += ` | GROUP [${c.children.length} items]`;
    if (c.blendMode && c.blendMode !== 'normal') extra += ` | BLEND: ${c.blendMode}`;
    if (c.opacity !== undefined && c.opacity < 1) extra += ` | OPACITY: ${c.opacity}`;
    console.log(`${indent}- ${c.name}${extra}`);
    if (c.children) printLayers(c.children, indent + '    ');
  }
}

printLayers(psd.children);
