/**
 * AAMVA Compliance Checklist - Real-time Validation Widget
 * Provides visual feedback on AAMVA D20 compliance as users fill the form
 */

(function() {
  'use strict';

  // AAMVA Mandatory Elements (D20 Standard)
  const MANDATORY_ELEMENTS = [
    // Identification
    { tag: 'DCS', name: 'Family Name', category: 'Identification', required: true, pattern: /^[A-Z\s\-\'\.]{2,35}$/i, maxLength: 35 },
    { tag: 'DAC', name: 'First Name', category: 'Identification', required: true, pattern: /^[A-Z\s\-\'\.]{1,35}$/i, maxLength: 35 },
    { tag: 'DAD', name: 'Middle Name', category: 'Identification', required: false, pattern: /^[A-Z\s\-\'\.]{0,35}$/i, maxLength: 35 },
    
    // Dates
    { tag: 'DBB', name: 'Date of Birth', category: 'Dates', required: true, pattern: /^\d{8}$|^\d{2}\/\d{2}\/\d{4}$/, maxLength: 8 },
    { tag: 'DBA', name: 'Expiration Date', category: 'Dates', required: true, pattern: /^\d{8}$|^\d{2}\/\d{2}\/\d{4}$/, maxLength: 8 },
    { tag: 'DBD', name: 'Issue Date', category: 'Dates', required: true, pattern: /^\d{8}$|^\d{2}\/\d{2}\/\d{4}$/, maxLength: 8 },
    
    // Demographics
    { tag: 'DBC', name: 'Sex', category: 'Demographics', required: true, pattern: /^[129MFX]$/i, maxLength: 1 },
    { tag: 'DAY', name: 'Eye Color', category: 'Demographics', required: true, pattern: /^[A-Z]{3}$/, maxLength: 3 },
    { tag: 'DAU', name: 'Height', category: 'Demographics', required: true, pattern: /^\d{3}(\s*(cm|in))?$|^\d['\"]\s*\d{1,2}"/i, maxLength: 6 },
    { tag: 'DAZ', name: 'Hair Color', category: 'Demographics', required: true, pattern: /^[A-Z]{3}$/, maxLength: 3 },
    { tag: 'DAW', name: 'Weight', category: 'Demographics', required: true, pattern: /^\d{2,3}\s*(kg|LB|lbs)?$/i, maxLength: 8 },
    
    // Address
    { tag: 'DAG', name: 'Street Address', category: 'Address', required: true, pattern: /^[A-Z0-9\s\-\.,#]{1,50}$/i, maxLength: 50 },
    { tag: 'DAI', name: 'City', category: 'Address', required: true, pattern: /^[A-Z\s\-\.]{1,30}$/i, maxLength: 30 },
    { tag: 'DAJ', name: 'State', category: 'Address', required: true, pattern: /^[A-Z]{2}$/, maxLength: 2 },
    { tag: 'DAK', name: 'ZIP Code', category: 'Address', required: true, pattern: /^\d{5}(\d{4})?$/, maxLength: 9 },
    
    // ID Fields
    { tag: 'DAQ', name: 'License Number', category: 'Identification', required: true, pattern: /^[A-Z0-9]{1,20}$/i, maxLength: 20 },
    { tag: 'DCF', name: 'Document Discriminator', category: 'Identification', required: true, pattern: /^[A-Z0-9]{1,25}$/i, maxLength: 25 },
    { tag: 'DCG', name: 'Country', category: 'Identification', required: true, pattern: /^[A-Z]{2,3}$/i, maxLength: 3 },
    
    // Truncation Flags
    { tag: 'DDE', name: 'Family Truncation', category: 'Flags', required: false, pattern: /^[N]$/i, maxLength: 1 },
    { tag: 'DDF', name: 'First Name Truncation', category: 'Flags', required: false, pattern: /^[N]$/i, maxLength: 1 },
    { tag: 'DDG', name: 'Middle Name Truncation', category: 'Flags', required: false, pattern: /^[N]$/i, maxLength: 1 },
    
    // Vehicle Info
    { tag: 'DCA', name: 'Vehicle Class', category: 'Vehicle', required: true, pattern: /^[A-Z0-9\-\s]{1,5}$/i, maxLength: 5 },
    { tag: 'DCB', name: 'Restrictions', category: 'Vehicle', required: false, pattern: /^[A-Z0-9\s]{0,3}$/i, maxLength: 3 },
    { tag: 'DCD', name: 'Endorsements', category: 'Vehicle', required: false, pattern: /^[A-Z\s]{0,10}$/i, maxLength: 10 }
  ];

  // Optional Elements
  const OPTIONAL_ELEMENTS = [
    { tag: 'DDA', name: 'REAL ID Compliance', category: 'Compliance' },
    { tag: 'DDK', name: 'Organ Donor', category: 'Indicators' },
    { tag: 'DDL', name: 'Veteran', category: 'Indicators' },
    { tag: 'DCO', name: 'CDL Indicator', category: 'Vehicle' },
    { tag: 'DDH', name: 'HazMat Endorsement', category: 'Vehicle' },
    { tag: 'ZFA', name: 'Federal Commercial Vehicle Codes', category: 'Vehicle' }
  ];

  // Validation State
  let validationState = {
    mandatory: {},
    optional: {},
    lastValidated: null
  };

  // Initialize the widget
  function initComplianceChecklist() {
    // Inject HTML
    const widgetHtml = document.getElementById('complianceChecklistTemplate')?.innerHTML || 
      getComplianceChecklistHTML();
    document.body.insertAdjacentHTML('beforeend', widgetHtml);

    // Inject CSS
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/components/compliance-checklist.css';
    document.head.appendChild(style);

    // Initialize
    renderChecklist();
    setupEventListeners();
    setupFormObservers();
  }

  // Get checklist HTML
  function getComplianceChecklistHTML() {
    return `
      <div id="complianceChecklistWidget" class="compliance-checklist-widget fixed bottom-20 right-6 w-80 bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/30 z-50">
        <div class="flex items-center justify-between p-4 border-b border-slate-700/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center">
              <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i>
            </div>
            <div>
              <h3 class="font-semibold text-white">AAMVA Compliance</h3>
              <p class="text-xs text-slate-400">Real-time validation</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="toggleChecklistMinimize" class="p-1.5 rounded-lg hover:bg-slate-700/60 transition text-slate-400 hover:text-white">
              <i data-lucide="minimize-2" class="w-4 h-4"></i>
            </button>
            <button id="closeComplianceChecklist" class="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition text-slate-400">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <div class="p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-slate-900/50 scrollbar-thumb-slate-600">
          <div id="complianceItems" class="grid grid-cols-1 gap-2"></div>
        </div>
        <div class="p-4 border-t border-slate-700/60 bg-slate-900/30">
          <div class="flex items-center justify-between mb-3">
            <div>
              <span class="text-xs text-slate-400">Mandatory Fields</span>
              <span id="complianceCount" class="text-sm font-medium text-white ml-2">0 / ${MANDATORY_ELEMENTS.length}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">Optional</span>
              <span id="optionalCount" class="text-sm font-medium text-slate-300">0 / ${OPTIONAL_ELEMENTS.length}</span>
            </div>
          </div>
          <div class="relative">
            <div class="w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
              <div id="complianceProgressBar" class="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-300" style="width: 0%"></div>
            </div>
            <div class="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>0%</span>
              <span class="font-bold text-white" id="compliancePercentage">0%</span>
              <span>100%</span>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <button id="autoCalculateBtn" class="flex-1 py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium transition flex items-center justify-center gap-1.5">
              <i data-lucide="calculator" class="w-3.5 h-3.5"></i>
              Auto-Calculate Missing
            </button>
            <button id="validateAllBtn" class="flex-1 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-medium transition flex items-center justify-center gap-1.5">
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              Validate All
            </button>
          </div>
        </div>
      </div>
      <div id="complianceChecklistMinimized" class="compliance-checklist-minimized fixed bottom-6 right-6 w-14 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg shadow-black/30 z-50 cursor-pointer hidden">
        <div class="p-2 flex items-center justify-center">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center">
            <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i>
          </div>
        </div>
        <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500/80 text-white text-[10px] rounded-full flex items-center justify-center font-bold" id="minimizedCount">0</div>
      </div>
    `;
  }

  // Render the checklist items
  function renderChecklist() {
    const container = document.getElementById('complianceItems');
    if (!container) return;

    // Group by category
    const categories = {};
    MANDATORY_ELEMENTS.forEach(el => {
      if (!categories[el.category]) categories[el.category] = [];
      categories[el.category].push(el);
    });

    let html = '';
    Object.entries(categories).forEach(([category, elements]) => {
      html += `
        <div class="compliance-category">
          <div class="compliance-section-header">
            <span class="compliance-section-title">${category}</span>
          </div>
          <div class="compliance-category-items">
            ${elements.map(renderElement).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    updateValidationUI();
  }

  // Render a single element
  function renderElement(element) {
    const state = validationState.mandatory[element.tag] || { valid: null, value: '' };
    const status = getStatusClass(state.valid);
    
    return `
      <div class="compliance-item" data-tag="${element.tag}" data-required="${element.required}">
        <span class="compliance-status ${status}"></span>
        <span class="compliance-tag">${element.tag}</span>
        <span class="compliance-name">${element.name}</span>
        ${element.required ? '<span class="text-slate-500 text-xs">*</span>' : ''}
        <span class="compliance-value ${state.valid === true ? 'valid' : state.valid === false ? 'invalid' : ''}">${state.value || '—'}</span>
      </div>
    `;
  }

  // Get status class based on validation
  function getStatusClass(valid) {
    if (valid === true) return 'valid';
    if (valid === false) return 'invalid';
    return 'empty';
  }

  // Setup event listeners
  function setupEventListeners() {
    // Minimize/Close buttons
    document.getElementById('toggleChecklistMinimize')?.addEventListener('click', () => {
      document.getElementById('complianceChecklistWidget')?.classList.add('hidden');
      document.getElementById('complianceChecklistMinimized')?.classList.remove('hidden');
    });

    document.getElementById('closeComplianceChecklist')?.addEventListener('click', () => {
      document.getElementById('complianceChecklistWidget')?.classList.add('hidden');
      document.getElementById('complianceChecklistMinimized')?.classList.add('hidden');
    });

    document.getElementById('complianceChecklistMinimized')?.addEventListener('click', () => {
      document.getElementById('complianceChecklistWidget')?.classList.remove('hidden');
      document.getElementById('complianceChecklistMinimized')?.classList.add('hidden');
    });

    // Auto-calculate button
    document.getElementById('autoCalculateBtn')?.addEventListener('click', () => {
      autoCalculateMissingFields();
    });

    // Validate all button
    document.getElementById('validateAllBtn')?.addEventListener('click', () => {
      validateAllFields();
    });
  }

  // Setup form field observers
  function setupFormObservers() {
    // Use MutationObserver to detect form changes
    const form = document.getElementById('aamvaForm');
    if (!form) {
      // Fallback: poll for changes
      setInterval(validateForm, 500);
      return;
    }

    // Listen for input changes on all form fields
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => debounceValidate(field));
      field.addEventListener('change', () => debounceValidate(field));
      field.addEventListener('blur', () => debounceValidate(field));
    });

    // Also listen for template load events
    const eventBus = window.ComplianceEventBus || (window.ComplianceEventBus = {});
    eventBus.onFormChange = () => debounceValidate(null);
  }

  // Debounced validation
  let validateTimeout = null;
  function debounceValidate(field) {
    clearTimeout(validateTimeout);
    validateTimeout = setTimeout(() => {
      if (field) {
        validateField(field);
      } else {
        validateForm();
      }
      updateValidationUI();
    }, 300);
  }

  // Validate a single field
  function validateField(field) {
    const tag = getFieldTag(field);
    if (!tag) return;

    const element = MANDATORY_ELEMENTS.find(e => e.tag === tag);
    if (!element) {
      // Check optional
      const optElement = OPTIONAL_ELEMENTS.find(e => e.tag === tag);
      if (!optElement) return;
      
      const value = field.value.trim();
      validationState.optional[tag] = {
        valid: value ? true : null,
        value: value || ''
      };
      return;
    }

    const value = field.value.trim();
    let valid = null;

    // Check required
    if (element.required && !value) {
      valid = false;
    } else if (value) {
      // Check pattern
      if (element.pattern && !element.pattern.test(value)) {
        valid = false;
      } else if (element.maxLength && value.length > element.maxLength) {
        valid = false;
      } else {
        valid = true;
      }
    }

    validationState.mandatory[tag] = {
      valid: valid,
      value: value || '',
      element: element
    };
  }

  // Validate entire form
  function validateForm() {
    const form = document.getElementById('aamvaForm');
    if (!form) return;

    form.querySelectorAll('input, select, textarea').forEach(field => {
      validateField(field);
    });

    // Also validate fields that might be missing
    MANDATORY_ELEMENTS.forEach(element => {
      if (!validationState.mandatory[element.tag]) {
        validationState.mandatory[element.tag] = {
          valid: element.required ? false : null,
          value: '',
          element: element
        };
      }
    });
  }

  // Get field tag from DOM element
  function getFieldTag(field) {
    // Check for direct tag attribute
    if (field.dataset.tag) return field.dataset.tag;
    
    // Check for name attribute mapping
    const name = field.name || field.id;
    if (!name) return null;

    // Map common field names to AAMVA tags
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
      'country': 'DCG', 'DCG': 'DCG'
    };

    return nameToTag[name] || null;
  }

  // Update validation UI
  function updateValidationUI() {
    if (!document.getElementById('complianceItems')) return;

    // Update each item
    Object.entries(validationState.mandatory).forEach(([tag, state]) => {
      const element = document.querySelector(`[data-tag="${tag}"]`);
      if (!element) return;

      const status = getStatusClass(state.valid);
      element.querySelector('.compliance-status').className = `compliance-status ${status}`;
      element.querySelector('.compliance-value').textContent = state.value || '—';
      element.querySelector('.compliance-value').className = `compliance-value ${state.valid === true ? 'valid' : state.valid === false ? 'invalid' : ''}`;
    });

    // Calculate counts
    const mandatoryValid = Object.values(validationState.mandatory).filter(s => s.valid === true).length;
    const mandatoryTotal = Object.values(validationState.mandatory).filter(s => s.element.required).length;
    const optionalValid = Object.values(validationState.optional).filter(s => s.valid === true).length;

    // Update counts
    document.getElementById('complianceCount')?.textContent && 
      (document.getElementById('complianceCount').textContent = `${mandatoryValid} / ${mandatoryTotal}`);
    document.getElementById('optionalCount')?.textContent && 
      (document.getElementById('optionalCount').textContent = `${optionalValid} / ${OPTIONAL_ELEMENTS.length}`);

    // Update progress
    const progress = mandatoryTotal > 0 ? (mandatoryValid / mandatoryTotal * 100) : 0;
    document.getElementById('complianceProgressBar')?.style.setProperty('width', `${progress}%`);
    document.getElementById('compliancePercentage')?.textContent && 
      (document.getElementById('compliancePercentage').textContent = `${Math.round(progress)}%`);

    // Update progress bar color based on completion
    const progressBar = document.getElementById('complianceProgressBar');
    if (progressBar) {
      if (progress >= 80) {
        progressBar.classList.add('high-compliance');
        progressBar.classList.remove('via-amber-500');
        progressBar.classList.add('via-emerald-500');
      } else if (progress >= 50) {
        progressBar.classList.remove('high-compliance');
        progressBar.classList.remove('via-amber-500');
        progressBar.classList.add('via-blue-500');
      } else if (progress >= 25) {
        progressBar.classList.remove('high-compliance');
        progressBar.classList.remove('via-blue-500');
        progressBar.classList.add('via-amber-500');
      } else {
        progressBar.classList.remove('high-compliance', 'via-blue-500', 'via-emerald-500');
        progressBar.classList.add('via-amber-500');
      }
    }

    // Update minimized badge count
    const invalidCount = Object.values(validationState.mandatory).filter(s => s.valid === false).length;
    document.getElementById('minimizedCount')?.textContent && 
      (document.getElementById('minimizedCount').textContent = invalidCount > 0 ? invalidCount : '');

    // Update validation button state
    const validateBtn = document.getElementById('validateAllBtn');
    if (validateBtn) {
      if (mandatoryValid === mandatoryTotal && mandatoryTotal > 0) {
        validateBtn.classList.add('success');
      } else {
        validateBtn.classList.remove('success');
      }
    }
  }

  // Auto-calculate missing fields
  async function autoCalculateMissingFields() {
    const btn = document.getElementById('autoCalculateBtn');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Calculating...';
      btn.disabled = true;

      // Collect current form data
      const formData = collectFormData();

      // Call auto-calculate API
      const response = await fetch('/api/auto-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });

      const result = await response.json();
      
      if (result.success) {
        // Apply calculated fields
        Object.keys(result.data).forEach(key => {
          const field = document.querySelector(`[name="${key}"], #field_${key}`);
          if (field && !field.value.trim()) {
            field.value = result.data[key];
            validateField(field);
          }
        });
        
        updateValidationUI();
        showToast('Auto-calculated missing fields!', 'success');
      } else {
        showToast(result.error || 'Failed to auto-calculate', 'error');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  // Validate all fields
  function validateAllFields() {
    const btn = document.getElementById('validateAllBtn');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Validating...';
      btn.classList.add('loading');
      btn.disabled = true;

      validateForm();
      updateValidationUI();

      // Check if all mandatory fields are valid
      const invalidFields = Object.values(validationState.mandatory)
        .filter(s => s.valid === false && s.element.required)
        .map(s => s.element.name);

      if (invalidFields.length === 0) {
        showToast('All mandatory fields are AAMVA compliant!', 'success');
      } else {
        showToast(`${invalidFields.length} field(s) need attention: ${invalidFields.join(', ')}`, 'warning');
      }
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      btn.innerHTML = originalText;
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  // Collect form data
  function collectFormData() {
    const form = document.getElementById('aamvaForm');
    const data = {};

    if (form) {
      form.querySelectorAll('input, select, textarea').forEach(field => {
        const tag = getFieldTag(field);
        if (tag) {
          data[tag] = field.value.trim();
        } else if (field.name) {
          data[field.name] = field.value.trim();
        }
      });
    }

    return data;
  }

  // Show toast notification
  function showToast(message, type = 'info') {
    // Check if toast system exists
    if (window.showToast) {
      window.showToast(message, type);
      return;
    }

    // Create simple toast
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 left-6 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-60 toast-notification toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="ml-3 text-slate-400 hover:text-white">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    const styles = {
      info: ['bg-blue-600/90', 'text-blue-100', 'border', 'border-blue-500/30'],
      success: ['bg-emerald-600/90', 'text-emerald-100', 'border', 'border-emerald-500/30'],
      warning: ['bg-amber-600/90', 'text-amber-100', 'border', 'border-amber-500/30'],
      error: ['bg-red-600/90', 'text-red-100', 'border', 'border-red-500/30']
    };

    if (styles[type]) {
      toast.classList.add(...styles[type]);
    }
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComplianceChecklist);
  } else {
    initComplianceChecklist();
  }

  // Expose API
  window.ComplianceChecklist = {
    validate: validateForm,
    validateField: validateField,
    getState: () => validationState,
    updateUI: updateValidationUI
  };
})();
