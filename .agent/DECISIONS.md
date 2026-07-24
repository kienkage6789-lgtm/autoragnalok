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

## 2026-07-24 - Hỗ trợ Dynamic Domain & Sửa lỗi PHPSESSID Form Submit
- Bối cảnh: Khi deploy trên web với tên miền hoặc IP thay đổi động (đặc biệt khi đứng sau các dịch vụ proxy/load balancer như Cloudflare, Nginx, Render proxy), Express cần biết cách giải quyết giao thức HTTP/HTTPS và IP thật của client. Đồng thời form PHPSESSID ở frontend bị lỗi reload trang do thiếu sự kiện submit.
- Các phương án đã xét:
  - A: Hardcode các domain hợp lệ → Không khả thi cho dynamic domain.
  - B: Cấu hình `trust proxy` trong Express + Sử dụng URL tương đối ở mọi API client và lấy origin động `window.location.origin` cho bookmarklet.
- Đã chọn: Phương án B.
- Lý do: Đảm bảo mã nguồn hoạt động 100% tự động trên bất kỳ tên miền nào mà không cần cấu hình lại. Form PHPSESSID được sửa bằng AJAX POST giúp tăng trải nghiệm người dùng, hiển thị lỗi động trực quan.

## 2026-07-24 - Thiết lập cơ chế Lock tâm zone (Ngưỡng 30m và Tự động mở khóa)
- Bối cảnh: Khi người dùng muốn nhân vật chỉ đứng yên auto-farm tại tâm zone chỉ định và quay trở lại đứng yên sau khi chết, chúng ta cần dùng tính năng `lock_pos` của game. Tuy nhiên, nếu gửi `lock_pos: 1` lúc nhân vật còn ở xa, nhân vật sẽ bị game server đóng băng vị trí và không thể di chuyển đến zone được.
- Các phương án đã xét:
  - A: Khóa vị trí ngay khi kích hoạt → Nhân vật bị kẹt cứng nếu đứng xa tâm zone hoặc sau khi chết hồi sinh ở town.
  - B: Kích hoạt `traveling: 1` và gửi `lock_pos: 0` khi khoảng cách lớn hơn ngưỡng đến. Khi khoảng cách nhỏ hơn ngưỡng đến, dừng di chuyển và kích hoạt `lock_pos: 1`.
- Đã chọn: Phương án B.
- Ngưỡng khoảng cách đã chọn: **30m**.
- Lý do: Ngưỡng 30m đảm bảo nhân vật di chuyển vào sát tâm zone trước khi kích hoạt khóa vị trí. Khi nhân vật hồi sinh ở town hoặc bị đẩy ra xa (khoảng cách > 30m), hệ thống tự động mở khóa để đi về tâm zone rồi lại tự động khóa lại.

## 2026-07-24 - Điểm neo khóa vị trí trong Lock tâm zone (Tọa độ hiện tại vs Tọa độ tâm)
- Bối cảnh: Khi gửi `lock_pos: 1` kết hợp `explore_cx/cy` là tâm zone gốc, game server vẫn điều hướng nhân vật di chuyển tới tâm zone hoặc cho phép di chuyển trong bán kính quét xung quanh tâm zone. Điều này làm tọa độ nhân vật tiếp tục biến động.
- Các phương án đã xét:
  - A: Gửi `explore_cx/cy` là tâm zone gốc (`spot.cx/cy`) khi khóa → Không khóa hoàn toàn, tọa độ vẫn thay đổi.
  - B: Gửi `explore_cx/cy` là tọa độ hiện tại của nhân vật (`player.x/y`) khi khóa.
- Đã chọn: Phương án B (phù hợp 100% với cách hoạt động của game client gốc).
- Lý do: Khi game server nhận thấy tâm khám phá trùng khớp hoàn toàn với tọa độ hiện tại của nhân vật kèm cờ `lock_pos: 1`, nó sẽ đóng băng hoàn toàn nhân vật tại vị trí đó mà không kích hoạt bất kỳ chuyển động tìm đường hay tiếp cận nào khác.

## 2026-07-24 - Thiết kế cấu trúc ưu tiên và lọc săn Boss MVP
- Bối cảnh: Khi có nhiều Boss xuất hiện trên cùng một bản đồ, cần có cách thức sắp xếp ưu tiên và loại trừ các Boss không muốn săn để nhân vật đưa ra quyết định hợp lý.
- Các phương án đã xét:
  - A: Tự động nhắm mục tiêu cố định theo thứ tự server gửi về → Thiếu tùy biến, dễ nhắm vào Boss quá mạnh gây chết bot.
  - B: Thiết kế tab cài đặt riêng, cho phép chọn tiêu chí (Gần nhất, Lv thấp/cao) kết hợp bộ lọc Whitelist (ưu tiên) và Blacklist (bỏ qua) theo từ khóa tên Boss.
