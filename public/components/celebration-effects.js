/**
 * Celebration Effects System
 * Confetti, particles, and animations for user delight
 */

(function() {
  'use strict';

  // State
  let celebrationState = {
    enabled: true,
    confettiCanvas: null,
    confettiCtx: null,
    particles: [],
    fireworks: [],
    lastCelebration: 0,
    celebrationThreshold: 95 // Trigger at 95% or higher
  };

  // Confetti particle class
  class ConfettiParticle {
    constructor(canvasWidth, canvasHeight) {
      this.x = Math.random() * canvasWidth;
      this.y = Math.random() * canvasHeight - canvasHeight / 2;
      this.width = Math.random() * 10 + 5;
      this.height = Math.random() * 5 + 3;
      this.angle = Math.random() * 360;
      this.speed = Math.random() * 2 + 1;
      this.velX = Math.cos(this.angle * Math.PI / 180) * this.speed;
      this.velY = Math.sin(this.angle * Math.PI / 180) * this.speed + 2;
      this.accelY = 0.05;
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
      this.color = this.getRandomColor();
      this.opacity = Math.random() * 0.5 + 0.5;
      this.life = 100;
      this.decay = Math.random() * 0.01 + 0.005;
    }

    getRandomColor() {
      const colors = [
        '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
        '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#eab308'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.velY += this.accelY;
      this.x += this.velX;
      this.y += this.velY;
      this.rotation += this.rotationSpeed;
      this.opacity -= this.decay;
      this.life--;
      return this.life > 0 && this.opacity > 0;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    }
  }

  // Firework particle class
  class FireworkParticle {
    constructor(x, y, targetX, targetY) {
      this.x = x;
      this.y = y;
      this.targetX = targetX;
      this.targetY = targetY;
      this.speed = 2;
      this.angle = Math.atan2(targetY - y, targetX - x);
      this.velX = Math.cos(this.angle) * this.speed;
      this.velY = Math.sin(this.angle) * this.speed;
      this.accelY = 0.05;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      this.size = Math.random() * 3 + 1;
      this.life = 60;
      this.trail = [];
      this.maxTrail = 10;
    }

    update() {
      this.velY += this.accelY;
      this.x += this.velX;
      this.y += this.velY;
      this.life--;
      
      // Add position to trail
      this.trail.push({ x: this.x, y: this.y, size: this.size * 0.5 });
      if (this.trail.length > this.maxTrail) {
        this.trail.shift();
      }
      
      return this.life > 0;
    }

    draw(ctx) {
      // Draw trail
      this.trail.forEach((point, index) => {
        const alpha = index / this.trail.length;
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw particle
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Firework explosion class
  class FireworkExplosion {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.particles = [];
      this.age = 0;
      this.maxAge = 30;
      
      // Create explosion particles
      for (let i = 0; i < 100; i++) {
        this.particles.push(new ExplosionParticle(x, y));
      }
    }

    update() {
      this.age++;
      this.particles = this.particles.filter(p => p.update());
      return this.age < this.maxAge || this.particles.length > 0;
    }

    draw(ctx) {
      this.particles.forEach(p => p.draw(ctx));
    }
  }

  class ExplosionParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.angle = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 5 + 1;
      this.velX = Math.cos(this.angle) * this.speed;
      this.velY = Math.sin(this.angle) * this.speed;
      this.accelY = 0.08;
      this.size = Math.random() * 3 + 1;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      this.life = Math.random() * 30 + 20;
      this.opacity = 1;
      this.decay = 1 / this.life;
    }

    update() {
      this.velY += this.accelY;
      this.x += this.velX;
      this.y += this.velY;
      this.opacity -= this.decay;
      this.life--;
      return this.life > 0 && this.opacity > 0.1;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Initialize
  function initCelebrationEffects() {
    injectHTML();
    injectCSS();
    setupCanvas();
    setupEventListeners();
    startAnimationLoop();
  }

  // Inject HTML
  function injectHTML() {
    const html = `
      <canvas id="celebrationCanvas" class="celebration-canvas"></canvas>
      <div id="celebrationOverlay" class="celebration-overlay hidden">
        <div class="celebration-content">
          <div class="celebration-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/>
            </svg>
          </div>
          <h2 class="celebration-title">100% AAMVA COMPLIANT!</h2>
          <p class="celebration-subtitle">Your design meets all standards</p>
          <button id="closeCelebrationBtn" class="celebration-close-btn" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <audio id="celebrationSound" src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAA" preload="auto"></audio>
      <audio id="confettiSound" src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqEbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQAA" preload="auto"></audio>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Inject CSS
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .celebration-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .celebration-canvas.active {
        opacity: 1;
      }
      
      .celebration-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%);
        backdrop-filter: blur(20px);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .celebration-overlay.showing {
        opacity: 1;
        visibility: visible;
      }
      
      .celebration-overlay.hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      
      .celebration-content {
        text-align: center;
        padding: 40px;
        max-width: 400px;
        animation: bounceIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes bounceIn {
        0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
        50% { transform: scale(1.1) rotate(5deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      
      .celebration-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.2);
        animation: pulseGlow 2s ease-in-out infinite;
      }
      
      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
        50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8); }
      }
      
      .celebration-icon svg {
        width: 40px;
        height: 40px;
        color: white;
        animation: rotate 3s linear infinite;
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .celebration-title {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 10px 0;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        background: linear-gradient(135deg, #10b981, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .celebration-subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
        font-weight: 500;
      }
      
      .celebration-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 10px;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .celebration-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
      
      .celebration-close-btn svg {
        width: 20px;
        height: 20px;
      }
      
      /* Floating emoji particles */
      .emoji-particle {
        position: absolute;
        font-size: 24px;
        pointer-events: none;
        z-index: 9999;
        animation: floatUp 3s ease-out forwards;
      }
      
      @keyframes floatUp {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Setup canvas
  function setupCanvas() {
    const canvas = document.getElementById('celebrationCanvas');
    if (!canvas) return;

    celebrationState.confettiCanvas = canvas;
    celebrationState.confettiCtx = canvas.getContext('2d');
    
    // Resize canvas
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  // Resize canvas to window size
  function resizeCanvas() {
    if (!celebrationState.confettiCanvas) return;
    
    celebrationState.confettiCanvas.width = window.innerWidth;
    celebrationState.confettiCanvas.height = window.innerHeight;
  }

  // Setup event listeners
  function setupEventListeners() {
    // Close celebration overlay
    document.getElementById('closeCelebrationBtn')?.addEventListener('click', () => {
      hideCelebration();
    });

    // Close on overlay click
    document.getElementById('celebrationOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'celebrationOverlay') {
        hideCelebration();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideCelebration();
      }
    });

    // Listen for compliance events
    window.addEventListener('complianceScoreUpdate', (e) => {
      if (e.detail && e.detail.score >= celebrationState.celebrationThreshold) {
        triggerCelebration(e.detail.score);
      }
    });

    // Also check compliance score periodically
    setInterval(() => {
      if (window.ComplianceScore && window.ComplianceScore.getScore) {
        const score = window.ComplianceScore.getScore();
        if (score >= celebrationState.celebrationThreshold) {
          // Only trigger once per session unless forced
          const now = Date.now();
          if (now - celebrationState.lastCelebration > 30000) {
            triggerCelebration(score);
          }
        }
      }
    }, 5000);
  }

  // Animation loop
  function startAnimationLoop() {
    function animate() {
      if (!celebrationState.confettiCanvas || !celebrationState.confettiCtx) {
        requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      celebrationState.confettiCtx.clearRect(
        0, 0,
        celebrationState.confettiCanvas.width,
        celebrationState.confettiCanvas.height
      );

      // Update and draw particles
      celebrationState.particles = celebrationState.particles.filter(p => {
        p.update();
        p.draw(celebrationState.confettiCtx);
        return p.life > 0;
      });

      // Update and draw fireworks
      celebrationState.fireworks = celebrationState.fireworks.filter(f => {
        f.update();
        f.draw(celebrationState.confettiCtx);
        return f.age < f.maxAge || f.particles.length > 0;
      });

      // Continue loop if there are particles
      if (celebrationState.particles.length > 0 || celebrationState.fireworks.length > 0) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  // Trigger celebration
  function triggerCelebration(score) {
    if (!celebrationState.enabled) return;

    celebrationState.lastCelebration = Date.now();

    // Activate canvas
    const canvas = document.getElementById('celebrationCanvas');
    canvas?.classList.add('active');

    // Launch fireworks
    launchFireworks();

    // Throw confetti
    throwConfetti();

    // Show overlay
    const overlay = document.getElementById('celebrationOverlay');
    overlay?.classList.remove('hidden');
    overlay?.classList.add('showing');

    // Play sounds
    playSound('celebrationSound');
    setTimeout(() => playSound('confettiSound'), 300);

    // Broadcast celebration event
    window.dispatchEvent(new CustomEvent('celebrationTriggered', {
      detail: { score, type: 'compliance' }
    }));

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideCelebration();
    }, 5000);
  }

  // Launch fireworks
  function launchFireworks() {
    const count = 5;
    const canvas = celebrationState.confettiCanvas;
    if (!canvas) return;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvas.width;
      const y = canvas.height + Math.random() * 100;
      const targetX = Math.random() * canvas.width;
      const targetY = Math.random() * canvas.height / 2;
      
      celebrationState.fireworks.push(new FireworkParticle(x, y, targetX, targetY));
    }

    // Schedule explosion at top
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height / 3;
        celebrationState.fireworks.push(new FireworkExplosion(x, y));
      }
    }, 1000);
  }

  // Throw confetti
  function throwConfetti() {
    const canvas = celebrationState.confettiCanvas;
    if (!canvas) return;

    // Burst 1: Initial confetti
    for (let i = 0; i < 100; i++) {
      celebrationState.particles.push(new ConfettiParticle(canvas.width, canvas.height));
    }

    // Burst 2: After delay
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        celebrationState.particles.push(new ConfettiParticle(canvas.width, canvas.height));
      }
    }, 500);

    // Burst 3: Final
    setTimeout(() => {
      for (let i = 0; i < 100; i++) {
        celebrationState.particles.push(new ConfettiParticle(canvas.width, canvas.height));
      }
    }, 1500);
  }

  // Hide celebration
  function hideCelebration() {
    const canvas = document.getElementById('celebrationCanvas');
    const overlay = document.getElementById('celebrationOverlay');

    canvas?.classList.remove('active');
    overlay?.classList.remove('showing');
    overlay?.classList.add('hidden');

    // Clear particles
    celebrationState.particles = [];
    celebrationState.fireworks = [];
  }

  // Play sound
  function playSound(soundId) {
    try {
      const sound = document.getElementById(soundId);
      if (sound) {
        sound.currentTime = 0;
        sound.volume = 0.5;
        sound.play().catch(() => {}); // Ignore autoplay errors
      }
    } catch (e) {
      // Sound may be blocked, that's ok
    }
  }

  // Public API
  window.CelebrationEffects = {
    trigger: triggerCelebration,
    hide: hideCelebration,
    enable: () => { celebrationState.enabled = true; },
    disable: () => { celebrationState.enabled = false; },
    setThreshold: (threshold) => { celebrationState.celebrationThreshold = threshold; },
    throwConfetti: throwConfetti,
    launchFireworks: launchFireworks
  };

  // Auto-trigger on high scores
  function checkComplianceAndTrigger() {
    if (window.ComplianceScore && window.ComplianceScore.getScore) {
      const score = window.ComplianceScore.getScore();
      if (score >= celebrationState.celebrationThreshold) {
        triggerCelebration(score);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCelebrationEffects();
      setTimeout(checkComplianceAndTrigger, 2000);
    });
  } else {
    initCelebrationEffects();
    setTimeout(checkComplianceAndTrigger, 2000);
  }
})();
