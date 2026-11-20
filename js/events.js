/* ==========================================================================
   NIGHT SHIFT: ICE CREAM — Random Horror Events Manager (F-05)
   Implements 6 throttled atmospheric horror events with full visual + audio
   parity and safety guards so events NEVER lock player controls.
   ========================================================================== */

(function (global) {
  'use strict';

  const NS = (global.NightShift = global.NightShift || {});

  /**
   * 6 Distinct Atmospheric Horror Events (PRD F-05):
   * 1. phantom_knock      — Knock heard & ripple seen on glass when NO customer is present
   * 2. light_flicker      — Fluorescent ceiling light flickers / dims (can be restored with [F])
   * 3. distant_silhouette — Dark figure lingers briefly under the distant streetlamp in mist
   * 4. footsteps_circle   — Wet stereo footsteps pace around outside the kiosk walls
   * 5. handprint_glass    — Foggy cold handprint materializes silently on the frosted glass
   * 6. vanishing_glimpse  — Light blinks while a figure briefly appears outside, then vanishes!
   * (Plus creepy phone calls scheduled via Game & Events!)
   */
  class EventManager {
    constructor() {
      this.cooldown = 12;
      this.recentEvents = [];
      this.totalTriggeredThisNight = 0;
      this.maxEventsPerNight = 5;
    }

    resetForNight(nightNumber) {
      this.cooldown = Math.max(7, 15 - nightNumber * 1.6);
      this.recentEvents = [];
      this.totalTriggeredThisNight = 0;
      this.maxEventsPerNight = 2 + nightNumber; // Night 1: 3 max, Night 5: 7 max
    }

    update(dt, ctx) {
      // ctx: { night, phase, hasCustomer, windowOpen, phoneRinging, lightOut, reducedFlash, triggerCallback }
      if (ctx.phase !== 'waiting' && ctx.phase !== 'customer_present') return;
      if (this.totalTriggeredThisNight >= this.maxEventsPerNight) return;

      this.cooldown -= dt;
      if (this.cooldown > 0) return;

      const config = NS.Dialogue.NIGHT_CONFIGS[ctx.night] || NS.Dialogue.NIGHT_CONFIGS[1];
      const roll = Math.random();
      if (roll > config.eventChance + (ctx.windowOpen && !ctx.hasCustomer ? 0.25 : 0)) {
        this.cooldown = 7;
        return;
      }

      const pool = this._buildEligiblePool(ctx);
      if (pool.length === 0) {
        this.cooldown = 6;
        return;
      }

      // Avoid repeating the exact same event back-to-back
      const filtered = pool.filter((e) => e !== this.recentEvents[this.recentEvents.length - 1]);
      const chosen = filtered.length > 0
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      this.recentEvents.push(chosen);
      this.totalTriggeredThisNight += 1;
      // Generous cooldown so events enhance tension instead of overwhelming the player
      this.cooldown = Math.max(11, 21 - ctx.night * 2) + Math.random() * 6;

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
      }

      // Can happen during waiting or calmly during customer presence (non-blocking)
      if (!ctx.lightOut) {
        pool.push('light_flicker');
        if (night >= 3 && !ctx.hasCustomer) {
          pool.push('power_dip');
        }
      }

      return pool;
    }

    describeEvent(eventType) {
      switch (eventType) {
        case 'phantom_knock':
          return {
            toast: 'Tiga ketukan terdengar jelas di kaca jendela... tapi tidak ada siapa pun di luar.',
            kind: 'horror'
          };
        case 'light_flicker':
          return {
            toast: 'Lampu neon di atas kepala mendengung dan berkedip dingin.',
            kind: 'horror'
          };
        case 'power_dip':
          return {
            toast: 'Lampu neon kios redup mendadak! Tekan saklar Lampu Kios [F] untuk menormalkannya.',
            kind: 'horror'
          };
        case 'distant_silhouette':
          return {
            toast: 'Bayangan tinggi berdiri diam di bawah tiang lampu seberang jalan... lalu melangkah ke kegelapan.',
            kind: 'horror'
          };
        case 'footsteps_circle':
          return {
            toast: 'Suara langkah kaki basah berjalan pelan mengitari dinding samping kios.',
            kind: 'horror'
          };
        case 'handprint_glass':
          return {
            toast: 'Bekas telapak tangan dingin perlahan muncul di permukaan kaca berembun.',
            kind: 'horror'
          };
        case 'vanishing_glimpse':
          return {
            toast: 'Saat lampu berkedip, sesosok wajah sempat berdiri tepat di depan jendela—detik berikutnya sudah lenyap!',
            kind: 'horror'
          };
        case 'creepy_call':
          return {
            toast: 'Telepon merah berdering keras dari nomor tidak dikenal...',
            kind: 'horror'
          };
        default:
          return {
            toast: 'Angin dingin menyusup lewat celah kusen jendela.',
            kind: 'normal'
          };
      }
    }
  }

  NS.Events = new EventManager();
})(window);
