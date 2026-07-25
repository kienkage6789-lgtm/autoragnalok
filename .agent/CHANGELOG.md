# CHANGELOG.md

> Changelog of actual changes implemented.

## 2026-07-25 - Nâng cấp Tab Nhật ký Vật phẩm Trực tiếp từ Máy chủ (On-Demand Droplogs)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Tạo Endpoint API On-Demand (`server.js`)**:
    * Khai báo endpoint `GET /api/accounts/:line_uid/droplogs` gửi request tới `https://ragnalok.online/human/xhrpg_droplog.php`.
    * Phân loại biểu tượng (Thẻ bài `🎴`, Trứng `🥚`, Mô-đun `⚙️`, Trang bị `⚔️`, Đá quý `💎`) và tự động chuyển đổi Unix timestamp `t` thành chuỗi thời gian thực `HH:mm:ss DD/MM`.
    * Phân biệt rõ nguồn gốc rơi đồ: `🟢 Online` vs `🌙 Offline`.
  - **Tối ưu hóa Frontend Không Spam Request (`public/app.js`)**:
    * Bổ sung nút **🔄 Cập nhật** và thanh tiêu đề thông tin trực quan trong tab **Vật Phẩm**.
    * Viết hàm `fetchDropLogs(uid)` chỉ thực hiện tải dữ liệu khi người dùng chuyển tab sang **Vật Phẩm** hoặc chủ động bấm nút **🔄 Cập nhật**.
    * Loại bỏ hoàn toàn các request thừa trong tiến trình chạy ngầm của bot.

---

## 2026-07-25 - Sửa lỗi không cập nhật mục 'Bản đồ di chuyển' khi dịch chuyển bản đồ
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Cập nhật & Đồng bộ `targetMap` ở Backend (`server.js`)**:
    * Trong handler `POST /api/accounts/:line_uid/action`, khi `action === 'warp'`, tự động cập nhật `bot.settings.targetMap = Number(payload.target_map)` và bật `autoMap = true`, đồng thời lưu ngay vào `accounts.json` qua `saveAccounts()`.
    * Cập nhật `bot.settings.targetMap` đồng bộ với `bot.player.map` sau khi warp thành công.
  - **Tối ưu hóa UI & Sync Frontend (`public/app.js`)**:
    * Nâng cấp `changeTargetMap(uid, mapId)`: Lưu cấu hình `targetMap` và `autoMap` qua `PUT /api/accounts/${uid}` trước khi gửi lệnh `warp` thủ công, đảm bảo trạng thái settings được ghi nhận lập tức.
    * Trong `updateCard(acc)`: Khi render `selMap` (ô chọn Bản đồ di chuyển), tự động fallback theo `acc.player.map` nếu `acc.settings.targetMap` chưa được khởi tạo, giúp giao diện dropdown hiển thị chính xác 100% bản đồ đã chọn mà không bị nảy về map 1.

---

## 2026-07-24 - Triển khai tab Nhật ký Vật phẩm (Loot Logs) riêng biệt
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Lưu trữ dữ liệu Loot Logs chuyên biệt**:
    *   Thêm thuộc tính `this.lootLogs` (mảng tối đa 200 vật phẩm) vào constructor lớp `BotInstance`.
    *   Tạo phương thức helper `addLootLog(msg)` ghi nhận vật phẩm nhặt được kèm mốc thời gian thực.
    *   Tích hợp bộ lọc sự kiện nhạy bén trong `pollGame()` để **chỉ ghi nhận các vật phẩm giá trị cao** (Thẻ bài `🎴`, Trứng `🥚`, Trang bị/Vũ khí `⚔️`/`🛡️`/`💍`, Kim cương/Đá quý/Hộp quà `💎`/`🔮`/`👑`/`🏆`/`🎁`) vào tab **Vật Phẩm**.
    *   Các vật phẩm thu hoạch thông thường (Gỗ `🪵`, Đá `🪨`, Sắt `⚙️`, Đồng `🟫`, Cỏ `🌿`, Bình máu `💊`) và các tin tức chiến đấu sẽ **chỉ hiển thị ở tab Nhật Ký chung** để tránh gây loãng tab Vật Phẩm.
    *   Cập nhật API `/api/accounts/:line_uid/logs` chuyển sang định dạng JSON chứa cả `logs` và `lootLogs`.
  - **Tối ưu hóa UI Dashboard**:
    *   Bổ sung tab **Vật Phẩm** (`tab-btn-loot`) và màn hình hiển thị logs cuộn độc lập (`pane-loot`) vào tiêu chuẩn card tài khoản.
    *   Nâng cấp cơ chế tải log (`fetchLogs`) và điều phối chuyển tab (`switchTab`) để kết xuất song song cả log chung lẫn log vật phẩm.
    *   Tích hợp CSS nâng cao làm nổi bật trực quan các chiến lợi phẩm đặc biệt có giá trị: Thẻ bài `🎴` (viền vàng đậm), Trứng `🥚` (viền hồng), Trang bị `⚔️`/`🛡️` (viền xanh dương).

