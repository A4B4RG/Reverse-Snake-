# 🐍 Reverse Snake

The active application is the browser edition in `web/`. The Python/Kivy files are preserved as the original desktop prototype. Current project status is documented in [PROJECT_STATUS.md](PROJECT_STATUS.md).

[Play the deployed game](https://reverse-snake-chi.vercel.app) · [GitHub repository](https://github.com/A4B4RG/Reverse-Snake-)

## Browser edition

A complete **React + Next.js + Tailwind CSS** version is now available in [`web/`](web/README.md), with a deep-canopy jungle theme, five arenas, endless Survival, three difficulties, close-call speed boosts, keyboard/touch controls, dash, pause/resume, sound, and saved local scores.

```powershell
cd web
npm ci
npm run dev
```

Open **http://localhost:3000**. Read the [repository analysis](web/docs/REPOSITORY_ANALYSIS.md) for the prototype findings and browser implementation decisions. The original Python prototype is preserved below and in its existing folders.

## Deploy the browser game to Vercel

The browser edition is hosted on Vercel. For a new deployment, import this repository in the [Vercel dashboard](https://vercel.com/new), set **Root Directory** to **`web`**, and use **Node.js 24.x**. Build and install commands are included in `web/vercel.json`; no environment variables are required. Follow the [manual deployment guide](web/DEPLOYMENT.md).

## Browser verification

From `web/`, run `npm test`, `npm run lint`, `npm run build`, and `npm run typecheck`. Production browser tests use `npm run test:browser` after installing a Playwright browser. The GitHub Actions workflow in `.github/workflows/verify.yml` runs the install, dependency audit, rules, lint, build, TypeScript, and Chromium browser checks on pushes to `main` and pull requests.

## Original prototype notes (historical)

The sections below retain the original learning goals and desktop prototype description. Their work-in-progress lists do not describe the implemented browser game.

## 🎮 Game Idea

**Reverse Snake** is a twist on the classic Snake game.

Instead of controlling the snake, **you play as the food**.

* You move around the grid trying to survive
* A giant AI-controlled snake chases you
* Your goal is to **trick the snake into crashing** into walls or itself

---

## 💡 Why This Project?

This project is being built to:

* Learn **Python programming**
* Understand **game development fundamentals**
* Practice **modular project structure**
* Explore **AI behavior (pathfinding, chasing logic)**
* Prepare for **cross-platform development (Windows + Android)**

It’s also a fun way to turn a simple game into something more strategic and unique.

---

## 🧱 Technologies Used

* **Python** → Core game logic
* **Kivy** → UI and cross-platform support
* (Planned)

  * **C++** → AI optimization
  * **JavaScript** → Online features (leaderboard, tools)
  * **Ruby** → Backend services

---

## 📁 Project Structure

```
reverse_snake/
│
├── main.py
│
├── screens/
│   ├── home_screen.py
│   ├── game_screen.py
│   ├── pause_screen.py
│   ├── options_screen.py
│   └── __init__.py
│
├── core/        (planned for game logic separation)
├── cpp/         (planned AI optimization)
├── assets/      (images, sounds)
├── data/        (settings, temporary state)
├── build/       (compiled files)
│
└── README.md
```

---

## ✅ What Has Been Built So Far

### 🏠 Home Screen

* New Game
* Continue (basic placeholder)
* Options
* Exit

---

### ⚙️ Options Screen

* Sound ON/OFF toggle
* App Bio
* Fullscreen toggle (borderless mode)

---

### ⏸ Pause Screen

* Continue game
* Return to Home
* Exit game

---

### 🎯 Game Screen (Core Prototype)

* Grid-based system (20×20)
* Player movement using **W, A, S, D**
* Basic game loop using clock updates
* Snake system:

  * Snake body (list of segments)
  * Movement logic
  * Basic AI chasing the player
* Pause using **ESC**

---

## 🧠 Current Gameplay

* You control the **red square (food)**
* The **green snake chases you automatically**
* Movement works in real-time
* Game runs inside a structured screen system

---

## 🚧 Work In Progress

Next features to implement:

* Snake collision detection (walls & self)
* Win condition (snake crashes)
* Snake shrinking mechanic (Reverse Snake core)
* Difficulty modes (Easy / Normal / Hard)
* Level system (5 levels planned)
* Grid scaling & centering improvements
* Better visuals (snake head, spacing, effects)

---

## 🚀 Future Plans

* Advanced AI (possibly using C++)
* Online leaderboard system
* Level editor tools
* Android build using Kivy
* Sound effects and music
* Save system (local or cloud-based)

---

## 🎯 Goal

Build a **complete playable indie-style puzzle game** while learning:

* Game architecture
* Clean coding practices
* Multi-language integration
* Cross-platform deployment

---

## 👨‍💻 Status

> 🟢 Prototype stage — core mechanics working
> 🟡 Gameplay refinement in progress
> 🔵 Expansion planned

---

## 📌 Notes

This project is being built step-by-step as a learning journey.
Mistakes, refactoring, and improvements are part of the process.

---

**Reverse Snake — Outsmart the hunter.**
