/**
 * Live Barcode Preview Widget
 * Generates and displays real-time PDF417 barcode as users fill the form
 */

(function() {
  'use strict';

  // Widget state
  let barcodeWidgetState = {
    visible: false,
    minimized: false,
    lastPayload: null,
    canvas: null,
    context: null
  };

  // AAMVA IIN Map (for display)
  const IIN_MAP = {
    'CA': '636000', 'TX': '636014', 'NY': '636001', 'FL': '636002',
    'WA': '636003', 'GA': '636004', 'MI': '636005', 'OH': '636006',
    'PA': '636007', 'NC': '636008', 'IL': '636009', 'VA': '636015'
  };

  // Initialize the widget
  function initBarcodePreview() {
    // Create widget HTML
    injectWidgetHTML();
    
    // Load CSS
    injectWidgetCSS();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup form observers
    setupFormObservers();
    
    // Initialize canvas
    initializeCanvas();
  }

  // Inject widget HTML
  function injectWidgetHTML() {
    const html = `
      <div id="barcodePreviewWidget" class="hidden">
        <div class="widget-header">
          <div class="header-left">
            <div class="header-icon">
              <i data-lucide="barcode"></i>
            </div>
            <div>
              <h3 class="header-title">Live Barcode Preview</h3>
              <p class="header-subtitle">PDF417 AAMVA Standard</p>
            </div>
          </div>
          <div class="header-controls">
            <button class="control-btn" id="refreshBarcodeBtn" title="Refresh barcode">
              <i data-lucide="refresh-cw"></i>
            </button>
            <button class="control-btn" id="downloadBarcodeBtn" title="Download barcode image">
              <i data-lucide="download"></i>
            </button>
            <button class="control-btn" id="toggleBarcodeMinimize" title="Minimize">
              <i data-lucide="minimize-2"></i>
            </button>
            <button class="control-btn" id="closeBarcodePreview" title="Close">
              <i data-lucide="x"></i>
            </button>
          </div>
        </div>
        <div id="barcodePreviewContainer">
          <canvas id="barcodePreviewCanvas"></canvas>
          <div id="barcodePreviewOverlay">
            <i data-lucide="barcode"></i>
          </div>
        </div>
        <div id="barcodeInfoSection">
          <div id="barcodeInfoGrid">
            <div class="info-item">
              <span class="info-label">IIN</span>
              <span id="barcodeIinValue" class="info-value">—</span>
            </div>
            <div class="info-item">
              <span class="info-label">Size</span>
              <span id="barcodeSizeValue" class="info-value">— bytes</span>
            </div>
            <div class="info-item">
              <span class="info-label">Version</span>
              <span id="barcodeVersionValue" class="info-value">—</span>
            </div>
            <div class="info-item">
              <span class="info-label">Elements</span>
              <span id="barcodeElementsValue" class="info-value">— / 22</span>
            </div>
          </div>
        </div>
      </div>
      <div id="barcodePreviewMinimized" class="hidden">
        <div class="minimized-content">
          <div class="minimized-icon">
            <i data-lucide="barcode"></i>
          </div>
        </div>
      </div>
      <div class="barcode-tooltip">Valid AAMVA D20 Barcode</div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Inject widget CSS
  function injectWidgetCSS() {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/components/barcode-preview.css';
    document.head.appendChild(style);
  }

  // Initialize canvas
  function initializeCanvas() {
    const canvas = document.getElementById('barcodePreviewCanvas');
    if (!canvas) return;
    
    barcodeWidgetState.canvas = canvas;
    barcodeWidgetState.context = canvas.getContext('2d');
    
    // Set initial size
    resizeCanvas();
    
    // Listen for resize
    window.addEventListener('resize', debounce(resizeCanvas, 100));
  }

  // Resize canvas to fit container
  function resizeCanvas() {
    const container = document.getElementById('barcodePreviewContainer');
    if (!container || !barcodeWidgetState.canvas) return;
    
    const width = container.clientWidth - 24; // Account for padding
    const height = Math.min(width * 0.3, 150); // Aspect ratio ~3:1
    
    barcodeWidgetState.canvas.width = width;
    barcodeWidgetState.canvas.height = height;
    
    // Redraw if we have a payload
    if (barcodeWidgetState.lastPayload) {
      drawBarcode(barcodeWidgetState.lastPayload);
    }
  }

  // Debounced function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Setup event listeners
  function setupEventListeners() {
    // Close button
    document.getElementById('closeBarcodePreview')?.addEventListener('click', () => {
      hideWidget();
    });
    
    // Minimize button
    document.getElementById('toggleBarcodeMinimize')?.addEventListener('click', () => {
      toggleMinimize();
    });
    
    // Minimized click to restore
    document.getElementById('barcodePreviewMinimized')?.addEventListener('click', () => {
      restoreWidget();
    });
    
    // Refresh button
    document.getElementById('refreshBarcodeBtn')?.addEventListener('click', () => {
      refreshBarcode();
    });
    
    // Download button
    document.getElementById('downloadBarcodeBtn')?.addEventListener('click', () => {
      downloadBarcode();
    });
  }

  // Setup form observers
  function setupFormObservers() {
    const form = document.getElementById('aamvaForm');
    if (!form) {
      // Fallback: poll for changes
      setInterval(generateBarcodePreview, 1000);
      return;
    }
    
    // Listen for changes on all fields that affect barcode
    const barcodeFields = [
      'DCS', 'DAC', 'DAD', 'DBB', 'DBA', 'DBD', 'DAQ', 'DAJ', 'DAK', 'DAG', 'DAI',
      'DBC', 'DAY', 'DAZ', 'DAU', 'DAW', 'DCA', 'DCB', 'DCD', 'DCF', 'DCG',
      'DDA', 'DDK', 'DDL', 'DDE', 'DDF', 'DDG'
    ];
    
    form.querySelectorAll('input, select').forEach(field => {
      const tag = getFieldTag(field);
      if (barcodeFields.includes(tag)) {
        field.addEventListener('input', debounce(generateBarcodePreview, 500));
        field.addEventListener('change', debounce(generateBarcodePreview, 500));
      }
    });
  }

  // Get field tag from DOM element
  function getFieldTag(field) {
    if (field.dataset.tag) return field.dataset.tag;
    const name = field.name || field.id;
    if (!name) return null;
    
    const nameToTag = {
      'firstName': 'DAC', 'DAC': 'DAC',
      'lastName': 'DCS', 'DCS': 'DCS',
      'middleName': 'DAD', 'DAD': 'DAD',
      'dob': 'DBB', 'DBB': 'DBB', 'birthDate': 'DBB',
      'issueDate': 'DBD', 'DBD': 'DBD',
      'expDate': 'DBA', 'DBA': 'DBA',
      'licenseNumber': 'DAQ', 'DAQ': 'DAQ',
      'address': 'DAG', 'DAG': 'DAG',
      'city': 'DAI', 'DAI': 'DAI',
      'state': 'DAJ', 'DAJ': 'DAJ', 'jurisdiction': 'DAJ',
      'zip': 'DAK', 'DAK': 'DAK',
      'sex': 'DBC', 'DBC': 'DBC',
      'eyes': 'DAY', 'DAY': 'DAY',
      'hair': 'DAZ', 'DAZ': 'DAZ',
      'height': 'DAU', 'DAU': 'DAU',
      'weight': 'DAW', 'DAW': 'DAW',
      'class': 'DCA', 'DCA': 'DCA',
      'restrictions': 'DCB', 'DCB': 'DCB',
      'endorsements': 'DCD', 'DCD': 'DCD',
      'discriminator': 'DCF', 'DCF': 'DCF',
      'country': 'DCG', 'DCG': 'DCG',
      'complianceType': 'DDA', 'DDA': 'DDA'
    };
    
    return nameToTag[name] || null;
  }

  // Collect form data for barcode generation
  function collectBarcodeData() {
    const form = document.getElementById('aamvaForm');
    const data = {};
    
    if (form) {
      form.querySelectorAll('input, select').forEach(field => {
        const tag = getFieldTag(field);
        if (tag) {
          let value = field.value.trim();
          
          // Format dates (remove slashes for AAMVA format)
          if (['DBB', 'DBA', 'DBD'].includes(tag) && value.includes('/')) {
            value = value.replace(/\//g, '');
          }
          
          data[tag] = value;
        }
      });
    }
    
    return data;
  }

  // Generate barcode preview
  async function generateBarcodePreview() {
    const formData = collectBarcodeData();
    
    // Check if we have enough data to generate a barcode
    const requiredFields = ['DCS', 'DAC', 'DAJ'];
    const hasRequired = requiredFields.every(field => formData[field] && formData[field].trim());
    
    if (!hasRequired) {
      updateBarcodeInfo({ valid: false, message: 'Missing required fields' });
      return;
    }
    
    // Generate AAMVA payload
    const payload = generateAamvaPayload(formData);
    
    if (payload) {
      barcodeWidgetState.lastPayload = payload;
      
      // Draw barcode
      drawBarcode(payload);
      
      // Update info
      updateBarcodeInfo({
        valid: true,
        payload: payload,
        iin: formData.DAJ ? IIN_MAP[formData.DAJ] : '—',
        size: payload.length,
        version: 'D20',
        elementCount: countValidElements(formData)
      });
      
      // Show widget if not visible
      if (!barcodeWidgetState.visible) {
        showWidget();
      }
    }
  }

  // Helper to decode payload back to field data for existing API
  function decodePayloadForBarcodeApi(payload) {
    // The /api/generate-barcode endpoint expects field data, not raw payload
    // Since we already have the form data, we can use that directly
    const formData = collectBarcodeData();
    return formData;
  }

  // Generate AAMVA payload (client-side version)
  function generateAamvaPayload(data) {
    try {
      // Build header
      const iin = IIN_MAP[data.DAJ] || '636000';
      const header = `@\n\x1E\rANSI \n${iin}\n11\n00\n01\nDL\n0031\n`;
      
      // Build subfile
      const subfileParts = [];
      
      // Names
      if (data.DCS) subfileParts.push(`DCS${data.DCS}`);
      if (data.DAC) subfileParts.push(`DAC${data.DAC}`);
      if (data.DAD) subfileParts.push(`DAD${data.DAD}`);
      
      // Address
      if (data.DAG) subfileParts.push(`DAG${data.DAG}`);
      if (data.DAI) subfileParts.push(`DAI${data.DAI}`);
      if (data.DAJ) subfileParts.push(`DAJ${data.DAJ}`);
      if (data.DAK) subfileParts.push(`DAK${data.DAK}`);
      
      // Dates
      if (data.DBB) subfileParts.push(`DBB${data.DBB}`);
      if (data.DBA) subfileParts.push(`DBA${data.DBA}`);
      if (data.DBD) subfileParts.push(`DBD${data.DBD}`);
      
      // ID Fields
      if (data.DAQ) subfileParts.push(`DAQ${data.DAQ}`);
      if (data.DCF) subfileParts.push(`DCF${data.DCF}`);
      if (data.DCG) subfileParts.push(`DCG${data.DCG}`);
      
      // Demographics
      if (data.DBC) subfileParts.push(`DBC${data.DBC}`);
      if (data.DAY) subfileParts.push(`DAY${data.DAY}`);
      if (data.DAZ) subfileParts.push(`DAZ${data.DAZ}`);
      if (data.DAU) subfileParts.push(`DAU${data.DAU}`);
      if (data.DAW) subfileParts.push(`DAW${data.DAW}`);
      
      // Vehicle Info
      if (data.DCA) subfileParts.push(`DCA${data.DCA}`);
      if (data.DCB) subfileParts.push(`DCB${data.DCB}`);
      if (data.DCD) subfileParts.push(`DCD${data.DCD}`);
      
      // Optional
      if (data.DDA) subfileParts.push(`DDA${data.DDA}`);
      if (data.DDK) subfileParts.push(`DDK${data.DDK}`);
      if (data.DDL) subfileParts.push(`DDL${data.DDL}`);
      
      // Truncation flags
      subfileParts.push(`DDE${data.DDE || 'N'}`);
      subfileParts.push(`DDF${data.DDF || 'N'}`);
      subfileParts.push(`DDG${data.DDG || 'N'}`);
      
      const subfile = subfileParts.join('\n') + '\r';
      
      // Calculate length
      const subfileLength = subfile.length;
      const totalLength = 31 + subfileLength;
      
      // Update header with correct length
      const finalHeader = `@\n\x1E\rANSI \n${iin}\n11\n00\n01\nDL\n0031\n${String(subfileLength).padStart(4, '0')}\r`;
      
      return finalHeader + subfile;
    } catch (error) {
      console.error('Error generating AAMVA payload:', error);
      return null;
    }
  }

  // Count valid elements
  function countValidElements(data) {
    const validElements = [
      'DCS', 'DAC', 'DAD', 'DBB', 'DBA', 'DBD', 'DBC', 'DAY', 'DAZ', 'DAU', 'DAW',
      'DAG', 'DAI', 'DAJ', 'DAK', 'DAQ', 'DCF', 'DCG', 'DCA', 'DCB', 'DCD', 'DDE', 'DDF', 'DDG'
    ];
    
    let count = 0;
    validElements.forEach(tag => {
      if (data[tag] && data[tag].trim()) {
        count++;
      }
    });
    
    return count;
  }

  // Draw barcode using bwip-js
  async function drawBarcode(payload) {
    if (!barcodeWidgetState.canvas || !barcodeWidgetState.context) return;
    
    try {
      // Show loading state
      const overlay = document.getElementById('barcodePreviewOverlay');
      overlay?.classList.add('visible');
      
      // Use bwip-js to generate barcode
      const canvas = barcodeWidgetState.canvas;
      const options = {
        bcid: 'pdf417',
        text: payload,
        scale: 2,
        width: canvas.width,
        height: canvas.height,
        eclevel: 5,
        columns: 14
      };
      
      // Clear canvas with white background for barcode visibility
      barcodeWidgetState.context.fillStyle = '#ffffff';
      barcodeWidgetState.context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Generate barcode image
      const img = await generateBarcodeImage(payload, canvas.width, canvas.height);
      
      // Draw image
      barcodeWidgetState.context.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Hide loading
      overlay?.classList.remove('visible');
      
      // Update widget state
      updateWidgetValidation(true);
      
    } catch (error) {
      console.error('Error drawing barcode:', error);
      overlay?.classList.remove('visible');
      updateWidgetValidation(false);
    }
  }

  // Generate barcode image using API (since bwip-js in browser has limitations)
  async function generateBarcodeImage(payload, width, height) {
    try {
      // Try to use bwip-js if available
      if (window.bwipjs) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Draw barcode
        bwipjs.toCanvas(canvas, {
          bcid: 'pdf417',
          text: payload,
          scale: 2,
          eclevel: 5,
          columns: 14,
          width: width,
          height: height
        });
        
        return canvas;
      }
      
      // Fallback: call server API
      // Try the new endpoint first, then fall back to the existing /api/generate-barcode
      let response;
      
      try {
        response = await fetch('/api/generate-barcode-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: payload,
            width: width,
            height: height
          })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const img = await createImageFromBlob(blob);
          return img;
        }
      } catch (e) {
        // New endpoint not available, try the existing one
      }
      
      // Fall back to existing /api/generate-barcode endpoint
      response = await fetch('/api/generate-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decodePayloadForBarcodeApi(payload))
      });
      
      if (!response.ok) throw new Error('Failed to generate barcode');
      
      const data = await response.json();
      console.log('Barcode API response:', { hasPreview: !!data.previewBase64, previewLength: data.previewBase64?.length });
      
      if (data.previewBase64) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('Barcode image loaded:', { width: img.width, height: img.height });
            resolve(img);
          };
          img.onerror = (err) => {
            console.error('Barcode image failed to load:', err);
            reject(err);
          };
          img.src = data.previewBase64;
        });
        return img;
      }
      
      throw new Error('No barcode image in response');
      
    } catch (error) {
      console.warn('Fallback to placeholder barcode:', error.message);
      return createPlaceholderBarcode(width, height);
    }
  }

  // Create image from blob
  function createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      const url = URL.createObjectURL(blob);
      img.src = url;
      URL.revokeObjectURL(url);
    });
  }

  // Create placeholder barcode
  function createPlaceholderBarcode(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Background - white for barcode visibility
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Pattern
    const barWidth = 2;
    const barHeight = height * 0.8;
    const barSpacing = 4;
    
    for (let x = 0; x < width; x += barWidth + barSpacing) {
      const barHeightVar = barHeight * (0.7 + Math.random() * 0.6);
      const y = (height - barHeightVar) / 2;
      ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#333333';
      ctx.fillRect(x, y, barWidth, barHeightVar);
    }
    
    // Border
    ctx.strokeStyle = '#cccccc';
    ctx.strokeRect(0, 0, width, height);
    
    // Label
    ctx.fillStyle = '#666666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PDF417 Preview', width / 2, height / 2);
    
    return canvas;
  }

  // Update barcode info display
  function updateBarcodeInfo(info) {
    if (info.iiin !== undefined) {
      document.getElementById('barcodeIinValue')?.textContent && 
        (document.getElementById('barcodeIinValue').textContent = info.iiin);
    }
    
    if (info.size !== undefined) {
      document.getElementById('barcodeSizeValue')?.textContent && 
        (document.getElementById('barcodeSizeValue').textContent = `${info.size} bytes`);
    }
    
    if (info.version !== undefined) {
      document.getElementById('barcodeVersionValue')?.textContent && 
        (document.getElementById('barcodeVersionValue').textContent = info.version);
    }
    
    if (info.elementCount !== undefined) {
      document.getElementById('barcodeElementsValue')?.textContent && 
        (document.getElementById('barcodeElementsValue').textContent = `${info.elementCount} / 22`);
    }
    
    // Update tooltip
    const tooltip = document.querySelector('.barcode-tooltip');
    if (tooltip && info.valid !== undefined) {
      tooltip.textContent = info.valid ? 'Valid AAMVA D20 Barcode' : info.message || 'Invalid barcode';
      if (!info.valid) {
        tooltip.classList.add('error');
        tooltip.classList.remove('success');
      } else {
        tooltip.classList.remove('error');
        tooltip.classList.add('success');
      }
    }
  }

  // Update widget validation state
  function updateWidgetValidation(valid) {
    const widget = document.getElementById('barcodePreviewWidget');
    if (!widget) return;
    
    widget.classList.remove('valid', 'invalid');
    if (valid) {
      widget.classList.add('valid');
    } else {
      widget.classList.add('invalid');
    }
  }

  // Show widget
  function showWidget() {
    barcodeWidgetState.visible = true;
    barcodeWidgetState.minimized = false;
    
    const widget = document.getElementById('barcodePreviewWidget');
    const minimized = document.getElementById('barcodePreviewMinimized');
    
    widget?.classList.remove('hidden');
    minimized?.classList.add('hidden');
  }

  // Hide widget
  function hideWidget() {
    barcodeWidgetState.visible = false;
    barcodeWidgetState.minimized = false;
    
    const widget = document.getElementById('barcodePreviewWidget');
    const minimized = document.getElementById('barcodePreviewMinimized');
    
    widget?.classList.add('hidden');
    minimized?.classList.add('hidden');
  }

  // Toggle minimize
  function toggleMinimize() {
    if (barcodeWidgetState.minimized) {
      restoreWidget();
    } else {
      barcodeWidgetState.minimized = true;
      
      const widget = document.getElementById('barcodePreviewWidget');
      const minimized = document.getElementById('barcodePreviewMinimized');
      
      widget?.classList.add('hidden');
      minimized?.classList.remove('hidden');
    }
  }

  // Restore widget
  function restoreWidget() {
    barcodeWidgetState.minimized = false;
    
    const widget = document.getElementById('barcodePreviewWidget');
    const minimized = document.getElementById('barcodePreviewMinimized');
    
    widget?.classList.remove('hidden');
    minimized?.classList.add('hidden');
  }

  // Refresh barcode
  function refreshBarcode() {
    generateBarcodePreview();
  }

  // Download barcode as PNG
  function downloadBarcode() {
    if (!barcodeWidgetState.canvas) return;
    
    const canvas = barcodeWidgetState.canvas;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `aamva-barcode-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    
    showToast('Barcode downloaded!', 'success');
  }

  // Show toast notification
  function showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
      return;
    }
    
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 left-6 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-60 toast-notification toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-3 text-slate-400 hover:text-white">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    const styles = {
      info: 'bg-blue-600/90 text-blue-100 border border-blue-500/30',
      success: 'bg-emerald-600/90 text-emerald-100 border border-emerald-500/30',
      warning: 'bg-amber-600/90 text-amber-100 border border-amber-500/30',
      error: 'bg-red-600/90 text-red-100 border border-red-500/30'
    };

    toast.classList.add(styles[type]);
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBarcodePreview);
  } else {
    initBarcodePreview();
  }

  // Expose API
  window.BarcodePreview = {
    show: showWidget,
    hide: hideWidget,
    toggle: () => barcodeWidgetState.visible ? hideWidget() : showWidget(),
    generate: generateBarcodePreview,
    getPayload: () => barcodeWidgetState.lastPayload
  };
})();
