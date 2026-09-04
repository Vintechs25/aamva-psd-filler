const { fillPsd } = require('../src/psd-engine');
const { PRESET_PROFILES } = require('../src/aamva-standard');
const fs = require('fs');

async function run() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  console.log('Filling Texas PSD using psd-engine.js...');
  const profile = PRESET_PROFILES.texas_cdl.data;

  // Custom mapping for this Texas PSD
  const customMappings = {
    'CARLISLE': 'DCS',
    'EDWARD CULLEN': 'NAME_FIRST_MIDDLE',
    '85316244': 'DAQ',
    '09/21/1990': 'DBB',
    '09/21/2026': 'DBA',
    '07/11/2020': 'DBD',
    '123 STREET CITY,tx 70000': 'DAG',
    'A': 'DCA',
    'NONE': 'DCB',
    'NONE копия': 'DCD',
    '5\'-10\'\'': 'DAU',
    'M': 'DBC',
    'BRO': 'DAY',
    '35838232126640572484': 'DCF',
    'Photo Big': 'PORTRAIT',
    'Photo Ghost': 'GHOST_PORTRAIT',
    'Signature': 'SIGNATURE'
  };

  const result = await fillPsd(psdPath, profile, customMappings);

  const outPng = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template (Front&Back)_Filled.png';
  const outPsd = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template (Front&Back)_Filled.psd';

  fs.writeFileSync(outPng, result.pngBuffer);
  fs.writeFileSync(outPsd, result.psdBuffer);

  console.log(`Successfully generated filled card:`);
  console.log(`PNG: ${outPng} (${Math.round(result.pngBuffer.length / 1024)} KB)`);
  console.log(`PSD: ${outPsd} (${Math.round(result.psdBuffer.length / 1024)} KB)`);
  console.log(`Total Modifications: ${result.modificationsLog.length}`);
}

run().catch(console.error);
