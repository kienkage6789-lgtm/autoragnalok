# Code Map — Ragnalok Bot Dashboard

_Last updated: 2026-09-01_

## Overview

Ứng dụng Node.js/Express quản lý nhiều tài khoản Ragnalok Online, chạy bot headless, tự động farm/săn boss/sự kiện/chợ và cung cấp dashboard quản trị trên trình duyệt. Kiến trúc hiện tại chủ yếu là hai monolith: `server.js` chứa API, state và automation engine; `public/app.js` chứa toàn bộ state/render/event handler của dashboard. Các trang `play*.html` là client game đi qua proxy nội bộ để chống idle và hỗ trợ điều khiển chiến đấu.

## File Tree

```text
autoragnalok/
├── server.js                   # Express API, bot engine, proxy/game gateway
├── test.js                     # Bộ regression test chạy tuần tự bằng node/assert
├── package.json                # Entry point và dependencies
├── public/
│   ├── index.html              # DOM dashboard
│   ├── app.js                  # Logic dashboard phía trình duyệt
│   ├── app.css                 # Space-dark theme và responsive layout
│   └── assets/                 # Sprite hero/monster/fx và tile bản đồ
├── play.html                   # Client game proxy/anti-idle
├── play_battle.html            # Client game có battle radar và PK controls
├── game_index.html             # Snapshot trang game gốc để tham chiếu
├── xhrpg_lang_vi.js            # Gói ngôn ngữ Việt của game
├── xhrpg_style.css             # CSS game được phục vụ qua proxy
├── game_api_reference.md       # API game đã reverse-engineer
├── battle_radar_walkthrough.md # Cơ chế và kiểm thử battle radar
├── project_analysis_report.md  # Phân tích kiến trúc/quy trình
└── project_summary.md          # Lịch sử tính năng và roadmap
```

Không đưa vào map: `node_modules/`, `.git/`, `.agent/`, `scratch/`, dữ liệu nhạy cảm/runtime (`accounts.json`, `users.json`, `proxies.json`), cache (`*_cache.json`), script game tải động (`xhrpg_canvas.js`, `sdk.js`) và thư viện vendored/minified (`jquery-3.6.0.min.js`).

## Modules

### `server.js`

Entry point CommonJS của server. Khởi tạo Express, persistence JSON, proxy pool, các `BotInstance`, API dashboard, gateway tới game và ba vòng nền: đồng bộ map, Telegram backup, zombie watchdog.

#### Exported utilities

| Function/Class | Signature | Purpose |
|---|---|---|
| `tierGold` | `(lv)` | Tính chi phí vàng cơ sở theo tier level |
| `tierRes` | `(lv)` | Tính chi phí nguyên liệu cơ sở theo tier level |
| `_upgCostMult` | `(t)` | Tính hệ số nhân chi phí nâng cấp ở level cao |
| `getArmorUpgradeCost` | `(armorLv)` | Trả chi phí nâng cấp giáp kế tiếp |
| `getCatUpgradeCost` | `(catLv)` | Trả chi phí nâng cấp mèo kế tiếp |
| `getDroneUpgradeCost` | `(droneLv)` | Trả chi phí nâng cấp drone kế tiếp |
| `getMineUpgradeCost` | `(mineLv)` | Trả chi phí nâng cấp mỏ kế tiếp |
| `getItemCategory` | `(item)` | Phân vật phẩm chợ vào nhóm cấu hình tương ứng |
| `getModuleTier` | `(translatedName)` | Suy ra tier module từ tên đã dịch |
| `formatMarketListing` | `(listing)` | Chuẩn hóa listing game thành tên, mô tả, icon, giá và số lượng cho dashboard |
| `getAccountFingerprint` | `(line_uid)` | Sinh fingerprint trình duyệt ổn định theo tài khoản |
| `naturalCoordNoise` | `(base, maxRange = 18)` | Thêm nhiễu tọa độ tự nhiên để giảm dấu hiệu bot |
| `logNormalActInterval` | `(minMs = 90000, maxMs = 450000)` | Sinh khoảng thời gian act theo phân phối gần log-normal |
| `checkAndRecoverZombieBots` | `()` | Phát hiện poll bị treo và khởi động lại bot zombie |
| `ProxyPool` | `class ProxyPool` | Quản lý proxy, dispatcher, phân tải và failover tài khoản |
| `BotInstance` | `class BotInstance` | State machine và automation engine của một tài khoản game |

