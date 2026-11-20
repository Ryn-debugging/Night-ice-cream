/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — 2D HTML5 Canvas Scene & Character Renderer
   Renders the rain-drenched street, streetlight mist, kiosk interior,
   animated sliding frosted window, layered 2D horror characters with live
   blinking/staring eyes & visual clues, physical counter cup, phone, and
   ending backdrops.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  class KioskRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = 1280;
      this.height = 720;
      this.dpr = 1;

      this.time = 0;
      this.rainDrops = [];
      this.fogPuffs = [];
      this.windowDrops = [];

      // Dynamic visual state driven by Game
      this.state = {
        mode: 'menu', // 'menu' | 'gameplay' | 'ending_good' | 'ending_bad' | 'ending_secret'
        night: 1,
        rainIntensity: 0.55,
        fogDensity: 0.35,
        windowTarget: 0, // 0 closed, 1 open
        windowSlide: 0,
        porchLightOn: true,
        porchFlash: 0,
        interiorLightLevel: 1,
        lightOut: false,
        flickerTimer: 0,
        reducedFlash: false,
        phoneRinging: false,
        customer: null,
        customerVisible: false,
        customerAlpha: 0,
        customerLunge: 0, // 0..1 menacing lean forward
        knockRipples: [],
        handprintAlpha: 0,
        distantSilhouette: { active: false, alpha: 0, x: 0.22 },
        vanishingAlpha: 0,
        cupScoops: [],
        dangerLevel: 0,
        cameraShake: 0,
        hoveredTarget: null
      };

      this.hitboxes = {
        window: { x: 0, y: 0, w: 0, h: 0 },
        phone: { x: 0, y: 0, w: 0, h: 0 },
        lightSwitch: { x: 0, y: 0, w: 0, h: 0 }
      };

      this._initParticles();
      this.resize();
    }

    _initParticles() {
      this.rainDrops = [];
      for (let i = 0; i < 150; i++) {
        this.rainDrops.push({
          x: Math.random(),
          y: Math.random(),
          len: 0.025 + Math.random() * 0.055,
          speed: 0.75 + Math.random() * 0.9,
          alpha: 0.12 + Math.random() * 0.28
        });
      }

      this.fogPuffs = [];
      for (let i = 0; i < 9; i++) {
        this.fogPuffs.push({
          x: Math.random(),
          y: 0.52 + Math.random() * 0.38,
          r: 0.16 + Math.random() * 0.2,
          speed: 0.008 + Math.random() * 0.015,
          alpha: 0.05 + Math.random() * 0.08
        });
      }

      this.windowDrops = [];
      for (let i = 0; i < 38; i++) {
        this.windowDrops.push({
          x: Math.random(),
          y: Math.random(),
          r: 1.1 + Math.random() * 2.1,
          speed: 0.005 + Math.random() * 0.016
        });
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(320, rect.width || global.innerWidth);
      this.height = Math.max(320, rect.height || global.innerHeight);
      this.dpr = Math.min(global.devicePixelRatio || 1, 2);

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this._computeLayout();
    }

    _computeLayout() {
      const w = this.width;
      const h = this.height;

      // Central service window clearly framed between HUD top and bottom console
      const winW = Math.min(w * 0.5, 680);
      const winH = Math.min(h * 0.51, 410);
      const winX = (w - winW) * 0.5;
      const winY = Math.max(66, h * 0.125);

      this.hitboxes.window = { x: winX, y: winY, w: winW, h: winH };

      // Counter top begins just beneath the window frame
      this.counterY = winY + winH + 18;

      // Left wall light switch (between left edge & window)
      const swW = 34;
      const swH = 52;
      const swX = Math.max(24, winX - Math.min(110, winX * 0.45));
      const swY = winY + winH * 0.45;
      this.hitboxes.lightSwitch = { x: swX, y: swY, w: swW, h: swH };

      // Red desk phone resting on left side of counter
      const phW = 86;
      const phH = 58;
      const phX = Math.max(24, winX - 110);
      const phY = this.counterY - 12;
      this.hitboxes.phone = { x: phX, y: phY, w: phW, h: phH };
    }

    hitTest(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const targets = ['phone', 'lightSwitch', 'window'];
      for (let i = 0; i < targets.length; i++) {
        const key = targets[i];
        const b = this.hitboxes[key];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          return key;
        }
      }
      return null;
    }

    triggerKnockRipple() {
      this.state.knockRipples.push({
        x: 0.5 + (Math.random() * 0.14 - 0.07),
        y: 0.46 + (Math.random() * 0.12 - 0.06),
        radius: 6,
        alpha: 0.9
      });
    }

    triggerFlicker(duration) {
      this.state.flickerTimer = Math.max(this.state.flickerTimer, duration || 0.75);
    }

    triggerPorchFlash() {
      this.state.porchFlash = 1.0;
    }

    triggerHandprint() {
      this.state.handprintAlpha = 0.85;
    }

    triggerDistantSilhouette() {
      this.state.distantSilhouette.active = true;
      this.state.distantSilhouette.alpha = 0;
      this.state.distantSilhouette.timer = 6.5;
      this.state.distantSilhouette.x = Math.random() > 0.5 ? 0.19 : 0.79;
    }

    triggerVanishingGlimpse() {
      this.state.vanishingAlpha = 0.95;
      this.triggerFlicker(0.65);
    }

    triggerCameraShake(intensity) {
      this.state.cameraShake = Math.max(this.state.cameraShake, intensity || 6);
    }

    update(dt) {
      this.time += dt;
      const s = this.state;

      // Smooth sliding window animation
      const slideSpeed = s.windowTarget === 0 && s.dangerLevel > 0 ? 11 : 6.2;
      s.windowSlide += (s.windowTarget - s.windowSlide) * Math.min(1, dt * slideSpeed);
      if (Math.abs(s.windowTarget - s.windowSlide) < 0.004) {
        s.windowSlide = s.windowTarget;
      }

      // Customer fade in/out
      const targetAlpha = s.customerVisible ? 1 : 0;
      s.customerAlpha += (targetAlpha - s.customerAlpha) * Math.min(1, dt * 4.5);

      // Porch flash decay
      if (s.porchFlash > 0) {
        s.porchFlash = Math.max(0, s.porchFlash - dt * 1.3);
      }

      // Interior fluorescent flicker math
      if (s.lightOut) {
        s.interiorLightLevel = 0.16 + Math.sin(this.time * 7) * 0.02;
      } else if (s.flickerTimer > 0) {
        s.flickerTimer = Math.max(0, s.flickerTimer - dt);
        if (s.reducedFlash) {
          s.interiorLightLevel = 0.68 + Math.sin(this.time * 12) * 0.14;
        } else {
          const jitter = Math.sin(this.time * 58) * Math.cos(this.time * 31);
          s.interiorLightLevel = jitter > -0.15 ? 0.92 : 0.24;
        }
      } else {
        // Tiny organic fluorescent tube hum variation
        s.interiorLightLevel = 0.96 + Math.sin(this.time * 24) * 0.015;
      }

      // Knock ripples
      for (let i = s.knockRipples.length - 1; i >= 0; i--) {
        const r = s.knockRipples[i];
        r.radius += dt * 140;
        r.alpha -= dt * 1.15;
        if (r.alpha <= 0) {
          s.knockRipples.splice(i, 1);
        }
      }

      // Condensation handprint fade
      if (s.handprintAlpha > 0) {
        s.handprintAlpha = Math.max(0, s.handprintAlpha - dt * 0.075);
      }

      // Vanishing figure decay
      if (s.vanishingAlpha > 0) {
        s.vanishingAlpha = Math.max(0, s.vanishingAlpha - dt * 1.7);
      }

      // Distant silhouette lifecycle
      if (s.distantSilhouette.active) {
        s.distantSilhouette.timer -= dt;
        if (s.distantSilhouette.timer > 5.2) {
          s.distantSilhouette.alpha = Math.min(0.88, s.distantSilhouette.alpha + dt * 0.9);
        } else if (s.distantSilhouette.timer < 1.5) {
          s.distantSilhouette.alpha = Math.max(0, s.distantSilhouette.alpha - dt * 0.65);
        }
        if (s.distantSilhouette.timer <= 0) {
          s.distantSilhouette.active = false;
          s.distantSilhouette.alpha = 0;
        }
      }

      // Camera shake decay
      if (s.cameraShake > 0) {
        s.cameraShake = Math.max(0, s.cameraShake - dt * 22);
      }

      // Rain particles
      const rainSpeedMul = 0.75 + s.rainIntensity * 0.85;
      for (let i = 0; i < this.rainDrops.length; i++) {
        const d = this.rainDrops[i];
        d.y += dt * d.speed * rainSpeedMul;
        d.x -= dt * 0.14 * d.speed;
        if (d.y > 1.08) {
          d.y = -0.08;
          d.x = Math.random() * 1.2;
        }
        if (d.x < -0.1) {
          d.x = 1.1;
        }
      }

      // Fog drift
      for (let i = 0; i < this.fogPuffs.length; i++) {
        const f = this.fogPuffs[i];
        f.x += dt * f.speed;
        if (f.x - f.r > 1.15) {
          f.x = -f.r - 0.1;
        }
      }

      // Window rain beads slowly trickle down
      for (let i = 0; i < this.windowDrops.length; i++) {
        const wd = this.windowDrops[i];
        wd.y += dt * wd.speed * (0.4 + s.rainIntensity);
        if (wd.y > 1.05) {
          wd.y = -0.02;
          wd.x = Math.random();
        }
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const s = this.state;

      ctx.save();

      // Subtle camera micro-shake
      if (s.cameraShake > 0.1) {
        const sx = (Math.random() - 0.5) * s.cameraShake;
        const sy = (Math.random() - 0.5) * s.cameraShake;
        ctx.translate(sx, sy);
      }

      // 1. Paint Kiosk Interior Base Walls
      this._drawInteriorWalls(ctx, w, h);

      // 2. Paint Exterior Street Scene clipped inside the Service Window frame
      const win = this.hitboxes.window;
      ctx.save();
      ctx.beginPath();
      ctx.rect(win.x, win.y, win.w, win.h);
      ctx.clip();

      this._drawExteriorStreet(ctx, win);

      // Vanishing glimpse ghost if active and no customer
      if (s.vanishingAlpha > 0.02 && !s.customerVisible) {
        this._drawVanishingFigure(ctx, win, s.vanishingAlpha);
      }

      // Active Customer portrait standing outside the window
      if (s.customer && s.customerAlpha > 0.02) {
        this._drawCustomer(ctx, win, s.customer, s.customerAlpha);
      }

      // Rain droplets streaking in front of exterior
      this._drawExteriorRain(ctx, win);

      // Sliding Frosted Service Window Glass
      this._drawSlidingWindowGlass(ctx, win);

      ctx.restore();

      // 3. Window Metallic Frame, Awning Trim & Interior Props
      this._drawWindowFrame(ctx, win);
      this._drawWallProps(ctx, w, h, win);

      // 4. Overhead Fluorescent Tube Fixture & Cone Light
      this._drawFluorescentFixture(ctx, w, win);

      // 5. Kiosk Counter Foreground (Bell, Red Desk Phone, Physical Ice Cream Cup)
      this._drawCounterForeground(ctx, w, h, win);

      // 6. Lighting / Power Outage & Danger Vignette Pass
      this._drawLightingAtmosphere(ctx, w, h);

      ctx.restore();
    }

    _drawInteriorWalls(ctx, w, h) {
      const light = this.state.interiorLightLevel;

      // Aged ceramic dark-olive kiosk wall backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#101516');
      grad.addColorStop(0.35, '#192121');
      grad.addColorStop(0.7, '#121818');
      grad.addColorStop(1, '#0b0e10');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle ceramic tile grid lines on wall above counter
      ctx.save();
      ctx.strokeStyle = `rgba(180, 205, 198, ${0.045 * light})`;
      ctx.lineWidth = 1;
      const tileSize = 44;
      for (let x = 0; x < w; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.counterY);
        ctx.stroke();
      }
      for (let y = 0; y < this.counterY; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // Soft fluorescent wash radiating from top center
      const glow = ctx.createRadialGradient(w * 0.5, 65, 30, w * 0.5, h * 0.4, w * 0.58);
      glow.addColorStop(0, `rgba(198, 229, 220, ${0.14 * light})`);
      glow.addColorStop(0.55, `rgba(140, 175, 168, ${0.04 * light})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    _drawExteriorStreet(ctx, win) {
      const s = this.state;
      const x = win.x;
      const y = win.y;
      const w = win.w;
      const h = win.h;

      // Sky gradient depends on mode (Night vs Dawn Good Ending vs Siren Secret Ending vs Bad Ending)
      const sky = ctx.createLinearGradient(x, y, x, y + h);
      if (s.mode === 'ending_good') {
        sky.addColorStop(0, '#1b2638');
        sky.addColorStop(0.52, '#4a4c57');
        sky.addColorStop(0.78, '#c69367');
        sky.addColorStop(1, '#262426');
      } else if (s.mode === 'ending_bad') {
        sky.addColorStop(0, '#120506');
        sky.addColorStop(0.6, '#24090b');
        sky.addColorStop(1, '#0c0506');
      } else {
        sky.addColorStop(0, '#04070c');
        sky.addColorStop(0.55, '#0b131c');
        sky.addColorStop(0.74, '#111a22');
        sky.addColorStop(1, '#090c10');
      }
      ctx.fillStyle = sky;
      ctx.fillRect(x, y, w, h);

      // Distant overpass & building silhouettes
      const horizonY = y + h * 0.72;
      ctx.fillStyle = '#070b10';
      ctx.fillRect(x, horizonY - h * 0.14, w, h * 0.14);
      // Overpass concrete pillars
      ctx.fillStyle = '#0b1017';
      for (let i = 0; i < 5; i++) {
        const px = x + w * (0.08 + i * 0.22);
        ctx.fillRect(px, horizonY - h * 0.18, 16, h * 0.2);
      }
      // Overpass horizontal deck
      ctx.fillStyle = '#090e15';
      ctx.fillRect(x, horizonY - h * 0.21, w, 12);

      // Distant Bus Stop shelter on the left
      const busX = x + w * 0.11;
      const busY = horizonY - h * 0.16;
      ctx.fillStyle = '#0d141c';
      ctx.fillRect(busX, busY, w * 0.18, 6); // roof
      ctx.fillRect(busX + 6, busY + 6, 4, h * 0.16);
      ctx.fillRect(busX + w * 0.18 - 10, busY + 6, 4, h * 0.16);
      ctx.fillStyle = 'rgba(217, 156, 74, 0.12)';
      ctx.fillRect(busX + 10, busY + 12, w * 0.18 - 20, h * 0.11);

      // Wet Asphalt Road
      const roadGrad = ctx.createLinearGradient(x, horizonY, x, y + h);
      roadGrad.addColorStop(0, '#0d1218');
      roadGrad.addColorStop(0.5, '#12181f');
      roadGrad.addColorStop(1, '#080b0e');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(x, horizonY, w, y + h - horizonY);

      // Streetlamp pole on right-mid exterior
      const lampX = x + w * 0.81;
      const lampTopY = y + h * 0.13;
      ctx.strokeStyle = '#1b2229';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(lampX, horizonY + h * 0.04);
      ctx.lineTo(lampX, lampTopY);
      ctx.lineTo(lampX - 28, lampTopY + 5);
      ctx.stroke();

      // Sodium Streetlamp Bulb & Volumetric Amber Mist Cone
      const bulbX = lampX - 28;
      const bulbY = lampTopY + 7;
      const lampPulse = s.mode === 'ending_good' ? 0.25 : 0.88 + Math.sin(this.time * 4.2) * 0.06;

      // Volumetric light cone
      ctx.save();
      const cone = ctx.createRadialGradient(bulbX, bulbY, 4, bulbX - 18, horizonY, h * 0.65);
      cone.addColorStop(0, `rgba(246, 194, 108, ${0.46 * lampPulse})`);
      cone.addColorStop(0.28, `rgba(214, 146, 62, ${0.18 * lampPulse})`);
      cone.addColorStop(0.75, `rgba(170, 104, 42, ${0.05 * lampPulse})`);
      cone.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(bulbX - 8, bulbY);
      ctx.lineTo(bulbX + 10, bulbY);
      ctx.lineTo(bulbX + w * 0.22, y + h);
      ctx.lineTo(bulbX - w * 0.34, y + h);
      ctx.closePath();
      ctx.fill();

      // Bulb core
      ctx.fillStyle = `rgba(255, 228, 168, ${0.95 * lampPulse})`;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Wet puddle amber reflection on asphalt
      const refl = ctx.createRadialGradient(bulbX - 14, horizonY + h * 0.14, 4, bulbX - 14, horizonY + h * 0.14, w * 0.17);
      refl.addColorStop(0, `rgba(222, 154, 68, ${0.22 * lampPulse})`);
      refl.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = refl;
      ctx.fillRect(x, horizonY, w, h * 0.28);
      ctx.restore();

      // Police blue & red flashing lights during Secret Ending!
      if (s.mode === 'ending_secret') {
        const phase = Math.sin(this.time * 9.5);
        const blueA = phase > 0 ? 0.36 : 0.04;
        const redA = phase <= 0 ? 0.36 : 0.04;
        const gBlue = ctx.createRadialGradient(x + w * 0.25, horizonY, 10, x + w * 0.25, horizonY, w * 0.5);
        gBlue.addColorStop(0, `rgba(60, 140, 255, ${blueA})`);
        gBlue.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gBlue;
        ctx.fillRect(x, y, w, h);

        const gRed = ctx.createRadialGradient(x + w * 0.72, horizonY, 10, x + w * 0.72, horizonY, w * 0.5);
        gRed.addColorStop(0, `rgba(255, 55, 55, ${redA})`);
        gRed.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gRed;
        ctx.fillRect(x, y, w, h);
      }

      // Distant motionless stalker silhouette under streetlamp / bus stop
      if (s.distantSilhouette.active && s.distantSilhouette.alpha > 0.02) {
        this._drawDistantSilhouette(ctx, win, horizonY, s.distantSilhouette.x, s.distantSilhouette.alpha);
      }

      // Drifting layered fog puffs
      ctx.save();
      for (let i = 0; i < this.fogPuffs.length; i++) {
        const f = this.fogPuffs[i];
        const fx = x + f.x * w;
        const fy = y + f.y * h;
        const fr = f.r * w;
        const fg = ctx.createRadialGradient(fx, fy, fr * 0.1, fx, fy, fr);
        const alpha = f.alpha * (0.45 + s.fogDensity * 1.35);
        fg.addColorStop(0, `rgba(172, 192, 200, ${alpha})`);
        fg.addColorStop(1, 'rgba(172, 192, 200, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Exterior Porch Overhang Cone (illuminates customer standing right at the counter)
      if (s.porchLightOn || s.porchFlash > 0.05) {
        const intensity = (s.porchLightOn ? 0.2 : 0) + s.porchFlash * 0.45;
        const porch = ctx.createRadialGradient(x + w * 0.5, y + 6, 12, x + w * 0.5, y + h * 0.55, w * 0.55);
        porch.addColorStop(0, `rgba(246, 224, 178, ${intensity})`);
        porch.addColorStop(0.6, `rgba(220, 190, 138, ${intensity * 0.35})`);
        porch.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = porch;
        ctx.fillRect(x, y, w, h);
      }
    }

    _drawDistantSilhouette(ctx, win, horizonY, normX, alpha) {
      const sx = win.x + win.w * normX;
      const baseY = horizonY + win.h * 0.08;
      const figH = win.h * 0.27;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#050709';

      // Long coat silhouette
      ctx.beginPath();
      ctx.moveTo(sx - 12, baseY);
      ctx.lineTo(sx - 9, baseY - figH * 0.72);
      ctx.quadraticCurveTo(sx, baseY - figH * 0.78, sx + 9, baseY - figH * 0.72);
      ctx.lineTo(sx + 13, baseY);
      ctx.closePath();
      ctx.fill();

      // Head + hat brim
      ctx.beginPath();
      ctx.arc(sx, baseY - figH * 0.85, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(sx - 11, baseY - figH * 0.91, 22, 2.5);

      // Tiny eerie pale eyes catching streetlight
      ctx.fillStyle = 'rgba(235, 225, 200, 0.55)';
      ctx.fillRect(sx - 3, baseY - figH * 0.86, 1.5, 1.5);
      ctx.fillRect(sx + 1.5, baseY - figH * 0.86, 1.5, 1.5);
      ctx.restore();
    }

    _drawVanishingFigure(ctx, win, alpha) {
      const cx = win.x + win.w * 0.5;
      const bottomY = win.y + win.h + 10;
      ctx.save();
      ctx.globalAlpha = alpha * 0.84;
      ctx.fillStyle = '#07090b';

      // Tall looming coat shoulders silhouette
      ctx.beginPath();
      ctx.moveTo(cx - 110, bottomY);
      ctx.quadraticCurveTo(cx - 98, bottomY - 125, cx - 44, bottomY - 148);
      ctx.lineTo(cx + 44, bottomY - 148);
      ctx.quadraticCurveTo(cx + 98, bottomY - 125, cx + 110, bottomY);
      ctx.closePath();
      ctx.fill();

      // Neck & tilted eerie head silhouette
      ctx.fillRect(cx - 14, bottomY - 172, 28, 28);
      ctx.beginPath();
      ctx.ellipse(cx, bottomY - 210, 36, 46, 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Unblinking white-pinpoint eyes staring straight through glass
      ctx.fillStyle = '#ebe6d8';
      ctx.beginPath();
      ctx.ellipse(cx - 13, bottomY - 212, 5.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 13, bottomY - 212, 5.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(cx - 13, bottomY - 212, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 13, bottomY - 212, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawCustomer(ctx, win, customer, alpha) {
      const app = customer.appearance;
      const s = this.state;

      const scaleBase = (win.h / 380) * (app.heightScale || 1.0);
      const lungeScale = 1 + s.customerLunge * 0.34;
      const scale = scaleBase * lungeScale;

      // Subtle breathing & eerie head sway
      const breathY = Math.sin(this.time * 2.1) * 2.2;
      const nervousSway = app.gaze === 'nervous' ? Math.sin(this.time * 3.8) * 3.5 : Math.sin(this.time * 0.7) * 1.2;

      const cx = win.x + win.w * 0.5 + nervousSway;
      const bottomY = win.y + win.h + 16 + breathY + s.customerLunge * 24;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, bottomY);
      ctx.scale(scale, scale);

      // Rim backlight silhouette halo from streetlamp
      const rimGrad = ctx.createRadialGradient(0, -175, 25, 0, -155, 130);
      rimGrad.addColorStop(0, 'rgba(225, 168, 86, 0.16)');
      rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(0, -165, 130, 0, Math.PI * 2);
      ctx.fill();

      // --- SHOULDERS & COAT ---
      ctx.fillStyle = app.coat;
      ctx.beginPath();
      ctx.moveTo(-114, 12);
      ctx.quadraticCurveTo(-104, -96, -54, -118);
      ctx.lineTo(54, -118);
      ctx.quadraticCurveTo(104, -96, 114, 12);
      ctx.closePath();
      ctx.fill();

      // Directional coat chiaroscuro shading
      const coatShade = ctx.createLinearGradient(-114, -60, 114, -60);
      coatShade.addColorStop(0, 'rgba(4, 6, 10, 0.45)');
      coatShade.addColorStop(0.45, 'rgba(0, 0, 0, 0.05)');
      coatShade.addColorStop(0.85, 'rgba(240, 196, 124, 0.07)');
      coatShade.addColorStop(1, 'rgba(4, 6, 10, 0.35)');
      ctx.fillStyle = coatShade;
      ctx.fill();

      // Coat shadow depth & inner shirt V
      ctx.fillStyle = app.shirt;
      ctx.beginPath();
      ctx.moveTo(-26, -118);
      ctx.lineTo(0, -56);
      ctx.lineTo(26, -118);
      ctx.closePath();
      ctx.fill();

      // Coat lapels & subtle buttons
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.48)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-28, -116);
      ctx.lineTo(-42, -62);
      ctx.lineTo(-10, -45);
      ctx.moveTo(28, -116);
      ctx.lineTo(42, -62);
      ctx.lineTo(10, -45);
      ctx.stroke();

      ctx.fillStyle = 'rgba(15, 18, 20, 0.72)';
      [-28, -8].forEach((by) => {
        ctx.beginPath();
        ctx.arc(0, by, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // High upturned mysterious collar (signature silhouette of killer/stalker)
      if (app.collarHigh) {
        ctx.fillStyle = app.coat;
        ctx.beginPath();
        ctx.moveTo(-48, -114);
        ctx.lineTo(-38, -148);
        ctx.lineTo(-18, -124);
        ctx.lineTo(18, -124);
        ctx.lineTo(38, -148);
        ctx.lineTo(48, -114);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Organic separated oil / dark stains on coat shoulder & sleeve
      if (app.stains === 'oil' || app.stains === 'dark') {
        ctx.fillStyle = app.stains === 'oil' ? 'rgba(16, 15, 14, 0.44)' : 'rgba(64, 14, 14, 0.46)';
        const blotches = [
          [-64, -56, 14, 8, -0.35],
          [-76, -24, 11, 7, 0.25],
          [-50, -34, 6, 5, 0.1],
          [60, -38, 10, 6, 0.4],
          [72, -16, 7, 5, -0.2]
        ];
        blotches.forEach(([bx, by, rx, ry, rot]) => {
          ctx.beginPath();
          ctx.ellipse(bx, by, rx, ry, rot, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Wet rain sheen & glistening droplets if wet:true (CRITICAL VISUAL CLUE!)
      if (app.wet) {
        ctx.strokeStyle = 'rgba(182, 218, 232, 0.34)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-92, -68);
        ctx.quadraticCurveTo(-72, -104, -44, -116);
        ctx.moveTo(92, -68);
        ctx.quadraticCurveTo(72, -104, 44, -116);
        ctx.stroke();

        // Falling droplets off wet shoulders
        ctx.fillStyle = 'rgba(195, 228, 240, 0.58)';
        for (let i = 0; i < 6; i++) {
          const dropPhase = (this.time * 1.4 + i * 0.37) % 1;
          const dx = (i % 2 === 0 ? -75 : 75) + (i - 2.5) * 8;
          const dy = -92 + dropPhase * 75;
          ctx.beginPath();
          ctx.ellipse(dx, dy, 1.5, 3.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Props: Scarf / Hospital Badge / Scratched ARMAN Badge / Thesis Papers / Umbrella
      if (app.prop === 'scarf') {
        ctx.fillStyle = '#6c513e';
        ctx.fillRect(-34, -124, 68, 22);
        ctx.fillRect(10, -104, 18, 56);
        ctx.strokeStyle = 'rgba(235, 210, 175, 0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-34, -114);
        ctx.lineTo(34, -114);
        ctx.stroke();
      } else if (app.prop === 'badge' || app.prop === 'scratched_badge') {
        // Lanyard strap
        ctx.strokeStyle = app.prop === 'badge' ? '#3d8fa3' : '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, -116);
        ctx.lineTo(14, -68);
        ctx.lineTo(24, -116);
        ctx.stroke();
        // ID card
        ctx.fillStyle = app.prop === 'badge' ? '#e7f0f2' : '#ccc5b4';
        ctx.fillRect(4, -68, 24, 30);
        if (app.prop === 'badge') {
          ctx.fillStyle = '#cf3d34'; // Hospital cross
          ctx.fillRect(14, -62, 4, 10);
          ctx.fillRect(11, -59, 10, 4);
        } else {
          // Scratched-out name badge (visible when porch light / flash hits!)
          ctx.fillStyle = '#181818';
          ctx.fillRect(7, -54, 18, 4);
          ctx.fillStyle = '#8b2420';
          ctx.fillRect(8, -46, 15, 2);
        }
      } else if (app.prop === 'papers') {
        ctx.save();
        ctx.translate(-52, -32);
        ctx.rotate(-0.14);
        ctx.fillStyle = '#dfd8c8';
        ctx.fillRect(0, 0, 48, 54);
        ctx.strokeStyle = '#9e9584';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 12);
        ctx.lineTo(40, 12);
        ctx.moveTo(8, 22);
        ctx.lineTo(36, 22);
        ctx.moveTo(8, 32);
        ctx.lineTo(38, 32);
        ctx.stroke();
        ctx.restore();
      } else if (app.prop === 'umbrella') {
        ctx.strokeStyle = '#24292e';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(64, -10);
        ctx.lineTo(74, -82);
        ctx.stroke();
        ctx.strokeStyle = '#6f5136';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(69, -82, 8, Math.PI, 0);
        ctx.stroke();
      }

      // --- NECK ---
      ctx.fillStyle = app.skin;
      ctx.fillRect(-16, -148, 32, 34);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.beginPath();
      ctx.ellipse(0, -140, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- BACK HAIR (for long hair) ---
      if (app.hairStyle === 'long') {
        ctx.fillStyle = app.hair;
        ctx.beginPath();
        ctx.moveTo(-44, -195);
        ctx.quadraticCurveTo(-55, -145, -46, -98);
        ctx.lineTo(46, -98);
        ctx.quadraticCurveTo(55, -145, 44, -195);
        ctx.closePath();
        ctx.fill();
      } else if (app.hairStyle === 'bun') {
        ctx.fillStyle = app.hair;
        ctx.beginPath();
        ctx.arc(0, -242, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- EARS ---
      ctx.fillStyle = app.skin;
      ctx.beginPath();
      ctx.ellipse(-38, -188, 5.5, 11, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(38, -188, 5.5, 11, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(-38, -188, 2.5, 6, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(38, -188, 2.5, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // --- HEAD SHAPE ---
      ctx.fillStyle = app.skin;
      ctx.beginPath();
      ctx.moveTo(-37, -192);
      ctx.quadraticCurveTo(-39, -238, 0, -240);
      ctx.quadraticCurveTo(39, -238, 37, -192);
      ctx.quadraticCurveTo(33, -153, 0, -142);
      ctx.quadraticCurveTo(-33, -153, -37, -192);
      ctx.closePath();
      ctx.fill();

      // Chiaroscuro side shadow on face (adds atmospheric 2D horror volume!)
      const faceShade = ctx.createLinearGradient(-42, -190, 42, -190);
      faceShade.addColorStop(0, 'rgba(6, 9, 14, 0.42)');
      faceShade.addColorStop(0.35, 'rgba(6, 9, 14, 0.08)');
      faceShade.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      faceShade.addColorStop(1, 'rgba(6, 9, 14, 0.34)');
      ctx.fillStyle = faceShade;
      ctx.fill();

      // Under-eye exhaustion bags / hollows
      if (app.expression === 'exhausted' || app.expression === 'hollow' || app.expression === 'cold_smile') {
        ctx.fillStyle = 'rgba(24, 18, 22, 0.28)';
        ctx.beginPath();
        ctx.ellipse(-15, -187, 10, 4.5, 0, 0, Math.PI * 2);
        ctx.ellipse(15, -187, 10, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- EYES (Dynamic Blinking & Gaze Tracking!) ---
      let isBlinking = false;
      if (app.blinkRate === 'normal') {
        isBlinking = (this.time % 4.1) > 3.96;
      } else if (app.blinkRate === 'slow') {
        isBlinking = (this.time % 5.6) > 5.38;
      } else if (app.blinkRate === 'fast') {
        isBlinking = (this.time % 2.1) > 1.98;
      }
      // app.blinkRate === 'none' -> NEVER BLINKS! Uncanny psychological horror cue!

      let pupilOffsetX = 0;
      let pupilOffsetY = 0;
      if (app.gaze === 'latch') {
        pupilOffsetX = 4.2;
        pupilOffsetY = 1.8;
      } else if (app.gaze === 'nervous') {
        pupilOffsetX = Math.sin(this.time * 2.4) * 3.8;
      } else if (app.gaze === 'downcast') {
        pupilOffsetY = 2.2;
      }

      [-15, 15].forEach((ex) => {
        const ey = -194;
        if (isBlinking) {
          ctx.strokeStyle = '#1b1715';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex - 7, ey);
          ctx.quadraticCurveTo(ex, ey + 2.5, ex + 7, ey);
          ctx.stroke();
        } else {
          // Sclera
          const eyeH = app.blinkRate === 'none' ? 5.6 : 4.2;
          ctx.fillStyle = app.blinkRate === 'none' ? '#edeae2' : '#dfd8cc';
          ctx.beginPath();
          ctx.ellipse(ex, ey, 7.2, eyeH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Iris & Pupil
          const pupilR = app.blinkRate === 'none' ? 2.1 : 3.2;
          ctx.fillStyle = '#141212';
          ctx.beginPath();
          ctx.arc(ex + pupilOffsetX, ey + pupilOffsetY, pupilR, 0, Math.PI * 2);
          ctx.fill();

          // Tiny specular glint
          ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.beginPath();
          ctx.arc(ex + pupilOffsetX - 1.2, ey + pupilOffsetY - 1.2, 1.0, 0, Math.PI * 2);
          ctx.fill();

          // Upper eyelid shadow
          ctx.strokeStyle = '#1a1513';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(ex, ey, 7.4, Math.PI * 1.08, Math.PI * 1.92);
          ctx.stroke();
        }
      });

      // Eyebrows
      ctx.strokeStyle = app.hair;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (app.expression === 'worried' || app.expression === 'panicked') {
        ctx.moveTo(-23, -203);
        ctx.lineTo(-9, -206);
        ctx.moveTo(23, -203);
        ctx.lineTo(9, -206);
      } else if (app.expression === 'cold_smile' || app.expression === 'hollow') {
        ctx.moveTo(-23, -205);
        ctx.lineTo(-8, -203);
        ctx.moveTo(23, -205);
        ctx.lineTo(8, -203);
      } else {
        ctx.moveTo(-23, -205);
        ctx.lineTo(-9, -205);
        ctx.moveTo(23, -205);
        ctx.lineTo(9, -205);
      }
      ctx.stroke();

      // Subtle Nose Shadow
      ctx.strokeStyle = 'rgba(30, 22, 18, 0.42)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -193);
      ctx.lineTo(-2, -177);
      ctx.lineTo(4, -175);
      ctx.stroke();

      // --- MOUTH OR MEDICAL MASK ---
      if (app.mask) {
        ctx.fillStyle = '#cfdce0';
        ctx.beginPath();
        ctx.moveTo(-28, -176);
        ctx.quadraticCurveTo(0, -182, 28, -176);
        ctx.lineTo(24, -148);
        ctx.quadraticCurveTo(0, -140, -24, -148);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#92a8b0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Ear loops
        ctx.beginPath();
        ctx.moveTo(-27, -172);
        ctx.lineTo(-37, -178);
        ctx.moveTo(27, -172);
        ctx.lineTo(37, -178);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#2d1c19';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        if (app.expression === 'cold_smile') {
          // Slightly too wide, unnerving flat-corner smile
          ctx.moveTo(-16, -162);
          ctx.quadraticCurveTo(0, -154, 16, -162);
        } else if (app.expression === 'tired_smile') {
          ctx.moveTo(-10, -162);
          ctx.quadraticCurveTo(0, -158, 10, -162);
        } else if (app.expression === 'panicked') {
          ctx.fillStyle = '#211312';
          ctx.ellipse(0, -160, 7, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (app.expression === 'worried' || app.expression === 'solemn') {
          ctx.moveTo(-10, -159);
          ctx.quadraticCurveTo(0, -163, 10, -159);
        } else {
          ctx.moveTo(-10, -161);
          ctx.lineTo(10, -161);
        }
        ctx.stroke();
      }

      // Glasses
      if (app.glasses) {
        ctx.strokeStyle = '#1b1d20';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(210, 232, 240, 0.12)';
        ctx.fillRect(-26, -201, 21, 13);
        ctx.strokeRect(-26, -201, 21, 13);
        ctx.fillRect(5, -201, 21, 13);
        ctx.strokeRect(5, -201, 21, 13);
        ctx.beginPath();
        ctx.moveTo(-5, -195);
        ctx.lineTo(5, -195);
        ctx.stroke();
      }

      // --- HAIR & HEADGEAR ---
      if (app.hat === 'fedora') {
        // Deep shadowed noir hat obscuring forehead
        ctx.fillStyle = '#15181c';
        ctx.beginPath();
        ctx.moveTo(-36, -214);
        ctx.quadraticCurveTo(-30, -258, 0, -256);
        ctx.quadraticCurveTo(30, -258, 36, -214);
        ctx.closePath();
        ctx.fill();
        // Brim
        ctx.fillStyle = '#1d2126';
        ctx.beginPath();
        ctx.ellipse(0, -213, 58, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Heavy brow shadow cast over upper face
        const hatShadow = ctx.createLinearGradient(0, -212, 0, -186);
        hatShadow.addColorStop(0, 'rgba(4, 6, 8, 0.85)');
        hatShadow.addColorStop(1, 'rgba(4, 6, 8, 0)');
        ctx.fillStyle = hatShadow;
        ctx.fillRect(-38, -212, 76, 26);
      } else if (app.hat === 'hood') {
        ctx.fillStyle = app.coat;
        ctx.beginPath();
        ctx.moveTo(-52, -130);
        ctx.quadraticCurveTo(-56, -245, 0, -254);
        ctx.quadraticCurveTo(56, -245, 52, -130);
        ctx.lineTo(38, -148);
        ctx.quadraticCurveTo(42, -230, 0, -236);
        ctx.quadraticCurveTo(-42, -230, -38, -148);
        ctx.closePath();
        ctx.fill();
        const hoodShadow = ctx.createLinearGradient(0, -236, 0, -190);
        hoodShadow.addColorStop(0, 'rgba(4, 5, 7, 0.8)');
        hoodShadow.addColorStop(1, 'rgba(4, 5, 7, 0)');
        ctx.fillStyle = hoodShadow;
        ctx.fillRect(-38, -236, 76, 46);
      } else if (app.hat === 'cap' || app.hat === 'helmet_visor') {
        ctx.fillStyle = app.hat === 'cap' ? '#253036' : '#3a2b24';
        ctx.beginPath();
        ctx.arc(0, -212, 40, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#161d21';
        ctx.beginPath();
        ctx.ellipse(8, -212, 44, 8, 0.06, 0, Math.PI * 2);
        ctx.fill();
      } else if (app.hat === 'beanie') {
        ctx.fillStyle = '#2d3a32';
        ctx.beginPath();
        ctx.arc(0, -212, 41, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#232e27';
        ctx.fillRect(-41, -216, 82, 11);
      } else {
        // Natural top hair
        ctx.fillStyle = app.hair;
        ctx.beginPath();
        ctx.arc(0, -206, 40, Math.PI * 1.02, Math.PI * 1.98);
        ctx.quadraticCurveTo(12, -218, -36, -206);
        ctx.fill();
      }

      ctx.restore();

      // Seamless full-window darkness when porch light is OFF (zero rectangular artifact!)
      if (!s.porchLightOn && s.porchFlash < 0.05) {
        ctx.fillStyle = `rgba(3, 6, 10, ${Math.max(0.18, 0.48 - s.windowSlide * 0.22)})`;
        ctx.fillRect(win.x, win.y, win.w, win.h);
      }
    }

    _drawExteriorRain(ctx, win) {
      const s = this.state;
      ctx.save();
      ctx.strokeStyle = 'rgba(180, 206, 224, 0.34)';
      ctx.lineWidth = 1.1;
      const count = Math.floor(this.rainDrops.length * (0.25 + s.rainIntensity * 0.75));
      for (let i = 0; i < count; i++) {
        const d = this.rainDrops[i];
        const rx = win.x + d.x * win.w;
        const ry = win.y + d.y * win.h;
        ctx.globalAlpha = d.alpha * (0.45 + s.rainIntensity * 0.65);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + d.len * win.h);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawSlidingWindowGlass(ctx, win) {
      const s = this.state;
      // Glass pane slides to the right as windowSlide goes 0 -> 1
      const slideOffset = s.windowSlide * (win.w * 0.86);
      const gx = win.x + slideOffset;
      const gy = win.y;
      const gw = win.w;
      const gh = win.h;

      ctx.save();

      // Frosted tinted glass surface
      const glassGrad = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
      glassGrad.addColorStop(0, 'rgba(175, 208, 212, 0.16)');
      glassGrad.addColorStop(0.5, 'rgba(130, 160, 170, 0.09)');
      glassGrad.addColorStop(1, 'rgba(180, 212, 210, 0.18)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(gx, gy, gw, gh);

      // Subtle diagonal glass specular reflection
      ctx.fillStyle = 'rgba(220, 240, 238, 0.05)';
      ctx.beginPath();
      ctx.moveTo(gx + gw * 0.12, gy);
      ctx.lineTo(gx + gw * 0.28, gy);
      ctx.lineTo(gx + gw * 0.04, gy + gh);
      ctx.lineTo(gx - gw * 0.08, gy + gh);
      ctx.closePath();
      ctx.fill();

      // Rain condensation beads clinging to glass
      ctx.fillStyle = 'rgba(205, 228, 235, 0.3)';
      for (let i = 0; i < this.windowDrops.length; i++) {
        const wd = this.windowDrops[i];
        ctx.beginPath();
        ctx.arc(gx + wd.x * gw, gy + wd.y * gh, wd.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eerie Foggy Handprint Event on glass!
      if (s.handprintAlpha > 0.02) {
        const hx = gx + gw * 0.64;
        const hy = gy + gh * 0.56;
        ctx.save();
        ctx.globalAlpha = s.handprintAlpha * 0.62;
        ctx.fillStyle = 'rgba(218, 230, 234, 0.7)';
        // Palm
        ctx.beginPath();
        ctx.ellipse(hx, hy, 22, 26, -0.1, 0, Math.PI * 2);
        ctx.fill();
        // Fingers
        const fingers = [
          [-24, -14, -0.6, 5, 16],
          [-14, -34, -0.16, 4.5, 21],
          [-2, -39, -0.02, 4.8, 23],
          [10, -35, 0.12, 4.5, 21],
          [20, -26, 0.28, 4, 16]
        ];
        fingers.forEach(([fx, fy, rot, rw, rh]) => {
          ctx.save();
          ctx.translate(hx + fx, hy + fy);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      }

      // Knock visual acoustic ripples (guarantees audio-independent accessibility!)
      for (let i = 0; i < s.knockRipples.length; i++) {
        const r = s.knockRipples[i];
        ctx.strokeStyle = `rgba(242, 218, 174, ${r.alpha})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(gx + r.x * gw, gy + r.y * gh, r.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Vintage shop corner lettering painted on glass
      ctx.fillStyle = 'rgba(232, 216, 184, 0.28)';
      ctx.font = '600 11px monospace';
      ctx.fillText('SORA DINGIN · 23:00–05:00', gx + 14, gy + 22);

      // Left aluminum vertical pull bar + latch handle on sliding glass
      ctx.fillStyle = '#333d40';
      ctx.fillRect(gx, gy, 10, gh);
      ctx.fillStyle = s.windowSlide < 0.08 ? '#5e9e79' : '#d99c4a';
      ctx.fillRect(gx + 3, gy + gh * 0.44, 4, 46);

      ctx.restore();
    }

    _drawWindowFrame(ctx, win) {
      const hovered = this.state.hoveredTarget === 'window' && this.state.mode === 'gameplay';

      ctx.save();
      // Heavy recessed aluminum frame
      ctx.strokeStyle = hovered ? 'rgba(232, 190, 118, 0.72)' : '#2b3436';
      ctx.lineWidth = 10;
      ctx.strokeRect(win.x - 5, win.y - 5, win.w + 10, win.h + 10);

      // Inner metallic highlight
      ctx.strokeStyle = 'rgba(215, 232, 228, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(win.x, win.y, win.w, win.h);

      // Striped vintage kiosk awning lip just visible along top of outer window
      const stripeW = 32;
      ctx.save();
      ctx.beginPath();
      ctx.rect(win.x, win.y, win.w, 13);
      ctx.clip();
      for (let sx = win.x; sx < win.x + win.w; sx += stripeW) {
        const idx = Math.floor((sx - win.x) / stripeW);
        ctx.fillStyle = idx % 2 === 0 ? 'rgba(116, 36, 32, 0.72)' : 'rgba(204, 190, 162, 0.35)';
        ctx.fillRect(sx, win.y, stripeW, 13);
      }
      ctx.restore();
      ctx.restore();
    }

    _drawWallProps(ctx, w, h, win) {
      // 1. Left wall Light Switch Plate (interactive!)
      const sw = this.hitboxes.lightSwitch;
      const swHover = this.state.hoveredTarget === 'lightSwitch' && this.state.mode === 'gameplay';
      ctx.save();
      ctx.fillStyle = '#242c2d';
      ctx.strokeStyle = swHover || this.state.lightOut ? '#f0be73' : 'rgba(200, 218, 214, 0.28)';
      ctx.lineWidth = swHover || this.state.lightOut ? 2 : 1.2;
      ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
      ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);

      // Rocker toggle
      ctx.fillStyle = this.state.porchLightOn ? '#d9cba9' : '#586264';
      ctx.fillRect(sw.x + 9, sw.y + (this.state.porchLightOn ? 10 : 24), sw.w - 18, 18);
      // Small status LED
      ctx.fillStyle = this.state.lightOut ? '#ff594d' : (this.state.porchLightOn ? '#f0be73' : '#3a4444');
      ctx.beginPath();
      ctx.arc(sw.x + sw.w * 0.5, sw.y + sw.h - 7, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Vintage Ice Cream Menu Poster on Left Wall (hidden on Main Menu so title stays crisp)
      if (win.x > 165 && this.state.mode !== 'menu') {
        const px = 22;
        const py = win.y + 12;
        const pw = Math.min(130, win.x - 54);
        const ph = 148;
        ctx.save();
        ctx.fillStyle = '#1d2220';
        ctx.strokeStyle = 'rgba(225, 206, 168, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeRect(px, py, pw, ph);

        ctx.fillStyle = '#d99c4a';
        ctx.font = '700 10px monospace';
        ctx.fillText('MENU MALAM', px + 12, py + 22);
        const rows = [
          ['Vanila', '15k', '#f3ead3'],
          ['Cokelat', '18k', '#6c452e'],
          ['Stroberi', '18k', '#c96d78'],
          ['Matcha', '20k', '#739362'],
          ['Mint', '20k', '#89c5ba']
        ];
        ctx.font = '500 10.5px sans-serif';
        rows.forEach(([name, price, col], idx) => {
          const ry = py + 44 + idx * 20;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(px + 15, ry - 3, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c9c2b2';
          ctx.fillText(name, px + 26, ry);
          ctx.fillStyle = '#8d9692';
          ctx.fillText(price, px + pw - 28, ry);
        });
        ctx.restore();
      }

      // 3. Taped Yellow Sticky Note on Right Wall (if wide enough)
      const rightSpace = w - (win.x + win.w);
      if (rightSpace > 140) {
        const nx = win.x + win.w + 26;
        const ny = win.y + 38;
        ctx.save();
        ctx.translate(nx + 48, ny + 44);
        ctx.rotate(0.04);
        ctx.fillStyle = '#d8c37a';
        ctx.fillRect(-48, -44, 96, 86);
        // Tape strip
        ctx.fillStyle = 'rgba(235, 235, 225, 0.45)';
        ctx.fillRect(-16, -50, 32, 12);
        ctx.fillStyle = '#2b2419';
        ctx.font = '600 9.5px monospace';
        ctx.fillText('INGAT RAKA:', -40, -24);
        ctx.font = '500 9px sans-serif';
        ctx.fillText('1. Amati dulu', -40, -6);
        ctx.fillText('2. Tutup kaca', -40, 9);
        ctx.fillText('3. Waspada 03:00', -40, 24);
        ctx.restore();
      }
    }

    _drawFluorescentFixture(ctx, w, win) {
      const light = this.state.interiorLightLevel;
      const fx = win.x + win.w * 0.2;
      const fw = win.w * 0.6;
      const fy = Math.max(58, win.y - 16);

      ctx.save();
      // Fixture housing
      ctx.fillStyle = '#1b2224';
      ctx.fillRect(fx - 6, fy - 4, fw + 12, 9);
      // Glowing tube
      ctx.fillStyle = `rgba(214, 244, 236, ${0.22 + light * 0.78})`;
      ctx.shadowColor = 'rgba(184, 235, 224, 0.85)';
      ctx.shadowBlur = 18 * light;
      ctx.fillRect(fx, fy, fw, 4);
      ctx.restore();
    }

    _drawCounterForeground(ctx, w, h, win) {
      const cy = this.counterY;

      ctx.save();
      // Stainless steel counter lip & surface
      const counterGrad = ctx.createLinearGradient(0, cy, 0, h);
      counterGrad.addColorStop(0, '#2a3335');
      counterGrad.addColorStop(0.07, '#1d2527');
      counterGrad.addColorStop(0.35, '#121819');
      counterGrad.addColorStop(1, '#090c0d');
      ctx.fillStyle = counterGrad;
      ctx.fillRect(0, cy, w, h - cy);

      // Brushed metal top highlight line
      ctx.fillStyle = `rgba(205, 228, 222, ${0.18 * this.state.interiorLightLevel})`;
      ctx.fillRect(0, cy, w, 3);

      // Subtle brass service bell resting on the right edge of the window sill
      const bellX = win.x + win.w - 38;
      const bellY = cy - 2;
      ctx.fillStyle = '#25211d';
      ctx.fillRect(bellX - 16, bellY - 3, 32, 5);
      ctx.fillStyle = '#b98f4a';
      ctx.beginPath();
      ctx.arc(bellX, bellY - 3, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#e6c27e';
      ctx.fillRect(bellX - 3, bellY - 19, 6, 4);

      // Physical Red Desk Telephone on left side of counter (clickable on Canvas!)
      const ph = this.hitboxes.phone;
      const phHover = this.state.hoveredTarget === 'phone' && this.state.mode === 'gameplay';
      const shakeX = this.state.phoneRinging ? Math.sin(this.time * 55) * 2.5 : 0;

      ctx.save();
      ctx.translate(ph.x + shakeX, ph.y);
      if (this.state.phoneRinging) {
        const ringHalo = ctx.createRadialGradient(ph.w * 0.5, ph.h * 0.4, 5, ph.w * 0.5, ph.h * 0.4, 55);
        ringHalo.addColorStop(0, 'rgba(242, 72, 62, 0.42)');
        ringHalo.addColorStop(1, 'rgba(242, 72, 62, 0)');
        ctx.fillStyle = ringHalo;
        ctx.fillRect(-20, -24, ph.w + 40, ph.h + 40);
      }
      // Phone body
      ctx.fillStyle = '#7e221e';
      ctx.strokeStyle = phHover || this.state.phoneRinging ? '#ff8b83' : '#40110f';
      ctx.lineWidth = phHover ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 16);
      ctx.lineTo(ph.w - 8, 16);
      ctx.lineTo(ph.w, ph.h);
      ctx.lineTo(0, ph.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Handset resting on top
      ctx.fillStyle = '#992b26';
      ctx.beginPath();
      ctx.roundRect(4, 4, ph.w - 8, 13, 6);
      ctx.fill();

      // Rotary dial ring
      ctx.fillStyle = '#181414';
      ctx.beginPath();
      ctx.arc(ph.w * 0.5, 39, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4c8b4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ph.w * 0.5, 39, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Blinking LED
      ctx.fillStyle = this.state.phoneRinging && Math.sin(this.time * 18) > 0 ? '#ff6257' : '#3d1514';
      ctx.beginPath();
      ctx.arc(ph.w - 14, 26, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Physical Ice Cream Cup on counter when scooping!
      if (this.state.cupScoops && this.state.cupScoops.length > 0) {
        const cupX = win.x + win.w * 0.72;
        const cupY = cy + 6;
        this._drawCounterIceCreamCup(ctx, cupX, cupY, this.state.cupScoops);
      }

      ctx.restore();
    }

    _drawCounterIceCreamCup(ctx, cx, cy, scoops) {
      ctx.save();
      // Scoops stacked cleanly
      scoops.forEach((fid, idx) => {
        const fl = NS.Customers && NS.Customers.FLAVORS[fid];
        const color = fl ? fl.color : '#f3ead3';
        const rim = fl ? fl.rim : '#cbbda3';
        const sy = cy - 30 - idx * 14;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, sy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Vintage paper cup
      ctx.fillStyle = '#e8dfd0';
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy - 26);
      ctx.lineTo(cx + 17, cy - 26);
      ctx.lineTo(cx + 13, cy + 2);
      ctx.lineTo(cx - 13, cy + 2);
      ctx.closePath();
      ctx.fill();
      // Striped red cup band
      ctx.fillStyle = '#a8342d';
      ctx.fillRect(cx - 15, cy - 17, 30, 5);
      ctx.restore();
    }

    _drawLightingAtmosphere(ctx, w, h) {
      const s = this.state;

      // Darken kiosk interior if fluorescent flickers or is out
      const dim = Math.max(0, 1 - s.interiorLightLevel);
      if (dim > 0.04) {
        ctx.fillStyle = `rgba(3, 5, 8, ${dim * 0.78})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Red creeping dread vignette during active emergency lunge
      if (s.dangerLevel > 0.02) {
        const pulse = 0.75 + Math.sin(this.time * 18) * 0.25;
        const dg = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.16, w * 0.5, h * 0.45, w * 0.62);
        dg.addColorStop(0, 'rgba(0, 0, 0, 0)');
        dg.addColorStop(1, `rgba(175, 22, 18, ${s.dangerLevel * 0.58 * pulse})`);
        ctx.fillStyle = dg;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  NS.Renderer = KioskRenderer;
})(window);
