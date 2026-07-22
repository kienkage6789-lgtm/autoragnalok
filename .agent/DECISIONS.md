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