---

## 2026-07-24 - Sửa lỗi lưu tiêu chí săn Boss & Thêm nhật ký đi săn MVP
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Sửa lỗi lưu cài đặt**: Cập nhật hàm `updateNumericSetting` và `updateStringSetting` trong `public/app.js` để tự động chuyển đổi định dạng tên cấu hình camelCase (VD: `mvpPriorityMode`, `mvpNamePriority`) sang định dạng tên thẻ DOM ID tương ứng dạng hyphen-case (VD: `mvp-priority-mode`, `mvp-name-priority`), giúp hàm tìm thấy chính xác phần tử DOM và lưu thông tin về backend thành công.
  - **Nâng cấp log nhật ký săn Boss MVP**:
    *   Tích hợp thuộc tính `this.lastTargetedBossId` để phát hiện sự kiện bắt đầu chọn mục tiêu săn Boss.
    *   Thêm dòng thông tin hệ thống ngay lập tức khi phát hiện mục tiêu mới thỏa mãn bộ lọc: `⚔️ [Auto MVP] Phát hiện Boss MVP... -> Bắt đầu săn Boss!`.
    *   Thêm dòng nhật ký cập nhật trạng thái lượng máu (%) của Boss theo chu kỳ khi nhân vật tiếp cận gần để chiến đấu: `⚔️ [Auto MVP] Đang tấn công Boss...`.
    *   Tự động ghi nhận thông báo hoàn tất/mất dấu khi Boss chết và chuyển trạng thái về hoạt động tự động thông thường: `✅ [Auto MVP] Đã tiêu diệt hoặc mất dấu Boss MVP...`.

---

## 2026-07-24 - Tạm thời vô hiệu hóa các chức năng tự động nâng cấp (Chờ phát triển)
- File đã đổi: `server.js` (sửa).
- Đã làm:
  - **Vô hiệu hóa 5 nhóm tác vụ nâng cấp tự động**: Khai báo cờ `const enableUpgrades = false` ở đầu hàm `runAutomation()`, và bao bọc toàn bộ 5 khối tự động nâng Stats, nâng Giáp, nâng Kỹ năng, nâng cấp Companion (priest, archer, cat, drone, robot body, house, gun) và quản lý mỏ (mine_build, mine_up) bên trong khối `if (enableUpgrades)`.
  - **Giữ lại các tự động hóa di chuyển/combat**: Đảm bảo các tác vụ Auto Map Warp (di chuyển map tự động) và Auto Arena (tự động càn quét/khiêu chiến đấu trường) nằm ngoài khối bao bọc và hoạt động bình thường.
  - **Cập nhật tài liệu**: Ghi nhận trạng thái "Tạm dừng phát triển" đối với 5 chức năng này để phục vụ phát triển sau này.

---

