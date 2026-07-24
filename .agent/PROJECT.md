# PROJECT.md

> Project context file. Read this first when starting a new session.

## Project Description
A multi-account headless manager dashboard for Ragnalok Online (an idle RPG game). It automates stats allocation, gear upgrading, skills training, follower deployments, mining slots, airship energy generation, and munitions production using simulated web HTTP client polling.

## Technical Stack
- Language: Javascript / Node.js
- Frontend Framework: Vanilla HTML5 / Vanilla CSS / Vanilla Javascript (Single-page app)
- Backend: Express.js
- Database: Local JSON file persistence (`accounts.json`)
- Main dependencies: `express`

## Codebase Directory Structure
```
auto/
├── .agent/              # External brain memory (context files)
│   ├── assets/          # Template files
│   ├── references/      # Procedural guidelines (planning, breakdown, testing)
│   ├── PROJECT.md       # Project context (this file)
│   ├── TASKS.md         # Active WBS tasks list
│   ├── DECISIONS.md     # Technical decisions and ADRs
│   └── CHANGELOG.md     # Changelog history
├── public/              # Client static files
│   ├── index.html       # Web UI skeleton container
│   ├── app.css          # Space-dark responsive premium design system
│   └── app.js           # Client-side DOM render, stats update, API triggers
├── server.js            # Express server, game API wrappers, auto-upgrader loops
├── accounts.json        # Persisted accounts config
├── test.js              # Unit tests for game formulas
└── package.json         # Node project descriptor
```

## Coding Conventions
- Naming: Standard camelCase for functions and variables, snake_case for fields matching game API keys.
- Error handling: Log to console, log to dashboard console via `addLog()`, display modal alert for manual failures.
- Testing: Execute unit tests in `test.js` to validate core logic, formulas, and mock APIs.
- **Quy trình làm việc**: Bắt buộc phải thực hiện đúng và đầy đủ quy trình 5 bước trong `.agent/SKILL.md` (Planning, Breakdown, Implementation, Testing, Review) cho mọi công việc không nhỏ, đồng thời cập nhật liên tục bộ não ngoài trên đĩa (`PROJECT.md`, `TASKS.md`, `DECISIONS.md`, `CHANGELOG.md`).

## How to Run & Test
```bash
# Start server
npm start

# Run unit tests
npm test
```

## Current Requirements
1. Multi-account headless dashboard interface mimicking 100% of game panels (Core stats, Skills, Airship, Followers).
2. Automation rules (Auto-Stats, Auto-Gear, Auto-Skills with priorities, Auto-Refills, Auto-Titan recharging).
3. Live terminal activities log per bot instance.

## Hosting & Deployment Architecture
- **Dynamic Domain Support**: The backend Express app uses `app.set('trust proxy', 1)` to automatically detect the client's real IP and HTTPS protocol behind reverse proxies (Nginx, Render, Heroku, Cloudflare). All client API calls use relative paths, and Bookmarklets fetch domain info dynamically using `window.location.origin` at the time of creation.
- **Fail-safe Fallback Mechanics**: In case the game server blocks the backend proxy (e.g. returning Cloudflare captcha/challenge HTML pages) or the assets cannot be retrieved, the server automatically detects if the payload is HTML (using `starts with '<'`) or doesn't contain game scripts, and throws an error to fall back to serving local, pre-patched static files (`xhrpg_canvas.js`, `sdk.js`, `play.html`).

