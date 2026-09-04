const { analyzePsdFile } = require('../src/psd-engine');
const { analyzeTemplateWithGemini } = require('../src/ai-template-analyzer');
const fs = require('fs');

async function testGemini() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  console.log('Extracting layers from PSD:', psdPath);
  const { summary } = analyzePsdFile(psdPath);

  console.log(`Extracted ${summary.allLayers.length} layers. Calling Gemini API...`);
  const startTime = Date.now();
  const { schema, modelUsed } = await analyzeTemplateWithGemini(summary);
  const duration = Date.now() - startTime;

  console.log(`\n=== GEMINI ANALYSIS COMPLETE in ${duration}ms (Model: ${modelUsed}) ===`);
  console.log('Jurisdiction:', schema.jurisdiction);
  console.log('Template Type:', schema.templateType);
  console.log('Has Front and Back:', schema.hasFrontAndBack);
  console.log('Confidence Score:', schema.confidenceScore);

  console.log('\n--- FRONT MAPPINGS ---');
  console.log('Photo Placement:', schema.sides?.front?.photoPlacement);
  console.log('Ghost Placement:', schema.sides?.front?.ghostPlacement);
  console.log('Signature Placement:', schema.sides?.front?.signaturePlacement);
  console.log('Field Mappings:');
  for (const [code, info] of Object.entries(schema.sides?.front?.fieldMappings || {})) {
    console.log(`  ${code}: "${info.layerName}" -> "${info.currentText}" (Font: ${info.fontSize}px ${info.font})`);
  }

  console.log('\n--- BACK MAPPINGS ---');
  console.log('Barcode Placement:', schema.sides?.back?.barcodePlacement);
  console.log('1D Barcode Placement:', schema.sides?.back?.barcode1DPlacement);
  for (const [code, info] of Object.entries(schema.sides?.back?.fieldMappings || {})) {
    console.log(`  ${code}: "${info.layerName}" -> "${info.currentText}"`);
  }

  console.log('\n--- PROTECTED LAYERS ---');
  console.log('Front Protected Count:', schema.sides?.front?.protectedLayers?.length);
  console.log('Back Protected Count:', schema.sides?.back?.protectedLayers?.length);

  // Save the AI schema to file
  const outPath = 'C:/Users/Vintech Systems/psd-test/gemini_generated_schema.json';
  fs.writeFileSync(outPath, JSON.stringify(schema, null, 2));
  console.log(`\nSuccessfully saved full schema to ${outPath}`);
}

testGemini().catch(console.error);
