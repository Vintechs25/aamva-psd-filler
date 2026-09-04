const fs = require('fs');
const path = require('path');
const { PRESET_PROFILES, formatDisplayDate, formatAamvaDate, cleanAamvaText } = require('../src/aamva-standard');
const { analyzePsdFile } = require('../src/psd-engine');
const { renderWithPhotopea } = require('../src/photopea-engine');

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.resolve(__dirname, '../.env')); } catch(e) {}
}

async function run() {
  console.log('Testing Polish Fixes on Texas DL Front...');
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  const photoPath = 'C:/Users/Vintech Systems/Downloads/6a59f2d7e1e70_download-removebg-preview.png';
  const sigPath = 'C:/Users/Vintech Systems/Downloads/signature (1).png';
  const cachedSchemaPath = 'C:/Users/Vintech Systems/psd-test/gemini_multimodal_schema.json';
  const schema = JSON.parse(fs.readFileSync(cachedSchemaPath, 'utf8'));

  const profile = PRESET_PROFILES.texas_cdl.data;
  console.log('Profile:', profile.DAC, profile.DAD, profile.DCS);

  const result = await renderWithPhotopea(psdPath, profile, {
    schema,
    photo: photoPath,
    signature: sigPath
  });

  const outFront = 'C:/Users/Vintech Systems/psd-test/Texas_Front_Polished.png';
  fs.writeFileSync(outFront, result.frontPngBuffer);
  console.log('Saved polished front:', outFront, Math.round(result.frontPngBuffer.length / 1024), 'KB');
}

run().catch(console.error);
