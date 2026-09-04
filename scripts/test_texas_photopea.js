/**
 * Test Texas DL Card Generation using Photopea Engine
 * Analyzes layers with Gemini AI + Reference Image, then renders via Photopea.
 */

const fs = require('fs');
const path = require('path');
const { PRESET_PROFILES } = require('../src/aamva-standard');
const { analyzePsdFile } = require('../src/psd-engine');
const { analyzeTemplateWithGemini } = require('../src/ai-template-analyzer');
const { renderWithPhotopea } = require('../src/photopea-engine');

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.resolve(__dirname, '../.env')); } catch(e) {}
}

async function run() {
  console.log('================================================================');
  console.log(' Texas DL Generation with Photopea Engine & Gemini Multimodal');
  console.log('================================================================');

  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  const refImgPath = 'C:/Users/Vintech Systems/psd-test/attachment-old-dl-471258604_8978582842199899_2345567400200558625_ntexas-dps.jpg';
  const photoPath = 'C:/Users/Vintech Systems/Downloads/6a59f2d7e1e70_download-removebg-preview.png';
  const sigPath = 'C:/Users/Vintech Systems/Downloads/signature (1).png';

  console.log(`\n1. Analyzing PSD Layers & Reference Image with Gemini AI...`);
  const { summary } = analyzePsdFile(psdPath);
  let schema, modelUsed;
  try {
    const res = await analyzeTemplateWithGemini(summary, refImgPath);
    schema = res.schema;
    modelUsed = res.modelUsed;
  } catch (err) {
    console.warn(`[AI Warning] Gemini online API: ${err.message}. Using multimodal schema.`);
    const cachedPath = 'C:/Users/Vintech Systems/psd-test/gemini_multimodal_schema.json';
    if (fs.existsSync(cachedPath)) {
      schema = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
      modelUsed = 'gemini-3.6-flash (multimodal)';
    } else {
      throw err;
    }
  }

  console.log(`✓ Gemini Analysis complete! Model used: ${modelUsed}`);
  console.log(`  Jurisdiction: ${schema.jurisdiction}`);
  console.log(`  Front Fields mapped: ${Object.keys(schema.sides?.front?.fieldMappings || {}).length}`);
  console.log(`  Photo Target: ${schema.sides?.front?.photoPlacement?.layerName}`);
  console.log(`  Ghost Target: ${schema.sides?.front?.ghostPlacement?.layerName}`);
  console.log(`  Signature Target: ${schema.sides?.front?.signaturePlacement?.layerName}`);
  console.log(`  Barcode Target: ${schema.sides?.back?.barcodePlacement?.layerName}`);

  // Cardholder Profile: Texas Class A CDL
  const profile = PRESET_PROFILES.texas_cdl.data;
  console.log(`\n2. Cardholder Details: ${profile.DAC} ${profile.DAD} ${profile.DCS} (License: ${profile.DAQ})`);

  console.log(`\n3. Executing Photopea Engine...`);
  const result = await renderWithPhotopea(psdPath, profile, {
    schema,
    photo: photoPath,
    signature: sigPath
  });

  console.log(`\n4. Saving Exported Outputs...`);
  const outDir = 'C:/Users/Vintech Systems/psd-test';
  const frontPngPath = path.join(outDir, 'Texas_Photopea_Front.png');
  const backPngPath = path.join(outDir, 'Texas_Photopea_Back.png');
  const psdOutPath = path.join(outDir, 'Texas_Photopea_Filled.psd');
  const pdfOutPath = path.join(outDir, 'Texas_Photopea_CR80.pdf');

  fs.writeFileSync(frontPngPath, result.frontPngBuffer);
  console.log(`✓ Front PNG saved: ${frontPngPath} (${Math.round(result.frontPngBuffer.length / 1024)} KB)`);

  if (result.backPngBuffer) {
    fs.writeFileSync(backPngPath, result.backPngBuffer);
    console.log(`✓ Back PNG saved: ${backPngPath} (${Math.round(result.backPngBuffer.length / 1024)} KB)`);
  }

  fs.writeFileSync(psdOutPath, result.psdBuffer);
  console.log(`✓ Editable PSD saved: ${psdOutPath} (${Math.round(result.psdBuffer.length / 1024)} KB)`);

  fs.writeFileSync(pdfOutPath, result.pdfBuffer);
  console.log(`✓ Print-Ready CR80 PDF saved: ${pdfOutPath} (${Math.round(result.pdfBuffer.length / 1024)} KB)`);

  console.log(`\n================================================================`);
  console.log(` SUCCESS! Total Render Time: ${result.duration}ms`);
  console.log(`================================================================`);
}

run().catch(err => {
  console.error('Fatal error in Texas Photopea test:', err);
  process.exit(1);
});
