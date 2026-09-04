/**
 * Advanced PSD Engine for AAMVA DL/ID Card Processing
 * High-fidelity preservation of original fonts, styles, security features, and layer hierarchy.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { readPsd, writePsd, initializeCanvas } = require('ag-psd');
const bwipjs = require('bwip-js');
const { PDFDocument } = require('pdf-lib');
const {
  AAMVA_ELEMENTS,
  generateAamvaBarcodePayload,
  formatAamvaDate,
  formatDisplayDate,
  formatAamvaHeight,
  cleanAamvaText
} = require('./aamva-standard');

// Initialize ag-psd with native canvas implementation
initializeCanvas(createCanvas);

// Default high-fidelity assets
const DEFAULT_PORTRAIT_PATH = path.join(__dirname, '../assets/default_portrait.png');
const DEFAULT_SIGNATURE_PATH = path.join(__dirname, '../assets/default_signature.png');

// Known protection keywords in layers (holograms, watermarks, security patterns, UV, backgrounds, static labels)
const PROTECTED_LAYER_KEYWORDS = [
  'security', 'hologram', 'holo', 'watermark', 'guilloche', 'fine_line',
  'uv', 'ultraviolet', 'kinegram', 'microtext', 'microprint', 'seal',
  'crest', 'pattern', 'background', 'bg', 'ovd', 'optically', 'overlay',
  'protect', 'do_not_edit', 'card_frame', 'metallic', 'ghost_border',
  'flag', 'bear', 'star', 'real_id_star', 'state_outline',
  'dont touch', "don't touch", 'do_not_touch', 'dont_touch',
  'label', 'labels', 'legend'
];

// Semantic field alias mappings
const FIELD_ALIASES = {
  // Family / Last Name
  DCS: ['dcs', 'last_name', 'lastname', 'family_name', 'surname', 'customer_family_name', 'ln', 'last', 'carlisle'],
  // First Name
  DAC: ['dac', 'first_name', 'firstname', 'given_name', 'customer_first_name', 'fn', 'first'],
  // Middle Name
  DAD: ['dad', 'middle_name', 'middlename', 'customer_middle_name', 'mn', 'middle'],
  // Combined Name / First + Middle
  NAME_FULL: ['name', 'full_name', 'fullname', 'cardholder_name', 'holder_name', 'customer_name'],
  NAME_FIRST_MIDDLE: ['first_middle', 'edward cullen', 'edward_cullen', 'given_names'],
  // License / Document Number
  DAQ: ['daq', 'license_no', 'license_num', 'lic_no', 'lic_num', 'dl_number', 'dl_no', 'id_number', 'document_no', 'doc_num', 'dl', 'id_no', '85316244'],
  // Date of Birth
  DBB: ['dbb', 'dob', 'date_of_birth', 'birth_date', 'birthdate', 'born'],
  // Expiration Date
  DBA: ['dba', 'exp', 'exp_date', 'expiration_date', 'expiry', 'expires', 'exp_dt'],
  // Issue Date
  DBD: ['dbd', 'iss', 'iss_date', 'issue_date', 'issued', 'iss_dt'],
  // Address Street / Full
  DAG: ['dag', 'street', 'street_address', 'address', 'addr1', 'address_line_1', 'street_1', 'address1', '123 street', '123_street'],
  // Address Line 2
  DAH: ['dah', 'street2', 'address_line_2', 'apt', 'suite', 'unit'],
  // City
  DAI: ['dai', 'city', 'town', 'municipality'],
  // State
  DAJ: ['daj', 'state', 'jurisdiction', 'st', 'province'],
  // ZIP / Postal
  DAK: ['dak', 'zip', 'zipcode', 'zip_code', 'postal_code', 'postal'],
  // Combined City, State Zip
  CITY_STATE_ZIP: ['city_state_zip', 'csz', 'city_st_zip', 'city_state_postal'],
  // Sex
  DBC: ['dbc', 'sex', 'gender'],
  // Height
  DAU: ['dau', 'height', 'hgt', 'ht'],
  // Weight
  DAW: ['daw', 'weight', 'wgt', 'wt'],
  // Eyes
  DAY: ['day', 'eyes', 'eye_color', 'eye'],
  // Hair
  DAZ: ['daz', 'hair', 'hair_color'],
  // Class
  DCA: ['dca', 'class', 'vehicle_class', 'dl_class', 'license_class', 'cls'],
  // Restrictions
  DCB: ['dcb', 'restrictions', 'rest', 'restriction', 'rst'],
  // Endorsements
  DCD: ['dcd', 'endorsements', 'end', 'endorsement', 'endr'],
  // Document Discriminator
  DCF: ['dcf', 'discriminator', 'doc_discriminator', 'audit', 'dd', 'doc_disc'],
  // Compliance / REAL ID
  DDA: ['dda', 'compliance', 'real_id', 'realid'],
  // Organ Donor
  DDK: ['ddk', 'donor', 'organ_donor'],
  // Veteran
  DDL: ['ddl', 'veteran', 'vet'],
  // Special Zones (Images/Bitmaps)
  PORTRAIT: ['photo big', 'photo_big', 'portrait', 'photo', 'picture', 'headshot', 'face', 'holder_photo', 'zone_ii', 'zone2', 'id_photo', 'main_photo'],
  GHOST_PORTRAIT: ['photo ghost', 'photo_ghost', 'ghost_portrait', 'ghost_photo', 'ghost_face', 'secondary_photo', 'ghost_pic', 'ghost'],
  SIGNATURE: ['signature', 'sig', 'sign', 'cardholder_sig', 'holder_signature', 'zone_vi', 'zone6'],
  BARCODE: ['pdf417', 'barcode', '2d_barcode', 'mrz', 'barcode_zone', 'zone_v', 'zone5', 'aamva_barcode', 'back_barcode']
};

/**
 * Clean layer name for heuristic matching
 */