## 2026-07-24 - Tối ưu hóa tập trung săn Boss MVP (Tạm dừng nâng cấp)
- File đã đổi: `server.js` (sửa).
- Đã làm:
  - **Tạo thuộc tính trạng thái nhắm mục tiêu Boss**: Khởi tạo cờ trạng thái `this.targetedMvp` trong constructor của `BotInstance` (mặc định là `false`).
  - **Cập nhật cờ khi săn Boss**: Trong logic `pollGame()`, thiết lập `this.targetedMvp = true` khi phát hiện Boss MVP đáp ứng các tiêu chí lọc (máu > 0, không nằm trong blacklist, thỏa whitelist nếu có) và bắt đầu di chuyển săn Boss.
  - **Tạm dừng toàn bộ tự động hóa ngoài lề**: Thêm khối kiểm tra đầu hàm `runAutomation()`. Nếu `this.targetedMvp` là `true`, lập tức ngắt hàm bằng lệnh `return`. Điều này giúp bỏ qua toàn bộ các thao tác nâng điểm chỉ số, nâng giáp, nâng kỹ năng, nâng phi thuyền/companion, quản lý mỏ, tự động chuyển bản đồ và khiêu chiến/càn quét Đấu trường để dồn 100% tài nguyên poll di chuyển/đánh Boss MVP nhanh nhất.

---

## 2026-07-24 - Đồng bộ Bản đồ di chuyển và Khu vực farm (Zone)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Sửa bất đồng bộ khi đổi Map**:
    *   Cập nhật `changeTargetMap` trong `public/app.js` loại bỏ việc gọi PUT API cập nhật targetMap trước khi warp. Chỉ gọi trực tiếp triggerAction `warp`. Điều này giúp ngăn chặn việc dropdown Map hiển thị sai map mong muốn khi lệnh warp thực tế bị lỗi (ví dụ do level_locked).
    *   Cập nhật route xử lý action `warp` trong `server.js`: Khi lệnh warp thực tế trả về thành công (`response.ok`), server tự động cập nhật `bot.settings.targetMap = bot.player.map` và kích hoạt cờ `bot.settings.autoMap = true`.
  - **Tự động tải lại Spots/Zones ngay khi warp thủ công (Kể cả khi bot dừng)**:
    *   Cập nhật logic warp action trong `server.js` để phát hiện thay đổi map của người chơi. Nếu map thay đổi, reset các thuộc tính `spots`, `bosses`, `autoZone`, `lock_zone_center` và `targetZone` giống như trong poll.
    *   Đặc biệt, nếu bot đang ở trạng thái dừng (`bot.status !== 'running'`), server tự động kích hoạt một luồng chạy ngầm gửi yêu cầu `xhrpg_game.php` với tham số `have_static: 0` để lấy danh sách spots/zones mới từ game server.
    *   Nhờ đó, dropdown Zone trên giao diện frontend tự động hiển thị đúng và đầy đủ danh sách khu vực farm mới ngay lập tức mà không cần khởi động bot.

---

## 2026-07-24 - Thẻ Cài Đặt Săn Boss Riêng & Xử Lý Ưu Tiên MVP
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Logic chọn Boss tối ưu ở Backend**:
    *   Thêm các tham số cấu hình: `mvpPriorityMode` (tiêu chí sắp xếp: distance, level_asc, level_desc), `mvpNamePriority` (whitelist tên), và `mvpNameBlacklist` (blacklist tên).
    *   Cập nhật logic `pollGame()` săn boss MVP: Đầu tiên lọc bỏ các Boss có máu bằng 0 hoặc nằm trong `mvpNameBlacklist`. Sau đó, nếu có danh sách `mvpNamePriority`, lọc lấy các Boss này trước. Cuối cùng, sắp xếp danh sách Boss theo tiêu chí lựa chọn (Gần nhất tính bằng công thức Euclid, hoặc Lv thấp nhất/cao nhất) để nhắm mục tiêu chuẩn xác.
  - **Tách giao diện Tab "Săn Boss" riêng biệt**:
    *   Tạo tab mới `Săn Boss` (`pane-mvp`) để tách rời hoàn toàn `Auto Săn Boss MVP` và `Auto Đấu Trường` ra khỏi thẻ Cơ Bản.
    *   Tích hợp dropdown chọn tiêu chí ưu tiên và hai input nhập danh sách ưu tiên/bỏ qua dưới dạng văn bản cách nhau bằng dấu phẩy.
    *   Viết helper `updateStringSetting` để gửi cập nhật các chuỗi cấu hình về API backend.
    *   Thực hiện đồng bộ hóa (sync) hai chiều trạng thái và giá trị input của tab mới trong hàm `updateCard()`.

