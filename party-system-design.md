# Party System Design

## Auto-invite / Auto-join / Follow Party

**Trạng thái:** Design baseline; T96 runtime và T97 account-picker/wizard đã triển khai, đã QC  
**Ngày:** 2026-10-02  
**Phạm vi:** headless bot manager của project `autoragnalok`

## 1. Mục tiêu

Bổ sung khả năng điều phối Party cho các bot thuộc cùng một nhóm quản lý:

1. **Auto-invite:** bot Leader tự tìm và mời các bot thành viên được cấu hình.
2. **Auto-join:** bot Member tự gửi yêu cầu tham gia hoặc chấp nhận lời mời hợp lệ từ Leader.
3. **Follow Party:** bot Member duy trì cùng Party, cùng bản đồ và bám vị trí của Party Leader khi policy cho phép.

Tài liệu này là contract và kế hoạch sản phẩm. Các phần đánh dấu “đã có” phản ánh runtime hiện tại; T97 đã bổ sung luồng cấu hình thân thiện bằng account picker/profile wizard.

## 2. Bằng chứng từ codebase hiện tại

### 2.1 Client game đã có Party

Client hiện bật Party bằng `PARTY_ON = true` và gọi trực tiếp `xhrpg_party.php` tại [xhrpg_canvas.js:25106](xhrpg_canvas.js:25106).

Các dữ liệu Party được đọc từ poll game:

| Field | Ý nghĩa quan sát được |
|---|---|
| `d.pty` | Party hiện tại; `null` khi không ở Party |
| `d.ptx` | EXP nhận thêm từ thành viên Party |
| `d.pty_inv` | Lời mời tham gia Party đang chờ |
| `d.pty_rq` | Yêu cầu người chơi khác xin vào Party |
| `d.pty_call` | Lời gọi vào Party Dungeon |
| `d.ptchat_n` | Số tin nhắn Party chưa đọc |
| `others[].pt` | ID Party của người chơi khác trên map |
| `others[].rf` | Reference opaque dùng để mời người chơi trên map |

Hook xử lý poll nằm tại [xhrpg_canvas.js:25155](xhrpg_canvas.js:25155) và được gọi sau mỗi poll tại [xhrpg_canvas.js:15640](xhrpg_canvas.js:15640).

### 2.2 Quy tắc Party được hiển thị trong client

Các quy tắc sau phải xem là server-authoritative; client chỉ hiển thị snapshot:

- Party tối đa 5 người theo bản dịch UI; giới hạn thực tế phải lấy từ `state.max`.
- Thành viên cùng map chia EXP từ các lượt hạ quái.
- Bonus EXP hiện được client mô tả là `+5%` cho mỗi thành viên Party phù hợp.
- Gold, drop, card và egg thuộc người hạ mục tiêu.
- Thành viên offline, chết, ở nhà, trong chiến trường hoặc Guild Dungeon có thể tạm dừng việc chia EXP.
- Một số buff Party chỉ có hiệu lực khi cùng map; level hiệu lực lấy theo thành viên cao nhất.
- Party tồn tại cho đến khi người chơi rời Party hoặc bị Leader kick.

Các nội dung này được hiển thị trong `_ptyRender()` tại [xhrpg_canvas.js:25367](xhrpg_canvas.js:25367) và bản dịch chính thức tại [xhrpg_canvas.js:21672](xhrpg_canvas.js:21672).

### 2.3 Contract đã thấy của `xhrpg_party.php`

Request nền mà client luôn gửi:

```text
line_uid
session_token
lang
action
```

Các action đã thấy trong client:

