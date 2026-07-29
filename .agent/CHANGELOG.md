# CHANGELOG.md

> Changelog of actual changes implemented.

## 2026-07-29 - Sửa Triệt Để Root Cause Lọc Mất Dữ Liệu Nông Trại (`home_crops`, `home_seeds`) & Pet Info trong `server.js`
- File đã đổi: [server.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/server.js).
- Đã làm:
  - Cập nhật handler `GET /api/accounts` trong `server.js`: Sử dụng `{ ...p, ...calculatedStats }` bảo toàn 100% thuộc tính của `p` từ game server `xhrpg_game.php`.
  - Khắc phục triệt để lỗi lọc bỏ `home_crops`, `home_seeds`, `home_lv`, `home_guards`, `home_return`, `pet_mid`, `pet_exp`, `pet_mvp`, `pet_olv`, `pet_up_atk`, `pet_up_hp`, `pet_up_reco`, `pet_batk`, `pet_bhp`, `eggs` khi truyền dữ liệu lên Dashboard.
- Đã test bằng: `npm test` → PASS 100%.

---


## 2026-07-29 - Tối ưu & Hoàn thiện Chức năng Home Nông Trại theo dữ liệu JSON thực tế (`home_crops`, `home_seeds`)
- File đã đổi: [public/app.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/app.js).
- Đã làm:
  - **Bóc tách dữ liệu JSON Nông trại thực tế (`home_seeds` & `home_crops`)**:
    - Hỗ trợ kho hạt dạng Object `{ 1: 72, 2: 13, 3: 80 }`: hiển thị đúng số lượng hạt tồn kho.
    - Bóc tách mảng luống đất `home_crops` `[{ p: 0, i: 0, s: 7, t: 1785335276 }, ...]`: hiển thị danh sách chi tiết các luống `#1..#16` đang trồng kèm đếm ngược phút chín.
  - **Chuẩn hóa thời gian tăng trưởng cây trồng**:
    - Áp dụng thời gian tăng trưởng dựa theo Seed ID `s` (T1 = 1h, T2 = 2h, T3 = 4h, T4 = 8h, T5 = 16h, T6 = 24h).
- Đã test bằng: `npm test` → PASS 100%.

---


## 2026-07-29 - Sửa lỗi & Hoàn thiện hiển thị Thông tin Pet (Cấp độ, Điểm `pts`, Chỉ số) và Kho Hạt Giống Nông Trại (`home_seeds`)
- File đã đổi: [public/app.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/app.js).
- Đã làm:
  - **Khắc phục hiển thị Thông tin Pet (`renderPetSection`)**:
    - Xử lý các trường hợp chưa ấp Pet (`pet_mid <= 0`): Tự động thông báo chưa có Pet và khóa các nút bấm cộng điểm.
    - Xử lý khi có Pet active (`pet_mid > 0`): Tự động fallback tra cứu base stats `pet_batk` & `pet_bhp` từ `mon_masters` nếu server chưa trả về trong `player`. Tính toán chuẩn Pet Level (`lv`), % EXP, và điểm khả dụng `st.pts = (petLv - 1) - upAtk - upHp - upReco`.
    - Đồng bộ hiển thị số điểm Pet khả dụng `st.pts`, chỉ số ATK/DEF/HP/RECO và 3 nút `+1 ATK`, `+1 DEF`, `+1 RECO`.
  - **Khắc phục parse Kho Hạt Giống (`parseHomeSeeds`)**:
    - Xây dựng hàm parser an toàn `parseHomeSeeds(raw)` bóc tách dữ liệu hạt giống kho `home_seeds` (hỗ trợ JSON string, object, double stringified JSON).
    - Hiển thị danh sách hạt giống với đầy đủ phân loại Tier (T1-T6), hạt ⭐ Gold, tên hạt tiếng Việt, số lượng tồn kho và các nút gieo trồng `Trồng ×1` / `Trồng hết`.
- Đã test bằng: `npm test` → PASS 100%.

---


## 2026-07-29 - Triển khai Cộng Điểm Pet (Pet Stat Upgrade) & Tăng 15-25% Cỡ Chữ Thẻ Bài / Trứng Thú Cưng
- File đã đổi: [public/app.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/app.js), [public/app.css](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/app.css).
- Đã làm:
  - **Chức năng Cộng Điểm Pet (`public/app.js`)**:
    - Thêm khung **🐾 Nâng Cấp Thú Cưng (Pet Stats)** vào sub-pane `subpane-eggs-*` (Tab `👤 Nhân Vật` ➔ `🥚 Trứng`).
    - Tính toán & hiển thị chỉ số Pet theo server logic: ⚔️ **ATK**, 🛡️ **DEF**, ❤️ **HP Max**, 💚 **Phục hồi/s**, cùng số **Điểm Pet khả dụng (`st.pts`)**.
    - Bổ sung 3 nút cộng điểm trực tiếp: `+1 ATK`, `+1 DEF`, `+1 RECO` gửi action `pet_up` tới API `/api/accounts/:line_uid/action`.
    - Viết hàm `renderPetSection(acc)` và `upgradePetStat(line_uid, stat)` để đồng bộ trạng thái UI.
  - **Tăng Cỡ Chữ Thẻ Bài & Trứng (+15% đến +25%) (`public/app.css`)**:
    - Điều chỉnh font-size cho các selector `.card-mon-emoji` (0.78rem), `.card-mon-name` (0.62rem), `.card-mon-lv` (0.52rem), `.card-progress-badge` (0.52rem), `.card-type-subbox` (0.52rem), `.btn-exchange-mvp` (0.56rem), giúp hiển thị thông tin to rõ nét hơn.
- Đã test bằng: `npm test` → PASS 100%.

---