---

## 2026-07-24 - Tinh chỉnh Giao diện Thẻ Cơ Bản (Dọn dẹp các nút phụ)
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - Ẩn/loại bỏ các nút `⚡ Auto Tăng Điểm`, `🛡️ Auto Nâng Armor` và ô nhập `explore_radius (m)` trên giao diện thẻ Cơ Bản nhằm làm sạch giao diện và giảm chiều cao thẻ trên điện thoại.
  - Sắp xếp lại ô `🍷 Bơm Potion khi HP < (%)` sử dụng thuộc tính style `grid-column: span 2;` để hiển thị tràn đều hai cột, tạo cảm giác cân đối, chuyên nghiệp.
  - Sửa logic sync trạng thái của các nút ẩn trong hàm `updateCard()` để kiểm tra sự tồn tại của phần tử trước khi gán (tránh lỗi `TypeError` làm dừng luồng JS).

---

## 2026-07-24 - Thêm Chức Năng Lock Tâm Zone (Khóa Vị Trí Vùng Farm)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Logic di chuyển & khóa ở Backend**:
    *   Tích hợp cờ `lock_zone_center` vào cài đặt bot mặc định (`getDefaultSettings`).
    *   Trong `pollGame()`, nếu cờ `lock_zone_center` được bật: Khi khoảng cách tới tâm zone `dist > 30`, bot tự động kích hoạt `traveling = 1` và tắt `lockPos = 0` để cho phép nhân vật di chuyển về tâm zone.
    *   **Vá lỗi khóa vị trí**: Sửa đổi tọa độ neo khóa khi khoảng cách `dist <= 30` từ tọa độ tâm zone gốc (`spot.cx/cy`) thành tọa độ hiện tại của nhân vật (`this.player.x/y`). Điều này ngăn không cho game server tiếp tục di chuyển nhân vật tới tâm hoặc cho nhân vật đi lang thang kiếm quái, đóng băng tọa độ nhân vật hoàn toàn 100%.
    *   Bổ sung log hoạt động: In log một lần duy nhất khi vừa đến tâm và khóa vị trí (`🔒 [Tự động] Đã đến tâm Zone...`), đồng thời in log trạng thái di chuyển định kỳ 10 lượt poll một lần khi đang đi chuyển.
    *   Reset cấu hình `lock_zone_center = false` khi phát hiện thay đổi bản đồ (Map Change).
  - **Tích hợp UI**:
    *   Thêm checkbox gạt `🔒 Lock tâm zone` trên Card UI thiết lập tài khoản.
    *   Thực hiện đồng bộ hóa (sync) hai chiều trạng thái checkbox này giữa backend và frontend.
- Đã test bằng: `npm test` -> PASS.

---

## 2026-07-24 - Sửa Lỗi Unexpected token '<' Khi Mở Client & Cải Thiện Cơ Chế Fallback
- File đã đổi: `server.js` (sửa).
- Đã làm:
  - **Sửa lỗi `Unexpected token '<'`**: Cập nhật hàm `fetchGameAsset()` để kiểm tra xem dữ liệu tải về từ game server có phải là HTML hay không (bằng cách kiểm tra xem có bắt đầu bằng `<` hay không, ví dụ khi bị Cloudflare chặn hoặc redirect về trang login dạng HTML). Nếu là HTML, ném lỗi để tự động kích hoạt khối `catch` và fallback về việc phục vụ các file Javascript tĩnh trên local (`xhrpg_canvas.js`, `sdk.js`).
  - **Cải thiện Fallback HTML**: Cập nhật hàm `fetchGameHtml()` và `fetchGameLoginHtml()` kiểm tra xem HTML trả về từ máy chủ game có chứa thẻ script của game (`xhrpg_canvas.js`) hay không. Nếu không (khi bị Cloudflare chặn hoặc trả về trang lỗi 404/Redirect), ném lỗi để `/play` tự động fallback về trang client local `play.html` tự đóng gói và hoạt động ổn định.
