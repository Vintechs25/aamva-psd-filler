/**
 * Particle Effects Component
 * Adds floating particles, confetti, and interactive visual effects
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    particles: {
      count: 25,
      size: { min: 2, max: 6 },
      speed: { min: 0.2, max: 1 },
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    },
    confetti: {
      enabled: true,
      count: 100,
      gravity: 0.5,
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
    },
    fireworks: {
      enabled: true,
      rockets: 5,
      particlesPerRocket: 150
    }
  };

  let particles = [];
  let confettiPieces = [];
  let fireworks = [];
  let animationId = null;
  let canvas = null;
  let ctx = null;
  let isAnimating = false;

  // Initialize
  function init() {
    createCanvas();
    createBackgroundParticles();
    setupEventListeners();
    startAnimation();
  }

  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'particleCanvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
      opacity: 0.3;
    `;
    document.body.appendChild(canvas);
    
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    resizeCanvas();
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function createBackgroundParticles() {
    particles = [];
    for (let i = 0; i < config.particles.count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (config.particles.size.max - config.particles.size.min) + config.particles.size.min,
        speedX: (Math.random() - 0.5) * (config.particles.speed.max - config.particles.speed.min) + config.particles.speed.min,
        speedY: (Math.random() - 0.5) * (config.particles.speed.max - config.particles.speed.min) + config.particles.speed.min,
        color: config.particles.colors[Math.floor(Math.random() * config.particles.colors.length)],
        originalY: Math.random() * canvas.height
      });
    }
  }

  function createConfettiBurst(x, y) {
    for (let i = 0; i < config.confetti.count; i++) {
      confettiPieces.push({
        x: x || canvas.width / 2,
        y: y || canvas.height / 2,
        size: Math.random() * 8 + 4,
        speedX: (Math.random() - 0.5) * 10,
        speedY: -Math.random() * 15 - 5,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: config.confetti.colors[Math.floor(Math.random() * config.confetti.colors.length)],
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }
  }

  function createFirework(x, y) {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    fireworks.push({
      x: x || Math.random() * canvas.width,
      y: y || canvas.height,
      targetY: Math.random() * canvas.height / 2,
      speed: 2 + Math.random() * 3,
      color: color,
      exploded: false,
      particles: []
    });
  }

  function explodeFirework(firework) {
    firework.exploded = true;
    for (let i = 0; i < config.fireworks.particlesPerRocket; i++) {
      firework.particles.push({
        x: firework.x,
        y: firework.y,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 8,
        speedY: (Math.random() - 0.5) * 8,
        opacity: 1,
        lifetime: 100,
        color: firework.color
      });
    }
  }

  function updateFireworks() {
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      
      if (!fw.exploded) {
        fw.y -= fw.speed;
        if (fw.y <= fw.targetY) {
          explodeFirework(fw);
        }
      } else {
        // Update particles
        for (let j = fw.particles.length - 1; j >= 0; j--) {
          const p = fw.particles[j];
          p.x += p.speedX;
          p.y += p.speedY;
          p.opacity -= 0.01;
          p.lifetime--;
          
          if (p.lifetime <= 0 || p.opacity <= 0) {
            fw.particles.splice(j, 1);
          }
        }
        
        // Remove firework if all particles are gone
        if (fw.particles.length === 0) {
          fireworks.splice(i, 1);
        }
      }
    }
  }

  function updateConfetti() {
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const piece = confettiPieces[i];
      piece.x += piece.speedX;
      piece.y += piece.speedY;
      piece.speedY += config.confetti.gravity * 0.1;
      piece.rotation += piece.rotationSpeed;
      piece.opacity -= 0.005;
      
      if (piece.y > canvas.height || piece.opacity <= 0) {
        confettiPieces.splice(i, 1);
      }
    }
  }

  function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Bounce at edges
      if (p.x < 0 || p.x > canvas.width) {
        p.speedX *= -1;
      }
      if (p.y < 0 || p.y > canvas.height) {
        p.speedY *= -1;
      }
    }
  }

  function drawParticles() {
    ctx.globalAlpha = 0.6;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawConfetti() {
    for (const piece of confettiPieces) {
      ctx.save();
      ctx.globalAlpha = piece.opacity;
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation * Math.PI / 180);
      
      if (piece.shape === 'rect') {
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 6, piece.size, piece.size / 3);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = piece.color;
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  function drawFireworks() {
    // Draw rockets
    for (const fw of fireworks) {
      if (!fw.exploded) {
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = fw.color;
        ctx.fill();
        
        // Trail
        ctx.beginPath();
        ctx.moveTo(fw.x, fw.y + 10);
        ctx.lineTo(fw.x, fw.y);
        ctx.strokeStyle = fw.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw exploded particles
      if (fw.exploded) {
        for (const p of fw.particles) {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function animate() {
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateParticles();
    updateConfetti();
    updateFireworks();
    
    drawParticles();
    drawConfetti();
    drawFireworks();
    
    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    animate();
  }

  function stopAnimation() {
    if (!isAnimating) return;
    isAnimating = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);
    
    // Trigger confetti on success events
    window.addEventListener('compliance-success', (e) => {
      if (e.detail && e.detail.score >= 95) {
        createConfettiBurst();
        for (let i = 0; i < 3; i++) {
          setTimeout(() => createFirework(), i * 200);
        }
      }
    });
    
    // Mouse move - create subtle particle effect
    document.addEventListener('mousemove', (e) => {
      if (Math.random() > 0.95) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 2,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          color: config.particles.colors[Math.floor(Math.random() * config.particles.colors.length)]
        });
      }
    });
  }

  // Public API
  window.ParticleEffects = {
    burst: (x, y) => createConfettiBurst(x, y),
    firework: (x, y) => createFirework(x, y),
    enable: () => {
      canvas.style.opacity = '0.3';
      startAnimation();
    },
    disable: () => {
      canvas.style.opacity = '0';
      stopAnimation();
    },
    setOpacity: (opacity) => {
      if (canvas) canvas.style.opacity = opacity;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