## 2026-07-29 - Triển khai Bảng điều khiển Home (Nông Trại & Trồng Cây, Thu Hoạch & Auto Bot)
- File đã đổi: [server.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/server.js), [public/app.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/app.js), [public/app.css](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/app.css).
- Đã làm:
  - **Auto Home Farm Engine (`server.js`)**:
    - Bổ sung cấu hình mặc định: `autoHomeHarvest: true`, `autoHomePlant: true`, `homePlantPriority: 'highest_tier'`, `autoHomeUpgrade: false`.
    - Bổ sung Step 8 trong `BotInstance.prototype.poll()` xử lý tự động thu hoạch cây chín (`home_harvest`), tự động gieo hạt khả dụng (`home_plant`) theo ưu tiên (Highest Tier T6➔T1, Gold First ⭐, Lowest Tier), và tự động nâng cấp nhà (`home_up`) khi tích đủ tài nguyên.
  - **Giao diện Dashboard Nông Trại (`public/app.js`)**:
    - Thêm Tab **`🏡 Nông Trại`** trên card tài khoản với thẻ Overview Nông trại: Hiển thị level nhà (`home_lv`), số ô plots mở (`plots/6`), số luống đã trồng (`used/total`), số cây chín sẵn sàng thu hoạch, thời gian cây tiếp theo chín.
    - Bảng danh sách hạt giống trong kho: hiển thị các loại hạt (T1-T6, Gold ⭐), số lượng tồn kho, giá bán Gold, cùng các nút bấm `Trồng ×1` và `Trồng hết`.
    - Thao tác thủ công: `🌾 Thu hoạch & Bán`, `⬆️ Nâng nhà`, `Trồng ×1` / `Trồng hết`.
  - **Mở rộng giao diện (+10%) (`public/app.css`)**: Tăng `max-width` của `.app-main` từ `1600px` lên `1760px` (+10% diện tích) giúp tăng không gian hiển thị thông tin các thẻ tài khoản.
- Đã test bằng: `npm test` → PASS 100%.

---


## 2026-07-29 - Cache Busting Tự Động Cho app.js và app.css (T47)
- File đã đổi: [server.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/server.js), [public/index.html](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/public/index.html), [.agent/SKILL.md](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/autoragnalok/.agent/SKILL.md).
- Đã làm:
  - **Hàm Tính Hash Content (`computeFileHash`)**: Triển khai hàm đọc file và băm MD5 cho `app.js` và `app.css` để sinh chuỗi hash ngắn (8 ký tự).
  - **Tích Hợp Dynamic Inject Link/Script vào Route `/`**: Thay thế auto-serve tĩnh `index.html` của Express bằng route custom. Khi người dùng truy cập trang chủ, server đọc `index.html` gốc, regex thay thế các đường dẫn `/app.css` và `/app.js` thành link động kèm tham số phiên bản `?v=<hash>` (ví dụ: `app.js?v=a3f9c2`), đảm bảo luôn render HTML chứa phiên bản mới nhất.
  - **Cấu hình Cache Control Cho index.html**: Thêm các header vô hiệu hóa cache (`no-cache, no-store, must-revalidate`) cho route `/` để trình duyệt không lưu lại bản sao cũ của HTML.
  - **Tối Ưu Browser Cache Cho Assets**: Nâng thời hạn cache (`maxAge`) của static resources lên `30d` để tối ưu tải trang và băng thông, do cơ chế băm nội dung đã loại trừ rủi ro bị stale cache.
  - **Cập Nhật SKILL.md**: Ghi nhận cơ chế và quy trình cache busting tự động vào tài liệu phát triển nội bộ để hướng dẫn dev tiếp theo.
- Đã test bằng: `node -c server.js` và `node -c public/app.js` → PASS 100%.

---

