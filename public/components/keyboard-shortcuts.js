/**
 * Keyboard Shortcuts Guide
 * Interactive overlay showing available keyboard shortcuts
 */

(function() {
  'use strict';

  // Shortcut definitions
  const SHORTCUTS = [
    {
      key: 'Ctrl + S',
      action: 'Save Form Data',
      description: 'Save current form state to browser storage',
      category: 'General',
      icon: 'save'
    },
    {
      key: 'Ctrl + L',
      action: 'Load Form Data',
      description: 'Load saved form state from browser storage',
      category: 'General',
      icon: 'load'
    },
    {
      key: 'Ctrl + G',
      action: 'Generate Preview',
      description: 'Generate and display card preview',
      category: 'Preview',
      icon: 'eye'
    },
    {
      key: 'Ctrl + B',
      action: 'Toggle Barcode Preview',
      description: 'Show/hide live barcode preview widget',
      category: 'Preview',
      icon: 'barcode'
    },
    {
      key: 'Ctrl + C',
      action: 'Toggle Compliance Score',
      description: 'Show/hide compliance score overlay',
      category: 'Compliance',
      icon: 'shield-check'
    },
    {
      key: 'Ctrl + D',
      action: 'Toggle 3D Viewer',
      description: 'Show/hide 3D card viewer',
      category: 'Preview',
      icon: 'box'
    },
    {
      key: 'Ctrl + K',
      action: 'Toggle Shortcuts Guide',
      description: 'Show/hide this keyboard shortcuts guide',
      category: 'Help',
      icon: 'key'
    },
    {
      key: 'Ctrl + /',
      action: 'Toggle AI Assistant',
      description: 'Show/hide AI-powered template analysis',
      category: 'AI',
      icon: 'cpu'
    },
    {
      key: 'Ctrl + Enter',
      action: 'Generate & Download',
      description: 'Generate card and download all formats',
      category: 'Generation',
      icon: 'download'
    },
    {
      key: 'Esc',
      action: 'Close All Overlays',
      description: 'Close all open widgets and dialogs',
      category: 'General',
      icon: 'x'
    },
    {
      key: 'F1',
      action: 'Open Documentation',
      description: 'Open AAMVA standards documentation',
      category: 'Help',
      icon: 'book-open'
    },
    {
      key: 'F2',
      action: 'Toggle Dark Mode',
      description: 'Switch between dark and light themes',
      category: 'UI',
      icon: 'moon'
    }
  ];

  // State
  let shortcutsState = {
    visible: false,
    currentCategory: 'All'
  };

  // Categories
  const CATEGORIES = ['All', 'General', 'Preview', 'Compliance', 'Generation', 'AI', 'UI', 'Help'];

  // Initialize
  function initKeyboardShortcuts() {
    injectHTML();
    injectCSS();
    setupEventListeners();
    setupGlobalShortcuts();
  }

  // Inject HTML
  function injectHTML() {
    const html = `
      <div id="shortcutsModal" class="shortcuts-modal hidden">
        <div class="shortcuts-overlay"></div>
        <div class="shortcuts-container">
          <div class="shortcuts-header">
            <div class="header-left">
              <div class="header-icon">
                <i data-lucide="keyboard"></i>
              </div>
              <div>
                <h2>Keyboard Shortcuts</h2>
                <p>Boost your productivity with these hotkeys</p>
              </div>
            </div>
            <div class="header-controls">
              <button id="closeShortcutsBtn" class="control-btn" title="Close">
                <i data-lucide="x"></i>
              </button>
            </div>
          </div>
          
          <div class="shortcuts-content">
            <div class="category-tabs">
              ${CATEGORIES.map(cat => `
                <button 
                  class="category-tab ${cat === 'All' ? 'active' : ''}" 
                  data-category="${cat}"
                  onclick="window.KeyboardShortcuts?.setCategory('${cat}')"
                >
                  ${cat}
                </button>
              `).join('')}
            </div>
            
            <div class="shortcuts-grid" id="shortcutsGrid">
              <!-- Populated by JavaScript -->
            </div>
          </div>
          
          <div class="shortcuts-footer">
            <p>Press <kbd>Ctrl + K</kbd> to toggle this guide</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Inject CSS
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .shortcuts-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      
      .shortcuts-modal.hidden {
        display: none;
      }
      
      .shortcuts-modal.showing {
        pointer-events: all;
      }
      
      .shortcuts-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .shortcuts-container {
        position: relative;
        width: 90%;
        max-width: 700px;
        max-height: 80vh;
        background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        pointer-events: all;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .shortcuts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
      }
      
      .shortcuts-header .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .shortcuts-header .header-icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .shortcuts-header .header-icon svg {
        width: 24px;
        height: 24px;
        color: #fff;
      }
      
      .shortcuts-header h2 {
        font-size: 18px;
        font-weight: 600;
        color: #fff;
        margin: 0;
      }
      
      .shortcuts-header p {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin: 4px 0 0 0;
      }
      
      .shortcuts-header .control-btn {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .shortcuts-header .control-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }
      
      .shortcuts-header .control-btn svg {
        width: 20px;
        height: 20px;
      }
      
      .shortcuts-content {
        padding: 20px 24px;
        max-height: calc(80vh - 140px);
        overflow-y: auto;
      }
      
      .shortcuts-content::-webkit-scrollbar {
        width: 6px;
      }
      
      .shortcuts-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      
      .shortcuts-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
      }
      
      .shortcuts-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
      }
      
      .category-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .category-tab {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .category-tab:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .category-tab.active {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
        border-color: rgba(16, 185, 129, 0.4);
        color: #10b981;
      }
      
      .shortcuts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
      }
      
      .shortcut-item {
        display: flex;
        gap: 12px;
        padding: 14px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .shortcut-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateX(4px);
      }
      
      .shortcut-key {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 80px;
      }
      
      .shortcut-key kbd {
        padding: 6px 10px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .shortcut-action {
        flex: 1;
        min-width: 0;
      }
      
      .shortcut-action h4 {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        margin: 0 0 4px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .shortcut-action p {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        margin: 0;
        line-height: 1.4;
      }
      
      .shortcut-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .shortcut-icon svg {
        width: 18px;
        height: 18px;
        color: #60a5fa;
      }
      
      .shortcuts-footer {
        padding: 16px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
      }
      
      .shortcuts-footer p {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        margin: 0;
      }
      
      .shortcuts-footer kbd {
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 11px;
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      kbd {
        font-family: inherit;
        font-size: inherit;
        color: inherit;
        background: inherit;
        border: none;
        padding: 0;
        margin: 0;
        box-shadow: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Close button
    document.getElementById('closeShortcutsBtn')?.addEventListener('click', () => {
      hideModal();
    });

    // Close on overlay click
    document.querySelector('.shortcuts-overlay')?.addEventListener('click', () => {
      hideModal();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && shortcutsState.visible) {
        hideModal();
      }
    });
  }

  // Setup global keyboard shortcuts
  function setupGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Check if we're in an input field
      const tagName = document.activeElement.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return;
      }

      // Ctrl + K to toggle shortcuts guide
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        toggleModal();
      }

      // Escape to close all overlays
      if (e.key === 'Escape') {
        // Close shortcuts modal
        if (shortcutsState.visible) {
          e.preventDefault();
          hideModal();
        }
      }
    });
  }

  // Render shortcuts for current category
  function renderShortcuts(category = 'All') {
    const grid = document.getElementById('shortcutsGrid');
    if (!grid) return;

    const filtered = category === 'All' 
      ? SHORTCUTS 
      : SHORTCUTS.filter(s => s.category === category);

    grid.innerHTML = filtered.map(shortcut => `
      <div class="shortcut-item" title="${shortcut.description}">
        <div class="shortcut-icon">
          <i data-lucide="${shortcut.icon}"></i>
        </div>
        <div class="shortcut-key">
          <kbd>${shortcut.key}</kbd>
        </div>
        <div class="shortcut-action">
          <h4>${shortcut.action}</h4>
          <p>${shortcut.description}</p>
        </div>
      </div>
    `).join('');

    // Update category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === category);
    });
  }

  // Show modal
  function showModal() {
    shortcutsState.visible = true;
    const modal = document.getElementById('shortcutsModal');
    modal?.classList.remove('hidden');
    setTimeout(() => modal?.classList.add('showing'), 10);
    renderShortcuts(shortcutsState.currentCategory);
  }

  // Hide modal
  function hideModal() {
    shortcutsState.visible = false;
    const modal = document.getElementById('shortcutsModal');
    modal?.classList.remove('showing');
    setTimeout(() => modal?.classList.add('hidden'), 200);
  }

  // Toggle modal
  function toggleModal() {
    if (shortcutsState.visible) {
      hideModal();
    } else {
      showModal();
    }
  }

  // Set category
  function setCategory(category) {
    shortcutsState.currentCategory = category;
    renderShortcuts(category);
  }

  // Expose API
  window.KeyboardShortcuts = {
    show: showModal,
    hide: hideModal,
    toggle: toggleModal,
    setCategory: setCategory,
    getShortcuts: () => SHORTCUTS
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);
  } else {
    initKeyboardShortcuts();
  }
})();
