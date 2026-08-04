# TASKS.md

> Work Breakdown Structure. Update task states immediately upon changes.
> Statuses: todo | doing | blocked | review | done

### [x] T55 - Nâng cấp & Sửa lỗi Chức năng Săn Boss MVP (Tốc độ, Toggle, Log Accuracy & HP Priority)
- Description: Giải quyết triệt để 3 vấn đề lớn trong luồng săn Boss MVP: (1) Sửa lỗi kẹt deadlock map do warp thất bại hoặc map vượt level nhân vật; (2) Tối ưu tốc độ xác nhận map sạch boss từ 10-12s xuống 1-2s (1 poll) khi bosses là []; (3) Thêm công tắc UI `autoMvpCycle` và tiêu chí ưu tiên Boss ít % HP nhất (`hp_asc`); (4) Sửa lỗi thông báo log nhầm lẫn giữa "Không có Boss" và "Đã dọn sạch Boss" khi diệt 0 boss.
- Files related: `server.js`, `public/app.js`, `test.js`
- Acceptance criteria:
  - [x] Sửa lỗi deadlock kẹt map: Tự động bỏ qua map vượt quá level (`mapDef.req`) hoặc warp không thành công sau 8 polls (16s).
  - [x] Giảm ngưỡng `mvpConfirmClearCount` từ 5 xuống 1 poll khi `this.bosses` đã tải xong (`!= null`), rút ngắn thời gian chuyển map trống từ 10-12s xuống 1-2s.
  - [x] Đưa `await` vào tất cả các lệnh gọi `warpToMap()` trong `updateMvpCycleStatus()`.
  - [x] Cập nhật `this.player.map` ngay lập tức trong `warpToMap()` và reset cache `spots` / `bosses`.
  - [x] Bổ sung cờ `autoMvpCycle` vào `defaultSettings` và thêm công tắc `🔄 Auto Xoay Map Săn Boss` trên giao diện Dashboard.
  - [x] Bổ sung thuật toán sắp xếp `hp_asc` trong `pollGame()` và ô chọn `🩸 Ít máu nhất (HP % thấp nhất)` trên frontend.
  - [x] Sửa thông báo log: Kiểm tra `killedCount`, phân biệt chính xác `Không có Boss mục tiêu tại Map X` (0 boss diệt) vs `Đã dọn sạch Boss (Đã diệt N Boss) tại Map X`.
  - [x] Cập nhật Sub-tab Nhật ký Boss Hunt Journal render thẻ xám `🔍 Không có Boss` khi diệt 0 boss.
  - [x] Bổ sung các unit test mới trong `test.js` và chạy vượt qua 100% test cases (`npm test`).
- Status: done

---

### [x] T54 - Tối ưu hóa & Khắc phục lỗi Luồng Săn Boss MVP
- Description: Khắc phục lỗi chuyển map sớm khi chưa diệt hết boss (race condition do `bosses=null`), lỗi báo boss chết ảo khi bot warp map hoặc reset mục tiêu, và phân biệt chính xác bot hạ gục boss hay bị người khác cướp thông qua cờ `is_mvp`. Đồng thời, tối ưu hóa định tuyến bản đồ (Map Routing) ngay đầu nhịp poll để bot di chuyển đúng theo chu kỳ bản đồ cấu hình, không bị farm quái/đánh boss sai bản đồ.
- Files related: `server.js`, `public/app.js`, `test.js`
- Acceptance criteria:
  - [x] Thêm biến trạng thái `weKilledCurrentMvp` và reset im lặng khi nhân vật đổi map.
  - [x] Reset `mvpConfirmClearCount = 0` nếu `this.bosses` là null (đang tải danh sách boss).
  - [x] Ép buộc fetch full payload (`isFull = 1`) khi `this.bosses` là null để tải danh sách boss ngay lập tức khi sang map mới.
  - [x] Trích xuất cờ kết liễu `e.is_mvp` từ sự kiện `kill` của game server và gắn `weKilledCurrentMvp = true`.
  - [x] Ghi nhận log xanh `SUCCESS` khi tự kết liễu, ngược lại ghi log đỏ `WARNING` và bắn sự kiện `boss_lost` về client khi boss bị cướp.
  - [x] Di chuyển logic kiểm tra định tuyến bản đồ (Map Routing) lên đầu nhịp poll (phát hiện lệch map ➔ warp và return sớm để chờ nhịp sau).
  - [x] Bổ sung cờ `isCorrectMvpMap` và `canRunAutoZone` để khóa hoạt động săn boss và di chuyển zone khi đứng sai bản đồ.
  - [x] Cập nhật UI Timeline để hiển thị icon `❌ Mất dấu Boss` sinh động.
  - [x] Viết unit tests tự động xác minh và kiểm thử thành công (4 test cases).
- Status: done

---

### [doing] T53 - Đánh giá & Test Flag Bypass Home Warp (bypassHomeWarp)
- Description: Đánh giá xem bot có cần phải warp vào Map 5 (Nông Trại) trước khi gọi API home_harvest/home_plant/home_up không. Triển khai flag thử nghiệm `bypassHomeWarp` cho phép bot thực thi nông vụ ngay tại bản đồ hiện tại, bỏ qua 2–3 nhịp poll warp đi/về.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Phân tích code — xác nhận 3 API nông trại không truyền tham số map vào request body.
  - [x] Lập tài liệu phân tích `home_farm_analysis.md` trình bày 2 phương án.
  - [x] Thêm setting `bypassHomeWarp: false` vào `defaultSettings`.
  - [x] Sửa logic Map Routing (Step 6): khi `bypassHomeWarp=true` bỏ qua warp cưỡng bức, giữ nguyên logic thoát Map 5 nếu bị kẹt.
  - [x] Sửa điều kiện Step 8: `(isAtHome || bypassHomeWarp)` — chạy harvest/plant/upgrade tại bất kỳ map nào.
  - [x] Thêm toggle **⚡ Bypass Warp** vào tab 🏡 Nông Trại trên Dashboard + sync trạng thái.
  - [x] `node -c server.js`, `node -c public/app.js` → PASS 100%.
  - [ ] **TEST THỰC TẾ**: Bật flag trên 1 bot đang farm → Quan sát log để xác nhận game server có check map không.
  - [ ] Nếu test PASS → đổi default `bypassHomeWarp: true` để áp dụng toàn bộ.
- Status: doing
- Notes:
  - Logic guard bên trong Step 8 vẫn đúng: chỉ harvest khi có cây chín, chỉ plant khi còn hạt giống và đất trống.
  - Khi `bypassHomeWarp=true` mà bot đang bị kẹt ở Map 5: logic `isAtHome && !hasPendingHomeAction` vẫn chạy để warp thoát về bình thường.

---

### [x] T52 - Sửa lỗi chức năng Bơm Potion tự động (HP Threshold)
- Description: Thay thế ô nhập số tự do không hợp lệ bằng dropdown select các mốc hồi máu từ 30% đến 90% (bước nhảy 10%), đồng thời sửa lỗi sai lệch ID phần tử DOM và bổ sung cơ chế đồng bộ trạng thái cấu hình về giao diện.
- Files related: `public/app.js`
- Acceptance criteria:
  - [x] Đổi ô nhập Potion tự do sang `<select>` với ID chuẩn `sel-auto-potion-threshold-${uid}`.
  - [x] Thêm các mốc hồi máu 30%, 40%, 50% (mặc định), 60%, 70%, 80%, 90% trong dropdown.
  - [x] Đồng bộ giá trị cấu hình Potion từ backend về dropdown ở giao diện trong `updateCard`.
  - [x] Đã kiểm thử thao tác cập nhật hoạt động tốt qua API.
