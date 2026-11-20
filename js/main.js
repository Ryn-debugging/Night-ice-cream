/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — Main Bootstrap, DOM UI Binding & Input Controller
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  function $(id) {
    return document.getElementById(id);
  }

  function initApp() {
    const canvas = $('game-canvas');
    const renderer = new NS.Renderer(canvas);

    // Cached DOM references
    const screens = {
      menu: $('screen-menu'),
      intro: $('screen-intro'),
      gameplay: $('screen-gameplay'),
      summary: $('screen-summary'),
      ending: $('screen-ending')
    };

    const modalBackdrop = $('modal-backdrop');
    const modals = {
      'modal-settings': $('modal-settings'),
      'modal-credits': $('modal-credits'),
      'modal-pause': $('modal-pause'),
      'modal-clues': $('modal-clues')
    };

    let activeModalId = null;
    let gameRef = null;

    function openModal(id) {
      if (!modals[id]) return;
      closeAllModals();
      activeModalId = id;
      modalBackdrop.classList.remove('hidden');
      modals[id].setAttribute('open', 'open');
      if (gameRef) gameRef.modalLocked = true;
    }

    function closeAllModals() {
      Object.values(modals).forEach((m) => m.removeAttribute('open'));
      modalBackdrop.classList.add('hidden');
      activeModalId = null;
      if (gameRef) gameRef.modalLocked = false;
    }

    // UI Hooks passed to NightShiftGame
    const uiHooks = {
      showScreen(name) {
        Object.keys(screens).forEach((k) => {
          screens[k].classList.toggle('active', k === name);
        });
      },

      updateMenu(saved, meta) {
        const btnContinue = $('btn-continue');
        const continueMeta = $('continue-meta');
        if (saved) {
          btnContinue.classList.remove('hidden');
          continueMeta.textContent = `Malam ${saved.night} · ${saved.clues.length} Petunjuk`;
        } else {
          btnContinue.classList.add('hidden');
        }

        const endings = (meta && meta.endings) || {};
        $('badge-ending-good').className = 'ending-dot' + (endings.good ? ' unlocked-good' : '');
        $('badge-ending-bad').className = 'ending-dot' + (endings.bad ? ' unlocked-bad' : '');
        $('badge-ending-secret').className = 'ending-dot' + (endings.secret ? ' unlocked-secret' : '');
      },

      renderIntroStep(index, steps) {
        const step = steps[index] || steps[0];
        $('intro-heading').textContent = step.heading;
        const container = $('intro-story');
        container.innerHTML = '';
        step.paragraphs.forEach((txt) => {
          const p = document.createElement('p');
          p.textContent = txt;
          container.appendChild(p);
        });
        if (step.whisper) {
          const w = document.createElement('p');
          w.className = 'story-whisper';
          w.textContent = step.whisper;
          container.appendChild(w);
        }
        $('btn-intro-next').textContent = index < steps.length - 1 ? 'Lanjut' : 'Mulai Shift Malam 1';
      },

      updateClock(clockText, targetText) {
        $('hud-clock').textContent = clockText;
        $('hud-clock-target').textContent = '/ ' + targetText;
      },

      renderDialogue(speaker, tag, text, style, hasMore) {
        const box = $('dialogue-box');
        box.classList.remove('is-observation', 'is-phone', 'is-horror');
        if (style === 'observation') box.classList.add('is-observation');
        else if (style === 'phone') box.classList.add('is-phone');
        else if (style === 'horror') box.classList.add('is-horror');

        $('dialogue-speaker').textContent = speaker;
        $('dialogue-tag').textContent = tag;
        $('dialogue-text').textContent = text;
        $('btn-dialogue-next').classList.toggle('hidden', !hasMore);
      },

      showToast(text, kind) {
        const el = $('event-toast');
        el.className = 'event-toast';
        if (kind === 'clue') el.classList.add('toast-clue');
        else if (kind === 'horror') el.classList.add('toast-horror');
        $('event-toast-icon').textContent = kind === 'clue' ? '★' : (kind === 'horror' ? '!' : 'i');
        $('event-toast-text').textContent = text;
      },

      hideToast() {
        $('event-toast').classList.add('hidden');
      },

      pulseClueButton() {
        const btn = $('btn-clues');
        btn.classList.add('pulse-new');
        global.setTimeout(() => btn.classList.remove('pulse-new'), 2400);
      },

      triggerFlash(color) {
        const ov = $('flash-overlay');
        ov.className = 'flash-overlay flash-' + color;
        global.setTimeout(() => {
          ov.className = 'flash-overlay';
        }, 160);
      },

      setDangerBanner(visible, timeLeft, totalDuration) {
        const banner = $('danger-banner');
        banner.classList.toggle('hidden', !visible);
        if (visible) {
          $('event-toast').classList.add('hidden');
          $('danger-timer-text').textContent = timeLeft.toFixed(1) + 'd';
          const pct = Math.max(0, Math.min(100, (timeLeft / Math.max(0.1, totalDuration)) * 100));
          $('danger-bar-fill').style.width = pct + '%';
        }
      },

      setPauseModal(isPaused) {
        if (isPaused) openModal('modal-pause');
        else if (activeModalId === 'modal-pause') closeAllModals();
      },

      syncSettingsUI(s) {
        $('setting-master-vol').value = Math.round(s.masterVolume * 100);
        $('val-master-vol').textContent = Math.round(s.masterVolume * 100) + '%';
        $('setting-ambience-vol').value = Math.round(s.ambienceVolume * 100);
        $('val-ambience-vol').textContent = Math.round(s.ambienceVolume * 100) + '%';
        $('setting-sfx-vol').value = Math.round(s.sfxVolume * 100);
        $('val-sfx-vol').textContent = Math.round(s.sfxVolume * 100) + '%';
        $('setting-mute').checked = s.muted;
        $('setting-reduced-flash').checked = s.reducedFlash;
        $('setting-text-speed').value = s.textSpeed;

        const muteBtn = $('btn-mute');
        muteBtn.classList.toggle('muted', s.muted);
        $('mute-icon').textContent = s.muted ? '✕' : '♪';
      },

      syncGameplayHUD(h) {
        $('hud-night').textContent = `MALAM ${h.night}`;
        $('hud-night-subtitle').textContent = h.nightTitle;
        $('hud-clock').textContent = h.clockText;
        $('hud-clock-target').textContent = '/ ' + h.targetClockText;
        $('hud-money').textContent = h.moneyText;
        $('hud-clue-count').textContent = String(h.clueCount);
        $('hud-customer-progress').textContent = h.customerProgress;

        // Strikes badge
        const strikesPill = $('hud-strikes-pill');
        $('hud-strikes-val').textContent = `${h.strikes} / ${h.maxStrikes}`;
        strikesPill.classList.toggle('warn', h.strikes === 1);
        strikesPill.classList.toggle('critical', h.strikes >= 2);

        // Mute button
        $('btn-mute').classList.toggle('muted', h.muted);
        $('mute-icon').textContent = h.muted ? '✕' : '♪';

        // Window badge & action button
        const winBadge = $('hud-window-badge');
        winBadge.className = 'window-badge ' + (h.inIntrusion ? 'danger' : (h.windowOpen ? 'open' : 'closed'));
        $('hud-window-text').textContent = h.inIntrusion
          ? 'BAHAYA! TUTUP JENDELA!'
          : (h.windowOpen ? 'JENDELA TERBUKA' : 'JENDELA TERTUTUP');

        const btnWin = $('btn-window');
        btnWin.classList.toggle('is-open', h.windowOpen);
        $('btn-window-label').textContent = h.inIntrusion
          ? 'BANTING TUTUP!'
          : (h.windowOpen ? 'Tutup Jendela' : 'Buka Jendela');

        // Phone device button
        const btnPhone = $('btn-phone');
        btnPhone.classList.toggle('ringing', h.phoneRinging);
        $('phone-led').className = 'device-led' + (h.phoneRinging ? ' ringing' : (h.activePhone ? ' active' : ''));
        $('phone-status').textContent = h.phoneRinging ? 'BERDERING! Angkat' : (h.activePhone ? 'Tersambung...' : 'Siaga');

        // Light switch device button
        const btnLight = $('btn-light');
        btnLight.classList.toggle('outage', h.lightOut);
        $('light-led').className = 'device-led' + (h.lightOut ? ' ringing' : (h.porchLightOn ? ' active' : ''));
        $('light-status').textContent = h.lightOut
          ? 'NEON REDUP! Reset'
          : (h.porchLightOn ? 'Teras: Nyala' : 'Teras: Padam');

        // Observe / Refuse / Confront buttons
        const btnObs = $('btn-observe');
        btnObs.disabled = !h.canObserve;
        btnObs.classList.toggle('active-panel', h.observeOpen);
        $('observe-panel').classList.toggle('hidden', !h.observeOpen);

        ['face', 'clothes', 'probe'].forEach((k) => {
          const el = $('btn-obs-' + k);
          if (el) {
            el.classList.toggle('checked', Boolean(h.observedAspects[k]));
          }
        });

        $('btn-refuse').disabled = !h.canRefuse;
        $('btn-confront').classList.toggle('hidden', !h.canConfront);

        // Order ticket panel
        const orderBody = $('order-body');
        $('order-price').textContent = h.inIntrusion ? 'DARURAT' : h.orderPriceText;
        if (h.inIntrusion) {
          orderBody.innerHTML = '<ul class="ticket-order-list"><li class="ticket-order-item weird-order">! SEGERA BANTING TUTUP JENDELA !</li></ul>';
        } else if (h.inCustomer && h.customer) {
          if (h.customer.weirdOrderLabel) {
            orderBody.innerHTML = `<ul class="ticket-order-list"><li class="ticket-order-item weird-order">• ${h.customer.weirdOrderLabel}</li></ul>`;
          } else if (h.customer.order && h.customer.order.length > 0) {
            const items = h.customer.order
              .map((fid) => {
                const fl = NS.Customers.FLAVORS[fid];
                return `<li class="ticket-order-item"><span class="swatch swatch-${fid}"></span>${fl ? fl.name : fid}</li>`;
              })
              .join('');
            orderBody.innerHTML = `<ul class="ticket-order-list">${items}</ul>`;
          } else {
            orderBody.innerHTML = '<p class="ticket-empty">Tidak memesan es krim.</p>';
          }
        } else {
          orderBody.innerHTML = '<p class="ticket-empty">Belum ada pesanan aktif.</p>';
        }

        // Cup preview inside order ticket
        const cupPrev = $('cup-preview');
        const cupScoopsEl = $('cup-scoops');
        if (h.canServe) {
          cupPrev.classList.remove('hidden');
          if (h.cupScoops.length === 0) {
            cupScoopsEl.innerHTML = '<span class="ticket-empty">Kosong — pilih rasa di freezer</span>';
          } else {
            cupScoopsEl.innerHTML = h.cupScoops
              .map((fid) => {
                const fl = NS.Customers.FLAVORS[fid];
                return `<span class="cup-scoop-chip"><span class="swatch swatch-${fid}"></span>${fl ? fl.shortName : fid}</span>`;
              })
              .join('');
          }
        } else {
          cupPrev.classList.add('hidden');
        }

        // Freezer lock state
        const freezer = $('freezer-panel');
        freezer.classList.toggle('locked', !h.canServe);
        freezer.classList.toggle('unlocked', h.canServe);
        $('freezer-lock-hint').textContent = h.canServe
          ? 'Pilih rasa lalu Serahkan'
          : (h.inCustomer ? 'Buka jendela dahulu' : 'Menunggu pelanggan');

        document.querySelectorAll('.flavor-btn').forEach((b) => {
          b.disabled = !h.canServe;
        });
        $('btn-clear-cup').disabled = !h.canServe || h.cupScoops.length === 0;
        $('btn-serve-order').disabled = !h.canServe || h.cupScoops.length === 0;
      },

      renderSummary(data) {
        $('summary-badge').textContent = `SHIFT MALAM ${data.night} SELESAI`;
        $('summary-title').textContent = `Malam ${data.night}: ${data.title}`;
        $('summary-subtitle').textContent = data.isFinalNight
          ? 'Malam terakhir berhasil dilewati hingga pagi.'
          : `Progres otomatis disimpan. Bersiap menghadapi Malam ${data.night + 1}.`;

        $('stat-served').textContent = String(data.served);
        $('stat-threats-refused').textContent = String(data.threatsRefused);
        $('stat-income').textContent = data.incomeText;
        $('stat-total-money').textContent = data.totalMoneyText;

        const list = $('summary-clue-list');
        list.innerHTML = '';
        if (data.clues.length === 0) {
          const li = document.createElement('li');
          li.className = 'no-clue';
          li.textContent = 'Tidak ada petunjuk baru yang tercatat malam ini. Coba gunakan tombol Amati [Q] lebih sering.';
          list.appendChild(li);
        } else {
          data.clues.forEach((c) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${c.title}:</strong> ${c.summary}`;
            list.appendChild(li);
          });
        }

        $('summary-note').textContent = data.note;
        $('btn-summary-next').textContent = data.isFinalNight
          ? 'Lihat Akhir Cerita'
          : `Lanjut ke Malam ${data.night + 1}`;
      },

      renderEnding(ending, summary) {
        const card = $('ending-card');
        card.className = 'ending-card ending-' + ending.type;
        $('ending-type-badge').textContent = ending.badge;
        $('ending-title').textContent = ending.title;
        $('ending-subtitle').textContent = ending.subtitle;

        const nar = $('ending-narrative');
        nar.innerHTML = '';
        ending.paragraphs.forEach((pText) => {
          const p = document.createElement('p');
          p.textContent = pText;
          nar.appendChild(p);
        });

        const statsEl = $('ending-stats-list');
        statsEl.innerHTML = `
          <li>Malam Dicapai: <strong>Malam ${summary.nightReached} / 5</strong></li>
          <li>Pelanggan Dilayani: <strong>${summary.totalServed}</strong></li>
          <li>Ancaman Ditolak: <strong>${summary.totalThreatsRefused}</strong></li>
          <li>Total Kas Kios: <strong>${summary.totalMoneyText}</strong></li>
          <li>Petunjuk Terkumpul: <strong>${summary.cluesCount} / ${summary.totalClues}</strong></li>
          <li>Nyaris Tertangkap: <strong>${summary.closeCalls}</strong></li>
        `;

        $('btn-ending-retry-night').classList.toggle('hidden', !summary.canRetryNight);
      }
    };

    const game = new NS.Game(renderer, uiHooks);
    gameRef = game;
    NS.instance = game; // Convenient inspection hook for testing & debugging

    function renderCluesModal() {
      const clues = game.getDiscoveredClueObjects();
      const container = $('clues-list');
      container.innerHTML = '';
      if (clues.length === 0) {
        container.innerHTML =
          '<p class="clues-empty">Belum ada petunjuk yang tercatat. Amati pelanggan di balik kaca dan jawab telepon kios.</p>';
      } else {
        clues.forEach((c) => {
          const card = document.createElement('article');
          card.className = 'clue-card';
          card.innerHTML = `
            <div class="clue-card-header">
              <span class="clue-card-title">${c.title}</span>
              <span class="clue-card-night">Malam ${c.night}</span>
            </div>
            <p class="clue-card-desc">${c.summary}</p>
          `;
          container.appendChild(card);
        });
      }
      const total = Object.keys(NS.Dialogue.CLUES).length;
      $('clues-counter-footer').textContent = `${clues.length} / ${total} petunjuk tercatat`;
    }

    // =========================================================================
    // EVENT BINDINGS — MENUS & MODALS
    // =========================================================================

    $('btn-new-game').addEventListener('click', () => game.startNewGame());
    $('btn-continue').addEventListener('click', () => game.continueSavedGame());
    $('btn-menu-settings').addEventListener('click', () => {
      NS.Audio.unlock();
      NS.Audio.playUiClick();
      uiHooks.syncSettingsUI(game.settings);
      openModal('modal-settings');
    });
    $('btn-menu-credits').addEventListener('click', () => {
      NS.Audio.unlock();
      NS.Audio.playUiClick();
      openModal('modal-credits');
    });

    // Intro controls
    $('btn-intro-back').addEventListener('click', () => {
      NS.Audio.playUiClick();
      game.showMenu();
    });
    $('btn-intro-skip').addEventListener('click', () => game.skipIntroAndStart());
    $('btn-intro-next').addEventListener('click', () => game.advanceIntro());

    // Gameplay HUD controls
    $('btn-window').addEventListener('click', () => game.toggleWindow());
    $('btn-emergency-close').addEventListener('click', () => game.toggleWindow());
    $('btn-observe').addEventListener('click', () => game.toggleObserveMenu());
    $('btn-refuse').addEventListener('click', () => game.refuseCustomer());
    $('btn-confront').addEventListener('click', () => game.triggerSecretConfrontation());

    document.querySelectorAll('.btn-obs').forEach((btn) => {
      btn.addEventListener('click', () => {
        game.inspectCustomer(btn.getAttribute('data-observe'));
      });
    });

    $('btn-phone').addEventListener('click', () => game.interactPhone());
    $('btn-light').addEventListener('click', () => game.toggleLight());

    document.querySelectorAll('.flavor-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        game.addScoop(btn.getAttribute('data-flavor'));
      });
    });

    $('btn-clear-cup').addEventListener('click', () => game.clearCup());
    $('btn-serve-order').addEventListener('click', () => game.serveOrder());

    $('dialogue-box').addEventListener('click', () => game.advanceDialogue());
    $('btn-mute').addEventListener('click', () => {
      NS.Audio.unlock();
      game.toggleMute();
    });
    $('btn-pause').addEventListener('click', () => {
      NS.Audio.playUiClick();
      game.setPaused(true);
    });
    $('btn-clues').addEventListener('click', () => {
      NS.Audio.playUiClick();
      renderCluesModal();
      openModal('modal-clues');
    });

    // Shift summary controls
    $('btn-summary-next').addEventListener('click', () => game.proceedNextNight());
    $('btn-summary-menu').addEventListener('click', () => {
      NS.Audio.playUiClick();
      game.showMenu();
    });

    // Ending controls
    $('btn-ending-retry-night').addEventListener('click', () => game.retryCurrentNight());
    $('btn-ending-restart').addEventListener('click', () => game.startNewGame());
    $('btn-ending-menu').addEventListener('click', () => {
      NS.Audio.playUiClick();
      game.showMenu();
    });

    // Pause modal controls
    $('btn-pause-resume').addEventListener('click', () => {
      NS.Audio.playUiClick();
      game.setPaused(false);
    });
    $('btn-resume-x').addEventListener('click', () => {
      NS.Audio.playUiClick();
      game.setPaused(false);
    });
    $('btn-pause-settings').addEventListener('click', () => {
      NS.Audio.playUiClick();
      uiHooks.syncSettingsUI(game.settings);
      openModal('modal-settings');
    });
    $('btn-pause-restart-night').addEventListener('click', () => {
      closeAllModals();
      game.retryCurrentNight();
    });
    $('btn-pause-restart-game').addEventListener('click', () => {
      closeAllModals();
      game.startNewGame();
    });
    $('btn-pause-menu').addEventListener('click', () => {
      closeAllModals();
      game.showMenu();
    });

    // Generic modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        NS.Audio.playUiClick();
        const closingId = btn.getAttribute('data-close-modal');
        closeAllModals();
        if (closingId === 'modal-settings' && game.screen === 'gameplay' && game.paused) {
          openModal('modal-pause');
        }
      });
    });

    modalBackdrop.addEventListener('click', () => {
      if (activeModalId === 'modal-pause') {
        game.setPaused(false);
      } else if (activeModalId === 'modal-settings' && game.screen === 'gameplay' && game.paused) {
        openModal('modal-pause');
      } else {
        closeAllModals();
      }
    });

    // Settings input listeners
    function syncSettingsFromDOM() {
      game.applySettings({
        masterVolume: Number($('setting-master-vol').value) / 100,
        ambienceVolume: Number($('setting-ambience-vol').value) / 100,
        sfxVolume: Number($('setting-sfx-vol').value) / 100,
        muted: $('setting-mute').checked,
        reducedFlash: $('setting-reduced-flash').checked,
        textSpeed: $('setting-text-speed').value
      });
    }

    ['setting-master-vol', 'setting-ambience-vol', 'setting-sfx-vol'].forEach((id) => {
      $(id).addEventListener('input', syncSettingsFromDOM);
    });
    ['setting-mute', 'setting-reduced-flash', 'setting-text-speed'].forEach((id) => {
      $(id).addEventListener('change', syncSettingsFromDOM);
    });

    $('btn-reset-save').addEventListener('click', () => {
      NS.Save.clearProgress();
      NS.Audio.playUiClick();
      uiHooks.updateMenu(null, game.meta);
      $('btn-reset-save').textContent = 'Progres Dihapus ✓';
      global.setTimeout(() => {
        $('btn-reset-save').textContent = 'Reset Progres';
      }, 1800);
    });

    // =========================================================================
    // DIRECT CANVAS INTERACTION (CLICK WINDOW / PHONE / LIGHT SWITCH)
    // =========================================================================

    canvas.addEventListener('mousemove', (ev) => {
      if (game.screen !== 'gameplay' || game.paused || activeModalId) {
        renderer.state.hoveredTarget = null;
        canvas.classList.remove('interactive-hover');
        return;
      }
      const hit = renderer.hitTest(ev.clientX, ev.clientY);
      renderer.state.hoveredTarget = hit;
      canvas.classList.toggle('interactive-hover', Boolean(hit));
    });

    canvas.addEventListener('click', (ev) => {
      NS.Audio.unlock();
      if (game.screen !== 'gameplay' || game.paused || activeModalId) return;
      const hit = renderer.hitTest(ev.clientX, ev.clientY);
      if (hit === 'window') {
        game.toggleWindow();
      } else if (hit === 'phone') {
        game.interactPhone();
      } else if (hit === 'lightSwitch') {
        game.toggleLight();
      }
    });

    // =========================================================================
    // KEYBOARD SHORTCUTS (PRD Section 5.3 + Power-user shortcuts)
    // =========================================================================

    global.addEventListener('keydown', (ev) => {
      if (ev.repeat) return;
      const key = ev.key.toLowerCase();

      // Escape: close modal OR pause/resume gameplay
      if (ev.key === 'Escape') {
        if (activeModalId === 'modal-pause') {
          game.setPaused(false);
        } else if (activeModalId) {
          const prev = activeModalId;
          closeAllModals();
          if (prev === 'modal-settings' && game.screen === 'gameplay' && game.paused) {
            openModal('modal-pause');
          }
        } else if (game.screen === 'gameplay') {
          game.setPaused(true);
        }
        return;
      }

      // Toggle Clue Notebook with J
      if (key === 'j' && game.screen === 'gameplay' && !game.paused) {
        if (activeModalId === 'modal-clues') {
          closeAllModals();
        } else if (!activeModalId) {
          NS.Audio.playUiClick();
          renderCluesModal();
          openModal('modal-clues');
        }
        return;
      }

      // Ignore gameplay shortcuts when a modal is open
      if (activeModalId) return;

      if (game.screen === 'intro' && (ev.code === 'Space' || ev.key === 'Enter')) {
        ev.preventDefault();
        game.advanceIntro();
        return;
      }

      if (game.screen !== 'gameplay' || game.paused) return;

      if (ev.code === 'Space') {
        ev.preventDefault();
        game.advanceDialogue();
      } else if (key === 'e') {
        ev.preventDefault();
        game.toggleWindow();
      } else if (key === 'q') {
        ev.preventDefault();
        game.toggleObserveMenu();
      } else if (key === 'r') {
        ev.preventDefault();
        game.refuseCustomer();
      } else if (key === 't') {
        ev.preventDefault();
        game.interactPhone();
      } else if (key === 'f') {
        ev.preventDefault();
        game.toggleLight();
      } else if (key === 'x') {
        ev.preventDefault();
        game.triggerSecretConfrontation();
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        game.serveOrder();
      } else if (key >= '1' && key <= '5') {
        const idx = Number(key) - 1;
        const fid = NS.Customers.FLAVOR_LIST[idx];
        if (fid) game.addScoop(fid);
      }
    });

    // Android native WebView lifecycle & back-button hooks
    NS.handleAndroidBack = function () {
      if (activeModalId === 'modal-pause') {
        game.setPaused(false);
        return true;
      }
      if (activeModalId) {
        const prev = activeModalId;
        closeAllModals();
        if (prev === 'modal-settings' && game.screen === 'gameplay' && game.paused) {
          openModal('modal-pause');
        }
        return true;
      }
      if (game.screen === 'gameplay') {
        game.setPaused(true);
        return true;
      }
      if (game.screen === 'intro' || game.screen === 'summary') {
        game.showMenu();
        return true;
      }
      return false; // On Main Menu -> allow Android to exit app cleanly
    };

    NS.onAppPause = function () {
      NS.Audio.suspend();
      if (game.screen === 'gameplay' && !game.paused) {
        game.setPaused(true);
      }
    };

    NS.onAppResume = function () {
      NS.Audio.resume();
      renderer.resize();
    };

    // Unlock Web Audio cleanly on first touch on Android
    document.addEventListener('touchstart', () => NS.Audio.unlock(), { once: true, passive: true });

    // Resize & orientation change listeners
    global.addEventListener('resize', () => renderer.resize());
    global.addEventListener('orientationchange', () => {
      global.setTimeout(() => renderer.resize(), 180);
    });

    // Initial render & boot to Main Menu
    uiHooks.syncSettingsUI(game.settings);
    game.showMenu();

    // Smooth requestAnimationFrame loop
    let lastTs = performance.now();
    function frame(ts) {
      const dt = Math.min(0.1, Math.max(0.001, (ts - lastTs) / 1000));
      lastTs = ts;
      game.update(dt);
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(window);
