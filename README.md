# Neon Arena

A neon arcade survival game that runs in any desktop browser. It's one HTML file, with no installs and no internet needed.

## Play

Double-click `index.html` to open it in Chrome, Edge or Firefox.

| Key | Action |
|---|---|
| WASD / arrow keys | Move |
| Shift | Dash: a quick burst you can't be hit during |
| Space | Freeze enemies and bullets for 2 seconds |
| Enter | Restart after game over |
| M | Mute or unmute sound |

## Features

- Enemies that chase you, and turrets that fire aimed bullets
- Time freeze: frozen enemies can be smashed for bonus points
- Six random power-ups: shield, heart, shockwave, double points, ghost, freeze refill
- Enemy types that unlock over time: dasher, tank, splitter
- A boss every 60 seconds
- Near-miss bonus and a combo multiplier (up to ×4)
- A new challenge every 10 seconds: reversed controls, faster enemies, shrinking arena or bullet storm
- Screen shake, glowing trails and particle bursts
- Sound effects generated in code (no audio files), with a mute button that's remembered
- High score saved in the browser

## Tuning

All the gameplay numbers (speeds, spawn rates, timings, points) are in the `SETTINGS` object at the top of the script in `index.html`.