- Đã test bằng: `npm test` và chạy thử request thử nghiệm (SDK 404/Html check) -> PASS.

---

## 2026-07-24 - Sửa Lỗi Submit PHPSESSID & Cấu Hình Trust Proxy
- File đã đổi: `public/app.js` (sửa), `server.js` (sửa).
- Đã làm:
  - **Sửa lỗi submit PHPSESSID**: Thêm các DOM selectors (`addPhpsessidForm`, `inputPhpsessid`, `phpsessidError`) và đăng ký sự kiện submit form PHPSESSID ở frontend. Sự kiện sẽ chặn reload trang mặc định, vô hiệu hóa nút submit và gửi request `POST` qua fetch tới `/api/add-by-phpsessid`. Hiển thị lỗi trực quan lên `#phpsessid-error` nếu thất bại, và đóng modal, reload tài khoản, reset form khi thành công.
  - **Reset Form khi Mở Modal**: Cập nhật hàm `openModal` trong `public/app.js` để tự động dọn dẹp các input và lỗi cũ của form PHPSESSID.
  - **Tối ưu hóa Dynamic Domain**: Cấu hình `app.set('trust proxy', 1)` trong Express server (`server.js`) để hỗ trợ nhận diện protocol/IP qua proxy, load balancer trên môi trường production.
- Đã test bằng: `npm test` và `node -e "require('./server.js')"` -> Cả hai đều PASS.

---

## 2026-07-23 - Đăng Nhập Google Tự Động Lấy Token (Dành Cho Điện Thoại)

- File đã đổi: `server.js` (sửa), `public/index.html` (sửa).
- Đã làm:
  - **Tích hợp Token Sniffer**: Tạo hàm `fetchGameLoginHtml(req)` tải trang game qua proxy và inject script tự động bắt (sniff) `line_uid` & `session_token` khi người dùng bấm Đăng nhập Google.
  - **Route `/login-helper`**: Người dùng điện thoại chỉ cần vào `/login-helper` (bấm nút "⚡ Đăng Nhập Google Tự Động Lấy Token" trên Dashboard), đăng nhập Google bình thường.
  - **API `/api/auto-add-account`**: Nhận token bắt được từ Sniffer, tự động tạo/cập nhật tài khoản trong `accounts.json`, khởi tạo `BotInstance` và trả kết quả về giao diện.
  - **Giao diện tự chuyển hướng**: Khi bắt xong token, màn hình hiển thị thông báo thành công đẹp mắt ("🎉 TỰ ĐỘNG LẤY TOKEN THÀNH CÔNG!") và tự động chuyển về Dashboard sau 1.5 giây. Người dùng không cần nhìn hay gõ bất kỳ chuỗi token ngoằn ngoèo nào.
- Đã test bằng: `node -e "require('./server.js')"` → PASS.

---

## 2026-07-23 - Hệ thống Xoay Proxy (Proxy Rotation Pool)

