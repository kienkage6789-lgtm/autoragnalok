# CHANGELOG.md

> Changelog of actual changes implemented.

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
