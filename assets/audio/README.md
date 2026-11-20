# Audio Assets Note

All sound effects and ambient soundscapes in **NIGHT SHIFT: ICE CREAM** are synthesized in real time using the browser's native **Web Audio API** (`js/audio.js`).

This ensures:
- 100% offline execution directly from `index.html` (`file://` or HTTP) without external CDN dependencies or CORS audio loading errors.
- Dynamic tension scaling (rain, fluorescent hum, ambient drone, stereo footsteps, heartbeat, knock resonances, phone rings, scoop & cash register SFX).
- Instant volume and mute controls.
