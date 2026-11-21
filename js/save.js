/* ==========================================================================
   NIGHT SHIFT: ICE CREAM v2.0.0 — Save & Settings Manager (F-08)
   Supports 10 nights, permanent kiosk upgrades, 14 clues, settings, and
   graceful recovery from missing, v1, or corrupted localStorage data.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  const SAVE_KEY = 'night_shift_ice_cream_save_v2';
  const LEGACY_SAVE_KEY = 'night_shift_ice_cream_save_v1';
  const SETTINGS_KEY = 'night_shift_ice_cream_settings_v1';
  const META_KEY = 'night_shift_ice_cream_meta_v1';

  const MAX_NIGHTS = 10;

  const DEFAULT_SETTINGS = {
    masterVolume: 0.8,
    ambienceVolume: 0.7,
    sfxVolume: 0.85,
    muted: false,
    reducedFlash: false,
    textSpeed: 'normal' // 'slow' | 'normal' | 'fast'
  };

  const DEFAULT_UPGRADES = {
    halogen: false,
    reinforcedGlass: false,
    stabilizer: false,
    coffeeThermos: false
  };

  const DEFAULT_META = {
    endings: {
      good: false,
      bad: false,
      secret: false
    }
  };

  function safeStorageGet(key) {
    try {
      return global.localStorage ? global.localStorage.getItem(key) : null;
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(key, value);
        return true;
      }
    } catch (_) {
      // Ignore storage quota or private mode restrictions
    }
    return false;
  }

  function safeStorageRemove(key) {
    try {
      if (global.localStorage) {
        global.localStorage.removeItem(key);
      }
    } catch (_) {
      // Ignore
    }
  }

  function clamp01(num, fallback) {
    if (typeof num !== 'number' || Number.isNaN(num)) return fallback;
    return Math.max(0, Math.min(1, num));
  }

  function sanitizeUpgrades(raw) {
    const u = raw && typeof raw === 'object' ? raw : {};
    return {
      halogen: Boolean(u.halogen),
      reinforcedGlass: Boolean(u.reinforcedGlass),
      stabilizer: Boolean(u.stabilizer),
      coffeeThermos: Boolean(u.coffeeThermos)
    };
  }

  function isValidSaveObject(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (
      typeof obj.night !== 'number' ||
      !Number.isInteger(obj.night) ||
      obj.night < 1 ||
      obj.night > MAX_NIGHTS
    ) {
      return false;
    }
    if (typeof obj.totalMoney !== 'number' || Number.isNaN(obj.totalMoney) || obj.totalMoney < 0) {
      return false;
    }
    if (!Array.isArray(obj.clues)) return false;
    if (obj.stats && typeof obj.stats !== 'object') return false;
    return true;
  }

  const SaveManager = {
    VERSION: '2.0.0',
    MAX_NIGHTS,

    loadSettings() {
      const raw = safeStorageGet(SETTINGS_KEY);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      try {
        const parsed = JSON.parse(raw);
        const speed = ['slow', 'normal', 'fast'].includes(parsed.textSpeed)
          ? parsed.textSpeed
          : DEFAULT_SETTINGS.textSpeed;
        return {
          masterVolume: clamp01(parsed.masterVolume, DEFAULT_SETTINGS.masterVolume),
          ambienceVolume: clamp01(parsed.ambienceVolume, DEFAULT_SETTINGS.ambienceVolume),
          sfxVolume: clamp01(parsed.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
          muted: Boolean(parsed.muted),
          reducedFlash: Boolean(parsed.reducedFlash),
          textSpeed: speed
        };
      } catch (_) {
        safeStorageRemove(SETTINGS_KEY);
        return Object.assign({}, DEFAULT_SETTINGS);
      }
    },

    saveSettings(settings) {
      const sanitized = {
        masterVolume: clamp01(settings.masterVolume, DEFAULT_SETTINGS.masterVolume),
        ambienceVolume: clamp01(settings.ambienceVolume, DEFAULT_SETTINGS.ambienceVolume),
        sfxVolume: clamp01(settings.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
        muted: Boolean(settings.muted),
        reducedFlash: Boolean(settings.reducedFlash),
        textSpeed: ['slow', 'normal', 'fast'].includes(settings.textSpeed) ? settings.textSpeed : 'normal'
      };
      safeStorageSet(SETTINGS_KEY, JSON.stringify(sanitized));
      return sanitized;
    },

    loadProgress() {
      let raw = safeStorageGet(SAVE_KEY);
      let usedLegacy = false;
      if (!raw) {
        raw = safeStorageGet(LEGACY_SAVE_KEY);
        usedLegacy = Boolean(raw);
      }
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw);
        if (!isValidSaveObject(parsed)) {
          safeStorageRemove(usedLegacy ? LEGACY_SAVE_KEY : SAVE_KEY);
          return null;
        }
        return {
          version: '2.0.0',
          night: parsed.night,
          totalMoney: Math.floor(parsed.totalMoney),
          clues: parsed.clues.filter((id) => typeof id === 'string'),
          upgrades: sanitizeUpgrades(parsed.upgrades),
          stats: {
            totalServed: Number(parsed.stats && parsed.stats.totalServed) || 0,
            totalThreatsRefused: Number(parsed.stats && parsed.stats.totalThreatsRefused) || 0,
            totalInnocentRefused: Number(parsed.stats && parsed.stats.totalInnocentRefused) || 0,
            totalWrongOrders: Number(parsed.stats && parsed.stats.totalWrongOrders) || 0,
            closeCalls: Number(parsed.stats && parsed.stats.closeCalls) || 0
          },
          savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now()
        };
      } catch (_) {
        // Corrupted JSON — clear cleanly so game can start fresh (F-08)
        safeStorageRemove(SAVE_KEY);
        safeStorageRemove(LEGACY_SAVE_KEY);
        return null;
      }
    },

    saveProgress(data) {
      if (!isValidSaveObject(data)) return false;
      const payload = {
        version: '2.0.0',
        night: data.night,
        totalMoney: Math.max(0, Math.floor(data.totalMoney)),
        clues: Array.from(new Set(data.clues.filter((id) => typeof id === 'string'))),
        upgrades: sanitizeUpgrades(data.upgrades),
        stats: {
          totalServed: Number(data.stats && data.stats.totalServed) || 0,
          totalThreatsRefused: Number(data.stats && data.stats.totalThreatsRefused) || 0,
          totalInnocentRefused: Number(data.stats && data.stats.totalInnocentRefused) || 0,
          totalWrongOrders: Number(data.stats && data.stats.totalWrongOrders) || 0,
          closeCalls: Number(data.stats && data.stats.closeCalls) || 0
        },
        savedAt: Date.now()
      };
      return safeStorageSet(SAVE_KEY, JSON.stringify(payload));
    },

    clearProgress() {
      safeStorageRemove(SAVE_KEY);
      safeStorageRemove(LEGACY_SAVE_KEY);
    },

    loadMeta() {
      const raw = safeStorageGet(META_KEY);
      if (!raw) {
        return {
          endings: Object.assign({}, DEFAULT_META.endings)
        };
      }
      try {
        const parsed = JSON.parse(raw);
        return {
          endings: {
            good: Boolean(parsed && parsed.endings && parsed.endings.good),
            bad: Boolean(parsed && parsed.endings && parsed.endings.bad),
            secret: Boolean(parsed && parsed.endings && parsed.endings.secret)
          }
        };
      } catch (_) {
        safeStorageRemove(META_KEY);
        return {
          endings: Object.assign({}, DEFAULT_META.endings)
        };
      }
    },

    unlockEnding(type) {
      const meta = this.loadMeta();
      if (type === 'good' || type === 'bad' || type === 'secret') {
        meta.endings[type] = true;
        safeStorageSet(META_KEY, JSON.stringify(meta));
      }
      return meta;
    }
  };

  NS.Save = SaveManager;
})(window);