- Status: done

### [x] T51 - Đánh giá chức năng Nông trại & Sửa lỗi đè trạng thái
- Description: Biên soạn báo cáo đánh giá chức năng Nông trại (Home Farm), sửa đổi cài đặt auto mặc định về false để đảm bảo an toàn, đồng thời khắc phục lỗi mất dữ liệu trạng thái nông nghiệp khi nhận sparse update từ game server.
- Files related: `server.js`, `test.js`
- Acceptance criteria:
  - [x] Lập báo cáo đánh giá hệ thống nông trại (home_evaluation_report.md).
  - [x] Triển khai hàm `updatePlayerState()` để bảo toàn cold fields khi cập nhật trạng thái nhân vật.
  - [x] Chuyển đổi mặc định của các cấu hình `autoHomeHarvest` và `autoHomePlant` thành `false`.
  - [x] Viết unit test tự động xác minh và kiểm thử thành công.
- Status: done

### [x] T50 - Chức năng thông báo của Admin tới các User
- Description: Xây dựng hệ thống thông báo hiển thị banner thông tin (Info, Success, Warning, Critical) trên giao diện Dashboard của người dùng, tích hợp tab quản lý thông báo của Admin cho phép tạo và xóa thông báo.
- Files related: `server.js`, `public/index.html`, `public/app.css`, `public/app.js`
- Acceptance criteria:
  - [x] Backend: Hỗ trợ load/save `announcements.json` và tích hợp `announcements.json` vào file zip backup/restore.
  - [x] Backend API: Thêm endpoint `GET /api/announcements`, `POST /api/admin/announcements`, và `DELETE /api/admin/announcements/:id`.
  - [x] Giao diện Admin: Thêm tab "📢 Thông Báo" cho phép Admin xem danh sách các thông báo đã gửi, tạo thông báo mới với các phân loại và xóa thông báo.
  - [x] Giao diện Dashboard User: Hiển thị các thông báo ở vị trí nổi bật phía trên lưới tài khoản dưới dạng banner thiết kế premium.
  - [x] Chức năng đóng thông báo: Khi người dùng bấm tắt thông báo, ID thông báo được lưu vào localStorage của trình duyệt để không hiển thị lại ở các phiên làm việc tiếp theo.
  - [x] Đã kiểm thử cú pháp và unit tests chạy thành công.
- Status: done

### [x] T49 - Tự động hóa dịch chuyển Nông Trại và phân luồng ưu tiên
- Description: Tự động hóa việc dịch chuyển nhân vật vào/ra Nông trại (Map 5) để thực hiện các nông vụ (thu hoạch, trồng trọt, nâng cấp nhà) và thiết lập thứ tự ưu tiên: Săn Boss (MVP/Arena) > Làm vườn (Home Farm) > Farm thường.
- Files related: `server.js`
- Acceptance criteria:
  - [x] Tự động phát hiện có nông vụ cần xử lý (cây chín, đất trống có hạt giống, đủ tài nguyên nâng cấp nhà).
  - [x] Tự động dịch chuyển nhân vật vào Map 5 để làm việc, và tự động rời khỏi Map 5 khi hoàn thành.
  - [x] Không reset cấu hình Farm Zone của người dùng khi đi vào/ra Map 5.
  - [x] Ưu tiên đánh Boss MVP hàng đầu, chỉ làm nông nghiệp khi không săn Boss, và chỉ farm thường khi rảnh rỗi.
  - [x] Chạy unit test thành công.
- Status: done

### [x] T48 - Vấn đề Trứng Thú Cưng (Pet Eggs) chưa hiển thị / chưa giải quyết
- Description: Tạm thời lưu vết vấn đề danh sách Trứng Thú Cưng (Pet Eggs) trong kho chưa đồng bộ/chưa hiển thị đầy đủ theo phản hồi từ người dùng để tiếp tục nghiên cứu và xử lý ở phiên làm việc tiếp theo.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Nghiên cứu thêm cơ chế trả về dữ liệu `eggs` từ game server (API `xhrpg_game.php` / `xhrpg_pet.php` / `xhrpg_egg.php`).
  - [x] Đảm bảo dữ liệu trứng trong kho được bóc tách và hiển thị chuẩn danh sách các loại trứng.
- Status: done



### [x] T27 - Tự động hóa đồng bộ game script và dịch log tiếng Việt tự động
- Description: Tự động tải file game script (xhrpg_canvas.js) mới nhất từ server game để cập nhật map/zone/skill khi khởi động hoặc đồng bộ, đồng thời tự động dịch log combat và nhặt đồ từ tiếng Thái sang tiếng Việt.
- Files related: `server.js`
- Acceptance criteria:
  - [x] Hàm `syncMapsAndZonesFromGame()` tự động tải và ghi đè `xhrpg_canvas.js` trên local trước khi parse.
  - [x] Đã thiết lập chạy tự động đồng bộ khi khởi động Express Server.
  - [x] Chuyển đổi route `/api/admin/sync-maps-zones` thành bất đồng bộ.
  - [x] Định nghĩa hàm dịch thuật `translateThaiText(msg)` kết hợp duyệt từ điển `viDict` sắp xếp theo độ dài từ khóa giảm dần kết hợp regex thay thế từ phổ biến.
  - [x] Các hàm `addLog()` và `addLootLog()` của class `BotInstance` tự động gọi hàm dịch trước khi ghi log.
  - [x] Bổ sung vá lỗi DOM và thay thế proxy script cho cả khối catch fallback của `/play` (khi fetch `index.php` lỗi).
  - [x] Hỗ trợ tiền tố `/human` cho toàn bộ endpoint JS và proxy PHP.
  - [x] Thêm định tuyến `app.all('/cdn-cgi/*', ...)` để proxy hóa toàn bộ luồng Turnstile Challenge của Cloudflare, tránh trả về HTML lỗi.
  - [x] Cấu hình ghi đè tệp `xhrpg_canvas.js` và `sdk.js` local làm dự phòng mỗi khi `fetchGameAsset` tải thành công từ máy chủ game (Self-healing).
  - [x] Chạy `npm test` thành công 100%.
- Status: done

### [x] T26 - Tái cấu trúc Bảng điều khiển: Gộp tab Log (chia sub-tab Hoạt động & Vật phẩm), thu gọn mặc định, giảm font size, hiển thị stats /h và /d
- Description: Thực hiện cải tiến giao diện theo yêu cầu của người dùng: thu gọn các tab mặc định để tối ưu không gian, gộp tab Vật Phẩm và Nhật Ký thành một tab duy nhất tên là Log (chia làm 2 sub-tabs Hoạt Động & Vật Phẩm), giảm 20% cỡ chữ log rơi đồ, và hỗ trợ xem thống kê hiệu suất theo giờ (/h) và ngày (/d) khi click/hover dải chỉ số.
- Files related: `public/app.js`, `public/app.css`
- Acceptance criteria:
  - [x] Thẻ tài khoản khi tải trang có các tab đều thu gọn (không có tab nào mở mặc định). Click tab đang mở sẽ đóng lại.
  - [x] Bỏ hoàn toàn khoảng trống thừa ở cuối thẻ khi các tab thu gọn bằng cách đặt container `.card-tab-content` thành `display: none` mặc định.
  - [x] Gộp 2 tab Vật Phẩm và Nhật Ký thành tab Log duy nhất.
  - [x] Thiết lập 2 sub-tabs (Hoạt Động, Vật Phẩm) sử dụng lớp `.subtab-btn`, mặc định mở sub-tab Hoạt Động.
  - [x] Log rơi đồ có kích thước chữ nhỏ hơn 20% (font-size 0.6rem) so với log hoạt động chung.
  - [x] Dải chỉ số quái, vàng, exp có thể chuyển đổi hiển thị giữa `/m`, `/h`, `/d` bằng cách click trực tiếp, đồng thời hiển thị đầy đủ cả 3 đơn vị trong tooltip khi di chuột qua.
  - [x] Toàn bộ test case trong `test.js` chạy thành công.
