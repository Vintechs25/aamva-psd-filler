/**
 * 3D Card Viewer Component
 * Interactive 3D preview of DL card with lighting effects and UV simulation
 */

(function() {
  'use strict';

  // State
  let cardViewerState = {
    visible: false,
    currentSide: 'front', // 'front' or 'back'
    isRotating: false,
    uvEnabled: false,
    hologramEnabled: true,
    rotation: { x: 0, y: 0 },
    dragStart: null,
    cardImages: {
      front: null,
      back: null
    }
  };

  // CR80 dimensions in pixels at 300 DPI
  const CARD_DIMENSIONS = {
    width: 320,
    height: 196,
    aspectRatio: 85.6 / 53.98
  };

  // Initialize
  function initCardViewer() {
    injectHTML();
    injectCSS();
    setupEventListeners();
    setupDragAndDrop();
  }

  // Inject HTML
  function injectHTML() {
    const html = `
      <div id="cardViewerContainer">
        <div class="viewer-header">
          <div class="header-left">
            <div class="header-icon">
              <i data-lucide="credit-card"></i>
            </div>
            <div>
              <h3 class="header-title">3D Card Viewer</h3>
              <p class="header-subtitle">Interactive Preview</p>
            </div>
          </div>
          <button class="close-btn" id="closeCardViewer">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div id="card3dScene">
          <div id="card3d" class="zoom-in">
            <div id="hologramEffect" class="hologram-effect"></div>
            <div id="uvOverlay" class="uv-overlay"></div>
            <img id="frontCardImage" class="card-face front" />
            <img id="backCardImage" class="card-face back" />
            <div class="side-label front">FRONT</div>
            <div class="side-label back">BACK</div>
          </div>
        </div>
        <div id="cardViewerControls">
          <div class="control-group">
            <button class="control-btn" id="rotateLeftBtn" title="Rotate left">
              <i data-lucide="rotate-ccw"></i>
            </button>
            <button class="control-btn" id="rotateRightBtn" title="Rotate right">
              <i data-lucide="rotate-cw"></i>
            </button>
            <button class="control-btn" id="flipBtn" title="Flip card">
              <i data-lucide="repeat-2"></i>
            </button>
            <button class="control-btn" id="resetBtn" title="Reset view">
              <i data-lucide="refresh-ccw"></i>
            </button>
          </div>
          <div class="control-group">
            <div class="control-btn uv-toggle" id="uvToggleBtn" title="Toggle UV light">
              <span class="uv-slider"></span>
            </div>
            <span class="uv-toggle-label" id="uvToggleLabel">UV Light</span>
          </div>
          <div class="control-group">
            <button class="control-btn" id="downloadFrontBtn" title="Download front">
              <i data-lucide="download"></i>
            </button>
            <button class="control-btn" id="downloadBackBtn" title="Download back">
              <i data-lucide="image"></i>
            </button>
          </div>
        </div>
        <div class="card-viewer-tooltip">Drag to rotate, Pinch to zoom</div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Inject CSS
  function injectCSS() {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/components/card-viewer.css';
    document.head.appendChild(style);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Close button
    document.getElementById('closeCardViewer')?.addEventListener('click', closeViewer);
    
    // Rotation buttons
    document.getElementById('rotateLeftBtn')?.addEventListener('click', () => rotateCard(-45));
    document.getElementById('rotateRightBtn')?.addEventListener('click', () => rotateCard(45));
    document.getElementById('flipBtn')?.addEventListener('click', flipCard);
    document.getElementById('resetBtn')?.addEventListener('click', resetCard);
    
    // UV Toggle
    document.getElementById('uvToggleBtn')?.addEventListener('click', toggleUV);
    
    // Download buttons
    document.getElementById('downloadFrontBtn')?.addEventListener('click', () => downloadImage('front'));
    document.getElementById('downloadBackBtn')?.addEventListener('click', () => downloadImage('back'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);
    
    // Window resize
    window.addEventListener('resize', debounce(resizeCard, 100));
  }

  // Setup drag and drop for card rotation
  function setupDragAndDrop() {
    const card3d = document.getElementById('card3d');
    const scene = document.getElementById('card3dScene');
    
    if (!card3d || !scene) return;
    
    // Mouse drag for rotation
    let isDragging = false;
    let startX, startY;
    
    card3d.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      card3d.style.transition = 'none';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      cardViewerState.rotation.y += dx * 0.5;
      cardViewerState.rotation.x -= dy * 0.5;
      
      // Limit rotation
      cardViewerState.rotation.x = Math.max(-30, Math.min(30, cardViewerState.rotation.x));
      
      updateCardTransform();
      
      startX = e.clientX;
      startY = e.clientY;
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        card3d.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
      }
    });
    
    // Touch support
    let touchStartX, touchStartY;
    
    card3d.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        card3d.style.transition = 'none';
        e.preventDefault();
      }
    });
    
    card3d.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      
      cardViewerState.rotation.y += dx * 0.5;
      cardViewerState.rotation.x -= dy * 0.5;
      
      cardViewerState.rotation.x = Math.max(-30, Math.min(30, cardViewerState.rotation.x));
      
      updateCardTransform();
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });
    
    card3d.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        card3d.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
      }
    });
  }

  // Update card transform based on rotation state
  function updateCardTransform() {
    const card3d = document.getElementById('card3d');
    if (!card3d) return;
    
    // Calculate scale based on current side
    const isFlipped = cardViewerState.currentSide === 'back';
    const targetY = isFlipped ? 180 : 0;
    
    // Apply rotation with spring-back effect
    const springFactor = 0.2;
    cardViewerState.rotation.y = cardViewerState.rotation.y * (1 - springFactor);
    cardViewerState.rotation.x = cardViewerState.rotation.x * (1 - springFactor);
    
    const transform = `translate(-50%, -50%) rotateY(${targetY + cardViewerState.rotation.y}deg) rotateX(${cardViewerState.rotation.x}deg)`;
    card3d.style.transform = transform;
  }

  // Rotate card
  function rotateCard(degrees) {
    cardViewerState.rotation.y += degrees;
    const card3d = document.getElementById('card3d');
    card3d.style.transition = 'none';
    updateCardTransform();
    
    setTimeout(() => {
      card3d.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }, 10);
  }

  // Flip card
  function flipCard() {
    cardViewerState.currentSide = cardViewerState.currentSide === 'front' ? 'back' : 'front';
    const card3d = document.getElementById('card3d');
    card3d.classList.toggle('flip');
    
    // Update labels
    const frontLabel = document.querySelector('.side-label.front');
    const backLabel = document.querySelector('.side-label.back');
    
    if (frontLabel && backLabel) {
      if (cardViewerState.currentSide === 'back') {
        frontLabel.style.display = 'none';
        backLabel.style.display = 'block';
      } else {
        frontLabel.style.display = 'block';
        backLabel.style.display = 'none';
      }
    }
    
    updateCardTransform();
  }

  // Reset card view
  function resetCard() {
    cardViewerState.rotation.x = 0;
    cardViewerState.rotation.y = 0;
    cardViewerState.currentSide = 'front';
    
    const card3d = document.getElementById('card3d');
    card3d.classList.remove('flip', 'rotate-left', 'rotate-right');
    card3d.style.transform = 'translate(-50%, -50%) rotateY(0deg) rotateX(0deg)';
    
    // Show front label, hide back
    const frontLabel = document.querySelector('.side-label.front');
    const backLabel = document.querySelector('.side-label.back');
    if (frontLabel) frontLabel.style.display = 'block';
    if (backLabel) backLabel.style.display = 'none';
  }

  // Toggle UV light
  function toggleUV() {
    cardViewerState.uvEnabled = !cardViewerState.uvEnabled;
    const uvOverlay = document.getElementById('uvOverlay');
    const uvToggleBtn = document.getElementById('uvToggleBtn');
    const uvToggleLabel = document.getElementById('uvToggleLabel');
    
    uvToggleBtn?.classList.toggle('active', cardViewerState.uvEnabled);
    uvOverlay?.classList.toggle('visible', cardViewerState.uvEnabled);
    if (uvToggleLabel) {
      uvToggleLabel.textContent = cardViewerState.uvEnabled ? 'UV Light: ON' : 'UV Light: OFF';
    }
    
    // Apply UV effect to images
    applyUVEffect(cardViewerState.uvEnabled);
  }

  // Apply UV effect to card images
  function applyUVEffect(enabled) {
    const frontImg = document.getElementById('frontCardImage');
    const backImg = document.getElementById('backCardImage');
    
    if (enabled) {
      frontImg?.classList.add('uv-effect');
      backImg?.classList.add('uv-effect');
    } else {
      frontImg?.classList.remove('uv-effect');
      backImg?.classList.remove('uv-effect');
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

  // Handle keyboard shortcuts
  function handleKeydown(e) {
    if (!cardViewerState.visible) return;
    
    switch (e.key) {
      case 'Escape':
        closeViewer();
        break;
      case 'ArrowLeft':
        rotateCard(-15);
        break;
      case 'ArrowRight':
        rotateCard(15);
        break;
      case 'ArrowUp':
        cardViewerState.rotation.x = Math.min(30, cardViewerState.rotation.x + 5);
        updateCardTransform();
        break;
      case 'ArrowDown':
        cardViewerState.rotation.x = Math.max(-30, cardViewerState.rotation.x - 5);
        updateCardTransform();
        break;
      case 'f':
      case 'F':
        flipCard();
        break;
      case 'r':
      case 'R':
        resetCard();
        break;
      case 'u':
      case 'U':
        toggleUV();
        break;
    }
  }

  // Download image
  function downloadImage(side) {
    const img = document.getElementById(`${side}CardImage`);
    if (!img || !img.src || img.src === 'data:,') {
      showToast('No image available to download', 'warning');
      return;
    }
    
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `aamva-${side}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    
    showToast(`${side.toUpperCase()} image downloaded!`, 'success');
  }

  // Resize card
  function resizeCard() {
    // Recalculate dimensions if needed
  }

  // Set card images
  function setCardImages(frontSrc, backSrc) {
    cardViewerState.cardImages.front = frontSrc;
    cardViewerState.cardImages.back = backSrc;
    
    const frontImg = document.getElementById('frontCardImage');
    const backImg = document.getElementById('backCardImage');
    
    if (frontImg && frontSrc) {
      frontImg.src = frontSrc;
      frontImg.style.display = 'block';
    }
    
    if (backImg && backSrc) {
      backImg.src = backSrc;
      backImg.style.display = 'block';
    }
    
    // Add loaded class for animations
    const card3d = document.getElementById('card3d');
    card3d?.classList.add('loaded');
  }

  // Show viewer
  function showViewer(frontImage, backImage) {
    const container = document.getElementById('cardViewerContainer');
    if (!container) return;
    
    // Set images
    setCardImages(frontImage, backImage);
    
    // Show container
    cardViewerState.visible = true;
    container.classList.add('visible');
    
    // Reset view
    resetCard();
    
    // Enable UV if it was on
    if (cardViewerState.uvEnabled) {
      applyUVEffect(true);
      document.getElementById('uvToggleBtn')?.classList.add('active');
    }
    
    // Focus for keyboard shortcuts
    container.focus();
  }

  // Close viewer
  function closeViewer() {
    const container = document.getElementById('cardViewerContainer');
    if (!container) return;
    
    cardViewerState.visible = false;
    container.classList.remove('visible');
    
    // Reset rotation
    resetCard();
    
    // Disable UV
    applyUVEffect(false);
    document.getElementById('uvToggleBtn')?.classList.remove('active');
    document.getElementById('uvToggleLabel')?.textContent = 'UV Light: OFF';
    cardViewerState.uvEnabled = false;
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
    document.addEventListener('DOMContentLoaded', initCardViewer);
  } else {
    initCardViewer();
  }

  // Expose public API
  window.CardViewer = {
    show: (front, back) => showViewer(front, back),
    hide: closeViewer,
    toggle: (front, back) => cardViewerState.visible ? closeViewer() : showViewer(front, back),
    setImages: setCardImages,
    setFrontImage: (src) => setCardImages(src, cardViewerState.cardImages.back),
    setBackImage: (src) => setCardImages(cardViewerState.cardImages.front, src)
  };
})();
