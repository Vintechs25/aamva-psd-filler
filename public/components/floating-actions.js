/**
 * Floating Action Buttons with Advanced Animations
 * Modern, interactive FAB system with smooth transitions
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    mainFabSize: 60,
    miniFabSize: 44,
    animationDuration: 0.3,
    expandDistance: 80,
    rotationAngle: 45,
    colors: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    }
  };

  // State
  const fabState = {
    isExpanded: false,
    isAnimating: false,
    activeActions: [],
    lastInteraction: 0
  };

  // Action definitions
  const actions = [
    {
      id: 'generate',
      icon: 'zap',
      label: 'Generate',
      color: config.colors.primary,
      tooltip: 'Generate & Download All Formats',
      shortcut: 'Ctrl+Enter',
      position: { angle: 0, distance: 1 }
    },
    {
      id: 'preview',
      icon: 'eye',
      label: 'Preview',
      color: config.colors.success,
      tooltip: 'Preview Card in 3D',
      shortcut: 'Ctrl+D',
      position: { angle: 45, distance: 1.2 }
    },
    {
      id: 'barcode',
      icon: 'barcode',
      label: 'Barcode',
      color: config.colors.primary,
      tooltip: 'Toggle Barcode Preview',
      shortcut: 'Ctrl+B',
      position: { angle: 90, distance: 1 }
    },
    {
      id: 'compliance',
      icon: 'shield-check',
      label: 'Compliance',
      color: config.colors.success,
      tooltip: 'Toggle Compliance Score',
      shortcut: 'Ctrl+C',
      position: { angle: 135, distance: 1.2 }
    },
    {
      id: 'shortcuts',
      icon: 'keyboard',
      label: 'Shortcuts',
      color: config.colors.warning,
      tooltip: 'Keyboard Shortcuts Guide',
      shortcut: 'Ctrl+K',
      position: { angle: 180, distance: 1 }
    }
  ];

  // Initialize
  function initFloatingActions() {
    injectHTML();
    injectCSS();
    setupEventListeners();
    setupTooltips();
  }

  // Inject HTML
  function injectHTML() {
    const mainFabHtml = `
      <div id="fabContainer" class="fab-container">
        <button id="mainFab" class="fab main-fab" title="Quick Actions">
          <span class="fab-icon">
            <i data-lucide="plus"></i>
          </span>
          <span class="fab-badge">5</span>
        </button>
        ${actions.map(action => `
          <button 
            id="fab-${action.id}"
            class="fab mini-fab fab-${action.id}"
            data-action="${action.id}"
            data-tooltip="${action.tooltip}"
            data-shortcut="${action.shortcut}"
            title="${action.tooltip} (${action.shortcut})"
          >
            <span class="fab-icon" style="--fab-color: ${action.color}">
              <i data-lucide="${action.icon}"></i>
            </span>
            <span class="fab-label">${action.label}</span>
          </button>
        `).join('')}
        <div class="fab-tooltip"></div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', mainFabHtml);
  }

  // Inject CSS
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .fab-container {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 900;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        pointer-events: none;
      }
      
      .fab {
        position: absolute;
        width: ${config.mainFabSize}px;
        height: ${config.mainFabSize}px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all ${config.animationDuration}s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: all;
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        color: white;
        font-size: 24px;
      }
      
      .fab:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .fab:active {
        transform: scale(0.95);
      }
      
      .main-fab {
        z-index: 10;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      }
      
      .main-fab:hover {
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      }
      
      .main-fab.expanded {
        transform: rotate(45deg) scale(1.1);
      }
      
      .main-fab.expanded .fab-icon i {
        transform: rotate(-45deg);
      }
      
      .fab-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
      }
      
      .fab-icon i {
        width: 28px;
        height: 28px;
        transition: all ${config.animationDuration}s ease;
      }
      
      .mini-fab .fab-icon i {
        width: 20px;
        height: 20px;
      }
      
      /* Mini FAB styling */
      .mini-fab {
        width: ${config.miniFabSize}px;
        height: ${config.miniFabSize}px;
        opacity: 0;
        visibility: hidden;
        transform: scale(0.5);
        pointer-events: none;
      }
      
      .mini-fab::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        background: var(--fab-color, ${config.colors.primary});
        border-radius: 50%;
        opacity: 0;
        z-index: -1;
        transition: opacity ${config.animationDuration}s ease;
        filter: blur(10px);
      }
      
      .mini-fab:hover::before {
        opacity: 0.3;
      }
      
      .fab-container.expanded .mini-fab {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
        pointer-events: all;
      }
      
      /* Position mini FABs in a circle */
      ${actions.map((action, index) => `
        #fab-${action.id} {
          --fab-angle: ${action.position.angle}deg;
          --fab-distance: ${action.position.distance * config.expandDistance}px;
        }
      `).join('')}
      
      .fab-container.expanded .mini-fab {
        position: absolute;
        transform: translate(-50%, -50%) 
                  rotate(var(--fab-angle)) 
                  translateY(calc(-1 * var(--fab-distance))) 
                  rotate(calc(-1 * var(--fab-angle))) 
                  scale(1);
        opacity: 1;
        visibility: visible;
        pointer-events: all;
      }
      
      /* Fab labels */
      .fab-label {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all ${config.animationDuration}s ease;
        pointer-events: none;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        margin-right: 8px;
      }
      
      .fab-container.expanded .fab-label {
        opacity: 1;
        visibility: visible;
      }
      
      /* Badge for main FAB */
      .fab-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 22px;
        height: 22px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
        animation: pulse 2s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      /* Main FAB active state */
      .main-fab.active {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        animation: successPulse 1s ease-out;
      }
      
      @keyframes successPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        50% { transform: scale(1.2); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      
      /* Tooltip */
      .fab-tooltip {
        position: fixed;
        top: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        z-index: 901;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .fab-tooltip.show {
        opacity: 1;
        visibility: visible;
      }
      
      /* Floating animation for mini FABs */
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      .fab-container.expanded .mini-fab {
        animation: float 2s ease-in-out infinite;
      }
      
      .mini-fab:hover {
        animation: none;
        transform: scale(1.1) !important;
      }
      
      /* Shortcut hint */
      .fab-shortcut {
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: rgba(255, 255, 255, 0.8);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-family: monospace;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
      }
      
      .mini-fab:hover .fab-shortcut {
        opacity: 1;
        visibility: visible;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup event listeners
  function setupEventListeners() {
    const mainFab = document.getElementById('mainFab');
    const fabContainer = document.getElementById('fabContainer');

    if (!mainFab || !fabContainer) return;

    // Toggle expansion
    mainFab.addEventListener('click', toggleExpansion);

    // Handle mini FAB clicks
    actions.forEach(action => {
      const fab = document.getElementById(`fab-${action.id}`);
      if (fab) {
        fab.addEventListener('click', (e) => {
          e.stopPropagation();
          handleAction(action.id);
        });
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (fabState.isExpanded && !fabContainer.contains(e.target)) {
        collapseFabs();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && fabState.isExpanded) {
        collapseFabs();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const shortcutMap = {
        'Ctrl+Enter': 'generate',
        'Ctrl+D': 'preview',
        'Ctrl+B': 'barcode',
        'Ctrl+C': 'compliance',
        'Ctrl+K': 'shortcuts'
      };

      const keyCombo = getKeyCombo(e);
      const actionId = shortcutMap[keyCombo];

      if (actionId && window.FloatingActions) {
        e.preventDefault();
        handleAction(actionId);
      }
    });

    // Add labels to mini FABs
    actions.forEach(action => {
      const fab = document.getElementById(`fab-${action.id}`);
      if (fab) {
        const label = document.createElement('span');
        label.className = 'fab-label';
        label.textContent = action.label;
        fab.appendChild(label);
      }
    });
  }

  // Get keyboard combination string
  function getKeyCombo(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    parts.push(e.key);
    return parts.join('+');
  }

  // Setup tooltips
  function setupTooltips() {
    const tooltip = document.querySelector('.fab-tooltip');
    if (!tooltip) return;

    actions.forEach(action => {
      const fab = document.getElementById(`fab-${action.id}`);
      if (!fab) return;

      fab.addEventListener('mouseenter', () => {
        tooltip.textContent = `${action.tooltip} (${action.shortcut})`;
        tooltip.style.left = fab.offsetLeft + fab.offsetWidth + 10 + 'px';
        tooltip.style.top = fab.offsetTop + 'px';
        tooltip.classList.add('show');
      });

      fab.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });

      fab.addEventListener('mousemove', (e) => {
        if (tooltip.classList.contains('show')) {
          tooltip.style.left = e.pageX + 10 + 'px';
          tooltip.style.top = e.pageY + 10 + 'px';
        }
      });
    });
  }

  // Toggle FAB expansion
  function toggleExpansion() {
    if (fabState.isExpanded) {
      collapseFabs();
    } else {
      expandFabs();
    }
  }

  // Expand FABs
  function expandFabs() {
    if (fabState.isAnimating) return;

    fabState.isAnimating = true;
    fabState.isExpanded = true;

    const mainFab = document.getElementById('mainFab');
    const fabContainer = document.getElementById('fabContainer');

    mainFab?.classList.add('expanded');
    fabContainer?.classList.add('expanded');

    // Trigger reflow
    fabContainer?.offsetHeight;

    // Animate in mini FABs with stagger
    actions.forEach((action, index) => {
      const fab = document.getElementById(`fab-${action.id}`);
      if (fab) {
        fab.style.transitionDelay = `${index * 0.05}s`;
      }
    });

    setTimeout(() => {
      fabState.isAnimating = false;
    }, config.animationDuration * 1000 + actions.length * 50);
  }

  // Collapse FABs
  function collapseFabs() {
    if (fabState.isAnimating) return;

    fabState.isAnimating = true;
    fabState.isExpanded = false;

    const mainFab = document.getElementById('mainFab');
    const fabContainer = document.getElementById('fabContainer');

    mainFab?.classList.remove('expanded');
    fabContainer?.classList.remove('expanded');

    setTimeout(() => {
      fabState.isAnimating = false;
    }, config.animationDuration * 1000);
  }

  // Handle action
  function handleAction(actionId) {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    // Animate main FAB
    const mainFab = document.getElementById('mainFab');
    mainFab?.classList.add('active');
    setTimeout(() => mainFab?.classList.remove('active'), 1000);

    // Collapse FABs
    collapseFabs();

    // Trigger appropriate function
    switch (actionId) {
      case 'generate':
        triggerGenerate();
        break;
      case 'preview':
        triggerPreview();
        break;
      case 'barcode':
        triggerBarcode();
        break;
      case 'compliance':
        triggerCompliance();
        break;
      case 'shortcuts':
        triggerShortcuts();
        break;
    }

    // Show toast notification
    showToast(`Triggered: ${action.label}`, 'success');
  }

  // Action handlers
  function triggerGenerate() {
    const generateBtn = document.getElementById('btnGenerate') || 
                        document.querySelector('[data-action="generate"]');
    if (generateBtn) {
      generateBtn.click();
    }
    
    // Also trigger form submission if available
    const form = document.getElementById('aamvaForm');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  function triggerPreview() {
    if (window.CardViewer && window.CardViewer.show) {
      window.CardViewer.show();
    }
  }

  function triggerBarcode() {
    if (window.BarcodePreview && window.BarcodePreview.toggle) {
      window.BarcodePreview.toggle();
    }
  }

  function triggerCompliance() {
    if (window.ComplianceScore && window.ComplianceScore.toggle) {
      window.ComplianceScore.toggle();
    }
  }

  function triggerShortcuts() {
    if (window.KeyboardShortcuts && window.KeyboardShortcuts.toggle) {
      window.KeyboardShortcuts.toggle();
    }
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

    setTimeout(() => toast.remove(), 3000);
  }

  // Public API
  window.FloatingActions = {
    expand: expandFabs,
    collapse: collapseFabs,
    toggle: toggleExpansion,
    handleAction: handleAction,
    showAction: (actionId) => {
      const fab = document.getElementById(`fab-${actionId}`);
      if (fab) {
        // Highlight the action
        fab.classList.add('active');
        setTimeout(() => fab.classList.remove('active'), 2000);
      }
    },
    setBadge: (count) => {
      const badge = document.querySelector('.fab-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingActions);
  } else {
    initFloatingActions();
  }
})();
