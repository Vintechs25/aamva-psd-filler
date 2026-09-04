/**
 * AI Template Analyzer using Google Gemini API (2025 Standard)
 * Acts as the intelligent brain of the AAMVA PSD Card Filler.
 */

const fs = require('fs');
const path = require('path');

// Ensure environment variables are loaded
if (typeof process.loadEnvFile === 'function') {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch (e) {
      // Ignore if already loaded
    }
  }
}

const SYSTEM_INSTRUCTION = `You are the AI Template Analyzer, a world-class expert in Adobe Photoshop (PSD) templates and the AAMVA DL/ID Card Design Standard (2025 Edition).

Your task is to analyze the extracted layer tree of a driver license / ID card PSD template and produce a comprehensive, highly accurate Template Schema in JSON.

Key Requirements:
1. Separate Front vs Back:
   - Identify whether the template has separate 'Front' and 'Back' card groups or is a single card side.
2. Differentiate Static Labels vs. Data Fields:
   - Layers inside groups named "Dont touch", "Labels", "Static", "Legend" or layers containing label prefixes (e.g. "4d. DL:", "3. DOB:", "1.", "2.", "8.", "16. Hgt:", "15. Sex:", "9. Class:") are STATIC LABELS and must NOT be mapped as data layers. List them under "protectedLayers".
   - Layers containing actual variable data values (e.g. "CARLISLE", "EDWARD CULLEN", "85316244", "09/21/1990", "123 STREET...", "BRO", "M", "5'-10''") must be mapped to their official AAMVA 2025 element IDs.
3. Official AAMVA 2025 Element IDs:
   - DCS: Customer Family Name / Last Name (e.g. "CARLISLE")
   - DAC: Customer First Name
   - DAD: Customer Middle Name
   - NAME_FIRST_MIDDLE: Combined First + Middle Name (e.g. "EDWARD CULLEN")
   - NAME_FULL: Full Name
   - DAQ: Customer ID / Driver License Number (e.g. "85316244")
   - DBB: Date of Birth (e.g. "09/21/1990")
   - DBA: Expiration Date (e.g. "09/21/2026")
   - DBD: Issue Date (e.g. "07/11/2020")
   - DAG: Residential Address Line 1 / Full Address (e.g. "123 STREET CITY,tx 70000")
   - DAI: City
   - DAJ: State / Jurisdiction
   - DAK: ZIP / Postal Code
   - DCA: Vehicle Class (e.g. "A")
   - DCB: Restrictions (e.g. "NONE")
   - DCD: Endorsements (e.g. "NONE" or "NONE копия")
   - DAU: Height (e.g. "5'-10''")
   - DBC: Sex (e.g. "M")
   - DAY: Eye Color (e.g. "BRO")
   - DCF: Document Discriminator / Audit Number (e.g. "35838232126640572484")
   - DBB_GHOST: Secondary Date of Birth under ghost photo (e.g. "09/21/1990")
4. Special Image & Barcode Zones:
   - PORTRAIT: Zone II Main Portrait (e.g. "Photo Big")
   - GHOST_PORTRAIT: Zone VII Secondary Ghost Portrait (e.g. "Photo Ghost")
   - SIGNATURE: Zone VI Cardholder Signature (the active visible pixel layer in "Signatue")
   - BARCODE: Zone V AAMVA PDF417 2D Barcode (e.g. "PDF417_...")
   - BARCODE_1D: Zone IV Code 128 inventory barcode (e.g. "code128")
5. Security & Design Elements to Protect:
   - State seal, flags, guilloché fine lines, microtext, UV overlays ("Слой 1", "Слой 2"), card border shapes ("Rounded Rectangle 1 copy" with fillOpacity 0).

Output must be strictly valid JSON matching this schema:
{
  "jurisdiction": "Texas",
  "templateType": "Driver License / CDL (2025)",
  "dimensions": { "width": 3001, "height": 1803 },
  "hasFrontAndBack": true,
  "sides": {
    "front": {
      "groupName": "Front",
      "protectedLayers": ["string"],
      "photoPlacement": { "layerName": "string", "bounds": [0, 0, 0, 0] },
      "ghostPlacement": { "layerName": "string", "bounds": [0, 0, 0, 0] },
      "signaturePlacement": { "layerName": "string", "bounds": [0, 0, 0, 0] },
      "fieldMappings": {
        "DCS": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "NAME_FIRST_MIDDLE": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DAQ": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DBB": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DBA": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DBD": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DAG": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DCA": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DCB": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DCD": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DAU": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DBC": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DAY": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DCF": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] },
        "DBB_GHOST": { "layerName": "string", "currentText": "string", "bounds": [0, 0, 0, 0] }
      }
    },
    "back": {
      "groupName": "Back",
      "protectedLayers": ["string"],
      "barcodePlacement": { "layerName": "string", "bounds": [0, 0, 0, 0], "format": "PDF417" },
      "barcode1DPlacement": { "layerName": "string", "bounds": [0, 0, 0, 0], "format": "CODE128" },
      "fieldMappings": {
        "DCA_DESC": { "layerName": "string", "currentText": "string" },
        "DCB_BACK": { "layerName": "string", "currentText": "string" },
        "DCD_BACK": { "layerName": "string", "currentText": "string" },
        "DBB_BACK": { "layerName": "string", "currentText": "string" }
      }
    }
  },
  "confidenceScore": 0.98,
  "analysisNotes": ["string"]
}`;

