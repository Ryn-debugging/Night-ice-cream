/* ==========================================================================
   NIGHT SHIFT: ICE CREAM v2.0.0 — Core Game State Machine
   Orchestrates 10 nights, composure (Ketenangan), coffee refills, toppings,
   CCTV Halte check, reinforced deadbolt lock, latch-rattle defense, kiosk
   upgrade shop, 14 clues, Night 5 mid-climax, Night 10 true climax, and
   5 ending outcomes.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});
  const MAX_NIGHTS = 10;
  const SECRET_CLUE_THRESHOLD = 9;
  const COFFEE_REFILL_COST = 25000;

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
      this.modalLocked = false;
      this.introIndex = 0;

      // Persistent 10-night run progress
      this.night = 1;
      this.totalMoney = 0;
      this.clues = [];
      this.upgrades = {
        halogen: false,
        reinforcedGlass: false,
        stabilizer: false,
        coffeeThermos: false
      };
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

      // Kiosk interactive state
      this.windowOpen = false;
      this.deadboltLocked = false;
      this.porchLightOn = true;
      this.lightOut = false;
      this.cctvActive = false;
      this.cctvTimer = 0;
      this.reinforcedGuardUsed = false;

      // Composure / Sanity & Coffee
      this.sanity = 100;
      this.freeCoffeeLeft = 0;

      // Cup builder (flavors + v2.0 topping)
      this.cupScoops = [];
      this.cupTopping = null;

      this.strikes = 0;
      this.maxStrikes = 3;

      this.shiftStats = {
        served: 0,
        threatsRefused: 0,
        wrongOrders: 0,
        income: 0,
        cluesFoundThisNight: []
      };

      // Timers
      this.clockFloat = 23.0;
      this.targetEndFloat = 28.0;
      this.nextCustomerTimer = 3.5;
      this.leavingTimer = 0;
      this.customerWaitTimer = 0;
      this.impatientWarned = false;

      // Intrusion & latch rattle defense
      this.intrusionTimeLeft = 0;
      this.intrusionDuration = 3.6;
      this.latchThreatTimer = 0;

      // Phone state
      this.pendingPhoneCall = null;
      this.phoneRinging = false;
      this.phoneRingTimeout = 0;
      this.activePhoneCall = null;
      this.scheduledMidNightCallTriggered = false;
      this._delayedCall = null;
      this._phoneDelayTimer = 0;

      // Dialogue typewriter queue
      this.dialogueSpeaker = 'Kios Sora Dingin';
      this.dialogueTag = 'Shift Malam';
      this.dialogueStyle = 'normal';
      this.dialogueQueue = [];
      this.currentFullText = '';
      this.displayedChars = 0;
      this.typeTimer = 0;
      this.onDialogueExhausted = null;

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

      const rs = this.renderer.state;
      rs.mode = 'menu';
      rs.customer = null;
      rs.customerVisible = false;
      rs.windowTarget = 0;
      rs.deadboltLocked = false;
      rs.cctvActive = false;
      rs.dangerLevel = 0;
      rs.phoneRinging = false;
      rs.lightOut = false;
      rs.cupScoops = [];
      rs.cupTopping = null;
      rs.sanity = 100;
      rs.rainIntensity = 0.55;
      rs.fogDensity = 0.38;

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
      this.upgrades = {
        halogen: false,
        reinforcedGlass: false,
        stabilizer: false,
        coffeeThermos: false
      };
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
      this.upgrades = Object.assign({
        halogen: false,
        reinforcedGlass: false,
        stabilizer: false,
        coffeeThermos: false
      }, saved.upgrades || {});
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
    // NIGHT INITIALIZATION (NIGHTS 1..10)
    // =========================================================================

    startNight(nightNumber) {
      this.night = Math.max(1, Math.min(MAX_NIGHTS, nightNumber));
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night] || NS.Dialogue.NIGHT_CONFIGS[1];

      this.paused = false;
      this.screen = 'gameplay';
      this.phase = 'waiting';
      this.schedule = NS.Customers.getScheduleForNight(this.night).slice();
      this.customerIndex = 0;
      this.currentCustomer = null;
      this.observedAspects = { face: false, clothes: false, probe: false };
      this.observeOpen = false;

      this.windowOpen = false;
      this.deadboltLocked = false;
      this.porchLightOn = true;
      this.lightOut = false;
      this.cctvActive = false;
      this.cctvTimer = 0;
      this.reinforcedGuardUsed = false;

      this.sanity = 100;
      this.freeCoffeeLeft = this.upgrades.coffeeThermos ? 2 : (this.night >= 4 ? 1 : 0);

      this.cupScoops = [];
      this.cupTopping = null;
      this.strikes = 0;

      this.shiftStats = {
        served: 0,
        threatsRefused: 0,
        wrongOrders: 0,
        income: 0,
        cluesFoundThisNight: []
      };

      this.clockFloat = cfg.startHour;
      this.targetEndFloat = cfg.endHour < cfg.startHour ? cfg.endHour + 24 : cfg.endHour;

      this.pendingPhoneCall = null;
      this.phoneRinging = false;
      this.phoneRingTimeout = 0;
      this.activePhoneCall = null;
      this.scheduledMidNightCallTriggered = false;
      this._delayedCall = null;
      this._phoneDelayTimer = 0;

      this.intrusionTimeLeft = 0;
      this.latchThreatTimer = 0;
      this.leavingTimer = 0;
      this.customerWaitTimer = 0;
      this.impatientWarned = false;
      this.nextCustomerTimer = 5.0;

      NS.Events.resetForNight(this.night);
      NS.Audio.startAmbience(this.night);
      NS.Audio.stopPhoneRing();
      NS.Audio.stopHeartbeat();
      NS.Audio.setWindowMuffle(false);
      NS.Audio.setTension(cfg.ambientTension);

      const rs = this.renderer.state;
      rs.mode = 'gameplay';
      rs.night = this.night;
      rs.rainIntensity = cfg.rainIntensity;
      rs.fogDensity = cfg.fogDensity;
      rs.windowTarget = 0;
      rs.windowSlide = 0;
      rs.deadboltLocked = false;
      rs.cctvActive = false;
      rs.porchLightOn = true;
      rs.halogenUpgrade = Boolean(this.upgrades.halogen);
      rs.lightOut = false;
      rs.phoneRinging = false;
      rs.customer = null;
      rs.customerVisible = false;
      rs.customerAlpha = 0;
      rs.customerLunge = 0;
      rs.dangerLevel = 0;
      rs.sanity = 100;
      rs.handprintAlpha = 0;
      rs.vanishingAlpha = 0;
      rs.latchRattleTimer = 0;
      rs.thunderAlpha = 0;
      rs.cupScoops = [];
      rs.cupTopping = null;

      this.ui.showScreen('gameplay');
      this.toastTimer = 0;
      this.ui.hideToast();
      this.ui.setDangerBanner(false, 0, 1);

      this.setDialogue(
        `Malam ${this.night} / ${MAX_NIGHTS} — ${cfg.title}`,
        'Awal Shift',
        [cfg.introNote],
        'normal'
      );

      const introCallMap = {
        1: 'night1_boss',
        2: 'night2_boss',
        3: 'night3_boss',
        4: 'night4_warning',
        5: 'night5_police',
        6: 'night6_boss',
        7: 'night7_storm',
        8: 'night8_tape',
        9: 'night9_police',
        10: 'night10_police'
      };
      const openingCallId = introCallMap[this.night];
      if (openingCallId && NS.Dialogue.PHONE_CALLS[openingCallId]) {
        this._queuePhoneRing(NS.Dialogue.PHONE_CALLS[openingCallId], 1.8);
        this.nextCustomerTimer = 8.0;
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

      // Toast decay
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) {
          this.ui.hideToast();
        }
      }

      // CCTV auto-close timer
      if (this.cctvActive) {
        this.cctvTimer -= dt;
        if (this.cctvTimer <= 0) {
          this.cctvActive = false;
          this.renderer.state.cctvActive = false;
          this._syncHUD();
        }
      }

      // Passive sanity drain during unfixed power outage
      if (this.lightOut && this.phase !== 'intrusion') {
        const drainRate = this.upgrades.stabilizer ? 0.9 : 1.9;
        this._adjustSanity(-drainRate * dt, true);
        if (this.screen !== 'gameplay') return;
      }

      // Latch rattle active threat timer (Nights 6-10)
      if (this.latchThreatTimer > 0) {
        this.latchThreatTimer -= dt;
        if (this.deadboltLocked) {
          this.latchThreatTimer = 0;
          this.renderer.state.latchRattleTimer = 0;
          this.showToast('Kunci Ganda menahan paksa jendela dari luar! Suara langkah menjauh.', 'clue');
          this._syncHUD();
        } else if (this.latchThreatTimer <= 0) {
          this.renderer.state.latchRattleTimer = 0;
          this.showToast('Grendel kaca nyaris terlepas! Tekanan mental meningkat tajam!', 'horror');
          this._adjustSanity(-18, false);
          if (this.screen !== 'gameplay') return;
          this.renderer.triggerCameraShake(10);
          NS.Audio.playStinger(true);
        }
      }

      this._updateTypewriter(dt);

      // Delayed opening phone call
      if (this._phoneDelayTimer > 0) {
        this._phoneDelayTimer -= dt;
        if (this._phoneDelayTimer <= 0 && this._delayedCall) {
          const call = this._delayedCall;
          this._delayedCall = null;
          this._startPhoneRinging(call);
        }
      }

      // Phone ring auto-timeout
      if (this.phoneRinging) {
        this.phoneRingTimeout -= dt;
        if (this.phoneRingTimeout <= 0) {
          this._stopPhoneRinging();
          this.showToast('Telepon berhenti berdering.', 'normal');
        }
      }

      // Clock progression
      const totalCust = Math.max(1, this.schedule.length);
      const span = this.targetEndFloat - 23.0;
      const targetMilestone = 23.0 + (this.customerIndex / totalCust) * span;
      if (this.clockFloat < targetMilestone) {
        this.clockFloat = Math.min(targetMilestone, this.clockFloat + dt * 0.14);
      } else if (this.phase === 'waiting' || this.phase === 'customer_present') {
        const softCap = Math.min(this.targetEndFloat - 0.08, 23.0 + ((this.customerIndex + 0.85) / totalCust) * span);
        if (this.clockFloat < softCap) {
          this.clockFloat += dt * 0.012;
        }
      }
      this.ui.updateClock(formatClock(this.clockFloat), formatClock(this.targetEndFloat));

      // Phase-specific timers
      if (this.phase === 'waiting') {
        if (!this.phoneRinging) {
          this.nextCustomerTimer -= dt;
          if (this.nextCustomerTimer <= 0) {
            this._spawnNextCustomer();
          }
        }
      } else if (this.phase === 'customer_present' && this.currentCustomer) {
        // Subtle Patience System for innocent customers on Nights 3-10
        if (this.night >= 3 && this.currentCustomer.threatLevel === 'safe') {
          const mult = this.deadboltLocked ? 1.35 : 1.0;
          this.customerWaitTimer += dt * mult;
          if (this.customerWaitTimer > 28 && !this.impatientWarned) {
            this.impatientWarned = true;
            this.showToast(`${this.currentCustomer.name} tampak mulai tidak sabar menunggu di tengah hujan...`, 'normal');
          } else if (this.customerWaitTimer > 46) {
            this._handleCustomerImpatientLeave();
            return;
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

      // Random horror events
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
    // COMPOSURE (KETENANGAN) & COFFEE REFILLS
    // =========================================================================

    _adjustSanity(delta, silentHud) {
      const prev = Math.round(this.sanity);
      this.sanity = Math.max(0, Math.min(100, this.sanity + delta));
      this.renderer.state.sanity = this.sanity;

      if (this.sanity <= 0) {
        this._triggerEnding('bad_panic');
        return;
      }

      if (!silentHud || Math.round(this.sanity) !== prev) {
        this.ui.updateSanity(Math.round(this.sanity));
      }
    }

    drinkCoffee() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase === 'intrusion') return;

      if (this.sanity >= 96) {
        NS.Audio.playUiClick();
        this.showToast('Ketenanganmu masih penuh. Simpan kopi untuk saat genting.', 'normal');
        return;
      }

      if (this.freeCoffeeLeft > 0) {
        this.freeCoffeeLeft -= 1;
        NS.Audio.playCoffeeSip();
        this._adjustSanity(32, false);
        this.showToast(`Meneguk Kopi Hangat gratis (+32% Ketenangan). Sisa gratis: ${this.freeCoffeeLeft}`, 'clue');
        this._syncHUD();
        return;
      }

      if (this.totalMoney < COFFEE_REFILL_COST) {
        NS.Audio.playErrorOrder();
        this.showToast(`Kas belum cukup untuk seduh Kopi Hangat (${formatRupiah(COFFEE_REFILL_COST)}).`, 'horror');
        return;
      }

      this.totalMoney -= COFFEE_REFILL_COST;
      NS.Audio.playCoffeeSip();
      this._adjustSanity(32, false);
      this.showToast(`Menyeduh Kopi Hangat (-${formatRupiah(COFFEE_REFILL_COST)}, +32% Ketenangan).`, 'clue');
      this._syncHUD();
    }

    // =========================================================================
    // CCTV HALTE [V] & REINFORCED DEADBOLT [L]
    // =========================================================================

    toggleCctv() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase === 'intrusion') return;

      this.cctvActive = !this.cctvActive;
      this.renderer.state.cctvActive = this.cctvActive;
      NS.Audio.playCctvToggle(this.cctvActive);

      if (this.cctvActive) {
        this.cctvTimer = 5.0;
        if (this.currentCustomer && this.phase === 'customer_present') {
          const note = this.currentCustomer.cctvNote || 'CCTV Halte: Tidak terlihat anomali jelas di kejauhan.';
          this.setDialogue(
            `CCTV Halte — ${this.currentCustomer.name}`,
            'CAM-01 NIGHT VISION',
            [note],
            'observation'
          );
          if (this.currentCustomer.cctvClueId) {
            this.unlockClue(this.currentCustomer.cctvClueId);
          }
        } else {
          const msg = this.renderer.state.distantSilhouette.active
            ? 'CCTV Halte: PERINGATAN! Terdeteksi sosok berdiri diam di dekat tiang lampu halte!'
            : 'CCTV Halte: Jalan Melati dan halte tua tampak sepi di bawah hujan.';
          this.showToast(msg, this.renderer.state.distantSilhouette.active ? 'horror' : 'normal');
        }
      }
      this._syncHUD();
    }

    toggleDeadbolt() {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase === 'intrusion') {
        this._slamWindowInIntrusion();
        return;
      }

      if (this.windowOpen) {
        // Close window AND engage deadbolt immediately for snappy defense!
        this.windowOpen = false;
        this.renderer.state.windowTarget = 0;
        this.deadboltLocked = true;
        this.renderer.state.deadboltLocked = true;
        this.cupScoops = [];
        this.cupTopping = null;
        this.renderer.state.cupScoops = [];
        this.renderer.state.cupTopping = null;
        NS.Audio.playWindowSlide(false, false);
        NS.Audio.playDeadbolt(true);
        this.showToast('Jendela ditutup dan Kunci Ganda diaktifkan.', 'normal');
        this._syncHUD();
        return;
      }

      this.deadboltLocked = !this.deadboltLocked;
      this.renderer.state.deadboltLocked = this.deadboltLocked;
      NS.Audio.playDeadbolt(this.deadboltLocked);

      if (this.deadboltLocked && this.latchThreatTimer > 0) {
        this.latchThreatTimer = 0;
        this.renderer.state.latchRattleTimer = 0;
        this.showToast('Kunci Ganda menahan paksa jendela dari luar! Kamu aman!', 'clue');
      } else {
        this.showToast(
          this.deadboltLocked
            ? 'Kunci Ganda AKTIF — jendela tidak bisa dibuka atau digeser paksa.'
            : 'Kunci Ganda dilepas.',
          'normal'
        );
      }
      this._syncHUD();
    }

    // =========================================================================
    // CUSTOMER LIFECYCLE
    // =========================================================================

    _spawnNextCustomer() {
      // Mid-night special creepy phone call on Night 3
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
      this.customerWaitTimer = 0;
      this.impatientWarned = false;
      this.cupScoops = [];
      this.cupTopping = null;
      this.renderer.state.cupScoops = [];
      this.renderer.state.cupTopping = null;

      if (cust.threatLevel === 'climax' || cust.threatLevel === 'mid_climax') {
        this.clockFloat = Math.max(this.clockFloat, 27.0); // 03:00
        NS.Audio.setTension(0.95);
        NS.Audio.playStinger(true);
      } else if (cust.threatLevel === 'danger' || cust.threatLevel === 'eerie') {
        const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
        NS.Audio.setTension(Math.min(0.88, cfg.ambientTension + 0.3));
      } else {
        const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
        NS.Audio.setTension(cfg.ambientTension);
      }

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

      if (this.windowOpen && (cust.threatLevel === 'danger' || cust.threatLevel === 'mid_climax')) {
        this.showToast('Jendela masih terbuka saat sosok berbahaya mendekat!', 'horror');
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
        cust.threatLevel === 'climax' || cust.threatLevel === 'mid_climax' ? 'horror' : 'normal'
      );

      this._syncHUD();
    }

    _handleCustomerImpatientLeave() {
      const cust = this.currentCustomer;
      if (!cust) return;

      this.strikes += 1;
      this.stats.totalInnocentRefused += 1;
      NS.Audio.playErrorOrder();
      this.showToast(`${cust.name} pergi karena menunggu terlalu lama! Teguran Bos: ${this.strikes}/${this.maxStrikes}`, 'horror');

      if (this.strikes >= this.maxStrikes) {
        this.phase = 'customer_leaving';
        this.leavingTimer = 2.2;
        this.setDialogue(cust.name, 'Pergi Kecewa', ['Lama sekali sih pelayanannya! Saya pergi saja!'], 'horror', () => {
          this._triggerEnding('bad_fired');
        });
        this._syncHUD();
        return;
      }

      this.phase = 'customer_leaving';
      this.leavingTimer = 2.0;
      this.setDialogue(cust.name, 'Menunggu Terlalu Lama', ['Aduh kelamaan nunggu di tengah hujan, saya balik saja deh Mas!'], 'normal');
      this._syncHUD();
    }

    // =========================================================================
    // WINDOW MECHANIC (F-02)
    // =========================================================================

    toggleWindow() {
      if (this.screen !== 'gameplay' || this.paused) return;

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
        this.cupTopping = null;
        this.renderer.state.cupScoops = [];
        this.renderer.state.cupTopping = null;
        this._syncHUD();
        return;
      }

      // Guard against accidental opening while Deadbolt is engaged!
      if (this.deadboltLocked) {
        NS.Audio.playDeadbolt(true);
        this.showToast('Kunci Ganda aktif! Tekan Kunci Ganda [L] untuk melepas kunci sebelum membuka kaca.', 'normal');
        return;
      }

      this.windowOpen = true;
      this.observeOpen = false;
      this.cctvActive = false;
      this.renderer.state.cctvActive = false;
      this.renderer.state.windowTarget = 1;
      NS.Audio.playWindowSlide(true, false);

      if (this.phase === 'customer_present' && this.currentCustomer) {
        const cust = this.currentCustomer;
        if (cust.threatLevel === 'danger' || cust.threatLevel === 'mid_climax') {
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
        this.showToast(`Jendela dibuka. Siapkan: ${cust.orderText}`, 'normal');
      } else {
        this.showToast('Jendela terbuka sementara tidak ada pelanggan. Sebaiknya tutup kembali.', 'horror');
      }

      this._syncHUD();
    }

    _triggerIntrusion(cust) {
      this.phase = 'intrusion';
      this.observeOpen = false;
      this.cctvActive = false;
      this.renderer.state.cctvActive = false;

      const baseDur = Math.max(2.6, 3.85 - (this.night - 2) * 0.14);
      const halogenBonus = this.upgrades.halogen ? 0.9 : 0;
      this.intrusionDuration = baseDur + halogenBonus;
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

      const sanityHit = this.upgrades.halogen ? -10 : -18;
      this._adjustSanity(sanityHit, false);
      if (this.screen !== 'gameplay') return;

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
      this.showToast(`Berhasil membanting tutup jendela tepat waktu! (${sanityHit}% Ketenangan)`, 'clue');
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
        this.renderer.triggerPorchFlash();
        NS.Audio.playLightSwitch();
        const probeObj = cust.observations.probe;
        text = typeof probeObj === 'string' ? probeObj : probeObj.text;
        clueId = typeof probeObj === 'object' ? probeObj.clueId : null;
      } else {
        text = cust.observations[aspect];
        if (aspect === 'clothes' && cust.id === 'n2_budi_threat') clueId = 'clue_dry_coat';
        if (aspect === 'clothes' && cust.id === 'n4_inspector_threat') clueId = 'clue_inspector_lie';
        if (aspect === 'clothes' && cust.id === 'n5_arman_mid') clueId = 'clue_locker_key';
        if (aspect === 'clothes' && cust.id === 'n6_uniform_threat') clueId = 'clue_missing_uniform';
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
      this.showToast(`Petunjuk Baru Dicatat: "${clue.title}"`, 'clue');
      this.ui.pulseClueButton();
      this._syncHUD();
      return true;
    }

    // =========================================================================
    // REFUSE SERVICE & NIGHT 10 SECRET CONFRONTATION
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

      // Night 10 True Climax: Refusing Arman securely survives until 05:00 dawn -> GOOD ENDING!
      if (cust.threatLevel === 'climax') {
        this.phase = 'customer_leaving';
        this.renderer.state.customerVisible = false;
        this.setDialogue(
          'Jendela Terkunci Hingga Pagi',
          'Malam 10 — 05:00',
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

      // Night 5 Mid-Climax: Police patrol drives Arman away & he drops Dimas's locker key!
      if (cust.threatLevel === 'mid_climax') {
        this.shiftStats.threatsRefused += 1;
        this.stats.totalThreatsRefused += 1;
        NS.Audio.playSiren();
        if (cust.clueOnRefuse) {
          this.unlockClue(cust.clueOnRefuse);
        }
        this.phase = 'customer_leaving';
        this.leavingTimer = 3.0;
        this.setDialogue(
          'Patroli Melintas — Babak 1 Berakhir',
          'Malam 5 — 03:10',
          [cust.refuseResponse],
          'observation'
        );
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
      if (this.windowOpen || this.clues.length < SECRET_CLUE_THRESHOLD) return;

      this.observeOpen = false;
      this.deadboltLocked = true;
      this.renderer.state.deadboltLocked = true;
      NS.Audio.playDeadbolt(true);
      NS.Audio.playPhonePickup(false);
      NS.Audio.playSiren();
      this.renderer.triggerPorchFlash();
      this.renderer.state.mode = 'ending_secret';

      this.phase = 'customer_leaving';
      this.leavingTimer = 3.8;
      this.setDialogue(
        'Raka (Melalui Kaca Terkunci Ganda)',
        'Operasi Penyergapan 03:00',
        [
          '"Berhenti di situ, Arman! Mantan penjaga halte Melati—catatan Dimas, seragam curianmu, rekaman suara di ruang genset halte, semua sudah kuserahkan ke Bripka Danu barusan!"',
          'Wajah dingin di balik kaca akhirnya pecah oleh kepanikan. Dari balik kabut tebal Jalan Melati, dua mobil tim sergap polisi meluncur dengan kilatan lampu biru-merah mengepung kios!'
        ],
        'observation',
        () => {
          this._triggerEnding('secret');
        }
      );
      this._syncHUD();
    }

    // =========================================================================
    // ICE CREAM SCOOPS & TOPPINGS (F-03 + v2.0)
    // =========================================================================

    addScoop(flavorId) {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.windowOpen || !this.currentCustomer) return;
      if (!NS.Customers.FLAVORS[flavorId]) return;

      const maxScoops = Math.max(2, this.currentCustomer.order.length || 1);
      if (this.cupScoops.length >= maxScoops) {
        this.showToast(`Gelas sudah penuh (${maxScoops} scoop). Pilih topping atau tekan Serahkan.`, 'normal');
        return;
      }

      this.cupScoops.push(flavorId);
      this.renderer.state.cupScoops = this.cupScoops.slice();
      NS.Audio.playScoop();
      this._syncHUD();
    }

    selectTopping(toppingId) {
      if (this.screen !== 'gameplay' || this.paused) return;
      if (this.phase !== 'customer_present' || !this.windowOpen || !this.currentCustomer) return;
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night];
      if (!cfg || !cfg.toppingsUnlocked) return;
      if (!NS.Customers.TOPPINGS[toppingId]) return;

      this.cupTopping = this.cupTopping === toppingId ? null : toppingId;
      this.renderer.state.cupTopping = this.cupTopping;
      NS.Audio.playScoop();
      this._syncHUD();
    }

    clearCup() {
      if (this.screen !== 'gameplay' || this.paused) return;
      this.cupScoops = [];
      this.cupTopping = null;
      this.renderer.state.cupScoops = [];
      this.renderer.state.cupTopping = null;
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
      const flavorsMatch = expected.length === actual.length && expected.every((v, i) => v === actual[i]);
      const expectedTopping = cust.topping || null;
      const toppingMatch = expectedTopping === (this.cupTopping || null);
      const isExact = flavorsMatch && toppingMatch;

      const fullPrice = NS.Customers.calcOrderPrice(cust.order, expectedTopping);
      let earned = 0;

      if (isExact) {
        earned = fullPrice;
        NS.Audio.playCashRegister();
        this._adjustSanity(8, false);
        this.showToast(`Pesanan sempurna! +${formatRupiah(earned)} (+8% Ketenangan)`, 'clue');
      } else if (flavorsMatch && !toppingMatch) {
        earned = Math.floor(fullPrice * 0.7);
        this.shiftStats.wrongOrders += 1;
        this.stats.totalWrongOrders += 1;
        NS.Audio.playErrorOrder();
        this.showToast(`Rasa benar, tapi topping keliru! (+${formatRupiah(earned)})`, 'horror');
      } else {
        const anyMatch = actual.some((f) => expected.includes(f));
        earned = anyMatch && expected.length > 1 ? Math.floor(fullPrice * 0.5) : 0;
        this.shiftStats.wrongOrders += 1;
        this.stats.totalWrongOrders += 1;
        NS.Audio.playErrorOrder();
        this.showToast(
          earned > 0
            ? `Pesanan kurang tepat! (+${formatRupiah(earned)})`
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
      this.cupTopping = null;
      this.renderer.state.cupScoops = [];
      this.renderer.state.cupTopping = null;
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
      this.nextCustomerTimer = 3.6 + Math.random() * 2.0;

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
        this._adjustSanity(-9, false);
        if (this.screen !== 'gameplay') return;
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
        this.porchLightOn = true;
        this.renderer.state.lightOut = false;
        this.renderer.state.porchLightOn = true;
        this.renderer.triggerFlicker(0.35);
        NS.Audio.playFlickerBuzz();
        this.showToast('Listrik & lampu neon kios kembali menyala normal.', 'normal');
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
    // RANDOM HORROR EVENTS HANDLER (F-05 + v2.0)
    // =========================================================================

    _handleRandomEvent(eventType) {
      const info = NS.Events.describeEvent(eventType);

      if (info.sanityDelta) {
        const mult = info.lightBased && this.upgrades.stabilizer ? 0.5 : 1.0;
        this._adjustSanity(info.sanityDelta * mult, false);
        if (this.screen !== 'gameplay') return;
      }

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

        case 'power_blackout':
          NS.Audio.playThunder();
          NS.Audio.playFlickerBuzz();
          this.lightOut = true;
          this.porchLightOn = false;
          this.renderer.state.lightOut = true;
          this.renderer.state.porchLightOn = false;
          this.renderer.triggerCameraShake(7);
          this.showToast(info.toast, 'horror');
          break;

        case 'thunder_flash':
          NS.Audio.playThunder();
          this.renderer.triggerThunder();
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

        case 'vent_whisper':
          NS.Audio.playStinger(false);
          this.renderer.triggerFlicker(0.45);
          this.showToast(info.toast, 'horror');
          break;

        case 'latch_rattle':
          NS.Audio.playLatchRattle();
          this.renderer.triggerLatchRattle(2.2);
          if (this.deadboltLocked) {
            this.showToast('KREK! Seseorang mengguncang kaca, tapi Kunci Ganda menahannya kokoh!', 'clue');
          } else if (this.upgrades.reinforcedGlass && !this.reinforcedGuardUsed) {
            this.reinforcedGuardUsed = true;
            this.showToast('KREK! Rel Baja Anti-Pecah otomatis menahan guncangan jendela dari luar!', 'clue');
          } else {
            this.latchThreatTimer = 4.2;
            this.showToast(info.toast, 'horror');
          }
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
      this.displayedChars = this.settings.textSpeed === 'fast' ? next.length : 0;
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

      if (this.dialogueQueue.length > 0) {
        NS.Audio.playUiClick();
        this._popNextDialogueLine();
        return;
      }

      if (this.onDialogueExhausted) {
        NS.Audio.playUiClick();
        const cb = this.onDialogueExhausted;
        this.onDialogueExhausted = null;
        cb();
        return;
      }

      if (this.phase === 'customer_leaving') {
        this.leavingTimer = 0;
      }
    }

    // =========================================================================
    // SHIFT COMPLETION, UPGRADE SHOP & ENDINGS
    // =========================================================================

    _completeShift() {
      NS.Audio.stopPhoneRing();
      NS.Audio.stopHeartbeat();
      NS.Audio.playCashRegister();
      NS.Audio.setTension(0.05);

      this.clockFloat = this.targetEndFloat;
      this.windowOpen = false;
      this.deadboltLocked = false;
      this.cctvActive = false;
      this.renderer.state.windowTarget = 0;
      this.renderer.state.deadboltLocked = false;
      this.renderer.state.cctvActive = false;
      this.renderer.state.customerVisible = false;

      if (this.night < MAX_NIGHTS) {
        NS.Save.saveProgress({
          night: this.night + 1,
          totalMoney: this.totalMoney,
          clues: this.clues,
          upgrades: this.upgrades,
          stats: this.stats
        });
      }

      this.screen = 'summary';
      this._renderCurrentSummary();
      this.ui.showScreen('summary');
    }

    _renderCurrentSummary() {
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night] || NS.Dialogue.NIGHT_CONFIGS[1];
      const cluesObj = this.shiftStats.cluesFoundThisNight
        .map((id) => NS.Dialogue.CLUES[id])
        .filter(Boolean);

      this.ui.renderSummary({
        night: this.night,
        maxNights: MAX_NIGHTS,
        title: cfg.title,
        served: this.shiftStats.served,
        threatsRefused: this.shiftStats.threatsRefused,
        incomeText: formatRupiah(this.shiftStats.income),
        totalMoney: this.totalMoney,
        totalMoneyText: formatRupiah(this.totalMoney),
        clues: cluesObj,
        upgrades: this.upgrades,
        upgradeCatalog: NS.Dialogue.UPGRADES,
        note: cfg.summaryNote,
        isFinalNight: this.night >= MAX_NIGHTS
      });
    }

    buyUpgrade(upgradeId) {
      if (this.screen !== 'summary') return false;
      const item = NS.Dialogue.UPGRADES[upgradeId];
      if (!item || this.upgrades[upgradeId]) return false;
      if (this.totalMoney < item.price) {
        NS.Audio.playErrorOrder();
        return false;
      }

      this.totalMoney -= item.price;
      this.upgrades[upgradeId] = true;
      NS.Audio.playUpgradeBuy();

      if (this.night < MAX_NIGHTS) {
        NS.Save.saveProgress({
          night: this.night + 1,
          totalMoney: this.totalMoney,
          clues: this.clues,
          upgrades: this.upgrades,
          stats: this.stats
        });
      }
      this._renderCurrentSummary();
      return true;
    }

    proceedNextNight() {
      NS.Audio.playUiClick();
      if (this.night < MAX_NIGHTS) {
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
      this.renderer.state.cctvActive = false;
      this.renderer.state.windowTarget = ending.type === 'bad' ? 0.65 : 0;

      this.ui.showScreen('ending');
      this.ui.renderEnding(ending, {
        nightReached: this.night,
        maxNights: MAX_NIGHTS,
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
      const cfg = NS.Dialogue.NIGHT_CONFIGS[this.night] || NS.Dialogue.NIGHT_CONFIGS[1];
      const cust = this.currentCustomer;
      const inCustomer = this.phase === 'customer_present' && Boolean(cust);
      const inIntrusion = this.phase === 'intrusion';
      const inPhone = this.phase === 'phone_call';

      const canServe = inCustomer && this.windowOpen && (cust.threatLevel === 'safe' || cust.threatLevel === 'eerie');
      const canConfront = inCustomer && !this.windowOpen && cust.threatLevel === 'climax' && this.clues.length >= SECRET_CLUE_THRESHOLD;

      this.ui.syncGameplayHUD({
        night: this.night,
        maxNights: MAX_NIGHTS,
        nightTitle: cfg.title,
        toppingsUnlocked: Boolean(cfg.toppingsUnlocked),
        clockText: formatClock(this.clockFloat),
        targetClockText: formatClock(this.targetEndFloat),
        moneyText: formatRupiah(this.totalMoney),
        sanity: Math.round(this.sanity),
        freeCoffeeLeft: this.freeCoffeeLeft,
        coffeeCostText: this.freeCoffeeLeft > 0 ? `Gratis (${this.freeCoffeeLeft})` : 'Rp 25k',
        strikes: this.strikes,
        maxStrikes: this.maxStrikes,
        clueCount: this.clues.length,
        muted: this.settings.muted,
        windowOpen: this.windowOpen,
        deadboltLocked: this.deadboltLocked,
        latchRattleActive: this.latchThreatTimer > 0,
        cctvActive: this.cctvActive,
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
        cupTopping: this.cupTopping,
        orderPriceText: cust && cust.order && cust.order.length > 0 ? formatRupiah(NS.Customers.calcOrderPrice(cust.order, cust.topping)) : '—'
      });
    }
  }

  NS.Game = NightShiftGame;
  NS.MAX_NIGHTS = MAX_NIGHTS;
  NS.SECRET_CLUE_THRESHOLD = SECRET_CLUE_THRESHOLD;
})(window);
