/* ==========================================================================
   NIGHT SHIFT: ICE CREAM v2.0.0 — Random Horror Events Manager (F-05)
   Implements 10 throttled atmospheric & interactive horror events scaling
   across Nights 1–10 with sanity impact and upgrade mitigation.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  class EventManager {
    constructor() {
      this.cooldown = 12;
      this.recentEvents = [];
      this.totalTriggeredThisNight = 0;
      this.maxEventsPerNight = 4;
    }

    resetForNight(nightNumber) {
      this.cooldown = Math.max(6.5, 14.5 - nightNumber * 0.85);
      this.recentEvents = [];
      this.totalTriggeredThisNight = 0;
      this.maxEventsPerNight = 2 + Math.min(8, Math.ceil(nightNumber * 0.9));
    }

    update(dt, ctx) {
      if (ctx.phase !== 'waiting' && ctx.phase !== 'customer_present') return;
      if (this.totalTriggeredThisNight >= this.maxEventsPerNight) return;

      this.cooldown -= dt;
      if (this.cooldown > 0) return;

      const config = NS.Dialogue.NIGHT_CONFIGS[ctx.night] || NS.Dialogue.NIGHT_CONFIGS[1];
      const openPenalty = ctx.windowOpen && !ctx.hasCustomer ? 0.25 : 0;
      if (Math.random() > config.eventChance + openPenalty) {
        this.cooldown = 6.5;
        return;
      }

      const pool = this._buildEligiblePool(ctx);
      if (pool.length === 0) {
        this.cooldown = 6;
        return;
      }

      const filtered = pool.filter((e) => e !== this.recentEvents[this.recentEvents.length - 1]);
      const chosen = filtered.length > 0
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      this.recentEvents.push(chosen);
      this.totalTriggeredThisNight += 1;
      this.cooldown = Math.max(9.5, 20 - ctx.night * 1.05) + Math.random() * 5;

      ctx.triggerCallback(chosen);
    }

    _buildEligiblePool(ctx) {
      const pool = [];
      const night = ctx.night;

      if (!ctx.hasCustomer) {
        pool.push('distant_silhouette');
        pool.push('footsteps_circle');
        if (night >= 2) {
          pool.push('phantom_knock');
          pool.push('handprint_glass');
        }
        if (night >= 3 && !ctx.phoneRinging) {
          pool.push('creepy_call');
        }
        if (night >= 3) {
          pool.push('vanishing_glimpse');
        }
        if (night >= 5) {
          pool.push('vent_whisper');
        }
        if (night >= 6 && !ctx.windowOpen) {
          pool.push('latch_rattle');
        }
      }

      if (night >= 4) {
        pool.push('thunder_flash');
      }

      if (!ctx.lightOut) {
        pool.push('light_flicker');
        if (night >= 3 && !ctx.hasCustomer) {
          pool.push('power_dip');
        }
        if (night >= 7 && !ctx.hasCustomer) {
          pool.push('power_blackout');
        }
      }

      return pool;
    }

    describeEvent(eventType) {
      switch (eventType) {
        case 'phantom_knock':
          return {
            toast: 'Tiga ketukan terdengar jelas di kaca jendela... tapi tidak ada siapa pun di luar.',
            sanityDelta: -7,
            kind: 'horror'
          };
        case 'light_flicker':
          return {
            toast: 'Lampu neon di atas kepala mendengung dan berkedip dingin.',
            sanityDelta: -5,
            lightBased: true,
            kind: 'horror'
          };
        case 'power_dip':
          return {
            toast: 'Lampu neon kios redup mendadak! Tekan saklar Lampu Kios [F] untuk menyalakan kembali.',
            sanityDelta: -8,
            lightBased: true,
            kind: 'horror'
          };
        case 'power_blackout':
          return {
            toast: 'MATI LAMPU TOTAL! Kedua lampu padam—segera reset saklar Lampu Kios [F]!',
            sanityDelta: -14,
            lightBased: true,
            kind: 'horror'
          };
        case 'thunder_flash':
          return {
            toast: 'Kilat petir menyambar langit Jalan Melati, menyingkap bayangan kosong di seberang.',
            sanityDelta: -6,
            lightBased: true,
            kind: 'horror'
          };
        case 'distant_silhouette':
          return {
            toast: 'Bayangan tinggi berdiri diam di bawah tiang lampu seberang jalan... lalu melangkah ke kegelapan.',
            sanityDelta: -7,
            kind: 'horror'
          };
        case 'footsteps_circle':
          return {
            toast: 'Suara langkah kaki basah berjalan pelan mengitari dinding samping kios.',
            sanityDelta: -8,
            kind: 'horror'
          };
        case 'handprint_glass':
          return {
            toast: 'Bekas telapak tangan dingin perlahan muncul di permukaan kaca berembun.',
            sanityDelta: -9,
            kind: 'horror'
          };
        case 'vanishing_glimpse':
          return {
            toast: 'Saat lampu berkedip, sesosok wajah sempat berdiri tepat di depan jendela—detik berikutnya sudah lenyap!',
            sanityDelta: -12,
            kind: 'horror'
          };
        case 'vent_whisper':
          return {
            toast: 'Bisikan dingin keluar dari ventilasi belakang freezer: "...buka... kacanya..."',
            sanityDelta: -11,
            kind: 'horror'
          };
        case 'latch_rattle':
          return {
            toast: 'KREK-KREK! Seseorang mencoba menggeser paksa kaca dari luar! Aktifkan Kunci Ganda [L]!',
            sanityDelta: -10,
            kind: 'horror'
          };
        case 'creepy_call':
          return {
            toast: 'Telepon merah berdering keras dari nomor tidak dikenal...',
            sanityDelta: -4,
            kind: 'horror'
          };
        default:
          return {
            toast: 'Angin dingin menyusup lewat celah kusen jendela.',
            sanityDelta: -3,
            kind: 'normal'
          };
      }
    }
  }

  NS.Events = new EventManager();
})(window);
