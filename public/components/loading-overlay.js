/**
 * Loading Overlay Component
 * Beautiful loading animations with progress and status
 */

(function() {
  'use strict';

  let overlay = null;
  let progressBar = null;
  let progressText = null;
  let statusText = null;
  let spinner = null;
  let isVisible = false;
  let progress = 0;
  let animationId = null;

  // Create overlay HTML
  function createOverlay() {
    const html = `
      <div id="loadingOverlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(10px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        flex-direction: column;
        gap: 20px;
      " class="loading-overlay">
        <div class="loader-container" style="text-align: center;">
          <div class="spinner" style="
            width: 60px;
            height: 60px;
            border: 4px solid rgba(59, 130, 246, 0.3);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <div style="
            width: 200px;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            margin: 0 auto;
          ">
            <div id="loadingProgress" style="
              height: 100%;
              background: linear-gradient(90deg, #3b82f6, #8b5cf6);
              width: 0%;
              transition: width 0.3s ease;
              border-radius: 3px;
            "></div>
          </div>
          <div id="loadingProgressText" style="
            margin-top: 10px;
            color: #94a3b8;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">Loading...</div>
          <div id="loadingStatus" style="
            color: #64748b;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin-top: 5px;
          "></div>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .loading-dots::after {
            content: '';
            animation: dots 1.5s infinite;
          }
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
        </style>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', html);
    overlay = document.getElementById('loadingOverlay');
    progressBar = document.getElementById('loadingProgress');
    progressText = document.getElementById('loadingProgressText');
    statusText = document.getElementById('loadingStatus');
  }

  // Show overlay
  function show(message = 'Loading...', status = '') {
    if (isVisible) return;
    
    if (!overlay) createOverlay();
    
    isVisible = true;
    progress = 0;
    overlay.style.display = 'flex';
    progressText.textContent = message;
    statusText.textContent = status;
    
    // Add animation class
    overlay.classList.add('visible');
    
    // Start loading animation
    startLoadingAnimation();
  }

  // Hide overlay
  function hide() {
    if (!isVisible) return;
    
    isVisible = false;
    overlay.style.display = 'none';
    overlay.classList.remove('visible');
    
    stopLoadingAnimation();
    
    // Reset progress
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = 'Loading...';
    if (statusText) statusText.textContent = '';
  }

  // Update progress
  function setProgress(value, message = null) {
    progress = Math.min(100, Math.max(0, value));
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (message && progressText) {
      progressText.textContent = message;
    }
  }

  // Increment progress
  function incrementProgress(amount = 10, message = null) {
    setProgress(progress + amount, message);
  }

  // Set status message
  function setStatus(message) {
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // Loading animation
  function startLoadingAnimation() {
    let angle = 0;
    const spinner = overlay?.querySelector('.spinner');
    
    function animate() {
      if (!spinner) return;
      angle = (angle + 2) % 360;
      spinner.style.transform = `rotate(${angle}deg)`;
      animationId = requestAnimationFrame(animate);
    }
    
    animate();
  }

  function stopLoadingAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Create a fancy success animation
  function showSuccess(message = 'Success!', duration = 2000) {
    hide();
    
    const successOverlay = document.createElement('div');
    successOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
        z-index: 100000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
      ">
        <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span>${message}</span>
        <style>
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) translateY(0);
            }
          }
          @keyframes fadeOut {
            from {
              opacity: 1;
              transform: translate(-50%, -50%) translateY(0);
            }
            to {
              opacity: 0;
              transform: translate(-50%, -50%) translateY(-20px);
            }
          }
        </style>
      </div>
    `;
    
    document.body.appendChild(successOverlay);
    
    // Trigger particle effects
    if (window.ParticleEffects) {
      window.ParticleEffects.burst(window.innerWidth / 2, window.innerHeight / 2);
    }
    
    setTimeout(() => {
      successOverlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => successOverlay.remove(), 300);
    }, duration);
  }

  // Create error notification
  function showError(message = 'Error!', duration = 3000) {
    hide();
    
    const errorOverlay = document.createElement('div');
    errorOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(239, 68, 68, 0.3);
        z-index: 100000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
      ">
        <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>${message}</span>
        <style>
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) translateY(0);
            }
          }
        </style>
      </div>
    `;
    
    document.body.appendChild(errorOverlay);
    
    setTimeout(() => {
      errorOverlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => errorOverlay.remove(), 300);
    }, duration);
  }

  // Auto-hide after timeout
  function showWithTimeout(message = 'Loading...', timeout = 5000) {
    show(message);
    setTimeout(() => {
      if (isVisible) {
        hide();
      }
    }, timeout);
  }

  // Public API
  window.LoadingOverlay = {
    show,
    hide,
    setProgress,
    incrementProgress,
    setStatus,
    showSuccess,
    showError,
    showWithTimeout,
    isVisible: () => isVisible
  };

  // Initialize
  createOverlay();
})();