#### `ProxyPool`

| Method | Signature | Purpose |
|---|---|---|
| `ProxyPool.parseProxyInput` | `(url, type, label)` | Chuẩn hóa URI hoặc chuỗi `IP:PORT[:USER:PASS]` |
| `testProxyConnection` | `async (url)` | Kiểm tra kết nối và IP outbound của proxy/direct |
| `checkAndRecoverProxies` | `async ()` | Thử phục hồi proxy inactive theo chu kỳ |
| `rebalance` | `()` | Phân phối lại bot theo sức chứa proxy |
| `assignBot` | `(line_uid, preferredProxyId)` | Gán dispatcher cho tài khoản, ưu tiên proxy chỉ định |
| `forceAssignBot` | `(line_uid, proxyId)` | Ép tài khoản sang một proxy/direct cụ thể |
| `failoverAssignment` | `(line_uid, failedProxyId)` | Chuyển bot khỏi proxy vừa lỗi |
| `releaseBot` | `(line_uid)` | Xóa assignment khi bot dừng/xóa |
| `getDispatcher` | `(line_uid)` | Lấy Undici dispatcher theo assignment |
| `getDispatcherForBot` | `(line_uid)` | Alias rõ nghĩa cho `getDispatcher` |
| `addProxy` | `(label, url)` | Thêm proxy vào pool và lưu cấu hình |
| `updateProxy` | `(id, fields)` | Cập nhật metadata/trạng thái proxy |
| `deleteProxy` | `(id)` | Xóa proxy và chuyển các bot liên quan |
| `getStats` | `()` | Trả thống kê pool cho admin UI |
| `getBotProxyInfo` | `(line_uid)` | Trả proxy/IP đang dùng của một bot |
| `getSettings` | `()` | Trả bản sao settings proxy/backup |
| `updateSettings` | `(settings)` | Merge và lưu settings proxy/backup |

#### `BotInstance`

| Method | Signature | Purpose |
|---|---|---|
| `refreshSession` | `async ()` | Đổi PHP session thành game token mới qua proxy của bot |
| `triggerActFlag` | `()` | Buộc poll kế tiếp gửi tín hiệu hoạt động |
| `updatePlayerState` | `(newPlayer)` | Merge snapshot game và giữ lại các cold fields không luôn có trong poll |
| `getDefaultSettings` | `()` | Tạo settings automation mặc định và giá trị migration |
| `updateSettings` | `(newSettings)` | Merge settings, xử lý side effect và lưu account |
| `addLog` | `(type, msg)` | Ghi log vòng đời/automation có giới hạn bộ nhớ |
| `addLootLog` | `(msg)` | Ghi loot log và cập nhật thống kê farm |
| `getCombatRates` | `()` | Tính kill/gold/EXP/nguyên liệu theo phút từ cửa sổ gần nhất |
| `warpToMap` | `async (mapId)` | Gửi yêu cầu dịch chuyển đến map |
| `warpToNextMvpMap` | `async ()` | Chuyển sang map kế tiếp trong chu kỳ săn MVP |
| `enterEventMode` | `(kind, mapId)` | Lưu cấu hình farm và chuyển state sang event |
| `exitEventMode` | `()` | Khôi phục cấu hình/map sau event |
| `joinGuildWar` | `async ()` | Tham gia bang chiến |
| `enterGuildDungeon` | `async (isTeam = false)` | Vào phụ bản bang solo hoặc theo đội |
| `exitGuildDungeon` | `async ()` | Thoát phụ bản và reset state liên quan |
| `joinCountryWar` | `async ()` | Tham gia quốc chiến |
| `fetchWarLog` | `async ()` | Đồng bộ lịch sử event war hiện hành |
| `start` | `()` | Khởi động vòng poll/automation của bot |
| `stop` | `(status = 'idle')` | Dừng timer và chuyển trạng thái bot |
| `triggerImmediatePoll` | `()` | Hủy timer chờ và chạy poll ngay |
| `sendRequest` | `async (url, payload)` | Gửi request game với token, cookie, fingerprint và dispatcher |
| `syncOfflineZones` | `async (mapId, zoneIndices)` | Lưu lựa chọn zone offline lên game |
| `processOfflineReward` | `(offlineReward)` | Chuẩn hóa và lưu lịch sử phần thưởng offline |
| `sendCheckinGuardWithRetry` | `async (maxAttempts = 3)` | Gửi guard/check-in với retry có giới hạn |
| `triggerMvpCycle` | `(forced = false)` | Bắt đầu hoặc ép chạy chu kỳ săn MVP |
| `updateMvpCycleStatus` | `async ()` | Cập nhật tiến độ map/boss của chu kỳ MVP |
| `pollGame` | `async ()` | Poll snapshot game, cập nhật state và lập lịch lượt tiếp theo |
| `runAutomation` | `async ()` | Điều phối heal, nâng cấp, farm, event, boss, home/pet và action tự động |
| `scanAndBuyMarket` | `async ()` | Quét chợ và mua listing phù hợp rule/giới hạn |

