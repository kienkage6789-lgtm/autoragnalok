# CHANGELOG.md

> Changelog of actual changes implemented.

## 2026-07-26 - Tích hợp Công cụ Xác minh Outbound Public IP cho từng Bot & Proxy Pool
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/index.html` (sửa).
- Đã làm:
  - **Backend `server.js`**:
    * Xây dựng route `GET /api/accounts/:line_uid/proxy-check`: Thực hiện gửi HTTP request qua đúng `Dispatcher` của bot tới IP echo service (`api.ipify.org`), trả về thông tin Outbound IP thực tế mà bot đang gửi gói tin ra bên ngoài cùng độ trễ ms.
    * Xây dựng route `GET /api/admin/proxies/verify-all`: Thực hiện test đồng loạt tất cả các luồng Proxy (Direct + HTTP/SOCKS5) trong Pool, trả về bảng đối chiếu IP public thực tế của từng luồng.
  - **Frontend `public/app.js` & `public/index.html`**:
    * Thêm nút **`🔍 Test IP`** bên cạnh dropdown Cấu hình Proxy trên Card từng bot (tab Cơ Bản), cho phép bấm kiểm tra ngay lập tức IP outbound thực tế của bot đó.
    * Thêm nút **`🔍 Test IP Public Tất Cả Luồng`** vào Admin Proxy Pool Modal, hỗ trợ Admin kiểm tra toàn bộ luồng kết nối trong hệ thống với 1 click.
- Đã test bằng: `node -c server.js`, `node -c public/app.js`, `npm test` -> PASS 100%.

---

## 2026-07-26 - Sửa lỗi Admin UI "Node cannot be found in the current page"
- File đã đổi: `public/app.js` (sửa).
- Nguyên nhân: Trước đó trong hàm `renderAccounts()`, khi người dùng đăng nhập quyền Admin, mỗi 1s khi poll cập nhật dữ liệu (`fetchAccounts`), mã nguồn thực hiện gán lại toàn bộ `groupCard.innerHTML = ...`. Việc này xóa sạch và tạo lại toàn bộ DOM Header, Select proxy, Chevron và cả container `user-bot-grid` mỗi 1 giây. Kết quả là khi người dùng hoặc công cụ tự động click/thao tác trên giao diện Admin, các thẻ DOM Node mục tiêu đã bị hủy và thay thế, gây ra lỗi `Node cannot be found in the current page`.
- Khắc phục:
  * Chỉ gán `groupCard.innerHTML` **một lần duy nhất** khi tạo mới thẻ `groupCard` của User (`if (!groupCard)`).
  * Đối với các lần poll refresh tiếp theo (`else`), chỉ cập nhật các phần tử văn bản động (`user-bot-count`, `user-expiry`, options proxy) mà **không ghi đè hay phá hủy `innerHTML`** của `groupCard`.
  * Giữ nguyên 100% các DOM Node `card` và `user-bot-grid` trong bộ nhớ DOM.
- Đã test bằng: `node -c public/app.js`, `npm test` -> PASS 100%.

---

## 2026-07-26 - Triển khai Giao diện Admin Phân Nhóm theo User & Đổi Proxy Hàng Loạt
- File đã đổi: `server.js` (sửa), `public/app.css` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Backend `server.js`**:
    * Xây dựng route `PUT /api/admin/users/:userId/proxy` thực hiện cập nhật và force assign Proxy đồng loạt cho tất cả các bot thuộc sở hữu của User đó, lưu tức thì vào `accounts.json`.
    * Bổ sung các thuộc tính metadata `ownerUsername`, `ownerRole`, `ownerExpiresAt` vào response `GET /api/accounts` đối với Admin.
  - **Frontend Styling `public/app.css`**:
    * Thiết kế các class UI Accordion `.user-group-card`, `.user-group-header`, `.user-avatar-badge`, `.user-bot-count-badge`, `.user-batch-proxy-box`, `.user-bot-grid`.
    * Tích hợp hiệu ứng trượt xoay chevron `▼` khi đóng/mở thẻ.
  - **Frontend Logic `public/app.js`**:
    * Trong `renderAccounts()`, khi người dùng đăng nhập là `admin`, hệ thống tự động nhóm các bot card theo User và render dưới dạng các thẻ Accordion chứa thông tin user + số lượng bot + hạn dùng.
    * **Tối ưu hiệu năng & Mặc định thu nhỏ (Collapsed by Default)**: Tất cả các thẻ User Accordion mặc định thu nhỏ lại khi vừa vào trang để tiết kiệm 100% tài nguyên CPU/RAM render DOM. Bot card chỉ được render và cập nhật khi Admin chủ động click mở rộng User đó.
    * Tích hợp hàm `toggleUserGroup(userId)` quản lý trạng thái đóng/mở trong `expandedUserGroups` để giao diện không bị giật hay nảy thẻ khi tự động refresh 1s/lần.
    * Tích hợp hàm `changeUserBatchProxy(userId, username, proxyId)` gửi request API đổi Proxy hàng loạt 1-click cho tất cả bot của user đó.
- Đã test bằng: `node -c server.js`, `node -c public/app.js`, `npm test` -> PASS 100%.

---

## 2026-07-26 - Tinh chỉnh màu sắc các hàng chỉ số (Soft & Muted Text Color UI)
- File đã đổi: `public/app.css` (sửa).
- Đã làm:
  - **Làm dịu màu con số**: Đổi màu phông chữ của `.stat-pill strong` và `.vital-num` từ màu trắng tinh chói mắt `var(--text-primary)` sang màu xám/bạc dịu nhẹ `#cbd5e1` (Slate-300) với `font-weight: 500/600`.
  - **Đồng bộ nhãn chỉ số**: Đổi màu nhãn `.stat-pill` sang màu Slate-400 `#94a3b8`.
  - **Thu nhỏ phông chữ**: Giảm kích thước phông chữ của hàng tỉ lệ farm `.combat-rates-strip` xuống `0.70rem` và hàng tài nguyên `.resources-strip` xuống `0.68rem`.
  - **Tối ưu phông nền strip**: Hạ độ mờ phông nền các khối strip xuống nhẹ nhàng (`rgba(99, 102, 241, 0.05)` và `rgba(0, 0, 0, 0.2)`), loại bỏ độ viền chói tương phản cao.
