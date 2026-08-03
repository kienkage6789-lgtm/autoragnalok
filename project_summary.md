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
*   **Săn Boss MVP Xoay Vòng Map (Auto MVP Rotation)**: Tự động phát hiện Boss thế giới còn sống trên map hiện tại. Hỗ trợ cấu hình danh sách Map xoay vòng (`mvpTargetMaps`), tự động chuyển sang Map tiếp theo ngay sau khi hạ Boss hoặc theo chu kỳ giờ tròn. Hỗ trợ cấu hình nâng cao: sắp xếp ưu tiên săn theo Khoảng cách gần nhất hoặc Cấp độ (thấp/cao), lọc bỏ Boss theo Blacklist và ưu tiên theo Whitelist. Bot tự di chuyển tiếp cận mục tiêu, tiêu diệt Boss, xoay vòng Map và tự quay lại farm Zone khi hoàn thành.
*   **Nhật ký Săn Boss (Boss Hunt Journal) (Mới)**: Thêm sub-tab **👾 Boss** bên trong log pane của mỗi bot card. Hiển thị dòng thời gian (timeline) sự kiện săn Boss thực tế từ RAM (cycle start, phát hiện boss, hạ gục, dọn sạch map, warp, timeout) cùng bảng 4 thẻ chỉ số thống kê hiệu suất (Tổng boss đã hạ, Số chu kỳ, Thời gian trung bình hạ boss, Map hot săn nhiều nhất) để người dùng theo dõi và đánh giá hiệu năng săn Boss.
*   **Tối ưu hóa Tranh Chấp Last-Hit Boss MVP (Mới)**:
    *   **Áp sát 5m**: Bot tự động di chuyển áp sát Boss ở khoảng cách cực gần `5m` để bù trừ dung sai di chuyển, tránh bị lệch tầm bắn của súng ngắn (Pistol).
    *   **Khóa mục tiêu tuyệt đối**: Luôn hướng tâm quét `explore_cx/cy` vào tọa độ Boss để dồn 100% sát thương, tránh bị quái rác sinh ra xung quanh cướp mất lượt tấn công.
    *   **Cập nhật HP Real-time**: Tự động gửi cờ `isFull = 1` ở mọi poll khi săn Boss để cập nhật liên tục vị trí và HP của Boss từng giây.
    *   **⚡ Snipe Mode**: Tăng tốc độ poll lên gấp đôi (delay $1000\text{ms}$ thay vì $2000\text{ms}$) và tạm ngừng mọi request phụ (Stats, Gear, Skill...) khi Boss dưới $30\%$ HP để đạt tần suất tấn công tối đa lấy Last-Hit.
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

### K. Sửa lỗi Đồng bộ ô chọn Bản đồ di chuyển (2026-07-25)
*   **Đồng bộ Backend `targetMap`**: Trong handler `POST /api/accounts/:line_uid/action` khi `action === 'warp'`, server tự động cập nhật `bot.settings.targetMap = Number(target_map)` và ghi nhận vĩnh viễn vào `accounts.json` qua `saveAccounts()`.
*   **Tối ưu Frontend `changeTargetMap`**: Gửi request cập nhật `targetMap` qua API `PUT` ngay lập tức để giữ đúng giá trị bản đồ đã chọn, đồng thời tự động fallback theo bản đồ thực tế của nhân vật (`acc.player.map`) khi render `selMap`, khắc phục hoàn toàn lỗi ô dropdown bị nảy về Map 1.