- Status: done

### [x] T25 - Đồng Bộ Bản Đồ & Zone Xuống Bảng Điều Khiển Sau Passive Discovery
- Description: Sau khi hệ thống Passive Map Discovery ghi nhận Map mới vào `maps_cache.json`, dropdown Bản đồ trên Dashboard không được cập nhật vì `GET /api/accounts` chưa trả về `mapsList`. Đồng thời Zone dropdown hiển thị trống do không có fallback vào `spotsCache`. Và `changeTargetMap()` vẫn dùng hardcode `MAP_REQS`/`MAP_NAMES` cố định 6 bản đồ.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Backend: Bổ sung trường `mapsList: getMapDefs()` vào response `GET /api/accounts` để frontend luôn nhận danh sách bản đồ mới nhất từ cache.
  - [x] Backend: Bổ sung trường `cachedSpots: spotsCache[bot.player.map]` vào response để frontend có dữ liệu zone ngay cả khi `bot.spots` chưa kịp load lại.
  - [x] Frontend `populateZoneSelect()`: Ưu tiên `acc.spots` (live từ bot) → fallback `acc.cachedSpots` (từ spotsCache persist) → hiện `⏳ Chờ tải...`.
  - [x] Frontend `changeTargetMap()`: Xóa bỏ `MAP_REQS`/`MAP_NAMES` hardcode 6 map. Thay bằng lookup động từ `window.cachedMapsList` — bản đồ mới tự động được kiểm tra cấp độ và hiển thị tên đúng.
  - [x] Test: `npm test` → PASS 100% (15 unit tests pass).
- Status: done


- Description: Xây dựng cơ chế Passive Map Discovery trong pollGame() để tự động ghi nhận các Map ID mới (dành cho người chơi cũ/mới) từ gói d.spots mà không phát sinh thêm bất kỳ request giả lập nào. Bổ sung API cho phép Admin chỉnh sửa tên, emoji và cấp độ yêu cầu của từng Map.
- Files related: `server.js`, `public/index.html`, `public/app.js`, `maps_cache.json`, `test.js`
- Acceptance criteria:
  - [x] Hàm `processPassiveMapDiscovery(mapId, spotsObj)` tự động phân tích `d.spots` của bất kỳ bot nào (cũ/mới), phát hiện Map ID mới và lưu an toàn vào `maps_cache.json`.
  - [x] Tự động tính toán cấp độ tối thiểu (`req`) của Map mới dựa trên level của các Zone trong map đó.
  - [x] Bổ sung endpoint `PUT /api/admin/maps/:id` cho phép Admin tùy chỉnh tên hiển thị và emoji của từng bản đồ.
  - [x] Đảm bảo 0% rủi ro bị game server quét anti-bot (không gửi request dò ID bừa bãi).
- Status: done

### [x] T23 - Đồng Bộ Bản Đồ & Zone Thủ Công Từ Admin UI
- Description: Xây dựng tab "🗺️ Bản Đồ & Zone" trên Admin UI cho phép Admin chủ động bấm nút cập nhật/quét bản đồ và zone mới từ game server, lưu cache maps_cache.json và spots_cache.json, đồng bộ tức thì lên UI cho tất cả các tài khoản bot.
- Files related: `server.js`, `public/index.html`, `public/app.js`, `public/app.css`, `maps_cache.json`, `spots_cache.json`, `test.js`
- Acceptance criteria:
  - [x] Nút "🔄 Quét & Đồng Bộ Bản Đồ / Zone Ngay" trong Admin Panel gửi request POST `/api/admin/sync-maps-zones`.
  - [x] Backend tự động bóc tách `MAP_DEFS` từ client script (`xhrpg_canvas.js`), dịch tên tiếng Việt từ `xhrpg_lang_vi.js`, lưu vào `maps_cache.json`.
  - [x] Hệ thống gom nhóm và lưu vết zone (`d.spots`) của từng map vào `spots_cache.json`.
  - [x] Backend và Frontend dùng `getMapDefs()` để render động dropdown bản đồ (`#sel-map`), tự nhận biết map mới mà không cần hardcode.
  - [x] Bảng Admin hiển thị thông tin chi tiết: ID, tên map, emoji, req level, số lượng zone (spots) đã cache và thời gian đồng bộ gần nhất.
- Status: done

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

### [x] T22 - Character Tab UI Refinement & Layout Fix
- Description: Refactor Character Tab UI into sub-tabs (`📊 Chỉ Số & Tiềm Năng` & `⚡ Kỹ Năng & Auto`), fix layout overflow issue in Capture.PNG by replacing `.settings-group` with `.char-section-block`, and move `👤 Nhân Vật` tab before `Vật Phẩm` tab.
- Files related: `public/app.js`, `public/app.css`
- Acceptance criteria:
  - Sub-tabs separate stats allocation and skill management cleanly.
  - Section titles sit on 100% full-width header rows.
  - Stat cards (STR, AGI, VIT, INT, DEX, LUK) lay out evenly in 3 columns without overflowing card boundaries.
  - Tab `👤 Nhân Vật` ordered before `Vật Phẩm`.
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

### [x] T17 - Đồng bộ Bản đồ di chuyển và Khu vực farm (Zone)
- Description: Khắc phục lỗi bất đồng bộ giữa bản đồ di chuyển và danh sách zone hiển thị trên giao diện, đặc biệt khi bot đang dừng hoặc gặp lỗi di chuyển.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Cập nhật hàm `changeTargetMap` phía frontend chỉ gọi hành động `warp` thủ công thay vì lưu targetMap qua API trước, giúp tránh lưu sai bản đồ khi lệnh di chuyển thất bại (ví dụ do level_locked).
  - [x] Khi thực hiện warp thủ công thành công, backend cập nhật `targetMap = mapId` và tự động kích hoạt `autoMap = true`.
  - [x] Nếu phát hiện thay đổi bản đồ trong tiến trình warp thủ công (kể cả khi bot đang dừng/offline), tự động kích hoạt tiến trình tải ngầm (background fetch) danh sách spots/zones mới của bản đồ đó từ game server.
  - [x] Giúp giao diện dropdown Zone tự động tải lại và hiển thị chính xác các khu vực farm của bản đồ mới ngay lập tức.
- Status: done

