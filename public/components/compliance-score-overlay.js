/**
 * Real-time Compliance Score Overlay
 * Floating widget that shows live AAMVA compliance score
 */

(function() {
  'use strict';

  // AAMVA IIN Map
  const IIN_MAP = {
    'AL': '636041', 'AK': '636002', 'AZ': '636005', 'AR': '636004', 'CA': '636000',
    'CO': '636006', 'CT': '636007', 'DE': '636008', 'DC': '636009', 'FL': '636002',
    'GA': '636004', 'HI': '636010', 'ID': '636011', 'IL': '636009', 'IN': '636012',
    'IA': '636013', 'KS': '636014', 'KY': '636015', 'LA': '636016', 'ME': '636017',
    'MD': '636018', 'MA': '636019', 'MI': '636005', 'MN': '636020', 'MS': '636021',
    'MO': '636022', 'MT': '636023', 'NE': '636024', 'NV': '636025', 'NH': '636026',
    'NJ': '636027', 'NM': '636028', 'NY': '636001', 'NC': '636008', 'ND': '636029',
    'OH': '636006', 'OK': '636030', 'OR': '636031', 'PA': '636007', 'RI': '636032',
    'SC': '636033', 'SD': '636034', 'TN': '636035', 'TX': '636014', 'UT': '636036',
    'VT': '636037', 'VA': '636015', 'WA': '636003', 'WV': '636038', 'WI': '636039',
    'WY': '636040', 'PR': '636042', 'GU': '636043', 'VI': '636044'
  };

  // Required AAMVA fields
  const REQUIRED_FIELDS = [
    'DCS', 'DAC', 'DAJ', 'DAQ', 'DBB', 'DBA', 'DBD'
  ];

  // All AAMVA fields for completeness check
  const ALL_FIELDS = [
    'DCS', 'DAC', 'DAD', 'DBB', 'DBA', 'DBD', 'DAQ', 'DCF', 'DCG',
    'DBC', 'DAY', 'DAZ', 'DAU', 'DAW', 'DAG', 'DAI', 'DAJ', 'DAK',
    'DCA', 'DCB', 'DCD', 'DDA', 'DDK', 'DDL', 'DCO'
  ];

  // State
  let complianceState = {
    score: 0,
    maxScore: 100,
    requiredFilled: 0,
    totalRequired: REQUIRED_FIELDS.length,
    optionalFilled: 0,
    totalOptional: ALL_FIELDS.length - REQUIRED_FIELDS.length
  };

  // Initialize
  function initComplianceScoreOverlay() {
    injectHTML();
    injectCSS();
    setupObservers();
    setupEventListeners();
  }

  // Inject HTML
  function injectHTML() {
    const html = `
      <div id="complianceScoreWidget" class="compliance-score-widget hidden">
        <div class="score-header">
          <div class="header-icon">
            <i data-lucide="shield-check"></i>
          </div>
          <div class="header-text">
            <span class="widget-title">AAMVA Compliance</span>
            <span class="widget-subtitle">D20 Standard</span>
          </div>
        </div>
        
        <div class="score-display">
          <div class="score-circle">
            <svg viewBox="0 0 100 100" class="score-svg">
              <circle cx="50" cy="50" r="45" class="score-bg"></circle>
              <circle cx="50" cy="50" r="45" class="score-progress" style="stroke-dasharray: 0, 283"></circle>
            </svg>
            <div class="score-text">
              <span id="complianceScoreValue" class="score-number">0%</span>
              <span class="score-label">Complete</span>
            </div>
          </div>
        </div>
        
        <div class="compliance-details">
          <div class="detail-item">
            <span class="detail-icon required"><i data-lucide="check-circle"></i></span>
            <span class="detail-text">
              <span id="requiredFilled">0</span>/
              <span>${REQUIRED_FIELDS.length}</span> Required
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-icon optional"><i data-lucide="circle"></i></span>
            <span class="detail-text">
              <span id="optionalFilled">0</span>/
              <span>${complianceState.totalOptional}</span> Optional
            </span>
          </div>
        </div>
        
        <div class="compliance-status" id="complianceStatus">
          <span class="status-icon"><i data-lucide="alert-triangle"></i></span>
          <span class="status-text">Fill required fields to start</span>
        </div>
        
        <button id="closeComplianceWidget" class="close-btn" title="Close">
          <i data-lucide="x"></i>
        </button>
        
        <div class="widget-tooltip">Hover to see compliance details</div>
      </div>
      
      <div id="complianceMinimized" class="compliance-minimized hidden">
        <div class="minimized-content">
          <span id="minimizedScore">0%</span>
        </div>
        <button class="restore-btn" title="Restore">
          <i data-lucide="maximize-2"></i>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Inject CSS
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .compliance-score-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 280px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        z-index: 1000;
        padding: 16px;
        color: #fff;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .compliance-score-widget:hover {
        transform: translateY(-4px);
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      }
      
      .compliance-score-widget.hidden {
        display: none;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .compliance-score-widget .score-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      
      .compliance-score-widget .header-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .compliance-score-widget .header-icon svg {
        width: 20px;
        height: 20px;
        color: #fff;
      }
      
      .compliance-score-widget .header-text {
        display: flex;
        flex-direction: column;
      }
      
      .compliance-score-widget .widget-title {
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.5px;
      }
      
      .compliance-score-widget .widget-subtitle {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
      }
      
      .compliance-score-widget .score-display {
        margin-bottom: 14px;
      }
      
      .compliance-score-widget .score-circle {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto;
      }
      
      .compliance-score-widget .score-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      
      .compliance-score-widget .score-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 6;
      }
      
      .compliance-score-widget .score-progress {
        fill: none;
        stroke: url(#complianceGradient);
        stroke-width: 6;
        stroke-linecap: round;
        transition: stroke-dasharray 0.5s ease-out;
      }
      
      .compliance-score-widget .score-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }
      
      .compliance-score-widget .score-number {
        display: block;
        font-size: 22px;
        font-weight: 700;
        color: #10b981;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .compliance-score-widget .score-label {
        display: block;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
        margin-top: 2px;
      }
      
      .compliance-score-widget .compliance-details {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      
      .compliance-score-widget .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
      }
      
      .compliance-score-widget .detail-icon {
        display: flex;
        align-items: center;
      }
      
      .compliance-score-widget .detail-icon.required svg {
        width: 14px;
        height: 14px;
        color: #10b981;
      }
      
      .compliance-score-widget .detail-icon.optional svg {
        width: 14px;
        height: 14px;
        color: #60a5fa;
      }
      
      .compliance-score-widget .detail-text {
        color: rgba(255, 255, 255, 0.8);
      }
      
      .compliance-score-widget .detail-text span {
        font-weight: 600;
        color: #fff;
      }
      
      .compliance-score-widget .compliance-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(16, 185, 129, 0.2);
        font-size: 11px;
        transition: all 0.3s ease;
      }
      
      .compliance-score-widget .compliance-status.warning {
        background: rgba(251, 146, 60, 0.1);
        border-color: rgba(251, 146, 60, 0.2);
        color: #f59e0b;
      }
      
      .compliance-score-widget .compliance-status.warning .status-icon svg {
        color: #f59e0b;
      }
      
      .compliance-score-widget .compliance-status.error {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      
      .compliance-score-widget .compliance-status.error .status-icon svg {
        color: #ef4444;
      }
      
      .compliance-score-widget .compliance-status.success {
        background: rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
      }
      
      .compliance-score-widget .status-icon svg {
        width: 14px;
        height: 14px;
      }
      
      .compliance-score-widget .close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .compliance-score-widget .close-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      
      .compliance-score-widget .close-btn svg {
        width: 14px;
        height: 14px;
      }
      
      .compliance-score-widget .widget-tooltip {
        position: absolute;
        bottom: -32px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
      }
      
      .compliance-score-widget:hover .widget-tooltip {
        opacity: 1;
        visibility: visible;
        bottom: -28px;
      }
      
      .compliance-minimized {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .compliance-minimized:hover {
        transform: scale(1.05);
        box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2);
      }
      
      .compliance-minimized.hidden {
        display: none;
      }
      
      .compliance-minimized .minimized-content {
        font-size: 18px;
        font-weight: 700;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .compliance-minimized .restore-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 18px;
        height: 18px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .compliance-minimized .restore-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .compliance-minimized .restore-btn svg {
        width: 12px;
        height: 12px;
      }
      
      .compliance-score-widget::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #10b981, #3b82f6);
        border-radius: 16px 16px 0 0;
      }
      
      .pulse-success {
        animation: pulseSuccess 2s ease-in-out infinite;
      }
      
      @keyframes pulseSuccess {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      }
      
      /* Gradient for score circle */
      .score-svg defs {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup form observers
  function setupObservers() {
    const form = document.getElementById('aamvaForm');
    if (!form) {
      // Fallback: poll for changes
      setInterval(calculateComplianceScore, 1000);
      return;
    }

    // Listen for changes on all fields
    form.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('input', debounce(calculateComplianceScore, 300));
      field.addEventListener('change', debounce(calculateComplianceScore, 300));
    });
  }

  // Setup event listeners
  function setupEventListeners() {
    // Close button
    document.getElementById('closeComplianceWidget')?.addEventListener('click', () => {
      hideWidget();
    });

    // Restore from minimized
    document.getElementById('complianceMinimized')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('restore-btn')) return;
      restoreWidget();
    });

    // Restore button
    document.querySelector('#complianceMinimized .restore-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      restoreWidget();
    });

    // Toggle widget on button click (for external controls)
    window.addEventListener('toggleComplianceWidget', () => {
      if (complianceState.visible && !complianceState.minimized) {
        minimizeWidget();
      } else if (complianceState.visible && complianceState.minimized) {
        restoreWidget();
      } else {
        showWidget();
      }
    });
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
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
      'complianceType': 'DDA', 'DDA': 'DDA',
      'organDonor': 'DDK', 'DDK': 'DDK',
      'veteran': 'DDL', 'DDL': 'DDL',
      'cdl': 'DCO', 'DCO': 'DCO',
      'familyTruncation': 'DDE', 'DDE': 'DDE',
      'firstTruncation': 'DDF', 'DDF': 'DDF',
      'middleTruncation': 'DDG', 'DDG': 'DDG'
    };

    return nameToTag[name] || null;
  }

  // Collect form data
  function collectFormData() {
    const form = document.getElementById('aamvaForm');
    const data = {};

    if (form) {
      form.querySelectorAll('input, select').forEach(field => {
        const tag = getFieldTag(field);
        if (tag) {
          data[tag] = field.value.trim();
        }
      });
    }

    return data;
  }

  // Calculate compliance score
  function calculateComplianceScore() {
    const formData = collectFormData();
    let requiredCount = 0;
    let optionalCount = 0;

    // Count required fields
    REQUIRED_FIELDS.forEach(tag => {
      if (formData[tag] && formData[tag].trim()) {
        requiredCount++;
      }
    });

    // Count optional fields
    ALL_FIELDS.forEach(tag => {
      if (!REQUIRED_FIELDS.includes(tag) && formData[tag] && formData[tag].trim()) {
        optionalCount++;
      }
    });

    // Calculate score
    const requiredScore = (requiredCount / REQUIRED_FIELDS.length) * 50;
    const optionalScore = (optionalCount / complianceState.totalOptional) * 50;
    const totalScore = Math.round(requiredScore + optionalScore);

    // Update state
    complianceState.score = totalScore;
    complianceState.requiredFilled = requiredCount;
    complianceState.optionalFilled = optionalCount;

    // Update display
    updateScoreDisplay();

    // Show widget if any field is filled
    if (requiredCount > 0 && !complianceState.visible) {
      showWidget();
    }
  }

  // Update score display
  function updateScoreDisplay() {
    // Update score value
    const scoreEl = document.getElementById('complianceScoreValue');
    const minimizedScoreEl = document.getElementById('minimizedScore');
    if (scoreEl) scoreEl.textContent = `${complianceState.score}%`;
    if (minimizedScoreEl) minimizedScoreEl.textContent = `${complianceState.score}%`;

    // Update progress circle
    const progressCircle = document.querySelector('.score-progress');
    if (progressCircle) {
      const circumference = 283; // 2 * PI * 45
      const offset = circumference - (complianceState.score / 100) * circumference;
      progressCircle.style.strokeDasharray = `${circumference - offset}, ${circumference}`;
    }

    // Update counts
    const requiredFilledEl = document.getElementById('requiredFilled');
    const optionalFilledEl = document.getElementById('optionalFilled');
    if (requiredFilledEl) requiredFilledEl.textContent = complianceState.requiredFilled;
    if (optionalFilledEl) optionalFilledEl.textContent = complianceState.optionalFilled;

    // Update status
    updateStatusDisplay();
  }

  // Update status display
  function updateStatusDisplay() {
    const statusEl = document.getElementById('complianceStatus');
    if (!statusEl) return;

    const { score, requiredFilled, totalRequired } = complianceState;

    // Remove all status classes
    statusEl.className = 'compliance-status';

    if (requiredFilled === totalRequired) {
      if (score >= 90) {
        statusEl.classList.add('success');
        statusEl.innerHTML = `
          <span class="status-icon"><i data-lucide="check-circle"></i></span>
          <span class="status-text">100% AAMVA Compliant!</span>
        `;
      } else if (score >= 70) {
        statusEl.classList.add('success');
        statusEl.innerHTML = `
          <span class="status-icon"><i data-lucide="trending-up"></i></span>
          <span class="status-text">Almost perfect! ${100 - score}% to go</span>
        `;
      } else {
        statusEl.classList.add('success');
        statusEl.innerHTML = `
          <span class="status-icon"><i data-lucide="zap"></i></span>
          <span class="status-text">Good progress! Add more details</span>
        `;
      }
    } else if (requiredFilled > 0) {
      statusEl.classList.add('warning');
      statusEl.innerHTML = `
        <span class="status-icon"><i data-lucide="alert-triangle"></i></span>
        <span class="status-text">Complete required fields</span>
      `;
    } else {
      statusEl.classList.add('error');
      statusEl.innerHTML = `
        <span class="status-icon"><i data-lucide="alert-triangle"></i></span>
        <span class="status-text">Fill required fields to start</span>
      `;
    }
  }

  // Show widget
  function showWidget() {
    complianceState.visible = true;
    complianceState.minimized = false;

    const widget = document.getElementById('complianceScoreWidget');
    const minimized = document.getElementById('complianceMinimized');

    widget?.classList.remove('hidden');
    minimized?.classList.add('hidden');
  }

  // Hide widget
  function hideWidget() {
    complianceState.visible = false;
    complianceState.minimized = false;

    const widget = document.getElementById('complianceScoreWidget');
    const minimized = document.getElementById('complianceMinimized');

    widget?.classList.add('hidden');
    minimized?.classList.add('hidden');
  }

  // Minimize widget
  function minimizeWidget() {
    complianceState.minimized = true;

    const widget = document.getElementById('complianceScoreWidget');
    const minimized = document.getElementById('complianceMinimized');

    widget?.classList.add('hidden');
    minimized?.classList.remove('hidden');
  }

  // Restore widget
  function restoreWidget() {
    complianceState.minimized = false;

    const widget = document.getElementById('complianceScoreWidget');
    const minimized = document.getElementById('complianceMinimized');

    widget?.classList.remove('hidden');
    minimized?.classList.add('hidden');
  }

  // Expose API
  window.ComplianceScore = {
    show: showWidget,
    hide: hideWidget,
    toggle: () => complianceState.visible ? hideWidget() : showWidget(),
    getScore: () => complianceState.score,
    refresh: calculateComplianceScore
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComplianceScoreOverlay);
  } else {
    initComplianceScoreOverlay();
  }
})();
