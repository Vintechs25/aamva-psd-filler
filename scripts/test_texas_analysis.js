const { analyzePsdFile } = require('../src/psd-engine');
const fs = require('fs');

const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
const { summary } = analyzePsdFile(psdPath);

console.log('=== TEMPLATE SCHEMA SUMMARY ===');
console.log(`Resolution: ${summary.width} x ${summary.height}`);
console.log(`Total Layers: ${summary.totalLayers}`);
console.log(`Text Layers: ${summary.textLayers}`);
console.log(`Image Layers: ${summary.imageLayers}`);
console.log(`Protected Layers: ${summary.protectedLayers}`);

console.log('\n=== DETECTED FIELDS ===');
for (const [k, layers] of Object.entries(summary.detectedFields)) {
  console.log(`\nField: ${k} (${layers.length} candidate layer${layers.length > 1 ? 's' : ''})`);
  layers.forEach(l => {
    console.log(`  - Layer Name: "${l.name}" | Path: "${l.path}" | Visible: ${l.visible} | Text: "${l.currentText || ''}" | Conf: ${l.detectionConfidence} | Method: ${l.detectionMethod}`);
  });
}

fs.writeFileSync('C:/Users/Vintech Systems/psd-test/texas_template_schema.json', JSON.stringify(summary, null, 2));
console.log('\nSaved schema to C:/Users/Vintech Systems/psd-test/texas_template_schema.json');