### [x] T18 - Tối ưu hóa tập trung săn Boss MVP (Tạm dừng nâng cấp)
- Description: Tạm dừng toàn bộ các tác vụ tự động nâng cấp và đấu trường khi đang nhắm mục tiêu Boss MVP để bot dồn 100% tài nguyên và lượt poll vào việc di chuyển/tấn công Boss.
- Files related: `server.js`
- Acceptance criteria:
  - [x] Tạo thuộc tính `this.targetedMvp` trên lớp `BotInstance` để theo dõi trạng thái nhắm mục tiêu Boss toàn cục.
  - [x] Gán `this.targetedMvp = true` khi phát hiện Boss MVP thỏa mãn điều kiện lọc và bắt đầu di chuyển săn Boss.
  - [x] Chèn khối kiểm tra đầu hàm `runAutomation()`, nếu `this.targetedMvp` là `true`, dừng thực thi hàm ngay lập tức (skip toàn bộ việc nâng Stats, Armor, Skills, Companion, Mines, Arena và Map Warp).
  - [x] Khi Boss bị tiêu diệt hoặc rời khỏi map, tự động khôi phục lại toàn bộ chu trình nâng cấp tự động.
- Status: done

### [x] T19 - Tạm thời vô hiệu hóa các chức năng tự động nâng cấp (Chờ phát triển)
- Description: Tạm thời vô hiệu hóa các tác vụ tự động nâng cấp (Stats, Giáp, Kỹ năng, Companion, Mỏ khai thác) để tối ưu hóa hiệu suất chạy bộ/săn boss, lưu tài liệu để hoàn thiện sau này.
- Files related: `server.js`
- Acceptance criteria:
  - [x] Khai báo cờ cấu hình `const enableUpgrades = false` ở đầu hàm `runAutomation()`.
  - [x] Bao bọc 5 nhóm tác vụ tự động nâng cấp (Stats, Giáp, Kỹ năng, Companion, Mỏ) trong khối điều kiện `if (enableUpgrades)`.
  - [x] Đảm bảo các tác vụ di chuyển (Map Warp) và đấu trường (Arena) vẫn hoạt động bình thường.
  - [x] Ghi nhận quyết định tạm dừng này vào tài liệu kỹ thuật để tiếp tục triển khai khi cần thiết.
- Status: done

### [x] T20 - Sửa lỗi lưu tiêu chí săn Boss & Thêm nhật ký đi săn MVP
- Description: Sửa lỗi bất đồng bộ định dạng tên DOM ID của các trường cài đặt Boss mới (camelCase sang hyphen-case) làm không lưu được dữ liệu, đồng thời bổ sung thông tin chi tiết vào nhật ký hoạt động khi bắt đầu, đang chiến đấu và kết thúc săn Boss MVP.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Cấu hình lại bộ phân giải DOM ID trong `updateNumericSetting` và `updateStringSetting` để chuyển đổi camelCase (như `mvpPriorityMode`) sang hyphen-case (như `mvp-priority-mode`) một cách chuẩn xác.
  - [x] Khai báo thuộc tính `this.lastTargetedBossId` để ghi nhận Boss mục tiêu đang được săn.
  - [x] Bổ sung log bắt đầu săn Boss ngay khi phát hiện mục tiêu mới thỏa mãn bộ lọc.
  - [x] Bổ sung log trạng thái tấn công Boss định kỳ khi tiếp cận gần.
  - [x] Bổ sung log hoàn thành/mất dấu khi chuyển đổi trạng thái về hoạt động tự động.
- Status: done

### [x] T21 - Triển khai tab Nhật ký Vật phẩm (Loot Logs) riêng biệt
- Description: Tách biệt hoàn toàn nhật ký nhặt đồ (thẻ bài, trứng, trang bị, nguyên liệu...) ra khỏi nhật ký hoạt động chung để giúp người dùng dễ dàng theo dõi thành quả treo máy mà không bị trôi thông tin.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Khởi tạo mảng `this.lootLogs = []` giới hạn 200 bản ghi trong `BotInstance` của `server.js`.
  - [x] Bổ sung helper `addLootLog(msg)` để lưu vết đồ nhặt được kèm timestamp.
  - [x] Viết regex và điều kiện nhận diện sự kiện loot ở backend (`pollGame()`) dựa trên Emoji và từ khóa đặc trưng.
  - [x] Cập nhật API `/logs` trả về đối tượng gồm cả `logs` và `lootLogs`.
  - [x] Thiết kế tab **Vật Phẩm** và khung hiển thị `pane-loot` trong giao diện card tài khoản ở `public/app.js`.
  - [x] Nâng cấp hàm `fetchLogs()` để tải dữ liệu cho cả hai khung terminal và bổ sung hiệu ứng tô màu nổi bật (Highlight) cho các vật phẩm quý hiếm (Thẻ bài, Trứng, Trang bị).
- Status: done

### [x] T22 - Sửa lỗi không cập nhật mục 'Bản đồ di chuyển' khi dịch chuyển bản đồ
- Description: Đồng bộ `targetMap` trong `settings` ở cả Backend và Frontend khi bấm dịch chuyển bản đồ, đảm bảo dropdown select luôn hiển thị đúng bản đồ đã chọn.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Khi người dùng chọn bản đồ trong dropdown "Bản đồ di chuyển", backend cập nhật `bot.settings.targetMap = Number(target_map)` và gọi `saveAccounts()`.
  - [x] Frontend `changeTargetMap` gửi request cập nhật `targetMap` vào settings trước/đồng thời với lệnh warp thủ công.
  - [x] Khi render `selMap`, nếu `acc.settings.targetMap` chưa có thì fallback theo `acc.player.map` hiện tại.
  - [x] Dropdown "Bản đồ di chuyển" giữ đúng giá trị bản đồ đã chọn, không bị nảy về map 1.
- Status: done

### [x] T23 - Tải Nhật ký Vật phẩm theo Yêu cầu (On-Demand Droplogs qua `xhrpg_droplog.php`)
- Description: Tạo endpoint backend gọi trực tiếp API `xhrpg_droplog.php` của game server và giao diện frontend tải dữ liệu khi người dùng chuyển sang tab Vật Phẩm hoặc bấm nút Làm mới.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Tạo endpoint `GET /api/accounts/:line_uid/droplogs` ở backend gửi POST request tới `https://ragnalok.online/human/xhrpg_droplog.php`.
  - [x] Phân loại icon/badge Online/Offline, format timestamp Unix thành ngày giờ thực `HH:mm:ss DD/MM`.
  - [x] Frontend chỉ tải dữ liệu khi người dùng click chọn tab **Vật Phẩm** hoặc bấm nút **🔄 Cập nhật** (Không tự động poll định kỳ gây spam server).
- Status: done

### [x] T24 - Ẩn thông tin Proxy đối với Người dùng thường
- Description: Giới hạn chỉ hiển thị Badge Proxy trên Card tài khoản và chỉ gửi thông tin proxy qua API đối với các tài khoản Admin để bảo mật thông tin proxy pool.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Backend `server.js` chỉ gửi trường `proxyInfo` trong API `/api/accounts` nếu user là `admin`.
  - [x] Frontend `public/app.js` mặc định ẩn badge proxy trên card skeleton (`display: none`).
  - [x] Frontend `public/app.js` chỉ hiển thị badge proxy khi user là `admin` và có `proxyInfo` hợp lệ.
- Status: done

### [x] T25 - Tự động nhận diện định dạng Proxy thô (IP:PORT:USER:PASS hoặc IP:PORT)
- Description: Cho phép nhập proxy dạng thô ngăn cách bằng dấu hai chấm vào Admin UI, tự động chuyển đổi sang URL chuẩn `http://user:pass@ip:port` ở backend.
- Files related: `server.js`, `public/index.html`
- Acceptance criteria:
  - [x] Khi add proxy, backend tự nhận diện và chuyển đổi `ip:port:user:pass` thành `http://user:pass@ip:port`.
  - [x] Backend tự nhận diện và chuyển đổi `ip:port` thành `http://ip:port`.
  - [x] Nếu nhãn (label) không được cung cấp, backend tự sinh nhãn an toàn là `IP:PORT` (không chứa tài khoản mật khẩu).
  - [x] Cập nhật placeholder cho ô nhập proxy trên Admin UI.