- Đã test bằng: `npm test` -> PASS 100%.

---

## 2026-07-25 - Fix thanh HP Max, thêm thanh MP mới, fix EXP real-time
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Chẩn đoán lỗi**:
    * HP hiển thị sai (ví dụ "287 / 237") do `GET /api/accounts` trả về `hp_max` thô (base stat) trong khi `player.hp` là giá trị thực đã cộng thêm VIT bonus và Ragnalok multiplier từ server game.
    * MP hiển thị "-- / --" do game API **không có field `mp_max`** — đây là giá trị được tính toán từ `intel_eff` trong client, không phải field raw.
    * EXP bar không cập nhật do server chưa expose field `exp` và `mp` trong object `player` của response `GET /api/accounts`.
  - **Backend `server.js` — Refactor khối `player` trong `GET /api/accounts`**:
    * Thêm `exp: p.exp` và `mp: p.mp` vào response (đúng tên field game API trả về).
    * Tính và expose `hp_max_eff`: đồng bộ công thức `xhrpg_canvas.js` line 3791: `floor((hp_max + VIT_bonus) × rag_mult)` trong đó `VIT_bonus = max(0, (vit_eff-5)*2 - max(0, vit-5))`.
    * Tính và expose `mp_max_calc`: đồng bộ công thức `xhrpg_canvas.js` line 3810: `floor((50 + intel_eff × 5) × rag_mult)`.
    * Xóa `mp_max: bot.player.mp_max` (field không tồn tại, luôn trả về `undefined`).
  - **Frontend `public/app.js`**:
    * Template HTML card: thêm `vital-row` 💧 MP với element `mp-bar-{uid}` và `mp-txt-{uid}`, đặt ngay sau HP row và trước Armor.
    * `updateCard()` — HP bar: dùng `p.hp_max_eff || p.hp_max || 100` thay vì `p.hp_max` thô. Hiển thị `"HP / MAX (PCT%)"`.
    * `updateCard()` — MP bar: dùng `p.mp_max_calc || 75` (fallback intel=5: 50+5×5=75). Nếu `p.mp` undefined thì hiển thị `p.mp ?? mpMax` (giả định đầy).
    * `updateCard()` — EXP: không thay đổi công thức `expNext()`, chỉ cần field `exp` được server trả về đúng là hoạt động.
  - **Frontend `public/app.css`**:
    * Thêm class `.bar-mp { background: linear-gradient(to right, #38bdf8, #0ea5e9); }` — màu cyan nhạt, phân biệt với `.bar-armor` (xanh đậm) và `.bar-hp` (xanh lá).