- Đã chọn: Phương án B.
- Lý do: Tối đa hóa khả năng kiểm soát của người chơi, giúp bot an toàn hơn (né boss cấp cao trong blacklist) và hiệu quả hơn (ưu tiên boss cấp thấp dễ ăn trước hoặc boss có drop ngon trong whitelist).

## 2026-07-24 - Thiết kế cơ chế đồng bộ map và zone (Tải spots ngầm khi bot offline)
- Bối cảnh: Khi người dùng đổi bản đồ bằng dropdown, bot gửi lệnh warp thủ công. Tuy nhiên, game server chỉ trả về danh sách spots/zones của map mới khi client thực hiện request poll `xhrpg_game.php`. Nếu bot đang offline/idle, poller không chạy, dẫn tới spots không được tải, và dropdown Zone trên UI vẫn hiển thị các khu vực của map cũ gây lỗi bất đồng bộ.
- Các phương án đã xét:
  - A: Yêu cầu người dùng bật bot lên để tự cập nhật spots → Trải nghiệm kém, người dùng muốn cài đặt cấu hình hoàn chỉnh trước khi bật bot.
  - B: Khi phát hiện warp thủ công thành công và bot đang offline, server tự động kích hoạt một luồng chạy ngầm (background fetch) để tải trước spots của map mới từ game server, sau đó lưu vào bộ nhớ đệm bot.
- Đã chọn: Phương án B.
- Lý do: Giải quyết triệt để bất đồng bộ map-zone dù bot đang chạy hay dừng, nâng cao trải nghiệm người dùng, giúp giao diện dropdown zone luôn chính xác theo map đang đứng. Đồng thời, tự động bật `autoMap = true` khi warp thành công giúp khóa cứng hoạt động của nhân vật trên map mới.

## 2026-07-24 - Thiết lập cơ chế tạm dừng nâng cấp khi săn Boss MVP
- Bối cảnh: Khi bot đang săn Boss MVP, nếu các tiến trình nâng Stats, Armor, Skills, Companion hay Đấu trường được kích hoạt, hệ thống phải gửi các gói tin HTTP POST riêng biệt đến `xhrpg_upgrade.php` hoặc `xhrpg_arena.php`. Việc này chiếm dụng lượt poll của chu kỳ hiện tại, khiến bot tạm ngưng gửi tọa độ di chuyển/tấn công đến `xhrpg_game.php`, làm nhân vật khựng lại và mất ưu thế cạnh tranh Boss.
- Các phương án đã xét:
  - A: Chạy song song nâng cấp và săn Boss → Gây xung đột poll, dễ dính lỗi `too_fast` từ game server, làm nhân vật khựng lại trong trận đánh Boss quan trọng.
  - B: Phát hiện trạng thái đang săn Boss MVP (`targetedMvp = true`) và tạm dừng toàn bộ mọi hoạt động tự động hóa nâng cấp, đấu trường cho đến khi Boss chết.
- Đã chọn: Phương án B.
- Lý do: Đảm bảo nhân vật luôn phản ứng nhanh nhất, dồn 100% thời gian poll để tiếp cận và tấn công Boss liên tục mà không bị gián đoạn bởi các tác vụ nâng cấp ngoài lề. Các hoạt động nâng cấp tự động sẽ ngay lập tức được khôi phục sau khi trận đánh kết thúc.

## 2026-07-24 - Tạm thời vô hiệu hóa các tính năng tự động nâng cấp (Chờ phát triển)
- Bối cảnh: Các chức năng tự động nâng cấp như tăng chỉ số (Stats), nâng cấp Giáp (Armor), nâng kỹ năng (Skills), nâng cấp Companion (priest, archer, cat, drone...) và xây mỏ (Mines) chưa được phát triển và hoàn thiện kiểm thử thực tế. Để tránh việc bot thực hiện các hành động nâng cấp sai lệch hoặc gây lag poll, người dùng yêu cầu tạm thời tắt toàn bộ các tính năng này và ghi nhận vào tài liệu.
- Các phương án đã xét:
  - A: Xóa bỏ hoàn toàn mã nguồn nâng cấp → Lãng phí code cũ, gây khó khăn cho việc phát triển lại sau này.
  - B: Sử dụng một biến cờ cấu hình cục bộ `const enableUpgrades = false` bao bọc toàn bộ 5 khối chức năng này.
- Đã chọn: Phương án B.
- Lý do: Giúp vô hiệu hóa các tác vụ nâng cấp một cách an toàn và sạch sẽ mà không làm xáo trộn mã nguồn. Việc này cho phép chúng ta dễ dàng kích hoạt lại từng phần khi tiến hành phát triển và kiểm thử tiếp ở tương lai. Các hoạt động di chuyển cốt lõi (Map Warp) và càn quét Đấu trường (Arena) nằm ngoài cờ này nên vẫn được giữ lại hoạt động bình thường.

