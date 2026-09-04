/**
 * AAMVA DL/ID PSD Filler Application Server
 * High-performance, offline-capable REST API & Web GUI
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
// Load .env configuration
if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.resolve(__dirname, '.env'))) {
  try { process.loadEnvFile(path.resolve(__dirname, '.env')); } catch (e) {}
}

const {
  JURISDICTION_IIN_MAP,
  AAMVA_ELEMENTS,
  PRESET_PROFILES,
  generateAamvaBarcodePayload,
  decodeAamvaBarcode,
  validateAamvaData,
  cleanAamvaText,
  parseAamvaXml,
  calculateAutoFields,
  calculateExpirationDate,
  generateDocumentDiscriminator
} = require('./src/aamva-standard');
const {
  analyzePsdFile,
  fillPsd
} = require('./src/psd-engine');
const {
  renderWithPhotopea
} = require('./src/photopea-engine');
const {
  analyzeTemplateWithGemini
} = require('./src/ai-template-analyzer');
const {
  ensureSampleTemplates
} = require('./src/sample-psd-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up directories
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const SAMPLES_DIR = path.join(__dirname, 'samples');
const OUTPUTS_DIR = path.join(__dirname, 'outputs');
const PUBLIC_DIR = path.join(__dirname, 'public');

[UPLOADS_DIR, SAMPLES_DIR, OUTPUTS_DIR, PUBLIC_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure sample templates are generated
ensureSampleTemplates(SAMPLES_DIR);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(PUBLIC_DIR));

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 150 * 1024 * 1024 } }); // 150MB PSD limit

// In-memory store for generated jobs
const jobs = new Map();

// --- API ENDPOINTS ---

/**
 * GET /api/jurisdictions
 * Returns all 50 states + territories with IINs
 */
app.get('/api/jurisdictions', (req, res) => {
  res.json({ success: true, jurisdictions: JURISDICTION_IIN_MAP });
});

/**
 * GET /api/presets
 * Returns pre-built test cardholder profiles
 */
app.get('/api/presets', (req, res) => {
  res.json({ success: true, presets: PRESET_PROFILES });
});

/**
 * POST /api/parse-xml
 * Parses raw XML (e.g. from barcode scanner or AAMVA XML dump) into form-compatible cardholder data
 */