---


## 2026-07-25 - Tích hợp hệ thống Sao lưu qua Telegram Bot & Phục hồi qua Web UI
- File đã đổi: `package.json` (sửa), `server.js` (sửa), `public/index.html` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Cài đặt thư viện mới**:
    * Cài đặt `adm-zip` để đóng gói dữ liệu và `multer` để xử lý file upload từ Web UI.
  - **API Backend (`server.js`)**:
    * Mở rộng endpoint `PUT /api/admin/proxies/settings` để cập nhật cấu hình Telegram Bot.
    * Xây dựng hàm helper `performTelegramBackup()` thực hiện nén `users.json`, `proxies.json` và `accounts.json` thành file ZIP tạm thời trong RAM và gửi document trực tiếp lên API Telegram `sendDocument` (Sử dụng module `https` nguyên bản của Node.js, xây dựng thủ công body `multipart/form-data` và ép kết nối qua IPv4 bằng cấu hình `family: 4` để khắc phục triệt để lỗi DNS/IPv6 resolution gây ra lỗi mạng `fetch failed` trên các VPS Ubuntu).
    * Xây dựng route `POST /api/admin/backup-now` cho phép tạo và gửi sao lưu thủ công lên Telegram ngay lập tức.
    * Xây dựng route `GET /api/admin/backup-download` cho phép tải trực tiếp file zip sao lưu về máy tính cá nhân.
    * Xây dựng route `POST /api/admin/restore-upload` nhận file zip, giải nén ghi đè cấu hình, dừng toàn bộ bot đang chạy và reload toàn bộ hệ thống (hot-reload) để chạy bot lại theo cấu hình phục hồi mà không cần restart server.
    * Thiết lập `setInterval` chạy ngầm kiểm tra định kỳ mỗi 5 phút để kích hoạt sao lưu tự động nếu đã tới thời điểm quy định.
  - **Giao diện Frontend (`public/index.html` & `public/app.js`)**:
    * Thêm tab "Sao Lưu" vào Admin Panel modal và thiết lập chuyển đổi hiển thị tab (`switchAdminTab`).
    * Thiết kế form cấu hình Telegram settings và nút bấm Lưu cấu hình (`saveBackupSettings`).
    * Thiết kế nút bấm Gửi sao lưu Telegram (`triggerTelegramBackupNow`) và Tải backup về máy (`downloadBackupNow`).
    * Thiết kế input file ẩn và nút tải lên khôi phục dữ liệu (`handleRestoreUpload`) có hiển thị cảnh báo xác nhận nguy cơ ghi đè.
    * Tích hợp cảnh báo và chặn lưu cấu hình ở cả Frontend và Backend nếu người dùng nhập nhầm ID Bot vào ô Chat ID.

---

## 2026-07-25 - Cải tiến Toàn diện Hệ thống Proxy Pool
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Nhất quán IP (IP Persistence)**:
    * Lưu trữ trường `proxyId` trực tiếp vào file `accounts.json` của mỗi tài khoản game.
    * Khi khởi chạy server hoặc bot khởi động, hệ thống sẽ ưu tiên dùng `proxyId` đã lưu để kết nối, đảm bảo IP nhất quán tuyệt đối.
  - **Tự động chuyển vùng (Failover & Auto Re-route)**:
    * Thiết lập bộ đếm lỗi kết nối `consecutiveErrors` trong poller loop.
    * Nếu xảy ra lỗi kết nối liên tiếp 3 lần, hệ thống tự động gọi hàm `failoverAssignment()` để đổi bot sang proxy dự phòng khỏe mạnh khác, hủy agent cũ, đồng thời lưu cấu hình mới và ghi log thông báo. Nếu proxy bị lỗi quá 3 lần sẽ tự động chuyển sang trạng thái tạm dừng (`active = false`).
    * Sửa lỗi khi tắt (deactivate) hoặc xóa (delete) proxy từ Admin Panel: Cập nhật hàm `_reassignFrom` để kích hoạt việc tự động gán lại proxy mới ngay lập tức cho các bot bị ảnh hưởng, cập nhật biến `bot.proxyId` trong RAM và tự động lưu cấu hình mới vào file `accounts.json` (trước đó chỉ xóa trong RAM `_assignments` dẫn đến bot vẫn ghi nhớ và cố kết nối qua proxy đã bị tắt).
  - **Công cụ đo đạc kết nối (Proxy Connection Tester)**:
    * Xây dựng route `POST /api/admin/proxies/:id/test` sử dụng dispatcher của proxy tương ứng để ping thử tới game server và trả về độ trễ thời gian thực.
    * Thêm nút "⚡ Test" bên cạnh mỗi proxy trong danh sách quản trị Admin để quản trị viên kiểm tra nhanh độ ổn định.
  - **Gán Proxy thủ công**:
    * Cho phép thay đổi gán proxy của từng bot qua API `PUT /api/accounts/:line_uid` đối với tài khoản Admin.
    * Thêm dropdown Cấu hình Proxy dưới tab "Cơ Bản" trên card bot (chỉ hiển thị khi vai trò là Admin).