| Action | Payload bổ sung | Mục đích |
|---|---|---|
| `state` | — | Đọc Party hiện tại, cài đặt Party và bảng LFG |
| `search` | `tab`, `q` | Tìm người gần, theo tên, cùng Guild hoặc đang tìm Party |
| `invite` | `ref` hoặc `name` | Leader gửi lời mời |
| `respond` | `id`, `ok` | Chấp nhận/từ chối lời mời Party |
| `req_respond` | `ref`, `ok` | Leader chấp nhận/từ chối yêu cầu vào Party |
| `req_cancel` | — | Hủy yêu cầu đang chờ |
| `request` | `pid` | Gửi yêu cầu vào Party theo Party ID |
| `lead` | `ref` | Chuyển Leader |
| `kick` | `ref` | Kick thành viên |
| `leave` | — | Rời Party |
| `disband` | — | Leader giải tán Party |
| `toggle_noinv` | — | Bật/tắt không nhận lời mời |
| `toggle_seek` | — | Bật/tắt trạng thái đang tìm Party |
| `lfg_post` | `msg` tối đa 40 ký tự | Đăng tìm thành viên |
| `lfg_del` | — | Xóa tin LFG |
| `pdun_call` | — | Gọi thành viên Party vào Party Dungeon |

Client triển khai helper tại [xhrpg_canvas.js:25117](xhrpg_canvas.js:25117) và các action tại [xhrpg_canvas.js:25450](xhrpg_canvas.js:25450).

### 2.4 Party chat

Party chat dùng `xhrpg_chat.php`, với `room: 'party'` khi đọc hoặc gửi tin nhắn. Đây là kênh chat riêng, không phải kênh điều phối membership.

### 2.5 Party Dungeon là hệ thống riêng

Party Dungeon không được trộn vào state Party thường:

- Endpoint: `xhrpg_pdun.php`.
- Map: `14`.
- Poll fields: `pdun`, `pdinv`, `pdwin`, `pdsum`.
- Action đã thấy: `state`, `create`, `join`, `leave`, `kick`, `start`, `invite`, `enter`, `exit`, `history`.
- Vé: `player.pdun_ticket`.

Luồng UI nằm tại [xhrpg_canvas.js:25760](xhrpg_canvas.js:25760). Nút gọi Party Dungeon từ Party hiện đang bị ẩn bởi `PTY_PDUN_BTN = false`, dù function/server flow vẫn còn.

## 3. Khoảng trống hiện tại

### Đã có sau T97

- Client game có đầy đủ UI và request Party.
- Proxy wildcard của manager chuyển tiếp được các endpoint `/xhrpg_*.php` tại [server.js:11195](server.js:11195).
- `BotInstance` đã lưu `player`, `others`, map, tọa độ, trạng thái Event, Guild Dungeon và có single-source-of-truth cho map routing.
- Runtime đã normalize Party poll, gọi action `xhrpg_party.php`, auto-invite/auto-join/follow và expose trạng thái qua `GET /api/accounts`.
- Dashboard có Party profile wizard, account picker và trạng thái Party cơ bản tại [public/app.js:1196](public/app.js:1196) và [public/app.js:2148](public/app.js:2148).
- `GET/POST /api/party/profiles` tự sinh/giữ ổn định `partyGroupId`, validate owner/conflict, ghi policy per-account và trả trạng thái `READY`/`WAITING_TARGET`/`INVALID_TARGET`/`CONFLICT`.

### Còn mở rộng sau T97

- Chưa có tài liệu server-side chính thức mô tả schema đầy đủ; `ref`, `id` và response field phải được xem là opaque nếu chưa được server trả về.

## 4. Nguyên tắc thiết kế

1. **Server game là nguồn sự thật.** Manager không tự sửa membership, EXP, Party ID, Leader hoặc quyền kick.
2. **Không tự tạo `ref`, `id` hoặc `pid`.** Chỉ dùng giá trị server trả về.
3. **Party automation mặc định tắt.** Không làm thay đổi hành vi các account hiện tại khi nâng cấp.
4. **Tách Party khỏi Team hiện có.** Không tái sử dụng trực tiếp `teamId/teamRole` vì Team hiện đang điều khiển đồng bộ Boss/Guild Dungeon. Dùng `partyGroupId/partyRole` riêng; chỉ hỗ trợ ánh xạ sang Team khi có setting explicit.
5. **Một owner có thể có nhiều Party group.** Mỗi bot chỉ thuộc tối đa một Party group tại một thời điểm.
6. **Không để follow ghi đè automation ưu tiên cao hơn.** Event, restore, Guild Dungeon và Party Dungeon phải được bảo vệ.
7. **Mọi request phải idempotent ở phía manager.** Poll nhanh không được tạo invite/request trùng liên tục.
8. **Không tin dữ liệu stale.** Snapshot quá hạn phải chuyển sang `STALE/PAUSED`, không được tự warp hoặc auto-accept dựa trên snapshot cũ.

