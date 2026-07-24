# 🛸 BÁO CÁO TỔNG KẾT DỰ ÁN RAGNALOK BOT MANAGER

Tài liệu này tổng hợp toàn bộ các kết quả đạt được trong dự án phát triển trình quản lý tự động đa tài khoản headless cho game Ragnalok Online, các giải pháp kỹ thuật đã áp dụng và lộ trình nâng cấp hệ thống.

---

## 📌 1. Các hạng mục ĐÃ HOÀN THÀNH (Done)

Chúng ta đã xây dựng thành công một hệ thống **Headless Bot Manager** hoàn chỉnh cho phép chạy nhiều tài khoản song song, quản lý cấu hình và theo dõi tình trạng nhân vật trực tiếp qua Web UI.

### A. Giao diện & Trải nghiệm Dashboard (Space-Dark Theme)
*   **Quản lý đa tài khoản**: Grid giao diện hiển thị danh sách các tài khoản song song với các tab thông tin chi tiết (Cơ bản, Kỹ năng, Phi thuyền, Companion, Nhật ký terminal).
*   **Tránh giật giật Layout (Layout Shift)**: Tối ưu hóa kích thước Header card, chỉ giữ lại các thành phần tĩnh để giao diện không bị co dãn hay nhảy lung tung khi cập nhật trạng thái định kỳ.
*   **Master Switch - Tạm dừng & Chạy tiếp**: Tích hợp công tắc gạt **🚀 Chạy treo máy (Bot)** nổi bật trong tab Cơ Bản để dừng/tiếp tục chạy vòng lặp bot mà không cần xóa và thêm lại tài khoản.

### B. Bộ Điều Khiển Tự Động Hóa Chạy Ngầm (Automation Engine)
*   **Auto Stats & Gear**: Tự tăng điểm tiềm năng (theo danh sách ưu tiên cấu hình) và tự nâng giáp (Armor) khi đủ tài nguyên.
*   **Auto Skills**: Tự nâng kỹ năng đúng thứ tự và đáp ứng các điều kiện ràng buộc trong game.
*   **Auto Companion**: Tự nâng cấp Mèo vận chuyển và Drone hỗ trợ.
*   **Auto Mines**: Tự động xây mỏ, nâng cấp mỏ lên tối đa và bật khai thác loại quặng đã chọn trên phi thuyền Orion.
*   **Auto Warp Map**: Tự động chuyển sang bản đồ mục tiêu khi nhân vật đứng sai map và đủ cấp độ yêu cầu.
*   **Auto Farm Zone**: Tự động dẫn đường nhân vật di chuyển vào khu vực farm (Zone), tự động hạ bán kính quét mục tiêu về 100m để farm tại chỗ khi đã tới tâm Zone.
*   **Lock tâm zone**: Khi kích hoạt, nhân vật tự động di chuyển về tâm zone chỉ định (tự động mở khóa `lock_pos = 0` khi khoảng cách > 30m). Khi đến sát tâm zone (khoảng cách <= 30m), bot tự động dừng di chuyển và kích hoạt khóa vị trí `lock_pos = 1` để đứng yên farm tại chỗ. Nếu chết và hồi sinh ở thành, bot tự động đi lại về tâm zone và khóa vị trí tiếp tục.

### C. Các tính năng nâng cấp nâng cao mới bổ sung
*   **Sửa lỗi Khóa Vị Trí (Lock Position)**: Khắc phục lỗi sai lệch ID checkbox giữa frontend và backend, giúp bật/tắt chức năng Lock Position mượt mà, nhân vật đứng yên hoặc di chuyển đi farm chuẩn xác theo ý muốn.
*   **Đồng bộ Map & Zone cực nhạy**: Tự động phát hiện thay đổi bản đồ (kể cả khi di chuyển bằng lệnh warp thủ công lúc bot đang dừng). Server tự động thực hiện tải ngầm (background fetch) danh sách spots/zones mới của bản đồ đó từ game server để cập nhật dropdown Zone ngay lập tức. Đồng thời, tự động bật cấu hình `autoMap = true` trên backend khi warp thành công.
*   **Săn Boss MVP (Auto MVP)**: Tự động phát hiện Boss thế giới còn sống trên map hiện tại. Hỗ trợ cấu hình nâng cao trong thẻ **Săn Boss** riêng biệt: sắp xếp ưu tiên săn theo Khoảng cách gần nhất hoặc Cấp độ (thấp/cao), lọc bỏ Boss theo danh sách đen (Blacklist) và ưu tiên săn Boss theo danh sách trắng (Whitelist). Bot sẽ tự động di chuyển tiếp cận mục tiêu tối ưu, tự động hạ bán kính quét mục tiêu để tiêu diệt Boss, và sau khi Boss chết sẽ tự động quay lại farm Zone.
*   **Tự động Đấu Trường (Auto Arena)**: Định kỳ quét đấu trường 1v1 mỗi 5 phút. Nếu còn lượt miễn phí (`free_runs > 0`), bot tự động thực hiện **Skip (Càn quét)** Boss đã từng thắng có cấp độ cao nhất để nhận thưởng lập tức, hoặc tự động **Enter (Khiêu chiến)** Boss cấp thấp nhất nếu là tài khoản mới.

