# 🛸 HƯỚNG DẪN TRA CỨU NHANH API GAME RAGNALOK ONLINE

Tài liệu này ghi lại toàn bộ các hàm cốt lõi, công thức toán học và endpoints kết nối trong client game [xhrpg_canvas.js](file:///C:/Users/Admin/Desktop/auto/xhrpg_canvas.js). Sử dụng tài liệu này để tra cứu nhanh khi cần nâng cấp hoặc mở rộng các tính năng tự động hóa trong tương lai.

---

## 🗺️ 1. Bản đồ & Dịch chuyển (Map & Warping)

Game quản lý bản đồ thông qua file PHP trung chuyển `/xhrpg_warp.php`.

*   **Danh sách Bản đồ**: Được lưu tại hằng số `MAP_DEFS` dòng `10943`:
    ```javascript
    const MAP_DEFS = [
      { id: 1, name: 'ทุ่งกลาง', emoji: '🌿', req: 1 },      // Thung lũng Trung tâm
      { id: 2, name: 'ทะเลทรายนิรันดร์', emoji: '🏜️', req: 25 }, // Sa mạc Vĩnh hằng
      { id: 3, name: 'ดินแดนเยือกแข็ง', emoji: '❄️', req: 40 }, // Vùng đất Băng giá
      { id: 4, name: 'สนามประลอง', emoji: '🏛️', req: 20 }     // Đấu trường Arena (PVP)
    ];
    ```
*   **Hàm dịch chuyển**: [warpToMap](file:///C:/Users/Admin/Desktop/auto/xhrpg_canvas.js#L10957-L10972) gửi POST đến `/xhrpg_warp.php` với tham số `target_map`.
*   **Hàm di chuyển đến Zone**: [goToSpot](file:///C:/Users/Admin/Desktop/auto/xhrpg_canvas.js#L10894-L10912) điều khiển di chuyển nhân vật về tọa độ `spot.cx` và `spot.cy` của Zone đã chọn.

---

## 📈 2. Công thức tính chi phí nâng cấp (Upgrade Formulas)

Nằm ở đoạn giữa của [xhrpg_canvas.js](file:///C:/Users/Admin/Desktop/auto/xhrpg_canvas.js#L3890-L3912):

*   **Vàng cơ bản theo cấp**:
    $$\text{tierGold}(lv) = \text{START}[b] + \text{pos} \times \frac{\text{END}[b] - \text{START}[b]}{9}$$
    Trong đó $b = \lfloor(lv - 1) / 10\rfloor$ và $\text{pos} = (lv - 1) \pmod{10}$.
*   **Tài nguyên cơ bản (Res - đá, gỗ, sắt...) theo cấp**:
    $$\text{tierRes}(lv) = \text{START\_RES}[b] + \text{pos} \times \frac{\text{END\_RES}[b] - \text{START\_RES}[b]}{9}$$
*   **Hệ số nhân theo cấp độ mục tiêu**:
    $$\text{\_upgCostMult}(lv\_target) = 1.0 + 0.25 \times (\lfloor lv\_target / 10 \rfloor - 1)$$ (với $lv\_target \ge 20$, nhỏ hơn $20$ hệ số mặc định là $1.0$).

---

## 🐱 3. Quản lý Đệ tử & Robot (Followers & Companions)

Tất cả các hành động này gửi POST đến `/xhrpg_upgrade.php` kèm tham số `action`.

*   **Nâng cấp Mèo (Cat)**: `action: 'upgrade_cat'`. Tăng giới hạn kho và khoảng cách nhặt đồ.
*   **Nâng cấp Drone**: `action: 'upgrade_drone'`. Tự động nhặt đồ và tấn công quái phụ.
*   **Nâng cấp Linh mục hỗ trợ (Priest)**: `action: 'priest_up'`. Tự động hồi phục máu/giáp.
*   **Nâng cấp Titan Robot**: `action: 'robot_body_up'`. Tăng chỉ số sát thương hỗ trợ.

---

## ⛏️ 4. Phi thuyền Orion & Khai thác mỏ (Airship & Mining)

Khai thác mỏ chịu ảnh hưởng bởi cấp độ phi thuyền (`house_lv`) và năng lượng (`house_energy`).

*   **Xây dựng mỏ (Mine Build)**: `action: 'mine_build'`, kèm tham số `slot` (0-5) và `ore` (loại quặng: `gold`, `wood`, `stone`, `iron`, `copper`, `herb`).
*   **Nâng cấp mỏ (Mine Upgrade)**: `action: 'mine_up'`, kèm tham số `slot`.
*   **Bật/Tắt mỏ khai thác (Mine Toggle)**: `action: 'mine_toggle'`, kèm tham số `slot`.
*   **Các bộ sản xuất khí tài**: Tắt/Mở sản xuất qua lệnh `action: 'house_toggle'` kèm `param: 'pistol' | 'sniper' | 'robot'`. Đối với Potion sử dụng `action: 'toggle_house_potion_prod_tier'` kèm `tier: 1` và `on: 1 | 0`.

---

## ⚡ 5. Hệ thống Kỹ năng & Ràng buộc (Skills Tree)

Khai báo hằng số `SKILL_DEFS` nằm tại [xhrpg_canvas.js:L12140](file:///C:/Users/Admin/Desktop/auto/xhrpg_canvas.js#L12140). Bảng điều kiện ràng buộc kỹ năng (Prerequisites):

| Mã Kỹ Năng (ID) | Tên Kỹ Năng | Cấp Yêu Cầu | Yêu cầu Kỹ năng khác |
| :--- | :--- | :--- | :--- |
| `kill_shot` | Cú bắn chí mạng 💀 | - | `crit_shot` $\ge 3$ |
| `explosive_shot` | Dao nổ hỏa lực 💥 | $\ge 30$ | `crit_shot` $\ge 5$ và `kill_shot` $\ge 5$ |
| `lock_on` | Khóa mục tiêu 🧿 | $\ge 40$ | `explosive_shot` $\ge 5$ |
| `triple_knife` | Tam phi đao 🔱 | $\ge 50$ | `lock_on` $\ge 5$ |
| `armor_up` | Tăng cường giáp 🛡️ | - | `tough_body` $\ge 3$ |
| `hp_regen` | Hồi máu tự động 💚 | - | `tough_body` $\ge 5$ |
| `pull_monster` | Nam châm hút quái 🧲 | $\ge 30$ | `hp_regen` $\ge 5$ và `armor_up` $\ge 5$ |
| `double_attack` | Song kiếm hiệp bích ⚔️ | - | `knife_atk` $\ge 5$ |
| `spin_attack` | Kiếm xoay bão lốc 🌀 | $\ge 30$ | `knife_atk` $\ge 5$ và `double_attack` $\ge 5$ |
| `turret_rapid` | Gia tăng tốc độ bắn ⏳ | - | `deploy_turret` $\ge 3$ |
| `twin_turret` | Đặt ụ súng đôi 🗼 | $\ge 30$ | `deploy_turret` $\ge 5$ và `turret_rapid` $\ge 5$ |

---

## 🔒 6. Các Endpoints Quản Lý của Bot Manager (Manager Authentication & Integration)

Dưới đây là danh sách các API và Endpoint nội bộ của Server Bot Manager dùng để quản trị tài khoản game và xác thực phiên:

### A. Quản lý Phiên & Token Đăng Nhập Game
*   **API trích xuất Token qua PHPSESSID**: `POST /api/add-by-phpsessid`
    *   **Tham số**: `{ phpsessid: "chuỗi_cookie_hoặc_raw_phpsessid" }`
    *   **Cơ chế**: Server sử dụng proxy pool gửi GET request kèm header `cookie: PHPSESSID=...` tới `https://ragnalok.online/human/xhrpg_google_auth.php` để lấy về cấu trúc thông tin nhân vật (`line_uid`, `session_token`, tên nhân vật) và tự động tạo bot.
*   **Trình bắt Token tự động (Token Sniffer Proxy)**: `GET /login-helper`
    *   **Cơ chế**: Proxy tải giao diện game và inject script token sniffer ghi đè hàm `window.startGame` và `$.post` của game client. Ngay khi người dùng đăng nhập bằng Google thành công, script sẽ tự động capture `line_uid` & `session_token` rồi gửi về Endpoint `/api/auto-add-account`.
*   **API Lưu Tài Khoản tự động**: `POST /api/auto-add-account`
    *   **Tham số**: `{ line_uid, session_token, name }`
    *   **Cơ chế**: Lưu trữ thông tin bot vào `accounts.json` và kích hoạt luồng bot chạy ngầm lập tức.

### B. Client Treo Máy Cục Bộ (Local Play Interface)
*   **Cổng Game Proxy**: `GET /play?line_uid=...&session_token=...`
    *   **Cơ chế**: Trả về giao diện client game đã được inject các bản vá bypass chống idle kick (`_lastInputAt = Date.now()` và `_tabHiddenAt = 0`). Tất cả dữ liệu game đều đi qua proxy của Manager để vượt qua lỗi CORS và Cloudflare Block.

### C. Quản lý Phiên làm việc (Dashboard Sessions)
*   **Session Token**: Cookie `auth_token` được lưu tự động trên trình duyệt của người dùng (HttpOnly, SameSite=Lax) dùng để xác thực quyền truy cập Dashboard và các API quản lý bot.

---


## 🔍 Nơi tìm kiếm thông tin khi thiếu sót

*   **Tài liệu hướng dẫn của AGY**: Đọc tài liệu skill [antigravity-guide](file:///C:/Users/Admin/.gemini/antigravity-cli/builtin/skills/antigravity_guide/SKILL.md) để biết cách tinh chỉnh CLI, MCP và Customizations.
*   **Log hoạt động của Client**: Theo dõi tab **Nhật Ký (Logs)** trên bảng điều khiển local hoặc đọc trực tiếp file dữ liệu [accounts.json](file:///C:/Users/Admin/Desktop/auto/accounts.json).
*   **Trình gỡ lỗi Client**: Bấm `F12` trong tab Client game local (`/play`) để xem các gói dữ liệu JSON gửi đi và nhận về từ `/xhrpg_game.php`.