## 5. Cấu hình đề xuất

Các field dưới đây là contract/settings mà T96 runtime đã dùng; T97/T98 wizard là cách thân thiện để ghi chúng. Đây là field của manager, không phải field gửi trực tiếp để game tự hiểu.

```js
partyAutoInvite: false,
partyAutoJoin: false,
partyFollowMode: 'off',       // 'off' | 'same_map' | 'map_and_position'
partyGroupId: 'none',         // group của manager, khác teamId
partyRole: 'none',            // 'none' | 'leader' | 'member'
partyLeaderLineUid: '',       // dùng khi partyRole = member
partyMemberLineUids: [],      // dùng khi partyRole = leader
partyAllowWarp: false,        // follow có được tự warp sang map Leader không
partyFollowDistance: 60,      // khoảng cách mục tiêu, đơn vị game coordinate
partyInvitePolicy: 'group_only', // 'group_only' | 'allowlist'
partyAcceptUnknownInvites: false,
partyPauseDuringEvents: true,
partyPauseDuringGuildDungeon: true,
partyRequestCooldownMs: 15000,
partyInviteCooldownMs: 60000
```

### Quy tắc cấu hình

- `partyAutoInvite` chỉ có tác dụng khi `partyRole === 'leader'`.
- `partyAutoJoin` chỉ có tác dụng khi `partyRole === 'member'`.
- `partyFollowMode = 'same_map'`: giữ Party và cố gắng cùng map, không điều khiển tọa độ leader.
- `partyFollowMode = 'map_and_position'`: cùng map và đi tới vùng lân cận Leader.
- `partyAllowWarp = false` là mặc định an toàn; nếu `true`, vẫn phải qua `checkAndRouteMap()` và blocker guard.
- `partyLeaderLineUid` phải thuộc cùng `userId`, hoặc được cho phép bởi policy owner; không tự follow account ngoài scope.
- `partyMemberLineUids` là allowlist manager-side, không thay thế permission server-side.

### 5.1 Quy tắc UX cho Party profile (T97)

`partyGroupId` và `partyMemberLineUids` là dữ liệu điều phối nội bộ, không phải thông tin người dùng nên phải tự tìm. Dashboard không yêu cầu người dùng gõ hai giá trị này trong luồng chính.

| Khái niệm | Người dùng nhìn thấy | Backend lưu/dùng |
|---|---|---|
| Account manager | Tên account, tên nhân vật hiện tại, trạng thái online/offline | `line_uid` ổn định của account |
| Party profile | Tên nhóm do người dùng đặt, ví dụ “Party farm tối” | `partyGroupId` sinh tự động, scoped theo `userId` |
| Leader/Member | Checkbox hoặc card account | `partyLeaderLineUid`, `partyMemberLineUids` |
| Party identity của game | Không cho nhập thủ công | `pid`, `ref`, invitation `id` do game server trả về |

Luồng cấu hình chuẩn:

```text
Tạo Party profile
  -> đặt tên hiển thị nhóm
  -> chọn một Leader từ account picker
  -> chọn một hoặc nhiều Member cùng owner
  -> hệ thống tự sinh partyGroupId ổn định
  -> tự ghi partyRole/partyLeaderLineUid/partyMemberLineUids
  -> chọn Auto-invite, Auto-join, Follow và Allow warp
  -> xem preview + validation trước khi lưu
```

Không dùng tên nhân vật làm khóa cấu hình. Tên chỉ là display/target-resolution hint; khi chạy, manager đi theo pipeline:

```text
account được chọn
  -> line_uid nội bộ
  -> BotInstance tương ứng
  -> player.name hiện tại
  -> others[].rf hoặc search row.r
  -> action Party với opaque ref/id/pid của game server
```

Nếu character name chưa có, bot offline hoặc target có nhiều kết quả không phân biệt được, wizard vẫn có thể lưu profile nhưng runtime phải giữ trạng thái `WAITING_TARGET/PAUSED`, không gửi invite mù.