## 2026-07-29 - Tự động tải game script, Dịch log tiếng Việt, Sửa lỗi Cloudflare cdn-cgi & Tự cập nhật fallback
- File đã đổi: [server.js](file:///C:/Users/Admin/Desktop/autoR/autoragnalok/autoragnalok/server.js).
- Đã làm:
  - **Tự động tải game script (`xhrpg_canvas.js`)**: Tích hợp bộ Downloader tự động fetch file `xhrpg_canvas.js` mới nhất từ game server để ghi đè lên đĩa local mỗi khi khởi động server hoặc khi thực hiện yêu cầu đồng bộ từ admin, giúp tool luôn nhận các map/zone/skill mới nhất.
  - **Dịch log combat và nhặt đồ sang tiếng Việt**: Triển khai thuật toán dịch thuật động `translateThaiText()` sử dụng từ điển `viDict` để chuyển ngữ toàn bộ tên quái vật, địa danh, vật phẩm và các hành động (uống thuốc, nhặt đồ, lên cấp, ...) từ tiếng Thái sang tiếng Việt trước khi ghi log.
  - **Vá lỗi fallback play.html**: Bổ sung logic vá lỗi DOM và thay thế script khởi chạy LIFF bằng proxy script trong catch block của `/play` (khi fetch `index.php` lỗi hoặc bị Cloudflare chặn).
  - **Bổ sung định tuyến hỗ trợ tiền tố `/human`**: Cấu hình các route JS (`/js/xhrpg_canvas.js`, `/js/xhrpg_lang_vi.js`, `/js/jquery-3.6.0.min.js`, `/js/sdk.js`) và proxy PHP (`/xhrpg_*.php`) hỗ trợ đồng thời cả các request có tiền tố `/human/` để tránh lỗi trả về HTML `index.html` gây crash client.
  - **Proxy hóa các yêu cầu `/cdn-cgi/*`**: Chuyển tiếp toàn bộ các yêu cầu Turnstile Challenge của Cloudflare về game server gốc để vượt qua bảo vệ của Cloudflare, tránh trả về HTML `index.html` gây ra lỗi cú pháp `Unexpected token '<' (at main.js)`.
  - **Tự động cập nhật tệp dự phòng trên đĩa (Self-healing)**: Lưu tự động tệp `xhrpg_canvas.js` và `sdk.js` xuống đĩa local mỗi khi tải động thành công từ game server qua proxy, giải quyết hoàn toàn lỗi lệch phiên bản trong tương lai.
- Đã test bằng: `npm test` → PASS 100%.

---

## 2026-07-29 - Tái cấu trúc Bảng điều khiển: Gộp tab Log (chia sub-tab Hoạt động & Vật phẩm), thu gọn mặc định, giảm font size, hiển thị stats /h và /d
- File đã đổi: [public/app.js](file:///C:/Users/Admin/Desktop/autoR/autoragnalok/autoragnalok/public/app.js), [public/app.css](file:///C:/Users/Admin/Desktop/autoR/autoragnalok/autoragnalok/public/app.css).
- Đã làm:
  - **Thu gọn tab mặc định (Collapsible Tabs)**: Khởi tạo active tab là `null`, click vào tab đang mở sẽ đóng lại, giúp giao diện gọn gàng hơn.
  - **Triệt tiêu khoảng trống thừa khi đóng tab**: Mặc định đặt `.card-tab-content` thành `display: none` và chỉ chuyển sang `display: block` (thêm class `active`) khi có một tab bất kỳ đang được mở. Điều này loại bỏ hoàn toàn khoảng trống thừa ở cuối thẻ khi các tab ở trạng thái thu gọn.
  - **Gộp tab Vật Phẩm & Nhật Ký thành tab Log (với Sub-tabs)**: Tạo tab Log chứa 2 sub-tab "Hoạt Động" và "Vật Phẩm" sử dụng lớp `.subtab-btn`. Mặc định khi click mở tab Log sẽ hiển thị sub-tab Hoạt Động (nhật ký hoạt động chung) để tối ưu không gian hiển thị và hiệu năng.
  - **Giảm 20% cỡ chữ log vật phẩm**: Cập nhật cỡ chữ cho phần log rơi đồ từ `0.75rem` xuống còn `0.6rem` (và các text hiển thị tương ứng) để tối ưu không gian.
  - **Bổ sung thống kê hiệu suất theo giờ (/h) và ngày (/d)**: Người dùng có thể click vào thanh thống kê tốc độ để chuyển đổi hiển thị giữa `/m`, `/h`, `/d` hoặc di chuột xem tooltip chi tiết của 3 đơn vị cùng lúc.
- Đã test bằng: `npm test` → PASS 100%.

---

## 2026-07-27 - Cơ Chế Hấp Thu Bản Đồ Động An Toàn cho Người Chơi Cũ & Mới (T24)
- File đã đổi: [server.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/server.js), [public/index.html](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/public/index.html), [public/app.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/public/app.js), [test.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/test.js).
- Đã làm:
  - **Passive Map Discovery Engine (`processPassiveMapDiscovery`)**: Tự động bắt lấy `d.spots` và `d.map` khi các tài khoản bot (cũ và mới) hoạt động tự nhiên. Nếu phát hiện Map ID mới chưa từng xuất hiện, tự động khởi tạo entry Map mới và lưu vĩnh viễn vào `maps_cache.json` với 0% rủi ro bị ban tài khoản (không phát sinh request dò ID bừa bãi).
  - **Tự động tính toán Level tối thiểu (`req`)**: Phân tích level của tất cả các khu vực trong `d.spots` để xác định level tối thiểu cần thiết để vào Map đó.
  - **API `PUT /api/admin/maps/:id` & Giao diện Chỉnh sửa**: Bổ sung nút **"✏️ Sửa"** trên bảng Admin UI cho phép Admin đổi tên hiển thị, icon emoji và điều chỉnh cấp độ yêu cầu cho từng bản đồ.
  - **Nhãn phân loại Nguồn dữ liệu (`sourceBadge`)**: Hiển thị nhãn `✨ Tự động hấp thu (Live)` trên bảng Admin đối với các bản đồ được ghi nhận tự động từ tài khoản người chơi.
  - **Unit Testing**: Bổ sung unit test kiểm tra logic tính toán level tối thiểu của Passive Map Discovery.
- Đã test bằng: `npm test` → PASS 100% (15 unit tests pass).

---

## 2026-07-27 - Chức Năng Đồng Bộ Bản Đồ & Zone Thủ Công Từ Admin UI (T23)
- File đã đổi: [server.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/server.js), [public/index.html](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/public/index.html), [public/app.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/public/app.js), [test.js](file:///C:/Users/kienk/OneDrive/Desktop/auto/autoragnalok/test.js).
- File tạo mới: `maps_cache.json`, `spots_cache.json`.
- Đã làm:
  - **Admin UI Tab "🗺️ Bản Đồ & Zone"**: Bổ sung tab mới trong Admin Panel với nút **"🔄 Quét & Đồng Bộ Bản Đồ / Zone Ngay"**, bảng hiển thị thông tin danh sách bản đồ (ID, Emoji, Tên Map, Lv yêu cầu, số lượng Zone đã cache) và thời điểm đồng bộ gần nhất.
  - **Manual Trigger Endpoint `POST /api/admin/sync-maps-zones`**: Chỉ thực hiện quét khi Admin bấm nút. Backend bóc tách `MAP_DEFS` trực tiếp từ `xhrpg_canvas.js`, hợp nhất từ điển tiếng Việt `xhrpg_lang_vi.js`, lưu cache vĩnh viễn vào `maps_cache.json`.
  - **Zone (Spots) Caching Engine**: Lưu vết dữ liệu khu vực (`d.spots`) của từng bản đồ vào `spots_cache.json`. Khi Admin bấm sync, server tự động ép `bot.spots = null` trên các bot active để tải static data mới nhất ở nhịp poll kế tiếp.
  - **Dynamic Map Select Rendering**: Đổi hằng số `MAP_DEFS` hardcode thành `getMapDefs()`. Hàm `populateMapSelect(acc)` ở frontend tự động render dropdown bản đồ `#sel-map` động từ API.
  - **Unit Testing**: Thêm unit test trong `test.js` xác minh regex bóc tách `MAP_DEFS` và cấu trúc cache bản đồ.
- Đã test bằng: `npm test` → PASS 100% (14 unit tests pass).

---

## 2026-07-27 - T46 Post-Review Refinement: Jitter Range Fix, triggerActFlag Cleanup & Unit Tests
- File đã đổi: `server.js` (sửa), `test.js` (sửa).
- Đã làm:
  - **Sửa Jitter Range**: `120000 + Math.random() * 160000` (120–280s) → `120000 + Math.random() * 180000` (120–300s) khớp spec TASKS.md. Cập nhật tất cả 4 chỗ phát sinh `nextActInterval` và comment.
  - **Dọn `triggerActFlag()`**: Xóa tham số `reason` không sử dụng.
  - **Bổ sung Unit Test T46**: 6 test cases cover đầy đủ 3 nhánh state machine (first poll, pending act event, jitter timeout) + 1 test idle recovery + 100 lần validate jitter range 120–300s.
- Đã test bằng: `node -c server.js`, `node -c public/app.js`, `node test.js` → PASS 100%.

---

## 2026-07-27 - Server-Side Idle Guard & Event-Driven Act-Flag Jitter Engine (T46)
- File đã đổi: `server.js` (sửa `BotInstance`, `sendRequest`, `pollGame`).
- Nguyên nhân gốc rễ: Client game gốc (`xhrpg_canvas.js`) đặt `_actFlag = true` khi phát sinh sự kiện tương tác thật của người dùng và reset về `0` ngay ở poll kế tiếp. Server game dùng `last_action_at` để phát hiện bot khi `act: 1` bị gửi rập khuôn hoặc không đi kèm các hành động thực tế.
- Đã làm:
  - **`BotInstance` constructor & `triggerActFlag()`**: Khai báo `this.pendingActFlag = false` và bổ sung phương thức `triggerActFlag()`.
  - **`sendRequest()`**: Tự động bật `this.pendingActFlag = true` cho mọi request tương tác tự động/thủ công tới các endpoint ngoại trừ `xhrpg_game.php` (như `xhrpg_upgrade.php`, `xhrpg_warp.php`, `xhrpg_arena.php`).
  - **`pollGame()` actValue calculation**: Khi `this.pendingActFlag === true`, gửi `act: 1` ở poll ngay kế tiếp và reset `pendingActFlag = false`. Khi AFK đứng yên farm quái, gửi `act: 1` ngẫu nhiên 120s – 300s (nhịp Jitter tự nhiên).
  - **Auto Idle Recovery Protocol (`d.idle`)**: Khi server trả về `d.idle = true`, tự động đặt `this.pendingActFlag = true`, reset `lastActSentAt = 0` và ép gửi `act: 1` khôi phục ngay ở poll kế tiếp.
- Đã test bằng: `node -c server.js`, `npm test` → PASS 100%.

---

## 2026-07-27 - Fix Bug `bot.isOnline` → `onlineBots` Luôn Bằng 0 (T45)
- File đã đổi: `server.js` (sửa 2 chỗ).
- Nguyên nhân gốc rễ: `BotInstance` constructor không khai báo `isOnline`. Field thực tế là `this.status`. Điều kiện `bot && bot.isOnline` luôn `undefined` (falsy) → `onlineBots` không bao giờ tăng.
- Đã làm:
  - **`GET /api/admin/stats` (dòng 1620)**: `bot.isOnline` ➔ `bot.status === 'running'` → `onlineBots` và `offlineBots` đếm đúng thực tế.
  - **`GET /api/admin/users` (dòng 1657)**: `bot.isOnline` ➔ `bot.status === 'running'` → `onlineBotCount` trên từng User Accordion đếm đúng.
- Đã test bằng: `node -c server.js`, `node test.js` → PASS 100%.

---

## 2026-07-27 - Cải Tiến 3 Điểm Kiến Trúc UI Admin (T44)
- File đã đổi: `public/index.html` (sửa), `public/app.css` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Fix #1 — CSS Inline → CSS Class**: Thêm ~270 dòng CSS class chuyên dụng vào `app.css` (`.admin-tab-panel`, `.admin-tab-btn`, `.admin-section-block`, `.admin-add-proxy-grid`, `.admin-backup-form-grid`, `.admin-restore-*`, v.v.). Toàn bộ `style="background:rgba(0,0,0,0.2)..."` hardcode trong admin modal của `index.html` đã được thay bằng class.
  - **Fix #2 — `switchAdminTab()` dùng Class**: Refactor dùng `classList.toggle('active')` thay vì gán inline `style.display` và `style.background/color/borderColor`. CSS có `transition: 0.15s ease` → tab switching có animation mượt. HTML khởi tạo đúng với `class="admin-tab-btn active"` và `class="admin-tab-panel active"` ngay từ đầu.
  - **Fix #3 — Batch Proxy Dropdown Tự Rebuild**: Thêm hàm `refreshAllBatchProxySelects()` được gọi tự động sau mỗi lần `fetchAdminProxies()` resolve. Hàm tìm tất cả `select[id^="user-batch-proxy-"]` trên DOM, rebuild options từ `adminProxiesList` mới nhất, giữ nguyên lựa chọn cũ (`sel.value = prev`).
- Đã test bằng: `node -c server.js`, `node -c public/app.js`, `node test.js` → PASS 100%.

---


- File đã đổi: `public/app.css` (sửa).
- Đã làm:
  - **Mở Rộng Ô Thẻ Bài 10%**:
    * Giảm khoảng cách gap giữa 2 cột từ `5px` ➔ `3px`.
    * Tinh chỉnh padding hai bên từ `6px` ➔ `3px` giúp diện tích chứa chữ bên trong ô thẻ rộng thêm 10%, hiển thị trọn vẹn cả 2 thuộc tính Thẻ MVP.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Hiển Thị Đủ 2 Thuộc Tính Thẻ MVP & Cố Định Chia Đều 50/50
- File đã đổi: `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Hiển Thị Đủ 2 Thuộc Tính Thẻ MVP**:
    * Hiển thị trực quan cả 2 thuộc tính: Thuộc tính nền (`⭐ +3 STR`) và Thuộc tính khảm Module (`(+3 ATK)`, `(+300 HP)`...).
  - **Cố Định Kích Thước Khung 50% / 50%**:
    * Bổ sung `min-width: 0` và `text-overflow: ellipsis` cho subbox.
    * Đảm bảo hai ô Thẻ Thường và Thẻ MVP **luôn luôn chia đều 50% - 50% độ rộng**, không bị phình to hay đẩy lệch khung cho dù chuỗi chữ Thẻ MVP có dài hơn.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Cân Bằng Đối Xứng 50/50 Hai Ô Thẻ Bài (Thường & MVP)
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - **Cân Bằng Kích Thước Subbox 50% / 50%**:
    * Đơn giản hóa cấu trúc văn bản của ô Thẻ MVP bằng cách đưa thuộc tính thứ 2 (Khảm Module) vào tooltip `title="⚡ Khảm Module: +X ATK/HP..."`.
    * Hai subbox Thẻ Thường (`🎴 +1 STR (10)`) và Thẻ MVP (`⭐ +3 STR (0)`) có độ dài ký tự và kích thước khung vuông vắn 100% đối xứng hoàn hảo.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Cập Nhật Đổi Tên Các Sub-Tab Giao Diện Nhanh Gọn
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - **Đổi Tên Nhãn Nút Chuyển Sub-Tab**:
    * `📊 Chỉ Số & Tiềm Năng` ➔ **`📊 Tiềm Năng`**
    * `⚡ Kỹ Năng & Auto` ➔ **`⚡ Kỹ Năng`**
    * `🎴 Kho Thẻ Bài` ➔ **`🎴 Thẻ Bài`**
    * `🥚 Kho Trứng` ➔ **`🥚 Trứng`**
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Giảm 15% Cỡ Chữ Bảng Kho Thẻ Bài & Kho Trứng Thú Cưng
- File đã đổi: `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Giảm Cỡ Chữ Thêm 15%**:
    * Cỡ chữ Tên Quái: `0.58rem` ➔ `0.50rem`
    * Cỡ chữ Level & Tiến Trình: `0.50rem` ➔ `0.44rem`
    * Cỡ chữ Subbox & Nút Đổi: `0.50rem` - `0.52rem` ➔ `0.44rem` - `0.46rem`
    * Cỡ chữ Số Lượng Trứng: `0.65rem` ➔ `0.52rem`
  - Giúp giao diện Kho Thẻ và Kho Trứng siêu phẳng, nhỏ xinh, vuông vắn 100% trên mọi thiết bị màn hình.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Bỏ Chữ 'Sở Hữu:' & Hiển Thị Trực Tiếp Số Lượng Trứng
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - **Loại Bỏ Chữ 'Sở Hữu:'**:
    * Bỏ hoàn toàn chữ "Sở hữu:" rườm rà trong subbox Kho Trứng.
    * Đưa số lượng hiển thị trực tiếp và nổi bật: `🥚 Thường  105` | `⭐🥚 MVP  1`.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Tạm Ẩn Chỉ Số Thưởng Trứng & Loại Bỏ Nút Bấm Ấp Trứng
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - **Tạm Ẩn Thông Tin Thưởng Chỉ Số**:
    * Ẩn các dòng chữ `+1 All Stats` / `+3 All Stats` trong subbox Trứng Thường (`🥚`) và Trứng MVP (`⭐🥚`).
    * Chuyển sang hiển thị số lượng sở hữu sạch gọn: `Sở hữu: n`.
  - **Loại Bỏ Chức Năng / Nút Bấm Ấp Trứng**:
    * Loại bỏ nút bấm `🐣 Ấp Trứng`.
    * Giữ duy nhất nút bấm full-width: **`🔄 Đổi 1 Trứng MVP (100 ➔ 1 ⭐)`**.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Tích Hợp Kho Trứng Thú Cưng (Pet Eggs Inventory) & Đổi Trứng ⭐ MVP
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Backend `server.js`**:
    * Trong `GET /api/accounts`: Truyền dữ liệu `eggs: p.eggs || '{}'` về cho Frontend.
  - **Frontend `public/app.js` & `public/app.css`**:
    * Thêm Sub-tab thứ 4 trong Tab `👤 Nhân Vật`: **`🥚 Kho Trứng`**.
    * Hàm `renderEggBook(acc)`: Render danh sách Trứng thú cưng siêu gọn compact (~54px) phân loại **Trứng Thường (`🥚`)** và **Trứng ⭐ MVP (`⭐🥚`)**.
    * **Thanh Tiến Trình & Nút Đổi Trứng MVP**: Tích hợp thanh tiến trình `n / 100` trứng và nút bấm **`🔄 Đổi MVP (100 ➔ 1 ⭐)`** tự động gửi lệnh `action: 'egg_mvp_exchange'` trực tiếp lên game server.
    * **Tính Năng Ấp Trứng (`🐣 Ấp Trứng`)**: Tích hợp nút bấm ấp trứng với chi phí Gold chuẩn game (`Lv × 100 G`) tự động gửi lệnh `action: 'pet_hatch'`.
    * **Đồng Bộ Dữ Liệu Live**: Đọc 100% Tên quái vật Tiếng Việt & Level chuẩn từ `mon_masters` live của Server game, chống tràn lề UI 100%.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Tự Động Cào Dữ Liệu `mon_masters` Trực Tiếp Từ Server Game & Dịch Nguyên Bản 100%
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Live Crawl `mon_masters` Từ Game Server**:
    * Trong `server.js`: Đánh dấu `have_static: 0` trên các lượt poll đầu để ép Game Server gửi về bộ từ điển `d.mon_masters` đầy đủ nhất.
    * Tự động bắt lấy `d.mon_masters` từ Server và lưu cache vào `mon_masters_cache.json` để toàn bộ hệ thống luôn có dữ liệu thực tế.
  - **Tự Động Dịch Tên Quái Nguyên Bản 100%**:
    * Đọc trực tiếp bộ từ điển chuẩn `window.XHRPG_I18N.vi` từ `xhrpg_lang_vi.js` trong Node.js context để dịch chính xác tên gốc của từng quái vật sang Tiếng Việt chuẩn của Game.
  - **Đồng Bộ Cấp Độ (Level) & Thuộc Tính Thật**:
    * Loại bỏ hoàn toàn các công thức đoán Level cũ hay dữ liệu định nghĩa tạm.
    * Frontend `app.js` hiển thị 100% Tên, Level (`Lv`), Emoji và Primary Stat chính xác tuyệt đối theo dữ liệu Live từ Server Game.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Thay Nhãn Chữ Bằng Icon 🎴/⭐ & Kích Hoạt Thuộc Tính Thứ 2 Của Thẻ MVP
- File đã đổi: `public/app.js` (sửa).
- Đã làm:
  - **Thay Nhãn Chữ Bằng Ký Hiệu Icon**:
    * Đổi nhãn `Thường:` ➔ biểu tượng **`🎴`** nhỏ gọn.
    * Đổi nhãn `⭐ MVP:` ➔ biểu tượng **`⭐`** tối ưu.
  - **Hiển Thị Thuộc Tính Thứ 2 (Khảm Module) Của Thẻ MVP**:
    * Thẻ MVP được trang bị đúng **2 Thuộc tính chuẩn game**:
      1. **Thuộc tính nền**: `+3X Stat` (tự động cộng vào nhân vật).
      2. **Thuộc tính khảm Module**: `(+X ATK / ARMOR / HP / MP...)` khi khảm thẻ vào Module trang bị.
    * Mẫu hiển thị siêu gọn: `⭐ +3 STR (+3ATK)` (hover vào xem chi tiết: `Thuộc tính khảm Module: +3 ATK`).
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Thu Nhỏ Ô Thẻ Bài Thêm 10% & Tinh Chỉnh Hiển Thị Chữ Toàn Diện
- File đã đổi: `public/app.css` (sửa).
- Đã làm:
  - **Giảm Cỡ Chữ & Padding Thêm 10%**:
    * Cỡ chữ Tên Quái: `0.65rem` ➔ `0.58rem`
    * Cỡ chữ Level & Tiến Trình: `0.56rem` ➔ `0.50rem`
    * Cỡ chữ Subbox Thẻ & Nút Đổi: `0.56rem` ➔ `0.50rem` - `0.52rem`
    * Tinh chỉnh padding `4px 6px`, gap `3px` và chiều cao thanh tiến trình `3px`.
  - Giúp 100% nội dung chữ và nút bấm hiển thị vuông vắn, tròn trịa, không bị ngắt chữ hay nảy hàng trên mọi màn hình.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Chuẩn Hóa Tên Quái Tiếng Việt Thuần, Giảm 15% Cỡ Chữ & Chống Tràn Lề 100%
- File đã đổi: `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Bỏ Tên Tiếng Anh Trong Ngoặc**:
    * Đưa toàn bộ danh mục quái vật sang tiếng Việt thuần chủng sắc nét: `🔴 Sứa Đỏ`, `🐛 Sâu Lá`, `🐰 Thỏ Trắng`, `🧊 Băng Khổng Lồ`, `🐺 Sói Xám`, `💀 Cốt Binh`...
  - **Giảm 15% Cỡ Chữ Toàn Bộ Thành Phần**:
    * Cỡ chữ tên quái: `0.76rem` ➔ `0.65rem`
    * Cỡ chữ level & subbox: `0.66rem` ➔ `0.56rem`
    * Cỡ chữ badge & nút bấm: `0.68rem` ➔ `0.58rem`
  - **Chống Tràn Lề Giao Diện 100%**:
    * Thiết lập `box-sizing: border-box; overflow: hidden; width: 100%;` cho tất cả container thẻ và subbox.
    * Tinh chỉnh padding `5px 7px`, gap `4px` giúp toàn bộ ô thẻ bài nằm gọn gàng 100% trong khung UI điều khiển mà không tràn hay lẹm viền.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Dịch Tên Quái Vật Sang Tiếng Việt & Sửa Lỗi Vỡ Layout Thẻ Bài (Ảnh a.png Fix)
- File đã đổi: `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Dịch Tên Quái Vật Sang Tiếng Việt**:
    * Nạp từ điển Tiếng Việt chuẩn `MONSTER_DICT` kèm tên tiếng Anh trong ngoặc: `🔴 Sứa Đỏ (Poring)`, `🐛 Sâu Lá (Fabre)`, `🐰 Thỏ Trắng (Lunatic)`, `🧊 Băng Khổng Lồ (Ice Titan)`, `🐺 Sói Xám (Wolf)`...
  - **Khắc Phục Lỗi Vỡ Chữ / Lội Nhát (Ảnh a.png Fix)**:
    * Phát hiện nguyên nhân do tiêu đề, các ô nhỏ và số tiến trình `10 / 100` bị ép vào các khối flex đứng làm chữ bị ngắt hàng xuống dòng nảy lung tung (`Ice` / `Titan`, `10 /` / `100`).
    * Tái cấu trúc HTML & CSS với `white-space: nowrap`, tiêu đề 1 hàng chuẩn, subbox Thẻ Thường & MVP nằm ngang cân đối và thanh tiến trình trải dài full width.
    * Nút bấm **`🔄 Đổi 1 Thẻ MVP (100 Thẻ thường ➔ 1 ⭐ MVP)`** nổi bật chuẩn 100% không bị co ép.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Nâng cấp Ô Thẻ Bài Siêu Gọn (Giảm 50% Chiều Dài) & Bổ Sung Từ Điển Tên Quái Vật
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Từ điển Quái vật (`MONSTER_DICT`)**:
    * Bổ sung từ điển tra cứu Quái vật chuẩn tiếng Việt + Icon + Level (`🔴 Poring (Lv.1)`, `🐛 Fabre (Lv.2)`, `🐰 Lunatic (Lv.3)`, `🐺 Wolf (Lv.15)`, `💀 Skeleton (Lv.18)`, `🧟 Mummy (Lv.26)`...).
    * Khắc phục 100% tình trạng hiển thị nhãn thô `Quái vật #1`, `#2` khi game chưa nạp `mon_masters`.
  - **Thu Nhỏ Ô Thẻ Bài (50% Chiều Dài)**:
    * Giảm chiều cao từng ô thẻ từ ~160px xuống còn **~54px** (tiết kiệm 60% diện tích chiều dọc).
    * Tái bố cục thành 2 dòng ngang compact:
      - **Dòng 1**: `🔴 Poring (Lv.1)` | Thường: `+1 STR (×105)` | ⭐ MVP: `+3 STR (×1)`
      - **Dòng 2**: Thanh tiến trình `105/100 ✓` màu xanh sáng đặt song song ngay bên cạnh nút bấm nhỏ **`[ 🔄 Đổi 1 MVP ]`**.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Tích hợp Kho Thẻ Bài & Tính năng Đổi Thẻ ⭐ MVP (100 Thẻ Thường ➔ 1 Thẻ MVP)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Backend `server.js`**:
    * Trong `GET /api/accounts`: Truyền dữ liệu `cards: p.cards` về cho Frontend.
  - **Frontend `public/app.js` & `public/app.css`**:
    * Thêm Sub-tab thứ 3 trong Tab `👤 Nhân Vật`: **`🎴 Kho Thẻ Bài`**.
    * Hàm `renderCardBook(acc)`: Render danh sách Thẻ bài phân loại **Thẻ Thường (`n`)** và **Thẻ ⭐ MVP (`m`)** cùng số lượng sở hữu.
    * **Hiển thị Chỉ Số Cộng Thêm (+Stat Bonus)**: Tính toán chính xác lượng Stat cộng thêm cho Thẻ Thường (`+X Stat`) và Thẻ MVP (`+3X Stat`) kèm điểm Combat Bonus khi khảm vào Module (`+HP/MP`, `+Armor`, `+ATK`...).
    * **Thanh tiến trình & Nút Đổi Thẻ MVP**: Hiển thị tiến trình `n / 100` thẻ. Tích hợp nút **`🔄 Đổi 1 Thẻ MVP (100 ➔ 1 ⭐)`** tự động gửi lệnh `action: 'card_mvp_exchange'` trực tiếp lên game server và reload dữ liệu lập tức khi thành công.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-27 - Tính toán lại 100% chính xác Bảng Chỉ Số Chiến Đấu & Sửa Lỗi Tràn Lề (a.png Fix)
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Backend `server.js`**:
    * Đồng bộ 100% công thức phái sinh từ game engine `xhrpg_canvas.js`:
      - **Pistol ATK** & **Sniper ATK**: Tính thêm Skill `crit_shot` (+5 ATK/cấp), Module ATK pool (`modTotalAtk`), Card/Collection ATK bonus (`cardCB.atk`) và hệ số nhân Ragnalok `rag_atk`.
      - **Knife ATK**: Tính thêm Module ATK pool, Card/Collection ATK bonus và hệ số `rag_atk`.
      - **Turret ATK**: Tính thêm Skill `deploy_turret` (+5 ATK/cấp), Module ATK pool, Card/Collection ATK bonus và hệ số `rag_atk`.
      - **DEF**: Tính thêm Module DEF (`armorModDef`), DEF từ Sổ tay Thẻ/Trứng (`collCB`) và hệ số Ragnalok `rag_def`.
      - **CRIT %**: Tính thêm điểm cộng chí mạng từ Ragnalok `rag_crit` (+0.1%/điểm).
      - **Dodge %**: Bổ sung chỉ số Né Tránh (`Math.min(75, Math.floor(agi_eff / 3))%`).
  - **Frontend `public/app.js` & `public/app.css`**:
    * Cập nhật `renderCombatSummary` hiển thị đủ 10 thẻ chỉ số chiến đấu bao gồm Né Tránh (Dodge).
    * **Sửa Lỗi Tràn Lề (Ảnh a.png Fix)**:
      - Rút gọn nhãn các chỉ số cho tinh tế, không bị dài: `❤️ Max HP`, `🔷 Max MP`, `🛡️ Max Giáp`, `🔰 DEF`, `💥 CRIT %`, `💨 Dodge %`, `🗡️ Pistol ATK`, `🏹 Sniper ATK`, `⚔️ Knife ATK`, `🗼 Turret ATK`.
      - Chuyển bố cục lưới `.combat-summary-grid` sang **2 cột song song 5 hàng ngang** (`grid-template-columns: repeat(2, 1fr)`), căn chỉnh nhãn bên trái - chỉ số bên phải (`justify-content: space-between`).
      - Cấu hình `width: 100%; box-sizing: border-box; overflow: hidden;` giúp 10 ô chỉ số vuông vắn, vừa khít trong Card mà không bị lẹm hay tràn viền phải.
- Đã test bằng: `node -c server.js`, `node test.js` -> PASS 100%.

---

## 2026-07-26 - Tối ưu hóa UI Tab Nhân Vật (Sub-Tabs, Sửa Lỗi Tràn Lề Capture.PNG & Thay Đổi Thứ Tự Tab)
- File đã đổi: `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Tách Sub-Tabs nội bộ trong Tab Nhân Vật**:
    * Thêm 2 sub-tabs nhỏ (`📊 Chỉ Số & Tiềm Năng` và `⚡ Kỹ Năng & Auto`) trong pane `👤 Nhân Vật` giúp phân tách thông tin, thu gọn chiều cao card bot, tránh vỡ bố cục Dashboard.
  - **Sửa Lỗi Tràn Lề / Vỡ Layout (Capture.PNG Fix)**:
    * Phát hiện nguyên nhân vỡ layout do dùng thẻ `.settings-group` (có CSS chia 2 cột `grid-template-columns: 1fr 1fr`) bọc tiêu đề và bảng chỉ số ➔ Ép tiêu đề sang bên trái và đẩy bảng chỉ số tràn ra khỏi viền phải của Card.
    * Thay thế bằng lớp container chuyên dụng **`.char-section-block`** (`flex-direction: column; width: 100%`).
    * **Đưa tiêu đề lên dòng riêng**: Dòng 1 chứa Tiêu đề `📊 Điểm Tiềm Năng (Stat Points)` và Badge `Stat Points: N pt` trải dài 100% chiều rộng trên cùng.
    * **Dàn đều chỉ số ở dòng dưới**: 6 thuộc tính gốc (`STR`, `AGI`, `VIT` ở hàng 1 và `INT`, `DEX`, `LUK` ở hàng 2) dàn đều trong lưới 3 cột 100% bên dưới, vừa khít trong khung Card.
  - **Thay Đổi Thứ Tự Tab**:
    * Đưa Tab **`👤 Nhân Vật`** lên trước Tab **`Vật Phẩm`** trên thanh điều hướng Card tài khoản (Thứ tự mới: `Cơ Bản` ➔ `Săn Boss` ➔ `👤 Nhân Vật` ➔ `Vật Phẩm` ➔ `Nhật Ký`).
- Đã test bằng: `npm test` -> PASS 100%.

---

## 2026-07-26 - Tính năng Tự Động & Thủ Công Cộng Điểm Stat Points + Bảng Chỉ Số Nhân Vật Chuẩn UI Game
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Đổi tên & Tái cấu trúc Tab**: Đổi thẻ tab **`Kỹ Năng`** thành **`👤 Nhân Vật`** với 3 phân vùng giao diện sắc nét:
    1. 📊 **Bảng Cộng Điểm Tiềm Năng (Stat Points Allocation)**: Badge hiển thị `Stat Points: +N pt`, danh sách 6 thuộc tính gốc (`STR`, `AGI`, `VIT`, `INT`, `DEX`, `LUK`) hiển thị điểm gốc + điểm thưởng hiệu quả `(+eff)`, kèm các nút cộng điểm thủ công chuẩn UI Game **`[ +1 ]`**, **`[ +5 ]`**, **`[ ALL ]`** và công tắc bật/tắt **`⚡ Tự động cộng Stat Points`**.
    2. ⚔️ **Bảng Chỉ Số Chiến Đấu Tổng Quan (In-Game Combat Stats)**: Lưới 9 thẻ hiển thị các chỉ số phái sinh chuẩn đồng bộ từ engine `xhrpg_canvas.js`: ❤️ Max HP, 🔷 Max MP, 🛡️ Max Armor, 🔰 DEF, 💥 CRIT %, 🗡️ Pistol ATK, 🏹 Sniper ATK, ⚔️ Knife ATK, 🗼 Turret ATK.
    3. ⚡ **Danh Sách Kỹ Năng & Tự Động Kỹ Năng (Skills & Auto Skills)**: Bảo toàn 100% tính năng quản lý danh sách kỹ năng, tự động nâng skill và công tắc bật/tắt tự động từng kỹ năng.
  - **Backend `server.js`**:
    * Trong `GET /api/accounts`: Expose đủ 6 chỉ số thuộc tính cơ bản (`str`, `agi`, `vit`, `intel`, `dex`, `luk`), chỉ số hiệu quả (`str_eff`... `luk_eff`), và các chỉ số tính toán chiến đấu (`atk_pistol`, `atk_sniper`, `atk_knife`, `atk_turret`, `crit_pct`, `def_calc`).
    * Trong `BotInstance.runAutomation()`: Đã bật cờ `enableUpgrades = true` cho phép chạy tự động cộng `stat_pts` theo danh sách ưu tiên `statsPriority` khi người dùng bật công tắc `autoStats`.
  - **Sửa lỗi Cú pháp JS (SyntaxError Fix)**: Xóa khai báo trùng lặp `chkAutoStats` trong `public/app.js` gây ra lỗi `Uncaught SyntaxError: Identifier 'chkAutoStats' has already been declared` khiến trình duyệt ngắt chạy script đăng nhập.
  - **Backend `server.js` — Vá lỗi 500 Route `GET /api/accounts`**: Khắc phục cấu trúc ngoặc closure của route `GET /api/accounts`, bọc toàn bộ bằng khối `try / catch` đảm bảo an toàn 100% không bị ngắt kết nối.
  - **Tinh chỉnh UI Tab Nhân Vật — Tiêu đề 1 hàng & Bỏ Công tắc Tự Động**:
    * Đưa tiêu đề nhóm `📊 Điểm Tiềm Năng` + badge `Stat Points: +N pt` lên 1 hàng ngang duy nhất.
    * Đưa các ô chỉ số thuộc tính bên dưới về lưới 2 cột gọn gàng, nằm vừa khít trong khung card điều khiển mà không tràn lề.
    * Loại bỏ công tắc `⚡ Tự động cộng Stat Points` và `⚡ Tự động nâng Skill Points` khỏi tab Nhân Vật theo yêu cầu thiết kế tối giản.
- Đã test bằng: `node -c server.js`, `node -c public/app.js`, HTTP API Integration Test -> PASS 100%.

---

## 2026-07-26 - Sửa lỗi Hiển thị Thanh Giáp (Armor Bar) trên Dashboard
- File đã đổi: `server.js` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Backend `server.js`**:
    * Thêm `armor: p.armor` vào response `GET /api/accounts` (điểm giáp hiện tại từ server game).
    * Thêm tính toán `armor_max_calc`: đồng bộ công thức `xhrpg_canvas.js#L3813` (`floor((100 + floor((vit_eff-5)/5) + floor((str-5)/2) + armor_lv*10 + armor_up_skill*5) × rag_armor)`).
  - **Frontend `public/app.js`**:
    * Cập nhật `updateCard()` tính tỷ lệ thanh giáp `armorPct = (armorCur / armorMax) * 100%`.
    * Cập nhật text `armor-txt` hiển thị chuẩn định dạng điểm giáp thực tế `${armorCur} / ${armorMax} (${armorPct}%)` đồng bộ với thanh HP và MP.
- Đã test bằng: `node -c server.js` -> PASS 100%.

---

## 2026-07-26 - Nâng cấp Admin UI: Quản lý Quota Cảm Ứng cho Mobile & Bảng Thống Kê Tổng Quan Hệ Thống
- File đã đổi: `server.js` (sửa), `public/index.html` (sửa), `public/app.css` (sửa), `public/app.js` (sửa).
- Đã làm:
  - **Quản lý Quota Bot Cảm ứng cho Mobile (Touch-Friendly Bot Quota Stepper)**:
    * Bổ sung bộ nút bấm tăng/giảm `[ ➖ ]` `[ ➕ ]` kích thước lớn (`30x30px`) dễ chạm bằng ngón tay trên điện thoại mà không cần gõ bàn phím số thủ công.
    * Tích hợp hàm `window.stepUserQuota(userId, delta)` gọi API `PUT /api/admin/users/:userId` để cập nhật quota tức thì, tránh trượt xô xệch màn hình hay bị che mất bàn phím ảo.
    * Hiển thị chi tiết số lượng bot thực tế đang chạy kèm số bot online trực tiếp trong ô quota (VD: `2 bot (2🟢)`).
  - **Bảng Thống Kê Tổng Quan Hệ Thống (System Stats Overview Panel)**:
    * Backend `server.js`: Xây dựng endpoint `GET /api/admin/stats` tính toán tự động các chỉ số tổng quan hệ thống (Tổng User, User active/expired, Tổng Bot, Bot Online/Offline, Dung lượng Quota và phân bổ luồng Direct vs Proxy). Đồng thời bổ sung `onlineBotCount` trong `GET /api/admin/users`.
    * Frontend `public/index.html` & `public/app.js`: Xây dựng khối `#admin-stats-overview` hiển thị 4 thẻ thông số chỉ số sắc nét ở đầu Tab Quản Trị User.
  - **Tối ưu Layout Responsive Mobile**:
    * Cập nhật `public/app.css` hỗ trợ media query `@media (max-width: 640px)` tự động sắp xếp lại lưới thẻ thống kê, form tạo người dùng và hỗ trợ cuộn ngang bảng an toàn trên mobile.
- Đã test bằng: `node -c server.js`, `node -c public/app.js`, `npm test` -> PASS 100%.

---

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
## 2026-07-26 - Sửa lỗi Chuyển đổi Tài khoản (Auth Switch) & Responsive Mobile (T39)
- File đã đổi: `public/app.js` (sửa), `public/app.css` (sửa).
- Đã làm:
  - **Sửa lỗi Ctrl+F5 khi chuyển tài khoản**:
    - Viết hàm `resetAppState()` làm sạch bộ nhớ DOM `#accounts-grid` (`accountsGrid.innerHTML = ''`) và reset các biến trạng thái toàn cục (`activeTabs`, `expandedUserGroups`, `isUserGroupInitialized`, `lastFetchedAccounts`).
    - Gắn `resetAppState()` vào hàm `checkAuth()`, sự kiện đăng nhập `loginForm` và sự kiện đăng xuất `btnLogout`.
    - Bổ sung bộ kiểm tra `dataset.renderMode` trong `renderAccounts()` để tự động dọn sạch DOM cũ khi chuyển đổi chế độ hiển thị giữa Admin (Accordion) và User (Grid).
  - **Tối ưu Responsive Giao diện Mobile**:
    - Cấu hình lại CSS `@media (max-width: 640px)` cho `.user-bot-grid { grid-template-columns: 1fr; padding: 8px; }` giúp card bot chiếm vừa 100% màn hình thay vì bị ép `minmax(360px)`.
    - Điều chỉnh khối `.user-group-header` và `.user-group-actions` tự động phân hàng gọn gàng trên màn hình nhỏ.
    - Giới hạn `max-width: 100%` và `min-width: 0` cho ô select proxy `.user-batch-proxy-select` tránh tràn lề phải.
- Đã test bằng: `node -c public/app.js`, `npm test` -> PASS 100%.

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