### L. Nâng cấp Tab Nhật ký Vật phẩm Trực tiếp từ DB Máy Chủ (On-Demand Droplogs) (2026-07-25)
*   **Kết nối API chính thức `xhrpg_droplog.php`**: Xây dựng endpoint `GET /api/accounts/:line_uid/droplogs` truy xuất dữ liệu chiến lợi phẩm chính xác 100% trực tiếp từ Database máy chủ game.
*   **Phân loại & Định dạng Thời gian Thực**: Tự động phân loại biểu tượng (Thẻ bài `🎴`, Trứng `🥚`, Mô-đun `⚙️`, Trang bị `⚔️`, Đá quý `💎`), quy đổi Unix timestamp `t` sang ngày giờ Việt Nam `HH:mm:ss DD/MM` chính xác từng giây, và gắn nhãn phân biệt đồ nhặt khi `🟢 Online` vs `🌙 Offline`.
*   **Cơ chế Tải Theo Yêu Cầu (On-Demand - Không Spam Server)**: Chỉ kích hoạt lệnh tải khi người dùng nhấp chọn tab **Vật Phẩm** hoặc bấm nút **`🔄 Cập nhật`**. Hoàn toàn không phát sinh bất kỳ request thừa nào trong vòng lặp chạy ngầm của bot.
*   **Bảo vệ Content-Type**: Thêm bộ kiểm tra Content-Type phía frontend để cảnh báo trực quan khi server chưa khởi động lại, tránh tình trạng ném lỗi `SyntaxError` trên giao diện.

### P. Tab Lịch Sử Giao Dịch Chợ (Market History) (2026-08-01)
*   **Endpoint API `xhrpg_market.php`**: Xây dựng route `GET /api/accounts/:line_uid/market-history` gọi tới máy chủ game với `action: get_history` để lấy lịch sử mua/bán chợ.
*   **Tab Con `🏪 Chợ` Trong Mục Log**: Thêm tab con thứ 3 vào pane Log bên cạnh `📜 Hoạt Động` và `🎁 Vật Phẩm`.
*   **Nút Cập Nhật On-Demand & Giao Diện**: Nút `🔄 Cập nhật` cho phép tải dữ liệu theo yêu cầu, hiển thị nhãn trạng thái giao dịch (`🏷️ Đã bán`, `🛒 Đã mua`, `⏰ Hết hạn`, `❌ Đã hủy`, `📦 Đã rao`) kèm màu sắc trực quan và giá vàng tương ứng.

### M. Tự động nhận diện định dạng Proxy thô (Proxy Auto-Parsing) (2026-07-25)
*   **Phân giải định dạng thô**: Backend tự động phát hiện và chuyển đổi các chuỗi proxy thô dạng `IP:PORT:USER:PASS` thành URL chuẩn `http://USER:PASS@IP:PORT` và dạng `IP:PORT` thành `http://IP:PORT`.
*   **Nhãn hiển thị an toàn**: Tự động sinh nhãn (label) là `IP:PORT` khi Admin không nhập nhãn gợi nhớ, ngăn ngừa việc hiển thị và lộ thông tin mật khẩu proxy ra giao diện.
*   **Cải thiện UI**: Cập nhật placeholder ô nhập proxy mới trên Dashboard quản trị để hỗ trợ các cú pháp thô này.

### N. Đo lường Hiệu suất Farm Thời gian Thực (Combat Rates per Minute) (2026-07-25)
*   **Tính toán bằng Cửa sổ trượt (Sliding Window)**: `BotInstance` lưu trữ lịch sử tiêu diệt quái, lượng EXP và Vàng nhận được trong 5 phút gần nhất. Tính toán ra giá trị trung bình mỗi phút (Kills/phút, Vàng/phút, EXP/phút).
*   **Tự động nhận diện Sự kiện**: Đọc trực tiếp từ logs sự kiện game poll:
    *   Hạ quái: Tìm sự kiện `type === 'kill'` hoặc thông điệp có icon `💀`.
    *   Lượng EXP: Regex bắt các chuỗi `EXP+N` (bắt được cả dòng boost Premium `🅿️ EXP+N`).
    *   Lượng Vàng: Regex bắt các chuỗi `G+N` hoặc `Gold+N` (bắt được cả dòng boost Premium `🅿️ G+N`).
*   **Thiết kế Hàng Rate UI đẹp mắt**: Thêm hàng `.card-rates` ngay phía trên mục hiển thị tài nguyên với tông màu tím mờ cao cấp, hiển thị real-time các chỉ số và tự động rút gọn hiển thị (ví dụ: `+1.2k /m` thay vì `+1200 /m` khi chỉ số vượt quá 1000).

### O. Cập nhật Bản đồ Mới và Đồng bộ Đấu trường (2026-07-25)
*   **Hỗ trợ 2 bản đồ mới**: Tích hợp các hằng số và cấp độ yêu cầu của bản đồ mới vào backend và frontend:
    *   Map 5: `Tàn tích Cổ đại` (`🏛️`, Yêu cầu Lv.55+).
    *   Map 6: `Núi lửa Sôi trào` (`🌋`, Yêu cầu Lv.70+).