#### HTTP surface

| Route group | Purpose |
|---|---|
| `/api/auth/*` | Login, logout và đọc session dashboard |
| `/api/admin/users*` | CRUD user, quota, hạn dùng, quyền chợ, poll interval và proxy |
| `/api/admin/proxies*` | CRUD/test/verify proxy và cấu hình pool/backup |
| `/api/admin/backup-*`, `/api/admin/restore-upload` | Backup Telegram/tải file và restore dữ liệu |
| `/api/admin/maps*` | Đọc, đồng bộ và sửa metadata map/zone |
| `/api/announcements*` | Đọc hoặc quản trị thông báo |
| `/api/add-by-phpsessid`, `/api/auto-add-account` | Tạo account từ PHPSESSID/flow đăng nhập |
| `/api/accounts*` | CRUD, reorder, start/stop, status, logs và settings tài khoản |
| `/api/accounts/:line_uid/action` | Gateway action tổng quát từ dashboard đến game |
| `/api/accounts/:line_uid/market/*` | Listing, inventory bán, mua, bán, hủy và lịch sử chợ |
| `/api/accounts/:line_uid/trade` | Điều phối phiên giao dịch trực tiếp giữa người chơi |
| `/api/team/sync` | Đồng bộ cấu hình và trạng thái nhiều đội |
| `/play`, `/battle`, `/login-helper` | Tạo client game có session hiện tại |
| `/xhrpg_*.php`, `/assets/*`, `/css/*`, `/js/*` | Proxy/redirect request và asset sang server game chính thức |
| `/ping` | Health check chống sleep |

### `public/app.js`

Client dashboard dạng script toàn cục. Phần lớn code nằm trong callback `DOMContentLoaded`; các handler gắn vào `window` vì được gọi từ HTML render động.

| Function | Signature | Purpose |
|---|---|---|
| `checkAuth` | `async ()` | Xác thực session và chuyển giữa login/dashboard |
| `fetchAccounts` | `async ()` | Poll danh sách account cùng trạng thái bot |
| `renderAccounts` | `(accounts)` | Nhóm và render toàn bộ account cards |
| `buildCardSkeleton` | `(cardEl, acc)` | Tạo DOM cố định của một account card |
| `updateCard` | `(acc)` | Patch dữ liệu live vào card để tránh rebuild DOM |
| `populateMapSelect` | `(acc)` | Nạp map hợp level và cấu hình hiện tại |
| `populateZoneSelect` | `(acc)` | Nạp zone của map đang chọn |
| `renderStatsList` | `(acc)` | Render chỉ số nhân vật |
| `renderCombatSummary` | `(acc)` | Render tốc độ farm theo đơn vị thời gian |
| `renderWeaponTab` | `(acc)` | Render vũ khí, module, đạn và card socket |
| `renderCardBook` | `(acc)` | Render bộ sưu tập/thao tác thẻ bài |
| `renderEggBook` | `(acc)` | Render trứng và thao tác ấp pet |
| `updateHomeTabUI` | `(acc)` | Render trạng thái ruộng, seed và nâng cấp nhà |
| `renderPetSection` | `(acc)` | Render pet hiện tại, EXP và stat upgrade |
| `renderMarketCategoryAccordion` | `(acc)` | Render rule mua tự động theo nhóm vật phẩm |
| `renderMarketBuyHistory` | `(acc)` | Render lịch sử auto/manual market buys |
| `loadTradeInventory` | `async (uid)` | Tải inventory và trạng thái trade của account |
| `tradeTickStart` | `(uid)` | Khởi động timer refresh trade popup |
| `tradeBuildBodyHtml` | `(uid, state)` | Dựng phần thân UI giao dịch |
| `fetchLogs` | `async (uid)` | Tải bot logs định kỳ |
| `renderEventWarHistory` | `(uid)` | Render lịch sử bang chiến/quốc chiến |
| `computeBossStats` | `(log)` | Tổng hợp thời lượng, damage và hiệu suất boss fight |
| `renderBossLog` | `(uid, log)` | Render battle log và thống kê boss |
| `fetchAdminStats` | `async ()` | Tải số liệu tổng quan admin |
| `fetchAdminUsers` | `async ()` | Tải user cho bảng quản trị |
| `fetchAdminProxies` | `async ()` | Tải proxy pool và settings backup |
| `fetchAdminMapsZones` | `async ()` | Tải metadata map/zone cho admin |
| `fetchAnnouncements` | `async ()` | Tải thông báo còn hiệu lực cho user |
| `initDragAndDrop` | `(container)` | Bật kéo-thả account card |
| `saveNewAccountOrder` | `async (container)` | Gửi thứ tự card mới lên server |

