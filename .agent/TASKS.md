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

### [x] T12 - Sửa Lỗi Submit PHPSESSID & Tối Ưu Trust Proxy Cho Dynamic Domain
- Description: Đăng ký sự kiện submit form PHPSESSID ở frontend gửi AJAX tới API backend, hiển thị thông báo lỗi/thành công; bổ sung cấu hình trust proxy ở backend Express.
- Files related: `public/app.js`, `server.js`
- Acceptance criteria:
  - [x] Form submit chặn reload trang mặc định và gửi request POST dạng JSON `{ phpsessid }` tới `/api/add-by-phpsessid`.
  - [x] Hiển thị thông báo lỗi trên UI (#phpsessid-error) nếu PHPSESSID không hợp lệ hoặc server lỗi.
  - [x] Tự động đóng modal, reset input, và reload danh sách tài khoản nếu add thành công.
  - [x] Express backend `server.js` được cấu hình `app.set('trust proxy', 1)` để xử lý an toàn đằng sau proxy/load balancer khi host web.
- Status: done

### [x] T13 - Sửa Lỗi Unexpected Token '<' Khi Khởi Động Client
- Description: Phát hiện và chặn các response dạng HTML khi tải JavaScript từ CDN game server (như khi bị Cloudflare chặn hoặc redirect 404), kích hoạt cơ chế fallback phục vụ file tĩnh cục bộ.
- Files related: `server.js`
- Acceptance criteria:
  - [x] Hàm `fetchGameAsset` phát hiện được response chứa HTML (bắt đầu bằng `<`) và ném lỗi thay vì gửi HTML về client.
  - [x] Khi tải canvas hoặc SDK lỗi/trả về HTML, server tự động fallback thành công sang phục vụ file local JS tương ứng (`xhrpg_canvas.js`, `sdk.js`).
  - [x] Hàm `fetchGameHtml` và `fetchGameLoginHtml` phát hiện được response HTML rác từ CDN (không chứa game scripts) và ném lỗi, kích hoạt fallback sang `play.html` cục bộ hoạt động trơn tru.
- Status: done

### [x] T14 - Chức Năng Lock Tâm Zone (Khóa Vị Trí Vùng Farm)
- Description: Bổ sung cấu hình và logic "Lock tâm zone" để nhân vật tự động đi tới tâm zone chỉ định, tự kích hoạt chế độ Lock Position khi đến nơi để đứng yên auto-farm, và tự động đi lại khi hồi sinh/chết.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Thêm checkbox toggle `🔒 Lock tâm zone` trên Card UI trong settings-group của Auto Farm Zone.
  - [x] Tự động sync trạng thái bật/tắt `lock_zone_center` từ server response về UI.
  - [x] Khi `lock_zone_center` được bật, nếu khoảng cách tới tâm zone `dist > 30`, bot tự động bật `traveling: 1` và tạm thời tắt `lock_pos: 0` để cho phép di chuyển đến tâm.
  - [x] Khi khoảng cách tới tâm zone `dist <= 30`, bot tự động dừng di chuyển `traveling: 0` và kích hoạt chế độ khóa `lock_pos: 1` tại tâm zone.
  - [x] Thiết lập lại `lock_zone_center = false` khi nhân vật phát hiện đổi bản đồ (Map Change).
- Status: done

### [x] T15 - Tinh chỉnh Giao diện Thẻ Cơ Bản (Dọn dẹp & Tối ưu Responsive)
- Description: Tạm thời ẩn các nút/input ít quan trọng (Auto Tăng Điểm, Auto Nâng Armor, explore_radius) trên thẻ Cơ Bản để tối ưu hóa hiển thị, sắp xếp lại bố cục cân đối và phù hợp trên cả điện thoại (mobile) và máy tính (desktop).
- Files related: `public/app.js`
- Acceptance criteria:
  - [x] Loại bỏ các checkbox `⚡ Auto Tăng Điểm`, `🛡️ Auto Nâng Armor` khỏi HTML của thẻ Cơ Bản.
  - [x] Loại bỏ ô nhập số `explore_radius (m)` khỏi HTML.
  - [x] Cấu hình ô nhập `🍷 Bơm Potion khi HP < (%)` sử dụng `grid-column: span 2;` để hiển thị tràn viền, cân đối bố cục.
  - [x] Sửa mã nguồn sync DOM để bỏ qua lỗi `TypeError` (kiểm tra phần tử tồn tại bằng `if (chkElement)`) khi các checkbox bị ẩn không còn xuất hiện trên DOM.
- Status: done

### [x] T16 - Thẻ Cài Đặt Săn Boss Riêng & Xử Lý Ưu Tiên MVP
- Description: Tách tính năng Auto MVP và Auto Đấu trường sang thẻ "Săn Boss" riêng biệt, đồng thời bổ sung logic phân tích, sắp xếp ưu tiên và lọc (whitelist/blacklist) tên Boss cần săn.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Tạo tab mới `Săn Boss` bên cạnh `Cơ Bản` và `Nhật Ký`.
  - [x] Di chuyển checkbox `Auto Săn Boss MVP` và `Auto Đấu Trường` sang tab này.
  - [x] Thêm cấu hình tiêu chí sắp xếp ưu tiên: Khoảng cách gần nhất, Lv thấp nhất (tăng dần), Lv cao nhất (giảm dần).
  - [x] Thêm ô nhập danh sách tên Boss ưu tiên (cách nhau bởi dấu phẩy) và tên Boss bỏ qua (không săn).
  - [x] Logic backend lọc bỏ Boss trong blacklist, lọc lấy Boss trong whitelist trước (nếu trùng), và sắp xếp theo tiêu chí đã cấu hình để tìm ra Boss cần săn mục tiêu tối ưu nhất.
- Status: done