- Status: done

### [x] T26 - Cập nhật Bản đồ Mới (Lv.55 và Lv.70) và Đồng bộ Đấu trường
- Description: Tích hợp 2 bản đồ mới được phát hành trên live game (Map 5 - Tàn tích Cổ đại và Map 6 - Núi lửa Sôi trào) cùng với việc cập nhật lại icon cho bản đồ số 4 (Đấu trường Arena).
- Files related: `server.js`, `public/app.js`, `game_api_reference.md`, `project_summary.md`
- Acceptance criteria:
  - [x] Khai báo Map 5 (req: 55) và Map 6 (req: 70) trong `MAP_DEFS` ở backend `server.js`.
  - [x] Cập nhật emoji của Map 4 từ `🏛️` thành `⚔️` trong `MAP_DEFS` ở backend `server.js`.
  - [x] Cập nhật các tùy chọn dropdown select `sel-map` ở frontend `public/app.js` để bao gồm 2 map mới và update emoji map 4.
  - [x] Cập nhật tài liệu hướng dẫn nhanh và báo cáo tóm tắt dự án.
- Status: done

### [x] T27 - Ngăn chặn chọn Bản đồ vượt cấp (Map Level Validation)
- Description: Bổ sung cơ chế xác thực cấp độ yêu cầu của bản đồ trên cả Frontend và Backend khi người dùng thay đổi bản đồ di chuyển bằng dropdown select.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Client-side: `changeTargetMap` kiểm tra cấp độ hiện tại của nhân vật qua DOM element `#lv-txt-...` với cấp độ yêu cầu của map đích. Nếu không đủ, hiển thị hộp thoại alert cảnh báo lỗi và tự động khôi phục lại giá trị dropdown cũ bằng cách gọi `fetchAccounts()`.
  - [x] Backend-side: Validate trường `targetMap` trong API `PUT /api/accounts/:line_uid`. Trả về lỗi 400 nếu cấp độ nhân vật hiện tại không đủ yêu cầu của bản đồ đích.
  - [x] Backend-side: Validate hành động `warp` trong API `POST /api/accounts/:line_uid/action`. Trả về lỗi 400 nếu cấp độ nhân vật không đủ.
- Status: done

### [x] T28 - Thêm Tab hiển thị Kỹ năng sở hữu và Bật/Tắt Tự động sử dụng (Auto Use Toggle)
- Description: Tích hợp tab "Kỹ Năng" hiển thị các kỹ năng nhân vật đang sở hữu (Lv > 0) và cung cấp nút bấm bật/tắt tự động sử dụng (gửi action `skill_toggle` tới `xhrpg_upgrade.php`).
- Files related: `server.js`, `public/app.js`, `public/app.css`
- Acceptance criteria:
  - [x] Backend-side: Trả về trường `skills` và `skill_auto` trong payload của API `GET /api/accounts`.
  - [x] Frontend-side: Định nghĩa danh sách `SKILL_DEFS` bao gồm ID, tên dịch tiếng Việt, emoji, kiểu (passive/active) và nhánh kỹ năng.
  - [x] Frontend-side: Thêm tab "Kỹ Năng" và container hiển thị lưới kỹ năng.
  - [x] Frontend-side: Hiển thị danh sách kỹ năng nhân vật đang sở hữu (có cấp độ > 0). Đối với kỹ năng chủ động (hoặc tháp đôi), hiển thị nút Bật/Tắt Auto.
  - [x] Frontend-side: Bấm nút gửi request tới `/api/accounts/:line_uid/action` với payload `{ action: 'skill_toggle', extra: { skill_id: ... } }`.
  - [x] Frontend-side: Tối ưu hóa UI: giới hạn chiều cao tối đa của lưới kỹ năng (`max-height: 220px`), hỗ trợ thanh cuộn dọc (scroll) thẩm mỹ đồng bộ và tự động chuyển đổi sang layout 1 cột trên màn hình điện thoại/màn hình nhỏ để cân đối tổng thể Card.
- Status: done

### [x] T29 - Cải tiến Toàn diện Hệ thống Proxy Pool
- Description: Xây dựng cơ chế lưu IP Persistent, tự động chuyển vùng khi lỗi (failover), bổ sung API Connection Tester & tính năng gán Proxy thủ công cho từng Bot.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Backend-side: Lưu trữ trường `proxyId` của Bot trực tiếp vào `accounts.json`. Khi khởi động lại server, bot sử dụng đúng proxy được lưu này.
  - [x] Backend-side: Implement cơ chế đếm lỗi mạng liên tiếp `consecutiveErrors` trong poller loop. Nếu đạt 3 lần, tự động kích hoạt `proxyPool.failoverAssignment()`, đánh dấu proxy cũ là inactive/error, gán sang proxy mới (hoặc direct), cập nhật file cấu hình và thông báo lỗi.
  - [x] Backend-side: Tạo API `POST /api/admin/proxies/:id/test` để ping kiểm tra độ trễ kết nối tới game server.
  - [x] Backend-side: Cho phép cập nhật `proxyId` qua API `PUT /api/accounts/:line_uid` (chỉ dành cho Admin).
  - [x] Frontend-side: Thêm nút "⚡ Test" bên cạnh mỗi proxy trong bảng quản trị Proxy Admin để đo độ trễ và kiểm tra độ ổn định trực tuyến.
  - [x] Frontend-side: Thêm dropdown chọn Proxy thủ công trên Card nhân vật tại tab "Cơ Bản" (chỉ hiển thị với vai trò Admin), đồng bộ hóa trực tiếp với máy chủ.
- Status: done

### [x] T30 - Tích hợp hệ thống Sao lưu qua Telegram Bot & Phục hồi qua Web UI
- Description: Đóng gói backup dưới dạng ZIP, tự động gửi lên Telegram chat định kỳ và hỗ trợ download/upload khôi phục trực tiếp trên giao diện Dashboard Admin.
- Files related: `package.json`, `server.js`, `public/index.html`, `public/app.js`
- Acceptance criteria:
  - [x] Backend-side: Cài đặt thêm thư viện `adm-zip` và `multer`.
  - [x] Backend-side: Mở rộng API cập nhật cấu hình proxy settings để lưu các thiết lập Telegram Bot (`telegramBotToken`, `telegramChatId`, `backupIntervalHours`, `autoBackupEnabled`).
  - [x] Backend-side: Xây dựng helper `performTelegramBackup()` nén 3 file (`users.json`, `proxies.json`, `accounts.json`) thành tệp ZIP trong RAM và gửi document lên Telegram qua API `sendDocument`.
  - [x] Backend-side: Tạo API `POST /api/admin/backup-now` để backup thủ công gửi lên Telegram.
  - [x] Backend-side: Tạo API `GET /api/admin/backup-download` để tải tệp nén ZIP trực tiếp về máy.
  - [x] Backend-side: Tạo API `POST /api/admin/restore-upload` nhận tệp ZIP tải lên, giải nén ghi đè, dừng toàn bộ bot cũ, nạp lại dữ liệu người dùng/proxy/tài khoản và khởi chạy lại các bot có trạng thái chạy (Hot-Reload).
  - [x] Backend-side: Thiết lập vòng lặp `setInterval` chạy ngầm kiểm tra định kỳ mỗi 5 phút để kích hoạt sao lưu tự động nếu đủ thời gian giãn cách.
  - [x] Frontend-side: Thêm tab "Sao Lưu" vào Admin Panel modal.
  - [x] Frontend-side: Thiết kế form cấu hình Telegram Bot và hiển thị trạng thái hoạt động trực quan.
  - [x] Frontend-side: Thiết kế các nút bấm: Gửi backup Telegram, Tải backup về máy, Chọn file khôi phục dữ liệu đi kèm cảnh báo an toàn.
