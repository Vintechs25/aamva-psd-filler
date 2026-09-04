/**
 * Photopea ExtendScript Generator & Asset Preparer
 * Produces precise Photoshop scripts for the hidden Photopea rendering engine.
 */

const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const {
  formatAamvaDate,
  formatDisplayDate,
  formatAamvaHeight,
  cleanAamvaText,
  generateAamvaBarcodePayload
} = require('./aamva-standard');

/**
 * Pre-generates an AAMVA 2025 compliant PDF417 barcode Data URI
 */
async function generateBarcodeDataUri(formData, options = {}) {
  const payload = generateAamvaBarcodePayload(formData, options);
  const pngBuffer = await bwipjs.toBuffer({
    bcid: 'pdf417',
    text: payload,
    scale: 3,
    eclevel: 5,
    columns: 14,
    width: options.width ? Math.round(options.width / 10) : 100,
    height: options.height ? Math.round(options.height / 10) : 35
  });
  return {
    dataUri: `data:image/png;base64,${pngBuffer.toString('base64')}`,
    payload
  };
}

/**
 * Prepares portrait photo Data URI (clean neutral background, high resolution)
 */
async function preparePortraitDataUri(imageInput, targetW = 666, targetH = 775) {
  let img;
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:')) {
      img = await loadImage(Buffer.from(imageInput.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
    } else {
      img = await loadImage(imageInput);
    }
  } else if (Buffer.isBuffer(imageInput)) {
    img = await loadImage(imageInput);
  } else {
    return null;
  }

  const canvas = createCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d');

  // Crisp neutral background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, targetW, targetH);

  // Aspect-fit portrait centered
  const scale = Math.max(targetW / img.width, targetH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const x = (targetW - drawW) / 2;
  const y = (targetH - drawH) / 2;

  ctx.drawImage(img, x, y, drawW, drawH);
  return canvas.toDataURL('image/png');
}

/**
 * Prepares high-key, 38% alpha grayscale ghost portrait Data URI
 */
async function prepareGhostDataUri(imageInput, targetW = 237, targetH = 272) {
  let img;
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:')) {
      img = await loadImage(Buffer.from(imageInput.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
    } else {
      img = await loadImage(imageInput);
    }
  } else if (Buffer.isBuffer(imageInput)) {
    img = await loadImage(imageInput);
  } else {
    return null;
  }

  const canvas = createCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d');

  const scale = Math.max(targetW / img.width, targetH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const x = (targetW - drawW) / 2;
  const y = (targetH - drawH) / 2;
  ctx.drawImage(img, x, y, drawW, drawH);

  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrasted = Math.max(0, Math.min(255, Math.round((avg - 128) * 1.25 + 128)));
    data[i] = contrasted;
    data[i + 1] = contrasted;
    data[i + 2] = contrasted;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Prepares signature Data URI
 */
async function prepareSignatureDataUri(sigInput) {
  if (!sigInput) return null;
  if (typeof sigInput === 'string' && sigInput.startsWith('data:image/')) {
    return sigInput;
  }
  let buf = Buffer.isBuffer(sigInput) ? sigInput : (typeof sigInput === 'string' ? fs.readFileSync(sigInput) : null);
  if (!buf) return null;
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/**
 * Formats value for AAMVA element code
 */
function getValueForAamvaField(fieldKey, formData) {
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
    case 'DBB':
    case 'DBB_GHOST':
      return formatDisplayDate(formatAamvaDate(formData.DBB || formData.dob));
    case 'DBA':
      return formatDisplayDate(formatAamvaDate(formData.DBA || formData.expDate));
    case 'DBD':
      return formatDisplayDate(formatAamvaDate(formData.DBD || formData.issueDate));
    case 'DAQ':
      return cleanAamvaText(formData.DAQ || formData.licenseNumber);
    case 'DAG':
      return cleanAamvaText(formData.DAG || formData.address);
    case 'DAH':
      return cleanAamvaText(formData.DAH || formData.address2);
    case 'DAI':
      return cleanAamvaText(formData.DAI || formData.city);
    case 'DAJ':
      return cleanAamvaText(formData.DAJ || formData.state);
    case 'DAK':
      return cleanAamvaText(formData.DAK || formData.zip);
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
    case 'DAU':
      return formatAamvaHeight(formData.DAU || formData.height);
    case 'DAW':
      return cleanAamvaText(formData.DAW || formData.weight);
    case 'DAY':
      return cleanAamvaText(formData.DAY || formData.eyes).slice(0, 3);
    case 'DAZ':
      return cleanAamvaText(formData.DAZ || formData.hair).slice(0, 3);
    case 'DCA':
      return cleanAamvaText(formData.DCA || formData.class || 'A');
    case 'DCB':
      return cleanAamvaText(formData.DCB || formData.restrictions || 'NONE');
    case 'DCD':
      return cleanAamvaText(formData.DCD || formData.endorsements || 'NONE');
    case 'DCF':
      return cleanAamvaText(formData.DCF || formData.discriminator);
    case 'DDA':
      return cleanAamvaText(formData.DDA || formData.complianceType);
    default:
      return formData[fieldKey] !== undefined ? cleanAamvaText(formData[fieldKey]) : null;
  }
}

/**
 * Builds the Photopea script for executing all card modifications and exports
 */
function buildPhotopeaScript({
  formData,
  schema = {},
  assets = {},
  action = 'render_all' // 'render_all', 'render_front', 'render_back', 'save_psd'
}) {
  const frontMappings = schema.sides?.front?.fieldMappings || {};
  const backMappings = schema.sides?.back?.fieldMappings || {};

  // Build list of text replacements: [ { layerName, newText }, ... ]
  const frontTextOps = [];
  for (const [code, info] of Object.entries(frontMappings)) {
    const layerName = typeof info === 'string' ? info : (info.layerName || info.name);
    let val = getValueForAamvaField(code, formData);
    if (val !== null && val !== undefined && layerName) {
      // Special address formatting if original was multi-line
      if (code === 'DAG') {
        const city = cleanAamvaText(formData.DAI || formData.city || '');
        const state = cleanAamvaText(formData.DAJ || formData.state || 'TX');
        const zip = cleanAamvaText(formData.DAK || formData.zip || '').slice(0, 5);
        // Format as: STREET\rCITY, ST ZIP
        val = `${val}\\r${city}, ${state} ${zip}`.trim();
      }
      frontTextOps.push({
        code,
        layerName,
        newText: String(val).replace(/"/g, '\\"').replace(/\n/g, '\\r')
      });
    }
  }

  const backTextOps = [];
  for (const [code, info] of Object.entries(backMappings)) {
    const layerName = typeof info === 'string' ? info : (info.layerName || info.name);
    let val = getValueForAamvaField(code, formData);
    if (val !== null && val !== undefined && layerName) {
      backTextOps.push({
        code,
        layerName,
        newText: String(val).replace(/"/g, '\\"').replace(/\n/g, '\\r')
      });
    }
  }

  const cleanName = (str) => String(str || '').split('/').pop().trim();

  // Image targets from schema
  const photoLayerName = cleanName(schema.sides?.front?.photoPlacement?.layerName || 'Photo Big');
  const ghostLayerName = cleanName(schema.sides?.front?.ghostPlacement?.layerName || 'Photo Ghost');
  const sigLayerName = cleanName(schema.sides?.front?.signaturePlacement?.layerName || 'Signature');
  const barcodeLayerName = cleanName(schema.sides?.back?.barcodePlacement?.layerName || 'PDF417_A1181102_202105110338');

  const script = `
(function() {
  var doc = app.activeDocument;
  if (!doc) {
    app.echoToOE("ERROR: No active document found in Photopea");
    return;
  }

  // Helper: Find layer recursively by name or path
  function findLayerByName(parent, name) {
    if (!parent || !parent.layers) return null;
    var parts = String(name).split('/');
    var leaf = parts[parts.length - 1].replace(/^\\s+|\\s+$/g, '').toLowerCase();
    for (var i = 0; i < parent.layers.length; i++) {
      var l = parent.layers[i];
      if (l.name.toLowerCase() === leaf) return l;
      if (l.typename === "LayerSet" || (l.layers && l.layers.length > 0)) {
        var found = findLayerByName(l, name);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper: Update text layer while preserving formatting
  function updateText(parent, layerName, newText) {
    var l = findLayerByName(parent, layerName);
    if (l) {
      if (l.kind == LayerKind.TEXT) {
        l.textItem.contents = newText;
        return true;
      }
    }
    return false;
  }

  // Helper: Replace image layer with Smart Object data URI
  function replaceImage(parent, targetName, dataUri, options) {
    if (!dataUri) return false;
    var target = findLayerByName(parent, targetName);
    if (!target) return false;

    var tb = target.bounds;
    var tLeft = tb[0].value;
    var tTop = tb[1].value;
    var tW = tb[2].value - tLeft;
    var tH = tb[3].value - tTop;
    var tOpacity = target.opacity;
    var tBlend = target.blendMode;
    var tGrouped = target.grouped;

    // Open dataUri as smart object layer
    app.open(dataUri, null, true);
    var newL = doc.activeLayer;
    if (!newL) return false;

    var cb = newL.bounds;
    var cW = cb[2].value - cb[0].value;
    var cH = cb[3].value - cb[1].value;

    if (cW > 0 && cH > 0) {
      var scaleX = (tW / cW) * 100;
      var scaleY = (tH / cH) * 100;
      newL.resize(scaleX, scaleY, AnchorPosition.TOPLEFT);

      var nb = newL.bounds;
      var dx = tLeft - nb[0].value;
      var dy = tTop - nb[1].value;
      newL.translate(dx, dy);
    }

    try {
      newL.move(target, ElementPlacement.PLACEBEFORE);
    } catch(e) {}

    if (options && options.opacity !== undefined) {
      newL.opacity = options.opacity;
    } else {
      newL.opacity = tOpacity;
    }

    if (options && options.blendMode) {
      newL.blendMode = options.blendMode;
    } else {
      newL.blendMode = tBlend;
    }

    if (tGrouped) newL.grouped = true;
    target.visible = false;
    return true;
  }

  // Locate Front and Back groups if multi-side
  var frontGroup = findLayerByName(doc, "Front");
  var backGroup = findLayerByName(doc, "Back");

  // Hide obstructing border guides if present
  var frontBorder = findLayerByName(frontGroup || doc, "border");
  if (frontBorder) frontBorder.visible = false;
  var backBorder = findLayerByName(backGroup || doc, "border");
  if (backBorder) backBorder.visible = false;

  // ========================================================
  // 1. UPDATE FRONT CARD
  // ========================================================
  if (frontGroup) {
    frontGroup.visible = true;
  }
  if (backGroup) {
    backGroup.visible = false;
  }

  // Front Text Replacements
  var frontOps = ${JSON.stringify(frontTextOps)};
  for (var i = 0; i < frontOps.length; i++) {
    var op = frontOps[i];
    var updated = updateText(frontGroup || doc, op.layerName, op.newText);
    if (!updated) {
      // Fallback: search whole document
      updateText(doc, op.layerName, op.newText);
    }
  }

  // Portrait Photo Placement
  ${assets.portrait ? `
  replaceImage(frontGroup || doc, "${photoLayerName}", "${assets.portrait}", { opacity: 100 });
  ` : ''}

  // Ghost Portrait Placement
  ${assets.ghost ? `
  replaceImage(frontGroup || doc, "${ghostLayerName}", "${assets.ghost}", { opacity: 38 });
  ` : ''}

  // Signature Placement
  ${assets.signature ? `
  replaceImage(frontGroup || doc, "${sigLayerName}", "${assets.signature}", { opacity: 100 });
  ` : ''}

  // ========================================================
  // 2. UPDATE BACK CARD (if present)
  // ========================================================
  if (backGroup) {
    var backOps = ${JSON.stringify(backTextOps)};
    for (var j = 0; j < backOps.length; j++) {
      var bOp = backOps[j];
      updateText(backGroup, bOp.layerName, bOp.newText);
    }

    // AAMVA Zone V Barcode Placement
    ${assets.barcode ? `
    replaceImage(backGroup, "${barcodeLayerName}", "${assets.barcode}", { opacity: 100 });
    ` : ''}
  }

  app.echoToOE("MODIFICATIONS_COMPLETE");

  // ========================================================
  // 3. EXPORTS DISPATCH
  // ========================================================
  ${action === 'render_front' ? `
    if (frontGroup) frontGroup.visible = true;
    if (backGroup) backGroup.visible = false;
    var fb = findLayerByName(frontGroup || doc, "border");
    if (fb) fb.visible = false;
    app.echoToOE("EXPORTING_FRONT_PNG");
    doc.saveToOE("png");
  ` : action === 'render_back' ? `
    if (frontGroup) frontGroup.visible = false;
    if (backGroup) backGroup.visible = true;
    var bb = findLayerByName(backGroup || doc, "border");
    if (bb) bb.visible = false;
    app.echoToOE("EXPORTING_BACK_PNG");
    doc.saveToOE("png");
  ` : action === 'save_psd' ? `
    if (frontGroup) frontGroup.visible = true;
    if (backGroup) backGroup.visible = false;
    var fb = findLayerByName(frontGroup || doc, "border");
    if (fb) fb.visible = false;
    var bb = findLayerByName(backGroup || doc, "border");
    if (bb) bb.visible = false;
    app.echoToOE("EXPORTING_PSD");
    doc.saveToOE("psd");
  ` : `
    var fb = findLayerByName(doc, "border");
    if (fb) fb.visible = false;
    app.echoToOE("EXPORTING_PNG");
    doc.saveToOE("png");
  `}
})();
`;

  return script;
}

module.exports = {
  generateBarcodeDataUri,
  preparePortraitDataUri,
  prepareGhostDataUri,
  prepareSignatureDataUri,
  getValueForAamvaField,
  buildPhotopeaScript
};
