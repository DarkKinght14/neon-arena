# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Neon Arena is a neon arcade survival game in a single file, `index.html`, holding the HTML, CSS and JS. The user is a beginner and builds it in stages, with a plain-language explanation after each one.

Hard constraints:
- All game code stays in **one file** that works **offline**. That means no external fonts, libraries, CDNs, images or audio files. Sound is generated with the Web Audio API. Opening `index.html` directly from disk must keep working.
- It's an installable **PWA** hosted on **GitHub Pages** (https://darkkinght14.github.io/neon-arena/), deployed automatically from `main` at the repo root. The user installs it on an iPhone via Safari → Add to Home Screen and plays offline. The PWA wrapper files are `manifest.webmanifest`, `sw.js`, `icons/` and `.nojekyll`. **If you add any file the game needs at runtime, add it to `FILES` in `sw.js`**, or it won't be available offline. `sw.js` is network-first, so updates reach installed copies without bumping `CACHE`.
- It supports **both desktop keyboard and touch** (iPhone, portrait and landscape). Test changes at phone sizes too (e.g. 390×844 and 844×390).
- Comments are written for a beginner. Match the existing tone and the `/* ===== SECTION ===== */` headers.

## Version control (required)

Commit and push to GitHub **regularly as you work**, not only at the end. The goal is that no progress is ever lost and any change can be reverted.
- Commit after each meaningful working step: a feature, a fix, a tuning pass or a docs update. Don't let several unrelated changes pile up into one commit.
- Before committing, run the syntax check below (and the smoke test for gameplay changes). Don't commit a broken game.
- Use clean commit messages: a short imperative subject (e.g. `Add bullet storm challenge`, `Fix enemies escaping shrunken arena`), plus an optional body explaining what changed and why.
- Push right after every commit (`git push`), so GitHub always has the latest state.
- Undo with `git revert`. Never rewrite pushed history (`reset --hard`, `push --force`, amending pushed commits).
- At the end of a task, confirm `git status` is clean and `main` is up to date with `origin/main`.

## Commands

There's no build, package manager or test suite. To run it, open `index.html` in a browser. Every push to `main` redeploys GitHub Pages within about a minute. Check it with `gh api repos/DarkKinght14/neon-arena/pages --jq .status` (it should say `built`).

To syntax-check the script (Node is installed):
```powershell
$html = Get-Content -Raw -Encoding UTF8 index.html
$js = [regex]::Match($html, '(?s)<script>(.*)</script>').Groups[1].Value
[IO.File]::WriteAllText("$env:TEMP\arena-check.js", $js); node --check "$env:TEMP\arena-check.js"
```
To smoke-test at runtime, run the extracted script in Node's `vm` with stubbed `document`, `window`, `localStorage` and a Proxy canvas context. Append test code that calls `startGame()`, loops `update(1/60)` / `draw()` / `updateHud()` with random `keys`, and asserts there are no NaN positions. Top-level `let`/`const` aren't globals, so the test code has to be concatenated into the same script string.

Git: if `git` isn't on PATH, it's at `C:\Program Files\Git\cmd`. The GitHub CLI is at `C:\Program Files\GitHub CLI\gh.exe`. The remote is `origin` → `github.com/DarkKinght14/neon-arena` (private, `main`).

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
- **Arena:** `baseArena` is the full window-sized rectangle, set in `resize()`. `arena` is the current playable one. `applyArena()` derives it from `arenaInset` (used by the shrinking challenge). All gameplay code uses `arena`.
- **Challenges:** `challenge` holds one of the keys of `CHALLENGES`, or `null` for the first 10s. `startChallenge()` rotates it every `challengeEvery` seconds and never repeats the same one twice in a row. Effects are checked inline wherever they apply: `readMovement()` (reversed), `moveEnemy()` (fast), the turret timer (storm), and the inset step in `update()` (shrink).
- **Effects:** `burst()` makes particles, `addText()` floating popups, `showBanner()` the queued center messages (`banners`) and `addShake()` the screen shake. Shake is applied as a translate inside `ctx.save()`/`restore()` in `draw()` and decays in `loop()`. Trails come from `pushTrail()` every frame (`obj.trail`) and are drawn with the `'lighter'` blend mode.
- **Sound:** `initAudio()` creates the AudioContext, and must run from a user gesture (it's called from `startGame()` and the mute button). Every sound is a recipe in `SOUNDS` made from `tone()`/`noise()`. Play them through `playSound(name)`, which handles mute and throttles repeats to one per 45ms.
- **Touch & phones:** `body.touch` is set on touch devices. CSS uses `.touch-only` / `.key-only` to switch hints and controls. The joystick (`stick`) is canvas pointer events (non-mouse) that feed `readMovement()` as an analog vector. `dashBtn`/`freezeBtn`/`pauseBtn` act on `pointerdown`. `resize()` places `baseArena` below the HUD's measured bottom (a `ResizeObserver` re-runs it when the HUD wraps) and inside the iPhone safe areas, read from the hidden `#safeProbe` element. `worldScale()` (0.6–1) shrinks speeds, the shockwave radius and the enemy cap on small screens.
- **Pause:** `state === 'paused'` (P/Esc, the II button, or automatically on `visibilitychange`). Anything that runs only while playing must check `state === 'playing'`.
- **Persistence:** `localStorage` keys are `neonArena.best` (high score) and `neonArena.muted`, and every access is wrapped in try/catch.