- Status: done

### [x] T31 - Hiển thị thanh EXP (real-time), HP max đúng, và thanh MP mới
- Description: Thanh EXP render được nhưng không cập nhật do server chưa expose `exp`. HP hiển thị sai (hp > hp_max) vì dùng `hp_max` thô thay vì đã tính VIT bonus. Chưa có thanh MP vì game không có field `mp_max` raw — mp_max phải được tính từ intel.
- Files related: `public/app.js`, `public/app.css`, `server.js`
- Acceptance criteria:
  - [x] Server expose `exp`, `mp` trong object `player` của `GET /api/accounts`.
  - [x] Server tính sẵn `hp_max_eff` đồng bộ công thức `xhrpg_canvas.js` line 3791: `floor((hp_max + VIT_bonus) × rag_mult)`.
  - [x] Server tính sẵn `mp_max_calc` đồng bộ công thức `xhrpg_canvas.js` line 3810: `floor((50 + intel_eff × 5) × rag_mult)`.
  - [x] `updateCard()` dùng `p.hp_max_eff` cho HP bar — không còn hiện hp > max.
  - [x] Thêm vital-row 💧 MP với `mp-bar-{uid}` / `mp-txt-{uid}` dùng `p.mp_max_calc`.
  - [x] CSS `.bar-mp` gradient xanh lam nhạt cyan (`#38bdf8 → #0ea5e9`).
  - [x] EXP bar cập nhật real-time mỗi 1 giây theo vòng poll frontend.
- Status: done

### [x] T32 - Redesign Dashboard UI (Compact & Balanced Layout)
- Description: Thiết kế lại giao diện Dashboard nhằm giảm 40-50% diện tích chiều cao của mỗi Card bot, gom gọn Header 1 dòng, Vitals 2 cột slim bar, Stats Strip hợp nhất và Tabs Pill Segmented Control.
- Files related: `public/app.css`, `public/app.js`
- Acceptance criteria:
  - [x] CSS: Grid đổi thành `repeat(auto-fill, minmax(360px, 1fr))` để hiển thị được 4-5 bot/hàng trên PC.
  - [x] CSS & JS: Header Card gom gọn Tên bot, Badge Trạng thái, Proxy badge, Lv và nút 🎮 Play, ✏️ Edit, 🗑️ Delete trên 1 hàng ngang.
  - [x] CSS & JS: Vitals HP, MP, Armor, EXP thiết kế dạng 2 cột x 2 hàng với thanh progress bar slim 7px.
  - [x] CSS & JS: Hợp nhất Combat Rates và Resources thành 1 hàng Stats Strip duy nhất dạng Badge Pill.
  - [x] CSS & JS: Segmented Pill Tab Bar và giảm padding form controls từ 10px xuống 5px, giảm height Terminal Log từ 250px xuống 150px.
- Status: done

### [x] T33 - Fix Combat Rates & Kills Per Minute Calculation
- Description: Điều tra và khắc phục triệt để lỗi tính toán sai lệch chỉ số quái tiêu diệt/phút (killsPerMin) do lọc nhầm tin nhắn không phải quái và lỗi thuật toán chọn timestamp bắt đầu trong cửa sổ trượt 5 phút.
- Files related: `server.js`, `test.js`
- Acceptance criteria:
  - [x] Sửa lọc sự kiện: Chỉ đếm `e.type === 'kill'` (monster kills chính thức từ game server), loại bỏ việc đếm nhầm tin nhắn có emoji `💀` (như nhân vật hy sinh hoặc thua PvP).
  - [x] Sửa thuật toán `getCombatRates()`: Thay đổi `startOfMeasurement` thành `Math.max(this.startTime || cutoff, cutoff)`, tính chính xác tổng số phút thực tế đã trôi qua trong cửa sổ trượt 5 phút thay vì bị ép mẫu số về 0.1 min.
  - [x] Bổ sung unit test kiểm thử `getCombatRates()` trong `test.js` -> PASS.
- Status: done

### [x] T34 - Fix Telegram Backup Switch & Separate Stats Strips UI
- Description: Sửa lỗi không thể gạt bật/tắt nút công tắc sao lưu định kỳ qua Telegram `#backup-auto-enabled` và tách biệt hàng đếm tỉ lệ diệt quái/vàng/exp với hàng tổng tài nguyên trong kho.
- Files related: `public/index.html`, `public/app.css`, `public/app.js`
- Acceptance criteria:
  - [x] HTML: Chuẩn hóa wrapper công tắc `#backup-auto-enabled` thành `<label class="switch">` để phản hồi nhấp chuột mượt mà 100%. Bổ sung `onchange="saveBackupSettings()"`.
  - [x] HTML & CSS: Tách rời `.compact-stats-strip` thành 2 khối riêng biệt `.combat-rates-strip` (nền tím mờ) và `.resources-strip` (nền đen mờ), giữ nguyên đầy đủ tất cả ID cập nhật động.
  - [x] Test: `npm test` và `node -c public/app.js` -> PASS.
- Status: done