- File đã đổi: `server.js` (sửa), `public/index.html` (sửa), `public/app.js` (sửa), `proxies.json` (tạo mới tự động).
- Đã làm:
  - **ProxyPool class** (`server.js` dòng 12-208): Thay thế `gameAgent` cố định bằng class quản lý pool proxy động. Hỗ trợ Agent trực tiếp (không proxy) và nhiều ProxyAgent.
  - **Thuật toán Bin-Packing**: Lấp đầy slot rẻ nhất trước — Direct → lấp đầy proxy 1 → lấp đầy proxy 2 → ... Không mở proxy mới nếu proxy cũ còn slot trống. Overflow khi tất cả đầy.
  - **Phân bổ tự động**: Mỗi `BotInstance` được assign proxy tại constructor (`proxyPool.assignBot()`), giải phóng tại xóa tài khoản (`proxyPool.releaseBot()`). `sendRequest()` gọi `proxyPool.getDispatcher(this.line_uid)` thay vì dùng agent toàn cục.
  - **API Admin** (5 routes): `GET/POST /api/admin/proxies`, `PUT /api/admin/proxies/settings`, `PUT/DELETE /api/admin/proxies/:id`. Chỉ Admin mới có quyền.
  - **Admin UI** (`index.html`): Admin modal chuyển sang dạng tabbed — Tab "👥 Người Dùng" (giữ nguyên) + Tab "🌐 Proxy Pool" mới.
  - **Proxy Pool Tab**: Cấu hình global (toggle Direct Connection + max bots/proxy), form thêm proxy, bảng proxy với progress bar tải (màu xanh/vàng/đỏ theo %, mật khẩu bị che), nút Bật/Tắt/Xóa.
  - **Proxy badge** trên bot card: Mỗi card tài khoản hiển thị badge nhỏ cho biết đang dùng proxy nào (xanh lá = direct, tím = proxy).
  - **`proxies.json`**: File storage tự tạo khi thêm proxy đầu tiên. Cấu trúc: `{ settings: { useDirectConnection, maxBotsPerProxy }, list: [{id, label, url, active}] }`.
- Đã test bằng: `node -e "require('./server.js')"` → No syntax errors, server khởi động thành công.

---

## 2026-07-23 - Bugfix: Auto Map Warp + Auto Farm Zone không hoạt động

- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Nguyên nhân gốc rễ (3 lỗi độc lập):

  ### Lỗi 1 — `MAP_DEFS` không tồn tại trong `server.js` (Critical)
  - `pollGame()` gọi `MAP_DEFS.find(...)` ở bước "6. Auto Map Warp" nhưng hằng số này **chưa bao giờ được khai báo** trong `server.js` (nó chỉ tồn tại bên trong client game `xhrpg_canvas.js`).
  - Hậu quả: mỗi lần `pollGame()` chạy đến bước Auto Warp đều crash với `ReferenceError: MAP_DEFS is not defined`, khiến toàn bộ vòng poll bị ngắt → **autoZone và Auto Farm Zone không bao giờ chạy được**.
  - Đã sửa: khai báo `const MAP_DEFS = [...]` trong `server.js` (dòng 245–251) với 4 bản đồ đúng theo `game_api_reference.md`.

  ### Lỗi 2 — So sánh kiểu sai `player.map !== settings.targetMap`
  - `player.map` trả về từ game server là kiểu `number`, còn `settings.targetMap` khi đọc từ JSON file có thể là `string`.
  - Hậu quả: so sánh nghiêm ngặt `!==` luôn trả về `true` (ví dụ `1 !== "1"`) → bot liên tục cố warp dù đang đúng map.
  - Đã sửa: dùng `Number()` trên cả hai vế: `Number(this.player.map) !== Number(this.settings.targetMap)`.

  ### Lỗi 3 — Zone dropdown luôn trống, toggle autoMap/autoZone không sync
  - Hàm `updateCard()` trong `public/app.js` không bao giờ đọc `acc.spots` từ server để populate dropdown `#sel-zone-{uid}`.
  - Hai toggle checkbox `autoMap` và `autoZone` cũng không được sync trạng thái từ `acc.settings` về UI.
  - Hậu quả: người dùng không chọn được Zone → `settings.targetZone` luôn là `0` mặc định → bot không biết phải đến đâu.
  - Đã sửa: thêm hàm `populateZoneSelect(acc)` trong `updateCard()` để render Zone từ `acc.spots` (có anti-flicker, chỉ re-render khi danh sách thay đổi hoặc map đổi). Đồng thời sync lại checkbox và select value từ `acc.settings`.

- Đã test bằng: Đọc code và kiểm tra luồng logic (manual code review).

---