### D. Hệ thống Kết Nối Chống Idle & Tránh CORS
*   **Bẻ khóa Idle Kick**: Vá tệp client gốc để reset bộ đếm nhàn rỗi và bỏ qua kiểm tra ẩn tab của trình duyệt, cho phép treo máy 24/7.
*   **Proxy trung chuyển**: Express server đóng vai trò Proxy chuyển tiếp hình ảnh, âm thanh, CSS và API game sang server gốc giúp khắc phục lỗi CORS và Cloudflare Block.
*   **Local Client `/play`**: Cho phép mở cửa sổ game trực tiếp chạy độc lập trên máy tính cá nhân.

### E. Tối ưu hóa hiệu năng & Vá lỗi khởi động Client Game (`/play`)
*   **Connection Pooling (Tái sử dụng kết nối)**: Tích hợp thư viện `undici` và thiết lập `gameAgent` giữ tối đa 50 kết nối song song và timeout 30s. Tối ưu hóa API proxy `/xhrpg_game.php` giúp giảm thời gian phản hồi từ ~1 giây xuống còn **110ms - 280ms**.
*   **Gzip Compression (Nén dữ liệu)**: Áp dụng middleware `compression` giúp nén dung lượng các file tĩnh và API phản hồi. Đặc biệt, giảm dung lượng tệp script game chính `xhrpg_canvas.js` từ **1.2MB xuống ~260KB** (giảm 80% băng thông mạng).
*   **Browser Caching & Local Stylesheet**: 
    *   Tải trực tiếp stylesheet của game từ CDN game về lưu trữ nội bộ tại `/css/xhrpg_style.css` để loại bỏ độ trễ và tránh lỗi chặn từ Cloudflare.
    *   Cấu hình Cache-Control (24 giờ) và ETag cho toàn bộ file JS/CSS cục bộ.
    *   Cấu hình Cache-Control (7 ngày) đối với 512 ảnh game được lưu trữ trong thư mục static `public/assets` để trình duyệt lưu cache cứng và không phải gửi request tải lại.
*   **Vá lỗi crash khởi động (TypeError)**:
    *   Thêm thẻ DOM ẩn `<div id="login-overlay" style="display:none"></div>` bị thiếu trong `play.html` giúp tránh lỗi crash engine game khi chạy chế độ proxy.
    *   Khắc phục lỗi sai lệch ID của thẻ chứa lịch sử sự kiện bằng cách sửa `log-list` thành `event-log` trong `play.html`.
    *   Đảo ngược thứ tự load script (cho `xhrpg_canvas.js` chạy trước `xhrpg_lang_vi.js`) để tránh crash đối tượng `window.XHRPG_I18N`.