### [x] T35 - Soften Stats & Rates UI Text Colors
- Description: Tinh chỉnh màu sắc và giảm phông chữ các hàng chỉ số (Kills/m, Gold/m, EXP/m, Tài nguyên) từ màu trắng tinh chói mắt sang tông màu bạc dịu (Slate-300 #cbd5e1 / Slate-400 #94a3b8).
- Files related: `public/app.css`
- Acceptance criteria:
  - [x] CSS: Chuyển màu chữ `.stat-pill strong` và `.vital-num` từ `var(--text-primary)` trắng tinh sang màu xám/bạc dịu `#cbd5e1` (Slate-300).
  - [x] CSS: Giảm phông chữ `.combat-rates-strip` xuống `0.70rem` và `.resources-strip` xuống `0.68rem`.
  - [x] CSS: Giảm độ mờ phông nền các khối strip xuống nhẹ nhàng hơn (rgba opacity 0.05 / 0.2).
  - [x] Test: `npm test` -> PASS.
- Status: done

### [x] T36 - Admin User-Grouped Accordion & Batch Proxy Assignment
- Description: Tái thiết kế giao diện Admin gom nhóm bot theo từng User (Accordion view), hỗ trợ mở/đóng danh sách bot card của user và tính năng đổi Proxy hàng loạt cho tất cả bot của user.
- Files related: `server.js`, `public/app.css`, `public/app.js`
- Acceptance criteria:
  - [x] Backend: Thêm API `PUT /api/admin/users/:userId/proxy` thực hiện cập nhật proxy hàng loạt cho tất cả bot của user.
  - [x] Backend: Bổ sung metadata `ownerUsername`, `ownerRole`, `ownerExpiresAt` vào response `GET /api/accounts`.
  - [x] CSS: Bổ sung các class `.user-group-card`, `.user-group-header`, `.user-batch-proxy-box`, `.user-bot-grid` với thiết kế không gian tối mượt mà.
  - [x] JS Frontend: Hiển thị các User Group Card khi role là admin, tính năng bấm click đóng/mở xổ bot card, lưu trạng thái expanded trong `expandedUserGroups`, dropdown gán Proxy hàng loạt 1-click.
  - [x] Test: `node -c server.js`, `node -c public/app.js`, `npm test` -> PASS 100%.
- Status: done

### [x] T37 - Fix Admin UI 'Node cannot be found in the current page' DOM Bug
- Description: Khắc phục lỗi DOM Node bị phá hủy liên tục do gán lại groupCard.innerHTML mỗi 1s trong renderAccounts.
- Files related: `public/app.js`
- Acceptance criteria:
  - [x] Chỉ khởi tạo `groupCard.innerHTML` một lần duy nhất khi tạo mới phần tử `groupCard`.
  - [x] Cập nhật các trường văn bản động (`user-bot-count`, `user-expiry`, proxy options) trực tiếp bằng DOM setter mà không ghi đè `innerHTML`.
  - [x] Bảo toàn nguyên vẹn cây DOM của `user-bot-grid` và các bot card bên trong.
  - [x] Test: `node -c public/app.js`, `npm test` -> PASS 100%.
- Status: done

### [x] T38 - Outbound Public IP Proxy Verification Tool
- Description: Xây dựng kế hoạch và tích hợp API + nút kiểm tra Outbound IP thực tế cho từng bot và toàn bộ luồng Proxy trong Pool.
- Files related: `server.js`, `public/app.js`, `public/index.html`, `proxy_verification_plan.md`
- Acceptance criteria:
  - [x] Backend: Xây dựng route `GET /api/accounts/:line_uid/proxy-check` gửi request qua Dispatcher của bot tới `api.ipify.org` lấy IP thực tế và đo latency.
  - [x] Backend: Xây dựng route `GET /api/admin/proxies/verify-all` test đồng loạt tất cả luồng Direct & Proxy trong Pool.
  - [x] Frontend: Thêm nút **`🔍 Test IP`** bên cạnh dropdown Proxy của từng bot card (tab Cơ Bản).
  - [x] Frontend: Thêm nút **`🔍 Test IP Public Tất Cả Luồng`** vào Admin Proxy Pool Modal.
  - [x] Lập tài liệu Kế hoạch kiểm tra Proxy tại `proxy_verification_plan.md`.
  - [x] Test: `node -c server.js`, `node -c public/app.js`, `npm test` -> PASS 100%.
- Status: done

### [x] T39 - Fix Auth Switch DOM Persistence & Mobile Layout Overflow
- Description: Fix required hard refresh (Ctrl+F5) when switching Admin/User accounts by resetting global DOM state on logout/login, and fix mobile UI overflow in user bot grid and header accordion.
- Files related: `public/app.js`, `public/app.css`
- Acceptance criteria:
  - [x] Implement `resetAppState()` in `app.js` to clear `#accounts-grid`, reset `activeTabs`, `expandedUserGroups`, `isUserGroupInitialized`, `lastFetchedAccounts`.
  - [x] Clear DOM state when switching display mode (Admin Accordion <-> User Grid) in `renderAccounts()`.
  - [x] Fix mobile CSS: `@media (max-width: 640px)` for `.user-bot-grid { grid-template-columns: 1fr; padding: 8px; }`.
  - [x] Fix `.user-group-header` & `.user-batch-proxy-box` layout on mobile (< 640px) to prevent horizontal scrolling.
  - [x] Test: `node -c public/app.js`, `npm test` -> PASS 100%.
- Status: done

### [x] T40 - Mobile Touch Quota Stepper & Admin Overview Statistics Panel
- Description: Build touch-friendly bot quota stepper (+/- buttons) for mobile admins and system statistics overview cards panel.
- Files related: `server.js`, `public/index.html`, `public/app.css`, `public/app.js`
- Acceptance criteria:
  - [x] Backend: Add `GET /api/admin/stats` returning total/active/expired users, total/online/offline bots, total quota, and direct vs proxy allocation.
  - [x] Backend: Include `onlineBotCount` in `GET /api/admin/users`.
  - [x] Frontend HTML: Add `#admin-stats-overview` cards container at top of Admin Users tab in `index.html`.
  - [x] Frontend CSS: Style `.admin-stats-grid`, `.admin-stat-card`, `.btn-quota-step`, `.quota-input-field` with touch-friendly 30x30px controls and responsive mobile rules (`@media (max-width: 640px)`).
  - [x] Frontend JS: Implement `fetchAdminStats()`, `renderAdminStats()`, `window.stepUserQuota(userId, delta)` with real-time sync.
  - [x] Test: `node -c server.js`, `node -c public/app.js`, `npm test` -> PASS 100%.
### [x] T41 - Dashboard Real Armor Points & Max Armor Bar Synchronization
- Description: Fix incorrect armor bar percentage calculation ((armor_lv / 50) * 100%) and missing current armor vs max armor text display on account cards.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Backend: Expose `armor: p.armor` in `GET /api/accounts` response.
  - [x] Backend: Calculate `armor_max_calc` in `GET /api/accounts` using game engine formula `floor((100 + floor((vit_eff-5)/5) + floor((str-5)/2) + armor_lv*10 + armor_up_skill*5) * rag_armor)`.
  - [x] Frontend: Calculate armor bar width using real armor points `armorPct = (armorCur / armorMax) * 100%`.
  - [x] Frontend: Display formatted armor text `${armorCur} / ${armorMax} (${armorPct}%)` in `#armor-txt-{uid}` element.
  - [x] Test: `node -c server.js`, `node -c public/app.js` -> PASS 100%.
- Status: done

### [x] T42 - Auto/Manual Stat Points Allocation & In-Game Character Stats Panel
- Description: Refactor Skills tab into Character Information tab, add manual +1, +5, ALL stat allocation buttons, auto stat allocation toggle, and in-game combat stat summary panel.
- Files related: `server.js`, `public/app.js`, `public/app.css`
- Acceptance criteria:
  - [x] Backend: Expose `str`, `agi`, `vit`, `intel`, `dex`, `luk`, `str_eff`...`luk_eff`, and calculated combat stats (`atk_pistol`, `atk_sniper`, `atk_knife`, `atk_turret`, `crit_pct`, `def_calc`) in `GET /api/accounts`.
  - [x] Backend: Enable `enableUpgrades = true` in `BotInstance.runAutomation()` for auto stat allocation.
  - [x] Frontend UI: Rename `Kỹ Năng` tab to `👤 Nhân Vật`.
  - [x] Frontend UI: Add 📊 Stat Points allocation panel with `+1`, `+5`, `ALL` buttons per attribute and `⚡ Tự động cộng Stat Points` toggle.
  - [x] Frontend UI: Add ⚔️ In-Game Combat Stats grid (HP Max, MP Max, Armor Max, DEF, CRIT %, Pistol ATK, Sniper ATK, Knife ATK, Turret ATK).
  - [x] Frontend UI: Retain 100% skill management list, skill priority, and auto skill toggle.
  - [x] Test: `node -c server.js`, `node -c public/app.js` -> PASS 100%.
- Status: done

### [x] T43 - Refine Character Tab UI Layout & Server Process Shutdown
- Description: Clean up UI layout in Character tab (1-row section headers, balanced 2-column stat grid, 15% text color softening, remove redundant auto toggles), fix 500 error & JS syntax error, and shutdown server processes.
- Files related: `server.js`, `public/app.js`, `public/app.css`
- Acceptance criteria:
  - [x] Frontend UI: 1-row header layout for Stat Points section.
  - [x] Frontend UI: Balanced 2-column grid fitting inside control card container without overflow.
  - [x] Frontend UI: 15% text opacity softening (`opacity: 0.85`) across character panel elements.
  - [x] Frontend UI: Clean up redundant auto-stat & auto-skills toggle switches from Character tab.
  - [x] Backend: Wrap `GET /api/accounts` in try-catch to prevent 500 crashes.
  - [x] Server: Stop node background processes and free port 3000 for manual restart.
  - [x] Test: `node -c server.js`, `node -c public/app.js` -> PASS 100%.
- Status: done

### [x] T44 - Cải Tiến 3 Điểm Kiến Trúc UI Admin (CSS Inline, Tab Switch, Batch Proxy)
- Description: Kiểm tra toàn bộ kiến trúc UI Admin, phát hiện và khắc phục 3 điểm yếu: (1) quá nhiều inline style trong HTML, (2) switchAdminTab() gán style trực tiếp thay vì dùng class, (3) dropdown Đổi Proxy Hàng Loạt bị trống khi adminProxiesList chưa load kịp.
- Files related: `public/index.html`, `public/app.css`, `public/app.js`
- Acceptance criteria:
  - [x] Thêm ~270 dòng CSS class chuyên dụng vào `app.css`: `.admin-tab-panel`, `.admin-tab-btn`, `.admin-section-block`, `.admin-add-proxy-grid`, `.admin-backup-form-grid`, `.admin-restore-*`, v.v.
  - [x] `switchAdminTab()` refactor dùng `classList.toggle('active')` thay vì gán inline `style.display` và `style.background/color/borderColor` → dễ thêm transition sau.
  - [x] `index.html` thay tất cả `style="background:rgba(0,0,0,0.2)..."` trong admin modal bằng CSS class tương ứng.
  - [x] Thêm hàm `refreshAllBatchProxySelects()` vào `fetchAdminProxies()` — sau mỗi lần fetch xong, tự động rebuild tất cả dropdown `user-batch-proxy-*` trên DOM, giữ lại lựa chọn cũ.
  - [x] Test: `node -c server.js`, `node -c public/app.js`, `node test.js` -> PASS 100%.
- Status: done

### [x] T45 - Fix Bug `bot.isOnline` Không Tồn Tại → onlineBots Luôn Bằng 0
- Description: Admin Stats Panel luôn hiển thị 🟢 0 Online dù bot đang chạy. Điều tra phát hiện `bot.isOnline` không phải property của `BotInstance` (class chỉ có `this.status`). Kết quả là điều kiện `bot && bot.isOnline` luôn falsy → counter không bao giờ tăng.
- Files related: `server.js`
- Root cause: `BotInstance` constructor không khai báo `isOnline`. Field thực tế phản ánh trạng thái chạy là `this.status = 'running'`.
- Acceptance criteria:
  - [x] Sửa `GET /api/admin/stats` (dòng 1620): `bot.isOnline` → `bot.status === 'running'` → `onlineBots` đếm đúng.
  - [x] Sửa `GET /api/admin/users` (dòng 1657): `bot.isOnline` → `bot.status === 'running'` → `onlineBotCount` trên từng User row đếm đúng.
  - [x] Test: `node -c server.js`, `node test.js` -> PASS 100%.
- Status: done

### [x] T46 - Server-Side Idle Guard & Event-Driven Act-Flag Jitter Engine
- Description: Thiết lập cơ chế mô phỏng `act` flag tự nhiên kết hợp với Event-driven trigger từ các thao tác tự động của bot (di chuyển, học skill, dùng potion, đổi zone, nâng đồ) và tự động phục hồi khi nhận tín hiệu `d.idle = true` từ game server.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] **Event-Driven Act Trigger (`setActFlag()`)**: Mỗi khi bot thực thi 1 hành vi tương tác tự động (nâng stats, dùng skill, bơm potion, đổi zone, warp), tự động kích hoạt `act = 1` ở poll kế tiếp.
  - [x] **Dynamic Gaussian/Jitter Heartbeat**: Khi không có hành vi tự động, kích hoạt `act = 1` ngẫu nhiên trong khoảng 120s–300s (khoảng thời gian mô phỏng người dùng thỉnh thoảng tương tác UI), tránh gửi định kỳ quá đều.
  - [x] **Idle Signal Auto-Recovery (`d.idle = true`)**: Khi game server trả về `d.idle = true`, đánh dấu khôi phục ngay ở poll kế tiếp (`act = 1`, reset jitter counter) và phát một gói tin heartbeat/keepalive mà không bị ngắt bot.
  - [x] **Dashboard Monitoring Indicator**: Hiển thị trạng thái `Act Pulse` hoặc cảnh báo `Idle Recovery` trên terminal log của từng bot instance.
  - [x] Test: `node -c server.js`, `npm test` -> PASS 100%.
