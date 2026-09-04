#!/usr/bin/env node

/**
 * AAMVA Auto DL/ID PSD Filler - Command Line Interface (CLI)
 * Offline batch processing tool for automated pipelines.
 */

const fs = require('fs');
const path = require('path');
const { analyzePsdFile, fillPsd } = require('./src/psd-engine');
const { PRESET_PROFILES, validateAamvaData } = require('./src/aamva-standard');
const { ensureSampleTemplates } = require('./src/sample-psd-generator');

function printUsage() {
  console.log(`
================================================================================
  AAMVA Auto DL/ID PSD Filler (2025 Standard) - CLI Mode
================================================================================

Usage:
  node cli.js [options]

Options:
  --template <path>      Path to input PSD template file (Required unless using preset)
  --data <path>          Path to JSON file containing cardholder AAMVA fields
  --preset <name>        Use a built-in preset (california_real_id, texas_cdl, newyork_edl, florida_id)
  --photo <path>         Path to portrait image (JPG / PNG)
  --signature <path>     Path to signature image (transparent PNG recommended)
  --out <dir>            Output directory (default: ./outputs/cli_export)
  --sample               Run demo using built-in CR80 template & California REAL ID profile
  --help                 Show this help screen

Examples:
  # Quick test run with built-in templates
  node cli.js --sample

  # Fill custom PSD with JSON data and assets
  node cli.js --template my_license.psd --data cardholder.json --photo headshot.png --signature sig.png --out ./build
`);
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  if (args.includes('--help') || (args.length === 0 && !args.includes('--sample'))) {
    printUsage();
    process.exit(0);
  }

  // Ensure sample templates
  const samplesDir = path.join(__dirname, 'samples');
  ensureSampleTemplates(samplesDir);

  let templatePath = getArg('--template');
  let dataPath = getArg('--data');
  const presetName = getArg('--preset');
  const photoPath = getArg('--photo');
  const sigPath = getArg('--signature');
  const outDir = getArg('--out') || path.join(__dirname, 'outputs', 'cli_export');

  // Handle sample demo
  if (args.includes('--sample')) {
    console.log('>>> Running Sample Automated Pipeline Demo...');
    templatePath = path.join(samplesDir, 'CR80_AAMVA_Front_Template.psd');
    const profile = PRESET_PROFILES.california_real_id;
    console.log(`Using Preset: ${profile.title}`);

    const fillResult = await fillPsd(templatePath, profile.data);
    fs.mkdirSync(outDir, { recursive: true });

    const psdOut = path.join(outDir, 'CR80_Front_Sample_Filled.psd');
    const pngOut = path.join(outDir, 'CR80_Front_Sample_Filled.png');
    const pdfOut = path.join(outDir, 'CR80_Front_Sample_Filled.pdf');

    fs.writeFileSync(psdOut, fillResult.psdBuffer);
    fs.writeFileSync(pngOut, fillResult.pngBuffer);
    fs.writeFileSync(pdfOut, fillResult.pdfBuffer);

    console.log('>>> Successfully generated:');
    console.log(`    PSD: ${psdOut}`);
    console.log(`    PNG: ${pngOut}`);
    console.log(`    PDF: ${pdfOut}`);
    console.log(`>>> Total Modifications: ${fillResult.modificationsLog.length}`);
    return;
  }

  if (!templatePath || !fs.existsSync(templatePath)) {
    console.error(`Error: Template file not found: ${templatePath}`);
    process.exit(1);
  }

  // Load Form Data
  let formData = {};
  if (dataPath) {
    if (!fs.existsSync(dataPath)) {
      console.error(`Error: Data file not found: ${dataPath}`);
      process.exit(1);
    }
    formData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } else if (presetName && PRESET_PROFILES[presetName]) {
    formData = PRESET_PROFILES[presetName].data;
  } else {
    console.error('Error: Please provide --data <json_file> or --preset <preset_name>');
    process.exit(1);
  }

  // Validate
  const validation = validateAamvaData(formData);
  if (!validation.valid) {
    console.warn('>>> AAMVA Validation Warnings/Errors:');
    validation.errors.forEach(e => console.error(`  - ERROR: ${e}`));
  }

  // Load Assets
  const assets = {};
  if (photoPath && fs.existsSync(photoPath)) {
    assets.photo = fs.readFileSync(photoPath);
  }
  if (sigPath && fs.existsSync(sigPath)) {
    assets.signature = fs.readFileSync(sigPath);
  }

  console.log(`>>> Analyzing template: ${path.basename(templatePath)}...`);
  const analysis = analyzePsdFile(templatePath);
  console.log(`    Resolution: ${analysis.summary.width}x${analysis.summary.height}`);
  console.log(`    Total Layers: ${analysis.summary.totalLayers}`);
  console.log(`    Protected Design Elements: ${analysis.summary.protectedLayers}`);
  console.log(`    Detected AAMVA Fields: ${Object.keys(analysis.summary.detectedFields).join(', ')}`);

  console.log('>>> Executing fill...');
  const result = await fillPsd(templatePath, formData, {}, assets);

  fs.mkdirSync(outDir, { recursive: true });
  const base = path.parse(templatePath).name;

  const psdOut = path.join(outDir, `${base}_Filled.psd`);
  const pngOut = path.join(outDir, `${base}_Filled.png`);
  const pdfOut = path.join(outDir, `${base}_PrintReady_CR80.pdf`);

  fs.writeFileSync(psdOut, result.psdBuffer);
  fs.writeFileSync(pngOut, result.pngBuffer);
  fs.writeFileSync(pdfOut, result.pdfBuffer);

  console.log(`>>> Done! Saved files in: ${outDir}`);
  console.log(`    - PSD: ${psdOut}`);
  console.log(`    - PNG: ${pngOut}`);
  console.log(`    - PDF: ${pdfOut}`);
}

main().catch(err => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