---

## 2026-07-25 - Thêm Tab hiển thị Kỹ năng sở hữu và Bật/Tắt Tự động sử dụng (Auto Use Toggle)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Cập nhật Backend (`server.js`)**:
    * Trong endpoint `GET /api/accounts`, bổ sung hai trường `skills` và `skill_auto` từ `bot.player` vào trong payload phản hồi để gửi về Client.
  - **Thiết kế Styling CSS (`public/app.css`)**:
    * Định nghĩa lưới hiển thị kỹ năng `.skills-grid`, thẻ kỹ năng `.skill-item-card`, nhãn loại kỹ năng chủ động/bị động `.skill-item-tag.active` / `.skill-item-tag.passive`.
    * Thiết kế nút bấm `.btn-skill-toggle` với hiệu ứng màu sắc nổi bật tương thích với 2 trạng thái Bật (Xanh lá) và Tắt (Đỏ).
    * Giới hạn chiều cao tối đa của lưới kỹ năng (`max-height: 220px`), thiết lập thanh cuộn dọc (scroll) thẩm mỹ đồng bộ và bổ sung media query để tự động xếp 1 cột trên giao diện mobile nhằm giữ sự cân đối, hài hòa tuyệt đối với các tab thông số khác.
  - **Cập nhật Frontend Dashboard (`public/app.js`)**:
    * Khai báo danh sách metadata kỹ năng tĩnh `SKILL_DEFS` bao gồm dịch tên tiếng Việt, emoji biểu tượng, phân loại kiểu và nhánh.
    * Thêm tab điều hướng "Kỹ Năng" (`#tab-btn-skills-...`) vào cấu trúc card skeleton và container tương ứng (`#pane-skills-...`).
    * Trong hàm `updateCard()`, tiến hành lọc ra những kỹ năng nhân vật đang sở hữu (Level > 0). Đối với các kỹ năng chủ động (hoặc tháp pháo đôi), hiển thị nút bật tắt tự động.
    * Xây dựng hàm gọi hành động `toggleSkillAuto(uid, skillId, btn)` để gửi request thay đổi trạng thái tự động sử dụng của kỹ năng đến máy chủ game.

---

## 2026-07-25 - Ngăn chặn chọn Bản đồ vượt cấp (Map Level Validation)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Kiểm soát & Ngăn chặn Client (`public/app.js`)**:
    * Cập nhật hàm `changeTargetMap` để lấy cấp độ hiện tại của nhân vật từ DOM `#lv-txt-...`.
    * So sánh cấp độ nhân vật với cấp độ yêu cầu tối thiểu của bản đồ đích (Map 1: Lv.1, Map 2: Lv.25, Map 3: Lv.40, Map 4: Lv.20, Map 5: Lv.55, Map 6: Lv.70).
    * Nếu không đủ điều kiện, hiển thị hộp thoại cảnh báo `alert` trực quan và lập tức gọi `fetchAccounts()` để hồi phục (revert) lựa chọn dropdown về bản đồ cũ thay vì gửi API.
    * Bổ sung kiểm tra HTTP status trả về khi gọi PUT API, hiển thị thông báo lỗi từ server nếu có.
  - **Xác thực an toàn Backend (`server.js`)**:
    * Trong endpoint cập nhật cấu hình `PUT /api/accounts/:line_uid`, kiểm tra nếu tham số cập nhật chứa `targetMap` thì so sánh cấp độ hiện tại của nhân vật (`bot.player.lv`) với cấp độ tối thiểu của map đó trong `MAP_DEFS`. Nếu không đủ, chặn lưu và trả về mã lỗi HTTP 400.
    * Trong endpoint kích hoạt di chuyển trực tiếp `POST /api/accounts/:line_uid/action` khi `action === 'warp'`, kiểm tra cấp độ tương tự trước khi gửi lệnh tới game server. Trả về HTTP 400 nếu vi phạm cấp độ.