## 6. Kiến trúc triển khai đề xuất

### 6.1 State trong `BotInstance`

Thêm state runtime, không cần ghi toàn bộ snapshot vào `accounts.json`:

```js
this.partySnapshot = null;
this.partyLastSeenAt = 0;
this.partyState = 'DISABLED';
// DISABLED | DISCOVERING | INVITING | WAITING_ACCEPT | JOINING |
// IN_PARTY | FOLLOWING | PAUSED | STALE | COOLDOWN | ERROR

this.partyPendingAction = null;
this.partyPendingTarget = null;
this.partyLastActionAt = 0;
this.partyLastInviteByTarget = new Map();
this.partyLastRequestByGroup = new Map();
this.partyLeaderRef = null;
this.partyLeaderName = null;
this.partyLastFollowAt = 0;
this.partyLastFollowTarget = null;
this.partyError = null;
```

`partySnapshot` nên giữ dữ liệu đã normalize tối thiểu:

```js
{
  pid: Number,
  n: Number,
  max: Number,
  leaderRef: String | null,
  leaderName: String | null,
  members: [],
  lfg: null,
  receivedAt: Number
}
```

Không lưu raw response không giới hạn; chỉ giữ field cần cho dashboard, state machine và follow.

### 6.2 Thành phần điều phối

Ưu tiên triển khai các helper trên `BotInstance` trước khi tách thành service riêng:

```text
fetchPartyState()
searchPartyTargets(tab, query)
sendPartyAction(action, payload)
resolveConfiguredPartyTargets()
runPartyAutomation()
runPartyFollow()
pausePartyAutomation(reason)
clearPartyRuntimeState(reason)
```

Khi số lượng bot tăng, có thể tách `PartyCoordinator` cấp process để tránh mỗi bot tự tìm và mời lẫn nhau. Coordinator phải chỉ điều phối các bot cùng `userId` và `partyGroupId`.

### 6.3 Vị trí trong `pollGame()`

Đề xuất thứ tự:

1. Nhận và validate response `xhrpg_game.php`.
2. Cập nhật `player`, `others`, Event, Guild Dungeon và các snapshot hiện tại.
3. Cập nhật Party snapshot từ các field `pty/*` nếu có.
4. Chạy `runPartyAutomation()` để enqueue invite/join request với cooldown.
5. Chạy map routing single-source-of-truth.
6. Chạy movement priority; Party follow chỉ được chọn khi không có blocker/automation ưu tiên cao hơn.

Không nên gọi `xhrpg_party.php` đồng thời với `xhrpg_game.php` trong cùng tick nếu request queue đang bận; dùng queue hiện tại và `dedupeKey` riêng cho Party.

## 7. Auto-invite

### 7.1 Luồng chuẩn

```text
Leader running
  -> partyAutoInvite = true
  -> partyRole = leader
  -> đọc party state
  -> nếu chưa có Party: tạo/khởi tạo theo contract server nếu server cho phép
  -> nếu Party đầy: dừng invite
  -> resolve từng memberLineUid thành người chơi online
  -> ưu tiên ref từ others[]
  -> fallback search theo tên khi cùng map/được phép
  -> invite(ref/name)
  -> chờ pty snapshot hoặc invitation response
```

### 7.2 Target resolution

Thứ tự an toàn:

1. Tìm bot mục tiêu trong cùng owner và đọc `player.name`/identity hiện tại.
2. Nếu hai bot đang cùng map, tìm `others[]` có tên/identity khớp và lấy `others[].rf`.
3. Nếu không có `rf`, gọi `xhrpg_party.php action=search` với tab phù hợp.
4. Chỉ dùng `name` fallback khi name được cấu hình rõ ràng và server endpoint chấp nhận field này.
5. Nếu không resolve được, log `WAITING_TARGET`; không gửi request mù.

### 7.3 Guard