function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Checks if layer name or parent path matches a protected design/security feature
 */
function isProtectedLayer(layer, pathStr = '') {
  const norm = normalizeName(layer.name) + ' ' + normalizeName(pathStr);
  for (const kw of PROTECTED_LAYER_KEYWORDS) {
    if (norm.includes(normalizeName(kw))) return true;
  }
  return false;
}

/**
 * Detects matching field key from layer name or content
 */
function detectFieldMapping(layer, pathStr = '') {
  const norm = normalizeName(layer.name);

  // If inside protected group, do not detect as data field
  if (isProtectedLayer(layer, pathStr)) {
    return { fieldKey: null, confidence: 0, method: 'protected' };
  }

  // 1. Exact alias matching first
  for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (norm === normalizeName(alias)) {
        return {
          fieldKey,
          confidence: 1.0,
          method: 'name_exact'
        };
      }
    }
  }

  // 2. Substring matching sorted by alias length descending
  const sortedAliases = [];
  for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      sortedAliases.push({ fieldKey, alias: normalizeName(alias) });
    }
  }
  sortedAliases.sort((a, b) => b.alias.length - a.alias.length);

  for (const { fieldKey, alias } of sortedAliases) {
    if (norm.startsWith(`${alias}_`) || norm.endsWith(`_${alias}`) || norm.includes(`_${alias}_`)) {
      return {
        fieldKey,
        confidence: 0.85,
        method: 'name_substring'
      };
    }
  }

  // 3. Heuristics based on text content (if it's a text layer)
  if (layer.text && layer.text.text) {
    const text = layer.text.text.trim();

    // Date heuristic (e.g. MM/DD/YYYY or YYYYMMDD)
    if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(text) || /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(text)) {
      if (norm.includes('birth') || norm.includes('dob')) return { fieldKey: 'DBB', confidence: 0.9, method: 'content_date' };
      if (norm.includes('exp')) return { fieldKey: 'DBA', confidence: 0.9, method: 'content_date' };
      if (norm.includes('iss')) return { fieldKey: 'DBD', confidence: 0.9, method: 'content_date' };
      return { fieldKey: 'DBB', confidence: 0.5, method: 'content_date_fallback' };
    }

    // Sex heuristic
    if (/^(M|F|X|1|2|9)$/i.test(text)) {
      return { fieldKey: 'DBC', confidence: 0.9, method: 'content_sex' };
    }

    // Height heuristic (e.g. 5'-10" or 5'-07'' or 68 in)
    if (/^(\d{1}['"\-]\s*\d{1,2}["']?|\d{3}\s*(in|cm))$/i.test(text)) {
      return { fieldKey: 'DAU', confidence: 0.95, method: 'content_height' };
    }

    // Eye color heuristic (BRO, BLU, HAZ, etc.)
    if (/^(BLK|BLU|BRO|GRY|GRN|HAZ|MAR|PNK|DIC|UNK)$/i.test(text)) {
      return { fieldKey: 'DAY', confidence: 0.9, method: 'content_eyes' };
    }

    // Standard Driver License pattern (e.g., Letter followed by 7-8 digits or 8-10 digits)
    if (/^[A-Z][0-9]{7,8}$/.test(text) || /^[0-9]{8,10}$/.test(text)) {
      return { fieldKey: 'DAQ', confidence: 0.8, method: 'content_dl_number' };
    }

    // Document Discriminator pattern (16-25 digits)
    if (/^[0-9]{16,25}$/.test(text)) {
      return { fieldKey: 'DCF', confidence: 0.85, method: 'content_discriminator' };
    }
  }

  // 4. Image layer heuristic
  if (!layer.text && (layer.canvas || (layer.right && layer.bottom))) {
    if (norm.includes('photo') || norm.includes('portrait') || norm.includes('face') || norm.includes('picture')) {
      if (norm.includes('ghost') || norm.includes('second') || norm.includes('small')) {
        return { fieldKey: 'GHOST_PORTRAIT', confidence: 0.9, method: 'image_ghost' };
      }
      return { fieldKey: 'PORTRAIT', confidence: 0.9, method: 'image_portrait' };
    }
    if (norm.includes('sig')) {
      return { fieldKey: 'SIGNATURE', confidence: 0.9, method: 'image_signature' };
    }
    if (norm.includes('bar') || norm.includes('pdf417') || norm.includes('mrz')) {
      return { fieldKey: 'BARCODE', confidence: 0.95, method: 'image_barcode' };
    }
  }

  return { fieldKey: null, confidence: 0, method: 'none' };
}

