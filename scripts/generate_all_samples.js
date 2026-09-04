/**
 * Batch Generator for Sample Filled Cards across multiple US jurisdictions
 * Generates completed PSDs, PNGs, and PDFs for:
 * 1. California REAL ID Driver License (Front)
 * 2. Texas Commercial Driver License (Class A CDL) (Front)
 * 3. New York Enhanced Driver License (EDL) (Front)
 * 4. Florida State Identification Card (Front)
 * 5. AAMVA Zone V Barcode Card (Back)
 */

const fs = require('fs');
const path = require('path');
const { fillPsd } = require('../src/psd-engine');
const { PRESET_PROFILES } = require('../src/aamva-standard');
const { ensureSampleTemplates } = require('../src/sample-psd-generator');

async function generateAllSamples() {
  const samplesDir = path.join(__dirname, '..', 'samples');
  const filledDir = path.join(samplesDir, 'filled');
  fs.mkdirSync(filledDir, { recursive: true });

  const { frontPath, backPath } = ensureSampleTemplates(samplesDir);

  console.log('================================================================');
  console.log(' Generating Complete Set of AAMVA 2025 Sample Cards');
  console.log('================================================================');

  const frontPresets = [
    { key: 'california_real_id', filename: 'Sample_California_REAL_ID_Front' },
    { key: 'texas_cdl', filename: 'Sample_Texas_CDL_ClassA_Front' },
    { key: 'newyork_edl', filename: 'Sample_NewYork_EDL_Front' },
    { key: 'florida_id', filename: 'Sample_Florida_StateID_Front' }
  ];

  for (const preset of frontPresets) {
    const profile = PRESET_PROFILES[preset.key];
    console.log(`\nProcessing: ${profile.title}...`);

    const result = await fillPsd(frontPath, profile.data);

    const psdPath = path.join(filledDir, `${preset.filename}.psd`);
    const pngPath = path.join(filledDir, `${preset.filename}.png`);
    const pdfPath = path.join(filledDir, `${preset.filename}.pdf`);

    fs.writeFileSync(psdPath, result.psdBuffer);
    fs.writeFileSync(pngPath, result.pngBuffer);
    fs.writeFileSync(pdfPath, result.pdfBuffer);

    console.log(`  ✓ Created: ${path.basename(psdPath)} (${Math.round(result.psdBuffer.length / 1024)} KB)`);
    console.log(`  ✓ Created: ${path.basename(pngPath)} (${Math.round(result.pngBuffer.length / 1024)} KB)`);
    console.log(`  ✓ Created: ${path.basename(pdfPath)} (${Math.round(result.pdfBuffer.length / 1024)} KB)`);
    console.log(`  ✓ Modifications made: ${result.modificationsLog.length} layers`);
  }

  // Generate Back Template with Zone V Barcode
  console.log('\nProcessing: Standard AAMVA 2025 Reverse Side (Zone V Barcode)...');
  const backResult = await fillPsd(backPath, PRESET_PROFILES.california_real_id.data);

  const backPsd = path.join(filledDir, 'Sample_AAMVA_Zone_V_Back.psd');
  const backPng = path.join(filledDir, 'Sample_AAMVA_Zone_V_Back.png');
  const backPdf = path.join(filledDir, 'Sample_AAMVA_Zone_V_Back.pdf');

  fs.writeFileSync(backPsd, backResult.psdBuffer);
  fs.writeFileSync(backPng, backResult.pngBuffer);
  fs.writeFileSync(backPdf, backResult.pdfBuffer);

  console.log(`  ✓ Created: ${path.basename(backPsd)} (${Math.round(backResult.psdBuffer.length / 1024)} KB)`);
  console.log(`  ✓ Created: ${path.basename(backPng)} (${Math.round(backResult.pngBuffer.length / 1024)} KB)`);
  console.log(`  ✓ Created: ${path.basename(backPdf)} (${Math.round(backResult.pdfBuffer.length / 1024)} KB)`);

  console.log('\n================================================================');
  console.log(` All sample cards successfully generated in:`);
  console.log(` ${filledDir}`);
  console.log('================================================================');
}

generateAllSamples().catch(err => {
  console.error('Error generating sample cards:', err);
  process.exit(1);
});