- Chỉ Leader được invite; nếu snapshot báo không còn `ld`, chuyển `PAUSED`.
- Không invite bot đã có `pty`, đang offline, đang Event/Guild Dungeon/Party Dungeon theo policy.
- Không invite khi `n >= max`; dùng `max` server trả về, không hardcode 5 ở logic.
- Mỗi target chỉ invite lại sau `partyInviteCooldownMs` hoặc khi snapshot cho thấy trạng thái đã thay đổi.
- Nếu upstream báo Party đầy, không retry cho đến khi `pty.n` giảm.
- Nếu upstream trả permission/session error, dừng automation và yêu cầu người dùng xử lý session.

## 8. Auto-join

Auto-join gồm hai nhánh, không được gộp thành một request giả định:

### 8.1 Join qua bảng tìm Party

```text
Member chưa có pty
  -> tìm Party Leader theo partyLeaderLineUid/group
  -> search/state lấy pid server trả về
  -> request({ pid })
  -> state = WAITING_ACCEPT
  -> nhận pty hoặc response thành công
```

### 8.2 Accept lời mời

```text
poll trả về pty_inv
  -> validate inviter theo group/allowlist
  -> respond({ id: invitation.id, ok: 1 })
  -> chờ pty snapshot
```

Nếu invitation không có đủ identity để chứng minh thuộc group, không tự accept dù `partyAutoJoin` đang bật; log lý do và yêu cầu mở rộng adapter/contract server.

### 8.3 Request vào Party bị từ chối

- `partyRequestCooldownMs` áp dụng theo `pid`.
- Không request lại khi `pty_rq` hoặc `myrq` còn pending.
- Khi bị kick gần đây hoặc server trả cooldown, chuyển `COOLDOWN` theo thời gian server báo; không tự bypass.
- Nếu đã có Party khác, không tự leave Party hiện tại trừ khi setting riêng được bổ sung rõ ràng.

## 9. Follow Party

### 9.1 Khái niệm

Follow Party không chỉ là “có cùng `pid`”. Nó gồm ba mức:

| Mode | Hành vi |
|---|---|
| `off` | Không tác động movement |
| `same_map` | Duy trì cùng map với Leader khi không có blocker; không bám tọa độ |
| `map_and_position` | Cùng map và đi tới vùng lân cận Leader |

### 9.2 Xác định Leader trên map

Party snapshot dùng để xác nhận membership. Tọa độ follow phải lấy từ `others[]`, vì `pty.mem` hiện chỉ được dùng cho thông tin member/status/map trong UI.

```text
leader party pid == member party pid
  -> tìm others[] có pt == pid
  -> match rf/name với leaderRef/leaderName đã cache
  -> lấy x/y/map từ entry hợp lệ
```

Nếu không có entry Leader trong `others[]`, member giữ movement hiện tại hoặc fallback farm riêng; không bám tọa độ stale.

### 9.3 Movement policy

Khi `map_and_position` hoạt động:

- Nếu khác map và `partyAllowWarp = false`: log `WAITING_LEADER_MAP`, không warp.
- Nếu khác map và `partyAllowWarp = true`: chỉ warp khi Leader đang online, snapshot còn mới và không có Event/Guild Dungeon/Party Dungeon/restore.
- Cùng map nhưng khoảng cách lớn hơn `partyFollowDistance`: đặt `explore_cx/explore_cy` gần Leader, `traveling = 1`, `lock_pos = 0`.
- Đã tới khoảng cách mục tiêu: dừng follow movement; không khóa cứng tọa độ nếu bot còn cần farm/attack.
- Nếu Leader chết/offline/ở map khác quá TTL: dừng follow, giữ map hiện tại và chuyển `STALE` hoặc `PAUSED`.

### 9.4 Priority với automation hiện có

```text
Event return/restore
  > Event active
  > Guild Dungeon enter/exit/restore
  > Party Dungeon
  > MVP/Guild Boss hunt
  > Party follow
  > Auto Map
  > Auto Zone
  > Personal farm
```

Party follow không được ghi đè `checkAndRouteMap()` đang là single source of truth. Nếu follow cần warp, nó phải phát ra một intent được routing layer xét, không gọi warp trực tiếp từ nhiều nhánh.

## 10. State machine