Các nhóm handler `window.*` đáng chú ý: quản trị user/proxy/backup; chuyển tab; thay đổi bot settings; điều khiển map/zone/MVP/event; market live/buy/sell/history; home/pet/card/egg; multi-team; và trade invite/lock/confirm/cancel.

### `public/index.html`

Khung DOM của dashboard: login, header, account grid, modal account/user/proxy/backup/market/trade và template UI liên quan. Tải `public/app.css` và `public/app.js`; mọi business logic nằm trong `app.js`.

### `public/app.css`

Theme space-dark, responsive layout và component styles cho dashboard, cards, tab, modal, market, battle/event log, weapon/module, home/pet và trade UI.

### Game client pages

| File | Public functions | Purpose |
|---|---|---|
| `play.html` | `startGame(player, token, offlineReward)`, `triggerManualHeal(event)` | Client treo máy tối giản qua gateway nội bộ |
| `play_battle.html` | `startGame(...)`, `updateBossTable(...)`, `updatePkTable(...)`, `setManualTarget(...)`, `cancelTarget()`, `initActiveHeal()` | Client chiến đấu có radar boss/PK, target thủ công và active heal |
| `game_index.html` | `doLogin()`, `startGame(player, token, offlineReward)` | Snapshot trang gốc dùng để đối chiếu flow LIFF/game |

### `test.js`

Một async IIFE dùng `node:assert`, import public surface từ `server.js` và chạy regression suite tuần tự. Phạm vi chính: công thức nâng cấp, password/expiry, act jitter, map discovery, cold-field merge, event/MVP/guild dungeon, market formatting, proxy parsing/failover, team sync, polling permissions, anti-detection, zombie watchdog, session renewal, weapon/module/card và offline mechanics.

Chạy bằng:

```powershell
npm test
```

### Reference documentation

| File | Purpose |
|---|---|
| `game_api_reference.md` | Tra endpoint/payload game, công thức nâng cấp, home/pet/player inspect/market |
| `battle_radar_walkthrough.md` | Luồng dữ liệu và cách kiểm tra battle radar/PK cache |
| `project_analysis_report.md` | Tổng quan kiến trúc, tech stack, quyết định và workflow |
| `project_summary.md` | Nhật ký tính năng đã hoàn thành và roadmap |

## Notes

- `server.js` và `public/app.js` đang gánh nhiều miền nghiệp vụ; khi tách module, cập nhật từng section tương ứng thay vì tạo lại toàn bộ map.
- `BotInstance.pollGame()` và `BotInstance.runAutomation()` là hai điểm điều phối có blast radius lớn nhất; thay đổi ở đây cần chạy toàn bộ `npm test`.
- Persistence hiện là JSON file với debounce cho account writes; dữ liệu auth/account/proxy không được commit và không nên ghi nội dung vào tài liệu.
- Request game phải đi qua `BotInstance.sendRequest()`/dispatcher tương ứng để giữ token, PHPSESSID, fingerprint và proxy nhất quán.
- `xhrpg_canvas.js` là script tải động được `.gitignore` loại trừ; chỉ xem nó như dependency runtime, không phải source do dự án sở hữu.