### F. Vá lỗi Auto Map Warp & Auto Farm Zone (2026-07-23)
*   **Lỗi 1 — `MAP_DEFS` chưa được khai báo trong `server.js`** *(Critical)*: Hằng số danh sách bản đồ chỉ tồn tại trong client game `xhrpg_canvas.js`, không có trong `server.js`. Mỗi lần vòng poll chạy đến bước Auto Warp đều crash với `ReferenceError` → toàn bộ cơ chế `autoZone` và `autoFarm` bị vô hiệu hóa theo. Đã sửa bằng cách khai báo lại `MAP_DEFS` tĩnh trong `server.js`.
*   **Lỗi 2 — So sánh kiểu không an toàn `player.map !== settings.targetMap`**: `player.map` là `number`, `settings.targetMap` đọc từ JSON có thể là `string` → so sánh `!==` luôn trả về `true` dù đang đúng map → bot warp liên tục không dừng. Đã sửa bằng `Number()` trên cả hai vế.
*   **Lỗi 3 — Zone dropdown trống, toggle không sync**: `updateCard()` không populate danh sách Zone từ `acc.spots` trả về của server, đồng thời không sync trạng thái toggle `autoMap`/`autoZone` và giá trị select về UI. Đã sửa bằng hàm `populateZoneSelect(acc)` với anti-flicker và sync đầy đủ.

### G. Hệ Thống Xoay Proxy Động (Proxy Rotation Pool) (2026-07-23)
*   **ProxyPool Class (`server.js`)**: Thay thế `gameAgent` toàn cục cố định bằng lớp quản lý pool proxy động. Hỗ trợ cả kết nối trực tiếp (Direct Connection) và danh sách proxy HTTP/SOCKS5.
*   **Thuật toán Bin-Packing (Tiết kiệm chi phí tối đa)**: Phân bổ từng bot vào slot rẻ nhất trước. Lấp đầy dung lượng 10 bot của Direct Connection → Lấp đầy 10 bot của Proxy 1 → Lấp đầy 10 bot của Proxy 2... Không mở proxy mới khi proxy hiện tại chưa đầy slot.
*   **Gán & Giải phóng Động**: Mỗi `BotInstance` được gán proxy khi khởi tạo (`assignBot`) và giải phóng slot khi xóa tài khoản (`releaseBot`). Các cuộc gọi request game dùng `proxyPool.getDispatcher(line_uid)`.
*   **Giao diện Quản trị Proxy (Admin UI)**: Modal Admin chuyển sang dạng Tabbed UI với tab **🌐 Proxy Pool**. Hỗ trợ Admin cấu hình bật/tắt Direct connection, đặt giới hạn bot/proxy, thêm proxy mới với kiểm tra URL, bật/tắt/xóa proxy đang có kèm thanh biểu đồ hiển thị tải (Progress bar).
*   **Proxy Badge**: Hiển thị badge nhỏ trên mỗi Card tài khoản (Màu xanh lá = Direct, Màu tím = Proxy tên) để biết bot đang kết nối qua proxy nào.

### H. Tự Động Bắt Token Đăng Nhập Điện Thoại qua PHPSESSID & Bookmarklet (2026-07-23)
*   **Cơ chế Trích Xuất Token từ `PHPSESSID` (`/api/add-by-phpsessid`)**: Khi người dùng đăng nhập Google trên điện thoại (`ragnalok.online`), game khởi tạo cookie `PHPSESSID`. Server Manager nhận `PHPSESSID`, gọi tới `https://ragnalok.online/human/xhrpg_google_auth.php` với header `Cookie: PHPSESSID=...` để tự động đọc `line_uid`, `session_token` và tên nhân vật mà không cần F12/DevTools.
*   **Nút Thêm Bot bằng `PHPSESSID` (Dành cho Điện thoại)**: Người dùng điện thoại chỉ cần dán `PHPSESSID` hoặc nguyên chuỗi cookie vào Modal Thêm Tài Khoản, bấm **Thêm Ngay** là hệ thống tự trích xuất token, tạo bot và khởi chạy lập tức.
*   **Mã Dấu Trang 1-Tap (Bookmarklet)**: Cung cấp nút copy mã Bookmarklet. Khi lưu vào Bookmark trình duyệt điện thoại và bấm khi đang ở tab game, script tự động đọc `xhrpg_google_auth.php` thông qua Cookie của trình duyệt và gửi về Server Manager để thêm bot tự động.