```text
DISABLED
  -> DISCOVERING          khi bật một policy Party
DISCOVERING
  -> INVITING             Leader có target hợp lệ
  -> JOINING              Member có pid/Invitation hợp lệ
  -> IN_PARTY             nhận snapshot pty hợp lệ
  -> STALE                snapshot quá TTL
INVITING
  -> WAITING_ACCEPT       request invite thành công
  -> IN_PARTY             snapshot đã có member
  -> COOLDOWN             upstream reject/rate limit
JOINING
  -> WAITING_ACCEPT       request gửi thành công
  -> IN_PARTY             server xác nhận pty
IN_PARTY
  -> FOLLOWING            follow mode bật và Leader resolve được
  -> PAUSED               Event/Dungeon/blocker
  -> DISCOVERING          rời/kick/disband hoặc pty biến mất
FOLLOWING
  -> STALE                mất Leader snapshot/position quá TTL
  -> PAUSED               blocker ưu tiên cao
  -> IN_PARTY             tạm không resolve vị trí nhưng membership còn
PAUSED/STALE/COOLDOWN
  -> DISCOVERING          khi blocker/cooldown hết và policy vẫn bật
```

Mọi transition phải ghi log có prefix `[Party]` và lý do ngắn gọn; không log lặp mỗi poll nếu state không đổi.

## 11. API manager và Dashboard đề xuất

Các endpoint dưới đây chưa tồn tại; dùng như implementation contract:

| Endpoint | Mục đích |
|---|---|
| `GET /api/accounts/:line_uid/party` | Snapshot Party đã normalize + runtime state |
| `POST /api/accounts/:line_uid/party/action` | Manual `state`, `invite`, `request`, `respond`, `leave`, `kick`, `lead`, `disband` |
| `POST /api/party/sync` | Đồng bộ policy Party cho các bot trong cùng `partyGroupId` |

`PUT /api/accounts/:line_uid` vẫn nhận settings tổng quát; T97 wizard ghi các field Party qua `POST /api/party/profiles` sau khi validation. Các endpoint Party-specific ở bảng trên vẫn là contract mở rộng, không được giả định đã tồn tại.

Dashboard cần tối thiểu:

- Toggle Auto-invite, Auto-join, Follow.
- Wizard/account picker để chọn `partyRole`, Party Leader và Member; không bắt người dùng nhập raw `line_uid` trong luồng chính.
- Cho phép đặt tên Party profile; `partyGroupId` được sinh tự động và chỉ hiển thị dạng read-only khi cần debug.
- Allowlist thành viên từ các account cùng `userId`; mỗi item hiển thị account name, character name, status và line_uid rút gọn.
- Chọn mode follow, cho phép warp và follow distance.
- Hiển thị `pid`, `n/max`, Leader, state, last action, cooldown và lý do pause.
- Nút manual: refresh state, invite, request join, accept/decline, leave.

### 11.1 Account picker và Party profile

#### Nguồn danh sách account

Ưu tiên dùng dữ liệu đã có từ `GET /api/accounts`: `line_uid`, `name`, `player.name`, `status`, `userId` và `settings`. Không lấy `line_uid` từ game client, không yêu cầu người dùng mở DevTools và không cho nhập `session_token` vào Party profile.

#### Quy tắc chọn

- Chỉ hiển thị account thuộc `req.user.id`; admin có thể xem account khác nhưng không được ghép chéo owner trong profile user thường.
- Một profile chỉ có một Leader và tối thiểu một Member nếu bật Auto-invite.
- Không cho chọn cùng một account vừa là Leader vừa là Member.
- Không cho một account thuộc hai profile đang active trong cùng owner nếu chưa có thao tác “chuyển nhóm” rõ ràng.
- Account offline vẫn có thể được chọn; UI đánh dấu `Chờ bot online`, còn runtime không invite cho đến khi có `player.name` và poll mới.
- Nếu account đã bị xóa hoặc `line_uid` không còn trong danh sách, profile chuyển `INVALID_TARGET` và yêu cầu sửa, không tự thay bằng account khác.

#### Hiển thị và xác nhận

Mỗi account card nên hiển thị:

```text
☑ MemberBot · Nhân vật: Alice · Online · Lv.60
  ID nội bộ: …a91f     Party hiện tại: 2/5
```

Trước khi lưu cần có preview:

```text
Party farm tối
Leader: LeaderBot · Nhân vật: Bob
Members: MemberBot (Alice), SupportBot (Carol)
Group key: tự sinh · owner-scoped
```

Mọi lỗi validation phải chỉ rõ account nào lỗi và cách sửa; không bắt người dùng hiểu `pid`, `rf` hoặc invitation `id`.

#### Persistence và migration

- Wizard ghi xuống các setting per-account hiện có để giữ tương thích với T96: `partyGroupId`, `partyRole`, `partyLeaderLineUid`, `partyMemberLineUids`.
- Tên hiển thị profile là metadata manager-side; không dùng tên này làm Party ID gửi lên game.
- Cấu hình cũ đã nhập raw `line_uid` được resolve ngược thành account card nếu còn tồn tại.
- `line_uid` không resolve được thì giữ nguyên để người dùng sửa/xóa; không âm thầm đổi sang account khác.
- Không tự merge các group cũ chỉ vì tên hiển thị giống nhau.

#### Trạng thái cấu hình

| State | Ý nghĩa | Hành vi |
|---|---|---|
| `READY` | Tất cả account hợp lệ, bot có thể chạy | Cho phép bật policy |
| `WAITING_TARGET` | Account được chọn nhưng bot/character chưa online | Lưu profile, chưa invite |
| `INVALID_TARGET` | `line_uid` bị xóa hoặc khác owner | Chặn lưu policy active |
| `CONFLICT` | Trùng Leader, trùng group hoặc account thuộc profile khác | Yêu cầu người dùng chọn lại |
| `ACTIVE` | Runtime đã nhận profile và Party policy đang bật | Hiển thị Party state live |

## 12. Error handling, cooldown và telemetry

### 12.1 Dedupe

Mỗi bot chỉ có một Party action pending. Dedupe key đề xuất:

```text
party:state:<line_uid>
party:invite:<line_uid>:<targetKey>
party:request:<line_uid>:<pid>
party:respond:<line_uid>:<invitationId>
party:follow:<line_uid>:<leaderKey>
```

### 12.2 Retry

- `state/search`: retry tối đa 2 lần với backoff ngắn; không spam mỗi poll.
- `invite/request/respond`: không retry ngay; chờ cooldown hoặc state thay đổi.
- timeout/network error: giữ intent trong memory với expiry, không ghi duplicate action.
- session/token error: dừng Party automation, dùng flow refresh session hiện tại.

### 12.3 Telemetry cần expose

```js
partyState
partySnapshot
partyLastSeenAt
partyLastActionAt
partyLastAction
partyPendingAction
partyCooldownUntil
partyError
partyLeaderName
partyMemberCount
partyFollowTarget
```

Không expose `session_token` hoặc raw invitation payload chứa dữ liệu nhạy cảm lên Dashboard.

## 13. Test plan

### Unit

- Default settings Party đều tắt và `partyGroupId = 'none'`.
- Normalize `pty`, `pty_inv`, `pty_rq`, `others[].pt/rf` khi field thiếu.
- Không invite khi Party đầy, bot offline hoặc target đã ở Party.
- Dedupe invite/request/respond theo target và cooldown.
- Auto-join chỉ chấp nhận invitation thuộc allowlist/group.
- `partyFollowMode = off` không thay đổi movement.
- `same_map` không warp khi `partyAllowWarp = false`.
- `map_and_position` chọn đúng `others[].x/y` của Leader cùng `pid`.
- Snapshot stale không được dùng để warp.

### Integration với `pollGame()`

- Poll trả `pty` → runtime chuyển sang `IN_PARTY`.
- Poll mất `pty` → reset membership và cho phép discovery lại sau cooldown.
- Leader online + member cùng group → invite đúng một lần.
- Member có `pid` từ `state` → follow không đụng MVP/Event/Guild Dungeon routing.
- Event bắt đầu trong khi follow → Party state `PAUSED`, sau restore mới resume.
- Member bị kick → không tự request lại trước khi cooldown hết.
- Nhiều group Party của cùng owner không mời chéo.