## 2026-07-22 - User Expiration Time Limit (Giới hạn thời gian sử dụng)
- File đã đổi: `server.js` (sửa), `public/index.html` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - Bổ sung trường `expiresAt` cho người dùng (`users.json`).
  - Kiểm tra Hạn sử dụng khi Đăng nhập và trong Middleware `requireAuth`: Tài khoản hết hạn sẽ bị từ chối truy cập và báo lỗi yêu cầu gia hạn.
  - Tự động tạm dừng vòng lặp bot ngầm (`BotInstance`) khi tài khoản sở hữu hết hạn sử dụng.
  - Admin Panel: Thêm lựa chọn thời hạn khi tạo User mới (7 ngày, 30 ngày, 90 ngày, 1 năm, Vô hạn) và thêm nút Nhanh **+30D** để gia hạn 30 ngày cho người dùng với 1 cú click.
- Đã test bằng: `npm test` -> PASS.

## 2026-07-22 - Multi-User Authentication & Admin Quota Management
- File đã đổi: `server.js` (sửa), `users.json` (tạo mới), `public/index.html` (sửa), `public/app.css` (sửa), `public/app.js` (sửa), `test.js` (sửa).
- Đã làm:
  - Triển khai hệ thống xác thực người dùng dựa trên Cookie & PBKDF2 Hashing (`users.json`).
  - Phân quyền Admin: Tạo sẵn tài khoản Admin mặc định (`admin` / `admin123`). Chỉ Admin mới có quyền tạo user mới, sửa password, chỉnh Quota `maxAccounts`, và xóa người dùng.
  - Phân quyền cô lập dữ liệu (Data Isolation): Mỗi user chỉ xem, sửa, xóa và điều khiển các bot game do mình sở hữu. Khóa trang `/play` kiểm tra quyền truy cập.
  - Cơ chế Quota Limit: Mặc định mỗi người dùng được cấp tối đa 1 bot (Admin tùy chỉnh nâng/hạ Quota). Tự động chặn khi user cố tình thêm bot vượt quá Quota.
  - Duy trì treo máy ngầm 24/7 khi đăng xuất hoặc đóng trình duyệt.
- Đã test bằng: `npm test` -> PASS.

## 2026-07-22 - UI Simplification (Removed Skills, Airship, Followers tabs)
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - Loại bỏ 3 tab "Kỹ Năng", "Phi Thuyền", "Companion" khỏi thanh chuyển tab của thẻ tài khoản theo yêu cầu tối giản UI.
  - Loại bỏ các tab-pane tương ứng và dọn dẹp các hàm render UI không còn sử dụng (`renderSkillsList`, `renderAirshipPanel`, `renderFollowersList`).
  - Đảm bảo tab mặc định tự chuyển về "Cơ Bản" hoặc "Nhật Ký".
- Đã test bằng: `npm test` -> PASS.