### I. Đồng bộ AJAX Form PHPSESSID & Hỗ trợ Dynamic Domain (2026-07-24)
*   **Sửa lỗi Submit PHPSESSID**: Tích hợp sự kiện lắng nghe submit AJAX cho form `#add-phpsessid-form` ở frontend giúp chặn reload trang mặc định. Trình duyệt gửi request `POST` qua fetch đến `/api/add-by-phpsessid` để trích xuất token tự động, hiển thị thông báo lỗi trực quan lên giao diện (#phpsessid-error) và reload danh sách bot khi thành công.
*   **Cấu hình Trust Proxy**: Thiết lập `app.set('trust proxy', 1)` trong Express giúp server phân giải đúng protocol (HTTP/HTTPS) và IP thực của người dùng đằng sau các proxy/load balancer như Nginx, Cloudflare, Render.
*   **Tên miền động (Dynamic Domain)**: Thiết kế toàn bộ API route sử dụng đường dẫn tương đối và lấy origin động `window.location.origin` cho bookmarklet, đảm bảo hệ thống chạy tốt trên mọi tên miền/hosting mà không cần sửa cấu hình cứng.

### J. Tự động Nhận diện & Tránh crash client do chặn CDN (2026-07-24)
*   **Nhận diện nội dung HTML thay vì JS**: Hàm `fetchGameAsset` tự động kiểm tra nếu file tải về từ CDN game là trang HTML (bắt đầu bằng `<` do bị Cloudflare chặn hoặc game server bảo trì/redirect), server chủ động ném lỗi (throw error) thay vì trả về HTML dạng script làm crash trình duyệt với lỗi `Uncaught SyntaxError: Unexpected token '<'`.
*   **Cơ chế Fallback File tĩnh cục bộ (Local Fallback)**: Khi việc tải asset hoặc HTML từ máy chủ game thất bại (hoặc không chứa mã scripts game hợp lệ), Express tự động chuyển sang phục vụ file tĩnh và client game lưu cục bộ trong thư mục root project (`xhrpg_canvas.js`, `sdk.js`, `play.html`), giúp duy trì trải nghiệm treo máy 24/7 ổn định kể cả khi CDN game bị chặn hoàn toàn.




---

## 🚀 2. Các hạng mục CHƯA HOÀN THÀNH (Roadmap / Future Upgrades)

Để bảng điều khiển có đầy đủ tính năng chi tiết như trong game client chính thức, dưới đây là các hạng mục nâng cấp tiềm năng trong tương lai:

### 🎒 A. Quản lý Kho đồ & Trang bị (Inventory & Gear Panel)
*   **Hiện trạng**: Chưa hiển thị danh sách vật phẩm.
*   **Mục tiêu**:
    *   Hiển thị danh sách vật phẩm đang có trong túi đồ (đọc từ `player.module_inventory` và các túi phụ).
    *   Hiện số lượng của từng loại nguyên liệu (Gỗ, Sắt, Đá, Đồng...).
    *   Hỗ trợ nút bấm thủ công để bán nguyên liệu thừa lấy vàng trực tiếp từ Dashboard.
    *   Hiển thị các trang bị chính nhân vật đang mang.

### 🎴 B. Hệ thống Ghép & Khảm Thẻ Bài (Cards Collection Panel)
*   **Hiện trạng**: Chưa tự động ghép hoặc khảm thẻ bài.
*   **Mục tiêu**:
    *   Hiển thị sổ tay thẻ bài thu thập được (`player.cards`).
    *   Thêm cấu hình tự động ghép thẻ bài (auto merge) để nâng sao thẻ bài khi đủ số lượng.
    *   Tự động khảm thẻ bài vào trang bị để tăng sát thương/giáp.

### 📦 C. Tự Động Rút Nguyên Liệu Về Kho (Auto Storage Drop)
*   **Hiện trạng**: Chưa tự động dọn dẹp túi đồ.
*   **Mục tiêu**:
    *   Khi túi đồ đầy hoặc sau một khoảng thời gian nhất định, bot sẽ kích hoạt kỹ năng của Mèo vận chuyển hoặc gửi lệnh để chuyển toàn bộ quặng khai thác được về kho lưu trữ an toàn, tránh bị đầy túi không nhặt được trang bị hiếm.

### ⚔️ D. Tự Động Tham Gia PVP Đấu Trường Tự Do (Auto PvP Duel)
*   **Hiện trạng**: Chưa tự động chiến đấu PvP tự do với người chơi khác.
*   **Mục tiêu**:
    *   Đăng ký tham gia giải đấu PvP hoặc đấu trường tự do để tích lũy điểm thưởng mua vật phẩm hiếm.
