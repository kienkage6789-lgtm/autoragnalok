# TASKS.md

> Work Breakdown Structure. Update task states immediately upon changes.
> Statuses: todo | doing | blocked | review | done

### [x] T01 - Core Backend & Account Storage
- Description: Set up package.json, Node.js project, Express server, accounts.json storage, and account management API (Add, Delete, Update, List).
- Files related: `server.js`, `package.json`, `accounts.json`
- Acceptance criteria:
  - Express server running on port 3000.
  - REST endpoints for accounts CRUD work properly.
  - Accounts persisted in accounts.json.
- Status: done

### [x] T02 - Headless Game Poller & Simulated client
- Description: Implement background HTTP poller mimicking xhrpg_game.php requests, maintaining game state and saving logs per bot instance.
- Files related: `server.js`
- Acceptance criteria:
  - Background loop periodically polls https://ragnalok.online/human/xhrpg_game.php.
  - Successfully parses player status, coordinates, inventory, logs.
  - Handles session_token and line_uid dynamically.
- Status: done

### [x] T03 - Headless Automation Engine
- Description: Implement automation logic in server poller (auto-stats, auto-gear, auto-skills, auto-followers, auto-mines).
- Files related: `server.js`
- Acceptance criteria:
  - Auto-allocate stats based on user configuration.
  - Auto-upgrade armor when gold is sufficient.
  - Auto-upgrade skills and companions.
  - Auto-manage mining slots (build/upgrade/select ore).
- Status: done

### [x] T04 - Frontend Space-Dark Premium Dashboard UI
- Description: Create public/index.html, app.css, and app.js with a premium modern dashboard containing tabs (Core, Skills, Airship, Followers, Logs) for each account.
- Files related: `public/index.html`, `public/app.css`, `public/app.js`
- Acceptance criteria:
  - Interactive grid dashboard of active accounts.
  - Multi-tab controls inside each account card.
  - real-time updates of stats, level, inventory, and logs.
  - Add/delete account controls.
- Status: done

### [x] T05 - Verification & Launch
- Description: Set up test.js validation for cost formulas and verify server executes without errors under simulated login.
- Files related: `test.js`
- Acceptance criteria:
  - npm test passes.
  - Server starts and serves the dashboard UI correctly.
- Status: done

### [x] T06 - Map & Zone Synchronization
- Description: Detect map changes to clear zone cache, force have_static reload, and prevent character dragging.
- Files related: `server.js`, `public/app.js`
- Status: done

### [x] T07 - MVP Bossing & Auto Arena
- Description: Automatically detect world bosses to hunt, and sweep/challenge 1v1 Arena bosses.
- Files related: `server.js`, `public/app.js`
- Status: done

### [x] T08 - Bot Loop Play/Pause & Lock Position Fixes
- Description: Create start/stop API routes and frontend toggle switch to pause/resume bots, and fix checkbox ID binding for Lock Position.
- Files related: `server.js`, `public/app.js`
- Status: done

### [x] T09 - Bugfix: Auto Map Warp + Auto Farm Zone bị gãy hoàn toàn
- Description: Điều tra và sửa 3 lỗi khiến tính năng "Bản đồ di chuyển" không nhận map hiện tại và Auto Farm Zone không hoạt động.
- Files related: `server.js`, `public/app.js`
- Lỗi đã sửa:
  1. `MAP_DEFS` chưa được khai báo trong `server.js` → crash `pollGame()` tại bước Auto Warp.
  2. So sánh type không an toàn `player.map !== settings.targetMap` (number vs string).
  3. Zone dropdown không populate từ `acc.spots`; toggle autoMap/autoZone không sync về UI.
- Status: done

### [x] T10 - Hệ thống Xoay Proxy (Proxy Rotation Pool)
- Description: Xây dựng ProxyPool động với thuật toán Bin-Packing, Admin UI quản lý proxy, proxy badge trên bot card.
- Files related: `server.js`, `public/index.html`, `public/app.js`, `proxies.json`
- Tính năng:
  1. ProxyPool class thay thế gameAgent toàn cục cố định.
  2. Bin-packing: Direct (miễn phí) → lấp đầy từng proxy trước khi mở proxy mới.
  3. Admin tab "🌐 Proxy Pool": thêm/tắt/xóa proxy, cấu hình global, progress bar tải.
  4. Proxy badge trên mỗi bot card (xanh lá = direct, tím = proxy).
- Status: done

### [x] T11 - Đăng Nhập Google Tự Động Lấy Token (Dành Cho Điện Thoại)
- Description: Tích hợp cổng proxy `/login-helper` với Token Sniffer tự động bắt `line_uid` & `session_token` khi đăng nhập Google trên điện thoại.
- Files related: `server.js`, `public/index.html`
- Status: done
