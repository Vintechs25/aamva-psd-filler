/**
 * Status Bar Component
 * Shows system status, notifications, and quick actions at the bottom of the screen
 */

(function() {
  'use strict';

  let statusBar = null;
  let notificationQueue = [];
  let isVisible = true;

  // Create status bar
  function createStatusBar() {
    const html = `
      <div id="statusBar" style="
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(10px);
        border-top: 1px solid rgba(59, 130, 246, 0.2);
        padding: 8px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        transition: all 0.3s ease;
      ">
        <div class="status-left" style="display: flex; align-items: center; gap: 15px;"></div>
        <div class="status-center" style="display: flex; align-items: center; gap: 10px; color: #64748b;"></div>
        <div class="status-right" style="display: flex; align-items: center; gap: 10px;"></div>
        
        <style>
          #statusBar.hidden {
            transform: translateY(100%);
            opacity: 0;
          }
          .status-item {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s ease;
          }
          .status-item:hover {
            background: rgba(255, 255, 255, 0.05);
          }
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-badge.online {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
          }
          .status-badge.offline {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
          }
          .status-badge.processing {
            background: rgba(139, 92, 246, 0.15);
            color: #8b5cf6;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        </style>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    statusBar = document.getElementById('statusBar');
  }

  // Set left content
  function setLeftContent(html) {
    const left = statusBar?.querySelector('.status-left');
    if (left) left.innerHTML = html;
  }

  // Set center content
  function setCenterContent(html) {
    const center = statusBar?.querySelector('.status-center');
    if (center) center.innerHTML = html;
  }

  // Set right content
  function setRightContent(html) {
    const right = statusBar?.querySelector('.status-right');
    if (right) right.innerHTML = html;
  }

  // Show notification in status bar
  function showNotification(message, type = 'info', duration = 5000) {
    const notification = {
      id: Date.now(),
      message,
      type,
      duration,
      createdAt: Date.now()
    };
    
    notificationQueue.push(notification);
    
    if (notificationQueue.length === 1) {
      displayNotification(notification);
    }
  }

  function displayNotification(notification) {
    const center = statusBar?.querySelector('.status-center');
    if (!center) return;
    
    const colors = {
      info: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
      success: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
      warning: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
      error: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
    };
    
    const color = colors[notification.type] || colors.info;
    
    center.innerHTML = `
      <div class="status-item" style="background: ${color.bg}; color: ${color.color}; padding: 6px 12px; border-radius: 6px;">
        <span>${notification.message}</span>
        <span style="margin-left: 5px; font-size: 10px; opacity: 0.7;">
          ${new Date(notification.createdAt).toLocaleTimeString()}
        </span>
      </div>
    `;
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notificationQueue[0]?.id === notification.id) {
        notificationQueue.shift();
        if (notificationQueue.length > 0) {
          displayNotification(notificationQueue[0]);
        } else {
          setCenterContent('');
        }
      }
    }, notification.duration);
  }

  // Toggle visibility
  function toggle() {
    isVisible = !isVisible;
    if (statusBar) {
      statusBar.classList.toggle('hidden', !isVisible);
    }
  }

  // Set system status
  function setSystemStatus(status = 'online', message = '') {
    const left = statusBar?.querySelector('.status-left');
    if (!left) return;
    
    const statuses = {
      online: '<span class="status-badge online"><span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>Online</span>',
      offline: '<span class="status-badge offline"><span style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>Offline</span>',
      processing: '<span class="status-badge processing"><span style="width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; display: inline-block;"></span>Processing</span>'
    };
    
    left.innerHTML = statuses[status] || statuses.online;
    
    if (message) {
      setCenterContent(`<span style="color: #64748b;">${message}</span>`);
    }
  }

  // Set version
  function setVersion(version = '2025') {
    const right = statusBar?.querySelector('.status-right');
    if (right) {
      right.innerHTML = `<span style="color: #64748b; font-size: 11px;">AAMVA ${version}</span>`;
    }
  }

  // Initialize
  function init() {
    createStatusBar();
    setSystemStatus('online');
    setVersion('2025');
    setCenterContent('<span style="color: #64748b;">Ready</span>');
    
    // Listen for online/offline events
    window.addEventListener('online', () => setSystemStatus('online'));
    window.addEventListener('offline', () => setSystemStatus('offline'));
    
    // Listen for custom events
    window.addEventListener('compliance-success', (e) => {
      if (e.detail && e.detail.score >= 95) {
        showNotification(`✓ 100% Compliant! Score: ${e.detail.score}%`, 'success', 3000);
      } else if (e.detail) {
        showNotification(`✓ Compliant! Score: ${e.detail.score}%`, 'success', 3000);
      }
    });
    
    window.addEventListener('processing-start', () => {
      setSystemStatus('processing', 'Generating...');
    });
    
    window.addEventListener('processing-end', () => {
      setSystemStatus('online', 'Done');
    });
  }

  // Public API
  window.StatusBar = {
    showNotification,
    setLeftContent,
    setCenterContent,
    setRightContent,
    setSystemStatus,
    setVersion,
    toggle,
    hide: () => {
      isVisible = false;
      if (statusBar) statusBar.classList.add('hidden');
    },
    show: () => {
      isVisible = true;
      if (statusBar) statusBar.classList.remove('hidden');
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
