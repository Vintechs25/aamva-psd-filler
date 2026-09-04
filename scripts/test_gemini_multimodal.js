const fs = require('fs');
const path = require('path');
const { analyzePsdFile } = require('../src/psd-engine');

if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(path.resolve(__dirname, '../.env')); } catch(e) {}
}

async function testGeminiMultimodal() {
  const psdPath = 'C:/Users/Vintech Systems/psd-test/Texas New Driver License PSD Template V2/Texas New Driver License PSD Template (Front&Back).psd';
  const refImgPath = 'C:/Users/Vintech Systems/psd-test/attachment-old-dl-471258604_8978582842199899_2345567400200558625_ntexas-dps.jpg';

  console.log('Extracting PSD layers summary...');
  const { summary } = analyzePsdFile(psdPath);

  console.log('Reading reference image:', refImgPath);
  const refImgBytes = fs.readFileSync(refImgPath);
  const refImgBase64 = refImgBytes.toString('base64');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No GEMINI_API_KEY');

  const simplifiedLayers = summary.allLayers.map(l => ({
    name: l.name,
    path: l.path,
    type: l.isGroup ? 'group' : (l.hasText ? 'text' : 'pixel'),
    visible: l.visible,
    text: l.currentText || undefined,
    bounds: [l.left, l.top, l.right, l.bottom],
    dimensions: `${l.width}x${l.height}`
  }));

  const prompt = `You are an expert in Adobe Photoshop PSD templates and the AAMVA 2025 DL/ID Card Design Standard.
I have provided an actual reference image of a Texas Driver License alongside the extracted layer structure of the Photoshop PSD template.

Visually inspect the reference image and match its fields with the PSD layers.
Differentiate static labels (e.g. inside "Dont touch" or label headers) from variable cardholder data fields.

Map to official AAMVA 2025 element codes:
- DCS: Last Name / Family Name (e.g. CARLISLE)
- NAME_FIRST_MIDDLE: First and Middle Name (e.g. EDWARD CULLEN)
- DAQ: License Number (e.g. 85316244)
- DBB: Date of Birth (e.g. 09/21/1990)
- DBA: Expiration Date (e.g. 09/21/2026)
- DBD: Issue Date (e.g. 07/11/2020)
- DAG: Address
- DCA: Class
- DCB: Restrictions
- DCD: Endorsements
- DAU: Height
- DBC: Sex
- DAY: Eyes
- DCF: Document Discriminator / Audit Number
- DBB_GHOST: Secondary Date of Birth under ghost portrait
- PORTRAIT: Main photo (Photo Big)
- GHOST_PORTRAIT: Secondary ghost photo (Photo Ghost)
- SIGNATURE: Active signature layer
- BARCODE: Back 2D PDF417 barcode
- BARCODE_1D: Back 1D inventory barcode

Return strictly valid JSON matching this schema:
{
  "jurisdiction": "Texas",
  "templateType": "Driver License / CDL",
  "hasFrontAndBack": true,
  "sides": {
    "front": {
      "groupName": "Front",
      "photoPlacement": { "layerName": "Photo Big" },
      "ghostPlacement": { "layerName": "Photo Ghost" },
      "signaturePlacement": { "layerName": "Signature" },
      "fieldMappings": {
        "DCS": { "layerName": "CARLISLE" },
        "NAME_FIRST_MIDDLE": { "layerName": "EDWARD CULLEN" },
        "DAQ": { "layerName": "85316244" },
        "DBB": { "layerName": "09/21/1990" },
        "DBA": { "layerName": "09/21/2026" },
        "DBD": { "layerName": "07/11/2020" },
        "DAG": { "layerName": "123 STREET CITY,tx 70000" },
        "DCA": { "layerName": "A" },
        "DCB": { "layerName": "NONE" },
        "DCD": { "layerName": "NONE копия" },
        "DAU": { "layerName": "5'-10''" },
        "DBC": { "layerName": "M" },
        "DAY": { "layerName": "BRO" },
        "DCF": { "layerName": "35838232126640572484" },
        "DBB_GHOST": { "layerName": "09/21/1990" }
      }
    },
    "back": {
      "groupName": "Back",
      "barcodePlacement": { "layerName": "PDF417_A1181102_202105110338" },
      "barcode1DPlacement": { "layerName": "code128" }
    }
  },
  "confidenceScore": 0.99
}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: refImgBase64
            }
          },
          { text: prompt + '\n\nPSD Layer Structure:\n' + JSON.stringify(simplifiedLayers, null, 2) }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  console.log('Sending multimodal request to Gemini 3.6 Flash...');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(text);

  console.log('Gemini Multimodal Response:');
  console.log(JSON.stringify(parsed, null, 2));

  fs.writeFileSync('C:/Users/Vintech Systems/psd-test/gemini_multimodal_schema.json', JSON.stringify(parsed, null, 2));
  console.log('Saved multimodal schema to gemini_multimodal_schema.json');
}

testGeminiMultimodal().catch(console.error);