/**
 * Calls the Google Gemini API with fallback models and multimodal support
 */
async function callGeminiApi(promptText, referenceImage = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured in .env or settings.');
  }

  const models = ['gemini-3.6-flash', 'gemini-flash-latest'];
  let lastError = null;

  // Prepare parts
  const parts = [];
  if (referenceImage) {
    let base64Data = null;
    let mimeType = 'image/jpeg';

    if (Buffer.isBuffer(referenceImage)) {
      base64Data = referenceImage.toString('base64');
    } else if (typeof referenceImage === 'string') {
      if (referenceImage.startsWith('data:')) {
        const match = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      } else if (fs.existsSync(referenceImage)) {
        base64Data = fs.readFileSync(referenceImage).toString('base64');
        if (referenceImage.endsWith('.png')) mimeType = 'image/png';
      } else {
        base64Data = referenceImage;
      }
    }

    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
      console.log(`[AI Analyzer] Attached reference card image (${mimeType}) to Gemini prompt`);
    }
  }

  parts.push({ text: promptText });

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 8192
      }
    };

    console.log(`[AI Analyzer] Calling Gemini API (${model})...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[AI Analyzer] Gemini API (${model}) error ${response.status}: ${errorText.slice(0, 200)}`);
        lastError = new Error(`Gemini API error (${response.status}): ${errorText}`);
        continue;
      }

      const json = await response.json();
      const candidate = json.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }

      const parsed = JSON.parse(text);
      console.log(`[AI Analyzer] Successfully received and parsed schema from Gemini (${model})`);
      return { schema: parsed, modelUsed: model };
    } catch (err) {
      console.warn(`[AI Analyzer] Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

/**
 * Analyzes a PSD layers summary using Gemini AI with optional reference image
 */
async function analyzeTemplateWithGemini(layersSummary, referenceImage = null) {
  const simplifiedLayers = layersSummary.allLayers.map(l => ({
    name: l.name,
    path: l.path,
    type: l.isGroup ? 'group' : (l.hasText ? 'text' : 'pixel'),
    visible: l.visible,
    text: l.currentText || undefined,
    font: l.fontName || undefined,
    fontSize: l.fontSize || undefined,
    bounds: [l.left, l.top, l.right, l.bottom],
    dimensions: `${l.width}x${l.height}`
  }));

  let prompt = `Analyze this PSD template layer structure and return the AAMVA 2025 Template Schema JSON.

Template Dimensions: ${layersSummary.width} x ${layersSummary.height}
Total Extracted Layers: ${layersSummary.totalLayers}

Layer Structure:
${JSON.stringify(simplifiedLayers, null, 2)}
`;

  if (referenceImage) {
    prompt = `An actual physical reference card image is attached alongside the extracted PSD template layer structure.
Visually match the reference card features (labels, data fields, photos, barcodes) with the PSD layer tree.
Differentiate static labels (e.g. layers in "Dont touch" or containing label numbers like "4d. DL:") from variable cardholder data.

${prompt}`;
  }

  return await callGeminiApi(prompt, referenceImage);
}

module.exports = {
  analyzeTemplateWithGemini,
  callGeminiApi
};