## 2026-07-17 - Full Implementation & Dashboard Launch
- File đã đổi: `server.js` (tạo mới/sửa), `package.json` (tạo mới), `accounts.json` (tạo mới), `test.js` (tạo mới), `public/index.html` (tạo mới), `public/app.css` (tạo mới), `public/app.js` (tạo mới/sửa), `play.html` (tạo mới), `xhrpg_canvas.js` (sửa).
- Đã làm:
  - Triển khai server Express và cơ sở dữ liệu lưu trữ cấu hình `accounts.json`.
  - Thiết lập luồng polling ngầm (2s/lần) giả lập client game, trích xuất dữ liệu trạng thái nhân vật và lọc logs hoạt động.
  - Tích hợp động cơ tự động nâng cấp: Auto Stats (theo danh sách ưu tiên), Auto Armor/Gear, Auto Skills, Auto Companions (Cat & Drone), Auto Mines (tự xây/nâng/bật khai thác 6 ô).
  - **Tự động chuyển Map**: Thêm tính năng **Auto Warp Map** trong phần cài đặt Core. Bot tự kiểm tra nếu map hiện tại khác map mong muốn và người chơi đủ cấp độ thì tự gửi request warp đến bản đồ mục tiêu.
  - **Tự động di chuyển đến Zone**: Thêm tính năng **Auto Farm Zone** và dropdown chọn Zone phù hợp động theo bản đồ hiện tại. Bot tự động tính toán khoảng cách đến tâm Zone: nếu khoảng cách > 90px sẽ kích hoạt chế độ di chuyển (`traveling: 1`), khi đến nơi (khoảng cách <= 90px) sẽ dừng di chuyển (`traveling: 0`) và thu hẹp bán kính khám phá (`explore_radius: 100`) để farm quanh khu vực chỉ định.
  - **Dịch chuyển & di chuyển TỨC THÌ**:
    - Chỉnh sửa dropdown **Bản đồ di chuyển**: Khi người dùng chọn bản đồ mới, client tự động gửi lệnh dịch chuyển (Warp) tức thì thay vì phải chờ tới lượt kiểm tra định kỳ của bot.
    - Chỉnh sửa dropdown **Khu vực farm (Zone)**: Khi người dùng chọn khu vực farm mới, hệ thống tự động kích hoạt tính năng **Auto Farm Zone** và ra lệnh cho bot lập tức đi tới khu vực đó ngay từ lượt poll tiếp theo.
    - Sửa lỗi mapping các tham số boolean `bot` và `lock_pos` trong request body sang dạng số `1`/`0` bắt buộc của game server.
  - **Khắc phục tự ngắt kết nối (Idle Kick)**:
    - Bẻ khóa file `xhrpg_canvas.js` gốc để bỏ qua bộ đếm thời gian treo máy ẩn tab (bằng cách liên tục gán `_lastInputAt = Date.now()` và `_tabHiddenAt = 0`).
    - Viết file `play.html` chứa client game chạy độc lập ngay trên local.
    - Xây dựng API Proxy trung chuyển cho tất cả request PHP (`/xhrpg_*.php`), tài nguyên hình ảnh/âm thanh (`/assets/*`) và CSS sang máy chủ Ragnalok để tránh lỗi CORS.
    - Chuyển hướng nút **🎮 Mở Trực Tiếp Client Game** trên dashboard trỏ tới `/play?line_uid=...&session_token=...` để người chơi chiến game trên trình duyệt local mà không bao giờ bị idle kick hay ngắt kết nối khi chuyển tab.
- Đã test bằng:
  - Tạo file `test.js` kiểm thử độc lập tất cả công thức tính toán vàng, tài nguyên nâng cấp theo cấp độ game (đều PASS).
  - Chạy thực tế server Express trên cổng 3000 (`node server.js`), kiểm tra log khởi chạy hoàn hảo.

## 2026-07-16 - UI Bugs & Log Console Fixes (T04)
- File đã đổi: `public/app.js` (sửa).
- Đã làm: Sửa lỗi chính tả biến `arGoldCost` thành `arCostGold` (lỗi này chặn đứng hàm render UI); bổ sung kiểm tra an toàn biến `l.msg` trong trình phân tích nhật ký để chống sập giao diện khi logs rỗng hoặc chứa dữ liệu trống.
- Đã test bằng: Chạy thử server và tải giao diện web -> Dropdown vùng bản đồ, danh sách kỹ năng và bảng logs hiển thị nội dung chính xác.

## 2026-07-16 - Integration of Automated Test Harness (T03)
- File đã đổi: `test.js` (tạo mới), `package.json` (sửa).
- Đã làm: Thêm file unit test kiểm thử các công thức tính vàng, gỗ, đá, sắt nâng cấp và đăng ký script `npm test`.
- Đã test bằng: `npm test` -> Kết quả: PASS.

## 2026-07-16 - Expansion of Game Management panels & tabs (T02)
- File đã đổi: `server.js` (+220 dòng), `public/app.css` (+150 dòng), `public/app.js` (+480 dòng).
- Đã làm: Thiết lập giao diện Tabs, viết logic nâng cấp & bật tắt kỹ năng, quản lý 6 mỏ đào quặng quặng, cấu hình đạn phi thuyền và nâng cấp đệ tử Companion/Titan Robot.
- Đã test bằng: Chạy thử server và kiểm tra giao diện trên trình duyệt -> Giao diện tải và tương tác mượt mà.
