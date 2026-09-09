/**
 * AAMVA Auto DL/ID PSD Filler Client Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // Application State
  const state = {
    currentStep: 1,
    psdFile: null,
    sampleId: null,
    templateSummary: null,
    customMappings: {},
    refImgFile: null,
    photoBase64: null,
    signatureBase64: null,
    barcodePayload: null,
    jobData: null,
    frontPreviewBase64: null,
    backPreviewBase64: null,
    currentPreviewSide: 'front',
    jurisdictions: {},
    presets: {}
  };

  // DOM Elements
  const dropZone = document.getElementById('dropZone');
  const psdFileInput = document.getElementById('psdFileInput');
  const btnLoadFrontSample = document.getElementById('btnLoadFrontSample');
  const btnLoadBackSample = document.getElementById('btnLoadBackSample');
  const layerTable = document.getElementById('layerTable');
  const layerTableBody = document.getElementById('layerTableBody');
  const emptyLayerState = document.getElementById('emptyLayerState');
  const psdStatsBadges = document.getElementById('psdStatsBadges');
  const badgeDim = document.getElementById('badgeDim');
  const badgeLayers = document.getElementById('badgeLayers');
  const badgeProtected = document.getElementById('badgeProtected');
  const btnContinueToForm = document.getElementById('btnContinueToForm');
  const detectedStatusText = document.getElementById('detectedStatusText');

  const presetSelect = document.getElementById('presetSelect');
  const btnClearForm = document.getElementById('btnClearForm');
  const aamvaForm = document.getElementById('aamvaForm');
  const field_DAJ = document.getElementById('field_DAJ');
  const validationAlerts = document.getElementById('validationAlerts');

  const photoFileInput = document.getElementById('photoFileInput');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const photoPlaceholder = document.getElementById('photoPlaceholder');
  const chkAutoGhost = document.getElementById('chkAutoGhost');

  // Signature Studio DOM Elements
  const tabBtnSigDraw = document.getElementById('tabBtnSigDraw');
  const tabBtnSigGenerate = document.getElementById('tabBtnSigGenerate');
  const tabBtnSigUpload = document.getElementById('tabBtnSigUpload');
  const sigPanelDraw = document.getElementById('sigPanelDraw');
  const sigPanelGenerate = document.getElementById('sigPanelGenerate');
  const sigPanelUpload = document.getElementById('sigPanelUpload');

  const sigCanvas = document.getElementById('sigCanvas');
  const btnUndoSignature = document.getElementById('btnUndoSignature');
  const btnClearSignature = document.getElementById('btnClearSignature');
  const btnDownloadDrawnSig = document.getElementById('btnDownloadDrawnSig');
  const sigStrokeCount = document.getElementById('sigStrokeCount');

  const sigGenNameInput = document.getElementById('sigGenNameInput');
  const btnSyncNameFromForm = document.getElementById('btnSyncNameFromForm');
  const sigGenFontSelect = document.getElementById('sigGenFontSelect');
  const chkSigUnderline = document.getElementById('chkSigUnderline');
  const chkSigInitialsOnly = document.getElementById('chkSigInitialsOnly');
  const rngSigSlant = document.getElementById('rngSigSlant');
  const btnRegenerateSig = document.getElementById('btnRegenerateSig');
  const btnDownloadGeneratedSig = document.getElementById('btnDownloadGeneratedSig');
  const sigGenCanvas = document.getElementById('sigGenCanvas');

  const sigUploadDropZone = document.getElementById('sigUploadDropZone');
  const sigFileInput = document.getElementById('sigFileInput');
  const sigUploadStatus = document.getElementById('sigUploadStatus');
  const sigUploadPreviewImg = document.getElementById('sigUploadPreviewImg');
  const sigUploadPlaceholder = document.getElementById('sigUploadPlaceholder');
  const chkAutoRemoveBg = document.getElementById('chkAutoRemoveBg');
  const chkNormalizeInk = document.getElementById('chkNormalizeInk');
  const rngBgThreshold = document.getElementById('rngBgThreshold');
  const btnDownloadUploadedSig = document.getElementById('btnDownloadUploadedSig');

  const activeSigBadge = document.getElementById('activeSigBadge');
  const activeSigText = document.getElementById('activeSigText');
  const btnDownloadActiveSig = document.getElementById('btnDownloadActiveSig');
  const btnResetActiveSig = document.getElementById('btnResetActiveSig');

  const barcodePreviewImg = document.getElementById('barcodePreviewImg');
  const barcodePayloadBox = document.getElementById('barcodePayloadBox');
  const barcodeByteCount = document.getElementById('barcodeByteCount');
  const btnRefreshBarcode = document.getElementById('btnRefreshBarcode');
  const btnExecuteFill = document.getElementById('btnExecuteFill');

   const outputResultsCard = document.getElementById('outputResultsCard');
  const finalCardPreview = document.getElementById('finalCardPreview');
  const outputSubtitle = document.getElementById('outputSubtitle');
  const outputModCount = document.getElementById('outputModCount');
  const btnViewFront = document.getElementById('btnViewFront');
  const btnViewBack = document.getElementById('btnViewBack');
  const downloadFrontPngBtn = document.getElementById('downloadFrontPngBtn');
  const downloadBackPngBtn = document.getElementById('downloadBackPngBtn');
  const downloadPsdBtn = document.getElementById('downloadPsdBtn');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const auditTableBody = document.getElementById('auditTableBody');

  const refImgDropZone = document.getElementById('refImgDropZone');
  const refImgFileInput = document.getElementById('refImgFileInput');
  const refImgText = document.getElementById('refImgText');

  const docsModal = document.getElementById('docsModal');
  const btnDocsModal = document.getElementById('btnDocsModal');
  const btnCloseDocsModal = document.getElementById('btnCloseDocsModal');

  const btnAutoCalculateAll = document.getElementById('btnAutoCalculateAll');
  const btnOpenXmlModal = document.getElementById('btnOpenXmlModal');
  const xmlImportModal = document.getElementById('xmlImportModal');
  const btnCloseXmlModal = document.getElementById('btnCloseXmlModal');
  const btnCancelXmlImport = document.getElementById('btnCancelXmlImport');
  const btnConfirmXmlImport = document.getElementById('btnConfirmXmlImport');
  const xmlImportInput = document.getElementById('xmlImportInput');

  const btnGenDcf = document.getElementById('btnGenDcf');
  const btnSetIssueToday = document.getElementById('btnSetIssueToday');
  const btnCalcExpiry = document.getElementById('btnCalcExpiry');

  // Step Navigation Elements
  const stepTabs = [
    document.getElementById('stepTab1'),
    document.getElementById('stepTab2'),
    document.getElementById('stepTab3'),
    document.getElementById('stepTab4')
  ];
  const stepSections = [
    document.getElementById('sectionStep1'),
    document.getElementById('sectionStep2'),
    document.getElementById('sectionStep3'),
    document.getElementById('sectionStep4')
  ];

  function setStep(stepNum) {
    state.currentStep = stepNum;
    stepTabs.forEach((tab, idx) => {
      if (idx + 1 === stepNum) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    stepSections.forEach((sec, idx) => {
      if (idx + 1 === stepNum) {
        sec.classList.remove('hidden');
      } else {
        sec.classList.add('hidden');
      }
    });

    if (stepNum === 3 && typeof window.__onEnterStep3 === 'function') {
      window.__onEnterStep3();
    }
    if (stepNum === 4) {
      updateBarcodePreview();
    }

    if (window.lucide) lucide.createIcons();
  }

  stepTabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => setStep(idx + 1));
  });

  document.getElementById('btnBackToStep1').addEventListener('click', () => setStep(1));
  document.getElementById('btnContinueToAssets').addEventListener('click', () => setStep(3));
  document.getElementById('btnBackToStep2').addEventListener('click', () => setStep(2));
  document.getElementById('btnContinueToOutput').addEventListener('click', () => setStep(4));
  btnContinueToForm.addEventListener('click', () => setStep(2));

  // --- Modal Logic ---
  btnDocsModal.addEventListener('click', () => {
    docsModal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  });
  btnCloseDocsModal.addEventListener('click', () => docsModal.classList.add('hidden'));
  docsModal.addEventListener('click', (e) => {
    if (e.target === docsModal) docsModal.classList.add('hidden');
  });

  // --- AI Settings Modal Logic ---
  const btnAiSettingsModal = document.getElementById('btnAiSettingsModal');
  const aiSettingsModal = document.getElementById('aiSettingsModal');
  const btnCloseAiSettingsModal = document.getElementById('btnCloseAiSettingsModal');
  const btnCancelAiSettings = document.getElementById('btnCancelAiSettings');
  const btnSaveAiSettings = document.getElementById('btnSaveAiSettings');
  const openRouterApiKeyInput = document.getElementById('openRouterApiKeyInput');
  const aiSettingsStatusMsg = document.getElementById('aiSettingsStatusMsg');
  const aiSettingsBtnText = document.getElementById('aiSettingsBtnText');

  async function checkAiSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        if (data.hasApiKey) {
          if (aiSettingsBtnText) aiSettingsBtnText.textContent = `OpenRouter Active (${data.maskedKey})`;
          if (openRouterApiKeyInput) openRouterApiKeyInput.placeholder = data.maskedKey;
        } else {
          if (aiSettingsBtnText) aiSettingsBtnText.textContent = 'Configure OpenRouter';
        }
      }
    } catch (e) {}
  }

  if (btnAiSettingsModal && aiSettingsModal) {
    btnAiSettingsModal.addEventListener('click', () => {
      aiSettingsModal.classList.remove('hidden');
      if (aiSettingsStatusMsg) aiSettingsStatusMsg.classList.add('hidden');
      checkAiSettings();
      if (window.lucide) lucide.createIcons();
    });
  }

  if (btnCloseAiSettingsModal && aiSettingsModal) {
    btnCloseAiSettingsModal.addEventListener('click', () => aiSettingsModal.classList.add('hidden'));
  }
  if (btnCancelAiSettings && aiSettingsModal) {
    btnCancelAiSettings.addEventListener('click', () => aiSettingsModal.classList.add('hidden'));
  }

  if (btnSaveAiSettings) {
    btnSaveAiSettings.addEventListener('click', async () => {
      const key = openRouterApiKeyInput.value.trim();
      if (!key) {
        if (aiSettingsStatusMsg) {
          aiSettingsStatusMsg.textContent = 'Please enter a valid OpenRouter API key.';
          aiSettingsStatusMsg.className = 'text-xs p-2.5 rounded-lg bg-red-950/80 text-red-300 border border-red-800';
          aiSettingsStatusMsg.classList.remove('hidden');
        }
        return;
      }

      btnSaveAiSettings.disabled = true;
      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ openRouterApiKey: key })
        });
        const data = await res.json();
        if (data.success) {
          if (aiSettingsStatusMsg) {
            aiSettingsStatusMsg.textContent = '✓ API Key saved to environment successfully!';
            aiSettingsStatusMsg.className = 'text-xs p-2.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800';
            aiSettingsStatusMsg.classList.remove('hidden');
          }
          if (aiSettingsBtnText) aiSettingsBtnText.textContent = `OpenRouter Active (${data.maskedKey})`;
          openRouterApiKeyInput.value = '';
          openRouterApiKeyInput.placeholder = data.maskedKey;
          setTimeout(() => {
            if (aiSettingsModal) aiSettingsModal.classList.add('hidden');
          }, 1200);
        } else {
          throw new Error(data.error || 'Failed to save key');
        }
      } catch (err) {
        if (aiSettingsStatusMsg) {
          aiSettingsStatusMsg.textContent = `Error: ${err.message}`;
          aiSettingsStatusMsg.className = 'text-xs p-2.5 rounded-lg bg-red-950/80 text-red-300 border border-red-800';
          aiSettingsStatusMsg.classList.remove('hidden');
        }
      } finally {
        btnSaveAiSettings.disabled = false;
      }
    });
  }

  // --- Initial Data Fetching ---
  async function initApp() {
    try {
      const [jurisRes, presetRes] = await Promise.all([
        fetch('/api/jurisdictions').then(r => r.json()),
        fetch('/api/presets').then(r => r.json())
      ]);

      if (jurisRes.success) {
        state.jurisdictions = jurisRes.jurisdictions;
        populateJurisdictions();
      }
      if (presetRes.success) {
        state.presets = presetRes.presets;
      }
      checkAiSettings();
    } catch (e) {
      console.warn('Init fetch failed, running offline defaults:', e);
    }
    initSignatureStudio();
  }

  function populateJurisdictions() {
    field_DAJ.innerHTML = '';
    const sortedKeys = Object.keys(state.jurisdictions).sort();
    sortedKeys.forEach(code => {
      const item = state.jurisdictions[code];
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = `${code} - ${item.name} (IIN: ${item.iin})`;
      if (code === 'CA') opt.selected = true;
      field_DAJ.appendChild(opt);
    });
  }

  // --- Step 1: PSD Upload & Analysis ---
  dropZone.addEventListener('click', () => psdFileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-500/10');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePsdFile(e.dataTransfer.files[0]);
    }
  });

  psdFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePsdFile(e.target.files[0]);
    }
  });

  if (refImgDropZone && refImgFileInput) {
    refImgDropZone.addEventListener('click', () => refImgFileInput.click());
    refImgFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleRefImgFile(e.target.files[0]);
      }
    });
    refImgDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      refImgDropZone.classList.add('border-blue-500', 'bg-blue-500/10');
    });
    refImgDropZone.addEventListener('dragleave', () => {
      refImgDropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
    });
    refImgDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      refImgDropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleRefImgFile(e.dataTransfer.files[0]);
      }
    });
  }

  function handleRefImgFile(file) {
    state.refImgFile = file;
    if (refImgText) {
      refImgText.innerHTML = `<span class="text-emerald-400 font-semibold">✓ ${file.name}</span> (${Math.round(file.size / 1024)} KB attached)`;
    }
    if (state.templatePath) {
      triggerGeminiAnalysis(state.templatePath);
    }
  }

  btnLoadFrontSample.addEventListener('click', () => loadSample('sample_front'));
  btnLoadBackSample.addEventListener('click', () => loadSample('sample_back'));

  async function handlePsdFile(file) {
    state.psdFile = file;
    state.sampleId = null;
    const formData = new FormData();
    formData.append('psdFile', file);
    await analyzePsdRequest(formData, file.name);
  }

  async function loadSample(sampleId) {
    state.psdFile = null;
    state.sampleId = sampleId;
    const formData = new FormData();
    formData.append('sampleId', sampleId);
    const name = sampleId === 'sample_front' ? 'CR80_AAMVA_Front_Template.psd' : 'CR80_AAMVA_Back_Template.psd';
    await analyzePsdRequest(formData, name);
  }

  async function analyzePsdRequest(formData, displayName) {
    detectedStatusText.textContent = `Analyzing ${displayName}...`;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      state.templateSummary = data.summary;
      state.templatePath = data.filePath;
      renderLayerAnalysis(data.summary, displayName);

      // Trigger Gemini AI Template Analysis automatically
      triggerGeminiAnalysis(data.filePath);
    } catch (err) {
      alert(`Failed to analyze PSD: ${err.message}`);
      detectedStatusText.textContent = 'Analysis failed. Please select a valid PSD.';
    }
  }

  function renderLayerAnalysis(summary, name) {
    document.getElementById('psdTitle').textContent = name;
    document.getElementById('psdSubtitle').textContent = `Resolution: ${summary.width} × ${summary.height} px • Multi-Layer PSD`;

    badgeDim.textContent = `${summary.width} × ${summary.height} px`;
    badgeLayers.textContent = `${summary.totalLayers} Layers`;
    badgeProtected.textContent = `${summary.protectedLayers} Protected`;
    psdStatsBadges.classList.remove('hidden');

    emptyLayerState.classList.add('hidden');
    layerTable.classList.remove('hidden');
    layerTableBody.innerHTML = '';

    state.customMappings = {};

    const availableFields = [
      { key: '', label: '-- Unmapped / Keep Original --' },
      { key: 'DCS', label: 'DCS - Customer Family / Last Name' },
      { key: 'DAC', label: 'DAC - Customer First Name' },
      { key: 'DAD', label: 'DAD - Customer Middle Name' },
      { key: 'NAME_FULL', label: 'Full Combined Name (First Middle Last)' },
      { key: 'DAQ', label: 'DAQ - License / ID Number' },
      { key: 'DBB', label: 'DBB - Date of Birth' },
      { key: 'DBA', label: 'DBA - Expiration Date' },
      { key: 'DBD', label: 'DBD - Issue Date' },
      { key: 'DAG', label: 'DAG - Street Address Line 1' },
      { key: 'DAH', label: 'DAH - Street Address Line 2' },
      { key: 'DAI', label: 'DAI - City' },
      { key: 'DAJ', label: 'DAJ - State / Jurisdiction' },
      { key: 'DAK', label: 'DAK - ZIP / Postal Code' },
      { key: 'CITY_STATE_ZIP', label: 'Combined City, State ZIP' },
      { key: 'DBC', label: 'DBC - Sex (M/F/X)' },
      { key: 'DAU', label: 'DAU - Height' },
      { key: 'DAW', label: 'DAW - Weight' },
      { key: 'DAY', label: 'DAY - Eye Color' },
      { key: 'DAZ', label: 'DAZ - Hair Color' },
      { key: 'DCA', label: 'DCA - Vehicle Class' },
      { key: 'DCB', label: 'DCB - Restrictions' },
      { key: 'DCD', label: 'DCD - Endorsements' },
      { key: 'DCF', label: 'DCF - Document Discriminator' },
      { key: 'PORTRAIT', label: 'Zone II - Portrait Photo (Image)' },
      { key: 'GHOST_PORTRAIT', label: 'Ghost Portrait Layer (Grayscale/Alpha)' },
      { key: 'SIGNATURE', label: 'Zone VI - Signature (Image)' },
      { key: 'BARCODE', label: 'Zone V - AAMVA PDF417 Barcode (Image)' }
    ];

    let mappedCount = 0;

    summary.allLayers.forEach(layer => {
      if (layer.isGroup) return; // Skip folder rows

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition';

      // 1. Layer Name & Path
      const tdName = document.createElement('td');
      tdName.className = 'py-2 px-3';
      tdName.innerHTML = `
        <div class="font-bold text-slate-200">${layer.name}</div>
        <div class="text-[10px] text-slate-500 font-sans truncate max-w-xs">${layer.path}</div>
      `;
      tr.appendChild(tdName);

      // 2. Type
      const tdType = document.createElement('td');
      tdType.className = 'py-2 px-3';
      if (layer.hasText) {
        tdType.innerHTML = '<span class="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-800 text-[10px]">Text</span>';
      } else if (layer.isImage) {
        tdType.innerHTML = '<span class="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-800 text-[10px]">Bitmap</span>';
      } else {
        tdType.innerHTML = '<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Layer</span>';
      }
      tr.appendChild(tdType);

      // 3. Mapping Selector / Protection badge
      const tdField = document.createElement('td');
      tdField.className = 'py-2 px-3';

      if (layer.isProtected) {
        tdField.innerHTML = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-sans font-semibold">
            <svg class="w-3 h-3 text-emerald-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            Protected Design Element (Untouched)
          </span>
        `;
      } else {
        const select = document.createElement('select');
        select.className = 'bg-slate-950 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-1 focus:border-blue-500 focus:outline-none w-full max-w-[240px] font-sans';

        availableFields.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.key;
          opt.textContent = f.label;
          if (layer.detectedField && layer.detectedField === f.key) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });

        if (layer.detectedField) {
          state.customMappings[layer.name] = layer.detectedField;
          mappedCount++;
        }

        select.addEventListener('change', (e) => {
          if (e.target.value) {
            state.customMappings[layer.name] = e.target.value;
          } else {
            delete state.customMappings[layer.name];
          }
        });

        tdField.appendChild(select);
      }
      tr.appendChild(tdField);

      // 4. Font / Style
      const tdFont = document.createElement('td');
      tdFont.className = 'py-2 px-3 text-slate-400 font-sans';
      if (layer.hasText) {
        tdFont.textContent = `${layer.fontName} (${layer.fontSize}px)`;
      } else {
        tdFont.textContent = `${layer.width} × ${layer.height} px`;
      }
      tr.appendChild(tdFont);

      // 5. Status
      const tdStatus = document.createElement('td');
      tdStatus.className = 'py-2 px-3 text-right';
      if (layer.isProtected) {
        tdStatus.innerHTML = '<span class="text-emerald-400 font-semibold text-[10px]">LOCKED</span>';
      } else if (layer.detectedField) {
        tdStatus.innerHTML = '<span class="text-blue-400 font-semibold text-[10px]">AUTO-MAPPED</span>';
      } else {
        tdStatus.innerHTML = '<span class="text-slate-500 text-[10px]">READY</span>';
      }
      tr.appendChild(tdStatus);

      layerTableBody.appendChild(tr);
    });

    detectedStatusText.textContent = `Analysis complete: ${mappedCount} fields auto-detected, ${summary.protectedLayers} security layers protected.`;
    btnContinueToForm.disabled = false;
  }

  async function triggerAiAnalysis(filePath) {
    const aiBrainBanner = document.getElementById('aiBrainBanner');
    const aiBrainBadge = document.getElementById('aiBrainBadge');
    const aiBrainSubtitle = document.getElementById('aiBrainSubtitle');
    const aiSchemaJsonBox = document.getElementById('aiSchemaJsonBox');
    const aiSchemaDrawer = document.getElementById('aiSchemaDrawer');
    const btnToggleAiSchema = document.getElementById('btnToggleAiSchema');
    const btnCloseAiSchema = document.getElementById('btnCloseAiSchema');

    if (!aiBrainBanner) return;

    aiBrainBanner.classList.remove('hidden');
    aiBrainBadge.textContent = 'Analyzing...';
    aiBrainBadge.className = 'px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono animate-pulse';
    aiBrainSubtitle.textContent = 'OpenRouter AI Brain is inspecting layer hierarchy and AAMVA 2025 mappings...';

    if (btnToggleAiSchema && aiSchemaDrawer) {
      btnToggleAiSchema.onclick = () => aiSchemaDrawer.classList.toggle('hidden');
    }
    if (btnCloseAiSchema && aiSchemaDrawer) {
      btnCloseAiSchema.onclick = () => aiSchemaDrawer.classList.add('hidden');
    }

    try {
      let res;
      if (state.refImgFile) {
        const aiFormData = new FormData();
        aiFormData.append('filePath', filePath);
        aiFormData.append('referenceImage', state.refImgFile);
        res = await fetch('/api/ai/analyze-template', {
          method: 'POST',
          body: aiFormData
        });
      } else {
        res = await fetch('/api/ai/analyze-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath })
        });
      }
      const data = await res.json();
      if (data.success && data.schema) {
        state.aiSchema = data.schema;
        aiBrainBadge.textContent = `${Math.round((data.schema.confidenceScore || 0.98) * 100)}% Confidence`;
        aiBrainBadge.className = 'px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono';
        aiBrainSubtitle.textContent = `Jurisdiction: ${data.schema.jurisdiction || 'Detected'} • Model: ${data.modelUsed} • OpenRouter 2025 Schema`;
        if (aiSchemaJsonBox) aiSchemaJsonBox.textContent = JSON.stringify(data.schema, null, 2);
      } else {
        throw new Error(data.error || 'Failed to generate schema');
      }
    } catch (e) {
      console.warn('AI analysis error:', e);
      aiBrainBadge.textContent = 'Heuristic Fallback';
      aiBrainBadge.className = 'px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 border border-slate-600 font-mono';
      aiBrainSubtitle.textContent = `Using internal rule-based heuristic mapping (${e.message.slice(0, 70)}...)`;
    }
  }
  const triggerGeminiAnalysis = triggerAiAnalysis;

  // --- Step 2: Form & Presets ---
  presetSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key && state.presets[key]) {
      loadProfileData(state.presets[key].data);
    }
  });

  btnClearForm.addEventListener('click', () => {
    aamvaForm.reset();
    presetSelect.value = '';
    updateBarcodePreview();
  });

  // Compliance Checklist Toggle
  const toggleComplianceChecklist = document.getElementById('toggleComplianceChecklist');
  if (toggleComplianceChecklist) {
    toggleComplianceChecklist.addEventListener('click', () => {
      const widget = document.getElementById('complianceChecklistWidget');
      const minimized = document.getElementById('complianceChecklistMinimized');
      
      if (widget.classList.contains('hidden')) {
        widget.classList.remove('hidden');
        minimized.classList.add('hidden');
      } else {
        widget.classList.add('hidden');
        minimized.classList.remove('hidden');
      }
    });
  }

  function loadProfileData(data) {
    if (!data) return;
    for (const [k, v] of Object.entries(data)) {
      const el = document.getElementById(`field_${k}`);
      if (el) {
        if (el.type === 'checkbox') {
          el.checked = v === '1' || v === true;
        } else {
          el.value = v;
        }
      }
    }
    if (data.documentType) {
      document.getElementById('field_docType').value = data.documentType;
    }
    updateBarcodePreview();
  }

  // Live input sync to barcode
  aamvaForm.addEventListener('input', () => {
    debounceUpdateBarcode();
  });

  let debounceTimer;
  function debounceUpdateBarcode() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateBarcodePreview, 400);
  }

  // --- Calculation Helpers & Live Guidance ---
  const JURISDICTION_VALIDITY = {
    TX: 8, CA: 5, NY: 8, FL: 8, IL: 4, PA: 4, OH: 4, WA: 6, GA: 8, NC: 8, DEFAULT: 5
  };

  function parseDateInput(str) {
    if (!str) return null;
    const clean = String(str).replace(/\D/g, '');
    if (clean.length === 8) {
      const y = parseInt(clean.slice(0, 4), 10);
      if (y > 1900 && y < 2100) {
        return { yyyy: clean.slice(0, 4), mm: clean.slice(4, 6), dd: clean.slice(6, 8) };
      }
      return { yyyy: clean.slice(4, 8), mm: clean.slice(0, 2), dd: clean.slice(2, 4) };
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return {
        yyyy: String(d.getFullYear()),
        mm: String(d.getMonth() + 1).padStart(2, '0'),
        dd: String(d.getDate()).padStart(2, '0')
      };
    }
    return null;
  }

  function formatDisplayDate(p) {
    if (!p) return '';
    return `${p.mm}/${p.dd}/${p.yyyy}`;
  }

  function triggerCalcExpiry() {
    const fieldDob = document.getElementById('field_DBB');
    const fieldIss = document.getElementById('field_DBD');
    const fieldState = document.getElementById('field_DAJ');
    const fieldExp = document.getElementById('field_DBA');

    const dob = parseDateInput(fieldDob?.value);
    if (!dob) return;

    let iss = parseDateInput(fieldIss?.value);
    if (!iss) {
      const now = new Date();
      iss = {
        yyyy: String(now.getFullYear()),
        mm: String(now.getMonth() + 1).padStart(2, '0'),
        dd: String(now.getDate()).padStart(2, '0')
      };
      if (fieldIss) fieldIss.value = formatDisplayDate(iss);
    }

    const st = (fieldState?.value || 'TX').toUpperCase();
    const cycle = JURISDICTION_VALIDITY[st] || JURISDICTION_VALIDITY.DEFAULT;
    const expYear = parseInt(iss.yyyy, 10) + cycle;
    const exp = { yyyy: String(expYear), mm: dob.mm, dd: dob.dd };

    if (fieldExp) {
      fieldExp.value = formatDisplayDate(exp);
      fieldExp.classList.add('bg-emerald-950/40', 'border-emerald-500');
      setTimeout(() => fieldExp.classList.remove('bg-emerald-950/40', 'border-emerald-500'), 1500);
      updateBarcodePreview();
    }
  }

  function triggerGenerateDcf() {
    const fieldState = document.getElementById('field_DAJ');
    const fieldIss = document.getElementById('field_DBD');
    const fieldDcf = document.getElementById('field_DCF');

    const st = (fieldState?.value || 'TX').toUpperCase();
    let iss = parseDateInput(fieldIss?.value);
    if (!iss) {
      const now = new Date();
      iss = {
        yyyy: String(now.getFullYear()),
        mm: String(now.getMonth() + 1).padStart(2, '0'),
        dd: String(now.getDate()).padStart(2, '0')
      };
    }

    let dcf = '';
    if (st === 'TX') {
      for (let i = 0; i < 16; i++) dcf += Math.floor(Math.random() * 10);
    } else if (st === 'CA') {
      const code1 = Math.floor(100 + Math.random() * 900);
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const let1 = letters[Math.floor(Math.random() * letters.length)];
      const digit1 = Math.floor(Math.random() * 10);
      const fourL = Array.from({length: 4}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      const twoD = String(Math.floor(10 + Math.random() * 90));
      dcf = `${iss.mm}/${iss.dd}/${iss.yyyy}${code1}${let1}${digit1}/${fourL}/${twoD}`;
    } else {
      for (let i = 0; i < 16; i++) dcf += Math.floor(Math.random() * 10);
    }

    if (fieldDcf) {
      fieldDcf.value = dcf;
      fieldDcf.classList.add('bg-emerald-950/40', 'border-emerald-500');
      setTimeout(() => fieldDcf.classList.remove('bg-emerald-950/40', 'border-emerald-500'), 1500);
      updateBarcodePreview();
    }
  }

  function normalizeHeight(str) {
    if (!str) return '';
    const clean = String(str).trim();
    const ftIn = clean.match(/^(\d)['\-\s]+(\d{1,2})["']?$/);
    if (ftIn) {
      const ft = parseInt(ftIn[1], 10);
      const inches = parseInt(ftIn[2], 10);
      const tot = ft * 12 + inches;
      return `${String(tot).padStart(3, '0')} in`;
    }
    const num = clean.match(/^(\d{2,3})$/);
    if (num) {
      return `${num[1].padStart(3, '0')} in`;
    }
    return clean;
  }

  function normalizeWeight(str) {
    if (!str) return '';
    const clean = String(str).replace(/\D/g, '');
    if (clean) return `${clean} lb`;
    return str;
  }

  if (btnGenDcf) btnGenDcf.addEventListener('click', triggerGenerateDcf);
  if (btnSetIssueToday) {
    btnSetIssueToday.addEventListener('click', () => {
      const now = new Date();
      const iss = {
        yyyy: String(now.getFullYear()),
        mm: String(now.getMonth() + 1).padStart(2, '0'),
        dd: String(now.getDate()).padStart(2, '0')
      };
      const fieldIss = document.getElementById('field_DBD');
      if (fieldIss) {
        fieldIss.value = formatDisplayDate(iss);
        triggerCalcExpiry();
      }
    });
  }
  if (btnCalcExpiry) btnCalcExpiry.addEventListener('click', triggerCalcExpiry);

  if (btnAutoCalculateAll) {
    btnAutoCalculateAll.addEventListener('click', async () => {
      const formValues = getFormDataObject();
      try {
        const res = await fetch('/api/auto-calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: formValues })
        });
        const resData = await res.json();
        if (resData.success && resData.data) {
          loadProfileData(resData.data);
          ['field_DBA', 'field_DCF', 'field_DBD', 'field_DAU', 'field_DAW'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
              el.classList.add('bg-emerald-950/40', 'border-emerald-500');
              setTimeout(() => el.classList.remove('bg-emerald-950/40', 'border-emerald-500'), 2000);
            }
          });
        }
      } catch (err) {
        triggerGenerateDcf();
        triggerCalcExpiry();
        const fieldDau = document.getElementById('field_DAU');
        if (fieldDau && fieldDau.value) fieldDau.value = normalizeHeight(fieldDau.value);
        const fieldDaw = document.getElementById('field_DAW');
        if (fieldDaw && fieldDaw.value) fieldDaw.value = normalizeWeight(fieldDaw.value);
        const fieldDcg = document.getElementById('field_DCG');
        if (fieldDcg && !fieldDcg.value) fieldDcg.value = 'USA';
        updateBarcodePreview();
      }
    });
  }

  // Live Guided Calculations
  const fDob = document.getElementById('field_DBB');
  const fIss = document.getElementById('field_DBD');
  const fSt = document.getElementById('field_DAJ');
  const fExp = document.getElementById('field_DBA');
  const fDau = document.getElementById('field_DAU');
  const fDaw = document.getElementById('field_DAW');

  if (fDob) fDob.addEventListener('change', () => { if (!fExp.value && fDob.value) triggerCalcExpiry(); });
  if (fIss) fIss.addEventListener('change', () => { if (!fExp.value && fDob.value) triggerCalcExpiry(); });
  if (fSt) fSt.addEventListener('change', () => { if (fDob.value) triggerCalcExpiry(); });
  if (fDau) fDau.addEventListener('blur', () => { fDau.value = normalizeHeight(fDau.value); });
  if (fDaw) fDaw.addEventListener('blur', () => { fDaw.value = normalizeWeight(fDaw.value); });

  // XML Import Modal Event Handlers
  if (btnOpenXmlModal && xmlImportModal) {
    btnOpenXmlModal.addEventListener('click', () => xmlImportModal.classList.remove('hidden'));
  }
  if (btnCloseXmlModal && xmlImportModal) {
    btnCloseXmlModal.addEventListener('click', () => xmlImportModal.classList.add('hidden'));
  }
  if (btnCancelXmlImport && xmlImportModal) {
    btnCancelXmlImport.addEventListener('click', () => xmlImportModal.classList.add('hidden'));
  }
  if (btnConfirmXmlImport && xmlImportInput) {
    btnConfirmXmlImport.addEventListener('click', async () => {
      const xml = xmlImportInput.value.trim();
      if (!xml) return alert('Please paste XML or AAMVA barcode text.');
      try {
        const res = await fetch('/api/parse-xml', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xml })
        });
        const resData = await res.json();
        if (resData.success && resData.data) {
          loadProfileData(resData.data);
          xmlImportModal.classList.add('hidden');
          xmlImportInput.value = '';
          triggerCalcExpiry();
          if (!document.getElementById('field_DCF')?.value) triggerGenerateDcf();
        } else {
          alert('Could not parse XML: ' + (resData.error || 'Invalid format'));
        }
      } catch (err) {
        alert('Error importing XML: ' + err.message);
      }
    });
  }

  // --- Step 3: Photo & Signature Studio ---
  photoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.photoBase64 = evt.target.result;
        photoPreviewImg.src = state.photoBase64;
        photoPreviewImg.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // --- Zone VI: Integrated Signature Studio ---

  // Helper: Trims transparent borders around a canvas, adding clean padding
  function cropCanvasToContent(sourceCanvas, padding = 12) {
    const sCtx = sourceCanvas.getContext('2d');
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const imgData = sCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] > 15) { // alpha > 15
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) return null;

    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(w - 1, maxX + padding);
    maxY = Math.min(h - 1, maxY + padding);

    const cropW = Math.max(1, maxX - minX + 1);
    const cropH = Math.max(1, maxY - minY + 1);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cCtx = croppedCanvas.getContext('2d');
    cCtx.drawImage(sourceCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    return croppedCanvas;
  }

  // Helper: Trigger browser download of transparent PNG
  function downloadDataUrl(dataUrl, filename = 'signature.png') {
    if (!dataUrl) {
      alert('No signature available to download yet.');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function initSignatureStudio() {
    // -------------------------------------------------------------
    // Active Signature State & Updates
    // -------------------------------------------------------------
    function updateActiveSignature(dataUrl, sourceLabel) {
      state.signatureBase64 = dataUrl;
      state.signatureSource = sourceLabel;
      if (activeSigText) {
        activeSigText.textContent = sourceLabel || 'Custom Signature Active';
      }
      if (activeSigBadge) {
        activeSigBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      }
    }

    function resetActiveSignature() {
      state.signatureBase64 = null;
      state.signatureSource = null;
      if (activeSigText) {
        activeSigText.textContent = 'Default Template Signature';
      }
      if (activeSigBadge) {
        activeSigBadge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30';
      }
    }

    if (btnResetActiveSig) {
      btnResetActiveSig.addEventListener('click', () => {
        resetActiveSignature();
        clearDrawnPad();
        if (sigUploadPreviewImg) sigUploadPreviewImg.classList.add('hidden');
        if (sigUploadPlaceholder) sigUploadPlaceholder.classList.remove('hidden');
        if (sigUploadStatus) sigUploadStatus.textContent = 'Waiting for upload';
      });
    }

    if (btnDownloadActiveSig) {
      btnDownloadActiveSig.addEventListener('click', () => {
        if (!state.signatureBase64) {
          alert('No custom signature active yet. Draw, generate, or upload a signature first.');
          return;
        }
        downloadDataUrl(state.signatureBase64, 'cardholder_signature.png');
      });
    }

    // -------------------------------------------------------------
    // Method Tabs Switching
    // -------------------------------------------------------------
    const tabs = [
      { btn: tabBtnSigDraw, panel: sigPanelDraw, id: 'draw' },
      { btn: tabBtnSigGenerate, panel: sigPanelGenerate, id: 'generate' },
      { btn: tabBtnSigUpload, panel: sigPanelUpload, id: 'upload' }
    ];

    function activateTab(tabId) {
      tabs.forEach(t => {
        if (!t.btn || !t.panel) return;
        if (t.id === tabId) {
          t.btn.className = 'sig-tab-btn active px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 bg-blue-600 text-white shadow-sm';
          t.panel.classList.remove('hidden');
        } else {
          t.btn.className = 'sig-tab-btn px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 text-slate-400 hover:text-white';
          t.panel.classList.add('hidden');
        }
      });
      if (tabId === 'generate') {
        renderAutoGeneratedSignature();
      }
      if (window.lucide) lucide.createIcons();
    }

    if (tabBtnSigDraw) tabBtnSigDraw.addEventListener('click', () => activateTab('draw'));
    if (tabBtnSigGenerate) tabBtnSigGenerate.addEventListener('click', () => activateTab('generate'));
    if (tabBtnSigUpload) tabBtnSigUpload.addEventListener('click', () => activateTab('upload'));

    // -------------------------------------------------------------
    // 1. SIGNATURE PAD (DRAWING)
    // -------------------------------------------------------------
    let strokes = [];
    let currentStroke = null;
    let isDrawing = false;
    let penColor = '#0f172a';
    let penWidth = 3.2;

    const padCtx = sigCanvas ? sigCanvas.getContext('2d') : null;

    // Ink Color Selection
    const colorBtns = document.querySelectorAll('.sig-color-btn');
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('border-white', 'shadow-sm'));
        btn.classList.add('border-white', 'shadow-sm');
        penColor = btn.getAttribute('data-color') || '#0f172a';
      });
    });

    // Stroke Width Selection
    const widthBtns = document.querySelectorAll('.sig-width-btn');
    widthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        widthBtns.forEach(b => {
          b.classList.remove('active', 'bg-slate-800', 'text-white', 'font-medium');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'bg-slate-800', 'text-white', 'font-medium');
        btn.classList.remove('text-slate-400');
        penWidth = parseFloat(btn.getAttribute('data-width')) || 3.2;
      });
    });

    function getCanvasCoords(e) {
      const rect = sigCanvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const scaleX = sigCanvas.width / rect.width;
      const scaleY = sigCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function drawSingleStroke(ctx, stroke) {
      if (!stroke || !stroke.points || stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color || '#0f172a';
      ctx.lineWidth = stroke.width || 3.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pts = stroke.points;
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, (stroke.width || 3.2) / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color || '#0f172a';
        ctx.fill();
        return;
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }

      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }

    function redrawPad() {
      if (!padCtx) return;
      padCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      strokes.forEach(s => drawSingleStroke(padCtx, s));
      if (sigStrokeCount) {
        sigStrokeCount.textContent = `${strokes.length} stroke${strokes.length === 1 ? '' : 's'}`;
      }
    }

    function commitDrawnSignature() {
      if (!padCtx) return;
      redrawPad();
      if (strokes.length > 0) {
        const cropped = cropCanvasToContent(sigCanvas, 14);
        if (cropped) {
          const dataUrl = cropped.toDataURL('image/png');
          updateActiveSignature(dataUrl, 'Drawn on Pad');
        }
      } else {
        resetActiveSignature();
      }
    }

    function startDrawing(e) {
      if (!padCtx) return;
      isDrawing = true;
      const pt = getCanvasCoords(e);
      currentStroke = {
        points: [pt],
        color: penColor,
        width: penWidth
      };
      drawSingleStroke(padCtx, currentStroke);
    }

    function moveDrawing(e) {
      if (!isDrawing || !currentStroke || !padCtx) return;
      const pt = getCanvasCoords(e);
      currentStroke.points.push(pt);
      redrawPad();
      drawSingleStroke(padCtx, currentStroke);
    }

    function stopDrawing() {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke && currentStroke.points.length > 0) {
        strokes.push(currentStroke);
        currentStroke = null;
        commitDrawnSignature();
      }
    }

    function clearDrawnPad() {
      strokes = [];
      currentStroke = null;
      if (padCtx) padCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      if (sigStrokeCount) sigStrokeCount.textContent = '0 strokes';
    }

    function undoDrawnStroke() {
      if (strokes.length > 0) {
        strokes.pop();
        commitDrawnSignature();
      }
    }

    if (sigCanvas) {
      sigCanvas.addEventListener('mousedown', startDrawing);
      sigCanvas.addEventListener('mousemove', moveDrawing);
      window.addEventListener('mouseup', stopDrawing);

      sigCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
      }, { passive: false });

      sigCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        moveDrawing(e);
      }, { passive: false });

      window.addEventListener('touchend', stopDrawing);
    }

    if (btnUndoSignature) btnUndoSignature.addEventListener('click', undoDrawnStroke);
    if (btnClearSignature) {
      btnClearSignature.addEventListener('click', () => {
        clearDrawnPad();
        if (state.signatureSource === 'Drawn on Pad') resetActiveSignature();
      });
    }

    if (btnDownloadDrawnSig) {
      btnDownloadDrawnSig.addEventListener('click', () => {
        if (strokes.length === 0) {
          alert('Draw a signature on the pad before downloading.');
          return;
        }
        const cropped = cropCanvasToContent(sigCanvas, 14);
        downloadDataUrl(cropped ? cropped.toDataURL('image/png') : sigCanvas.toDataURL('image/png'), 'drawn_signature.png');
      });
    }

    // -------------------------------------------------------------
    // 2. AUTO-GENERATE SIGNATURE FROM NAME
    // -------------------------------------------------------------
    let genVariation = 0;

    function getFullNameFromForm() {
      const first = (document.getElementById('field_DAC')?.value || '').trim();
      const middle = (document.getElementById('field_DAD')?.value || '').trim();
      const last = (document.getElementById('field_DCS')?.value || '').trim();
      if (first || last) {
        return [first, middle, last].filter(Boolean).join(' ');
      }
      return 'Brian Haag';
    }

    function syncNameFromForm() {
      const name = getFullNameFromForm();
      if (sigGenNameInput) sigGenNameInput.value = name;
      renderAutoGeneratedSignature();
    }

    if (btnSyncNameFromForm) {
      btnSyncNameFromForm.addEventListener('click', syncNameFromForm);
    }

    // Draw stylized flourish underline under cursive signature
    function drawUnderlineFlourish(ctx, startX, startY, width, styleIndex) {
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const endX = startX + width + 24;
      const midX = startX + width * 0.55;

      switch (styleIndex % 5) {
        case 0: {
          // Dynamic sweeping swoosh tapering to the right
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(startX + width * 0.25, startY + 12, midX, startY + 8, endX, startY - 4);
          ctx.stroke();

          // Subtle secondary flick
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(startX + width * 0.35, startY + 14);
          ctx.quadraticCurveTo(midX + 20, startY + 12, endX - 10, startY + 2);
          ctx.stroke();
          break;
        }
        case 1: {
          // Loop-de-loop signature underline
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(startX + width * 0.4, startY + 14, startX + width * 0.7, startY + 10);
          ctx.bezierCurveTo(startX + width * 0.85, startY + 8, startX + width * 0.9, startY - 6, startX + width * 0.8, startY - 2);
          ctx.quadraticCurveTo(startX + width * 0.72, startY + 12, endX + 10, startY + 6);
          ctx.stroke();
          break;
        }
        case 2: {
          // Classic double wave flourish
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(startX + width * 0.2, startY + 10, startX + width * 0.4, startY - 2, midX, startY + 8);
          ctx.bezierCurveTo(startX + width * 0.7, startY + 14, startX + width * 0.85, startY - 2, endX, startY + 6);
          ctx.stroke();
          break;
        }
        case 3: {
          // Sharp modern cursive strike with accent dot
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(startX + 10, startY + 6);
          ctx.lineTo(endX - 8, startY + 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(endX + 4, startY + 2, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          break;
        }
        case 4:
        default: {
          // Flowing italic glide
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX, startY + 4);
          ctx.quadraticCurveTo(midX, startY + 14, endX, startY);
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    }

    function renderAutoGeneratedSignature() {
      if (!sigGenCanvas) return;
      const genCtx = sigGenCanvas.getContext('2d');
      const cw = sigGenCanvas.width;
      const ch = sigGenCanvas.height;

      genCtx.clearRect(0, 0, cw, ch);
      sigGenCanvas.__rendered = true;

      let name = (sigGenNameInput?.value || '').trim();
      if (!name) {
        name = getFullNameFromForm();
        if (sigGenNameInput) sigGenNameInput.value = name;
      }

      // Initials format if checked
      if (chkSigInitialsOnly && chkSigInitialsOnly.checked) {
        const parts = name.split(/\s+/);
        if (parts.length > 1) {
          const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ');
          name = `${initials} ${parts[parts.length - 1]}`;
        }
      }

      const fontName = sigGenFontSelect?.value || 'Dancing Script';
      const slantDeg = parseFloat(rngSigSlant?.value || -3);
      const slantRad = (slantDeg * Math.PI) / 180;

      genCtx.save();
      // Apply slant
      genCtx.transform(1, 0, Math.tan(slantRad), 1, 0, 0);

      // Dynamically fit font size
      let fontSize = 48 + (genVariation % 3) * 2;
      genCtx.font = `600 ${fontSize}px "${fontName}", cursive, sans-serif`;
      let textMetrics = genCtx.measureText(name);
      while (textMetrics.width > cw - 80 && fontSize > 24) {
        fontSize -= 2;
        genCtx.font = `600 ${fontSize}px "${fontName}", cursive, sans-serif`;
        textMetrics = genCtx.measureText(name);
      }

      const textX = Math.max(30, (cw - textMetrics.width) / 2);
      const textY = ch / 2 + fontSize * 0.28;

      genCtx.fillStyle = '#0f172a'; // Deep ink
      genCtx.fillText(name, textX, textY);

      // Flourish underline if checked
      if (chkSigUnderline && chkSigUnderline.checked) {
        drawUnderlineFlourish(genCtx, textX - 5, textY + 8, textMetrics.width, genVariation);
      }

      genCtx.restore();

      // Crop and commit
      const cropped = cropCanvasToContent(sigGenCanvas, 14);
      if (cropped) {
        const dataUrl = cropped.toDataURL('image/png');
        updateActiveSignature(dataUrl, `Generated (${fontName})`);
      }
    }

    if (sigGenNameInput) sigGenNameInput.addEventListener('input', renderAutoGeneratedSignature);
    if (sigGenFontSelect) sigGenFontSelect.addEventListener('change', renderAutoGeneratedSignature);
    if (chkSigUnderline) chkSigUnderline.addEventListener('change', renderAutoGeneratedSignature);
    if (chkSigInitialsOnly) chkSigInitialsOnly.addEventListener('change', renderAutoGeneratedSignature);
    if (rngSigSlant) rngSigSlant.addEventListener('input', renderAutoGeneratedSignature);

    if (btnRegenerateSig) {
      btnRegenerateSig.addEventListener('click', () => {
        genVariation++;
        renderAutoGeneratedSignature();
      });
    }

    if (btnDownloadGeneratedSig) {
      btnDownloadGeneratedSig.addEventListener('click', () => {
        const cropped = cropCanvasToContent(sigGenCanvas, 14);
        downloadDataUrl(cropped ? cropped.toDataURL('image/png') : sigGenCanvas.toDataURL('image/png'), 'generated_signature.png');
      });
    }

    // Auto update name on Form changes if input untouched
    const fDAC = document.getElementById('field_DAC');
    const fDCS = document.getElementById('field_DCS');
    [fDAC, fDCS].forEach(input => {
      if (input) {
        input.addEventListener('change', () => {
          if (!state.signatureBase64 || state.signatureSource?.startsWith('Generated')) {
            syncNameFromForm();
          }
        });
      }
    });

    // -------------------------------------------------------------
    // 3. UPLOAD & AUTO BACKGROUND REMOVAL
    // -------------------------------------------------------------
    let currentUploadedImage = null;

    function processUploadedImage() {
      if (!currentUploadedImage) return;

      const offCanvas = document.createElement('canvas');
      const maxDim = 800;
      let w = currentUploadedImage.naturalWidth || currentUploadedImage.width;
      let h = currentUploadedImage.naturalHeight || currentUploadedImage.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      offCanvas.width = w;
      offCanvas.height = h;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(currentUploadedImage, 0, 0, w, h);

      const imgData = offCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const autoRemoveBg = chkAutoRemoveBg ? chkAutoRemoveBg.checked : true;
      const normalizeInk = chkNormalizeInk ? chkNormalizeInk.checked : true;
      const threshold = parseInt(rngBgThreshold?.value || 190, 10);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (autoRemoveBg) {
          if (lum >= threshold) {
            data[i + 3] = 0; // Transparent paper
          } else {
            // Smooth alpha falloff for clean handwriting edges
            const darkness = (threshold - lum) / threshold;
            data[i + 3] = Math.min(255, Math.round(255 * Math.pow(darkness, 0.65)));

            if (normalizeInk) {
              data[i] = 15;     // #0f172a Deep ink navy
              data[i + 1] = 23;
              data[i + 2] = 42;
            }
          }
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      // Crop to tight bounding box with padding
      const cropped = cropCanvasToContent(offCanvas, 14) || offCanvas;
      const cleanedDataUrl = cropped.toDataURL('image/png');

      if (sigUploadPreviewImg) {
        sigUploadPreviewImg.src = cleanedDataUrl;
        sigUploadPreviewImg.classList.remove('hidden');
      }
      if (sigUploadPlaceholder) sigUploadPlaceholder.classList.add('hidden');
      if (sigUploadStatus) {
        sigUploadStatus.textContent = `Cleaned (${cropped.width}×${cropped.height} PNG)`;
        sigUploadStatus.className = 'text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30';
      }

      updateActiveSignature(cleanedDataUrl, 'Uploaded (Background Removed)');
    }

    function handleSignatureFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image file (PNG, JPG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          currentUploadedImage = img;
          processUploadedImage();
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }

    if (sigFileInput) {
      sigFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleSignatureFile(e.target.files[0]);
        }
      });
    }

    if (sigUploadDropZone) {
      sigUploadDropZone.addEventListener('click', () => {
        if (sigFileInput) sigFileInput.click();
      });
      sigUploadDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        sigUploadDropZone.classList.add('border-blue-500', 'bg-blue-500/10');
      });
      sigUploadDropZone.addEventListener('dragleave', () => {
        sigUploadDropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
      });
      sigUploadDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        sigUploadDropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleSignatureFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (chkAutoRemoveBg) chkAutoRemoveBg.addEventListener('change', processUploadedImage);
    if (chkNormalizeInk) chkNormalizeInk.addEventListener('change', processUploadedImage);
    if (rngBgThreshold) rngBgThreshold.addEventListener('input', processUploadedImage);

    if (btnDownloadUploadedSig) {
      btnDownloadUploadedSig.addEventListener('click', () => {
        if (!currentUploadedImage) {
          alert('Upload a signature image first.');
          return;
        }
        if (sigUploadPreviewImg && sigUploadPreviewImg.src) {
          downloadDataUrl(sigUploadPreviewImg.src, 'cleaned_signature.png');
        }
      });
    }

    // Step transition hook
    window.__onEnterStep3 = () => {
      if (window.lucide) lucide.createIcons();
      if (!state.signatureBase64 || state.signatureSource?.startsWith('Generated')) {
        syncNameFromForm();
      }
    };

    // Default initialization: pre-render auto-generated signature from default name
    setTimeout(() => {
      renderAutoGeneratedSignature();
    }, 400);
  }

  // --- Step 4: Barcode & Execution Hub ---
  btnRefreshBarcode.addEventListener('click', updateBarcodePreview);

  function getFormDataObject() {
    const formDataObj = {};
    const elements = aamvaForm.elements;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!el.name) continue;
      if (el.type === 'checkbox') {
        if (el.checked) formDataObj[el.name] = el.value;
      } else {
        formDataObj[el.name] = el.value;
      }
    }
    return formDataObj;
  }

  async function updateBarcodePreview() {
    const formData = getFormDataObject();
    try {
      const res = await fetch('/api/generate-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        barcodePreviewImg.src = data.previewBase64;
        barcodePayloadBox.textContent = data.payload.replace(/\r/g, '↵\r').replace(/\x1e/g, '[RS]').replace(/\n/g, '↓\n');
        barcodeByteCount.textContent = `${data.payloadLength} bytes • AAMVA 2025`;
        state.barcodePayload = data.payload;

        // Validation Feedback
        if (!data.validation.valid) {
          validationAlerts.classList.remove('hidden');
          validationAlerts.innerHTML = `
            <div class="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
              <svg class="w-4 h-4 text-amber-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              AAMVA Standard Field Validation Notices:
            </div>
            <ul class="list-disc list-inside space-y-0.5 text-[11px]">
              ${data.validation.errors.map(e => `<li>${e}</li>`).join('')}
            </ul>
          `;
        } else {
          validationAlerts.classList.add('hidden');
        }
      }
    } catch (err) {
      console.error('Barcode update error:', err);
    }
  }

  // --- EXECUTE PSD FILLING ---
  btnExecuteFill.addEventListener('click', async () => {
    if (!state.psdFile && !state.sampleId) {
      alert('Please upload a PSD template or select a built-in sample in Step 1 first.');
      setStep(1);
      return;
    }

    btnExecuteFill.disabled = true;
    btnExecuteFill.innerHTML = `
      <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      Processing Multi-Layer PSD...
    `;

    try {
      const formData = new FormData();
      if (state.psdFile) {
        formData.append('psdFile', state.psdFile);
      } else if (state.sampleId) {
        formData.append('sampleId', state.sampleId);
      }

      const formValues = getFormDataObject();
      formData.append('formData', JSON.stringify(formValues));
      formData.append('customMappings', JSON.stringify(state.customMappings));

      if (state.aiSchema) {
        formData.append('aiSchema', JSON.stringify(state.aiSchema));
      }
      formData.append('targetSide', state.targetSide || 'front');

      if (state.photoBase64) {
        formData.append('photoBase64', state.photoBase64);
      }
      if (state.signatureBase64) {
        formData.append('signatureBase64', state.signatureBase64);
      }

      const res = await fetch('/api/fill', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      // Render Outputs
      state.jobData = result;
      state.frontPreviewBase64 = result.previewBase64;
      state.backPreviewBase64 = result.backPreviewBase64;
      state.currentPreviewSide = 'front';
      finalCardPreview.src = result.previewBase64;
      outputModCount.textContent = `${result.modificationsCount || 15} Layers Modified`;

      if (downloadFrontPngBtn) downloadFrontPngBtn.href = result.files.frontPngUrl || result.files.pngUrl;
      if (downloadBackPngBtn) {
        if (result.backPreviewBase64) {
          downloadBackPngBtn.classList.remove('hidden');
          downloadBackPngBtn.href = result.files.backPngUrl;
        } else {
          downloadBackPngBtn.classList.add('hidden');
        }
      }

      if (downloadPsdBtn) downloadPsdBtn.href = result.files.psdUrl;
      if (downloadPdfBtn) downloadPdfBtn.href = result.files.pdfUrl;
      if (downloadZipBtn) downloadZipBtn.href = result.files.zipUrl;

      // Handle front / back preview tabs
      if (btnViewFront && btnViewBack) {
        btnViewFront.className = 'px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm';
        btnViewBack.className = 'px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5';
        if (result.backPreviewBase64) {
          btnViewBack.classList.remove('hidden');
        } else {
          btnViewBack.classList.add('hidden');
        }
      }

      // Populate Audit Table
      auditTableBody.innerHTML = '';
      result.modificationsLog.forEach(mod => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-900/60';
        row.innerHTML = `
          <td class="py-1 px-2 font-bold text-slate-200">${mod.layer}</td>
          <td class="py-1 px-2 text-blue-400 uppercase">${mod.type}</td>
          <td class="py-1 px-2 text-slate-400">${mod.field || '-'}</td>
          <td class="py-1 px-2 text-emerald-400 truncate max-w-xs">${mod.after || mod.dimensions || 'Updated'}</td>
        `;
        auditTableBody.appendChild(row);
      });

      outputResultsCard.classList.remove('hidden');
      outputResultsCard.scrollIntoView({ behavior: 'smooth' });

      if (window.lucide) lucide.createIcons();
    } catch (err) {
      alert(`Error generating card: ${err.message}`);
    } finally {
      btnExecuteFill.disabled = false;
      btnExecuteFill.innerHTML = `
        <i data-lucide="sparkles" class="w-5 h-5"></i>
        Fill PSD & Generate DL/ID Card
      `;
      if (window.lucide) lucide.createIcons();
    }
  });

  if (btnViewFront && btnViewBack) {
    btnViewFront.addEventListener('click', () => {
      if (state.frontPreviewBase64) {
        state.currentPreviewSide = 'front';
        finalCardPreview.src = state.frontPreviewBase64;
        btnViewFront.className = 'px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm';
        btnViewBack.className = 'px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5';
      }
    });

    btnViewBack.addEventListener('click', () => {
      if (state.backPreviewBase64) {
        state.currentPreviewSide = 'back';
        finalCardPreview.src = state.backPreviewBase64;
        btnViewBack.className = 'px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm';
        btnViewFront.className = 'px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5';
      }
    });
  }

  // Start initialization
  initApp();
});
