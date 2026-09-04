const fs = require('fs');
const path = require('path');
const { analyzePsdFile } = require('../src/psd-engine');
const {
  analyzeTemplateWithOpenRouter,
  getOpenRouterApiKey,
  OPENROUTER_MODELS
} = require('../src/ai-template-analyzer');

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.resolve(__dirname, '../.env')); } catch (e) {}
}

async function run() {
  console.log('=== Testing OpenRouter AI Template Analyzer ===');
  console.log('Target models (in priority order):', OPENROUTER_MODELS);

  const apiKey = getOpenRouterApiKey();
  console.log('OpenRouter API Key configured:', apiKey ? `YES (${apiKey.slice(0, 8)}...${apiKey.slice(-4)})` : 'NO');

  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  console.log('Analyzing PSD layer structure:', psdPath);
  const { summary } = analyzePsdFile(psdPath);
  console.log(`Extracted: ${summary.totalLayers} layers (${summary.textLayers} text, ${summary.pixelLayers} pixel), dimensions: ${summary.width}x${summary.height}`);

  if (!apiKey) {
    console.warn('\n[!] OPENROUTER_API_KEY is not set in .env or environment.');
    console.log('To run live OpenRouter inference, add your key to .env:');
    console.log('  OPENROUTER_API_KEY=sk-or-v1-...');
    console.log('Or test via the GUI Settings modal at http://localhost:3000.\n');
    return;
  }

  console.log('\nSending layer tree to OpenRouter...');
  const result = await analyzeTemplateWithOpenRouter(summary);

  console.log('\n=== Analysis Success! ===');
  console.log('Model Used:', result.modelUsed);
  console.log('Jurisdiction:', result.schema.jurisdiction);
  console.log('Template Type:', result.schema.templateType);
  console.log('Confidence Score:', result.schema.confidenceScore);
  console.log('Front Field Mappings:', Object.keys(result.schema.sides?.front?.fieldMappings || {}));
  console.log('Back Field Mappings:', Object.keys(result.schema.sides?.back?.fieldMappings || {}));

  const outPath = 'C:/Users/Vintech Systems/psd-test/openrouter_schema.json';
  fs.writeFileSync(outPath, JSON.stringify(result.schema, null, 2));
  console.log('Saved generated schema to:', outPath);
}

run().catch(console.error);