app.post('/api/parse-xml', (req, res) => {
  try {
    const { xml } = req.body;
    if (!xml) return res.status(400).json({ success: false, error: 'No XML provided' });
    const parsed = parseAamvaXml(xml);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auto-calculate
 * Intelligently calculates missing fields (Expiration Date, DCF, Country, Normalizations)
 */
app.post('/api/auto-calculate', (req, res) => {
  try {
    const { formData } = req.body;
    const result = calculateAutoFields(formData || {});
    res.json({ success: true, data: result.data, modifications: result.modifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/elements
 * Returns full AAMVA 2025 element dictionary
 */
app.get('/api/elements', (req, res) => {
  res.json({ success: true, elements: AAMVA_ELEMENTS });
});

/**
 * GET /api/sample-templates
 * Returns available built-in sample PSD templates
 */
app.get('/api/sample-templates', (req, res) => {
  const frontPath = path.join(SAMPLES_DIR, 'CR80_AAMVA_Front_Template.psd');
  const backPath = path.join(SAMPLES_DIR, 'CR80_AAMVA_Back_Template.psd');

  res.json({
    success: true,
    samples: [
      {
        id: 'sample_front',
        name: 'CR80 AAMVA DL/ID Front Template (Multi-Layer Security)',
        filename: 'CR80_AAMVA_Front_Template.psd',
        exists: fs.existsSync(frontPath),
        side: 'front'
      },
      {
        id: 'sample_back',
        name: 'CR80 AAMVA DL/ID Back Template (Zone V PDF417 Barcode)',
        filename: 'CR80_AAMVA_Back_Template.psd',
        exists: fs.existsSync(backPath),
        side: 'back'
      }
    ]
  });
});

/**
 * POST /api/analyze
 * Analyzes an uploaded PSD or built-in sample template
 */
app.post('/api/analyze', upload.single('psdFile'), async (req, res) => {
  try {
    let filePath;
    let originalName = 'template.psd';

    if (req.file) {
      filePath = req.file.path;
      originalName = req.file.originalname;
    } else if (req.body.sampleId) {
      if (req.body.sampleId === 'sample_front') {
        filePath = path.join(SAMPLES_DIR, 'CR80_AAMVA_Front_Template.psd');
        originalName = 'CR80_AAMVA_Front_Template.psd';
      } else if (req.body.sampleId === 'sample_back') {
        filePath = path.join(SAMPLES_DIR, 'CR80_AAMVA_Back_Template.psd');
        originalName = 'CR80_AAMVA_Back_Template.psd';
      } else {
        return res.status(400).json({ success: false, error: 'Unknown sample template ID' });
      }
    } else {
      return res.status(400).json({ success: false, error: 'No PSD file or sampleId provided' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Template file not found' });
    }

    const { summary } = analyzePsdFile(filePath);

    res.json({
      success: true,
      filePath: path.relative(__dirname, filePath),
      originalName,
      summary
    });
  } catch (err) {
    console.error('Error analyzing PSD:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/analyze-template
 * Runs Google Gemini AI multimodal layer analysis on a PSD template
 */
app.post('/api/ai/analyze-template', upload.single('referenceImage'), async (req, res) => {
  try {
    const { filePath, templatePath } = req.body;
    const targetPath = filePath || templatePath;
    if (!targetPath) {
      return res.status(400).json({ success: false, error: 'filePath or templatePath is required' });
    }

    const fullPath = path.isAbsolute(targetPath) ? targetPath : path.resolve(__dirname, targetPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Target PSD file does not exist' });
    }

    // Check for reference image (file, base64, or path)
    let referenceImage = null;
    if (req.file) {
      referenceImage = fs.readFileSync(req.file.path);
    } else if (req.body.referenceImageBase64) {
      const b64 = req.body.referenceImageBase64.replace(/^data:image\/\w+;base64,/, '');
      referenceImage = Buffer.from(b64, 'base64');
    } else if (req.body.referenceImagePath && fs.existsSync(req.body.referenceImagePath)) {
      referenceImage = req.body.referenceImagePath;
    }

    console.log(`[AI Endpoint] Analyzing PSD layers with Gemini: ${path.basename(fullPath)} (Reference Image: ${!!referenceImage})`);
    const { summary } = analyzePsdFile(fullPath);
    const { schema, modelUsed } = await analyzeTemplateWithGemini(summary, referenceImage);

    res.json({
      success: true,
      modelUsed,
      schema,
      summary
    });
  } catch (err) {
    console.error('[AI Endpoint] Error during Gemini analysis:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/generate-barcode
 * Generates raw AAMVA 2025 PDF417 payload and preview image
 */
app.post('/api/generate-barcode', async (req, res) => {
  try {
    const data = req.body || {};
    const payload = generateAamvaBarcodePayload(data);
    const decoded = decodeAamvaBarcode(payload);
    const validation = validateAamvaData(data);

    // Generate preview PNG via bwip-js
    const bwipjs = require('bwip-js');
    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'pdf417',
      text: payload,
      scale: 2,
      eclevel: 5,
      columns: 14,
      width: 100,
      height: 35
    });

    res.json({
      success: true,
      payload,
      payloadLength: payload.length,
      decoded,
      validation,
      previewBase64: `data:image/png;base64,${pngBuffer.toString('base64')}`
    });
  } catch (err) {
    console.error('Error generating barcode:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/validate
 * Validates cardholder details against AAMVA standards
 */
app.post('/api/validate', (req, res) => {
  const data = req.body || {};
  const result = validateAamvaData(data);
  res.json({ success: true, ...result });
});

/**
 * POST /api/fill
 * Main processing endpoint: fills PSD, updates text, places photo, signature, and AAMVA barcode
 */
app.post('/api/fill', upload.fields([
  { name: 'psdFile', maxCount: 1 },
  { name: 'photoFile', maxCount: 1 },
  { name: 'signatureFile', maxCount: 1 }
]), async (req, res) => {
  try {
    let psdPath;
    let originalName = 'Card_Template.psd';

    if (req.files && req.files['psdFile'] && req.files['psdFile'][0]) {
      psdPath = req.files['psdFile'][0].path;
      originalName = req.files['psdFile'][0].originalname;
    } else if (req.body.templatePath) {
      psdPath = path.resolve(__dirname, req.body.templatePath);
      originalName = path.basename(psdPath);
    } else if (req.body.sampleId) {
      if (req.body.sampleId === 'sample_front') {
        psdPath = path.join(SAMPLES_DIR, 'CR80_AAMVA_Front_Template.psd');
        originalName = 'CR80_AAMVA_Front_Template.psd';
      } else if (req.body.sampleId === 'sample_back') {
        psdPath = path.join(SAMPLES_DIR, 'CR80_AAMVA_Back_Template.psd');
        originalName = 'CR80_AAMVA_Back_Template.psd';
      }
    }

    if (!psdPath || !fs.existsSync(psdPath)) {
      return res.status(400).json({ success: false, error: 'Valid PSD file or template required' });
    }

    // Parse form data and mappings
    let formData = {};
    if (req.body.formData) {
      try {
        formData = typeof req.body.formData === 'string' ? JSON.parse(req.body.formData) : req.body.formData;
      } catch (e) {
        formData = req.body;
      }
    } else {
      formData = req.body;
    }

    let customMappings = {};
    if (req.body.customMappings) {
      try {
        customMappings = typeof req.body.customMappings === 'string' ? JSON.parse(req.body.customMappings) : req.body.customMappings;
      } catch (e) {
        customMappings = {};
      }
    }

    // Prepare photo and signature asset buffers
    const assets = {};

    // Photo
    if (req.files && req.files['photoFile'] && req.files['photoFile'][0]) {
      assets.photo = fs.readFileSync(req.files['photoFile'][0].path);
    } else if (req.body.photoBase64) {
      const b64Data = req.body.photoBase64.replace(/^data:image\/\w+;base64,/, '');
      assets.photo = Buffer.from(b64Data, 'base64');
    }

    // Signature
    if (req.files && req.files['signatureFile'] && req.files['signatureFile'][0]) {
      assets.signature = fs.readFileSync(req.files['signatureFile'][0].path);
    } else if (req.body.signatureBase64) {
      const b64Data = req.body.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
      assets.signature = Buffer.from(b64Data, 'base64');
    }

    let aiSchema = null;
    if (req.body.aiSchema) {
      try {
        aiSchema = typeof req.body.aiSchema === 'string' ? JSON.parse(req.body.aiSchema) : req.body.aiSchema;
      } catch (e) {
        aiSchema = null;
      }
    }

    console.log(`Starting Photopea PSD rendering for: ${originalName} (AI Schema: ${!!aiSchema})`);
    console.log(`Cardholder: ${formData.DAC || formData.firstName} ${formData.DCS || formData.lastName}`);

    let fillResult;
    try {
      fillResult = await renderWithPhotopea(psdPath, formData, {
        schema: aiSchema,
        assets
      });
    } catch (ppErr) {
      console.warn(`[PhotopeaEngine Warning] Photopea failed (${ppErr.message}), falling back to custom PSD engine.`);
      const targetSide = req.body.targetSide || 'front';
      fillResult = await fillPsd(psdPath, formData, customMappings, assets, { targetSide, aiSchema });
    }

    // Save output files
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const jobDir = path.join(OUTPUTS_DIR, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const baseName = path.parse(originalName).name;
    const psdOutName = `${baseName}_Filled.psd`;
    const frontPngName = `${baseName}_Front.png`;
    const backPngName = `${baseName}_Back.png`;
    const pdfOutName = `${baseName}_PrintReady_CR80.pdf`;

    const psdOutPath = path.join(jobDir, psdOutName);
    const frontPngPath = path.join(jobDir, frontPngName);
    const backPngPath = path.join(jobDir, backPngName);
    const pdfOutPath = path.join(jobDir, pdfOutName);

    fs.writeFileSync(psdOutPath, fillResult.psdBuffer);
    fs.writeFileSync(frontPngPath, fillResult.frontPngBuffer || fillResult.pngBuffer);
    if (fillResult.backPngBuffer) {
      fs.writeFileSync(backPngPath, fillResult.backPngBuffer);
    }
    fs.writeFileSync(pdfOutPath, fillResult.pdfBuffer);

    // Store job metadata
    const jobInfo = {
      jobId,
      createdAt: new Date().toISOString(),
      originalName,
      files: {
        psd: { name: psdOutName, path: psdOutPath, size: fillResult.psdBuffer.length },
        png: { name: frontPngName, path: frontPngPath, size: (fillResult.frontPngBuffer || fillResult.pngBuffer).length },
        frontPng: { name: frontPngName, path: frontPngPath, size: (fillResult.frontPngBuffer || fillResult.pngBuffer).length },
        ...(fillResult.backPngBuffer ? { backPng: { name: backPngName, path: backPngPath, size: fillResult.backPngBuffer.length } } : {}),
        pdf: { name: pdfOutName, path: pdfOutPath, size: fillResult.pdfBuffer.length }
      },
      modificationsLog: fillResult.modificationsLog || [],
      barcodePayload: fillResult.barcodePayload,
      width: fillResult.width || 3001,
      height: fillResult.height || 1803
    };
    jobs.set(jobId, jobInfo);

    // Return response with high-res Front & Back previews
    const frontBuf = fillResult.frontPngBuffer || fillResult.pngBuffer;
    res.json({
      success: true,
      jobId,
      previewBase64: `data:image/png;base64,${frontBuf.toString('base64')}`,
      backPreviewBase64: fillResult.backPngBuffer ? `data:image/png;base64,${fillResult.backPngBuffer.toString('base64')}` : null,
      hasBackSide: !!fillResult.backPngBuffer,
      modificationsCount: (fillResult.modificationsLog || []).length,
      modificationsLog: fillResult.modificationsLog || [],
      barcodePayload: fillResult.barcodePayload,
      files: {
        psdUrl: `/api/download/${jobId}/psd`,
        pngUrl: `/api/download/${jobId}/png`,
        frontPngUrl: `/api/download/${jobId}/front-png`,
        backPngUrl: fillResult.backPngBuffer ? `/api/download/${jobId}/back-png` : null,
        pdfUrl: `/api/download/${jobId}/pdf`,
        zipUrl: `/api/download/${jobId}/zip`
      }
    });
  } catch (err) {
    console.error('Error executing rendering pipeline:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/download/:jobId/:format
 * Serves generated output files
 */
app.get('/api/download/:jobId/:format', (req, res) => {
  const { jobId, format } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found or expired' });
  }

  if (format === 'psd') {
    return res.download(job.files.psd.path, job.files.psd.name);
  }
  if (format === 'png' || format === 'front-png') {
    return res.download(job.files.png.path, job.files.png.name);
  }
  if (format === 'back-png') {
    if (job.files.backPng) {
      return res.download(job.files.backPng.path, job.files.backPng.name);
    }
    return res.status(404).json({ success: false, error: 'Back PNG not available for this card' });
  }
  if (format === 'pdf') {
    return res.download(job.files.pdf.path, job.files.pdf.name);
  }

  if (format === 'zip') {
    res.attachment(`${jobId}_Complete_Package.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.file(job.files.psd.path, { name: job.files.psd.name });
    archive.file(job.files.png.path, { name: job.files.png.name });
    if (job.files.backPng) {
      archive.file(job.files.backPng.path, { name: job.files.backPng.name });
    }
    archive.file(job.files.pdf.path, { name: job.files.pdf.name });

    // Include audit manifest
    const manifest = {
      jobId: job.jobId,
      createdAt: job.createdAt,
      modifications: job.modificationsLog,
      barcodePayload: job.barcodePayload
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'audit_manifest.json' });

    return archive.finalize();
  }

  res.status(400).json({ success: false, error: 'Unsupported format' });
});

// Start Server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log(` AAMVA Auto DL/ID PSD Filler (2025 Edition) Running!`);
  console.log(` Web GUI available at: http://localhost:${PORT}`);
  console.log('================================================================');
});