## 2026-07-24 - Giải quyết ánh xạ DOM ID lỗi của các cấu hình camelCase ở frontend
- Bối cảnh: Khi người dùng đổi cấu hình camelCase (VD: `mvpPriorityMode`), hàm `updateStringSetting` tìm kiếm phần tử DOM theo công thức `settingKey.replace(/_/g, '-')`. Do `mvpPriorityMode` không có dấu gạch dưới, kết quả trả về vẫn là `mvpPriorityMode`, trong khi ID thực tế trên HTML template là `sel-mvp-priority-mode-...` (dạng hyphen-case). Điều này khiến hàm trả về `null` và cấu hình không bao giờ được gửi về backend để lưu trữ.
- Các phương án đã xét:
  - A: Đổi tên toàn bộ biến cài đặt trong backend sang dạng snake_case hoặc hyphen-case → Tốn kém và dễ gây vỡ cấu trúc dữ liệu JSON hiện tại.
  - B: Thêm bộ phân giải biểu thức chính quy `.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()` vào hàm xử lý cập nhật ở frontend để tự động chuyển camelCase sang hyphen-case một cách linh hoạt.
- Đã chọn: Phương án B.
- Lý do: Đảm bảo khả năng tương thích 100% giữa quy chuẩn đặt tên biến CamelCase của JavaScript và quy chuẩn DOM ID viết thường có dấu gạch ngang của HTML mà không cần thay đổi cấu trúc dữ liệu ở backend.

## 2026-07-24 - Thiết kế luồng xử lý và hiển thị Nhật ký Vật phẩm (Loot Logs)
- Bối cảnh: Nhật ký hoạt động chung của bot quá tải do lượng thông tin cập nhật di chuyển và combat rất lớn, làm trôi hoàn toàn lịch sử nhặt vật phẩm giá trị. Cần tách biệt lịch sử nhặt đồ và lưu giữ lâu hơn để nâng cao trải nghiệm theo dõi.
- Các phương án đã xét:
  - A: Chỉ lọc log ở client (frontend) khi người dùng mở tab Vật phẩm → Cách này vô nghĩa khi bot chạy lâu, vì các logs cũ nhặt được cách đó vài tiếng đã bị xóa khỏi hàng đợi log chung ở backend (chỉ lưu 200 dòng).
  - B: Xây dựng hàng đợi `lootLogs` riêng biệt ở backend (giới hạn 200 dòng) và thiết lập bộ phân loại sự kiện chuyên nghiệp để thu thập trực tiếp sự kiện khi poll game.
- Đã chọn: Phương án B.
- Lý do: Cho phép lưu trữ lâu dài lịch sử rơi đồ (bởi tần suất rơi đồ thấp hơn rất nhiều so với log di chuyển/bơm máu), bảo đảm người dùng không bị mất thông tin kể cả khi treo máy qua đêm. Đồng thời, cấu trúc dữ liệu dạng API sạch giúp dễ dàng nâng cấp bộ lọc hoặc xuất dữ liệu trong tương lai.

## 2026-07-24 - Phân loại vật phẩm giá trị cao và vật phẩm thông thường
- Bối cảnh: Việc lưu toàn bộ vật phẩm thu hoạch liên tục trên map (Gỗ, Đá, Sắt, Đồng, Cỏ, Bình máu) vào tab Vật Phẩm làm loãng tab và khiến log rơi đồ bị trôi rất nhanh do tần suất nhặt tài nguyên này cực kỳ cao.
- Các phương án đã xét:
  - A: Lưu mọi vật phẩm nhặt được vào tab Vật Phẩm → Tab sẽ bị quá tải bởi hàng trăm dòng "+1 Wood", "+1 Stone", làm mất đi mục đích theo dõi các vật phẩm hiếm của người dùng.
  - B: Chỉ lọc các vật phẩm có giá trị cao (Thẻ bài, Trứng, Trang bị, Đá quý, Ngọc, Hộp quà) vào tab Vật Phẩm thông qua bộ lọc Regular Expression. Các vật phẩm thu hoạch nguyên liệu và thuốc men thông thường sẽ chỉ được ghi nhận ở tab Nhật Ký chung cùng với log combat.
- Đã chọn: Phương án B.
- Lý do: Giúp tab Vật Phẩm hoạt động đúng vai trò là "Nhật ký chiến lợi phẩm quý giá", cho phép người chơi dễ dàng kiểm tra các món đồ đắt tiền nhặt được sau thời gian dài treo máy mà không bị ngập trong log nguyên liệu cơ bản.