*   **Đồng bộ icon đấu trường**: Cập nhật icon của bản đồ số 4 (Đấu trường Arena) từ `🏛️` thành `⚔️` để đồng bộ 100% với sự thay đổi của client game chính thức.

### P. Ngăn chặn chọn Bản đồ vượt cấp (Map Level Validation) (2026-07-25)
*   **Kiểm soát thời gian thực tại Client**: Khi thay đổi dropdown select bản đồ di chuyển ở frontend, hàm `changeTargetMap` so sánh cấp độ hiện tại của nhân vật (`#lv-txt-...`) với yêu cầu tối thiểu của bản đồ đó. Nếu không đủ cấp độ, hệ thống hiển thị `alert` cảnh báo và tự động `revert` dropdown trở về bản đồ cũ.
*   **Xác thực bảo mật kép tại Server**:
    *   API Cấu hình (`PUT /api/accounts/:line_uid`): Ngăn chặn việc lưu `targetMap` vượt cấp bằng cách trả về mã lỗi HTTP 400.
    *   API Di chuyển hành động (`POST /api/accounts/:line_uid/action`): Ngăn chặn yêu cầu `warp` thủ công vượt cấp, trả về HTTP 400 và không gửi gói tin tới game server.

### Q. Quản lý Kỹ năng đang sở hữu & Bật/Tắt Tự động sử dụng (2026-07-25)
*   **Đồng bộ dữ liệu kỹ năng**: Cập nhật endpoint `GET /api/accounts` để trả về chi tiết `skills` và `skill_auto` của đối tượng `player` về frontend.
*   **Tab điều hướng "Kỹ Năng"**: Tích hợp tab hiển thị danh sách kỹ năng nhân vật đang sở hữu (Level > 0). Đối với các kỹ năng chủ động (hoặc tháp đôi `twin_turret`), hiển thị nút Auto Toggle để điều chỉnh bật/tắt tự động sử dụng.
*   **API Bật/tắt kỹ năng**: Xây dựng cơ chế gọi API `POST /api/accounts/:line_uid/action` gửi lệnh `skill_toggle` kèm `skill_id` tới game server `xhrpg_upgrade.php` để lưu trạng thái trực tuyến.
*   **Tối ưu thiết kế nhỏ gọn (Compact UI)**: Giảm kích thước vùng đệm, kích thước icon, font chữ và các nút bấm của lưới kỹ năng đi 15%, thiết lập chiều cao giới hạn (`max-height: 220px`) kèm thanh cuộn mượt mà và tự động co giãn về 1 cột trên giao diện mobile để đảm bảo cân đối tuyệt đối cho bảng điều khiển.

### R. Cải tiến Toàn diện Hệ thống Proxy Pool (2026-07-25)
*   **IP Persistence (Nhất quán IP)**: Lưu trường `proxyId` của bot trực tiếp vào file cấu hình `accounts.json` thay vì chỉ lưu trong RAM. Điều này đảm bảo bot giữ nguyên địa chỉ IP của mình khi khởi động lại server.
*   **Cơ chế Failover & Auto Re-route**: Tự động phát hiện khi bot gặp lỗi kết nối liên tiếp 3 lần (khoảng 6-10 giây do khoảng cách gửi request 2 giây). Khi đó, hệ thống sẽ tự động gán bot sang một proxy khỏe mạnh khác (hoặc kết nối trực tiếp), đồng thời cập nhật file cấu hình và ghi log thông báo. 
    *   *Cơ chế hoạt động:* 
        *   Nếu tắt/xóa trực tiếp proxy trên giao diện Web Admin: Re-assignment sẽ diễn ra **ngay lập tức** cho các bot đang chạy trên proxy đó.
        *   Nếu dịch vụ proxy bị die vật lý (tắt proxy từ máy): Bot cần trải qua 3 lần lỗi kết nối liên tiếp (tốn khoảng 6-10 giây) để phát hiện trạng thái lỗi của proxy và tiến hành chuyển vùng tự động.
