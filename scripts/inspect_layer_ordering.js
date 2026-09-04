const { readPsd, initializeCanvas } = require('ag-psd');
const { createCanvas } = require('@napi-rs/canvas');
initializeCanvas(createCanvas);
const fs = require('fs');

const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
const psd = readPsd(fs.readFileSync(psdPath), { skipCompositeImageData: false, skipLayerImageData: false });

console.log('Top level children in order:');
psd.children.forEach((c, idx) => console.log(idx, c.name, 'visible:', c.visible));

const bgGroup = psd.children.find(c => c.name === 'SELECT BACKGROUND');
console.log('\nSELECT BACKGROUND children in order:');
bgGroup.children.forEach((c, idx) => console.log(idx, c.name, 'visible:', c.visible, 'opacity:', c.opacity, 'blend:', c.blendMode));

const frontGroup = psd.children.find(c => c.name === 'Front');
console.log('\nFront children in order:');
frontGroup.children.forEach((c, idx) => console.log(idx, c.name, 'visible:', c.visible, 'opacity:', c.opacity, 'blend:', c.blendMode));

// Save individual layers to see what they contain
if (frontGroup.children[0].canvas) {
  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/front_blank.png', frontGroup.children[0].canvas.toBuffer('image/png'));
  console.log('Saved front_blank.png');
}

const photoGroup = frontGroup.children.find(c => c.name === 'Photo');
const photoBig = photoGroup.children[0].children.find(c => c.name === 'Photo Big');
if (photoBig && photoBig.canvas) {
  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/photo_big.png', photoBig.canvas.toBuffer('image/png'));
  console.log('Saved photo_big.png');
}
