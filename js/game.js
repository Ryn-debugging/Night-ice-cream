/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — Core Game State Machine
   Orchestrates 5-night shifts, clock progression, window control, ice cream
   serving, observation & clues, phone calls, horror events, intrusion defense,
   shift summaries, endings, and localStorage saves.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  function formatRupiah(amount) {
    const val = Math.max(0, Math.floor(amount || 0));
    return 'Rp ' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatClock(floatHour) {
    let wrapped = floatHour % 24;
    if (wrapped < 0) wrapped += 24;
    const h = Math.floor(wrapped);
    const m = Math.floor((wrapped - h) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  class NightShiftGame {
    constructor(renderer, uiHooks) {
      this.renderer = renderer;
      this.ui = uiHooks;

      this.settings = NS.Save.loadSettings();
      this.meta = NS.Save.loadMeta();
      NS.Audio.applySettings(this.settings);
      this.renderer.state.reducedFlash = this.settings.reducedFlash;

      this.screen = 'menu'; // 'menu' | 'intro' | 'gameplay' | 'summary' | 'ending'
      this.paused = false;
      this.introIndex = 0;

      // Persistent run progress
      this.night = 1;
      this.totalMoney = 0;
      this.clues = [];
      this.stats = {
        totalServed: 0,
        totalThreatsRefused: 0,
        totalInnocentRefused: 0,
        totalWrongOrders: 0,
        closeCalls: 0
      };

      // Per-night runtime state
      this.phase = 'waiting'; // 'waiting' | 'customer_present' | 'customer_leaving' | 'intrusion' | 'phone_call'
      this.prevPhaseBeforePhone = 'waiting';
      this.schedule = [];
      this.customerIndex = 0;
      this.currentCustomer = null;
      this.observedAspects = { face: false, clothes: false, probe: false };
      this.observeOpen = false;

      this.windowOpen = false;
      this.porchLightOn = true;
      this.lightOut = false;

      this.cupScoops = [];
      this.strikes = 0;
      this.maxStrikes = 3;

      this.shiftStats = {
        served: 0,
        threatsRefused: 0,
        wrongOrders: 0,
        income: 0,
        cluesFoundThisNight: []
      };

      // Clock & timers
      this.clockFloat = 23.0; // 23.0 -> 28.0 (04:00) or 29.0 (05:00)
      this.targetEndFloat = 28.0;
      this.nextCustomerTimer = 3.5;
      this.leavingTimer = 0;

      // Intrusion emergency timer
      this.intrusionTimeLeft = 0;
      this.intrusionDuration = 3.6;

      // Phone state
      this.pendingPhoneCall = null;
      this.phoneRinging = false;
      this.phoneRingTimeout = 0;
      this.activePhoneCall = null;
      this.scheduledMidNightCallTriggered = false;

      // Dialogue typewriter queue
      this.dialogueSpeaker = 'Kios Sora Dingin';
      this.dialogueTag = 'Shift Malam';
      this.dialogueStyle = 'normal'; // 'normal' | 'observation' | 'phone' | 'horror'
      this.dialogueQueue = [];
      this.currentFullText = '';
      this.displayedChars = 0;
      this.typeTimer = 0;
      this.onDialogueExhausted = null;

      // Toast banner timer
      this.toastTimer = 0;
    }

    // =========================================================================
    // SETTINGS & SCREEN NAVIGATION
    // =========================================================================

    applySettings(newSettings) {
      this.settings = NS.Save.saveSettings(newSettings);
      NS.Audio.applySettings(this.settings);
      this.renderer.state.reducedFlash = this.settings.reducedFlash;
      this.ui.syncSettingsUI(this.settings);
    }

    toggleMute() {
      this.applySettings(Object.assign({}, this.settings, { muted: !this.settings.muted }));
    }

    showMenu() {
      this.paused = false;
      this.screen = 'menu';
      NS.Audio.stopPhoneRing();
      NS.Audio.stopHeartbeat();
      NS.Audio.setTension(0.08);

      this.renderer.state.mode = 'menu';
      this.renderer.state.customer = null;
      this.renderer.state.customerVisible = false;
      this.renderer.state.windowTarget = 0;
      this.renderer.state.dangerLevel = 0;
      this.renderer.state.phoneRinging = false;
      this.renderer.state.lightOut = false;
      this.renderer.state.cupScoops = [];
      this.renderer.state.rainIntensity = 0.55;
      this.renderer.state.fogDensity = 0.38;

      this.meta = NS.Save.loadMeta();
      const saved = NS.Save.loadProgress();
      this.ui.showScreen('menu');
      this.ui.updateMenu(saved, this.meta);
    }

    startNewGame() {
      NS.Audio.unlock();
      NS.Audio.playUiClick();
      NS.Audio.startAmbience(1);

      this.night = 1;
      this.totalMoney = 0;
      this.clues = [];
      this.stats = {
        totalServed: 0,
        totalThreatsRefused: 0,
        totalInnocentRefused: 0,
        totalWrongOrders: 0,
        closeCalls: 0
      };

      this.introIndex = 0;
      this.screen = 'intro';
      this.ui.showScreen('intro');
      this.ui.renderIntroStep(this.introIndex, NS.Dialogue.INTRO_STEPS);
    }

    continueSavedGame() {
      const saved = NS.Save.loadProgress();
      if (!saved) {
        this.startNewGame();
        return;
      }
      NS.Audio.unlock();
      NS.Audio.playUiClick();
      NS.Audio.startAmbience(saved.night);

      this.night = saved.night;
      this.totalMoney = saved.totalMoney;
      this.clues = saved.clues.slice();
      this.stats = Object.assign({}, saved.stats);

      this.startNight(this.night);
    }

    advanceIntro() {
      NS.Audio.playUiClick();
      if (this.introIndex < NS.Dialogue.INTRO_STEPS.length - 1) {
        this.introIndex += 1;
        this.ui.renderIntroStep(this.introIndex, NS.Dialogue.INTRO_STEPS);
      } else {
        this.startNight(1);
      }
    }

    skipIntroAndStart() {
      NS.Audio.unlock();
      NS.Audio.playUiClick();
      this.startNight(1);
    }

    setPaused(shouldPause) {
      if (this.screen !== 'gameplay') return;
      this.paused = Boolean(shouldPause);
      if (this.paused) {
        NS.Audio.stopPhoneRing();
        NS.Audio.stopHeartbeat();
      } else {
        if (this.phoneRinging) NS.Audio.startPhoneRing();
        if (this.phase === 'intrusion') NS.Audio.startHeartbeat();
      }
      this.ui.setPauseModal(this.paused);
    }

    // =========================================================================
    // NIGHT INITIALIZATION
    // =========================================================================

    startNight(nightNumber) {
      this.night = Math.max(1, Math.min(5, nightNumber));
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];

      this.paused = false;
      this.screen = 'gameplay';
      this.phase = 'waiting';
      this.schedule = NS.Customers.getScheduleForNight(this.night).slice();
      this.customerIndex = 0;
      this.currentCustomer = null;
      this.observedAspects = { face: false, clothes: false, probe: false };
      this.observeOpen = false;

      this.windowOpen = false;
      this.porchLightOn = true;
      this.lightOut = false;
      this.cupScoops = [];
      this.strikes = 0;

      this.shiftStats = {
        served: 0,
        threatsRefused: 0,
        wrongOrders: 0,
        income: 0,
        cluesFoundThisNight: []
      };

      // Hours represented continuously past midnight (e.g. 23.0 -> 28.0 = 04:00, 29.0 = 05:00)
      this.clockFloat = cfg.startHour;
      this.targetEndFloat = cfg.endHour < cfg.startHour ? cfg.endHour + 24 : cfg.endHour;

      this.pendingPhoneCall = null;
      this.phoneRinging = false;
      this.phoneRingTimeout = 0;
      this.activePhoneCall = null;
      this.scheduledMidNightCallTriggered = false;

      this.intrusionTimeLeft = 0;
      this.leavingTimer = 0;
      this.nextCustomerTimer = 5.0;

      NS.Events.resetForNight(this.night);
      NS.Audio.startAmbience(this.night);
      NS.Audio.stopPhoneRing();
      NS.Audio.stopHeartbeat();
      NS.Audio.setWindowMuffle(false);
      NS.Audio.setTension(cfg.ambientTension);

      // Reset renderer for this night
      const rs = this.renderer.state;
      rs.mode = 'gameplay';
      rs.night = this.night;
      rs.rainIntensity = cfg.rainIntensity;
      rs.fogDensity = cfg.fogDensity;
      rs.windowTarget = 0;
      rs.windowSlide = 0;
      rs.porchLightOn = true;
      rs.lightOut = false;
      rs.phoneRinging = false;
      rs.customer = null;
      rs.customerVisible = false;
      rs.customerAlpha = 0;
      rs.customerLunge = 0;
      rs.dangerLevel = 0;
      rs.handprintAlpha = 0;
      rs.vanishingAlpha = 0;
      rs.cupScoops = [];

      this.ui.showScreen('gameplay');
      this.toastTimer = 0;
      this.ui.hideToast();
      this.ui.setDangerBanner(false, 0, 1);

      this.setDialogue(
        `Malam ${this.night} — ${cfg.title}`,
        'Awal Shift',
        [cfg.introNote],
        'normal'
      );

      // Schedule opening shift phone briefing cleanly
      const introCallMap = {
        1: 'night1_boss',
        2: 'night2_boss',
        3: 'night3_boss',
        4: 'night4_warning',
        5: 'night5_police'
      };
      const openingCallId = introCallMap[this.night];
      if (openingCallId && NS.Dialogue.PHONE_CALLS[openingCallId]) {
        this._queuePhoneRing(NS.Dialogue.PHONE_CALLS[openingCallId], 2.0);
        this.nextCustomerTimer = 8.5;
      }

      this._syncHUD();
    }

    // =========================================================================
    // MAIN LOOP TICK
    // =========================================================================

    update(dt) {
      this.renderer.update(dt);
      this.renderer.render();

      if (this.screen !== 'gameplay' || this.paused || this.modalLocked) return;

      // Update toast timeout
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) {
          this.ui.hideToast();
        }
      }

      // Update dialogue typewriter
      this._updateTypewriter(dt);

      // Delayed phone ring trigger
      if (this._phoneDelayTimer > 0) {
        this._phoneDelayTimer -= dt;
        if (this._phoneDelayTimer <= 0 && this._delayedCall) {
          const call = this._delayedCall;
          this._delayedCall = null;
          this._startPhoneRinging(call);
        }
      }

      // Active ringing phone auto-timeout so game never stalls
      if (this.phoneRinging) {
        this.phoneRingTimeout -= dt;
        if (this.phoneRingTimeout <= 0) {
          this._stopPhoneRinging();
          this.showToast('Telepon berhenti berdering.', 'normal');
        }
      }

      // Smooth clock progression toward milestone based on customer index
      const totalCust = Math.max(1, this.schedule.length);
      const span = this.targetEndFloat - 23.0;
      const targetMilestone = 23.0 + (this.customerIndex / totalCust) * span;
      if (this.clockFloat < targetMilestone) {
        this.clockFloat = Math.min(targetMilestone, this.clockFloat + dt * 0.14);
      } else if (this.phase === 'waiting' || this.phase === 'customer_present') {
        // Gentle real-time tick (capped slightly before next milestone)
        const softCap = Math.min(this.targetEndFloat - 0.08, 23.0 + ((this.customerIndex + 0.85) / totalCust) * span);
        if (this.clockFloat < softCap) {
          this.clockFloat += dt * 0.012;
        }
      }
      this.ui.updateClock(formatClock(this.clockFloat), formatClock(this.targetEndFloat));

      // Phase-specific timers
      if (this.phase === 'waiting') {
        // Don't spawn next customer while player is actively reading a phone call or while an opening call is still ringing
        if (!this.phoneRinging) {
          this.nextCustomerTimer -= dt;
          if (this.nextCustomerTimer <= 0) {
            this._spawnNextCustomer();
          }
        }
      } else if (this.phase === 'customer_leaving') {
        this.leavingTimer -= dt;
        if (this.leavingTimer <= 0 && this.dialogueQueue.length === 0 && this.displayedChars >= this.currentFullText.length) {
          this._finishCustomerDeparture();
        }
      } else if (this.phase === 'intrusion') {
        this.intrusionTimeLeft -= dt;
        const progress = 1 - Math.max(0, this.intrusionTimeLeft / this.intrusionDuration);
        this.renderer.state.customerLunge = Math.min(1, progress * 1.15);
        this.renderer.state.dangerLevel = 0.55 + progress * 0.45;
        this.ui.setDangerBanner(true, Math.max(0, this.intrusionTimeLeft), this.intrusionDuration);

        if (this.intrusionTimeLeft <= 0) {
          this._triggerEnding('bad_killed');
          return;
        }
      }

      // Random horror events engine (throttled & non-blocking)
      NS.Events.update(dt, {
        night: this.night,
        phase: this.phase,
        hasCustomer: Boolean(this.currentCustomer),
        windowOpen: this.windowOpen,
        phoneRinging: this.phoneRinging || Boolean(this.activePhoneCall),
        lightOut: this.lightOut,
        reducedFlash: this.settings.reducedFlash,
        triggerCallback: (evType) => this._handleRandomEvent(evType)
      });
    }

    // =========================================================================
    // CUSTOMER LIFECYCLE
    // =========================================================================

    _spawnNextCustomer() {
      // Mid-night special creepy phone call on Night 3 right after Customer 2!
      if (this.night === 3 && this.customerIndex === 2 && !this.scheduledMidNightCallTriggered) {
        this.scheduledMidNightCallTriggered = true;
        this._startPhoneRinging(NS.Dialogue.PHONE_CALLS.night3_creepy);
        this.renderer.triggerFlicker(0.8);
        NS.Audio.playFlickerBuzz();
        this.nextCustomerTimer = 3.5;
        return;
      }

      if (this.customerIndex >= this.schedule.length) {
        this._completeShift();
        return;
      }

      const cust = this.schedule[this.customerIndex];
      this.currentCustomer = cust;
      this.phase = 'customer_present';
      this.observedAspects = { face: false, clothes: false, probe: false };
      this.observeOpen = false;
      this.cupScoops = [];
      this.renderer.state.cupScoops = [];

      // Night 5 climax snaps clock to dramatic 03:00!
      if (cust.threatLevel === 'climax') {
        this.clockFloat = Math.max(this.clockFloat, 27.0); // 03:00
        NS.Audio.setTension(0.95);
        NS.Audio.playStinger(true);
      } else if (cust.threatLevel === 'danger' || cust.threatLevel === 'eerie') {
        const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
        NS.Audio.setTension(Math.min(0.85, cfg.ambientTension + 0.35));
      } else {
        const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
        NS.Audio.setTension(cfg.ambientTension);
      }

      // Visual & audio entrance
      this.renderer.state.customer = cust;
      this.renderer.state.customerVisible = true;
      this.renderer.state.customerLunge = 0;

      NS.Audio.playKnock(cust.knockStyle || 'normal');
      this.renderer.triggerKnockRipple();
      global.setTimeout(() => {
        if (this.screen === 'gameplay' && this.currentCustomer === cust) {
          this.renderer.triggerKnockRipple();
        }
      }, 240);

      // If player carelessly left window open before a DANGER customer arrived!
      if (this.windowOpen && cust.threatLevel === 'danger') {
        this.showToast('Jendela masih terbuka saat sosok mencurigakan mendekat!', 'horror');
        this._triggerIntrusion(cust);
        this._syncHUD();
        return;
      }
      if (this.windowOpen && cust.threatLevel === 'climax') {
        this.showToast('Jendela terbuka saat Arman tiba pukul 03:00!', 'horror');
        this._triggerEnding('bad_killed');
        return;
      }

      this.setDialogue(
        `${cust.name} — ${cust.label}`,
        this.windowOpen ? 'Jendela Terbuka' : 'Di Balik Kaca',
        cust.greeting.slice(),
        cust.threatLevel === 'climax' ? 'horror' : 'normal'
      );

      this._syncHUD();
    }

    // =========================================================================
    // WINDOW MECHANIC (F-02)
    // =========================================================================

    toggleWindow() {
      if (this.screen !== 'gameplay' || this.paused) return;

      // Emergency close during active intrusion!
      if (this.phase === 'intrusion') {
        this._slamWindowInIntrusion();
        return;
      }

      if (this.phase === 'phone_call') {
        this.showToast('Selesaikan percakapan telepon terlebih dahulu.', 'normal');
        return;
      }

      if (this.windowOpen) {
        this.windowOpen = false;
        this.renderer.state.windowTarget = 0;
        NS.Audio.playWindowSlide(false, false);
        this.cupScoops = [];
        this.renderer.state.cupScoops = [];
        this._syncHUD();
        return;
      }

      // Opening the window
      this.windowOpen = true;
      this.observeOpen = false;
      this.renderer.state.windowTarget = 1;
      NS.Audio.playWindowSlide(true, false);

      if (this.phase === 'customer_present' && this.currentCustomer) {
        const cust = this.currentCustomer;
        if (cust.threatLevel === 'danger') {
          this._triggerIntrusion(cust);
          return;
        }
        if (cust.threatLevel === 'climax') {
          NS.Audio.playStinger(true);
          this.ui.triggerFlash('red');
          this.renderer.triggerCameraShake(14);
          this.renderer.state.customerLunge = 1;
          global.setTimeout(() => {
            if (this.screen === 'gameplay') {
              this._triggerEnding('bad_killed');
            }
          }, 650);
          return;
        }
        NS.Audio.playBell();
        this.showToast(`Jendela dibuka. Siapkan pesanan: ${cust.orderText}`, 'normal');
      } else {
        this.showToast('Jendela terbuka sementara tidak ada pelanggan. Sebaiknya tutup kembali.', 'horror');
      }

      this._syncHUD();
    }

    _triggerIntrusion(cust) {
      this.phase = 'intrusion';
      this.observeOpen = false;
      this.intrusionDuration = Math.max(2.7, 3.8 - (this.night - 2) * 0.25);
      this.intrusionTimeLeft = this.intrusionDuration;
      this.renderer.state.dangerLevel = 0.65;
      this.renderer.triggerCameraShake(11);
      this.ui.triggerFlash('red');

      NS.Audio.playStinger(true);
      NS.Audio.startHeartbeat();
      NS.Audio.setTension(1.0);

      this.setDialogue(
        'BAHAYA!',
        'Jendela Terbuka',
        [cust.dangerMessage || 'Sosok di luar menerjang ke arah jendela! Banting tutup jendela sekarang!'],
        'horror'
      );

      this.ui.setDangerBanner(true, this.intrusionTimeLeft, this.intrusionDuration);
      this._syncHUD();
    }

    _slamWindowInIntrusion() {
      const cust = this.currentCustomer;
      this.windowOpen = false;
      this.renderer.state.windowTarget = 0;
      this.renderer.state.customerLunge = 0;
      this.renderer.state.dangerLevel = 0;
      this.renderer.triggerCameraShake(10);
      this.ui.triggerFlash('white');
      this.ui.setDangerBanner(false, 0, 1);

      NS.Audio.stopHeartbeat();
      NS.Audio.playWindowSlide(false, true);

      this.stats.closeCalls += 1;
      this.shiftStats.threatsRefused += 1;
      this.stats.totalThreatsRefused += 1;

      if (cust && cust.clueOnRefuse) {
        this.unlockClue(cust.clueOnRefuse);
      }

      this.phase = 'customer_leaving';
      this.leavingTimer = 2.6;
      this.setDialogue(
        'Nyaris Tertangkap!',
        'Jendela Terkunci',
        [
          'BRAK! Kaca membentur lengannya tepat sebelum sempat menggapaimu. Sosok itu mendesis dingin dari balik kaca, lalu mundur perlahan ke dalam kegelapan.'
        ],
        'horror'
      );
      this.showToast('Berhasil membanting tutup jendela tepat waktu!', 'clue');
      this._syncHUD();
    }

    // =========================================================================
    // OBSERVATION & CLUE SYSTEM (F-04)
    // =========================================================================

    toggleObserveMenu() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.currentCustomer) return;
      NS.Audio.playUiClick();
      this.observeOpen = !this.observeOpen;
      this._syncHUD();
    }

    inspectCustomer(aspect) {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.currentCustomer) return;

      const cust = this.currentCustomer;
      if (!cust.observations || !cust.observations[aspect]) return;

      NS.Audio.playUiClick();
      this.observedAspects[aspect] = true;

      let text = '';
      let clueId = null;

      if (aspect === 'probe') {
        // Testing with question + porch light flash!
        this.renderer.triggerPorchFlash();
        NS.Audio.playLightSwitch();
        const probeObj = cust.observations.probe;
        text = typeof probeObj === 'string' ? probeObj : probeObj.text;
        clueId = typeof probeObj === 'object' ? probeObj.clueId : null;
      } else {
        text = cust.observations[aspect];
        // Also reveal clothes-specific clues if player inspects clothes carefully
        if (aspect === 'clothes' && cust.id === 'n2_budi_threat') clueId = 'clue_dry_coat';
        if (aspect === 'clothes' && cust.id === 'n4_inspector_threat') clueId = 'clue_inspector_lie';
        if (aspect === 'face' && cust.id === 'n1_stranger') clueId = 'clue_dimas_query';
      }

      const tagLabels = {
        face: 'Observasi: Wajah & Tatapan',
        clothes: 'Observasi: Pakaian & Tangan',
        probe: 'Observasi: Tanya & Uji Lampu'
      };

      this.setDialogue(
        `Pengamatan — ${cust.name}`,
        tagLabels[aspect] || 'Observasi',
        [text],
        'observation'
      );

      if (clueId) {
        this.unlockClue(clueId);
      }

      this._syncHUD();
    }

    unlockClue(clueId) {
      if (!clueId || !NS.Dialogue.CLUES[clueId]) return false;
      if (this.clues.includes(clueId)) return false;

      this.clues.push(clueId);
      this.shiftStats.cluesFoundThisNight.push(clueId);
      const clue = NS.Dialogue.CLUES[clueId];

      NS.Audio.playClueFound();
      this.showToast(`Petunjuk Baru Dicatat: "${clue.title}" (Tekan J untuk membaca)`, 'clue');
      this.ui.pulseClueButton();
      this._syncHUD();
      return true;
    }

    // =========================================================================
    // REFUSE SERVICE & NIGHT 5 SECRET CONFRONTATION
    // =========================================================================

    refuseCustomer() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.currentCustomer) return;

      const cust = this.currentCustomer;
      NS.Audio.playUiClick();
      this.observeOpen = false;

      if (this.windowOpen) {
        this.windowOpen = false;
        this.renderer.state.windowTarget = 0;
        NS.Audio.playWindowSlide(false, false);
      }

      // Night 5 Climax: Refusing Arman securely survives until 05:00 dawn -> GOOD ENDING!
      if (cust.threatLevel === 'climax') {
        this.phase = 'customer_leaving';
        this.renderer.state.customerVisible = false;
        this.setDialogue(
          'Jendela Terkunci Hingga Pagi',
          'Malam 5 — 05:00',
          [cust.refuseResponse],
          'normal',
          () => {
            this._triggerEnding('good');
          }
        );
        this.leavingTimer = 3.2;
        this._syncHUD();
        return;
      }

      if (cust.threatLevel === 'safe') {
        this.strikes += 1;
        this.stats.totalInnocentRefused += 1;
        NS.Audio.playErrorOrder();
        this.showToast(
          `Kamu menolak pelanggan tidak bersalah (${cust.name})! Teguran Bos: ${this.strikes}/${this.maxStrikes}`,
          'horror'
        );

        if (this.strikes >= this.maxStrikes) {
          this.setDialogue(
            cust.name,
            'Pelanggan Pergi Marah',
            [cust.refuseResponse],
            'horror',
            () => {
              this._triggerEnding('bad_fired');
            }
          );
          this.phase = 'customer_leaving';
          this.leavingTimer = 2.4;
          this._syncHUD();
          return;
        }
      } else if (cust.threatLevel === 'danger') {
        this.shiftStats.threatsRefused += 1;
        this.stats.totalThreatsRefused += 1;
        NS.Audio.playStinger(false);
        this.showToast('Keputusan tepat! Sosok mencurigakan menjauh dari jendela.', 'clue');
        if (cust.clueOnRefuse) {
          this.unlockClue(cust.clueOnRefuse);
        }
      } else if (cust.threatLevel === 'eerie') {
        // Night 1 eerie visitor — refusing gives no strike & unlocks clue!
        this.shiftStats.threatsRefused += 1;
        this.stats.totalThreatsRefused += 1;
        if (cust.clueOnRefuse) {
          this.unlockClue(cust.clueOnRefuse);
        }
      }

      this.phase = 'customer_leaving';
      this.leavingTimer = 2.3;
      this.setDialogue(
        `${cust.name}`,
        'Pelayanan Ditolak',
        [cust.refuseResponse || 'Pelanggan itu terdiam sejenak lalu pergi meninggalkan jendela.'],
        cust.threatLevel === 'danger' ? 'horror' : 'normal'
      );
      this._syncHUD();
    }

    triggerSecretConfrontation() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.currentCustomer) return;
      if (this.currentCustomer.threatLevel !== 'climax') return;
      if (this.windowOpen || this.clues.length < 5) return;

      this.observeOpen = false;
      NS.Audio.playPhonePickup(false);
      NS.Audio.playSiren();
      this.renderer.triggerPorchFlash();
      this.renderer.state.mode = 'ending_secret';

      this.phase = 'customer_leaving';
      this.leavingTimer = 3.8;
      this.setDialogue(
        'Raka (Melalui Kaca Terkunci)',
        'Konfrontasi Akhir',
        [
          '"Aku tahu siapa kamu, Arman! Mantan penjaga halte Melati. Catatan Dimas, mantel keringmu, kartu namamu—semuanya sudah kuserahkan ke Bripka Danu lewat telepon barusan!"',
          'Wajah dingin di balik kaca membeku untuk pertama kalinya. Dari balik kabut tebal Jalan Melati, raungan sirene dan kilatan lampu biru-merah polisi melaju cepat ke arah kios!'
        ],
        'observation',
        () => {
          this._triggerEnding('secret');
        }
      );
      this._syncHUD();
    }

    // =========================================================================
    // ICE CREAM ORDER SERVING (F-03)
    // =========================================================================

    addScoop(flavorId) {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.windowOpen || !this.currentCustomer) return;
      if (!NS.Customers.FLAVORS[flavorId]) return;

      const maxScoops = Math.max(2, this.currentCustomer.order.length || 1);
      if (this.cupScoops.length >= maxScoops) {
        this.showToast(`Gelas sudah penuh (${maxScoops} scoop). Tekan Serahkan atau Kosongkan.`, 'normal');
        return;
      }

      this.cupScoops.push(flavorId);
      this.renderer.state.cupScoops = this.cupScoops.slice();
      NS.Audio.playScoop();
      this._syncHUD();
    }

    clearCup() {
      if (this.screen !== 'gameplay' || this.paused) return;
      this.cupScoops = [];
      this.renderer.state.cupScoops = [];
      NS.Audio.playUiClick();
      this._syncHUD();
    }

    serveOrder() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.windowOpen || !this.currentCustomer) return;
      if (this.cupScoops.length === 0) {
        this.showToast('Pilih varian es krim dari freezer terlebih dahulu!', 'normal');
        return;
      }

      const cust = this.currentCustomer;
      const expected = cust.order.slice().sort();
      const actual = this.cupScoops.slice().sort();
      const isExact = expected.length === actual.length && expected.every((v, i) => v === actual[i]);

      const fullPrice = NS.Customers.calcOrderPrice(cust.order);
      let earned = 0;

      if (isExact) {
        earned = fullPrice;
        NS.Audio.playCashRegister();
        this.showToast(`Pesanan tepat! +${formatRupiah(earned)}`, 'clue');
      } else {
        // Partial match earns 50%, completely wrong earns 0
        const anyMatch = actual.some((f) => expected.includes(f));
        earned = anyMatch && expected.length > 1 ? Math.floor(fullPrice * 0.5) : 0;
        this.shiftStats.wrongOrders += 1;
        this.stats.totalWrongOrders += 1;
        NS.Audio.playErrorOrder();
        this.showToast(
          earned > 0
            ? `Pesanan kurang tepat! Pendapatan berkurang (+${formatRupiah(earned)}).`
            : 'Pesanan salah! Pelanggan kecewa (Rp 0).',
          'horror'
        );
      }

      this.shiftStats.income += earned;
      this.totalMoney += earned;
      this.shiftStats.served += 1;
      this.stats.totalServed += 1;

      if (cust.clueOnServe) {
        this.unlockClue(cust.clueOnServe);
      }

      this.cupScoops = [];
      this.renderer.state.cupScoops = [];
      this.observeOpen = false;
      this.phase = 'customer_leaving';
      this.leavingTimer = 2.4;

      this.setDialogue(
        `${cust.name}`,
        isExact ? 'Transaksi Selesai' : 'Pesanan Keliru',
        [isExact ? cust.serveCorrect : cust.serveWrong],
        cust.threatLevel === 'eerie' ? 'horror' : 'normal'
      );

      this._syncHUD();
    }

    _finishCustomerDeparture() {
      // Check if an ending callback was pending
      if (this.onDialogueExhausted) {
        const cb = this.onDialogueExhausted;
        this.onDialogueExhausted = null;
        cb();
        return;
      }

      this.renderer.state.customerVisible = false;
      this.currentCustomer = null;
      this.customerIndex += 1;
      this.observedAspects = { face: false, clothes: false, probe: false };
      this.observeOpen = false;

      if (this.customerIndex >= this.schedule.length) {
        this._completeShift();
        return;
      }

      this.phase = 'waiting';
      this.nextCustomerTimer = 3.8 + Math.random() * 2.2;

      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
      NS.Audio.setTension(cfg.ambientTension);

      if (this.windowOpen) {
        this.setDialogue(
          'Kios Sora Dingin',
          'Peringatan',
          ['Pelanggan sudah pergi, tapi jendela pelayanan masih terbuka. Tekan [E] untuk menutupnya kembali.'],
          'normal'
        );
      } else {
        this.setDialogue(
          'Kios Sora Dingin',
          'Menunggu Pelanggan',
          ['Hujan mengetuk atap kios. Menunggu pelanggan berikutnya...'],
          'normal'
        );
      }

      this._syncHUD();
    }

    // =========================================================================
    // KIOSK DEVICES: PHONE & LIGHT SWITCH
    // =========================================================================

    _queuePhoneRing(callObj, delaySec) {
      this._delayedCall = callObj;
      this._phoneDelayTimer = delaySec;
    }

    _startPhoneRinging(callObj) {
      if (!callObj) return;
      this.pendingPhoneCall = callObj;
      this.phoneRinging = true;
      this.phoneRingTimeout = 18;
      this.renderer.state.phoneRinging = true;
      NS.Audio.startPhoneRing();
      this.showToast('Telepon merah berdering! Klik Telepon atau tekan [T] untuk mengangkat.', callObj.creepy ? 'horror' : 'normal');
      this._syncHUD();
    }

    _stopPhoneRinging() {
      this.phoneRinging = false;
      this.pendingPhoneCall = null;
      this.renderer.state.phoneRinging = false;
      NS.Audio.stopPhoneRing();
      this._syncHUD();
    }

    interactPhone() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase === 'intrusion') return;

      if (!this.phoneRinging || !this.pendingPhoneCall) {
        NS.Audio.playUiClick();
        this.showToast('Tidak ada panggilan masuk saat ini. Saluran telepon hanya berdesis pelan.', 'normal');
        return;
      }

      const call = this.pendingPhoneCall;
      this._stopPhoneRinging();

      this.prevPhaseBeforePhone = this.phase;
      this.phase = 'phone_call';
      this.activePhoneCall = call;

      NS.Audio.playPhonePickup(call.creepy);
      if (call.creepy) {
        NS.Audio.playStinger(false);
        this.renderer.triggerFlicker(0.55);
      }

      this.setDialogue(
        call.speaker,
        call.tag,
        call.lines.slice(),
        call.creepy ? 'horror' : 'phone',
        () => {
          if (call.clueId) {
            this.unlockClue(call.clueId);
          }
          this.activePhoneCall = null;
          this.phase = this.prevPhaseBeforePhone;
          if (this.phase === 'waiting') {
            this.nextCustomerTimer = Math.min(this.nextCustomerTimer, 2.2);
            this.setDialogue(
              'Kios Sora Dingin',
              'Sambungan Terputus',
              ['Gagang telepon diletakkan kembali. Keheningan malam kembali menyelimuti kios...'],
              'normal'
            );
          } else if (this.phase === 'customer_present' && this.currentCustomer) {
            const c = this.currentCustomer;
            this.setDialogue(
              `${c.name} — ${c.label}`,
              this.windowOpen ? 'Jendela Terbuka' : 'Di Balik Kaca',
              [c.greeting[c.greeting.length - 1]],
              c.threatLevel === 'climax' ? 'horror' : 'normal'
            );
          }
          this._syncHUD();
        }
      );

      this._syncHUD();
    }

    toggleLight() {
      if (this.screen !== 'gameplay' || this.paused) return;
      NS.Audio.playLightSwitch();

      if (this.lightOut) {
        this.lightOut = false;
        this.renderer.state.lightOut = false;
        this.renderer.triggerFlicker(0.35);
        NS.Audio.playFlickerBuzz();
        this.showToast('Lampu neon kios kembali menyala normal.', 'normal');
        this._syncHUD();
        return;
      }

      this.porchLightOn = !this.porchLightOn;
      this.renderer.state.porchLightOn = this.porchLightOn;
      if (this.porchLightOn) {
        this.renderer.triggerPorchFlash();
      }
      this._syncHUD();
    }

    // =========================================================================
    // RANDOM HORROR EVENTS HANDLER (F-05)
    // =========================================================================

    _handleRandomEvent(eventType) {
      const info = NS.Events.describeEvent(eventType);

      switch (eventType) {
        case 'phantom_knock':
          NS.Audio.playKnock('normal');
          this.renderer.triggerKnockRipple();
          this.showToast(info.toast, 'horror');
          break;

        case 'light_flicker':
          NS.Audio.playFlickerBuzz();
          this.renderer.triggerFlicker(0.85);
          this.showToast(info.toast, 'horror');
          break;

        case 'power_dip':
          NS.Audio.playFlickerBuzz();
          this.lightOut = true;
          this.renderer.state.lightOut = true;
          this.showToast(info.toast, 'horror');
          break;

        case 'distant_silhouette':
          NS.Audio.playStinger(false);
          this.renderer.triggerDistantSilhouette();
          this.showToast(info.toast, 'horror');
          break;

        case 'footsteps_circle':
          NS.Audio.playFootsteps(Math.random() > 0.5 ? 'ltr' : 'rtl');
          this.showToast(info.toast, 'horror');
          break;

        case 'handprint_glass':
          NS.Audio.playStinger(false);
          this.renderer.triggerHandprint();
          this.showToast(info.toast, 'horror');
          break;

        case 'vanishing_glimpse':
          NS.Audio.playFlickerBuzz();
          NS.Audio.playStinger(false);
          this.renderer.triggerVanishingGlimpse();
          this.showToast(info.toast, 'horror');
          break;

        case 'creepy_call':
          this._startPhoneRinging(NS.Dialogue.PHONE_CALLS.random_creepy_breath);
          break;

        default:
          this.showToast(info.toast, 'normal');
      }

      this._syncHUD();
    }

    // =========================================================================
    // DIALOGUE TYPEWRITER ENGINE
    // =========================================================================

    setDialogue(speaker, tag, lines, style, onExhausted) {
      this.dialogueSpeaker = speaker;
      this.dialogueTag = tag;
      this.dialogueStyle = style || 'normal';
      this.dialogueQueue = Array.isArray(lines) ? lines.slice() : [String(lines || '')];
      this.onDialogueExhausted = typeof onExhausted === 'function' ? onExhausted : null;
      this._popNextDialogueLine();
    }

    _popNextDialogueLine() {
      const next = this.dialogueQueue.shift() || '';
      this.currentFullText = next;
      if (this.settings.textSpeed === 'fast') {
        this.displayedChars = next.length;
      } else {
        this.displayedChars = 0;
      }
      this.typeTimer = 0;
      this.ui.renderDialogue(
        this.dialogueSpeaker,
        this.dialogueTag,
        this.currentFullText.slice(0, this.displayedChars),
        this.dialogueStyle,
        this.displayedChars < this.currentFullText.length || this.dialogueQueue.length > 0 || Boolean(this.onDialogueExhausted)
      );
    }

    _updateTypewriter(dt) {
      if (this.displayedChars >= this.currentFullText.length) return;
      const charsPerSec = this.settings.textSpeed === 'slow' ? 28 : 55;
      this.typeTimer += dt * charsPerSec;
      const step = Math.floor(this.typeTimer);
      if (step >= 1) {
        this.typeTimer -= step;
        const prev = this.displayedChars;
        this.displayedChars = Math.min(this.currentFullText.length, this.displayedChars + step);
        if (this.displayedChars > prev && this.displayedChars % 4 === 0) {
          NS.Audio.playTypeBlip(this.dialogueStyle === 'horror' ? 240 : 370);
        }
        const hasMore = this.displayedChars < this.currentFullText.length || this.dialogueQueue.length > 0 || Boolean(this.onDialogueExhausted);
        this.ui.renderDialogue(
          this.dialogueSpeaker,
          this.dialogueTag,
          this.currentFullText.slice(0, this.displayedChars),
          this.dialogueStyle,
          hasMore
        );
      }
    }

    advanceDialogue() {
      if (this.screen !== 'gameplay' || this.paused) return;

      // Finish typing current line instantly first
      if (this.displayedChars < this.currentFullText.length) {
        this.displayedChars = this.currentFullText.length;
        const hasMore = this.dialogueQueue.length > 0 || Boolean(this.onDialogueExhausted);
        this.ui.renderDialogue(
          this.dialogueSpeaker,
          this.dialogueTag,
          this.currentFullText,
          this.dialogueStyle,
          hasMore
        );
        return;
      }

      // Advance to next line in queue
      if (this.dialogueQueue.length > 0) {
        NS.Audio.playUiClick();
        this._popNextDialogueLine();
        return;
      }

      // Trigger exhausted callback (e.g., finishing a phone call or climax)
      if (this.onDialogueExhausted) {
        NS.Audio.playUiClick();
        const cb = this.onDialogueExhausted;
        this.onDialogueExhausted = null;
        cb();
        return;
      }

      // Speed up customer departure wait if player clicks/presses Space after reading parting line
      if (this.phase === 'customer_leaving') {
        this.leavingTimer = 0;
      }
    }

    // =========================================================================
    // SHIFT COMPLETION & ENDINGS (F-06, F-07, F-08)
    // =========================================================================

    _completeShift() {
      NS.Audio.stopPhoneRing();
      NS.Audio.stopHeartbeat();
      NS.Audio.playCashRegister();
      NS.Audio.setTension(0.05);

      this.clockFloat = this.targetEndFloat;
      this.windowOpen = false;
      this.renderer.state.windowTarget = 0;
      this.renderer.state.customerVisible = false;

      // Save progress for next night (if night < 5)
      if (this.night < 5) {
        NS.Save.saveProgress({
          night: this.night + 1,
          totalMoney: this.totalMoney,
          clues: this.clues,
          stats: this.stats
        });
      }

      this.screen = 'summary';
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
      const cluesObj = this.shiftStats.cluesFoundThisNight
        .map((id) => NS.Dialogue.CLUES[id])
        .filter(Boolean);

      this.ui.showScreen('summary');
      this.ui.renderSummary({
        night: this.night,
        title: cfg.title,
        served: this.shiftStats.served,
        threatsRefused: this.shiftStats.threatsRefused,
        incomeText: formatRupiah(this.shiftStats.income),
        totalMoneyText: formatRupiah(this.totalMoney),
        clues: cluesObj,
        note: cfg.summaryNote,
        isFinalNight: this.night >= 5
      });
    }

    proceedNextNight() {
      NS.Audio.playUiClick();
      if (this.night < 5) {
        this.startNight(this.night + 1);
      } else {
        this._triggerEnding('good');
      }
    }

    _triggerEnding(endingKey) {
      NS.Audio.stopPhoneRing();
      NS.Audio.stopHeartbeat();
      this.ui.setDangerBanner(false, 0, 1);

      const ending = NS.Dialogue.ENDINGS[endingKey] || NS.Dialogue.ENDINGS.bad_killed;
      this.screen = 'ending';
      this.paused = false;

      // Unlock ending in persistent meta storage
      this.meta = NS.Save.unlockEnding(ending.type);

      if (ending.type === 'good') {
        this.renderer.state.mode = 'ending_good';
        this.renderer.state.rainIntensity = 0.1;
        this.renderer.state.fogDensity = 0.25;
        NS.Audio.setTension(0.0);
        NS.Audio.playSiren();
        NS.Save.clearProgress();
      } else if (ending.type === 'secret') {
        this.renderer.state.mode = 'ending_secret';
        this.renderer.state.rainIntensity = 0.25;
        NS.Audio.setTension(0.1);
        NS.Audio.playSiren();
        NS.Save.clearProgress();
      } else {
        this.renderer.state.mode = 'ending_bad';
        this.renderer.state.dangerLevel = 0.9;
        NS.Audio.playStinger(true);
        NS.Audio.setTension(0.7);
      }

      this.renderer.state.customerVisible = false;
      this.renderer.state.windowTarget = ending.type === 'bad' ? 0.65 : 0;

      this.ui.showScreen('ending');
      this.ui.renderEnding(ending, {
        nightReached: this.night,
        totalServed: this.stats.totalServed,
        totalThreatsRefused: this.stats.totalThreatsRefused,
        totalMoneyText: formatRupiah(this.totalMoney),
        cluesCount: this.clues.length,
        totalClues: Object.keys(NS.Dialogue.CLUES).length,
        closeCalls: this.stats.closeCalls,
        canRetryNight: ending.type === 'bad'
      });
    }

    retryCurrentNight() {
      NS.Audio.playUiClick();
      this.startNight(this.night);
    }

    // =========================================================================
    // HELPERS & HUD SYNC
    // =========================================================================

    showToast(text, kind) {
      this.toastTimer = 4.6;
      this.ui.showToast(text, kind || 'normal');
    }

    getDiscoveredClueObjects() {
      return this.clues.map((id) => NS.Dialogue.CLUES[id]).filter(Boolean);
    }

    _syncHUD() {
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
      const cust = this.currentCustomer;
      const inCustomer = this.phase === 'customer_present' && Boolean(cust);
      const inIntrusion = this.phase === 'intrusion';
      const inPhone = this.phase === 'phone_call';

      const canServe = inCustomer && this.windowOpen && (cust.threatLevel === 'safe' || cust.threatLevel === 'eerie');
      const canConfront = inCustomer && !this.windowOpen && cust.threatLevel === 'climax' && this.clues.length >= 5;

      this.ui.syncGameplayHUD({
        night: this.night,
        nightTitle: cfg.title,
        clockText: formatClock(this.clockFloat),
        targetClockText: formatClock(this.targetEndFloat),
        moneyText: formatRupiah(this.totalMoney),
        strikes: this.strikes,
        maxStrikes: this.maxStrikes,
        clueCount: this.clues.length,
        muted: this.settings.muted,
        windowOpen: this.windowOpen,
        inIntrusion,
        phoneRinging: this.phoneRinging,
        activePhone: inPhone,
        porchLightOn: this.porchLightOn,
        lightOut: this.lightOut,
        customerProgress: `${Math.min(this.customerIndex + (cust ? 1 : 0), this.schedule.length)} / ${this.schedule.length}`,
        customer: cust,
        inCustomer,
        canObserve: inCustomer && !inIntrusion && !inPhone,
        observeOpen: this.observeOpen && inCustomer,
        observedAspects: this.observedAspects,
        canRefuse: inCustomer && !inIntrusion && !inPhone,
        canConfront,
        canServe,
        cupScoops: this.cupScoops,
        orderPriceText: cust && cust.order && cust.order.length > 0 ? formatRupiah(NS.Customers.calcOrderPrice(cust.order)) : '—'
      });
    }
  }

  NS.Game = NightShiftGame;
})(window);