*   **Proxy Connection Tester**: Xây dựng API và nút "⚡ Test" trên giao diện Admin quản lý proxy để Admin có thể kiểm tra độ trễ (latency) và trạng thái sống/chết của từng proxy kết nối tới game server.
*   **Manual Proxy Assignment (Gán Proxy Thủ công)**: Cho phép Admin chọn proxy mong muốn cho từng bot thông qua dropdown lựa chọn tại tab Cơ Bản (chỉ hiển thị với Admin).

### S. Tích hợp Hệ thống Sao lưu & Phục hồi Dữ liệu (2026-07-25)
*   **Đóng gói dữ liệu**: Sử dụng thư viện `adm-zip` để đóng gói 3 file dữ liệu cấu hình quan trọng (`users.json`, `proxies.json`, `accounts.json`) thành 1 file ZIP duy nhất trong RAM mà không cần tạo file rác tại VPS.
*   **Sao lưu tự động qua Telegram**: Tích hợp gửi file backup ZIP trực tiếp vào chat Telegram của Admin. Sử dụng module `https` nguyên bản của Node với tùy chọn `family: 4` để tránh lỗi DNS/IPv6 resolution trên hệ điều hành Ubuntu/Linux.
    *   *Tính năng an toàn:* Tự động chặn và cảnh báo từ cả Frontend và Backend nếu Admin nhập nhầm ID của Bot (phần số trước dấu hai chấm ở Token) làm Chat ID của Admin.
    *   *Lịch chạy ngầm:* Kiểm tra định kỳ mỗi 5 phút và tự động gửi bản sao lưu lên Telegram sau mỗi 12 giờ (hoặc khoảng cách tùy cấu hình).
*   **Khôi phục trực tuyến (Hot-Reload)**: Cho phép Admin tải file ZIP backup lên trực tiếp thông qua giao diện Web (`POST /api/admin/restore-upload`). Hệ thống tự động giải nén ghi đè, dừng hoạt động toàn bộ bot cũ, nạp lại dữ liệu người dùng/proxy/tài khoản và khởi chạy lại các bot có trạng thái chạy trước đó mà không cần restart server thủ công.
*   **Tải bản sao lưu trực tiếp**: Nút bấm tải trực tiếp file zip sao lưu về máy tính cá nhân để lưu trữ ngoại tuyến.

### T. Giao diện Admin Phân Nhóm theo User & Đổi Proxy Hàng Loạt (2026-07-26)
*   **Giao diện Accordion Phân nhóm theo User**: Khi Admin đăng nhập, màn hình chính hiển thị các khối User Card gọn gàng chứa thông tin tên user, role, hạn dùng và số lượng bot đang chạy.
*   **Mặc định Thu nhỏ tiết kiệm tài nguyên (Collapsed by Default)**: Tất cả các thẻ User Accordion mặc định thu nhỏ khi vừa mở trang, không render DOM các bot card bên trong, tiết kiệm 100% CPU/RAM cho máy chủ/trình duyệt. Bấm vào User Header để mở rộng danh sách bot card.
*   **Đổi Proxy Hàng Loạt 1-Click**: Tích hợp dropdown trên mỗi User Card cho phép Admin thay đổi Proxy đồng loạt cho tất cả các bot của user đó qua API `PUT /api/admin/users/:userId/proxy`.
*   **Phân quyền Nghiêm ngặt**: Giao diện nhóm User và các công cụ quản lý chỉ xuất hiện đối với tài khoản Admin. Người dùng thường (`role === 'user'`) chỉ nhìn thấy danh sách bot card của chính họ ở dạng lưới chuẩn.

### U. Sửa lỗi Admin UI Phá hủy DOM Node (`Node cannot be found in the current page`) (2026-07-26)
*   **Tối ưu khởi tạo Single-Pass**: Thay vì xóa và gán lại `groupCard.innerHTML` mỗi 1 giây trong hàm `renderAccounts`, mã nguồn chuyển sang khởi tạo HTML 1 lần duy nhất khi tạo thẻ `groupCard`.
*   **Bảo toàn cây DOM**: Các lần poll refresh tiếp theo chỉ cập nhật textContent của các trường thông tin tĩnh mà không ghi đè `innerHTML`, giúp giữ nguyên vẹn cây DOM của `user-bot-grid` và các `card` bên trong. Thao tác đóng/mở Accordion, chọn Proxy, hay bấm các nút bấm không bị mất Node trên trình duyệt.