- Status: done

### [x] T47 - Cache Busting Tự Động Khi Update Code (Content Hash)
- Description: Thay thế version tĩnh `?v=9.0` bằng cơ chế Content Hash tự động. Server tính MD5 hash 8 ký tự của `app.js` và `app.css` mỗi khi browser tải `/`, inject vào href/src trước khi trả về HTML. Chỉ bust cache khi file thực sự thay đổi.
- Files related: `server.js`, `public/index.html`, `.agent/SKILL.md`
- Acceptance criteria:
  - [x] Thêm hàm `computeFileHash(filePath)` dùng MD5 trong `server.js`.
  - [x] Đổi `express.static` sang `index: false` để tắt auto-serve `index.html`.
  - [x] Thêm route `app.get('/')` inject hash vào `href="/app.css?v=..."` và `src="/app.js?v=..."` trước khi gửi HTML về browser.
  - [x] `index.html` được set `Cache-Control: no-cache, no-store, must-revalidate`.
  - [x] Tăng `maxAge` static files từ `7d` lên `30d`.
  - [x] Xóa `?v=9.0` tĩnh khỏi `index.html`.
  - [x] Hash tính lại mỗi request (hỗ trợ hot-reload).
  - [x] Ghi lại quy trình deploy vào `.agent/SKILL.md`.
  - [x] `node -c server.js`, `node -c public/app.js` → PASS 100%.
- Status: done

### [x] T51 - Tự động hóa Săn Boss MVP vào mỗi Giờ Tròn (Không cần cấu hình hẹn giờ)
- Description: Tự động đi săn Boss xoay vòng map vào mỗi giờ tròn (delay khoảng 5 giây) thay vì phải nhập cấu hình thời gian thủ công.
- Files related: `server.js`, `public/app.js`
- Acceptance criteria:
  - [x] Loại bỏ hộp nhập `mvpHuntSchedule` khỏi tab Săn Boss và thay bằng ghi chú giải thích.
  - [x] Cập nhật logic `pollGame()` để tự động kích hoạt `triggerMvpCycle()` ở phút `00` và giây `>= 5` của mỗi giờ tròn.
  - [x] Khai báo và sử dụng `this.lastMvpCycleCheckHour` để hạn chế trigger trùng lặp trong cùng 1 giờ.
  - [x] Bảo toàn cấu hình farm zone (`autoZone`, `lock_zone_center`, `targetZone`) khi di chuyển quay trở lại bản đồ farm gốc sau khi hoàn thành chu kỳ săn Boss thông qua cờ `wasMvpReturning`.
  - [x] Test: `node test.js` -> PASS 100%.
- Status: done
