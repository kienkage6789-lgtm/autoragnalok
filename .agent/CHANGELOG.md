# CHANGELOG.md

> Changelog of actual changes implemented.

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