### V. Tích hợp Công cụ Xác minh Outbound Public IP Proxy (2026-07-26)
*   **Endpoint `/api/accounts/:line_uid/proxy-check`**: Gửi HTTP request qua đúng `Dispatcher` của bot tới IP echo service (`api.ipify.org`), trả về Public IP thực tế mà gói tin đi ra bên ngoài cùng độ trễ ms.
*   **Endpoint `/api/admin/proxies/verify-all`**: Thực hiện test đồng loạt tất cả các luồng Direct Connection và Proxy HTTP/SOCKS5 trong Pool, đối chiếu IP public thực tế của từng luồng.
*   **Nút `🔍 Test IP` trên Card Bot**: Cho phép Admin bấm kiểm tra tức thì IP public thực tế của bot đó trực tiếp tại tab Cơ Bản.
*   **Nút `🔍 Test IP Public Tất Cả Luồng` trong Admin Proxy Modal**: Cho phép kiểm tra toàn bộ luồng Proxy trong hệ thống chỉ với 1 click.
*   **Tài liệu Kế hoạch Kiểm tra Proxy**: Lưu trữ tại [proxy_verification_plan.md](file:///C:/Users/Admin/.gemini/antigravity-cli/brain/343ac94d-c203-4624-bcb8-112b1fcfe816/proxy_verification_plan.md).

### W. Sửa lỗi Dọn dẹp DOM khi Chuyển Tài Khoản & Tối ưu Responsive Mobile (2026-07-26)
*   **Hàm dọn dẹp bộ nhớ `resetAppState()`**: Tự động dọn sạch DOM `#accounts-grid` (`accountsGrid.innerHTML = ''`) và reset các biến trạng thái JS toàn cục (`activeTabs`, `expandedUserGroups`, `isUserGroupInitialized`, `lastFetchedAccounts`) khi đăng xuất, đăng nhập hoặc thay đổi phiên làm việc.
*   **Tự động chuyển đổi Render Mode**: Bổ sung kiểm tra `dataset.renderMode` trong `renderAccounts` để tự động làm sạch DOM cũ khi chuyển đổi giữa chế độ Admin Accordion và User Grid, khắc phục 100% việc phải nhấn `Ctrl + F5` cứng.
*   **Tối ưu Responsive Layout Mobile**: 
    *   Bổ sung CSS `@media (max-width: 640px)` cho `.user-bot-grid { grid-template-columns: 1fr; padding: 8px; }` loại bỏ chiều rộng tối thiểu 360px cũ, giúp các thẻ bot co giãn vừa vặn màn hình điện thoại.
    *   Cấu hình `.user-group-header` và `.user-batch-proxy-box` phân hàng linh hoạt, thêm giới hạn `max-width: 100%` tránh tràn lề phải.

### X. Nâng cấp Admin UI: Quản lý Quota Cảm ứng Mobile & Bảng Thống Kê Tổng Quan (2026-07-26)
*   **Bộ nút chỉnh Quota Cảm ứng (`[ ➖ ]` `[ ➕ ]`)**: Tích hợp các nút bấm tăng/giảm dung lượng bot kích thước lớn (`30x30px`) dễ dàng điều chỉnh trên màn hình điện thoại mà không gặp tình trạng bị che bởi bàn phím ảo hay nhảy màn hình.
*   **Tự động Đồng bộ & Hiển thị Số Bot Online**: Tự động gọi API `PUT /api/admin/users/:userId` và cập nhật tức thì, đồng thời hiển thị chi tiết số lượng bot thực tế đang chạy kèm số bot online trực tiếp trong ô Quota (VD: `2 bot (2🟢)`).
*   **Bảng Thống Kê Tổng Quan Hệ Thống (`/api/admin/stats`)**: Tự động tổng hợp 4 khối chỉ số quan trọng tại đầu Tab Quản trị User:
    1. 👥 **Người Dùng**: Tổng số User, số User đang hoạt động vs Đã hết hạn.
    2. 🤖 **Bot Hệ Thống**: Tổng số Bot, số Bot 🟢 Online vs 🔴 Offline.
    3. 🎯 **Dung Lượng Quota**: Tổng số Bot đang dùng / Tổng Quota đã cấp (% Sử dụng).
    4. 🌐 **Phân Bổ Kết Nối**: Số Bot chạy Direct Connection vs qua Proxy Pool.
*   **Tối ưu Responsive Layout Mobile**: Tự động co giãn 4 thẻ chỉ số thống kê và form tạo người dùng trên thiết bị di động (`< 640px`) giúp giao diện vuông vắn, không tràn lề.

### Y. Đồng bộ & Sửa lỗi Thanh Hiển Thị Giáp (Armor Bar) trên Dashboard (2026-07-26)
*   **Trích xuất Dữ liệu Điểm Giáp Thực tế**: Bổ sung `armor: p.armor` (điểm giáp hiện tại) vào đối tượng `player` của response API `GET /api/accounts`.
*   **Tính toán Giáp Tối Đa (`armor_max_calc`)**: Đồng bộ công thức tính toán `armorMax` theo client game `xhrpg_canvas.js#L3813` (`floor((100 + floor((vit_eff-5)/5) + floor((str-5)/2) + armor_lv*10 + armor_up_skill*5) × rag_armor)`).
*   **Cập nhật Giao diện Dashboard**: Sửa đổi `updateCard()` trong `public/app.js` để tính tỷ lệ thanh giáp theo chỉ số thực `armorPct = (armorCur / armorMax) * 100%` và định dạng văn bản hiển thị `armor-txt` thành `${armorCur} / ${armorMax} (${armorPct}%)` chuẩn mực tương tự thanh HP và MP.

### Z. Nâng cấp Tab "👤 Nhân Vật": Cộng Điểm Tiềm Năng & Bảng Chỉ Số Nhân Vật Chuẩn UI Game (2026-07-26)
*   **Đổi tên & Tái cấu trúc Tab**: Đổi tên tab **`Kỹ Năng`** thành **`👤 Nhân Vật`** với 3 phân vùng giao diện: 📊 Bảng cộng điểm Stat Points thủ công, ⚔️ Bảng chỉ số chiến đấu tổng quan (In-Game Combat Stats), và ⚡ Danh sách kỹ năng (Skills).
*   **Bố cục Tiêu đề 1 Hàng & Lưới Cân Bằng**:
    * Đưa tiêu đề nhóm `📊 Điểm Tiềm Năng` + badge `Stat Points: +N pt` lên 1 hàng ngang duy nhất.
    * Đưa 6 ô điểm thuộc tính Stat Points về lưới 2 cột gọn gàng (3 x 2), vừa khít trong khung card điều khiển không tràn lề.
    * Đưa 9 thẻ chỉ số chiến đấu về lưới 3 cột x 3 hàng vuông vắn (❤️ Max HP, 🔷 Max MP, 🛡️ Max Armor, 🔰 DEF, 💥 CRIT %, 🗡️ Pistol ATK, 🏹 Sniper ATK, ⚔️ Knife ATK, 🗼 Turret ATK).
    * Đưa danh sách kỹ năng về lưới 2 cột full-width (`width: 100%`) căn giữa toàn bộ.
    * Giảm độ đậm màu chữ 15% (`opacity: 0.85`) dịu mắt. Bỏ các công tắc tự động thừa khỏi tab Nhân Vật.
*   **Backend & Server Status**: Expose toàn bộ 6 chỉ số thuộc tính gốc, chỉ số hiệu quả và chỉ số chiến đấu tổng quan trong API `GET /api/accounts`. Tiến trình `node.exe` đã được tắt sạch theo yêu cầu của người dùng để tự khởi động thủ công.

### AA. Tính toán lại 100% chính xác Bảng Chỉ Số Chiến Đấu & Sửa Lỗi Tràn Lề (2026-07-27)
*   **Đồng bộ 100% Engine Game (`xhrpg_canvas.js`)**:
    *   Tính chính xác 10 chỉ số chiến đấu phái sinh (`Pistol ATK`, `Sniper ATK`, `Knife ATK`, `Turret ATK`, `DEF`, `CRIT %`, `Dodge %`, `HP Max`, `MP Max`, `Armor Max`).
    *   Tích hợp đầy đủ điểm cộng Skill (`crit_shot`, `deploy_turret`, `armor_up`), bể sát thương Module (`modTotalAtk`, `armorModDef`), thẻ bài/trứng bộ sưu tập (`cardCB`, `collCB`) và điểm Ragnalok (`rag_atk`, `rag_def`, `rag_crit`).
*   **Khắc phục Lỗi Tràn Lề (Ảnh `a.png`)**:
    *   Rút gọn nhãn các chỉ số ngắn gọn, sắc nét (`❤️ Max HP`, `🔷 Max MP`, `🛡️ Max Giáp`, `🔰 DEF`, `💥 CRIT %`, `💨 Dodge %`...).
    *   Chuyển đổi lưới `.combat-summary-grid` sang 2 cột 5 hàng vuông vắn (`grid-template-columns: repeat(2, 1fr)`), căn nhãn bên trái - chỉ số bên phải.
    *   Thêm `width: 100%; box-sizing: border-box; overflow: hidden;` giúp giao diện phẳng, đẹp, cân đối 100% không bị tràn viền phải.

### BB. Tích hợp Thẻ Bài, Trứng Thú Cưng & Live Crawl Data Game Server (2026-07-27)
*   **Tối Ưu Tên Nhãn Sub-Tab Nhanh Gọn**:
    *   Sub-tab 1: **`📊 Tiềm Năng`** (cũ: *Chỉ Số & Tiềm Năng*)
    *   Sub-tab 2: **`⚡ Kỹ Năng`** (cũ: *Kỹ Năng & Auto*)
    *   Sub-tab 3: **`🎴 Thẻ Bài`** (cũ: *Kho Thẻ Bài*)
    *   Sub-tab 4: **`🥚 Trứng`** (cũ: *Kho Trứng*)
*   **Bộ Sưu Tập Thẻ Bài (`🎴 Thẻ Bài`)**:
    *   Phân loại Thẻ Thường (`🎴`) và Thẻ ⭐ MVP (`⭐`).
    *   Hiển thị đủ **2 Thuộc Tính Thẻ MVP**: Thuộc tính nền (`+3X Stat`) và Thuộc tính Khảm Module (`+ATK`, `+ARMOR`, `+HP`, `+MP`...).
    *   Cân bằng đối xứng **50% / 50%** tuyệt đối giữa 2 subbox, không bị xô lệch hay phình to khung.
    *   Nút bấm **`🔄 Đổi 1 Thẻ MVP (100 ➔ 1 ⭐)`** tự động gửi lệnh `action: 'card_mvp_exchange'`.
*   **Bộ Sưu Tập Trứng Thú Cưng (`🥚 Trứng`)**:
    *   Phân loại Trứng Thường (`🥚`) và Trứng ⭐ MVP (`⭐🥚`).
    *   Tạm ẩn thông tin chỉ số thưởng & loại bỏ nút bấm Ấp Trứng theo chỉ thị người dùng.
    *   Hiển thị số lượng sở hữu trực tiếp, sạch gọn: `🥚 Thường  105` | `⭐🥚 MVP  1`.
    *   Nút bấm **`🔄 Đổi 1 Trứng MVP (100 ➔ 1 ⭐)`** tự động gửi lệnh `action: 'egg_mvp_exchange'`.
*   **Tối Ưu Kích Thước & Font Chữ (Compact Layout)**:
    *   Giảm cỡ chữ toàn bộ hai bảng thêm **15%**.
    *   Mở rộng độ rộng ô thẻ bài thêm **10%** (giảm gap xuống 3px, padding 3px), hiển thị cực kỳ phẳng, đẹp, vuông vắn 100%.
*   **Live Crawl Dữ Liệu `mon_masters`**:
    *   Backend `server.js` tự động cào `mon_masters` trực tiếp từ Server game (`/xhrpg_game.php`).
    *   Nạp bộ từ điển `xhrpg_lang_vi.js` dịch 100% Tên quái vật sang Tiếng Việt chuẩn.
    *   Đồng bộ Level (`Lv`), Emoji và Stat chính xác 100% nguyên bản của Game.

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
