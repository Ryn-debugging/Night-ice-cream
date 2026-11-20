/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — Procedural Web Audio Engine
   100% Offline, zero external audio dependencies.
   Synthesizes rain, freezer hum, fluorescent buzz, tension drone, knocks,
   window slide, desk phone ring, footsteps, heartbeat, scoop, register,
   clue chime, stinger, and distant police sirens.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.ambienceGain = null;
      this.sfxGain = null;
      this.noiseBuffer = null;

      this.settings = {
        masterVolume: 0.8,
        ambienceVolume: 0.7,
        sfxVolume: 0.85,
        muted: false
      };

      this.ambienceStarted = false;
      this.rainGainNode = null;
      this.humGainNode = null;
      this.droneGainNode = null;
      this.droneOsc1 = null;
      this.droneOsc2 = null;

      this.phoneRingTimer = null;
      this.heartbeatTimer = null;
      this.currentTension = 0;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return true;
      }

      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return false;

      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.ambienceGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.ambienceGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.noiseBuffer = this._createNoiseBuffer(2.5);
        this.applySettings(this.settings);
        return true;
      } catch (_) {
        this.ctx = null;
        return false;
      }
    }

    unlock() {
      if (!this.ctx) {
        this.init();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    suspend() {
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    applySettings(settings) {
      if (!settings) return;
      this.settings = Object.assign({}, this.settings, settings);
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const master = this.settings.muted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setTargetAtTime(master, now, 0.04);
      this.ambienceGain.gain.setTargetAtTime(this.settings.ambienceVolume, now, 0.05);
      this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.04);
    }

    _createNoiseBuffer(seconds) {
      const length = Math.floor(this.ctx.sampleRate * seconds);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        // Pink-ish noise for warm rain & rumble
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
        b6 = white * 0.115926;
      }
      return buffer;
    }

    startAmbience(nightNumber) {
      if (!this.init()) return;
      if (this.ambienceStarted) {
        this.setRainIntensity(0.45 + Math.min(0.45, (nightNumber - 1) * 0.12));
        return;
      }
      this.ambienceStarted = true;

      // 1. Night rain & wind bed
      const rainSrc = this.ctx.createBufferSource();
      rainSrc.buffer = this.noiseBuffer;
      rainSrc.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1150;
      rainFilter.Q.value = 0.65;

      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.value = 0.28;

      rainSrc.connect(rainFilter);
      rainFilter.connect(this.rainGainNode);
      this.rainGainNode.connect(this.ambienceGain);
      rainSrc.start();

      // 2. Freezer compressor & fluorescent soft hum
      const humOsc = this.ctx.createOscillator();
      humOsc.type = 'sawtooth';
      humOsc.frequency.value = 58;

      const humFilter = this.ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 145;

      this.humGainNode = this.ctx.createGain();
      this.humGainNode.gain.value = 0.055;

      humOsc.connect(humFilter);
      humFilter.connect(this.humGainNode);
      this.humGainNode.connect(this.ambienceGain);
      humOsc.start();

      // 3. Psychological tension drone (scales smoothly with danger/suspicion)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc2.type = 'triangle';
      this.droneOsc1.frequency.value = 46;
      this.droneOsc2.frequency.value = 48.2;

      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 130;

      this.droneGainNode = this.ctx.createGain();
      this.droneGainNode.gain.value = 0.0;

      this.droneOsc1.connect(droneFilter);
      this.droneOsc2.connect(droneFilter);
      droneFilter.connect(this.droneGainNode);
      this.droneGainNode.connect(this.ambienceGain);
      this.droneOsc1.start();
      this.droneOsc2.start();
    }

    setRainIntensity(level) {
      if (!this.ctx || !this.rainGainNode) return;
      const v = Math.max(0.12, Math.min(0.65, level * 0.52));
      this.rainGainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.6);
    }

    setWindowMuffle(isOpen) {
      if (!this.ctx || !this.rainGainNode) return;
      const base = isOpen ? 0.44 : 0.25;
      this.rainGainNode.gain.setTargetAtTime(base, this.ctx.currentTime, 0.22);
    }

    setTension(level) {
      this.currentTension = Math.max(0, Math.min(1, level));
      if (!this.ctx || !this.droneGainNode) return;
      const now = this.ctx.currentTime;
      this.droneGainNode.gain.setTargetAtTime(this.currentTension * 0.22, now, 0.7);
      if (this.droneOsc2) {
        // Subtle detune grows more unsettling at higher tension
        this.droneOsc2.frequency.setTargetAtTime(47.4 + this.currentTension * 3.1, now, 0.8);
      }
    }

    playUiClick() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    playTypeBlip(pitch) {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((pitch || 360) + (Math.random() * 40 - 20), now);
      gain.gain.setValueAtTime(0.022, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.025);
    }

    playKnock(style) {
      if (!this.init()) return;
      // style: 'normal' (3 taps) | 'slow' (2 heavy ominous taps) | 'frantic' (5 rapid taps)
      let offsets = [0, 0.19, 0.38];
      let freq = 155;
      let vol = 0.42;

      if (style === 'slow') {
        offsets = [0, 0.55];
        freq = 112;
        vol = 0.5;
      } else if (style === 'frantic') {
        offsets = [0, 0.11, 0.22, 0.34, 0.46];
        freq = 185;
        vol = 0.48;
      }

      offsets.forEach((offset, idx) => {
        const t = this.ctx.currentTime + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + idx * 4, t);
        osc.frequency.exponentialRampToValueAtTime(52, t + 0.085);

        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);

        // Glass click transient
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'bandpass';
        hp.frequency.value = 1800;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(vol * 0.32, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        noise.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.05);
      });
    }

    playWindowSlide(opening, slam) {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const dur = slam ? 0.16 : 0.34;

      // Friction track scrape
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(opening ? 620 : 980, now);
      filter.frequency.linearRampToValueAtTime(opening ? 1050 : 480, now + dur);
      filter.Q.value = 2.4;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(slam ? 0.42 : 0.22, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + dur + 0.02);

      // Metallic latch clack at end
      const clackTime = now + dur * 0.85;
      const osc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(slam ? 140 : 280, clackTime);
      osc.frequency.exponentialRampToValueAtTime(60, clackTime + 0.07);
      cGain.gain.setValueAtTime(slam ? 0.45 : 0.16, clackTime);
      cGain.gain.exponentialRampToValueAtTime(0.001, clackTime + 0.085);
      osc.connect(cGain);
      cGain.connect(this.sfxGain);
      osc.start(clackTime);
      osc.stop(clackTime + 0.09);

      this.setWindowMuffle(opening);
    }

    playBell() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      [1680, 3365].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(i === 0 ? 0.2 : 0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.9);
      });
    }

    playScoop() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    playCashRegister() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const notes = [1046, 1318, 2093];
      notes.forEach((f, idx) => {
        const t = now + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    }

    playErrorOrder() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.linearRampToValueAtTime(125, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.28);
    }

    playLightSwitch() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.035);
    }

    playFlickerBuzz() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.setValueAtTime(0.01, now + 0.06);
      gain.gain.setValueAtTime(0.14, now + 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.34);
    }

    playFootsteps(direction) {
      if (!this.init()) return;
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const t = this.ctx.currentTime + i * 0.36;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 460 + (i % 2) * 90;
        bp.Q.value = 1.6;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        noise.connect(bp);
        bp.connect(gain);

        if (this.ctx.createStereoPanner) {
          const pan = this.ctx.createStereoPanner();
          const progress = i / (steps - 1);
          pan.pan.value = direction === 'rtl' ? 0.75 - progress * 1.5 : -0.75 + progress * 1.5;
          gain.connect(pan);
          pan.connect(this.sfxGain);
        } else {
          gain.connect(this.sfxGain);
        }

        noise.start(t);
        noise.stop(t + 0.14);
      }
    }

    startPhoneRing() {
      this.stopPhoneRing();
      const ringBurst = () => {
        if (!this.init()) return;
        const now = this.ctx.currentTime;
        // Classic twin-tone desk telephone ring modulated at ~18Hz
        [440, 480].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const lfo = this.ctx.createOscillator();
          const lfoGain = this.ctx.createGain();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.value = freq;
          lfo.frequency.value = 18;
          lfoGain.gain.value = 0.08;
          gain.gain.value = 0.09;

          lfo.connect(lfoGain);
          lfoGain.connect(gain.gain);
          osc.connect(gain);
          gain.connect(this.sfxGain);

          osc.start(now);
          lfo.start(now);
          osc.stop(now + 0.95);
          lfo.stop(now + 0.95);
        });
      };

      ringBurst();
      this.phoneRingTimer = global.setInterval(ringBurst, 2200);
    }

    stopPhoneRing() {
      if (this.phoneRingTimer) {
        global.clearInterval(this.phoneRingTimer);
        this.phoneRingTimer = null;
      }
    }

    playPhonePickup(creepy) {
      this.stopPhoneRing();
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      // Handset click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.07);

      if (creepy) {
        // Brief unsettling static hiss
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const hp = this.ctx.createBiquadFilter();
        hp.type = 'bandpass';
        hp.frequency.value = 1650;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.16, now + 0.08);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        noise.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(now + 0.08);
        noise.stop(now + 0.95);
      }
    }

    playClueFound() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const notes = [440, 523.25, 659.25];
      notes.forEach((f, idx) => {
        const t = now + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.55);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);
      });
    }

    playStinger(intense) {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const freqs = intense ? [72, 108, 153] : [65, 97];
      freqs.forEach((f) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * 0.88, now + (intense ? 1.4 : 0.9));

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(intense ? 820 : 380, now);
        filter.frequency.exponentialRampToValueAtTime(110, now + (intense ? 1.4 : 0.9));

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(intense ? 0.24 : 0.13, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (intense ? 1.45 : 0.95));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.5);
      });
    }

    startHeartbeat() {
      this.stopHeartbeat();
      const beat = () => {
        if (!this.init()) return;
        const now = this.ctx.currentTime;
        [0, 0.18].forEach((offset, i) => {
          const t = now + offset;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(i === 0 ? 64 : 52, t);
          osc.frequency.exponentialRampToValueAtTime(28, t + 0.13);
          gain.gain.setValueAtTime(i === 0 ? 0.34 : 0.24, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.18);
        });
      };
      beat();
      this.heartbeatTimer = global.setInterval(beat, 620);
    }

    stopHeartbeat() {
      if (this.heartbeatTimer) {
        global.clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }

    playSiren() {
      if (!this.init()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(780, now + 0.7);
      osc.frequency.linearRampToValueAtTime(520, now + 1.4);
      osc.frequency.linearRampToValueAtTime(780, now + 2.1);
      osc.frequency.linearRampToValueAtTime(500, now + 2.8);

      filter.type = 'lowpass';
      filter.frequency.value = 1100;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 3.1);
    }
  }

  NS.Audio = new AudioEngine();
})(window);
