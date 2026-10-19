# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Neon Arena is a neon arcade survival game in a single file, `index.html`, holding the HTML, CSS and JS. The user is a beginner and builds it in stages, with a plain-language explanation after each one.

Hard constraints:
- It must stay **one file** that works **offline**. That means no external fonts, libraries, CDNs, images or audio files. Sound (planned) is generated with the Web Audio API.
- The target is a **desktop browser with a keyboard** (WASD/arrows, Shift, Space, Enter).
- Comments are written for a beginner. Match the existing tone and the `/* ===== SECTION ===== */` headers.

## Commands

There's no build, package manager or test suite. To run it, open `index.html` in a browser.

To syntax-check the script (Node is installed):
```powershell
$html = Get-Content -Raw -Encoding UTF8 index.html
$js = [regex]::Match($html, '(?s)<script>(.*)</script>').Groups[1].Value
[IO.File]::WriteAllText("$env:TEMP\arena-check.js", $js); node --check "$env:TEMP\arena-check.js"
```
To smoke-test at runtime, run the extracted script in Node's `vm` with stubbed `document`, `window`, `localStorage` and a Proxy canvas context. Append test code that calls `startGame()`, loops `update(1/60)` / `draw()` / `updateHud()` with random `keys`, and asserts there are no NaN positions. Top-level `let`/`const` aren't globals, so the test code has to be concatenated into the same script string.

Git: if `git` isn't on PATH, it's at `C:\Program Files\Git\cmd`. The GitHub CLI is at `C:\Program Files\GitHub CLI\gh.exe`. The remote is `origin` → `github.com/DarkKinght14/neon-arena` (private, `main`). **Commit every completed change with a clean, imperative message and push it.** The user relies on history to revert, so undo changes with `git revert`, not by rewriting history.

## Architecture (inside `index.html`)

- **`SETTINGS`** (top of the script) holds every gameplay number: speeds, spawn rates, unlock times, boss stats, points. New tunables go here, not inline.
- **Game state** is module-level `let` variables (`state` = `'start' | 'playing' | 'over'`, `player`, the arrays `enemies`/`bullets`/`turrets`/`powerups`/`particles`/`texts`/`rings`/`afterimages`, plus timers). `startGame()` must reset **every** one of them, so add any new state to it.
- **Main loop:** `loop()` → `update(dt)` (only while playing, `dt` capped at 0.05) → `draw(now)` → `updateHud()`. The HUD is HTML laid over the canvas. Write to it through `setHtml()` to avoid needless DOM writes.
- **Freeze semantics:** in `update()`, the player, power-ups, combo and cooldown timers and visual effects always run. Spawning, turrets, enemy movement, bullets, crashes and near-misses sit inside `if (!frozen)`. When adding something, decide which side it belongs on.
- **Collision** is circle vs. circle via `touching(a, b)` (every entity has `x, y, r`). Player contact rules are, in priority order: frozen → smash (`hitEnemy`), dashing/ghost → pass through, tank/boss → `hurtPlayer()` + `knockBack()`, otherwise the enemy dies and the player is hurt.
- **Enemies** are one object shape created by `makeEnemy(type, x, y)` from the `ENEMY_TYPES` table (`chaser`, `small`, `dasher`, `tank`, `splitter`, `boss`). Behavior branches on `e.type` in `moveEnemy()` and `drawEnemy()`. Damage goes through `hitEnemy()`, which uses a per-enemy `hitCooldown` so one touch doesn't count as many hits, and then `destroyEnemy(e, cause)`. Enemies created mid-update (splitter children) must be pushed to `toSpawn`, not `enemies`. They're merged at the end of `update()`.
- **Speed scaling:** `playerSpeedNow()` grows faster than `enemySpeedNow()`, so the player always outruns a normal enemy. Enemy speed is computed live each frame (`enemySpeedNow() * e.speedMul`), not stored at spawn time.
- **Scoring:** `score() = floor(timeScore) + bonus`. Every bonus must go through `addBonus(points, x, y, label)`, which applies the combo multiplier (up to `comboMax`) and double points, then shows the popup.
- **Randomness:** power-up kinds and enemy types are chosen by `weightedPick({key: weight})`, with weights adjusted by the game situation. At most one power-up is on the field at a time (`spawnPowerup()` replaces the array). Effects are applied in `applyPowerup()`.
- **Persistence:** the high score is saved in `localStorage` under `neonArena.best`, and every access is wrapped in try/catch.

## Roadmap

Next is Build 3: a challenge every 10s (reversed controls, faster enemies, shrinking arena, bullet storm), screen shake, glowing trails, and Web Audio sound effects with a mute button (M key, remembered in localStorage). Reuse `burst()`, `showBanner()` and `addText()` for these effects.
