# DECISIONS.md

> Captured architectural decisions and trade-offs.

## 2026-07-16 - Tabbed Dashboard Card Architecture
- Bối cảnh: Card giao diện của từng tài khoản ban đầu quá dài do chứa nhiều hệ thống (Stats, Gear, Maps, Logs) và cần tích hợp thêm hệ thống kỹ năng, mỏ khoáng, phi thuyền, đệ tử.
- Các phương án đã xét:
  - A: Kéo dài thêm chiều dọc của thẻ (gây rối mắt, cuộn trang cực kỳ nhiều).
  - B: Mở ra modal riêng cho từng tài khoản (mất tính trực quan khi theo dõi nhiều acc).
  - C: Thiết kế cấu trúc các Tab nhỏ (Core, Skills, Airship, Followers) trong từng thẻ tài khoản, giữ các chỉ số sinh tồn và tài nguyên hiển thị chung ở đầu thẻ.
- Đã chọn: Phương án C.
- Lý do: Giữ giao diện gọn gàng, xem được tổng quan nhanh, và chuyển đổi cực kỳ mượt mà.
- Trade-off: Code render client-side trong app.js phức tạp hơn do phải kiểm soát cập nhật DOM động của các tab đang hiển thị ẩn/hiện.

## 2026-07-16 - Automated Testing Harness
- Bối cảnh: Chưa có cơ chế tự động chạy test xác minh độ chính xác của các công thức tính toán tài nguyên/vàng tăng cấp (vốn rất quan trọng để quyết định mua đồ).
- Các phương án đã xét:
  - A: Cài đặt framework lớn như Jest/Mocha (tăng dung lượng node_modules không cần thiết).
  - B: Viết một file test tự động siêu nhẹ dùng module `assert` mặc định của Node.js.
- Đã chọn: Phương án B.
- Lý do: Không cần cài thêm dependency phụ, chạy cực kỳ nhanh qua `npm test`.

## 2026-07-23 - MAP_DEFS phải được khai báo tại `server.js`, không chỉ dựa vào client game

- Bối cảnh: Phát hiện `MAP_DEFS` được dùng trong `pollGame()` (server.js) nhưng chưa được định nghĩa — hằng số này chỉ tồn tại trong `xhrpg_canvas.js` (client game).
- Các phương án đã xét:
  - A: Import/require từ client JS (không khả thi — file client không phải module Node.js).
  - B: Khai báo lại `MAP_DEFS` trực tiếp trong `server.js` dưới dạng constant tĩnh, mirroring từ `game_api_reference.md`.
  - C: Đọc danh sách map động từ API server game (thêm 1 request mạng, tăng độ trễ).
- Đã chọn: Phương án B.
- Lý do: Danh sách map rất ổn định (hiếm khi thêm map mới), khai báo tĩnh đơn giản và không tốn thêm request.
- Ghi chú bảo trì: **Khi game thêm map mới**, phải cập nhật `MAP_DEFS` trong `server.js` (dòng ~245) đồng thời với dropdown HTML trong `public/app.js` (hàm `buildCardSkeleton`).

## 2026-07-23 - Thuật toán Bin-Packing cho Proxy Pool

- Bối cảnh: Người dùng muốn xoay proxy tự động cho nhiều bot, tối ưu chi phí mua proxy (mỗi proxy chịu tối đa ~10 bot) và cho phép tùy chọn dùng kết nối mạng trực tiếp của máy server.
- Các phương án đã xét:
  - A: Round-robin (xoay vòng đều giữa các proxy) → mở đều các proxy dù chỉ có ít bot, tốn tiền mua nhiều proxy.
  - B: Random assign → không kiểm soát được dung lượng tối đa 10 bot/proxy.
  - C: **Bin-Packing (Lấp đầy từng slot)** → Lấp đầy Direct connection (miễn phí) 10 bot trước, sau đó lấp đầy Proxy 1 đủ 10 bot mới bắt đầu gán sang Proxy 2.
- Đã chọn: Phương án C.
- Lý do: Tiết kiệm chi phí mua proxy tối đa cho Admin/Chủ hệ thống.

## 2026-07-23 - Lấy Token trên điện thoại qua PHPSESSID Cookie & Bookmarklet

- Bối cảnh: Người dùng chơi game trên điện thoại không thể mở F12/DevTools để xem `line_uid` và `session_token`.
- Các phương án đã xét:
  - A: Chạy Proxy Đăng nhập `/login-helper` → Bị vướng Google OAuth Redirect URI bắt buộc về `ragnalok.online` và Cloudflare Canvas Rendering.
  - B: Dán `javascript:` trực tiếp vào thanh địa chỉ → Bị Chrome/Safari chặn bảo mật và tự nhảy sang tìm kiếm Google Search.
  - C: **Trích xuất Token qua `PHPSESSID` (`/api/add-by-phpsessid`) & Bookmarklet** → Đọc Cookie `PHPSESSID` để gọi `xhrpg_google_auth.php` lấy thông tin chính xác 100%.
- Đã chọn: Phương án C.
- Lý do: An toàn, tương thích 100% với điện thoại (iOS & Android), không bị Google OAuth hay trình duyệt chặn.