---

## 2026-07-25 - Cập nhật Bản đồ Mới (Lv.55 và Lv.70) và Đồng bộ Đấu trường
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `game_api_reference.md` (sửa), `project_summary.md` (sửa).
- Đã làm:
  - **Cập nhật Backend (`server.js`)**:
    * Khai báo Map 5 (`Tàn tích Cổ đại`, yêu cầu Lv.55+, emoji `🏛️`) và Map 6 (`Núi lửa Sôi trào`, yêu cầu Lv.70+, emoji `🌋`) vào mảng tĩnh `MAP_DEFS`.
    * Đổi emoji của Map 4 (Đấu trường Arena) từ `🏛️` thành `⚔️` để đồng bộ 100% với cập nhật mới từ client game.
  - **Cập nhật Frontend UI (`public/app.js`)**:
    * Bổ sung các tùy chọn `<option>` tương ứng cho Map 5 và Map 6 vào dropdown select bản đồ di chuyển `#sel-map-...` trong hàm `buildCardSkeleton()`.
    * Cập nhật lại emoji và nhãn hiển thị của Map 4 trong dropdown select bản đồ.
  - **Tài liệu và tóm tắt**:
    * Đồng bộ danh sách bản đồ mới trong tài liệu hướng dẫn tra cứu nhanh `game_api_reference.md` và tài liệu tổng kết `project_summary.md`.

---

## 2026-07-25 - Tự động nhận diện định dạng Proxy thô (IP:PORT:USER:PASS hoặc IP:PORT)
- File đã đổi: `server.js` (sửa), `public/index.html` (sửa).
- Đã làm:
  - **Tự động phân giải định dạng thô (`server.js`)**:
    * Cập nhật route `POST /api/admin/proxies` để tự động kiểm tra định dạng proxy đầu vào.
    * Hỗ trợ tự động phân tích cú pháp chuỗi dạng `IP:PORT:USER:PASS` thành URL chuẩn `http://USER:PASS@IP:PORT`.
    * Hỗ trợ tự động phân tích cú pháp chuỗi dạng `IP:PORT` thành URL chuẩn `http://IP:PORT`.
    * Tự động đặt nhãn hiển thị (label) mặc định cho proxy bằng chuỗi `IP:PORT` sạch để tránh làm hiển thị thông tin tài khoản mật khẩu ra ngoài giao diện (kể cả khi admin không nhập nhãn).
  - **Cập nhật Placeholder UI (`public/index.html`)**:
    * Thay đổi placeholder của ô nhập URL Proxy mới để gợi ý và hỗ trợ các định dạng proxy dạng thô ngăn cách bằng dấu hai chấm.

---

## 2026-07-25 - Ẩn thông tin Proxy đối với Người dùng thường
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Giới hạn API Backend (`server.js`)**:
    * Trong route `GET /api/accounts`, trường `proxyInfo` chỉ được gán giá trị từ `proxyPool.getBotProxyInfo(...)` nếu user yêu cầu là `admin`. Đối với user thường, trường này được gán là `null` để tránh lộ thông tin proxy.
  - **Tối ưu hóa & Ẩn Badge Frontend (`public/app.js`)**:
    * Ẩn badge hiển thị thông tin proxy mặc định bằng CSS `display: none` trên template khung tài khoản trong hàm `buildCardSkeleton`.
    * Trong hàm `updateCard`, bổ sung điều kiện kiểm tra vai trò người dùng `currentUser.role === 'admin'`. Chỉ hiển thị và cập nhật Badge khi người dùng đăng nhập là admin và có dữ liệu `proxyInfo` từ server. Ngược lại, ẩn hoàn toàn badge này khỏi giao diện của người dùng thường.

---

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