### Contract/live fixture

Trước khi triển khai production cần lưu fixture đã ẩn token cho các response:

```text
party state: có Party / không Party / Party đầy
search: near / name / guild / seek
invite: success / already invited / target unavailable
respond: accept / decline / expired
request: pending / accepted / rejected / recently kicked
follow: leader cùng map / khác map / offline / missing others entry
```

## 14. Acceptance criteria cho implementation sau này

- [ ] Không account nào tự động tham gia Party khi chưa bật `partyAutoJoin`.
- [ ] Auto-invite chỉ mời target trong cùng owner/group/allowlist và không vượt `state.max`.
- [ ] Auto-join không chấp nhận lời mời không xác minh được nguồn.
- [ ] Mỗi action có dedupe, cooldown và log state transition.
- [ ] Follow không ghi đè Event, Guild Dungeon, Party Dungeon hoặc restore.
- [ ] Khi mất Party/Leader/offline, bot fallback an toàn về policy cá nhân.
- [ ] Dashboard expose đủ state để chẩn đoán mà không lộ token/raw sensitive payload.
- [ ] Có test unit và integration cho các trường hợp nêu ở mục 13.
- [ ] `node --check server.js`, `node --check public/app.js`, `node test.js` và `git diff --check` đạt.

### 14.1 Acceptance criteria cho T97 account-picker/wizard

- [x] Người dùng tạo Party profile bằng cách chọn account; không cần tự tìm hoặc nhập `line_uid` trong luồng chính.
- [x] `partyGroupId` được hệ thống sinh tự động, ổn định và scoped theo owner; không nhầm với `pid` của game.
- [x] Picker hiển thị account name, character name, online status, level và Party state hiện tại.
- [x] Validation chặn account khác owner, Leader trùng Member, group conflict và target đã bị xóa.
- [x] Bot offline/character chưa resolve được phép lưu ở trạng thái `WAITING_TARGET` nhưng không được auto-invite.
- [x] Cấu hình cũ dùng raw `line_uid` được resolve hoặc báo `INVALID_TARGET`, không tự thay target.
- [x] Runtime mapping được kiểm thử từ account selection → `line_uid` → character name → `others[].rf`/search row.r → Party action.
- [x] Không expose `session_token`, raw opaque `ref/id` hoặc dữ liệu nhạy cảm trong account picker.

### 14.2 Verification note cho T99

- Game poll thực tế có thể trả tên nhân vật ở `player.display_name`; runtime phải normalize về `player.name` trước khi resolve Party target hoặc xác minh inviter.
- Live verification ngày 2026-10-02 đã xác nhận: Leader gửi `invite`, Member nhận `pty_inv`, Member gửi `respond`, và hai account cùng vào Party snapshot `pid=25`, `n=2/5`.
- Nếu một poll kế tiếp trả `too_fast`, không coi đó là mất membership khi response của action đã trả `pty`; chờ cadence poll kế tiếp theo throttle game server.

## 15. Ngoài phạm vi tài liệu này

- Tự động vận hành Party Dungeon từ đầu đến cuối; chỉ mô tả điểm tích hợp `pdun_call` và các blocker.
- Thay đổi luật EXP/drop/buff ở game server.
- Tự động accept lời mời Party ngẫu nhiên từ người chơi ngoài allowlist.
- Đồng bộ Party với `teamId` hiện tại mà không có setting ánh xạ explicit.
- Tự phát minh endpoint hoặc field chưa xuất hiện trong client/response thực tế.

## 16. Nguồn tham chiếu trong repo

- `xhrpg_canvas.js:25106` — Party core và `xhrpg_party.php`.
- `xhrpg_canvas.js:25155` — Party poll fields.
- `xhrpg_canvas.js:25450` — Party actions/UI operations.
- `xhrpg_canvas.js:25760` — Party Dungeon.
- `xhrpg_canvas.js:15640` — poll hook.
- `server.js:1992` — `BotInstance` lifecycle/state.
- `server.js:4991` — `pollGame()`.
- `server.js:11703` — wildcard PHP proxy.