/**
 * Analyzes a PSD file and extracts structure, metadata, and detected fields
 */
function analyzePsdFile(filePathOrBuffer) {
  const buffer = Buffer.isBuffer(filePathOrBuffer) ? filePathOrBuffer : fs.readFileSync(filePathOrBuffer);
  const psd = readPsd(buffer, { skipCompositeImageData: false, skipLayerImageData: false });

  const summary = {
    width: psd.width,
    height: psd.height,
    channels: psd.channels,
    bitsPerChannel: psd.bitsPerChannel,
    colorMode: psd.colorMode,
    hasMultipleSides: false,
    sidesDetected: [],
    totalLayers: 0,
    textLayers: 0,
    imageLayers: 0,
    protectedLayers: 0,
    detectedFields: {},
    allLayers: []
  };

  // Detect multiple card sides (e.g. Front & Back groups)
  if (psd.children) {
    for (const child of psd.children) {
      const name = normalizeName(child.name);
      if (name === 'front' || name.includes('front_card')) {
        summary.sidesDetected.push('front');
      } else if (name === 'back' || name.includes('back_card')) {
        summary.sidesDetected.push('back');
      }
    }
  }
  summary.hasMultipleSides = summary.sidesDetected.length > 1;

  let idCounter = 1;

  function walk(layer, pathParts = []) {
    const currentPath = [...pathParts, layer.name];
    const pathStr = currentPath.join(' / ');
    const isGroup = !!(layer.children && layer.children.length);
    const hasText = !!layer.text;
    const isImage = !hasText && !isGroup && (!!layer.canvas || (layer.right !== undefined && layer.bottom !== undefined));
    const isProtected = isProtectedLayer(layer, pathStr);

    const layerInfo = {
      id: idCounter++,
      name: layer.name,
      path: pathStr,
      isGroup,
      hasText,
      isImage,
      isProtected,
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      blendMode: layer.blendMode || 'normal',
      visible: (layer.visible !== false) && !layer.hidden,
      left: layer.left || 0,
      top: layer.top || 0,
      right: layer.right || 0,
      bottom: layer.bottom || 0,
      width: (layer.right || 0) - (layer.left || 0),
      height: (layer.bottom || 0) - (layer.top || 0)
    };

    if (hasText) {
      summary.textLayers++;
      layerInfo.currentText = layer.text.text || '';
      layerInfo.fontName = layer.text.style?.font?.name || 'Default';
      layerInfo.fontSize = layer.text.style?.fontSize || 12;
      layerInfo.fillColor = layer.text.style?.fillColor || { r: 0, g: 0, b: 0 };
    } else if (isImage) {
      summary.imageLayers++;
    }

    if (isProtected) {
      summary.protectedLayers++;
    }

    // Perform field mapping detection
    if (!isGroup && !isProtected) {
      const detection = detectFieldMapping(layer, pathStr);
      if (detection.fieldKey) {
        layerInfo.detectedField = detection.fieldKey;
        layerInfo.detectionConfidence = detection.confidence;
        layerInfo.detectionMethod = detection.method;

        if (!summary.detectedFields[detection.fieldKey]) {
          summary.detectedFields[detection.fieldKey] = [];
        }
        summary.detectedFields[detection.fieldKey].push(layerInfo);
      }
    }

    summary.allLayers.push(layerInfo);
    summary.totalLayers++;

    if (layer.children) {
      for (const child of layer.children) {
        walk(child, currentPath);
      }
    }
  }

  if (psd.children) {
    for (const child of psd.children) {
      walk(child, []);
    }
  }

  return { psd, summary };
}