## 2026-07-26 - Sửa lỗi tính toán chỉ số tiêu diệt quái/phút (Kills Per Minute)
- File đã đổi: `server.js` (sửa), `test.js` (sửa), `.agent/TASKS.md` (sửa), `.agent/DECISIONS.md` (sửa).
- Đã làm:
  - **Khắc phục lỗi lọc sự kiện (Event Parsing)**:
    * Thay thế điều kiện cũ `if (e.type === 'kill' || cleanMsg.includes('💀'))` bằng `if (e.type === 'kill')`.
    * Nguyên nhân: Trước đây các thông báo như nhân vật hy sinh `💀 Bạn đã hy sinh...` hoặc thua cuộc PvP `💀 K.O.` đều chứa biểu tượng `💀`, dẫn đến việc đếm nhầm cái chết của chính nhân vật thành số quái hạ gục.
  - **Khắc phục lỗi thuật toán cửa sổ trượt (Sliding Window Algorithm)**:
    * Trong `getCombatRates()`, sửa công thức tính thời điểm bắt đầu đo `startOfMeasurement`:
      * Cũ: `Math.max(this.startTime, oldestTime)` ➔ Lấy `oldestTime` (thời điểm gần nhất vừa đòn kill), khiến khoảng cách thời gian `diffMs` bị rút ngắn chỉ còn vài giây (chỉ 0.1 phút), làm mẫu số chia quá nhỏ ➔ Tỉ lệ `killsPerMin` bị nhân phồng lên gấp hàng chục lần thực tế.
      * Mới: `Math.max(this.startTime, cutoff)` ➔ Chọn mốc thời gian lớn hơn giữa lúc bot bắt đầu chạy và 5 phút trước (cutoff).
    * Giúp tính toán chính xác tuyệt đối tổng số phút thực tế trôi qua trong 5 phút chạy bot.
  - **Đơn vị thử nghiệm (Unit Test)**: Bổ sung test case kiểm thử `getCombatRates()` trong `test.js` -> `npm test` PASS 100%.
  - **Sửa lỗi công tắc Sao Lưu Tự Động Telegram**: Khắc phục lỗi nút gạt `#backup-auto-enabled` không thể bật/tắt do thiếu `<label class="switch">` và bị thẻ `<span>` đè lên sự kiện click. Đồng thời bổ sung `onchange="saveBackupSettings()"` để tự động lưu ngay khi gạt công tắc.

---

## 2026-07-26 - Thiết kế lại Giao diện Dashboard (Compact & Balanced Layout)
- File đã đổi: `public/app.css` (sửa), `public/app.js` (sửa), `ui_redesign_plan.md` (tạo mới), `.agent/TASKS.md` (sửa).
- Đã làm:
  - **Tối ưu hóa diện tích chiều cao (Giảm 45%)**: Thu nhỏ chiều cao của mỗi Card bot từ ~750px+ xuống còn ~400px, cho phép quan sát 4-5 bot cùng lúc trên màn hình PC.
  - **Header Card 1 dòng duy nhất**: Gom gọn Tên bot, Badge Trạng thái, Proxy badge, Cấp độ và bộ nút 🎮 Play, ✏️ Sửa, 🗑️ Xóa trên cùng 1 hàng Flexbox.
  - **Vitals 2 Cột x 2 Hàng (Slim Bars 7px)**: Gom 4 thanh HP, MP, Armor, EXP thành lưới 2x2 với thanh progress bar 7px thanh thoát và chữ số tỉ lệ sắc nét.
  - **Hợp nhất Stats & Resource Strip**: Tích hợp các chỉ số farm (⚔️/m, 💰/m, ⭐/m) và tài nguyên (Gold, Wood, Stone, Iron, Copper, Herb) thành 1 hàng Badge Pills mờ duy nhất.
  - **Segmented Control Tabs**: Nút chuyển Tab dạng viên thuốc nhỏ gọn (`padding: 4px 6px`), giảm padding form controls từ `10px` xuống `5px`, switch nhỏ gọn `34x18px`, và Terminal Log height `150px`.
  - **Ẩn các phần tử thừa theo yêu cầu**: Đã ẩn khối công tắc `🚀 Chạy treo máy (Bot)` và khối nâng `Chỉ số chính` (Stat Points) trên giao diện Thẻ Cơ Bản để Card gọn gàng tối đa.
- Đã test bằng: `npm test` và `node -c public/app.js` -> Cả hai đều PASS thành công!

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