/**
 * Re-renders text layer's canvas with updated text, preserving font, size, color, auto-fitting
 */
function renderTextLayerCanvas(layer, newText) {
  const width = Math.max(1, (layer.right || 0) - (layer.left || 0));
  const height = Math.max(1, (layer.bottom || 0) - (layer.top || 0));
  const tCanvas = createCanvas(width, height);
  const tCtx = tCanvas.getContext('2d');

  const style = layer.text?.style || {};
  let fontSize = style.fontSize || Math.round(height * 0.75);
  const fontName = style.font?.name || 'Arial-BoldMT';
  const isBold = /bold/i.test(fontName);

  tCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;

  // Auto-fit calculation
  let textWidth = tCtx.measureText(newText).width;
  if (textWidth > width && width > 30) {
    const scale = width / textWidth;
    fontSize = Math.max(10, Math.floor(fontSize * scale * 0.96));
    tCtx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial, sans-serif`;
  }

  const fc = style.fillColor || { r: 0, g: 0, b: 0 };
  tCtx.fillStyle = `rgb(${Math.round(fc.r)}, ${Math.round(fc.g)}, ${Math.round(fc.b)})`;
  tCtx.textBaseline = 'middle';

  const just = layer.text?.paragraphStyle?.justification || 'left';
  let x = 0;
  if (just === 'center') {
    x = width / 2;
    tCtx.textAlign = 'center';
  } else if (just === 'right') {
    x = width;
    tCtx.textAlign = 'right';
  } else {
    x = 0;
    tCtx.textAlign = 'left';
  }

  // Handle multi-line strings
  if (newText.includes('\n') || newText.includes('\r')) {
    const lines = newText.split(/\r\n|\r|\n/);
    const lineHeight = fontSize * 1.18;
    const startY = (height - (lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, idx) => {
      tCtx.fillText(line, x, startY + idx * lineHeight);
    });
  } else {
    tCtx.fillText(newText, x, height / 2);
  }

  layer.text.text = newText;
  layer.canvas = tCanvas;
}

/**
 * Creates a high-resolution canvas with the rendered AAMVA PDF417 barcode
 */
async function generateBarcodeCanvas(barcodePayload, targetWidth = 400, targetHeight = 120) {
  const pngBuffer = await bwipjs.toBuffer({
    bcid: 'pdf417',
    text: barcodePayload,
    scale: 3,
    eclevel: 5,
    columns: 14,
    width: Math.round(targetWidth / 4),
    height: Math.round(targetHeight / 4)
  });

  const img = await loadImage(pngBuffer);
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Preserve aspect ratio and center
  const scale = Math.min((targetWidth - 10) / img.width, (targetHeight - 10) / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (targetWidth - w) / 2;
  const y = (targetHeight - h) / 2;

  ctx.drawImage(img, x, y, w, h);
  return canvas;
}

/**
 * Scales and crops an image buffer to fit exact target dimensions
 */
async function processLayerImage(imageInput, targetWidth, targetHeight, options = {}) {
  let img;
  if (typeof imageInput === 'string') {
    img = await loadImage(imageInput);
  } else if (Buffer.isBuffer(imageInput)) {
    img = await loadImage(imageInput);
  } else {
    img = imageInput;
  }

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  if (options.isGhost) {
    // Aspect-fit photo centered
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const x = (targetWidth - drawW) / 2;
    const y = (targetHeight - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);

    // Convert to high-key semi-transparent grayscale ghost
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const highKey = Math.min(255, Math.round(avg * 1.15));
      data[i] = highKey;
      data[i + 1] = highKey;
      data[i + 2] = highKey;
      data[i + 3] = Math.round(data[i + 3] * (options.opacity || 0.38));
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (options.isSignature) {
    // Fit signature preserving aspect ratio
    const scale = Math.min((targetWidth - 20) / img.width, (targetHeight - 20) / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const x = (targetWidth - drawW) / 2;
    const y = (targetHeight - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);
  } else {
    // Standard Portrait: Clean neutral background + aspect fit
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const x = (targetWidth - drawW) / 2;
    const y = (targetHeight - drawH) / 2;
    ctx.drawImage(img, x, y, drawW, drawH);
  }

  return canvas;
}

/**
 * Fills PSD layers with AAMVA data while strictly preserving original fonts,
 * styling, positions, and all design/security elements.
 */
async function fillPsd(psdInput, formData, customMappings = {}, assets = {}, options = {}) {
  let psd;
  if (typeof psdInput === 'string') {
    psd = readPsd(fs.readFileSync(psdInput), { skipCompositeImageData: false, skipLayerImageData: false });
  } else if (Buffer.isBuffer(psdInput)) {
    psd = readPsd(psdInput, { skipCompositeImageData: false, skipLayerImageData: false });
  } else {
    psd = psdInput;
  }

  // CRITICAL: Normalize bit depth to 8-bit to ensure safe writing of scanned/16-bit PSDs
  psd.bitsPerChannel = 8;

  const targetSide = options.targetSide || 'front'; // 'front' or 'back'

  // Pre-generate AAMVA 2025 barcode payload
  const barcodePayload = generateAamvaBarcodePayload(formData);

  // Pre-load default assets if none provided
  const portraitAsset = assets.photo || (fs.existsSync(DEFAULT_PORTRAIT_PATH) ? DEFAULT_PORTRAIT_PATH : null);
  const signatureAsset = assets.signature || (fs.existsSync(DEFAULT_SIGNATURE_PATH) ? DEFAULT_SIGNATURE_PATH : null);

  // Handle Multi-side PSDs (Front and Back groups)
  const frontGroup = psd.children?.find(c => {
    const n = normalizeName(c.name);
    return n === 'front' || n.includes('front_card');
  });
  const backGroup = psd.children?.find(c => {
    const n = normalizeName(c.name);
    return n === 'back' || n.includes('back_card');
  });

  if (frontGroup && backGroup) {
    if (targetSide === 'back') {
      frontGroup.visible = false;
      frontGroup.hidden = true;
      backGroup.visible = true;
      backGroup.hidden = false;
    } else {
      frontGroup.visible = true;
      frontGroup.hidden = false;
      backGroup.visible = false;
      backGroup.hidden = true;
    }
  }

  function getValueForField(fieldKey) {
    switch (fieldKey) {
      case 'DCS': return cleanAamvaText(formData.DCS || formData.lastName);
      case 'DAC': return cleanAamvaText(formData.DAC || formData.firstName);
      case 'DAD': return cleanAamvaText(formData.DAD || formData.middleName);
      case 'NAME_FIRST_MIDDLE': {
        const fn = cleanAamvaText(formData.DAC || formData.firstName);
        const mn = cleanAamvaText(formData.DAD || formData.middleName);
        return `${fn} ${mn}`.trim();
      }
      case 'NAME_FULL': {
        const parts = [
          formData.DAC || formData.firstName,
          formData.DAD || formData.middleName,
          formData.DCS || formData.lastName
        ].filter(Boolean);
        return cleanAamvaText(parts.join(' '));
      }
      case 'DBB': return formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob));
      case 'DBA': return formatDisplayDate(formatAamvaDate(formData.DBA || formData.expDate));
      case 'DBD': return formatDisplayDate(formatAamvaDate(formData.DBD || formData.issueDate));
      case 'DAQ': return cleanAamvaText(formData.DAQ || formData.licenseNumber);
      case 'DAG': return cleanAamvaText(formData.DAG || formData.address);
      case 'DAH': return cleanAamvaText(formData.DAH || formData.address2);
      case 'DAI': return cleanAamvaText(formData.DAI || formData.city);
      case 'DAJ': return cleanAamvaText(formData.DAJ || formData.state);
      case 'DAK': return cleanAamvaText(formData.DAK || formData.zip);
      case 'CITY_STATE_ZIP': {
        const c = cleanAamvaText(formData.DAI || formData.city);
        const s = cleanAamvaText(formData.DAJ || formData.state);
        const z = cleanAamvaText(formData.DAK || formData.zip);
        return `${c}, ${s} ${z}`.trim();
      }
      case 'DBC': {
        const s = String(formData.DBC || formData.sex || '1');
        return s === '1' ? 'M' : (s === '2' ? 'F' : 'X');
      }
      case 'DAU': return formatAamvaHeight(formData.DAU || formData.height);
      case 'DAW': return cleanAamvaText(formData.DAW || formData.weight);
      case 'DAY': return cleanAamvaText(formData.DAY || formData.eyes).slice(0, 3);
      case 'DAZ': return cleanAamvaText(formData.DAZ || formData.hair).slice(0, 3);
      case 'DCA': return cleanAamvaText(formData.DCA || formData.class || 'A');
      case 'DCB': return cleanAamvaText(formData.DCB || formData.restrictions || 'NONE');
      case 'DCD': return cleanAamvaText(formData.DCD || formData.endorsements || 'NONE');
      case 'DCF': return cleanAamvaText(formData.DCF || formData.discriminator);
      case 'DDA': return cleanAamvaText(formData.DDA || formData.complianceType);
      case 'DDK': return formData.DDK === '1' ? 'DONOR' : '';
      case 'DDL': return formData.DDL === '1' ? 'VETERAN' : '';
      default:
        return formData[fieldKey] !== undefined ? cleanAamvaText(formData[fieldKey]) : null;
    }
  }

  const modificationsLog = [];

  // Integrate AI Schema mappings if provided
  const effectiveMappings = { ...customMappings };
  if (options.aiSchema && options.aiSchema.sides) {
    const sideKey = targetSide === 'back' ? 'back' : 'front';
    const sideConfig = options.aiSchema.sides[sideKey];
    if (sideConfig) {
      if (sideConfig.fieldMappings) {
        for (const [code, info] of Object.entries(sideConfig.fieldMappings)) {
          const lName = typeof info === 'string' ? info : (info.layerName || info.name);
          if (lName) effectiveMappings[lName] = code;
        }
      }
      if (sideConfig.photoPlacement?.layerName) {
        effectiveMappings[sideConfig.photoPlacement.layerName] = 'PORTRAIT';
      }
      if (sideConfig.ghostPlacement?.layerName) {
        effectiveMappings[sideConfig.ghostPlacement.layerName] = 'GHOST_PORTRAIT';
      }
      if (sideConfig.signaturePlacement?.layerName) {
        effectiveMappings[sideConfig.signaturePlacement.layerName] = 'SIGNATURE';
      }
      if (sideConfig.barcodePlacement?.layerName) {
        effectiveMappings[sideConfig.barcodePlacement.layerName] = 'BARCODE';
      }
    }
  }

  // Recursive filler function
  async function fillLayer(layer, pathParts = []) {
    const currentPath = [...pathParts, layer.name];
    const pathStr = currentPath.join(' / ');

    // Skip hidden layers/groups
    if (layer.visible === false || layer.hidden === true) {
      return;
    }

    if (layer.children && layer.children.length) {
      for (const child of layer.children) {
        await fillLayer(child, currentPath);
      }
      return;
    }

    // Strictly skip protected design/security/static label elements
    if (isProtectedLayer(layer, pathStr)) {
      return;
    }

    // Determine mapped field: check AI/custom mappings first, then heuristic
    let mappedField = effectiveMappings[layer.name] || effectiveMappings[pathStr];
    if (!mappedField) {
      const detection = detectFieldMapping(layer, pathStr);
      if (detection.confidence >= 0.5) {
        mappedField = detection.fieldKey;
      }
    }

    if (!mappedField) return;

    // Handle Text Layer Replacement
    if (layer.text) {
      let newVal = getValueForField(mappedField);

      // Multi-line address handling (e.g. 123 STREET \n CITY, TX 77000)
      if (mappedField === 'DAG' && (layer.text.text.includes('\r') || layer.text.text.includes('\n'))) {
        const street = cleanAamvaText(formData.DAG || formData.address);
        const city = cleanAamvaText(formData.DAI || formData.city);
        const state = cleanAamvaText(formData.DAJ || formData.state);
        const zip = cleanAamvaText(formData.DAK || formData.zip).slice(0, 5);
        newVal = `${street}\r${city}, ${state} ${zip}`;
      }

      if (newVal !== null && newVal !== undefined) {
        const oldText = layer.text.text;
        renderTextLayerCanvas(layer, String(newVal));
        modificationsLog.push({
          layer: layer.name,
          type: 'text',
          field: mappedField,
          before: oldText,
          after: layer.text.text
        });
      }
      return;
    }

    // Handle Image / Bitmap Layer Replacements
    const width = (layer.right || 0) - (layer.left || 0);
    const height = (layer.bottom || 0) - (layer.top || 0);

    if (width <= 0 || height <= 0) return;

    // 1. Portrait Photo
    if (mappedField === 'PORTRAIT' && portraitAsset) {
      layer.canvas = await processLayerImage(portraitAsset, width, height, { isGhost: false });
      modificationsLog.push({
        layer: layer.name,
        type: 'image',
        field: 'PORTRAIT',
        dimensions: `${width}x${height}`
      });
      return;
    }

    // 2. Ghost Portrait
    if (mappedField === 'GHOST_PORTRAIT' && portraitAsset) {
      layer.canvas = await processLayerImage(portraitAsset, width, height, { isGhost: true, opacity: 0.38 });
      modificationsLog.push({
        layer: layer.name,
        type: 'image',
        field: 'GHOST_PORTRAIT',
        dimensions: `${width}x${height}`
      });
      return;
    }

    // 3. Signature
    if (mappedField === 'SIGNATURE' && signatureAsset) {
      layer.canvas = await processLayerImage(signatureAsset, width, height, { isSignature: true });
      modificationsLog.push({
        layer: layer.name,
        type: 'image',
        field: 'SIGNATURE',
        dimensions: `${width}x${height}`
      });
      return;
    }

    // 4. Zone V AAMVA Barcode
    if (mappedField === 'BARCODE') {
      layer.canvas = await generateBarcodeCanvas(barcodePayload, width, height);
      modificationsLog.push({
        layer: layer.name,
        type: 'barcode',
        field: 'BARCODE',
        dimensions: `${width}x${height}`,
        payloadLength: barcodePayload.length
      });
    }
  }

  if (psd.children) {
    for (const child of psd.children) {
      await fillLayer(child, []);
    }
  }

  // Render high-res composite image using canvas
  const compositeCanvas = createCanvas(psd.width, psd.height);
  const ctx = compositeCanvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, psd.width, psd.height);

  // Render all visible layers in stack order
  function renderLayerToCanvas(layer) {
    const isVisible = (layer.visible !== false) && !layer.hidden;
    if (!isVisible) return;

    if (layer.children && layer.children.length) {
      for (const child of layer.children) {
        renderLayerToCanvas(child);
      }
      return;
    }

    // CRITICAL: Skip layers with fillOpacity === 0 (e.g. vector masks, border boxes, clipping shapes)
    if (layer.fillOpacity === 0) {
      return;
    }

    ctx.save();
    if (layer.opacity !== undefined) {
      ctx.globalAlpha = layer.opacity;
    }
    if (layer.blendMode && layer.blendMode !== 'normal') {
      const blendMap = {
        'multiply': 'multiply',
        'screen': 'screen',
        'overlay': 'overlay',
        'darken': 'darken',
        'lighten': 'lighten',
        'color-dodge': 'color-dodge',
        'color-burn': 'color-burn',
        'hard-light': 'hard-light',
        'soft-light': 'soft-light',
        'difference': 'difference',
        'exclusion': 'exclusion'
      };
      if (blendMap[layer.blendMode]) {
        ctx.globalCompositeOperation = blendMap[layer.blendMode];
      }
    }

    if (layer.canvas) {
      ctx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
    }

    ctx.restore();
  }

  if (psd.children) {
    for (const child of psd.children) {
      renderLayerToCanvas(child);
    }
  }

  // Update PSD composite canvas for Adobe Photoshop thumbnail & preview
  psd.canvas = compositeCanvas;

  // Normalize bit depth
  psd.bitsPerChannel = 8;

  // 1. Generate Editable PSD Buffer (All layers, smart objects, and masks intact!)
  const psdBuffer = Buffer.from(writePsd(psd, { generateThumbnail: true }));

  // 2. Generate High-Resolution PNG Buffer
  const pngBuffer = compositeCanvas.toBuffer('image/png');

  // 3. Generate Print-Ready CR80 PDF (85.6 mm x 53.98 mm at standard card size)
  const pdfDoc = await PDFDocument.create();
  const cr80WidthPt = 242.64;
  const cr80HeightPt = 153.00;

  const page = pdfDoc.addPage([cr80WidthPt, cr80HeightPt]);
  const embeddedPng = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: cr80WidthPt,
    height: cr80HeightPt
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  return {
    psdBuffer,
    pngBuffer,
    pdfBuffer,
    barcodePayload,
    modificationsLog,
    width: psd.width,
    height: psd.height
  };
}

module.exports = {
  analyzePsdFile,
  fillPsd,
  generateBarcodeCanvas,
  processLayerImage,
  isProtectedLayer,
  detectFieldMapping
};
