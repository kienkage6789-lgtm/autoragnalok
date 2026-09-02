const SKILL_DEFS = [
  { id: 'crit_shot', name: 'Ném chí mạng', emoji: '🎯', type: 'passive', tree: 'atk' },
  { id: 'kill_shot', name: 'Dao ném sấm sét', emoji: '⚡', type: 'active', tree: 'atk' },
  { id: 'explosive_shot', name: 'Dao ném phát nổ', emoji: '💥', type: 'active', tree: 'atk' },
  { id: 'lock_on', name: 'Khóa mục tiêu', emoji: '🧿', type: 'active', tree: 'atk' },
  { id: 'triple_knife', name: 'Phóng tam đao', emoji: '🔱', type: 'active', tree: 'atk' },
  { id: 'tough_body', name: 'Cơ thể cường tráng', emoji: '❤️', type: 'passive', tree: 'def' },
  { id: 'armor_up', name: 'Tăng cường giáp', emoji: '🛡️', type: 'passive', tree: 'def' },
  { id: 'hp_regen', name: 'Tự phục hồi HP', emoji: '💚', type: 'passive', tree: 'def' },
  { id: 'pull_monster', name: 'Từ trường hút quái', emoji: '🧲', type: 'active', tree: 'def' },
  { id: 'melee_return', name: 'Phản đòn cận chiến', emoji: '🛡️', type: 'passive', tree: 'def' },
  { id: 'melee_charge', name: 'Tích tụ kịch độc', emoji: '🔥', type: 'active', tree: 'def' },
  { id: 'knife_atk', name: 'Rèn luyện kiếm thuật', emoji: '🗡️', type: 'passive', tree: 'melee' },
  { id: 'double_attack', name: 'Liên hoàn chém song kích', emoji: '⚔️', type: 'active', tree: 'melee' },
  { id: 'spin_attack', name: 'Chém xoáy vòng tròn', emoji: '🌀', type: 'active', tree: 'melee' },
  { id: 'sword_cross', name: 'Chém chữ Thập (+)', emoji: '➕', type: 'active', tree: 'melee' },
  { id: 'sword_x', name: 'Chém chữ X (x)', emoji: '✖️', type: 'active', tree: 'melee' },
  { id: 'deploy_turret', name: 'Triển khai tháp pháo', emoji: '🗼', type: 'passive', tree: 'turret' },
  { id: 'turret_rapid', name: 'Gia cố tháp pháo nhanh', emoji: '⏳', type: 'passive', tree: 'turret' },
  { id: 'twin_turret', name: 'Tháp pháo đôi', emoji: '🗼', type: 'passive', tree: 'turret' },
  { id: 'turret_shock', name: 'Tháp pháo phóng điện SHOCK', emoji: '🌩️', type: 'active', tree: 'turret' },
  { id: 'turret_cannon', name: 'Đại pháo hủy diệt', emoji: '💣', type: 'active', tree: 'turret' }
];

const NORMAL_MONSTERS = [
  'Gà con', 'Heo con', 'Cừu con', 'Gà rừng', 'Gà tây', 'Cừu', 'Bò', 'Vua bò tót',
  'Slime xanh lá', 'Slime xanh dương', 'Vua Slime tím', 'Slime vàng', 'Slime cam', 'Vua Slime đỏ',
  'Mầm độc', 'Cây ăn thịt', 'Vua cây bóng tối', 'Golem đá', 'Golem đá tảng', 'Golem cổ đại',
  'Nấm bào tử', 'Nấm độc đỏ', 'Nấm tím tử thần', 'Chuột cát', 'Chuột khổng lồ', 'Vua chuột',
  'Người thằn lằn', 'Chiến binh thằn lằn', 'Vua thằn lằn', 'Người sói', 'Chiến binh sói', 'Vua sói',
  'Slime độc', 'Slime khổng lồ', 'Vua Slime', 'Ma cà rồng trẻ', 'Ma cà rồng trưởng lão', 'Chúa tể ma cà rồng',
  'Lính xương', 'Kỵ sĩ xương', 'Tướng quân xương', 'Tiểu quỷ', 'Quỷ chiến tranh', 'Chúa tể ác quỷ',
  'Zombie đất', 'Zombie chiến binh', 'Vua Zombie', 'Sứa phát quang', 'Sứa độc', 'Vua sứa',
  'Cua đá khổng lồ', 'Cua thiết giáp', 'Cầu gai độc', 'Cá san hô độc', 'Cá sư tử', 'Cá quỷ',
  'Cá mập đói', 'Cá mập búa', 'Thủy quái vực sâu', 'Hỏa long cổ đại', 'Kim long', 'Huyết long',
  'Ma nhãn xám', 'Hỏa ma nhãn', 'Vua ma nhãn', 'Kỳ nhông lửa', 'Tiểu quỷ hỏa', 'Tiểu quỷ bóng tối',
  'Chó săn lửa', 'Đầu lâu lửa', 'Kỵ sĩ hỏa ngục', 'Ma Vương Bóng Đêm'
];

const MVP_MONSTERS = NORMAL_MONSTERS.map(m => m.startsWith('MVP ') || m.startsWith('Vua ') || m.startsWith('Chúa tể ') ? m : `MVP ${m}`);

const ALL_MONSTERS = [...NORMAL_MONSTERS];

const NORMAL_COLLECTIBLES = [
  'Linh kiện phi thuyền', 'Linh kiện vũ khí', 'Linh kiện Stat', 
  'Khúc gỗ kỳ diệu', 'Linh kiện băng chuyền', 'Khuôn đúc đặc biệt'
];
const MVP_COLLECTIBLES = [
  'Linh kiện Titan', 'Bảo vật'
];
const ALL_COLLECTIBLES = [...NORMAL_COLLECTIBLES, ...MVP_COLLECTIBLES];

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const btnAddAccount = document.getElementById('btn-add-account');
  const btnAddAccountPlaceholder = document.getElementById('btn-add-account-placeholder');
  const addAccountModal = document.getElementById('add-account-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const addAccountForm = document.getElementById('add-account-form');
  const submitSpinner = document.getElementById('submit-spinner');
  const modalSubmitBtn = document.getElementById('modal-submit-btn');
  const modalError = document.getElementById('modal-error');
  const noAccountsMsg = document.getElementById('no-accounts-msg');
  const accountsGrid = document.getElementById('accounts-grid');

  // PHPSESSID Form Elements
  const addPhpsessidForm = document.getElementById('add-phpsessid-form');
  const inputPhpsessid = document.getElementById('input-phpsessid');
  const phpsessidError = document.getElementById('phpsessid-error');


  // Edit Modal Elements
  const editAccountModal = document.getElementById('edit-account-modal');
  const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
  const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');
  const editAccountForm = document.getElementById('edit-account-form');
  const editSubmitSpinner = document.getElementById('edit-submit-spinner');
  const editModalSubmitBtn = document.getElementById('edit-modal-submit-btn');
  const editModalError = document.getElementById('edit-modal-error');

  // Auth Elements
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const loginSpinner = document.getElementById('login-spinner');
  const loginError = document.getElementById('login-error');

  const userHeaderActions = document.getElementById('user-header-actions');
  const headerUsername = document.getElementById('header-username');
  const headerQuotaBadge = document.getElementById('header-quota-badge');
  const headerExpiryBadge = document.getElementById('header-expiry-badge');
  const btnAdminPanel = document.getElementById('btn-admin-panel');
  const btnLogout = document.getElementById('btn-logout');

  // Admin Modal Elements
  const adminUsersModal = document.getElementById('admin-users-modal');
  const adminModalCloseBtn = document.getElementById('admin-modal-close-btn');
  const adminCreateUserForm = document.getElementById('admin-create-user-form');
  const newUserName = document.getElementById('new-user-name');
  const newUserPass = document.getElementById('new-user-pass');
  const newUserQuota = document.getElementById('new-user-quota');
  const adminCreateUserError = document.getElementById('admin-create-user-error');
  const adminUsersTableBody = document.getElementById('admin-users-table-body');

  const appMain = document.querySelector('.app-main');
  const announcementsContainer = document.getElementById('announcements-container');
  const adminAnnouncementsTableBody = document.getElementById('admin-announcements-table-body');
  const announcementTypeSelect = document.getElementById('announcement-type');
  const announcementContentTextarea = document.getElementById('announcement-content');
  const adminAnnouncementError = document.getElementById('admin-announcement-error');

  // State
  let currentUser = null;
  let adminProxiesList = [];
  const activeTabs = {}; // line_uid -> tab_id
  const rateUnits = {}; // line_uid -> 'min' | 'hour' | 'day'
  const activeLogSubTabs = {}; // line_uid -> sub_tab_id
  const activeEventSubTabs = {}; // line_uid -> sub_tab_id
  const activeMvpSubTabs = {}; // line_uid -> sub_tab_id
  let expandedUserGroups = new Set();
  let isUserGroupInitialized = false;
  window.lastFetchedAccounts = [];
  let isDraggingCard = false;

  window.toggleUserGroup = function(userId, event) {
    if (event) event.stopPropagation();
    const groupCard = document.getElementById(`user-group-card-${userId}`);
    if (!groupCard) return;
    if (expandedUserGroups.has(userId)) {
      expandedUserGroups.delete(userId);
      groupCard.classList.remove('expanded');
    } else {
      expandedUserGroups.add(userId);
      groupCard.classList.add('expanded');
      if (window.lastFetchedAccounts && window.lastFetchedAccounts.length > 0) {
        renderAccounts(window.lastFetchedAccounts);
      }
    }
  };

  window.changeUserBatchProxy = async function(userId, username, proxyId) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/proxy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const proxyLabel = proxyId === 'direct' ? 'Direct Connection' : (proxyId === 'auto' ? 'Auto Rotation Pool' : (adminProxiesList.find(p => p.id === proxyId)?.label || proxyId));
        alert(`✅ Đã gán Proxy [${proxyLabel}] thành công cho ${data.updatedCount} bot của user ${username}!`);
        fetchAccounts();
      } else {
        alert(`🔴 Lỗi gán Proxy: ${data.error || 'Thất bại'}`);
      }
    } catch (e) {
      console.error('Error changing batch proxy:', e);
      alert('Không thể kết nối máy chủ');
    }
  };

  window.changeUserMarketLimit = async function(userId, username, limit) {
    const parsed = parseInt(limit);
    if (isNaN(parsed) || parsed < 0) {
      alert('🔴 Giới hạn không hợp lệ. Vui lòng nhập số >= 0.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/market-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketBotLimit: parsed })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Đã cập nhật giới hạn bot chạy chợ (${parsed} bot) cho user ${username}!`);
        fetchAccounts();
      } else {
        alert(`🔴 Lỗi cập nhật giới hạn: ${data.error || 'Thất bại'}`);
      }
    } catch (e) {
      console.error('Error changing market limit:', e);
      alert('Không thể kết nối máy chủ');
    }
  };

  window.changeUserPollInterval = async function(userId, username, val) {
    const parsed = parseInt(val) || 2000;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollInterval: parsed })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Đã cập nhật nhịp Polling (${parsed}ms) cho user ${username}!`);
        fetchAdminUsers();
      } else {
        alert(`🔴 Lỗi cập nhật nhịp Polling: ${data.error || 'Thất bại'}`);
      }
    } catch (e) {
      console.error('Error changing user poll interval:', e);
      alert('Không thể kết nối máy chủ');
    }
  };

  window.toggleUserPollIntervalPermission = async function(userId, username, checked) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowEditPollInterval: checked })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Đã ${checked ? 'cấp quyền' : 'thu hồi quyền'} tự chỉnh Nhịp Polling cho user ${username}!`);
        if (typeof fetchAdminUsers === 'function') fetchAdminUsers();
        if (typeof fetchAccounts === 'function') fetchAccounts();
      } else {
        alert(`🔴 Lỗi cập nhật quyền tự chỉnh Nhịp Polling: ${data.error || 'Thất bại'}`);
      }
    } catch (e) {
      console.error('Error toggling user poll interval permission:', e);
      alert('Không thể kết nối máy chủ');
    }
  };

  window.stepUserMarketLimit = async function(userId, username, delta) {
    const inp = document.getElementById(`user-market-limit-${userId}`) || document.getElementById(`market-limit-inp-${userId}`);
    let current = inp ? parseInt(inp.value) || 0 : 0;
    let next = Math.max(0, current + delta);
    if (inp) inp.value = next;
    await window.changeUserMarketLimit(userId, username, next);
  };

  window.showToast = function(msg, isError = false) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `padding: 10px 16px; border-radius: 8px; font-size: 0.88rem; font-weight: 600; color: #fff; background: ${isError ? 'rgba(220, 38, 38, 0.92)' : 'rgba(16, 185, 129, 0.92)'}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); backdrop-filter: blur(8px); transition: all 0.3s ease; opacity: 0; transform: translateY(10px); pointer-events: auto;`;
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  function formatNumberWithDots(val) {
    if (val === undefined || val === null) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function formatNumber(val) {
    return formatNumberWithDots(val);
  }
  window.formatNumber = formatNumberWithDots;

  function formatShortGold(val) {
    if (!val) return '0 Gold';
    if (val >= 1000000) {
      return (val / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M Gold';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace(/\.?0+$/, '') + 'K Gold';
    }
    return val + ' Gold';
  }

  const MONSTER_DICT = {
    1:  { n: 'Sứa Đỏ',             e: '🔴', lv: 1,  cs: 'str' },
    2:  { n: 'Sâu Lá',              e: '🐛', lv: 2,  cs: 'agi' },
    3:  { n: 'Thỏ Trắng',          e: '🐰', lv: 3,  cs: 'vit' },
    4:  { n: 'Chim Khai Phá',       e: '🐥', lv: 5,  cs: 'dex' },
    5:  { n: 'Chuồn Chuồn',          e: '🦟', lv: 7,  cs: 'intel' },
    6:  { n: 'Mộc Yêu',             e: '🪵', lv: 9,  cs: 'luk' },
    7:  { n: 'Nấm Độc',             e: '🍄', lv: 12, cs: 'vit' },
    8:  { n: 'Sói Xám',             e: '🐺', lv: 15, cs: 'dex' },
    9:  { n: 'Cốt Binh',             e: '💀', lv: 18, cs: 'str' },
    10: { n: 'Thây Ma',             e: '🧟', lv: 22, cs: 'vit' },
    11: { n: 'Xác Ướp',             e: '🩹', lv: 26, cs: 'vit' },
    12: { n: 'Rắn Độc',             e: '🐍', lv: 30, cs: 'agi' },
    13: { n: 'Người Đá',            e: '🗿', lv: 35, cs: 'str' },
    14: { n: 'Băng Khổng Lồ',        e: '🧊', lv: 40, cs: 'vit' },
    15: { n: 'Quỷ Tuyết',            e: '❄️', lv: 45, cs: 'str' },
    16: { n: 'Bò Thần',              e: '🐂', lv: 50, cs: 'str' },
    17: { n: 'Pháp Sư',             e: '📿', lv: 55, cs: 'intel' },
    18: { n: 'Thuyền Trưởng',       e: '🏴‍☠️', lv: 60, cs: 'dex' },
    19: { n: 'Quỷ Lửa',             e: '🔥', lv: 65, cs: 'str' },
    20: { n: 'Chúa Lửa',             e: '🌋', lv: 70, cs: 'str' },
    21: { n: 'Bọ Hoàng Kim',        e: '🐞', lv: 75, cs: 'vit' },
    22: { n: 'Nữ Hoàng Maya',        e: '👑', lv: 80, cs: 'intel' },
    23: { n: 'Vua Bọ',              e: '☥',  lv: 85, cs: 'intel' },
    24: { n: 'Chúa Tể Baphomet',    e: '🐐', lv: 90, cs: 'str' },
    25: { n: 'Chúa Tể Bóng Tối',    e: '🧙‍♂️', lv: 95, cs: 'intel' },
    26: { n: 'Nữ Thần Valkyrie',    e: '⚔️', lv: 100, cs: 'str' }
  };

  function getCardDetails(mid, c = {}, monMasters = {}) {
    const numericMid = Math.abs(parseInt(mid) || 1);
    const defMon = MONSTER_DICT[numericMid] || {};
    const mm = (monMasters && monMasters[numericMid]) || {};
    const monName = mm.n || mm.name || defMon.n || c.name || `Quái #${mid}`;
    const monLv = parseInt(mm.lv) || defMon.lv || c.lv || Math.max(1, numericMid * 2);
    const monEmoji = mm.e || defMon.e || c.emoji || '👾';
    const isMvp = Boolean((c.m | 0) > 0 || c.mvp);

    const STAT_LABELS = { str: 'STR', agi: 'AGI', vit: 'VIT', dex: 'DEX', intel: 'INT', luk: 'LUK' };
    const STAT_KEYS = ['str', 'agi', 'vit', 'dex', 'intel', 'luk'];
    const statType = (mm.cs || defMon.cs || STAT_KEYS[(numericMid - 1) % 6]).toLowerCase();
    const statLabel = STAT_LABELS[statType] || statType.toUpperCase();
    const statVal = Math.ceil(monLv / 10) * (isMvp ? 3 : 1);

    let cbBonus = '';
    if (c.mb && c.mb.t && c.mb.a) {
      cbBonus = `${c.mb.t.toUpperCase()} +${c.mb.a}`;
    } else {
      const cbTypes = ['str','agi','vit','dex','intel','luk','atk','armor','hp','mp','hp_regen','mp_regen'];
      const cbType = cbTypes[numericMid % 12];
      let cbVal = 0;
      if (cbType === 'hp' || cbType === 'mp') cbVal = Math.round(monLv * 30 / 4);
      else if (cbType === 'armor') cbVal = Math.ceil(monLv / 10) * 30;
      else if (cbType === 'hp_regen' || cbType === 'mp_regen') cbVal = Math.max(1, Math.floor(monLv / 10)) * 3;
      else cbVal = Math.ceil(monLv / 10) * 3;
      cbBonus = `${cbType.toUpperCase()} +${cbVal}`;
    }

    return {
      mid: numericMid,
      name: monName,
      lv: monLv,
      emoji: monEmoji,
      isMvp,
      statLabel,
      statVal,
      cbBonus
    };
  }

  window.formatMarketPriceInput = function(input, uid) {
    let cursor = input.selectionStart;
    let oldLen = input.value.length;
    let raw = input.value.replace(/[^\d]/g, '');
    if (!raw) {
      input.value = '';
      const previewLbl = document.getElementById(`lbl-market-max-price-preview-${uid}`);
      if (previewLbl) previewLbl.textContent = '';
      return;
    }
    let val = parseInt(raw);
    let formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    input.value = formatted;
    let newLen = formatted.length;
    input.setSelectionRange(cursor + (newLen - oldLen), cursor + (newLen - oldLen));

    const previewLbl = document.getElementById(`lbl-market-max-price-preview-${uid}`);
    if (previewLbl) {
      previewLbl.textContent = formatShortGold(val);
    }
  };

  function formatRemainingTime(expiresAt) {
    if (!expiresAt) return '⏳ Vô hạn';
    const now = new Date();
    const exp = new Date(expiresAt);
    const diffMs = exp - now;

    if (diffMs <= 0) return '⛔ Đã hết hạn';

    const secs = Math.floor(diffMs / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `⏳ Còn ${days} ngày ${hours % 24}h`;
    } else if (hours > 0) {
      return `⏳ Còn ${hours}h ${mins % 60}m`;
    } else if (mins > 0) {
      return `⏳ Còn ${mins}m ${secs % 60}s`;
    } else {
      return `⏳ Còn ${secs}s`;
    }
  }

  function updateUserHeaderInfo() {
    if (!currentUser) return;
    headerUsername.textContent = currentUser.username;
    btnAdminPanel.style.display = currentUser.role === 'admin' ? 'inline-flex' : 'none';

    if (headerExpiryBadge) {
      if (currentUser.role === 'admin') {
        headerExpiryBadge.style.display = 'none';
      } else {
        headerExpiryBadge.style.display = 'inline-block';
        headerExpiryBadge.textContent = formatRemainingTime(currentUser.expiresAt);
        if (currentUser.expiresAt && new Date(currentUser.expiresAt) < new Date()) {
          headerExpiryBadge.style.background = 'rgba(239,68,68,0.2)';
          headerExpiryBadge.style.color = '#ef4444';
          headerExpiryBadge.style.borderColor = 'rgba(239,68,68,0.4)';
        } else {
          headerExpiryBadge.style.background = 'rgba(245,158,11,0.2)';
          headerExpiryBadge.style.color = '#fbbf24';
          headerExpiryBadge.style.borderColor = 'rgba(245,158,11,0.3)';
        }
      }
    }
  }

  function resetAppState() {
    currentUser = null;
    adminProxiesList = [];
    Object.keys(activeTabs).forEach(k => delete activeTabs[k]);
    expandedUserGroups.clear();
    isUserGroupInitialized = false;
    window.lastFetchedAccounts = [];
    if (accountsGrid) {
      accountsGrid.innerHTML = '';
      delete accountsGrid.dataset.renderMode;
    }
  }

  // Check Auth State
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
        loginScreen.style.display = 'none';
        userHeaderActions.style.display = 'flex';
        if (appMain) appMain.style.display = 'block';
        updateUserHeaderInfo();
        headerQuotaBadge.textContent = currentUser.role === 'admin' ? 'Admin (Vô hạn)' : `.../${currentUser.maxAccounts || 1} Bot`;
        return true;
      }
    } catch (e) {}

    // Unauthenticated
    resetAppState();
    loginScreen.style.display = 'flex';
    userHeaderActions.style.display = 'none';
    if (appMain) appMain.style.display = 'none';
    return false;
  }

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginSpinner.classList.add('active');
    loginSubmitBtn.disabled = true;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.value.trim(),
          password: loginPassword.value
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        loginForm.reset();
        resetAppState();
        const authed = await checkAuth();
        if (authed) fetchAccounts();
      } else {
        loginError.textContent = data.error || 'Đăng nhập thất bại';
      }
    } catch (err) {
      loginError.textContent = 'Không thể kết nối đến máy chủ';
    } finally {
      loginSpinner.classList.remove('active');
      loginSubmitBtn.disabled = false;
    }
  });

  // Handle Logout
  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    resetAppState();
    checkAuth();
  });

  // Admin Modal open: always reset to Users tab
  btnAdminPanel.addEventListener('click', () => {
    adminUsersModal.classList.add('open');
    switchAdminTab('users');
    fetchAdminUsers();
  });

  if (adminModalCloseBtn) {
    adminModalCloseBtn.addEventListener('click', () => {
      adminUsersModal.classList.remove('open');
    });
  }

  // Admin Tab Switching
  window.switchAdminTab = function(tab) {
    // Fix #2: Dùng class .admin-tab-panel/.active thay vì inline display style
    ['users', 'proxies', 'backup', 'maps', 'announcements'].forEach(t => {
      const panel = document.getElementById(`admin-tab-${t}`);
      const btn   = document.getElementById(`admin-tab-btn-${t}`);
      if (panel) {
        panel.classList.toggle('active', t === tab);
        // Xóa inline style cũ (nếu còn sót từ lần trước)
        panel.style.display = '';
      }
      if (btn) {
        btn.classList.toggle('active', t === tab);
        // Xóa inline styles cũ
        btn.style.background  = '';
        btn.style.color       = '';
        btn.style.borderColor = '';
      }
    });

    if (tab === 'proxies' || tab === 'backup') fetchAdminProxies();
    if (tab === 'maps') fetchAdminMapsZones();
    if (tab === 'announcements') fetchAnnouncementsAdmin();
  };

  // Admin Fetch Stats Overview
  async function fetchAdminStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) return;
      const stats = await res.json();
      renderAdminStats(stats);
    } catch (e) {
      console.error('Error fetching admin stats:', e);
    }
  }

  // Admin Fetch Maps & Zones
  async function fetchAdminMapsZones() {
    try {
      const res = await fetch('/api/admin/maps-zones');
      if (!res.ok) return;
      const data = await res.json();
      renderAdminMapsZones(data);
    } catch (e) {
      console.error('Error fetching admin maps & zones:', e);
    }
  }

  function renderAdminMapsZones(data) {
    if (!data) return;
    const lastSyncEl = document.getElementById('admin-maps-last-sync');
    const countEl = document.getElementById('admin-maps-count-val');
    const tbody = document.getElementById('admin-maps-table-body');

    if (lastSyncEl) {
      lastSyncEl.textContent = data.lastSyncedAt ? new Date(data.lastSyncedAt).toLocaleString('vi-VN') : 'Chưa đồng bộ';
    }
    if (countEl) {
      countEl.textContent = (data.maps || []).length;
    }
    if (tbody) {
      const maps = data.maps || [];
      const spotsCache = data.spotsCache || {};
      if (maps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 12px; text-align: center; color: var(--text-muted);">Không tìm thấy dữ liệu bản đồ.</td></tr>';
        return;
      }
      tbody.innerHTML = maps.map(m => {
        const spotsForMap = spotsCache[m.id] ? Object.keys(spotsCache[m.id]).length : 0;
        const isPassive = m.source === 'passive_live_discovery';
        const sourceBadge = isPassive 
          ? `<span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:2px 6px; border-radius:4px; font-size:0.72rem; margin-left:6px;">✨ Tự động hấp thu (Live)</span>`
          : `<span style="background:rgba(156,163,175,0.15); color:#9ca3af; padding:2px 6px; border-radius:4px; font-size:0.72rem; margin-left:6px;">📦 Mặc định / Parsed</span>`;
        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 10px; font-weight: 700; color: #60a5fa;">#${m.id}</td>
            <td style="padding: 10px; font-weight: 600; color: #fff;">
              ${m.emoji || '🗺️'} ${m.name} ${sourceBadge}
            </td>
            <td style="padding: 10px; color: #fbbf24; font-weight: 600;">Lv.${m.req}+</td>
            <td style="padding: 10px;">
              <span style="background: ${spotsForMap > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${spotsForMap > 0 ? '#34d399' : '#f87171'}; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 0.78rem;">
                ${spotsForMap > 0 ? `${spotsForMap} khu vực` : 'Chưa thu thập'}
              </span>
            </td>
            <td style="padding: 10px; text-align: right;">
              <button onclick="editMapMeta(${m.id}, '${m.name.replace(/'/g, "\\'")}', '${m.emoji || '🗺️'}', ${m.req})" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--border-color); border-radius: 4px; padding: 3px 8px; font-size: 0.75rem; cursor: pointer;">
                ✏️ Sửa
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  window.editMapMeta = async function(mapId, currentName, currentEmoji, currentReq) {
    const newName = prompt('Nhập tên bản đồ mới:', currentName);
    if (newName === null) return;
    const newEmoji = prompt('Nhập emoji biểu tượng mới:', currentEmoji);
    if (newEmoji === null) return;
    const newReq = prompt('Nhập cấp độ yêu cầu tối thiểu (Lv):', currentReq);
    if (newReq === null) return;

    try {
      const res = await fetch(`/api/admin/maps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, emoji: newEmoji, req: parseInt(newReq) || 1 })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ Cập nhật thông tin bản đồ thành công!');
        fetchAdminMapsZones();
        if (typeof fetchAccounts === 'function') fetchAccounts();
      } else {
        alert(`❌ Lỗi: ${data.error || 'Cập nhật thất bại'}`);
      }
    } catch(e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    }
  };

  window.triggerAdminMapSync = async function() {
    const btn = document.getElementById('btn-sync-maps-admin');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang quét game code & đồng bộ...';
    }
    try {
      const res = await fetch('/api/admin/sync-maps-zones', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Đồng bộ thành công!\n- Số bản đồ: ${data.maps ? data.maps.length : 0}\n- Lần đồng bộ: ${new Date(data.lastSyncedAt).toLocaleString('vi-VN')}`);
        renderAdminMapsZones(data);
        if (typeof fetchAccounts === 'function') fetchAccounts();
      } else {
        alert(`❌ Đồng bộ thất bại: ${data.error || 'Lỗi không xác định'}`);
      }
    } catch(e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    }
  };

  function renderAdminStats(stats) {
    const elUsersVal = document.getElementById('stat-users-val');
    const elUsersSub = document.getElementById('stat-users-sub');
    const elBotsVal  = document.getElementById('stat-bots-val');
    const elBotsSub  = document.getElementById('stat-bots-sub');
    const elQuotaVal = document.getElementById('stat-quota-val');
    const elQuotaSub = document.getElementById('stat-quota-sub');
    const elProxyVal = document.getElementById('stat-proxy-val');

    if (elUsersVal) elUsersVal.textContent = stats.totalUsers || 0;
    if (elUsersSub) elUsersSub.textContent = `${stats.activeUsers || 0} Hoạt động / ${stats.expiredUsers || 0} Hết hạn`;
    if (elBotsVal)  elBotsVal.textContent  = `${stats.onlineBots || 0} / ${stats.totalBots || 0}`;
    if (elBotsSub)  elBotsSub.textContent  = `🟢 ${stats.onlineBots || 0} Online / 🔴 ${stats.offlineBots || 0} Off`;
    
    if (elQuotaVal) elQuotaVal.textContent = `${stats.totalBots || 0} / ${stats.totalQuota || 0}`;
    const pct = stats.totalQuota > 0 ? Math.round((stats.totalBots / stats.totalQuota) * 100) : 0;
    if (elQuotaSub) elQuotaSub.textContent = `${pct}% Đã sử dụng`;

    if (elProxyVal) elProxyVal.textContent = `${stats.directBots || 0} Direct / ${stats.proxyBots || 0} Proxy`;
  }

  // Admin Fetch Users
  async function fetchAdminUsers() {
    fetchAdminStats();
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) return;
      const users = await response.json();
      renderAdminUsersTable(users);
    } catch (e) {
      console.error('Error fetching admin users:', e);
    }
  }

  function renderAdminUsersTable(users) {
    let html = '';
    users.forEach(u => {
      const isAdmin = u.role === 'admin';
      
      let expiryHtml = '';
      if (isAdmin || !u.expiresAt) {
        expiryHtml = '<span class="badge badge-info" style="font-size:0.75rem;">Vô hạn</span>';
      } else {
        const expDate = new Date(u.expiresAt);
        const isExpired = expDate < new Date();
        const dateStr = expDate.toLocaleDateString('vi-VN');
        const timeStr = expDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const remainingText = formatRemainingTime(u.expiresAt);
        
        if (isExpired) {
          expiryHtml = `<span style="color:#ef4444; font-size:0.75rem; font-weight:700;">⛔ Đã hết hạn (${dateStr} ${timeStr})</span>`;
        } else {
          expiryHtml = `<span style="color:#a78bfa; font-size:0.75rem;">⏳ ${dateStr} ${timeStr} <strong style="color:#fbbf24; margin-left:2px;">(${remainingText})</strong></span>`;
        }
      }

      html += `
        <tr>
          <td style="padding:8px;"><strong>${u.username}</strong></td>
          <td style="padding:8px;"><span class="badge ${isAdmin ? 'badge-info' : 'badge-idle'}">${isAdmin ? 'Admin' : 'User'}</span></td>
          <td style="padding:8px;">
            ${isAdmin ? '<span style="font-size:0.8rem; color:#a5b4fc;">Vô hạn</span>' : `
              <div class="user-quota-stepper">
                <span style="font-size:0.8rem; color:#cbd5e1; margin-right:2px;">${u.botCount} bot (${u.onlineBotCount || 0}🟢) /</span>
                <button type="button" class="btn-quota-step" onclick="stepUserQuota('${u.id}', -1)" title="Giảm 1 bot">-</button>
                <input type="number" class="quota-input-field" id="quota-inp-${u.id}" value="${u.maxAccounts || 1}" min="1" onchange="updateUserQuota('${u.id}', this.value)" onkeydown="if(event.key==='Enter') this.blur()">
                <button type="button" class="btn-quota-step" onclick="stepUserQuota('${u.id}', 1)" title="Tăng 1 bot">+</button>
              </div>
            `}
          </td>
          <td style="padding:8px;">
            ${isAdmin ? '<span style="font-size:0.8rem; color:#a5b4fc;">Vô hạn</span>' : `
              <div class="user-quota-stepper" style="display: flex; align-items: center; justify-content: center;">
                <button type="button" class="btn-quota-step" onclick="stepUserMarketLimit('${u.id}', '${u.username}', -1)" title="Giảm 1 bot" style="width: 20px; height: 20px; min-width: 20px; font-size: 0.8rem; line-height: 1; border-radius: 4px; border: 1px solid rgba(165, 180, 252, 0.3); background: rgba(99, 102, 241, 0.2); color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0;">-</button>
                <input type="number" class="quota-input-field" id="market-limit-inp-${u.id}" value="${u.marketBotLimit !== undefined ? u.marketBotLimit : (u.allowMarket ? u.maxAccounts : 0)}" min="0" onchange="changeUserMarketLimit('${u.id}', '${u.username}', this.value)" style="width: 35px; height: 20px; text-align: center; font-size: 0.8rem; padding: 2px 4px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; color: #fff; margin: 0 4px;">
                <button type="button" class="btn-quota-step" onclick="stepUserMarketLimit('${u.id}', '${u.username}', 1)" title="Tăng 1 bot" style="width: 20px; height: 20px; min-width: 20px; font-size: 0.8rem; line-height: 1; border-radius: 4px; border: 1px solid rgba(165, 180, 252, 0.3); background: rgba(99, 102, 241, 0.2); color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0;">+</button>
              </div>
            `}
          </td>
          <td style="padding:8px; text-align:center;">
            ${isAdmin ? '<span style="font-size:0.8rem; color:#a5b4fc;">Vô hạn</span>' : `
              <select onchange="changeUserPollInterval('${u.id}', '${u.username}', this.value)" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; color: #fff; padding: 2px 4px; font-family: inherit; font-size: 0.8rem; outline: none; text-align: center;">
                <option value="2000" ${u.pollInterval === 2000 ? 'selected' : ''}>2000ms</option>
                <option value="1800" ${u.pollInterval === 1800 ? 'selected' : ''}>1800ms</option>
                <option value="1500" ${u.pollInterval === 1500 ? 'selected' : ''}>1500ms</option>
                <option value="1300" ${u.pollInterval === 1300 ? 'selected' : ''}>1300ms</option>
                <option value="1100" ${u.pollInterval === 1100 ? 'selected' : ''}>1100ms</option>
                <option value="1000" ${u.pollInterval === 1000 ? 'selected' : ''}>1000ms</option>
                <option value="800" ${u.pollInterval === 800 ? 'selected' : ''}>800ms</option>
                <option value="600" ${u.pollInterval === 600 ? 'selected' : ''}>600ms</option>
                <option value="500" ${u.pollInterval === 500 ? 'selected' : ''}>500ms</option>
              </select>
            `}
          </td>
          <td style="padding:8px; text-align:center;">
            ${isAdmin ? '<span style="font-size:0.8rem; color:#a5b4fc;">Cho phép</span>' : `
              <input type="checkbox" onchange="toggleUserPollIntervalPermission('${u.id}', '${u.username}', this.checked)" ${u.allowEditPollInterval ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; margin: 0 auto; display: block;">
            `}
          </td>
          <td style="padding:8px;">${expiryHtml}</td>
          <td style="padding:8px; text-align:right;">
            ${isAdmin ? `<button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(16,185,129,0.2); color:#34d399; border-color:rgba(16,185,129,0.3);" onclick="openEditUserModal('${u.id}', '${u.username}')" title="Đổi mật khẩu Admin">✏️ Đổi MK</button>` : `
              <div style="display:flex; justify-content:flex-end; gap:4px; flex-wrap:wrap;">
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(234,88,12,0.25); color:#fb923c; border-color:rgba(234,88,12,0.4);" onclick="setTestUserExpiry1Min('${u.id}')" title="Set đúng 1 Phút để TEST">1Phút⚡</button>
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(168,85,247,0.2); color:#c084fc; border-color:rgba(168,85,247,0.3);" onclick="extendUserExpiry('${u.id}', 1)" title="Gia hạn thêm 1 Ngày">+1Ngày</button>
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(59,130,246,0.2); color:#60a5fa; border-color:rgba(59,130,246,0.3);" onclick="extendUserExpiry('${u.id}', 30)" title="Gia hạn thêm 30 Ngày">+30Ngày</button>
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(16,185,129,0.2); color:#34d399; border-color:rgba(16,185,129,0.3);" onclick="openEditUserModal('${u.id}', '${u.username}')" title="Chỉnh sửa tài khoản">✏️ Sửa</button>
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(239,68,68,0.2); color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="deleteAdminUser('${u.id}', '${u.username}')">Xóa</button>
              </div>
            `}
          </td>
        </tr>
      `;
    });
    adminUsersTableBody.innerHTML = html;
  }

  // Admin Create User
  adminCreateUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    adminCreateUserError.textContent = '';
    
    const daysVal = document.getElementById('new-user-days') ? document.getElementById('new-user-days').value : '30';

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUserName.value.trim(),
          password: newUserPass.value,
          maxAccounts: parseInt(newUserQuota.value) || 1,
          days: daysVal
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        adminCreateUserForm.reset();
        newUserQuota.value = "1";
        fetchAdminUsers();
      } else {
        adminCreateUserError.textContent = data.error || 'Lỗi tạo người dùng';
      }
    } catch (err) {
      adminCreateUserError.textContent = 'Không thể kết nối đến server';
    }
  });

  // Window global methods for Admin User Table actions
  window.stepUserQuota = async function(userId, delta) {
    const inp = document.getElementById(`quota-inp-${userId}`);
    let current = inp ? parseInt(inp.value) || 1 : 1;
    let next = Math.max(1, current + delta);
    if (inp) inp.value = next;
    await window.updateUserQuota(userId, next);
  };

  window.updateUserQuota = async function(userId, newQuota) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxAccounts: parseInt(newQuota) })
      });
      if (response.ok) {
        fetchAdminUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Không thể cập nhật quota');
      }
    } catch (e) {
      console.error(e);
    }
  };

  window.setTestUserExpiry1Min = async function(userId) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendMinutes: 1 })
      });
      if (response.ok) {
        fetchAdminUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Không thể cài đặt 1 phút');
      }
    } catch (e) {
      console.error(e);
    }
  };

  window.extendUserExpiry = async function(userId, days) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendDays: parseInt(days) || 30 })
      });
      if (response.ok) {
        fetchAdminUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Không thể gia hạn');
      }
    } catch (e) {
      console.error(e);
    }
  };

  window.deleteAdminUser = async function(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"? Toàn bộ tài khoản game của người dùng này cũng sẽ bị xóa.`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAdminUsers();
        fetchAccounts();
      } else {
        const data = await response.json();
        alert(data.error || 'Không thể xóa người dùng');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Edit User modal functions
  window.openEditUserModal = function(userId, username) {
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-user-username').value = username;
    document.getElementById('edit-user-new-password').value = '';
    document.getElementById('edit-user-error').textContent = '';
    document.getElementById('edit-user-modal').classList.add('open');
  };

  window.closeEditUserModal = function() {
    document.getElementById('edit-user-modal').classList.remove('open');
  };

  window.submitEditUser = async function(e) {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id').value;
    const newPassword = document.getElementById('edit-user-new-password').value.trim();
    const errorEl = document.getElementById('edit-user-error');
    errorEl.textContent = '';

    if (!newPassword) {
      errorEl.textContent = 'Vui lòng nhập mật khẩu mới';
      return;
    }
    if (newPassword.length < 4) {
      errorEl.textContent = 'Mật khẩu phải có ít nhất 4 ký tự';
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        closeEditUserModal();
        alert(`✅ Đã đổi mật khẩu thành công cho người dùng "${document.getElementById('edit-user-username').value}"`);
        fetchAdminUsers();
      } else {
        errorEl.textContent = data.error || 'Không thể cập nhật mật khẩu';
      }
    } catch (err) {
      errorEl.textContent = 'Không thể kết nối đến server';
    }
  };

  // Open Add Account modal
  function openModal() {
    addAccountModal.classList.add('open');
    modalError.textContent = '';
    addAccountForm.reset();
    if (addPhpsessidForm) addPhpsessidForm.reset();
    if (phpsessidError) phpsessidError.textContent = '';
  }

  // Close Add Account modal
  function closeModal() {
    addAccountModal.classList.remove('open');
  }

  // Close Edit Account modal
  function closeEditModal() {
    editAccountModal.classList.remove('open');
  }

  btnAddAccount.addEventListener('click', openModal);
  btnAddAccountPlaceholder.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  if (editModalCloseBtn) editModalCloseBtn.addEventListener('click', closeEditModal);
  if (editModalCancelBtn) editModalCancelBtn.addEventListener('click', closeEditModal);

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addAccountModal) closeModal();
    if (e.target === editAccountModal) closeEditModal();
    if (e.target === adminUsersModal) adminUsersModal.classList.remove('open');
  });

  // Add Account form submission
  addAccountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.textContent = '';
    submitSpinner.classList.add('active');
    modalSubmitBtn.disabled = true;

    const rawToken = document.getElementById('acc-token').value.trim();
    let session_token = rawToken;
    if (session_token) {
      const matchParam = session_token.match(/[?&]session_token=([^&\s]+)/i);
      if (matchParam) session_token = matchParam[1];
      else {
        const matchEq = session_token.match(/^session_token=([^&\s]+)/i);
        if (matchEq) session_token = matchEq[1];
      }
      session_token = session_token.replace(/^["']|["']$/g, '').trim();
    }

    const payload = {
      name: document.getElementById('acc-name').value.trim(),
      line_uid: document.getElementById('acc-uid').value.trim(),
      session_token
    };

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        closeModal();
        fetchAccounts();
      } else {
        modalError.textContent = data.error || 'Có lỗi xảy ra khi thêm tài khoản';
      }
    } catch (err) {
      modalError.textContent = 'Không thể kết nối đến server quản lý: ' + err.message;
    } finally {
      submitSpinner.classList.remove('active');
      modalSubmitBtn.disabled = false;
    }
  });

  // Add Account by PHPSESSID submission
  if (addPhpsessidForm) {
    addPhpsessidForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      phpsessidError.textContent = '';
      const submitBtn = addPhpsessidForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Thêm Ngay';
      const cookieInput = inputPhpsessid || document.getElementById('input-phpsessid') || document.getElementById('phpsessid-cookie');
      const nameInput = document.getElementById('phpsessid-name');

      const rawCookie = cookieInput ? cookieInput.value.trim() : '';
      if (!rawCookie) {
        phpsessidError.textContent = 'Vui lòng nhập mã Cookie PHPSESSID';
        return;
      }

      // Tự động bóc tách nếu dán nguyên cụm PHPSESSID=... hoặc chuỗi cookie dài
      const match = rawCookie.match(/PHPSESSID=([^;\s]+)/i);
      const phpsessid = match ? match[1].trim() : rawCookie.replace(/^["']|["']$/g, '').trim();

      if (!phpsessid) {
        phpsessidError.textContent = 'Mã PHPSESSID không hợp lệ';
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner active" style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-width:2px; margin-right:6px;"></span> Đang xác thực...';
      }

      try {
        const response = await fetch('/api/add-by-phpsessid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phpsessid,
            name: nameInput ? nameInput.value.trim() : ''
          })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          if (typeof showToast === 'function') {
            showToast('success', data.updated ? 'Cập nhật PHPSESSID và Token thành công!' : 'Thêm tài khoản qua PHPSESSID thành công!');
          }
          closeModal();
          fetchAccounts();
          addPhpsessidForm.reset();
        } else {
          phpsessidError.textContent = data.error || 'Có lỗi xảy ra khi xác thực PHPSESSID';
        }
      } catch (err) {
        phpsessidError.textContent = 'Không thể kết nối đến máy chủ quản lý: ' + err.message;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // Edit Account form submission
  editAccountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editModalError.textContent = '';
    editSubmitSpinner.classList.add('active');
    editModalSubmitBtn.disabled = true;

    const uid = document.getElementById('edit-acc-uid').value;
    const name = document.getElementById('edit-acc-name').value.trim();
    let token = document.getElementById('edit-acc-token').value.trim();

    if (token) {
      const matchParam = token.match(/[?&]session_token=([^&\s]+)/i);
      if (matchParam) token = matchParam[1];
      else {
        const matchEq = token.match(/^session_token=([^&\s]+)/i);
        if (matchEq) token = matchEq[1];
      }
      token = token.replace(/^["']|["']$/g, '').trim();
    }

    const payload = { name };
    if (token) {
      payload.session_token = token;
    }

    const phpsessidInput = document.getElementById('edit-acc-phpsessid');
    if (phpsessidInput && phpsessidInput.value.trim()) {
      let rawPhp = phpsessidInput.value.trim();
      const match = rawPhp.match(/PHPSESSID=([^;\s]+)/i);
      payload.phpsessid = match ? match[1].trim() : rawPhp.replace(/^["']|["']$/g, '').trim();
    }

    try {
      const response = await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        closeEditModal();
        fetchAccounts();
        if (typeof showToast === 'function') {
          showToast('success', 'Cập nhật tài khoản thành công!');
        }
      } else {
        editModalError.textContent = data.error || 'Có lỗi xảy ra khi cập nhật tài khoản';
      }
    } catch (err) {
      editModalError.textContent = 'Không thể kết nối đến server quản lý: ' + err.message;
    } finally {
      editSubmitSpinner.classList.remove('active');
      editModalSubmitBtn.disabled = false;
    }
  });

  // Fetch all accounts
  async function fetchAccounts() {
    if (!currentUser) return;
    if (isDraggingCard) return;
    try {
      const response = await fetch('/api/accounts');
      if (response.status === 401) {
        checkAuth();
        return;
      }
      
      const expHeader = response.headers.get('X-User-Expires-At');
      if (expHeader !== null && currentUser) {
        currentUser.expiresAt = expHeader || null;
      }
      const quotaHeader = response.headers.get('X-User-Max-Accounts');
      if (quotaHeader !== null && currentUser) {
        currentUser.maxAccounts = parseInt(quotaHeader) || 1;
      }

      if (response.status === 403) {
        updateUserHeaderInfo();
        return;
      }

      const accounts = await response.json();
      if (!Array.isArray(accounts)) {
        return;
      }

      // Update Quota Badge & Header Info
      if (currentUser) {
        updateUserHeaderInfo();
        headerQuotaBadge.textContent = currentUser.role === 'admin' 
          ? `Admin (${accounts.length} Bot)` 
          : `${accounts.length}/${currentUser.maxAccounts || 1} Bot`;
      }

      renderAccounts(accounts);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  }
  window.fetchAccounts = fetchAccounts;

  window.currentTeamFilter = 'all';
  window.setTeamFilter = function(val) {
    window.currentTeamFilter = val;
    const sel = document.getElementById('sel-dashboard-team-filter');
    if (sel && sel.value !== val) sel.value = val;
    if (window.lastFetchedAccounts) {
      window.renderAccounts(window.lastFetchedAccounts);
    }
  };

  // Render accounts list (Grouped by User for Admin)
  function renderAccounts(accounts) {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      noAccountsMsg.style.display = 'block';
      accountsGrid.style.display = 'none';
      const filterBar = document.getElementById('dashboard-filter-bar');
      if (filterBar) filterBar.style.display = 'none';
      return;
    }

    window.lastFetchedAccounts = accounts;

    const filterBar = document.getElementById('dashboard-filter-bar');
    if (filterBar) {
      filterBar.style.display = 'flex';
    }

    let displayAccounts = accounts;
    if (window.currentTeamFilter && window.currentTeamFilter !== 'all') {
      if (window.currentTeamFilter === 'none') {
        displayAccounts = displayAccounts.filter(a => !a.settings || !a.settings.teamId || a.settings.teamId === 'none');
      } else {
        displayAccounts = displayAccounts.filter(a => a.settings && a.settings.teamId === window.currentTeamFilter);
      }
    }

    const countTxt = document.getElementById('filter-count-txt');
    if (countTxt) {
      countTxt.textContent = displayAccounts.length;
    }

    noAccountsMsg.style.display = 'none';

    // Auto fetch proxies list if Admin and list empty
    if (currentUser && currentUser.role === 'admin' && adminProxiesList.length === 0) {
      fetchAdminProxies();
    }

    const targetMode = (currentUser && currentUser.role === 'admin') ? 'admin' : 'user';
    if (accountsGrid.dataset.renderMode && accountsGrid.dataset.renderMode !== targetMode) {
      accountsGrid.innerHTML = '';
    }
    accountsGrid.dataset.renderMode = targetMode;

    if (currentUser && currentUser.role === 'admin') {
      // Group accounts by userId
      accountsGrid.className = 'user-grouped-container';
      accountsGrid.style.display = 'flex';
      accountsGrid.style.flexDirection = 'column';

      const userGroups = {};
      displayAccounts.forEach(acc => {
        const uid = acc.userId || 'default';
        if (!userGroups[uid]) userGroups[uid] = [];
        userGroups[uid].push(acc);
      });

      // Collapsed by default on initial load
      if (!isUserGroupInitialized) {
        isUserGroupInitialized = true;
      }

      Object.entries(userGroups).forEach(([userId, userAccs]) => {
        const sample = userAccs[0];
        const ownerUsername = sample.ownerUsername || 'User';
        const ownerRole = sample.ownerRole || 'user';
        const ownerExpiresAt = sample.ownerExpiresAt;
        const activeCount = userAccs.filter(a => a.status === 'running').length;
        const isExpanded = expandedUserGroups.has(userId);

        let expiryText = 'Vô hạn';
        let isExpired = false;
        if (ownerExpiresAt) {
          const expDate = new Date(ownerExpiresAt);
          if (expDate < new Date()) {
            expiryText = 'Đã hết hạn';
            isExpired = true;
          } else {
            const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
            expiryText = `Còn ${diffDays} ngày`;
          }
        }

        let groupCard = document.getElementById(`user-group-card-${userId}`);
        if (!groupCard) {
          groupCard = document.createElement('div');
          groupCard.id = `user-group-card-${userId}`;
          groupCard.className = `user-group-card ${isExpanded ? 'expanded' : ''}`;

          groupCard.innerHTML = `
            <div class="user-group-header" onclick="toggleUserGroup('${userId}', event)">
              <div class="user-group-info">
                <div class="user-avatar-badge">${ownerRole === 'admin' ? '👑' : '👤'}</div>
                <div class="user-title-wrap">
                  <div class="user-name-row">
                    <span class="user-group-username">${ownerUsername}</span>
                    <span class="badge-role ${ownerRole}">${ownerRole}</span>
                  </div>
                  <div class="user-group-meta">
                    <span class="user-bot-count-badge" id="user-bot-count-${userId}">⚡ ${activeCount}/${userAccs.length} Bot đang chạy</span>
                    <span class="user-expiry-badge ${isExpired ? 'expired' : ''}" id="user-expiry-${userId}">⏱️ Hạn dùng: ${expiryText}</span>
                  </div>
                </div>
              </div>
              <div class="user-group-actions" onclick="event.stopPropagation()">
                <div class="user-market-limit-box" style="margin-right: 15px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; padding: 3px 8px;">
                  <span style="font-size: 0.72rem; color: #a5b4fc; white-space: nowrap; font-weight: bold;">🏪 Giới hạn Chợ:</span>
                  <button type="button" onclick="stepUserMarketLimit('${userId}', '${ownerUsername}', -1)" title="Giảm 1 bot" style="width: 18px; height: 18px; font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer; border-radius: 3px; padding: 0;">-</button>
                  <input type="number" id="user-market-limit-${userId}" value="${sample.ownerMarketLimit !== undefined ? sample.ownerMarketLimit : 0}" min="0" 
                    onchange="changeUserMarketLimit('${userId}', '${ownerUsername}', this.value)" 
                    style="width: 25px; background: transparent; border: none; color: #fff; font-size: 0.8rem; text-align: center; outline: none; font-weight: bold; font-family: monospace; margin: 0 2px;">
                  <button type="button" onclick="stepUserMarketLimit('${userId}', '${ownerUsername}', 1)" title="Tăng 1 bot" style="width: 18px; height: 18px; font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; cursor: pointer; border-radius: 3px; padding: 0;">+</button>
                </div>
                <div class="user-batch-proxy-box">
                  <span class="user-batch-proxy-label">🌐 Đổi Proxy Hàng Loạt:</span>
                  <select class="user-batch-proxy-select" id="user-batch-proxy-${userId}" onchange="changeUserBatchProxy('${userId}', '${ownerUsername}', this.value)">
                    <option value="direct">🌐 Direct Connection</option>
                    <option value="auto">🔄 Auto Rotation Pool</option>
                    ${adminProxiesList.map(p => `<option value="${p.id}">${p.label}${!p.active ? ' (Off)' : ''}</option>`).join('')}
                  </select>
                </div>
                <span class="user-chevron">▼</span>
              </div>
            </div>
            <div class="user-bot-grid" id="user-bot-grid-${userId}"></div>
          `;
          accountsGrid.appendChild(groupCard);
        } else {
          if (isExpanded && !groupCard.classList.contains('expanded')) groupCard.classList.add('expanded');
          if (!isExpanded && groupCard.classList.contains('expanded')) groupCard.classList.remove('expanded');

          const botCountEl = document.getElementById(`user-bot-count-${userId}`);
          if (botCountEl) {
            botCountEl.textContent = `⚡ ${activeCount}/${userAccs.length} Bot đang chạy`;
          }

          const expiryEl = document.getElementById(`user-expiry-${userId}`);
          if (expiryEl) {
            expiryEl.className = `user-expiry-badge ${isExpired ? 'expired' : ''}`;
            expiryEl.textContent = `⏱️ Hạn dùng: ${expiryText}`;
          }

          const limitInp = document.getElementById(`user-market-limit-${userId}`);
          if (limitInp && document.activeElement !== limitInp) {
            limitInp.value = sample.ownerMarketLimit !== undefined ? sample.ownerMarketLimit : 0;
          }

          const batchSel = document.getElementById(`user-batch-proxy-${userId}`);
          if (batchSel) {
            const expectedCount = 2 + adminProxiesList.length;
            if (batchSel.options.length !== expectedCount) {
              const currentVal = batchSel.value;
              batchSel.innerHTML = `
                <option value="direct">🌐 Direct Connection</option>
                <option value="auto">🔄 Auto Rotation Pool</option>
                ${adminProxiesList.map(p => `<option value="${p.id}">${p.label}${!p.active ? ' (Off)' : ''}</option>`).join('')}
              `;
              if (currentVal) batchSel.value = currentVal;
            }
          }
        }

        // Render bot cards inside user-bot-grid ONLY when expanded for maximum performance
        const botGrid = groupCard.querySelector(`#user-bot-grid-${userId}`);
        if (isExpanded) {
          userAccs.forEach(acc => {
            if (activeTabs[acc.line_uid] === undefined) {
              activeTabs[acc.line_uid] = null;
            }
            let card = document.getElementById(`card-${acc.line_uid}`);
            if (!card) {
              card = document.createElement('div');
              card.id = `card-${acc.line_uid}`;
              card.className = `account-card ${acc.status}`;
              botGrid.appendChild(card);
              buildCardSkeleton(card, acc);
            } else if (card.parentElement !== botGrid) {
              botGrid.appendChild(card);
            }
            updateCard(acc);
          });
          if (!botGrid.dataset.dragInit) {
            initDragAndDrop(botGrid);
            botGrid.dataset.dragInit = "true";
          }
        }

        // Clean up deleted bot cards within this user group
        const botCards = botGrid.querySelectorAll('.account-card');
        botCards.forEach(cardEl => {
          const uid = cardEl.id.replace('card-', '');
          if (!userAccs.some(a => a.line_uid === uid)) {
            cardEl.remove();
            delete activeTabs[uid];
          }
        });
      });

      // Remove deleted user group cards
      const groupCards = accountsGrid.querySelectorAll('.user-group-card');
      groupCards.forEach(gCard => {
        const uid = gCard.id.replace('user-group-card-', '');
        if (!userGroups[uid]) {
          gCard.remove();
        }
      });

    } else {
      // Normal User View Mode (Grid layout)
      accountsGrid.className = '';
      accountsGrid.style.display = 'grid';
      accountsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(360px, 1fr))';
      accountsGrid.style.flexDirection = '';

      displayAccounts.forEach(acc => {
        if (activeTabs[acc.line_uid] === undefined) {
          activeTabs[acc.line_uid] = null;
        }
        let card = document.getElementById(`card-${acc.line_uid}`);
        if (!card) {
          card = document.createElement('div');
          card.id = `card-${acc.line_uid}`;
          card.className = `account-card ${acc.status}`;
          accountsGrid.appendChild(card);
          buildCardSkeleton(card, acc);
        } else if (card.parentElement !== accountsGrid) {
          accountsGrid.appendChild(card);
        }
        updateCard(acc);
      });
      if (!accountsGrid.dataset.dragInit) {
        initDragAndDrop(accountsGrid);
        accountsGrid.dataset.dragInit = "true";
      }

      // Remove deleted cards or cards filtered out
      const cardElements = accountsGrid.querySelectorAll('.account-card');
      cardElements.forEach(cardEl => {
        const uid = cardEl.id.replace('card-', '');
        if (!displayAccounts.some(acc => acc.line_uid === uid)) {
          cardEl.remove();
          delete activeTabs[uid];
        }
      });
    }
  }
  window.renderAccounts = renderAccounts;

  // Build the skeleton structure for the card
  function buildCardSkeleton(cardEl, acc) {
    cardEl.innerHTML = `
      <div class="card-header">
        <div class="acc-info-compact">
          <span class="drag-handle" title="Kéo thả để sắp xếp">☰</span>
          <span id="team-badge-${acc.line_uid}"></span>
          <span class="acc-name" id="name-${acc.line_uid}">${acc.name}</span>
          <span class="acc-lv" id="lv-txt-${acc.line_uid}">Lv.--</span>
          <span class="badge badge-${acc.status}" id="status-badge-${acc.line_uid}">${acc.status}</span>
          <span id="ping-badge-${acc.line_uid}" style="display: none;"></span>
          <span id="proxy-badge-${acc.line_uid}" style="font-size:0.7rem; padding:1px 5px; border-radius:4px; background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3); white-space:nowrap; display: none;">🌐 —</span>
        </div>
        <div class="header-actions-compact">
          <button class="btn-mini-action btn-battle" onclick="openBattleLink('${acc.line_uid}', '${acc.session_token}')" style="background:#7c3aed; border-color:#a855f7;" title="Mở Giao Diện Săn Boss & PK Chuyên Nghiệp">⚡ PK</button>
          <button class="btn-mini-action btn-play" onclick="openGameLink('${acc.line_uid}', '${acc.session_token}')" title="Mở trực tiếp Client Game">🎮 Play</button>
          <button class="btn-mini-action" onclick="openEditTokenModal('${acc.line_uid}')" title="Sửa Token">✏️</button>
          <button class="btn-mini-action btn-del" onclick="deleteAccount('${acc.line_uid}')" title="Xóa Tài Khoản">🗑️</button>
        </div>
      </div>

      <div class="card-vitals-grid">
        <div class="vital-row-compact">
          <div class="vital-label-wrap">
            <span class="vital-title">❤️ HP</span>
            <span class="vital-num" id="hp-txt-${acc.line_uid}">--/--</span>
          </div>
          <div class="bar-container-slim">
            <div class="bar-fill bar-hp" id="hp-bar-${acc.line_uid}" style="width: 0%"></div>
          </div>
        </div>
        <div class="vital-row-compact">
          <div class="vital-label-wrap">
            <span class="vital-title">💧 MP</span>
            <span class="vital-num" id="mp-txt-${acc.line_uid}">--/--</span>
          </div>
          <div class="bar-container-slim">
            <div class="bar-fill bar-mp" id="mp-bar-${acc.line_uid}" style="width: 0%"></div>
          </div>
        </div>
        <div class="vital-row-compact">
          <div class="vital-label-wrap">
            <span class="vital-title">🛡️ Giáp</span>
            <span class="vital-num" id="armor-txt-${acc.line_uid}">--/--</span>
          </div>
          <div class="bar-container-slim">
            <div class="bar-fill bar-armor" id="armor-bar-${acc.line_uid}" style="width: 0%"></div>
          </div>
        </div>
        <div class="vital-row-compact">
          <div class="vital-label-wrap">
            <span class="vital-title">⭐ EXP</span>
            <span class="vital-num" id="exp-txt-${acc.line_uid}">0%</span>
          </div>
          <div class="bar-container-slim">
            <div class="bar-fill bar-exp" id="exp-bar-${acc.line_uid}" style="width: 0%"></div>
          </div>
        </div>
      </div>

      <div class="event-banner" id="event-banner-${acc.line_uid}" style="display: none; padding: 6px 10px; margin-bottom: 8px; border-radius: 8px; font-size: 0.75rem; line-height: 1.35; text-align: center; font-weight: bold; cursor: pointer;"></div>
      <div class="boss-hunt-banner" id="boss-hunt-banner-${acc.line_uid}" style="display: none; padding: 6px 10px; margin-bottom: 8px; border-radius: 8px; font-size: 0.75rem; line-height: 1.35;"></div>
      <div id="trade-invite-banner-${acc.line_uid}" style="display: none; background: linear-gradient(90deg, rgba(16,185,129,0.2), rgba(56,189,248,0.2)); border: 1.5px solid #10b981; border-radius: 8px; padding: 6px 10px; margin-bottom: 8px; align-items: center; justify-content: space-between;">
        <div style="font-size: 0.78rem; font-weight: 800; color: #4ade80; display: flex; align-items: center; gap: 4px;">
          <span>🤝 Lời mời giao dịch từ:</span>
          <span id="trade-invite-from-${acc.line_uid}" style="color: #fff; font-weight: bold;">--</span>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="btn btn-primary" onclick="acceptTradeInvite('${acc.line_uid}', window._currentTradeTid?.['${acc.line_uid}'] || '')" style="padding: 2px 8px; font-size: 0.72rem; background: #16a34a; border-color: #22c55e; font-weight: 700;">Chấp Nhận</button>
          <button class="btn btn-secondary" onclick="declineTradeInvite('${acc.line_uid}', window._currentTradeTid?.['${acc.line_uid}'] || '')" style="padding: 2px 8px; font-size: 0.72rem; color: #f87171; border-color: rgba(248,113,113,0.3); font-weight: 700;">Từ Chối</button>
        </div>
      </div>

      <div class="combat-rates-strip" onclick="toggleRateUnit('${acc.line_uid}')" style="cursor: pointer;" title="Click để chuyển đổi thống kê Phút (/m) ➔ Giờ (/h) ➔ Ngày (/d)">
        <span class="stat-pill" id="rate-pill-kills-${acc.line_uid}">⚔️ <strong id="rate-kills-${acc.line_uid}">0/m</strong></span>
        <span class="stat-pill" id="rate-pill-gold-${acc.line_uid}">💰 <strong id="rate-gold-${acc.line_uid}">+0/m</strong></span>
        <span class="stat-pill" id="rate-pill-exp-${acc.line_uid}">⭐ <strong id="rate-exp-${acc.line_uid}">+0/m</strong></span>
      </div>

      <div class="resources-strip">
        <span class="stat-pill" title="Vàng (Gold)">💰 <strong id="res-gold-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Gỗ (Wood)">🪵 <strong id="res-wood-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Đá (Stone)">🪨 <strong id="res-stone-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Sắt (Iron)">⚙️ <strong id="res-iron-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Đồng (Copper)">🟫 <strong id="res-copper-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Thảo dược (Herb)">🌿 <strong id="res-herb-${acc.line_uid}">--</strong></span>
      </div>

      <div class="poll-interval-outer-container" style="margin-bottom: 8px; padding: 0 4px;">
        ${(currentUser && (currentUser.role === 'admin' || currentUser.allowEditPollInterval === true)) ? `
        <div class="poll-interval-outer-strip" style="padding: 5px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 0.78rem; color: #d1d5db; font-weight: 500; display: flex; align-items: center; gap: 4px;">⚡ Nhịp Polling:</span>
          <select id="sel-poll-interval-${acc.line_uid}" onchange="updateNumericSetting('${acc.line_uid}', 'pollInterval')" style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); border-radius: 5px; color: #fff; padding: 2px 6px; font-family: inherit; font-size: 0.78rem; outline: none; max-width: 170px; width: 100%;">
            <option value="2000">2000ms (Mặc định)</option>
            <option value="1800">1800ms</option>
            <option value="1500">1500ms</option>
            <option value="1300">1300ms</option>
            <option value="1100">1100ms (Khuyên dùng)</option>
            <option value="1000">1000ms (Nhanh)</option>
            <option value="800">800ms (Rất nhanh)</option>
            <option value="600">600ms (Siêu nhanh - 1 Proxy)</option>
            <option value="500">500ms (Tối đa tốc độ - 1 Proxy)</option>
          </select>
        </div>
        ${(currentUser && currentUser.role === 'admin') ? `
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px; padding: 0 4px;">
          <label class="switch" style="width: 32px; height: 18px; margin: 0;">
            <input type="checkbox" onchange="toggleUserPollIntervalPermission('${acc.userId}', '${acc.ownerUsername}', this.checked)" ${acc.ownerAllowEditPollInterval ? 'checked' : ''} style="cursor: pointer;">
            <span class="slider" style="border-radius: 18px;"></span>
          </label>
          <span style="font-size: 0.75rem; color: #a3a3a3;">Cấp quyền tự chỉnh Nhịp Polling cho User này</span>
        </div>
        ` : ''}
        ` : `
        <div class="poll-interval-outer-strip" style="padding: 5px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 0.78rem; color: #a3a3a3; display: flex; align-items: center; gap: 4px;">⚡ Nhịp Polling:</span>
          <span style="font-size: 0.78rem; color: #e2e8f0; font-weight: bold;">${acc.settings.pollInterval || acc.ownerPollInterval || 2000}ms <span style="font-weight: normal; font-size: 0.7rem; color: #858585;">(Theo Admin)</span></span>
        </div>
        `}
      </div>

      <div class="card-tabs-nav">
        <button class="tab-link" id="tab-btn-core-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'core')">Cơ Bản</button>
        <button class="tab-link" id="tab-btn-weapon-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'weapon')">⚔️ Vũ Khí</button>
        <button class="tab-link" id="tab-btn-home-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'home')">🏡 Nông Trại</button>
        <button class="tab-link" id="tab-btn-mvp-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'mvp')">Săn Boss</button>
        <button class="tab-link" id="tab-btn-event-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'event')">🏆 Event</button>
        <button class="tab-link" id="tab-btn-skills-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'skills')">👤 Nhân Vật</button>
        <button class="tab-link" id="tab-btn-market-buy-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'market-buy')">🏪 Chợ</button>
        <button class="tab-link" id="tab-btn-log-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'log')">Log</button>
      </div>

      <div class="card-tab-content">
        <!-- Weapon Tab Pane (100% In-Game Presentation) -->
        <div class="tab-pane" id="pane-weapon-${acc.line_uid}">
          <!-- Hero Section: Active Weapon Switcher & Main Combat Stats -->
          <div class="weapon-hero-card" id="weapon-hero-${acc.line_uid}">
            <!-- Populated dynamically by renderWeaponTab(acc) -->
          </div>

          <!-- Sub-tabs Navigation for all Weapons + Module Inventory -->
          <div class="weapon-nav-tabs" id="weapon-subnav-${acc.line_uid}">
            <button class="weapon-nav-btn active" id="wpn-btn-pistol-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'pistol')">🔪 Dao Găm</button>
            <button class="weapon-nav-btn" id="wpn-btn-sniper-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'sniper')">🎯 Dao Dài</button>
            <button class="weapon-nav-btn" id="wpn-btn-knife-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'knife')">🗡️ Kiếm</button>
            <button class="weapon-nav-btn" id="wpn-btn-axe-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'axe')">🪓 Rìu</button>
            <button class="weapon-nav-btn" id="wpn-btn-turret-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'turret')">🗼 Pháo Tháp</button>
            <button class="weapon-nav-btn" id="wpn-btn-armor-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'armor')">🛡️ Khiên Giáp</button>
            <button class="weapon-nav-btn" id="wpn-btn-robot-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'robot')">🔋 Titan</button>
            <button class="weapon-nav-btn" id="wpn-btn-house-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'house')">🛸 Phi Thuyền</button>
            <button class="weapon-nav-btn" id="wpn-btn-inv-${acc.line_uid}" onclick="switchWeaponSubTab('${acc.line_uid}', 'inv')">📦 Kho Module (30)</button>
          </div>

          <!-- Sub-panes for each Weapon / Armor -->
          <div id="wpn-pane-detail-${acc.line_uid}">
            <!-- Populated dynamically by renderWeaponTab(acc) -->
          </div>
        </div>

        <!-- Event Tab Pane -->
        <div class="tab-pane" id="pane-event-${acc.line_uid}">
          <!-- Navigation Tiểu tab -->
          <div class="subtabs-nav" style="display: flex; gap: 6px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;">
            <button class="subtab-btn active" id="event-subtab-btn-cfg-${acc.line_uid}" onclick="switchEventSubTab('${acc.line_uid}', 'cfg')">⚙️ Cấu Hình & Lịch</button>
            <button class="subtab-btn" id="event-subtab-btn-history-${acc.line_uid}" onclick="switchEventSubTab('${acc.line_uid}', 'history')">📜 Lịch Sử Chiến Trận</button>
          </div>

          <!-- Tiểu tab 1: Cấu hình & Lịch -->
          <div class="event-subpane" id="event-subpane-cfg-${acc.line_uid}">
            <div class="settings-group">
              <div class="toggle-control" style="grid-column: span 2; margin-bottom: 6px; flex-direction: column; align-items: stretch; gap: 8px;">
                <span class="toggle-label" style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; display: block; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">🏆 Tự Động Tham Gia Sự Kiện</span>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <span class="toggle-label" style="font-size: 0.82rem; color: #d1d5db;">👾 Event Invasion (Quái xâm lăng - Map 2)</span>
                  <label class="switch">
                    <input type="checkbox" id="chk-auto-event-join-inv-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoEventJoinInv')">
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <span class="toggle-label" style="font-size: 0.82rem; color: #d1d5db;">⚔️ Event Bang Chiến (Guild War - Map 4)</span>
                  <label class="switch">
                    <input type="checkbox" id="chk-auto-event-join-gw-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoEventJoinGw')">
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <span class="toggle-label" style="font-size: 0.82rem; color: #d1d5db;">👑 Event Quốc Chiến (Country War - Map 4)</span>
                  <label class="switch">
                    <input type="checkbox" id="chk-auto-event-join-cw-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoEventJoinCw')">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="input-control" style="grid-column: span 2; margin-bottom: 6px;">
                <label for="sel-event-potion-threshold-${acc.line_uid}">💊 HP Bơm Máu Trong Event</label>
                <select id="sel-event-potion-threshold-${acc.line_uid}" onchange="updateNumericSetting('${acc.line_uid}', 'eventPotionThreshold')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px; width: 100%;">
                  <option value="0">❌ Tắt tự động bơm máu</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="40">40%</option>
                  <option value="50">50%</option>
                  <option value="60">60%</option>
                  <option value="70">70%</option>
                  <option value="80">80%</option>
                  <option value="90">90%</option>
                </select>
              </div>

              <div class="toggle-control" style="grid-column: span 2; margin-bottom: 6px;">
                <span class="toggle-label">⚔️ PK Ưu Tiên Giáp Thấp Nhất</span>
                <label class="switch">
                  <input type="checkbox" id="chk-event-target-mindef-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'eventTargetMinDef')">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="input-control" style="grid-column: span 2; margin-bottom: 6px;">
                <label for="sel-event-attack-range-${acc.line_uid}">🔍 Phạm Vi Quét Mục Tiêu PK</label>
                <select id="sel-event-attack-range-${acc.line_uid}" onchange="updateNumericSetting('${acc.line_uid}', 'eventAttackRange')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px; width: 100%;">
                  <option value="100">100m</option>
                  <option value="200">200m</option>
                  <option value="300">300m (Khuyến nghị)</option>
                  <option value="500">500m</option>
                  <option value="9999">Toàn bản đồ</option>
                </select>
              </div>
            </div>

            <div style="margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;">
              <div style="font-size: 0.78rem; font-weight: 700; color: #fbbf24; margin-bottom: 6px;">📅 Lịch Trình Sự Kiện Hàng Ngày</div>
              <div style="font-size: 0.72rem; color: #94a3b8; display: flex; flex-direction: column; gap: 4px; line-height: 1.45;">
                <div>🌳 <b>19:30</b> - Bảo vệ Cây Thế Giới (Map 2)</div>
                <div>🚩 <b>20:30</b> - Bang Chiến / Guild Flag War (Map 4)</div>
                <div>🌍 <b>21:30</b> - Quốc Chiến / Country Flag War (Map 4)</div>
              </div>
            </div>
          </div>

          <!-- Tiểu tab 2: Lịch sử chiến đấu -->
          <div class="event-subpane" id="event-subpane-history-${acc.line_uid}" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.75rem; color: #94a3b8;">Lịch sử chiến trận (phiên hiện tại):</span>
              <div style="display: flex; gap: 4px;">
                <button class="btn-action-sm" onclick="fetchEventWarHistory('${acc.line_uid}')" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid var(--border-color); border-radius: 4px; background: transparent; color: #fff; cursor: pointer;">🔄 Cập nhật</button>
                <button class="btn-action-sm" onclick="clearEventWarHistory('${acc.line_uid}')" style="font-size: 0.7rem; padding: 2px 6px; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; cursor: pointer;">🗑️ Xóa</button>
              </div>
            </div>
            
            <!-- Panel thống kê mạng -->
            <div id="event-war-stats-${acc.line_uid}" style="margin-bottom: 8px;"></div>
            
            <!-- Tabs lọc mạng -->
            <div id="event-war-filters-${acc.line_uid}" style="display: flex; gap: 4px; margin-bottom: 8px;">
              <button class="btn-tab-sm war-tab-${acc.line_uid} active" onclick="switchWarHistoryTab('${acc.line_uid}', 'all')" style="font-size: 0.68rem; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; font-weight: 700;">Tất cả</button>
              <button class="btn-tab-sm war-tab-${acc.line_uid}" onclick="switchWarHistoryTab('${acc.line_uid}', 'kills')" style="font-size: 0.68rem; padding: 2px 8px; border-radius: 4px; border: 1px solid transparent; background: transparent; color: #94a3b8; cursor: pointer;">🗡️ Hạ gục</button>
              <button class="btn-tab-sm war-tab-${acc.line_uid}" onclick="switchWarHistoryTab('${acc.line_uid}', 'deaths')" style="font-size: 0.68rem; padding: 2px 8px; border-radius: 4px; border: 1px solid transparent; background: transparent; color: #94a3b8; cursor: pointer;">💀 Bị hạ</button>
            </div>
            
            <div id="event-history-list-${acc.line_uid}" style="max-height: 250px; overflow-y: auto; font-size: 0.72rem; border: 1px solid var(--border-color); border-radius: 8px; background: rgba(0,0,0,0.25); padding: 6px;">
              <div style="text-align: center; color: #64748b; padding: 20px 0;">Không có dữ liệu lịch sử.</div>
            </div>
          </div>
        </div>

        <!-- Home Farm Tab Pane -->
        <div class="tab-pane" id="pane-home-${acc.line_uid}">
          <div class="home-overview-card" style="background: rgba(22, 101, 52, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 12px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span style="font-size: 1rem; font-weight: 800; color: #4ade80;">🏡 Nhà Lv.<b id="home-lv-${acc.line_uid}">1</b></span>
                <span style="font-size: 0.75rem; color: #9ca3af; margin-left: 6px;">(Mở <b id="home-plots-${acc.line_uid}">1</b>/6 plots)</span>
              </div>
              <button class="btn-action-sm" onclick="triggerHomeUpgrade('${acc.line_uid}')" style="background: #16a34a; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">⬆️ Nâng nhà</button>
            </div>
            <div style="display: flex; gap: 8px; font-size: 0.8rem; color: #e2e8f0; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 8px; justify-content: space-between; align-items: center;">
              <span>🌱 Đất: <b id="home-used-${acc.line_uid}">0</b>/<span id="home-total-${acc.line_uid}">16</span> ô</span>
              <span>🌾 Cây chín: <b id="home-ripe-${acc.line_uid}" style="color: #f59e0b;">0</b></span>
              <button class="btn-action-sm" id="btn-home-harvest-${acc.line_uid}" onclick="triggerHomeHarvest('${acc.line_uid}')" style="background: #b45309; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; cursor: pointer;">🌾 Thu hoạch & Bán</button>
            </div>
            <div id="home-next-ripe-${acc.line_uid}" style="font-size: 0.73rem; color: #94a3b8; margin-top: 6px; text-align: right;"></div>
          </div>

          <div class="settings-group" style="margin-bottom: 8px;">
            <div class="toggle-control">
              <span class="toggle-label">🌾 Auto Harvest (Tự thu hoạch & bán)</span>
              <label class="switch">
                <input type="checkbox" id="chk-autohomeharvest-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoHomeHarvest')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-control">
              <span class="toggle-label">🌱 Auto Plant (Tự động trồng)</span>
              <label class="switch">
                <input type="checkbox" id="chk-autohomeplant-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoHomePlant')">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-group" style="margin-bottom: 10px;">
            <div class="input-control" style="grid-column: span 2;">
              <label for="sel-home-priority-${acc.line_uid}">🎯 Ưu tiên hạt giống trồng tự động</label>
              <select id="sel-home-priority-${acc.line_uid}" onchange="updateStringSetting('${acc.line_uid}', 'homePlantPriority')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
                <option value="highest_tier">🥇 Hạt Tier cao nhất (T6 ➔ T1)</option>
                <option value="gold_first">⭐ Ưu tiên Hạt Vàng (Gold) trước</option>
                <option value="lowest_tier">🌱 Hạt Tier thấp nhất (T1 ➔ T6)</option>
              </select>
            </div>
            <div class="toggle-control" style="margin-top: 4px;">
              <span class="toggle-label">⬆️ Auto Upgrade Nhà</span>
              <label class="switch">
                <input type="checkbox" id="chk-autohomeup-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoHomeUpgrade')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-control" style="margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
              <span class="toggle-label" style="color: #fb923c;">⚡ Bypass Warp (Farm không cần vào map nhà)</span>
              <label class="switch">
                <input type="checkbox" id="chk-bypasshomewarp-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'bypassHomeWarp')">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div style="font-size: 0.8rem; font-weight: 700; color: #4ade80; margin-bottom: 6px;">🌱 Danh Sách Hạt Giống Trong Kho</div>
          <div id="home-seeds-list-${acc.line_uid}" style="max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 8px; margin-bottom: 10px;">
            <div style="font-size: 0.78rem; color: #94a3b8; text-align: center; padding: 8px 0;">Đang cập nhật kho hạt...</div>
          </div>

          <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">🌾 Danh Sách Luống Đất Đang Trồng</div>
          <div id="home-crops-list-${acc.line_uid}" style="max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 8px;">
            <div style="font-size: 0.78rem; color: #94a3b8; text-align: center; padding: 8px 0;">Tất cả luống đất đang trống</div>
          </div>
        </div>

        <div class="tab-pane" id="pane-core-${acc.line_uid}">
          <div class="settings-group" style="display: none; border: 1px solid rgba(165,180,252,0.15); background: rgba(165,180,252,0.02); border-radius: 12px; padding: 10px 12px; margin-bottom: 10px;">
            <div class="toggle-control">
              <span class="toggle-label" style="font-weight: 700; color: #a5b4fc;">🚀 Chạy treo máy (Bot)</span>
              <label class="switch">
                <input type="checkbox" id="chk-bot-loop-${acc.line_uid}" onchange="toggleBotLoop('${acc.line_uid}')">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-group">
            <div class="toggle-control">
              <span class="toggle-label">🤖 Auto Combat (bot)</span>
              <label class="switch">
                <input type="checkbox" id="chk-bot-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'bot')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-control">
              <span class="toggle-label">📍 Lock Position</span>
              <label class="switch">
                <input type="checkbox" id="chk-lock_pos-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'lock_pos')">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-group">
            <div class="input-control" style="grid-column: span 2;">
              <label for="sel-auto-potion-threshold-${acc.line_uid}">🍷 Bơm Potion khi HP &lt; (%)</label>
              <select id="sel-auto-potion-threshold-${acc.line_uid}" onchange="updateNumericSetting('${acc.line_uid}', 'auto_potion_threshold')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 4px 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
                <option value="30">30% HP</option>
                <option value="40">40% HP</option>
                <option value="50">50% HP (Mặc định)</option>
                <option value="60">60% HP</option>
                <option value="70">70% HP</option>
                <option value="80">80% HP</option>
                <option value="90">90% HP</option>
              </select>
            </div>

            <div class="toggle-control" style="grid-column: span 2; margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
              <span class="toggle-label" title="Chủ động gửi request bơm máu khẩn cấp tại mỗi nhịp request thay vì đợi server tự động hồi">💊 Chủ động bơm máu khẩn cấp (Nhịp request)</span>
              <label class="switch">
                <input type="checkbox" id="chk-active-heal-enabled-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'activeHealEnabled')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="input-control" style="grid-column: span 2; margin-bottom: 4px;">
              <label for="sel-active-heal-threshold-${acc.line_uid}">Ngưỡng HP Khẩn Cấp (%)</label>
              <select id="sel-active-heal-threshold-${acc.line_uid}" onchange="updateNumericSetting('${acc.line_uid}', 'activeHealThreshold')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 4px 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px; width: 100%;">
                <option value="30">30% HP</option>
                <option value="40">40% HP</option>
                <option value="50">50% HP (Mặc định)</option>
                <option value="60">60% HP</option>
                <option value="70">70% HP</option>
                <option value="80">80% HP</option>
                <option value="90">90% HP</option>
              </select>
            </div>
          </div>



          <div class="settings-group">
            <div class="toggle-control">
              <span class="toggle-label">🗺️ Auto Warp Map</span>
              <label class="switch">
                <input type="checkbox" id="chk-automap-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoMap')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="input-control">
              <label for="sel-map-${acc.line_uid}">Bản đồ di chuyển</label>
              <select id="sel-map-${acc.line_uid}" onchange="changeTargetMap('${acc.line_uid}', this.value)" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 4px 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
                <option value="1">🌿 Thung lũng Trung tâm (Lv.1+)</option>
                <option value="2">🏜️ Sa mạc Vĩnh hằng (Lv.25+)</option>
                <option value="3">❄️ Vùng đất Băng giá (Lv.40+)</option>
                <option value="4">⚔️ Đấu trường Arena (Lv.20+)</option>
                <option value="5">🏛️ Tàn tích Cổ đại (Lv.55+)</option>
                <option value="6">🌋 Núi lửa Sôi trào (Lv.70+)</option>
              </select>
            </div>
          </div>

          <div class="settings-group">
            <div class="toggle-control">
              <span class="toggle-label">📍 Auto Farm Zone</span>
              <label class="switch">
                <input type="checkbox" id="chk-autozone-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoZone')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-control">
              <span class="toggle-label" title="Nhân vật tự đi tới tâm zone, sau đó tự bật Lock Position và chỉ đứng yên farm tại chỗ. Khi chết quay lại cũng sẽ làm tương tự.">🔒 Lock tâm zone</span>
              <label class="switch">
                <input type="checkbox" id="chk-lock_zone_center-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'lock_zone_center')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="input-control">
              <label for="sel-zone-${acc.line_uid}">Khu vực farm (Zone)</label>
              <select id="sel-zone-${acc.line_uid}" onchange="changeTargetZone('${acc.line_uid}', this.value)" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 4px 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
                <option value="">🗺️ Chọn khu vực (Zone)...</option>
              </select>
            </div>
          </div>

          <div class="settings-group" style="border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px; margin-top: 10px;">
            <div class="input-control">
              <label for="sel-team-role-${acc.line_uid}">👥 Vai trò nhóm (Team Role)</label>
              <select id="sel-team-role-${acc.line_uid}" onchange="updateStringSetting('${acc.line_uid}', 'teamRole')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 5px 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top: 2px; width: 100%;">
                <option value="none">🚫 Không tham gia (None)</option>
                <option value="leader">👑 Trưởng nhóm (Leader)</option>
                <option value="member">👥 Thành viên (Member)</option>
              </select>
            </div>
            <div class="input-control">
              <label for="sel-team-id-${acc.line_uid}">🛡️ Đội nhóm (Team ID)</label>
              <select id="sel-team-id-${acc.line_uid}" onchange="updateStringSetting('${acc.line_uid}', 'teamId')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 5px 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top: 2px; width: 100%;">
                <option value="none">🚫 Không có (None)</option>
                <option value="team_1">🛡️ Team 1</option>
                <option value="team_2">🛡️ Team 2</option>
                <option value="team_3">🛡️ Team 3</option>
                <option value="team_4">🛡️ Team 4</option>
                <option value="team_5">🛡️ Team 5</option>
                <option value="team_6">🛡️ Team 6</option>
                <option value="team_7">🛡️ Team 7</option>
                <option value="team_8">🛡️ Team 8</option>
                <option value="team_9">🛡️ Team 9</option>
                <option value="team_10">🛡️ Team 10</option>
              </select>
            </div>
            <div style="grid-column: span 2; margin-top: 4px; display: flex; justify-content: flex-end;">
              <button type="button" id="btn-sync-team-${acc.line_uid}" onclick="syncTeamSetup('${acc.line_uid}')" style="display: none; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); color: #34d399; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; font-weight: 600; white-space: nowrap; transition: all 0.2s;" onmouseover="this.style.background='rgba(16,185,129,0.3)'" onmouseout="this.style.background='rgba(16,185,129,0.2)'">🔄 Đồng bộ cài đặt Team</button>
            </div>
          </div>

          <div class="settings-group" id="admin-proxy-ctrl-${acc.line_uid}" style="display: none; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 10px; margin-top: 10px;">
            <div class="input-control" style="grid-column: span 2;">
              <label for="sel-proxy-${acc.line_uid}">🌐 Cấu hình Proxy (Chỉ Admin)</label>
              <div style="display: flex; gap: 6px; align-items: center; margin-top:2px;">
                <select id="sel-proxy-${acc.line_uid}" onchange="changeBotProxy('${acc.line_uid}', this.value)" style="flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 4px 6px; font-family: inherit; font-size: 0.85rem; outline: none;">
                  <option value="auto">🔄 Tự động gán (Auto)</option>
                  <option value="direct">🖥️ Kết nối trực tiếp (Direct)</option>
                </select>
                <button type="button" onclick="verifyBotProxyIp('${acc.line_uid}')" style="background: rgba(99,102,241,0.25); border: 1px solid rgba(99,102,241,0.5); color: #a5b4fc; border-radius: 6px; padding: 4px 8px; font-size: 0.78rem; cursor: pointer; white-space: nowrap; font-weight: 600;" title="Kiểm tra IP Public thực tế mà Bot đang dùng gửi request">🔍 Test IP</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Săn Boss Tab Pane -->
        <div class="tab-pane" id="pane-mvp-${acc.line_uid}">
          <!-- Sub-tabs Navigation -->
          <div class="subtabs-nav" style="display:flex; gap:6px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; overflow-x:auto;">
            <button class="subtab-btn active" id="mvp-subtab-btn-cfg-${acc.line_uid}" onclick="switchMvpSubTab('${acc.line_uid}', 'cfg')">⚙️ Cấu Hình</button>
            <button class="subtab-btn" id="mvp-subtab-btn-monitor-${acc.line_uid}" onclick="switchMvpSubTab('${acc.line_uid}', 'monitor')">📊 Theo Dõi</button>
          </div>

          <!-- Sub-pane 1: Cấu Hình -->
          <div id="mvp-subpane-cfg-${acc.line_uid}" style="display:block;">
            <div class="settings-group" style="display: flex; flex-direction: column; gap: 8px;">
              <div class="toggle-control" style="display: flex; justify-content: space-between; align-items: center;">
                <span class="toggle-label">👿 Tự động Săn Boss MVP</span>
                <label class="switch">
                  <input type="checkbox" id="chk-bosshuntenabled-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'bossHuntEnabled')">
                  <span class="slider"></span>
                </label>
              </div>
              
              <div class="toggle-control" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <span class="toggle-label">🏟️ Auto Đấu Trường</span>
                <label class="switch">
                  <input type="checkbox" id="chk-autoarena-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoArena')">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="input-control" style="margin-top: 4px;">
                <label for="sel-boss-hunt-priority-${acc.line_uid}">🎯 Tiêu chí ưu tiên săn Boss</label>
                <select id="sel-boss-hunt-priority-${acc.line_uid}" onchange="updateStringSetting('${acc.line_uid}', 'bossHuntPriority')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px; width: 100%;">
                  <option value="distance">📍 Gần nhất (Khoảng cách)</option>
                  <option value="hp_asc">🩸 Ít máu nhất (HP thấp nhất)</option>
                  <option value="level_asc">🐣 Cấp độ thấp nhất (Lv tăng dần)</option>
                  <option value="level_desc">🦅 Cấp độ cao nhất (Lv giảm dần)</option>
                </select>
              </div>

              <div class="input-control" style="margin-top: 8px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                  <span>🗺️ Thứ tự bản đồ săn Boss:</span>
                  <div style="position: relative; display: inline-block;">
                    <button type="button" id="btn-add-map-menu-${acc.line_uid}" onclick="toggleAddMapDropdown('${acc.line_uid}')" style="background: rgba(16,185,129,0.25); border: 1px solid rgba(16,185,129,0.5); color: #a7f3d0; border-radius: 6px; padding: 2px 8px; font-size: 0.78rem; cursor: pointer; font-weight: 600;">➕ Thêm Map</button>
                    <div id="dropdown-add-map-${acc.line_uid}" style="display: none; position: absolute; right: 0; top: 26px; background: #1e293b; border: 1px solid var(--border-color); border-radius: 6px; width: 180px; z-index: 100; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    </div>
                  </div>
                </label>
                <div id="boss-hunt-maps-container-${acc.line_uid}" style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); min-height: 38px;">
                </div>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <button type="button" onclick="forceMvpHunt('${acc.line_uid}')" style="background: rgba(220, 38, 38, 0.25); border: 1px solid rgba(220, 38, 38, 0.5); color: #fca5a5; border-radius: 6px; padding: 6px 12px; font-size: 0.85rem; cursor: pointer; width: 100%; font-weight: 600; text-align: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(220, 38, 38, 0.4)'" onmouseout="this.style.background='rgba(220, 38, 38, 0.25)'">⚡ Kích hoạt đi săn ngay cho cả Team (Force Team Hunt)</button>
            </div>

            <!-- Section Săn Boss Guild (Guild Dungeon) -->
            <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: #c084fc; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span>🏰 Phụ Bản Boss Guild</span>
                <span id="gdun-status-badge-${acc.line_uid}" style="display:none; font-size:0.65rem; background:rgba(192,132,252,0.2); color:#c084fc; border:1px solid rgba(192,132,252,0.4); border-radius:4px; padding:1px 5px;">Trong Phụ Bản</span>
              </div>
              <div class="toggle-control" style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; margin-bottom: 6px;">
                <span class="toggle-label" style="font-size: 0.78rem; color: #e9d5ff; font-weight: 500;">⏰ Tự động vào phút 30 (Cá nhân)</span>
                <label class="switch" style="transform: scale(0.8); margin-right: -2px;">
                  <input type="checkbox" id="chk-autoentergdunat30-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoEnterGdunAt30')">
                  <span class="slider" style="background-color: #5b21b6;"></span>
                </label>
              </div>
              <div style="display: flex; gap: 6px;">
                <button type="button" id="btn-gdun-team-${acc.line_uid}" onclick="sendAccountAction('${acc.line_uid}', 'gdun_enter_team')" style="flex: 1; background: linear-gradient(135deg, rgba(147,51,234,0.3), rgba(126,34,206,0.4)); border: 1px solid rgba(192,132,252,0.5); color: #e9d5ff; border-radius: 6px; padding: 6px 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; text-align: center; transition: all 0.2s;" title="Đội trưởng kéo cả Team vào Phụ Bản Guild">🏰 Cả Team</button>
                <button type="button" id="btn-gdun-solo-${acc.line_uid}" onclick="sendAccountAction('${acc.line_uid}', 'gdun_enter_solo')" style="flex: 1; background: linear-gradient(135deg, rgba(14,165,233,0.25), rgba(3,105,161,0.35)); border: 1px solid rgba(56,189,248,0.5); color: #7dd3fc; border-radius: 6px; padding: 6px 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; text-align: center; transition: all 0.2s;" title="Chỉ bot này vào Phụ Bản Guild (không kéo team)">👤 Đi 1 Mình</button>
                <button type="button" id="btn-gdun-exit-${acc.line_uid}" onclick="sendAccountAction('${acc.line_uid}', 'gdun_exit')" style="display: none; flex: 1; background: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.35)); border: 1px solid rgba(248,113,113,0.5); color: #fca5a5; border-radius: 6px; padding: 6px 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; text-align: center; transition: all 0.2s;" title="Thoát khỏi Phụ Bản Guild ngay">🚪 Thoát Phụ Bản</button>
              </div>
            </div>
          </div>

          <!-- Sub-pane 2: Theo Dõi -->
          <div id="mvp-subpane-monitor-${acc.line_uid}" style="display:none;">
            <div class="live-bosses-section" id="live-bosses-section-${acc.line_uid}" style="margin-top: 4px; border-top: none; padding-top: 0px; display: none;">
              <div style="font-size: 0.8rem; font-weight: 700; color: #fbbf24; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span>👹 Boss Đang Sống Trên Map</span>
                <span id="live-boss-count-badge-${acc.line_uid}" style="font-size: 0.65rem; background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); border-radius: 10px; padding: 1px 6px; font-weight: 600;">0 Boss</span>
              </div>
              <div class="live-bosses-list" id="live-bosses-list-${acc.line_uid}" style="display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto;">
                <!-- Dynamically populated -->
              </div>
            </div>

            <!-- Nhật ký Săn Boss MVP -->
            <div class="boss-journal-section" id="boss-journal-section-${acc.line_uid}" style="margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:0 2px;">
                <span style="font-size:0.8rem; color:#fbbf24; font-weight:700;">👾 Nhật ký Săn Boss MVP</span>
                <button class="btn btn-secondary btn-sm" onclick="fetchBossLog('${acc.line_uid}')" style="padding:2px 8px; font-size:0.75rem;">🔄 Cập nhật</button>
              </div>
              <div id="boss-stats-${acc.line_uid}" class="boss-stats-container" style="margin-bottom: 6px;"></div>
              <div class="log-terminal boss-terminal" id="boss-terminal-${acc.line_uid}">
                <div class="log-line"><span class="log-text-content" style="font-size:0.6rem;">Chưa có dữ liệu săn Boss.</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto Market Buy Tab Pane -->
        <div class="tab-pane" id="pane-market-buy-${acc.line_uid}">
          <div class="market-buy-locked-overlay" id="market-buy-locked-${acc.line_uid}" style="display: none; background: rgba(220,38,38,0.08); padding: 16px; border: 1px dashed rgba(239, 68, 68, 0.4); border-radius: 12px; text-align: center; margin-bottom: 10px;">
            <div style="font-size: 2rem; margin-bottom: 8px;">🔒</div>
            <div style="font-size: 0.85rem; color: #fca5a5; font-weight: 700; margin-bottom: 4px;">CHỨC NĂNG BỊ KHÓA</div>
            <div style="font-size: 0.76rem; color: #94a3b8; line-height: 1.4;">Tài khoản của bạn chưa được cấp quyền sử dụng Auto Market Buy. Vui lòng liên hệ Admin để mở khóa.</div>
          </div>

          <div class="market-buy-unlocked-panel" id="market-buy-panel-${acc.line_uid}" style="display: block;">
            <!-- Sub-tabs Navigation -->
            <div class="subtabs-nav" style="display:flex; gap:6px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; overflow-x:auto;">
              <button class="subtab-btn active" id="subtab-btn-mkt-live-${acc.line_uid}" onclick="switchMarketSubTab('${acc.line_uid}', 'live')">🛒 Mua Chợ (Live)</button>
              <button class="subtab-btn" id="subtab-btn-mkt-mine-${acc.line_uid}" onclick="switchMarketSubTab('${acc.line_uid}', 'mine')">📦 Đang Rao Bán</button>
              <button class="subtab-btn" id="subtab-btn-mkt-settings-${acc.line_uid}" onclick="switchMarketSubTab('${acc.line_uid}', 'settings')">⚙️ Cấu hình Auto</button>
              <button class="subtab-btn" id="subtab-btn-mkt-filters-${acc.line_uid}" onclick="switchMarketSubTab('${acc.line_uid}', 'filters')">🎯 Bộ lọc 9 loại</button>
              <button class="subtab-btn" id="subtab-btn-mkt-history-${acc.line_uid}" onclick="switchMarketSubTab('${acc.line_uid}', 'history')">📜 Lịch sử mua</button>
              <button class="subtab-btn" id="subtab-btn-mkt-trade-${acc.line_uid}" onclick="switchMarketSubTab('${acc.line_uid}', 'trade')">🤝 Giao Dịch</button>
            </div>

            <!-- Sub-pane 0: Mua Chợ Trực Tiếp (Live Market) -->
            <div class="subtab-pane" id="subpane-mkt-live-${acc.line_uid}" style="display:block;">
              <!-- Toolbar Filter & Search -->
              <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 700; color: #fbbf24;">
                    <span>💰 Vàng hiện có:</span>
                    <span id="mkt-live-gold-${acc.line_uid}" style="color: #4ade80; font-size: 0.9rem;">0</span> G
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <button class="btn btn-secondary" onclick="loadLiveMarket('${acc.line_uid}', true)" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 6px;">
                      🔄 Làm mới
                    </button>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 6px;">
                  <!-- Text Search Input -->
                  <div style="position: relative;">
                    <input type="text" id="mkt-live-search-${acc.line_uid}" placeholder="🔍 Tìm kiếm tên đồ..." oninput="onLiveMarketSearch('${acc.line_uid}')" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 5px 8px; font-size: 0.78rem; outline: none;">
                  </div>

                  <!-- Category Filter Dropdown -->
                  <div>
                    <select id="mkt-live-cat-${acc.line_uid}" onchange="onLiveMarketFilterChange('${acc.line_uid}')" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fff; padding: 5px 6px; font-size: 0.78rem; outline: none;">
                      <option value="all">🗂️ Tất cả danh mục</option>
                      <optgroup label="📦 Vật Phẩm Thường">
                        <option value="resource">🪵 Nguyên liệu</option>
                        <option value="diamond">💎 Kim cương</option>
                        <option value="ore">🪨 Quặng không gian / Nông trại</option>
                        <option value="ammo">🔫 Đạn dược</option>
                      </optgroup>
                      <optgroup label="🎴 Thẻ Bài & Trứng">
                        <option value="card">🎴 Thẻ bài quái vật</option>
                        <option value="egg">🥚 Trứng thú cưng</option>
                      </optgroup>
                      <optgroup label="📦 Hộp Ngẫu Nhiên">
                        <option value="module_box">📦 Hộp Module</option>
                        <option value="card_box">🎁 Hộp Thẻ bài</option>
                        <option value="egg_box">🧰 Hộp Trứng</option>
                      </optgroup>
                      <optgroup label="🔧 Module Vũ Khí & Giáp">
                        <option value="module_pistol">🔪 Module Dao găm</option>
                        <option value="module_sniper">🗡️ Module Dao dài</option>
                        <option value="module_knife">🗡️ Module Kiếm</option>
                        <option value="module_axe">🪓 Module Rìu</option>
                        <option value="module_robot">🔋 Module Titan</option>
                        <option value="module_robot_gun">🦾 Module Cung Titan</option>
                        <option value="module_railgun">⚡ Module Titan Beam</option>
                        <option value="module_armor">🔰 Module Khiên</option>
                        <option value="module_house">🛸 Module Phi thuyền</option>
                        <option value="module_turret">🗼 Module Pháo tháp</option>
                      </optgroup>
                      <optgroup label="🛡️ Trang Bị & Đồ Sưu Tầm">
                        <option value="eq2">🛡️ Trang bị D2 (Equipment)</option>
                        <option value="treasure">🗃️ Đồ quý hiếm</option>
                        <option value="hardware">🗃️ Linh kiện Titan</option>
                        <option value="weapon_parts">🗃️ Linh kiện Vũ khí</option>
                        <option value="house_parts">🗃️ Linh kiện Phi thuyền</option>
                        <option value="stat_parts">🗃️ Linh kiện Chỉ số</option>
                      </optgroup>
                    </select>
                  </div>

                  <!-- Price Sort Dropdown (Thấp -> Cao, Cao -> Thấp) -->
                  <div>
                    <select id="mkt-live-sort-${acc.line_uid}" onchange="onLiveMarketFilterChange('${acc.line_uid}')" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #fbbf24; padding: 5px 6px; font-size: 0.78rem; font-weight: 600; outline: none;">
                      <option value="asc">🔽 Giá: Thấp ➔ Cao</option>
                      <option value="desc">🔼 Giá: Cao ➔ Thấp</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Live Market Cards Grid -->
              <div id="mkt-live-grid-${acc.line_uid}" class="mkt-live-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; max-height: 480px; overflow-y: auto; padding: 2px;">
                <div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;">
                  <span class="spinner" style="display:inline-block; margin-right:6px;"></span> Đang tải danh sách chợ...
                </div>
              </div>
            </div>

            <!-- Sub-pane 0.5: Đang Rao Bán (My Listings) -->
            <div class="subtab-pane" id="subpane-mkt-mine-${acc.line_uid}" style="display:none;">
              <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div style="font-size: 0.82rem; font-weight: 700; color: #c084fc;">
                  📦 Vật Phẩm Đang Treo Bán Trên Chợ
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-primary" onclick="openMarketSellModal('${acc.line_uid}')" style="font-size: 0.72rem; padding: 3px 10px; border-radius: 6px;">
                    🏷️ + Đăng Bán Đồ
                  </button>
                  <button class="btn btn-secondary" onclick="loadMyListings('${acc.line_uid}', true)" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 6px;">
                    🔄 Làm mới
                  </button>
                </div>
              </div>

              <!-- My Listings Grid -->
              <div id="mkt-mine-grid-${acc.line_uid}" class="mkt-live-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; max-height: 480px; overflow-y: auto; padding: 2px;">
                <div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;">
                  Chưa có danh sách vật phẩm đang bán.
                </div>
              </div>
            </div>

            <!-- Sub-pane 1: Cấu hình chung (Settings) -->
            <div class="subtab-pane" id="subpane-mkt-settings-${acc.line_uid}" style="display:none;">
              <!-- Master Control Header -->
              <div style="margin-bottom: 10px; padding: 10px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div class="toggle-control">
                  <span class="toggle-label" style="font-weight: 700; color: #38bdf8; font-size: 0.9rem;">🏪 Auto Market Buy (Tự Mua Chợ Giá Rẻ)</span>
                  <label class="switch">
                    <input type="checkbox" id="chk-automarketbuy-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoMarketBuy')">
                    <span class="slider"></span>
                  </label>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div class="input-control">
                    <label for="num-market-max-price-${acc.line_uid}" style="font-size: 0.75rem; color: #fbbf24; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                      <span>💰 Giá Mua Tối Đa</span>
                      <span id="lbl-market-max-price-preview-${acc.line_uid}" style="font-size: 0.7rem; color: #4ade80; font-weight: bold;"></span>
                    </label>
                    <input type="text" id="num-market-max-price-${acc.line_uid}" placeholder="10.000" oninput="formatMarketPriceInput(this, '${acc.line_uid}')" onchange="updateNumericSetting('${acc.line_uid}', 'marketMaxPrice')" onkeydown="if(event.key==='Enter') this.blur()" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.82rem; outline: none; margin-top:2px; width: 100%;">
                  </div>
                  <div class="input-control">
                    <label for="sel-market-scan-interval-${acc.line_uid}" style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">⏱️ Chu Kỳ Quét</label>
                    <select id="sel-market-scan-interval-${acc.line_uid}" onchange="updateNumericSetting('${acc.line_uid}', 'marketScanInterval')" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.82rem; outline: none; margin-top:2px; width: 100%;">
                      <option value="5">⚡ 5 giây</option>
                      <option value="10" selected>⏱️ 10 giây (Khuyên dùng)</option>
                      <option value="15">⏱️ 15 giây</option>
                      <option value="30">🐢 30 giây</option>
                      <option value="60">🐢 60 giây</option>
                    </select>
                  </div>
                </div>

                <div class="toggle-control" style="padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.05);">
                  <span class="toggle-label" style="font-weight: 600; color: #cbd5e1; font-size: 0.78rem;">🎯 Khớp đúng giá cố định (chuyển/giao dịch đồ)</span>
                  <label class="switch" style="transform: scale(0.85); margin-right: -4px;">
                    <input type="checkbox" id="chk-marketexactprice-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'marketExactPrice')">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <!-- Cấu Hình Số Lượng Mua Tối Đa -->
              <div style="margin-bottom: 10px; padding: 10px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #a855f7; display: flex; align-items: center; gap: 4px;">
                  <span>📈 Số Lượng Mua Tối Đa mỗi lượt quét</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 8px;">
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">🪵 Nguyên liệu</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'resource', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-resource-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'resource')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'resource', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">🎴 Thẻ quái</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'card', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-card-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'card')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'card', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">🥚 Trứng thú</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'egg', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-egg-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'egg')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'egg', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">⚙️ Module</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'module', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-module-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'module')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'module', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">🏛️ Đồ sưu tầm</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'collectible', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-collectible-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'collectible')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'collectible', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">💎 Kim cương</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'diamond', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-diamond-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'diamond')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'diamond', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">📦 Hộp thẻ</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'card_box', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-card_box-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'card_box')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'card_box', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">📦 Hộp trứng</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'egg_box', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-egg_box-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'egg_box')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'egg_box', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                  <div class="input-control" style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; justify-content: space-between; height: 64px;">
                    <label style="font-size: 0.7rem; color: #cbd5e1; font-weight: 600; text-align: center; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">📦 Hộp Module</label>
                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 2px 4px; height: 26px;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'module_box', -1)" style="background: none; border: none; color: #f43f5e; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">-</button>
                      <input type="number" id="num-market-max-qty-module_box-${acc.line_uid}" min="1" onchange="updateMarketCategoryMaxQty('${acc.line_uid}', 'module_box')" style="background: none; border: none; color: #fff; text-align: center; font-family: inherit; font-size: 0.8rem; font-weight: 700; outline: none; width: 100%; -moz-appearance: textfield; margin: 0; padding: 0;">
                      <button type="button" onclick="adjustMarketQty('${acc.line_uid}', 'module_box', 1)" style="background: none; border: none; color: #10b981; font-weight: bold; font-size: 1rem; width: 22px; height: 22px; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: center;">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sub-pane 2: Bộ lọc 9 loại (Filters) -->
            <div class="subtab-pane" id="subpane-mkt-filters-${acc.line_uid}" style="display:none;">
              <div style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #fbbf24; display: flex; justify-content: space-between; align-items: center;">
                  <span>🎯 Bộ Lọc 9 Loại Vật Phẩm</span>
                  <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 400;">Bật công tắc & mở rộng để lọc chi tiết</span>
                </div>

                <div id="market-categories-accordion-${acc.line_uid}">
                  <!-- Populated dynamically by renderMarketCategoryAccordion(acc) -->
                </div>
              </div>
            </div>

            <!-- Sub-pane 3: Lịch sử mua (History) -->
            <div class="subtab-pane" id="subpane-mkt-history-${acc.line_uid}" style="display:none;">
              <div style="padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 0.8rem; font-weight: 700; color: #4ade80;">📜 Lịch Sử Tự Động Mua (Auto-Buy Log)</span>
                  <button class="action-btn text-btn btn-sm" onclick="clearMarketBuyHistory('${acc.line_uid}')" style="font-size: 0.68rem; padding: 2px 8px; color: #f87171; border-color: rgba(248, 113, 113, 0.3);">
                    🗑️ Xóa Lịch Sử
                  </button>
                </div>
                <div style="max-height: 280px; overflow-y: auto;">
                  <table class="market-history-table">
                    <thead>
                      <tr>
                        <th style="width: 22%;">Thời Gian</th>
                        <th style="width: 40%;">Vật Phẩm</th>
                        <th style="width: 18%;">Giá Mua</th>
                        <th style="width: 20%;">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody id="tbl-market-buy-history-${acc.line_uid}">
                      <tr>
                        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px 0;">Chưa có lịch sử tự động mua.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Sub-pane 4: Giao Dịch 1-1 (Trade) -->
            <div class="subtab-pane" id="subpane-mkt-trade-${acc.line_uid}" style="display:none;">
              <div style="padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;">
                <!-- Trade Container managed by app.js logic -->
                <div id="mkt-trade-panel-${acc.line_uid}" class="tr-container">
                  <div style="text-align:center; padding:20px; color:#94a3b8; font-size:12px;">Đang tải...</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Character & Skills Tab Pane -->
        <div class="tab-pane" id="pane-skills-${acc.line_uid}">
          <div class="subtabs-nav" style="display:flex; gap:6px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; overflow-x:auto;">
            <button class="subtab-btn active" id="subtab-btn-stats-${acc.line_uid}" onclick="switchSubTab('${acc.line_uid}', 'stats')">📊 Tiềm Năng</button>
            <button class="subtab-btn" id="subtab-btn-skills-${acc.line_uid}" onclick="switchSubTab('${acc.line_uid}', 'skills')">⚡ Kỹ Năng</button>
            <button class="subtab-btn" id="subtab-btn-cards-${acc.line_uid}" onclick="switchSubTab('${acc.line_uid}', 'cards')">🎴 Thẻ Bài</button>
            <button class="subtab-btn" id="subtab-btn-eggs-${acc.line_uid}" onclick="switchSubTab('${acc.line_uid}', 'eggs')">🥚 Trứng</button>
          </div>

          <!-- Sub-pane 1: Stats & Stat Points -->
          <div class="subtab-pane" id="subpane-stats-${acc.line_uid}" style="display:block;">
            <!-- Section 1: 📊 Stat Points Allocation -->
            <div class="char-section-block">
              <div class="section-header-wrap">
                <span class="section-title" style="color:#a5b4fc; font-weight:700;">📊 Điểm Tiềm Năng (Stat Points)</span>
                <span style="font-size:0.75rem; background:rgba(124, 58, 237, 0.15); color:rgba(196, 181, 253, 0.85); padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(167, 139, 250, 0.25);" id="stat-pts-badge-${acc.line_uid}">
                  Stat Points: <b id="pts-val-${acc.line_uid}">0</b> pt
                </span>
              </div>

              <div class="stat-alloc-grid" id="stats-list-${acc.line_uid}">
                <!-- Populated dynamically by renderStatsList(acc) -->
              </div>
            </div>

            <!-- Section 2: ⚔️ In-Game Combat Stats Summary -->
            <div class="char-section-block">
              <div class="section-header-wrap">
                <span class="section-title" style="color:#f472b6; font-weight:700;">⚔️ Chỉ Số Chiến Đấu (Combat Stats)</span>
              </div>
              <div class="combat-summary-grid" id="combat-summary-${acc.line_uid}">
                <!-- Populated dynamically by renderCombatSummary(acc) -->
              </div>
            </div>
          </div>

          <!-- Sub-pane 2: Skill List -->
          <div class="subtab-pane" id="subpane-skills-${acc.line_uid}" style="display:none;">
            <div class="char-section-block">
              <div class="section-header-wrap">
                <span class="section-title" style="color:#a78bfa; font-weight:700;">⚡ Kỹ Năng Nhân Vật (Skills)</span>
                <span style="font-size:0.75rem; color:var(--text-secondary); opacity:0.85; font-weight:600;" id="skills-sp-${acc.line_uid}">Skill Points: --</span>
              </div>
              <div class="skills-grid" id="skills-grid-${acc.line_uid}">
                <div style="grid-column: 1 / -1; font-size: 0.8rem; color: var(--text-secondary); opacity: 0.85; text-align: center; padding: 12px 0;">
                  Chưa có dữ liệu kỹ năng.
                </div>
              </div>
            </div>
          </div>

          <!-- Sub-pane 3: Cards Inventory & MVP Exchange -->
          <div class="subtab-pane" id="subpane-cards-${acc.line_uid}" style="display:none;">
            <div class="char-section-block">
              <div class="section-header-wrap">
                <span class="section-title" style="color:#fb7185; font-weight:700;">🎴 Bộ Sưu Tập Thẻ Bài</span>
                <span style="font-size:0.75rem; background:rgba(225, 29, 72, 0.15); color:#fda4af; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(244, 63, 94, 0.25);" id="cards-count-badge-${acc.line_uid}">
                  Loài thẻ: <b id="cards-cnt-val-${acc.line_uid}">0</b> loài
                </span>
              </div>
              <div class="cards-book-grid" id="cards-book-${acc.line_uid}">
                <!-- Populated dynamically by renderCardBook(acc) -->
              </div>
            </div>
          </div>

          <!-- Sub-pane 4: Pet Eggs Inventory & MVP Exchange -->
          <div class="subtab-pane" id="subpane-eggs-${acc.line_uid}" style="display:none;">
            <!-- Pet Combat Stats & Upgrade Block -->
            <div class="char-section-block" style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 10px; padding: 10px; margin-bottom: 10px;">
              <div class="section-header-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="section-title" style="color: #c084fc; font-weight: 700;">🐾 Nâng Cấp Thú Cưng (Pet Stats)</span>
                <span style="font-size: 0.75rem; background: rgba(168, 85, 247, 0.15); color: #e9d5ff; padding: 2px 8px; border-radius: 10px; font-weight: 700; border: 1px solid rgba(168, 85, 247, 0.3);">
                  Điểm Pet: <b id="pet-pts-${acc.line_uid}" style="color: #fbbf24;">0</b> pt
                </span>
              </div>

              <!-- Combat stats summary row -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 8px; text-align: center;">
                <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.25); border-radius: 6px; padding: 3px 2px;">
                  <div style="font-size: 0.65rem; color: #fca5a5;">⚔️ ATK</div>
                  <div style="font-size: 0.82rem; font-weight: 800; color: #ef4444;" id="pet-atk-val-${acc.line_uid}">--</div>
                </div>
                <div style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(37, 99, 235, 0.25); border-radius: 6px; padding: 3px 2px;">
                  <div style="font-size: 0.65rem; color: #93c5fd;">🛡️ DEF</div>
                  <div style="font-size: 0.82rem; font-weight: 800; color: #3b82f6;" id="pet-def-val-${acc.line_uid}">--</div>
                </div>
                <div style="background: rgba(22, 163, 74, 0.1); border: 1px solid rgba(22, 163, 74, 0.25); border-radius: 6px; padding: 3px 2px;">
                  <div style="font-size: 0.65rem; color: #86efac;">❤️ HP Max</div>
                  <div style="font-size: 0.82rem; font-weight: 800; color: #22c55e;" id="pet-hp-val-${acc.line_uid}">--</div>
                </div>
                <div style="background: rgba(13, 148, 136, 0.1); border: 1px solid rgba(13, 148, 136, 0.25); border-radius: 6px; padding: 3px 2px;">
                  <div style="font-size: 0.65rem; color: #5eead4;">💚 ฟื้นตัว</div>
                  <div style="font-size: 0.82rem; font-weight: 800; color: #14b8a6;" id="pet-regen-val-${acc.line_uid}">--</div>
                </div>
              </div>

              <!-- Upgrade Buttons Grid -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
                <!-- ATK Upgrade -->
                <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 5px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #f87171;">⚔️ ATK <span style="font-weight:400; color:#94a3b8;">Lv.<b id="pet-up-atk-lv-${acc.line_uid}">0</b></span></div>
                  <button class="btn-action-sm" id="btn-petup-atk-${acc.line_uid}" onclick="upgradePetStat('${acc.line_uid}', 'atk')" style="width: 100%; margin-top: 4px; background: #dc2626; color: #fff; border: none; border-radius: 4px; padding: 3px 0; font-size: 0.7rem; font-weight: 700; cursor: pointer;">+1 ATK</button>
                </div>

                <!-- DEF / HP Upgrade -->
                <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 5px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #60a5fa;">🛡️ DEF <span style="font-weight:400; color:#94a3b8;">Lv.<b id="pet-up-hp-lv-${acc.line_uid}">0</b></span></div>
                  <button class="btn-action-sm" id="btn-petup-hp-${acc.line_uid}" onclick="upgradePetStat('${acc.line_uid}', 'hp')" style="width: 100%; margin-top: 4px; background: #2563eb; color: #fff; border: none; border-radius: 4px; padding: 3px 0; font-size: 0.7rem; font-weight: 700; cursor: pointer;">+1 DEF</button>
                </div>

                <!-- Reco Upgrade -->
                <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 6px; padding: 5px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                  <div style="font-size: 0.72rem; font-weight: 700; color: #2dd4bf;">💚 RECO <span style="font-weight:400; color:#94a3b8;">Lv.<b id="pet-up-reco-lv-${acc.line_uid}">0</b></span></div>
                  <button class="btn-action-sm" id="btn-petup-reco-${acc.line_uid}" onclick="upgradePetStat('${acc.line_uid}', 'reco')" style="width: 100%; margin-top: 4px; background: #0d9488; color: #fff; border: none; border-radius: 4px; padding: 3px 0; font-size: 0.7rem; font-weight: 700; cursor: pointer;">+1 RECO</button>
                </div>
              </div>
            </div>

            <div class="char-section-block">
              <div class="section-header-wrap">
                <span class="section-title" style="color:#38bdf8; font-weight:700;">🥚 Bộ Sưu Tập Trứng Thú Cưng</span>
                <span style="font-size:0.75rem; background:rgba(14, 165, 233, 0.15); color:#7dd3fc; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(56, 189, 248, 0.25);" id="eggs-count-badge-${acc.line_uid}">
                  Loài trứng: <b id="eggs-cnt-val-${acc.line_uid}">0</b> loài
                </span>
              </div>
              <div class="eggs-book-grid" id="eggs-book-${acc.line_uid}">
                <!-- Populated dynamically by renderEggBook(acc) -->
              </div>
            </div>
          </div>
        </div>

        <!-- Log Tab Pane (Merged Logs & Loot with Sub-tabs) -->
        <div class="tab-pane" id="pane-log-${acc.line_uid}">
          <div class="subtabs-nav" style="display:flex; gap:6px; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; overflow-x:auto;">
            <button class="subtab-btn active" id="log-subtab-btn-act-${acc.line_uid}" onclick="switchLogSubTab('${acc.line_uid}', 'act')">📜 Hoạt Động</button>
            <button class="subtab-btn" id="log-subtab-btn-loot-${acc.line_uid}" onclick="switchLogSubTab('${acc.line_uid}', 'loot')">🎁 Vật Phẩm</button>
            <button class="subtab-btn" id="log-subtab-btn-market-${acc.line_uid}" onclick="switchLogSubTab('${acc.line_uid}', 'market')">🏪 Chợ</button>
          </div>
          
          <!-- Sub-pane 1: Activity Logs -->
          <div id="log-subpane-act-${acc.line_uid}" style="display:block;">
            <div class="log-terminal" id="terminal-${acc.line_uid}">
              <!-- Log lines will be appended here -->
            </div>
          </div>
          
          <!-- Sub-pane 2: Loot Logs -->
          <div id="log-subpane-loot-${acc.line_uid}" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:0 2px;">
              <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">🎁 Nhật ký rơi đồ (Database Máy Chủ)</span>
              <button class="btn btn-secondary btn-sm" onclick="fetchDropLogs('${acc.line_uid}')" style="padding:2px 8px; font-size:0.75rem;">🔄 Cập nhật</button>
            </div>
            <div class="log-terminal loot-terminal" id="loot-terminal-${acc.line_uid}">
              <div class="log-line"><span class="log-text-content" style="font-size:0.6rem;">Chuyển sang tab này để tải lịch sử rơi đồ từ máy chủ.</span></div>
            </div>
          </div>

          <!-- Sub-pane 3: Market History -->
          <div id="log-subpane-market-${acc.line_uid}" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:0 2px;">
              <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">🏪 Lịch sử giao dịch Chợ</span>
              <button class="btn btn-secondary btn-sm" onclick="fetchMarketHistory('${acc.line_uid}')" style="padding:2px 8px; font-size:0.75rem;">🔄 Cập nhật</button>
            </div>
            <div class="log-terminal market-terminal" id="market-terminal-${acc.line_uid}">
              <div class="log-line"><span class="log-text-content" style="font-size:0.6rem;">Chuyển sang tab này để tải lịch sử chợ từ máy chủ.</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
    const handle = cardEl.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('mousedown', () => { cardEl.draggable = true; });
      handle.addEventListener('mouseup', () => { cardEl.draggable = false; });
      handle.addEventListener('touchstart', () => { cardEl.draggable = true; });
      handle.addEventListener('touchend', () => { cardEl.draggable = false; });
    }
  }

  // Update card UI with fresh account data
  function updateCard(acc) {
    const card = document.getElementById(`card-${acc.line_uid}`);
    if (!card) return;

    // Sync Auto Market Buy Settings (done regardless of player loading status)
    const chkAutoMarketBuy = document.getElementById(`chk-automarketbuy-${acc.line_uid}`);
    if (chkAutoMarketBuy && document.activeElement !== chkAutoMarketBuy) chkAutoMarketBuy.checked = (acc.settings && acc.settings.autoMarketBuy === true);

    const numMarketMaxPrice = document.getElementById(`num-market-max-price-${acc.line_uid}`);
    if (numMarketMaxPrice && document.activeElement !== numMarketMaxPrice) {
      const val = (acc.settings && acc.settings.marketMaxPrice) || 10000;
      numMarketMaxPrice.value = formatNumberWithDots(val);
      const previewLbl = document.getElementById(`lbl-market-max-price-preview-${acc.line_uid}`);
      if (previewLbl) previewLbl.textContent = formatShortGold(val);
    }

    const chkMarketExactPrice = document.getElementById(`chk-marketexactprice-${acc.line_uid}`);
    if (chkMarketExactPrice && document.activeElement !== chkMarketExactPrice) {
      chkMarketExactPrice.checked = (acc.settings && acc.settings.marketExactPrice === true);
    }

    const selScanInterval = document.getElementById(`sel-market-scan-interval-${acc.line_uid}`);
    if (selScanInterval && document.activeElement !== selScanInterval) selScanInterval.value = (acc.settings && acc.settings.marketScanInterval) || 10;

    // Sync Auto Market Buy Max Quantities
    const categoryMaxQtys = (acc.settings && acc.settings.marketCategoryMaxQtys) || {};
    const qtyCategories = ['resource', 'card', 'egg', 'module', 'collectible', 'diamond', 'card_box', 'egg_box', 'module_box'];
    qtyCategories.forEach(cat => {
      const input = document.getElementById(`num-market-max-qty-${cat}-${acc.line_uid}`);
      if (input && document.activeElement !== input) {
        const defaultQty = cat === 'resource' ? 100 : 1;
        input.value = categoryMaxQtys[cat] !== undefined ? categoryMaxQtys[cat] : defaultQty;
      }
    });

    // Render & sync 9 category cards accordion and buy history
    renderMarketCategoryAccordion(acc);
    renderMarketBuyHistory(acc);

    const isPermitted = currentUser && (currentUser.role === 'admin' || currentUser.allowMarket === true);
    const lockedPanel = document.getElementById(`market-buy-locked-${acc.line_uid}`);
    const unlockedPanel = document.getElementById(`market-buy-panel-${acc.line_uid}`);
    if (lockedPanel && unlockedPanel) {
      if (isPermitted) {
        lockedPanel.style.display = 'none';
        unlockedPanel.style.display = 'block';
      } else {
        lockedPanel.style.display = 'block';
        unlockedPanel.style.display = 'none';
      }
    }

    // Status badge
    const badge = document.getElementById(`status-badge-${acc.line_uid}`);
    if (acc.clientActive) {
      card.className = `account-card running client-active`;
      badge.className = 'badge badge-info';
      badge.textContent = 'Chơi Tay';
    } else {
      card.className = `account-card ${acc.status}`;
      badge.className = `badge badge-${acc.status}`;
      badge.textContent = acc.status === 'running' ? 'Đang Treo' : acc.status === 'idle' ? 'Tạm Dừng' : 'Lỗi';
    }

    // Ping Network Latency Badge update (Admin Only)
    const pingBadgeEl = document.getElementById(`ping-badge-${acc.line_uid}`);
    if (pingBadgeEl) {
      const isAdmin = currentUser && currentUser.role === 'admin';
      if (isAdmin && acc.status === 'running' && acc.ping !== undefined && acc.ping > 0) {
        const pingVal = acc.ping;
        let pingClass = 'ping-good';
        if (pingVal > 400) pingClass = 'ping-poor';
        else if (pingVal > 150) pingClass = 'ping-medium';

        pingBadgeEl.className = `ping-badge ${pingClass}`;
        pingBadgeEl.style.display = 'inline-flex';
        pingBadgeEl.innerHTML = `📡 ${pingVal}ms`;
      } else {
        pingBadgeEl.style.display = 'none';
      }
    }

    // Team Tag Badge update
    const teamBadgeEl = document.getElementById(`team-badge-${acc.line_uid}`);
    if (teamBadgeEl) {
      const tId = (acc.settings && acc.settings.teamId) || 'none';
      if (tId !== 'none') {
        const teamNum = tId.replace('team_', 'T');
        const isLeader = acc.settings && acc.settings.teamRole === 'leader';
        const badgeClass = isLeader ? 'team-tag-badge team-tag-leader' : 'team-tag-badge team-tag-member';
        const roleIcon = isLeader ? '👑' : '👥';
        teamBadgeEl.className = badgeClass;
        teamBadgeEl.style.display = 'inline-flex';
        teamBadgeEl.innerHTML = `🛡️ ${teamNum} ${roleIcon}`;
      } else {
        teamBadgeEl.style.display = 'none';
      }
    }

    // Guild Dungeon Buttons & Status Update
    const inGdun = acc.guildDungeonActive || (acc.player && Number(acc.player.gdun_in) === 1);
    const gdunBadge = document.getElementById(`gdun-status-badge-${acc.line_uid}`);
    const btnGdunTeam = document.getElementById(`btn-gdun-team-${acc.line_uid}`);
    const btnGdunSolo = document.getElementById(`btn-gdun-solo-${acc.line_uid}`);
    const btnGdunExit = document.getElementById(`btn-gdun-exit-${acc.line_uid}`);

    if (gdunBadge) gdunBadge.style.display = inGdun ? 'inline-block' : 'none';
    if (btnGdunTeam) btnGdunTeam.style.display = inGdun ? 'none' : 'block';
    if (btnGdunSolo) btnGdunSolo.style.display = inGdun ? 'none' : 'block';
    if (btnGdunExit) btnGdunExit.style.display = inGdun ? 'block' : 'none';

    if (!acc.player) {
      return;
    }

    const p = acc.player;

    // Name and Lv
    document.getElementById(`name-${acc.line_uid}`).textContent = acc.name;
    document.getElementById(`lv-txt-${acc.line_uid}`).textContent = `Lv. ${p.lv || 1} (Tọa độ: ${p.x}, ${p.y} - Map: ${p.map})`;

    // Vitals — dùng hp_max_eff (base + VIT bonus, tính bởi server đồng bộ canvas.js)
    const hpMax = p.hp_max_eff || p.hp_max || 100;
    const hpPct = hpMax > 0 ? Math.min(100, Math.round((p.hp / hpMax) * 100)) : 0;
    const hpBar = document.getElementById(`hp-bar-${acc.line_uid}`);
    hpBar.style.width = `${hpPct}%`;
    document.getElementById(`hp-txt-${acc.line_uid}`).textContent = `${p.hp ?? '--'} / ${hpMax} (${hpPct}%)`;

    const armorBar = document.getElementById(`armor-bar-${acc.line_uid}`);
    if (armorBar) {
      const armorMax = p.armor_max_calc || (100 + (p.armor_lv || 0) * 10);
      const armorCur = p.armor ?? armorMax;
      const armorPct = armorMax > 0 ? Math.min(100, Math.round((armorCur / armorMax) * 100)) : 0;
      armorBar.style.width = `${armorPct}%`;
      document.getElementById(`armor-txt-${acc.line_uid}`).textContent = `${armorCur} / ${armorMax} (${armorPct}%)`;
    }

    // MP — dùng mp_max_calc (tính từ intel, đồng bộ canvas.js line 3810)
    const mpBar = document.getElementById(`mp-bar-${acc.line_uid}`);
    if (mpBar) {
      const mpMax = p.mp_max_calc || 75; // fallback: intel=5 → 50+5*5=75
      const mpPct = mpMax > 0 ? Math.min(100, Math.round(((p.mp ?? mpMax) / mpMax) * 100)) : 0;
      mpBar.style.width = `${mpPct}%`;
      document.getElementById(`mp-txt-${acc.line_uid}`).textContent = `${p.mp ?? '--'} / ${mpMax} (${mpPct}%)`;
    }

    // EXP — tính expNeeded theo công thức đồng bộ canvas.js expNext()
    const expBar = document.getElementById(`exp-bar-${acc.line_uid}`);
    if (expBar) {
      const lv = p.lv || 1;
      const expCur = p.exp || 0;
      const expNeeded = (function(lv) {
        if (lv >= 41) return 100000000 + (lv - 41) * 15000000;
        let e = 100;
        for (let k = 2; k <= lv; k++) {
          const b = k <= 10 ? 1.50 : k <= 20 ? 1.45 : k <= 30 ? 1.40 : 1.35;
          e = Math.round(e * b);
        }
        return e;
      })(lv);
      const expPct = expNeeded > 0 ? Math.min(100, Math.round(expCur / expNeeded * 100)) : 0;
      expBar.style.width = `${expPct}%`;
      const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);
      document.getElementById(`exp-txt-${acc.line_uid}`).textContent = `${fmt(expCur)} / ${fmt(expNeeded)} (${expPct}%)`;
    }

    // Resource row
    document.getElementById(`res-gold-${acc.line_uid}`).textContent = p.gold ? p.gold.toLocaleString() : '0';

    // Combat rates
    const rates = acc.combatRates || { killsPerMin: 0, goldPerMin: 0, expPerMin: 0 };
    const unit = rateUnits[acc.line_uid] || 'min';

    const formatRateValue = (val, isKills = false, targetUnit = 'min') => {
      let multiplier = 1;
      let suffix = ' /m';
      if (targetUnit === 'hour') {
        multiplier = 60;
        suffix = ' /h';
      } else if (targetUnit === 'day') {
        multiplier = 1440;
        suffix = ' /d';
      }
      
      const calculatedVal = val * multiplier;
      const prefix = isKills ? '' : '+';
      
      if (calculatedVal >= 1000000) {
        return `${prefix}${(calculatedVal / 1000000).toFixed(1)}M${suffix}`;
      } else if (calculatedVal >= 1000) {
        return `${prefix}${(calculatedVal / 1000).toFixed(1)}k${suffix}`;
      }
      if (isKills && calculatedVal % 1 !== 0) {
        return `${prefix}${calculatedVal.toFixed(1)}${suffix}`;
      }
      return `${prefix}${Math.round(calculatedVal).toLocaleString()}${suffix}`;
    };

    const killsMin = rates.killsPerMin;
    const goldMin = rates.goldPerMin;
    const expMin = rates.expPerMin;

    const killsHour = killsMin * 60;
    const killsDay = killsMin * 1440;
    const goldHour = goldMin * 60;
    const goldDay = goldMin * 1440;
    const expHour = expMin * 60;
    const expDay = expMin * 1440;

    const fmtShort = (n, isKills = false) => {
      const prefix = isKills ? '' : '+';
      if (n >= 1000000) return `${prefix}${(n/1000000).toFixed(1)}M`;
      if (n >= 1000) return `${prefix}${(n/1000).toFixed(1)}k`;
      return `${prefix}${Math.round(n).toLocaleString()}`;
    };

    const killsTooltip = `Quái: ${killsMin}/m | ${fmtShort(killsHour, true)}/h | ${fmtShort(killsDay, true)}/d (Click để đổi hiển thị)`;
    const goldTooltip = `Vàng: ${fmtShort(goldMin)}/m | ${fmtShort(goldHour)}/h | ${fmtShort(goldDay)}/d (Click để đổi hiển thị)`;
    const expTooltip = `EXP: ${fmtShort(expMin)}/m | ${fmtShort(expHour)}/h | ${fmtShort(expDay)}/d (Click để đổi hiển thị)`;

    const elKills = document.getElementById(`rate-kills-${acc.line_uid}`);
    if (elKills) {
      elKills.textContent = formatRateValue(killsMin, true, unit);
      const pill = elKills.closest('.stat-pill') || elKills.parentElement;
      if (pill) pill.setAttribute('title', killsTooltip);
    }

    const elGold = document.getElementById(`rate-gold-${acc.line_uid}`);
    if (elGold) {
      elGold.textContent = formatRateValue(goldMin, false, unit);
      const pill = elGold.closest('.stat-pill') || elGold.parentElement;
      if (pill) pill.setAttribute('title', goldTooltip);
    }

    const elExp = document.getElementById(`rate-exp-${acc.line_uid}`);
    if (elExp) {
      elExp.textContent = formatRateValue(expMin, false, unit);
      const pill = elExp.closest('.stat-pill') || elExp.parentElement;
      if (pill) pill.setAttribute('title', expTooltip);
    }

    // Render wood, stone, iron, copper, herb counts and rates
    const woodMin = rates.woodPerMin || 0;
    const stoneMin = rates.stonePerMin || 0;
    const ironMin = rates.ironPerMin || 0;
    const copperMin = rates.copperPerMin || 0;
    const herbMin = rates.herbPerMin || 0;

    const rateStr = (minVal) => {
      if (!minVal) return '';
      const formatted = formatRateValue(minVal, false, unit);
      return ` (${formatted.replace(/\s+/g, '')})`;
    };

    const woodTooltip = `Gỗ: ${p.wood ? p.wood.toLocaleString() : '0'} | Tốc độ: ${fmtShort(woodMin)}/m | ${fmtShort(woodMin * 60)}/h | ${fmtShort(woodMin * 1440)}/d (Click dải tốc độ để đổi)`;
    const stoneTooltip = `Đá: ${p.stone ? p.stone.toLocaleString() : '0'} | Tốc độ: ${fmtShort(stoneMin)}/m | ${fmtShort(stoneMin * 60)}/h | ${fmtShort(stoneMin * 1440)}/d (Click dải tốc độ để đổi)`;
    const ironTooltip = `Sắt: ${p.iron ? p.iron.toLocaleString() : '0'} | Tốc độ: ${fmtShort(ironMin)}/m | ${fmtShort(ironMin * 60)}/h | ${fmtShort(ironMin * 1440)}/d (Click dải tốc độ để đổi)`;
    const copperTooltip = `Đồng: ${p.copper ? p.copper.toLocaleString() : '0'} | Tốc độ: ${fmtShort(copperMin)}/m | ${fmtShort(copperMin * 60)}/h | ${fmtShort(copperMin * 1440)}/d (Click dải tốc độ để đổi)`;
    const herbTooltip = `Thảo dược: ${p.herb ? p.herb.toLocaleString() : '0'} | Tốc độ: ${fmtShort(herbMin)}/m | ${fmtShort(herbMin * 60)}/h | ${fmtShort(herbMin * 1440)}/d (Click dải tốc độ để đổi)`;

    const elWood = document.getElementById(`res-wood-${acc.line_uid}`);
    if (elWood) {
      elWood.innerHTML = `${p.wood ? p.wood.toLocaleString() : '0'}<span class="rate-sub" style="font-size:0.7rem; color:#85e085; font-weight:normal;">${rateStr(woodMin)}</span>`;
      const pill = elWood.closest('.stat-pill') || elWood.parentElement;
      if (pill) pill.setAttribute('title', woodTooltip);
    }
    const elStone = document.getElementById(`res-stone-${acc.line_uid}`);
    if (elStone) {
      elStone.innerHTML = `${p.stone ? p.stone.toLocaleString() : '0'}<span class="rate-sub" style="font-size:0.7rem; color:#85e085; font-weight:normal;">${rateStr(stoneMin)}</span>`;
      const pill = elStone.closest('.stat-pill') || elStone.parentElement;
      if (pill) pill.setAttribute('title', stoneTooltip);
    }
    const elIron = document.getElementById(`res-iron-${acc.line_uid}`);
    if (elIron) {
      elIron.innerHTML = `${p.iron ? p.iron.toLocaleString() : '0'}<span class="rate-sub" style="font-size:0.7rem; color:#85e085; font-weight:normal;">${rateStr(ironMin)}</span>`;
      const pill = elIron.closest('.stat-pill') || elIron.parentElement;
      if (pill) pill.setAttribute('title', ironTooltip);
    }
    const elCopper = document.getElementById(`res-copper-${acc.line_uid}`);
    if (elCopper) {
      elCopper.innerHTML = `${p.copper ? p.copper.toLocaleString() : '0'}<span class="rate-sub" style="font-size:0.7rem; color:#85e085; font-weight:normal;">${rateStr(copperMin)}</span>`;
      const pill = elCopper.closest('.stat-pill') || elCopper.parentElement;
      if (pill) pill.setAttribute('title', copperTooltip);
    }
    const elHerb = document.getElementById(`res-herb-${acc.line_uid}`);
    if (elHerb) {
      elHerb.innerHTML = `${p.herb ? p.herb.toLocaleString() : '0'}<span class="rate-sub" style="font-size:0.7rem; color:#85e085; font-weight:normal;">${rateStr(herbMin)}</span>`;
      const pill = elHerb.closest('.stat-pill') || elHerb.parentElement;
      if (pill) pill.setAttribute('title', herbTooltip);
    }

    // Render skills tab content
    const skillsSpEl = document.getElementById(`skills-sp-${acc.line_uid}`);
    if (skillsSpEl) {
      skillsSpEl.textContent = `Skill Points: ${p.skill_pts || 0}`;
    }

    const skillsGridEl = document.getElementById(`skills-grid-${acc.line_uid}`);
    if (skillsGridEl) {
      let skillsObj = {};
      let skillAutoObj = {};
      try {
        skillsObj = typeof p.skills === 'string' ? JSON.parse(p.skills || '{}') : (p.skills || {});
        skillAutoObj = typeof p.skill_auto === 'string' ? JSON.parse(p.skill_auto || '{}') : (p.skill_auto || {});
      } catch (e) {
        console.error('Error parsing player skills:', e);
      }

      // Filter owned skills (level > 0)
      const ownedSkills = SKILL_DEFS.filter(def => (skillsObj[def.id] || 0) > 0);

      if (ownedSkills.length === 0) {
        skillsGridEl.innerHTML = `
          <div style="grid-column: 1 / -1; font-size: 0.8rem; color: var(--text-secondary); text-align: center; padding: 12px 0;">
            Chưa sở hữu kỹ năng nào (Hãy cộng điểm trong game).
          </div>
        `;
      } else {
        skillsGridEl.innerHTML = ownedSkills.map(def => {
          const lv = skillsObj[def.id] || 0;
          const isToggleable = def.type === 'active' || def.id === 'twin_turret';
          const autoOn = (skillAutoObj[def.id] ?? 1) ? true : false;
          
          let toggleBtnHtml = '';
          if (isToggleable) {
            toggleBtnHtml = `
              <button class="btn-skill-toggle ${autoOn ? 'on' : 'off'}" onclick="toggleSkillAuto('${acc.line_uid}', '${def.id}', this)">
                ${autoOn ? '✓ Auto' : '✕ Tắt'}
              </button>
            `;
          }

          const typeLabel = def.type === 'active' ? 'Chủ động' : 'Bị động';
          const typeClass = def.type === 'active' ? 'active' : 'passive';

          return `
            <div class="skill-item-card" id="skill-card-${acc.line_uid}-${def.id}">
              <div class="skill-item-info">
                <span class="skill-item-icon">${def.emoji}</span>
                <div class="skill-item-details">
                  <span class="skill-item-name" title="${def.name}">${def.name}</span>
                  <span class="skill-item-lv">Lv. ${lv}</span>
                  <span class="skill-item-tag ${typeClass}">${typeLabel}</span>
                </div>
              </div>
              ${toggleBtnHtml}
            </div>
          `;
        }).join('');
      }
    }

    // Settings checkboxes states
    const chkBotLoop = document.getElementById(`chk-bot-loop-${acc.line_uid}`);
    if (chkBotLoop && document.activeElement !== chkBotLoop) chkBotLoop.checked = acc.status === 'running';

    const chkBot = document.getElementById(`chk-bot-${acc.line_uid}`);
    if (document.activeElement !== chkBot) chkBot.checked = acc.settings.bot == 1;

    const chkLock = document.getElementById(`chk-lock_pos-${acc.line_uid}`);
    if (document.activeElement !== chkLock) chkLock.checked = acc.settings.lock_pos == 1;

    const chkAutoGear = document.getElementById(`chk-autogear-${acc.line_uid}`);
    if (chkAutoGear && document.activeElement !== chkAutoGear) chkAutoGear.checked = acc.settings.autoGear === true;

    const chkBossHuntEnabled = document.getElementById(`chk-bosshuntenabled-${acc.line_uid}`);
    if (chkBossHuntEnabled && document.activeElement !== chkBossHuntEnabled) {
      chkBossHuntEnabled.checked = acc.settings.bossHuntEnabled === true;
    }

    const chkAutoArena = document.getElementById(`chk-autoarena-${acc.line_uid}`);
    if (chkAutoArena && document.activeElement !== chkAutoArena) chkAutoArena.checked = acc.settings.autoArena === true;

    const chkAutoEnterGdunAt30 = document.getElementById(`chk-autoentergdunat30-${acc.line_uid}`);
    if (chkAutoEnterGdunAt30 && document.activeElement !== chkAutoEnterGdunAt30) {
      chkAutoEnterGdunAt30.checked = acc.settings.autoEnterGdunAt30 === true;
    }

    // Event settings checkboxes sync
    const chkAutoEventJoinInv = document.getElementById(`chk-auto-event-join-inv-${acc.line_uid}`);
    if (chkAutoEventJoinInv && document.activeElement !== chkAutoEventJoinInv) {
      chkAutoEventJoinInv.checked = acc.settings.autoEventJoinInv === true;
    }
    const chkAutoEventJoinGw = document.getElementById(`chk-auto-event-join-gw-${acc.line_uid}`);
    if (chkAutoEventJoinGw && document.activeElement !== chkAutoEventJoinGw) {
      chkAutoEventJoinGw.checked = acc.settings.autoEventJoinGw === true;
    }
    const chkAutoEventJoinCw = document.getElementById(`chk-auto-event-join-cw-${acc.line_uid}`);
    if (chkAutoEventJoinCw && document.activeElement !== chkAutoEventJoinCw) {
      chkAutoEventJoinCw.checked = acc.settings.autoEventJoinCw === true;
    }

    const selEventPotion = document.getElementById(`sel-event-potion-threshold-${acc.line_uid}`);
    if (selEventPotion && document.activeElement !== selEventPotion) {
      selEventPotion.value = acc.settings.eventPotionThreshold !== undefined ? String(acc.settings.eventPotionThreshold) : '0';
    }

    const chkEventTargetMinDef = document.getElementById(`chk-event-target-mindef-${acc.line_uid}`);
    if (chkEventTargetMinDef && document.activeElement !== chkEventTargetMinDef) chkEventTargetMinDef.checked = acc.settings.eventTargetMinDef === true;

    const selEventRange = document.getElementById(`sel-event-attack-range-${acc.line_uid}`);
    if (selEventRange && document.activeElement !== selEventRange) {
      selEventRange.value = acc.settings.eventAttackRange !== undefined ? String(acc.settings.eventAttackRange) : '300';
    }

    // MVP Boss settings sync
    const selBossHuntPriority = document.getElementById(`sel-boss-hunt-priority-${acc.line_uid}`);
    if (selBossHuntPriority && document.activeElement !== selBossHuntPriority) {
      selBossHuntPriority.value = acc.settings.bossHuntPriority || 'distance';
    }

    const mapsContainer = document.getElementById(`boss-hunt-maps-container-${acc.line_uid}`);
    if (mapsContainer) {
      const selectedMaps = acc.settings.bossHuntMaps || [];
      if (selectedMaps.length === 0) {
        mapsContainer.innerHTML = `<span style="font-size: 0.75rem; color: #64748b; font-style: italic; display: block; text-align: center; width: 100%; margin: 6px 0;">Chưa chọn bản đồ nào. Nhấp "+ Thêm Map" để chọn.</span>`;
      } else {
        mapsContainer.innerHTML = selectedMaps.map((mapId, index) => {
          const mapDef = (window.cachedMapsList || []).find(m => m.id === mapId);
          const mapName = mapDef ? `${mapDef.emoji || '🗺️'} ${mapDef.name} (Lv.${mapDef.req}+)` : `Bản đồ #${mapId}`;
          return `
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; padding: 4px 6px; font-size: 0.8rem; color: #f8fafc;">
              <span style="font-weight: 500; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--primary-color); font-size: 0.75rem; font-weight: bold;">#${index + 1}</span>
                ${mapName}
              </span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <button type="button" onclick="moveBossHuntMap('${acc.line_uid}', ${index}, -1)" ${index === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 1px 4px; border-radius: 3px; font-size: 0.7rem; cursor: pointer;">↑</button>
                <button type="button" onclick="moveBossHuntMap('${acc.line_uid}', ${index}, 1)" ${index === selectedMaps.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 1px 4px; border-radius: 3px; font-size: 0.7rem; cursor: pointer;">↓</button>
                <button type="button" onclick="removeBossHuntMap('${acc.line_uid}', ${index})" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 1px 4px; border-radius: 3px; font-size: 0.7rem; cursor: pointer; margin-left: 2px;">🗑️</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Team role settings sync
    const selTeamRole = document.getElementById(`sel-team-role-${acc.line_uid}`);
    if (selTeamRole && document.activeElement !== selTeamRole) {
      selTeamRole.value = acc.settings.teamRole || 'none';
    }
    const selTeamId = document.getElementById(`sel-team-id-${acc.line_uid}`);
    if (selTeamId && document.activeElement !== selTeamId) {
      selTeamId.value = acc.settings.teamId || 'none';
    }
    const btnSyncTeam = document.getElementById(`btn-sync-team-${acc.line_uid}`);
    if (btnSyncTeam) {
      const isLeaderWithTeam = acc.settings.teamRole === 'leader' && (acc.settings.teamId || 'none') !== 'none';
      btnSyncTeam.style.display = isLeaderWithTeam ? 'block' : 'none';
    }


    // Auto Potion threshold sync
    const selPotion = document.getElementById(`sel-auto-potion-threshold-${acc.line_uid}`);
    if (selPotion && document.activeElement !== selPotion) {
      selPotion.value = acc.settings.auto_potion_threshold !== undefined ? String(acc.settings.auto_potion_threshold) : '50';
    }

    // Urgent Active Potion Healing sync
    const chkActiveHeal = document.getElementById(`chk-active-heal-enabled-${acc.line_uid}`);
    if (chkActiveHeal && document.activeElement !== chkActiveHeal) {
      chkActiveHeal.checked = (acc.settings.activeHealEnabled === true);
    }
    const selActiveHealThreshold = document.getElementById(`sel-active-heal-threshold-${acc.line_uid}`);
    if (selActiveHealThreshold && document.activeElement !== selActiveHealThreshold) {
      selActiveHealThreshold.value = acc.settings.activeHealThreshold !== undefined ? String(acc.settings.activeHealThreshold) : '50';
    }

    // Poll Interval sync
    const selPollInterval = document.getElementById(`sel-poll-interval-${acc.line_uid}`);
    if (selPollInterval && document.activeElement !== selPollInterval) {
      const defaultPoll = acc.ownerPollInterval !== undefined ? String(acc.ownerPollInterval) : '2000';
      selPollInterval.value = acc.settings.pollInterval !== undefined ? String(acc.settings.pollInterval) : defaultPoll;
    }

    // Auto Map toggle & map select sync
    const chkAutoMap = document.getElementById(`chk-automap-${acc.line_uid}`);
    if (chkAutoMap && document.activeElement !== chkAutoMap) chkAutoMap.checked = acc.settings.autoMap === true;

    populateMapSelect(acc);

    // Auto Zone toggle & zone select: populate from acc.spots then sync value
    const chkAutoZone = document.getElementById(`chk-autozone-${acc.line_uid}`);
    if (chkAutoZone && document.activeElement !== chkAutoZone) chkAutoZone.checked = acc.settings.autoZone === true;

    const chkLockZoneCenter = document.getElementById(`chk-lock_zone_center-${acc.line_uid}`);
    if (chkLockZoneCenter && document.activeElement !== chkLockZoneCenter) chkLockZoneCenter.checked = acc.settings.lock_zone_center === true;

    populateZoneSelect(acc);

    // Proxy badge
    const proxyBadge = document.getElementById(`proxy-badge-${acc.line_uid}`);
    if (proxyBadge) {
      if (currentUser && currentUser.role === 'admin' && acc.proxyInfo) {
        const info = acc.proxyInfo;
        proxyBadge.textContent = `🌐 ${info.label}`;
        proxyBadge.style.background = info.isDirect ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)';
        proxyBadge.style.color      = info.isDirect ? '#34d399' : '#818cf8';
        proxyBadge.style.borderColor= info.isDirect ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)';
        proxyBadge.style.display    = '';
      } else {
        proxyBadge.style.display    = 'none';
      }
    }

    // Admin proxy configuration sync
    const proxyCtrl = document.getElementById(`admin-proxy-ctrl-${acc.line_uid}`);
    if (proxyCtrl) {
      if (currentUser && currentUser.role === 'admin') {
        proxyCtrl.style.display = 'block';
        const selProxy = document.getElementById(`sel-proxy-${acc.line_uid}`);
        if (selProxy) {
          const currentVal = acc.proxyId || 'auto';
          let optionsHtml = `
            <option value="auto" ${currentVal === 'auto' ? 'selected' : ''}>🔄 Tự động gán (Auto)</option>
            <option value="direct" ${currentVal === 'direct' ? 'selected' : ''}>🖥️ Kết nối trực tiếp (Direct)</option>
          `;
          adminProxiesList.forEach(p => {
            optionsHtml += `<option value="${p.id}" ${currentVal === p.id ? 'selected' : ''}>🌐 ${p.label}</option>`;
          });
          if (selProxy.getAttribute('data-loaded-count') !== String(adminProxiesList.length) || selProxy.value !== currentVal) {
            selProxy.innerHTML = optionsHtml;
            selProxy.setAttribute('data-loaded-count', String(adminProxiesList.length));
            selProxy.value = currentVal;
          }
        }
      } else {
        proxyCtrl.style.display = 'none';
      }
    }

    // Core Stats allocation & Combat summary UI
    const ptsBadge = document.getElementById(`pts-val-${acc.line_uid}`);
    if (ptsBadge) ptsBadge.textContent = p.stat_pts || 0;

    renderStatsList(acc);
    renderCombatSummary(acc);
    renderCardBook(acc);
    renderEggBook(acc);
    renderPetSection(acc);
    updateHomeTabUI(acc);
    renderWeaponTab(acc);

    // Handle Trade Invites
    window._currentTradeTid = window._currentTradeTid || {};
    const trBanner = document.getElementById(`trade-invite-banner-${acc.line_uid}`);
    const trFrom = document.getElementById(`trade-invite-from-${acc.line_uid}`);
    if (acc.tradeInvite) {
      window._currentTradeTid[acc.line_uid] = acc.tradeInvite.tid;
      if (trBanner) trBanner.style.display = 'flex';
      if (trFrom) trFrom.textContent = acc.tradeInvite.from_name || 'Người chơi';
      if (typeof showTradePopup === 'function') {
        showTradePopup(acc.line_uid, acc.tradeInvite);
      }
    } else {
      if (trBanner) trBanner.style.display = 'none';
    }
    if (typeof tradeTimerTick === 'function') {
      tradeTimerTick(acc.line_uid);
    }



    // Render real-time event banner
    const eventBanner = document.getElementById(`event-banner-${acc.line_uid}`);
    if (eventBanner) {
      let activeEvent = null;
      let eventTitle = '';
      let eventMapId = 0;
      let joinAction = '';
      let bannerBg = 'rgba(245, 158, 11, 0.15)';
      let bannerBorder = '1px solid rgba(245, 158, 11, 0.3)';
      let bannerColor = '#fde68a';

      if (acc.lastGw && (acc.lastGw.st === 'open' || acc.lastGw.st === 'fight')) {
        activeEvent = acc.lastGw;
        eventTitle = `🚩 Guild Flag War: ${acc.lastGw.st === 'open' ? 'Phòng Chờ' : 'Đang Chiến Đấu'}`;
        eventMapId = 4;
        joinAction = 'gwar_join';
        bannerBg = 'rgba(168, 85, 247, 0.15)';
        bannerBorder = '1px solid rgba(168, 85, 247, 0.3)';
        bannerColor = '#e9d5ff';
      } else if (acc.lastCw && (acc.lastCw.st === 'open' || acc.lastCw.st === 'fight')) {
        activeEvent = acc.lastCw;
        eventTitle = `🌍 Country Flag War: ${acc.lastCw.st === 'open' ? 'Phòng Chờ' : 'Đang Chiến Đấu'}`;
        eventMapId = 4;
        joinAction = 'cwar_join';
        bannerBg = 'rgba(14, 165, 233, 0.15)';
        bannerBorder = '1px solid rgba(14, 165, 233, 0.3)';
        bannerColor = '#bae6fd';
      } else if (acc.lastInv && (acc.lastInv.st === 'pre' || acc.lastInv.st === 'active')) {
        activeEvent = acc.lastInv;
        eventTitle = `🌳 Bảo Vệ Cây Thế Giới: ${acc.lastInv.st === 'pre' ? 'Chuẩn Bị' : 'Đang Chiến Đấu'}`;
        eventMapId = 2;
        joinAction = 'inv_join';
        bannerBg = 'rgba(239, 68, 68, 0.15)';
        bannerBorder = '1px solid rgba(239, 68, 68, 0.3)';
        bannerColor = '#fca5a5';
      }

      if (activeEvent) {
        eventBanner.style.display = 'block';
        eventBanner.style.background = bannerBg;
        eventBanner.style.border = bannerBorder;
        eventBanner.style.color = bannerColor;

        let timeStr = '';
        if (activeEvent.ends) {
          const leftSecs = Math.max(0, activeEvent.ends - Math.floor(Date.now() / 1000));
          timeStr = leftSecs >= 60 ? `${Math.floor(leftSecs/60)}m ${leftSecs%60}s` : `${leftSecs}s`;
        } else if (activeEvent.in) {
          const leftSecs = Math.max(0, activeEvent.in);
          timeStr = leftSecs >= 60 ? `${Math.floor(leftSecs/60)}m ${leftSecs%60}s` : `${leftSecs}s`;
        }

        const isAlreadyThere = acc.player && Number(acc.player.map) === Number(eventMapId);

        let buttonHtml = '';
        if (!isAlreadyThere) {
          buttonHtml = `
            <button type="button" onclick="joinEventDirectly('${acc.line_uid}', '${joinAction}')" 
              style="margin-top: 5px; font-size: 0.72rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid ${bannerColor}; background: transparent; color: ${bannerColor}; cursor: pointer; transition: all 0.2s; outline: none;"
              onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="transparent">
              🏜️ Tham Gia Event
            </button>
          `;
        } else {
          buttonHtml = `
            <span style="font-size: 0.65rem; color: #34d399; margin-top: 4px; display: block;">📍 Bạn đã ở bản đồ Event</span>
          `;
        }

        eventBanner.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>🎁 <b>Sự kiện kích hoạt:</b> ${eventTitle}</span>
            ${timeStr ? `<span style="font-size: 0.65rem; opacity: 0.8;">⏱️ ${timeStr}</span>` : ''}
          </div>
          ${buttonHtml}
        `;
      } else {
        eventBanner.style.display = 'none';
      }
    }

    // Render real-time boss hunt banner
    const banner = document.getElementById(`boss-hunt-banner-${acc.line_uid}`);
    if (banner) {
      if (acc.bossHuntActive) {
        banner.style.display = 'block';
        if (acc.currentMvpBossInfo) {
          const b = acc.currentMvpBossInfo;
          // Calculate elapsed time
          const elapsedSecs = Math.round((Date.now() - b.startTs) / 1000);
          const timeStr = elapsedSecs >= 60 ? `${Math.floor(elapsedSecs/60)}m ${elapsedSecs%60}s` : `${elapsedSecs}s`;
          
          let statusText = `⚔️ <b>Đang săn:</b> ${b.emoji || '👾'} <b>${b.name}</b> Lv.${b.lv}`;
          if (acc.isMvpCycling) {
            statusText = `🗺️ <b>Chu kỳ Săn:</b> ${statusText}`;
          }
          
          banner.className = "boss-hunt-banner hunting";
          banner.style.background = 'rgba(239, 68, 68, 0.15)';
          banner.style.border = '1px solid rgba(239, 68, 68, 0.3)';
          banner.style.color = '#fca5a5';
          banner.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
              <span>${statusText}</span>
              <span style="font-size: 0.65rem; color: #f87171;">⏱️ ${timeStr}</span>
            </div>
          `;
        } else if (acc.isMvpCycling) {
          // In cycle but no active boss target yet
          banner.className = "boss-hunt-banner cycling";
          banner.style.display = 'block';
          banner.style.background = 'rgba(99, 102, 241, 0.15)';
          banner.style.border = '1px solid rgba(99, 102, 241, 0.3)';
          banner.style.color = '#a5b4fc';
          banner.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
              <span>🗺️ <b>Chu kỳ Săn Boss:</b> Tìm mục tiêu trên Map ${p.map || '--'}...</span>
              <span style="font-size: 0.65rem; color: #818cf8;">⏳ Quét Boss</span>
            </div>
          `;
        } else if (acc.settings.bossHuntEnabled === true) {
          // Chờ chu kỳ tiếp theo
          banner.className = "boss-hunt-banner idle";
          banner.style.display = 'block';
          banner.style.background = 'rgba(99, 102, 241, 0.08)';
          banner.style.border = '1px solid rgba(99, 102, 241, 0.2)';
          banner.style.color = '#a5b4fc';
          banner.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>🗺️ <b>Tự động Săn Boss:</b> Chờ chu kỳ săn tiếp theo — Map ${p.map || '--'}</span>
              <span style="font-size: 0.65rem;">⏳ Chờ chu kỳ</span>
            </div>
          `;
        }
      } else {
        banner.style.display = 'none';
      }
    }

    // Render live boss list inside Săn Boss tab pane
    const liveBossesSection = document.getElementById(`live-bosses-section-${acc.line_uid}`);
    if (liveBossesSection) {
      if (acc.bossHuntActive && acc.aliveBosses && acc.aliveBosses.length > 0) {
        liveBossesSection.style.display = 'block';
        const badgeEl = document.getElementById(`live-boss-count-badge-${acc.line_uid}`);
        if (badgeEl) badgeEl.textContent = `${acc.aliveBosses.length} Boss`;
        
        const listEl = document.getElementById(`live-bosses-list-${acc.line_uid}`);
        if (listEl) {
          listEl.innerHTML = acc.aliveBosses.map(b => {
            const hpPct = b.hp_max > 0 ? Math.round((b.hp / b.hp_max) * 100) : 0;
            // Calculate distance to boss
            const dx = (p.x || 0) - (b.x || 0);
            const dy = (p.y || 0) - (b.y || 0);
            const dist = Math.round(Math.sqrt(dx*dx + dy*dy));
            
            const targetIcon = b.isTarget ? '🎯 ' : '';
            const targetClass = b.isTarget ? 'target' : '';
            const approachText = dist <= 5 ? 'Đã áp sát' : `${dist}m`;
            
            return `
              <div class="live-boss-item ${targetClass}" style="display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; border-radius: 6px; border: 1px solid ${b.isTarget ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}; background: ${b.isTarget ? 'rgba(251,191,36,0.08)' : 'rgba(0,0,0,0.2)'}; font-size: 0.72rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 600; color: ${b.isTarget ? '#fbbf24' : '#fff'};">${targetIcon}${b.emoji} ${b.name} <span style="font-size: 0.65rem; color: var(--text-muted);">Lv.${b.lv}</span></span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.65rem; color: ${b.isTarget ? '#fbbf24' : 'var(--text-secondary)'}; font-weight: 600;">📍 ${approachText} (${b.x}, ${b.y})</span>
                    <button type="button" onclick="selectBossTarget('${acc.line_uid}', ${b.isTarget ? 'null' : `'${b.id}'`})" 
                      style="font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid ${b.isTarget ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}; background: ${b.isTarget ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}; color: ${b.isTarget ? '#4ade80' : '#e2e8f0'}; cursor: pointer; transition: all 0.2s;"
                      title="${b.isTarget ? 'Nhấn để hủy ưu tiên săn boss này, quay lại tự động' : 'Click để ưu tiên săn boss này'}">
                      ${b.isTarget ? '✅ Nhắm' : '🎯 Chọn'}
                    </button>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="hp-bar-mini-container" style="flex: 1; height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                    <div class="hp-bar-mini-fill" style="width: ${hpPct}%; height: 100%; background: ${hpPct <= 30 ? '#ef4444' : '#eab308'}; border-radius: 3px; transition: width 0.3s;"></div>
                  </div>
                  <span style="font-size: 0.65rem; min-width: 65px; text-align: right; color: var(--text-muted); font-family: monospace;">${b.hp.toLocaleString()}/${b.hp_max.toLocaleString()} (${hpPct}%)</span>
                </div>
              </div>
            `;
          }).join('');
        }
      } else if (acc.bossHuntActive) {
        liveBossesSection.style.display = 'block';
        const badgeEl = document.getElementById(`live-boss-count-badge-${acc.line_uid}`);
        if (badgeEl) badgeEl.textContent = '0 Boss';
        
        const listEl = document.getElementById(`live-bosses-list-${acc.line_uid}`);
        if (listEl) {
          listEl.innerHTML = `<div style="text-align: center; padding: 12px 0; font-size: 0.72rem; color: var(--text-muted);">Chưa phát hiện Boss nào trên Map ${p.map || ''}</div>`;
        }
      } else {
        liveBossesSection.style.display = 'none';
      }
    }

    // Render tab contents based on active state
    const currentTab = activeTabs[acc.line_uid];
    if (currentTab === 'log' && (activeLogSubTabs[acc.line_uid] || 'act') === 'act') {
      fetchLogs(acc.line_uid);
    }
  }
  window.updateCard = updateCard;

  // Populate map dropdown from dynamic mapsList returned by server
  function populateMapSelect(acc) {
    const selMap = document.getElementById(`sel-map-${acc.line_uid}`);
    if (!selMap) return;
    const mapsList = acc.mapsList || window.cachedMapsList || [
      { id: 1, name: 'Thung lũng Trung tâm',  emoji: '🌿', req: 1  },
      { id: 2, name: 'Sa mạc Vĩnh hằng',      emoji: '🏜️', req: 25 },
      { id: 3, name: 'Vùng đất Băng giá',     emoji: '❄️', req: 40 },
      { id: 4, name: 'Đấu trường Arena (PVP)', emoji: '⚔️', req: 20 },
      { id: 5, name: 'Tàn tích Cổ đại',      emoji: '🏛️', req: 55 },
      { id: 6, name: 'Núi lửa Sôi trào',      emoji: '🌋', req: 70 },
    ];
    if (acc.mapsList) window.cachedMapsList = acc.mapsList;

    const currentTargetMap = acc.settings && acc.settings.targetMap !== undefined ? String(acc.settings.targetMap) : String(acc.player ? acc.player.map : 1);
    const hash = mapsList.map(m => `${m.id}:${m.name}:${m.req}`).join('|');

    if (selMap.dataset.hash !== hash) {
      selMap.innerHTML = mapsList.map(m =>
        `<option value="${m.id}">${m.emoji || '🗺️'} ${m.name} (Lv.${m.req}+)</option>`
      ).join('');
      selMap.dataset.hash = hash;
    }
    if (document.activeElement !== selMap && selMap.value !== currentTargetMap) {
      selMap.value = currentTargetMap;
    }
  }

  // Populate zone dropdown from spots data returned by server
  function populateZoneSelect(acc) {
    const sel = document.getElementById(`sel-zone-${acc.line_uid}`);
    if (!sel) return;

    // Priority: live spots from bot > cachedSpots for current map (from spotsCache) > empty
    const currentMapId = acc.player && acc.player.map;
    const spots = acc.spots || (currentMapId ? acc.cachedSpots : null);

    if (!spots || typeof spots !== 'object') {
      sel.innerHTML = `<option value="">⏳ Chờ tải dữ liệu Zone...</option>`;
      return;
    }

    const spotsList = Object.values(spots);
    if (spotsList.length === 0) {
      sel.innerHTML = `<option value="">🗺️ Không có Zone trên bản đồ này</option>`;
      return;
    }

    // Only re-render if spots list changed or map changed (avoid dropdown flicker)
    const currentCount = sel.querySelectorAll('option[value]').length;
    if (currentCount !== spotsList.length || sel.dataset.lastMap !== String(currentMapId)) {
      sel.dataset.lastMap = String(currentMapId);
      sel.innerHTML = `<option value="">🗺️ Chọn khu vực (Zone)...</option>`;
      spotsList.forEach((spot, idx) => {
        const opt = document.createElement('option');
        opt.value = String(idx);
        opt.textContent = `${spot.emoji || '📍'} ${spot.name}`;
        sel.appendChild(opt);
      });
    }

    // Sync selected value to settings (skip if user is interacting)
    if (document.activeElement !== sel) {
      const targetIdx = acc.settings.targetZone;
      sel.value = (targetIdx !== undefined && targetIdx !== null) ? String(targetIdx) : '';
    }
  }

  // Render stats list
  const STAT_DESCS = {
    str: { label: 'STR', name: 'Sức mạnh', color: '#f43f5e', desc: '+ATK Cận chiến & +Max Armor' },
    agi: { label: 'AGI', name: 'Linh hoạt', color: '#10b981', desc: '+Tốc bắn & Né tránh' },
    vit: { label: 'VIT', name: 'Thể lực', color: '#0ea5e9', desc: '+Max HP, +DEF & +Max Armor' },
    intel: { label: 'INT', name: 'Trí tuệ', color: '#8b5cf6', desc: '+Max MP & +Sát thương ป้อม' },
    dex: { label: 'DEX', name: 'Khéo léo', color: '#f59e0b', desc: '+ATK Dao nổ & Dao dài' },
    luk: { label: 'LUK', name: 'May mắn', color: '#ec4899', desc: '+Tỷ lệ Chí mạng CRIT %' }
  };

  function renderStatsList(acc) {
    const el = document.getElementById(`stats-list-${acc.line_uid}`);
    if (!el) return;
    
    const p = acc.player;
    const stats = ['str', 'agi', 'vit', 'intel', 'dex', 'luk'];
    const pts = p.stat_pts || 0;
    const canUp1 = pts >= 1;
    const canUp5 = pts >= 5;

    let html = '';
    stats.forEach(st => {
      const meta = STAT_DESCS[st];
      const baseVal = p[st] || 5;
      const effVal = p[`${st}_eff`] || baseVal;
      const bonus = effVal - baseVal;
      const bonusText = bonus > 0 ? `<span style="color:#10b981; font-size:0.75rem; font-weight:700;">(+${bonus})</span>` : '';
      
      html += `
        <div class="stat-alloc-card">
          <div class="stat-alloc-head">
            <span class="stat-alloc-name" style="color:${meta.color}; font-weight:700;">${meta.label} <small style="font-weight:400; color:var(--text-secondary); font-size:0.7rem;">(${meta.name})</small></span>
            <span class="stat-alloc-val"><b style="color:#f8fafc; font-size:0.9rem;">${baseVal}</b> ${bonusText}</span>
          </div>
          <div class="stat-alloc-btns">
            <button class="btn-stat-up" ${canUp1 ? '' : 'disabled'} title="Cộng 1 điểm" onclick="triggerAction('${acc.line_uid}', 'stat_up', '${st}', { amount: 1 })">+1</button>
            <button class="btn-stat-up" ${canUp5 ? '' : 'disabled'} title="Cộng 5 điểm" onclick="triggerAction('${acc.line_uid}', 'stat_up', '${st}', { amount: 5 })">+5</button>
            <button class="btn-stat-up btn-stat-all" ${canUp1 ? '' : 'disabled'} title="Cộng tất cả ${pts} điểm vào ${meta.label}" onclick="triggerAction('${acc.line_uid}', 'stat_up', '${st}', { amount: ${pts} })">ALL</button>
          </div>
        </div>
      `;
    });
    el.innerHTML = html;
  }

  function renderCombatSummary(acc) {
    const el = document.getElementById(`combat-summary-${acc.line_uid}`);
    if (!el) return;
    const p = acc.player;

    const items = [
      { label: '❤️ Max HP', val: `${p.hp_max_eff || p.hp_max || 100}`, color: '#22c55e' },
      { label: '🔷 Max MP', val: `${p.mp_max_calc || 75}`, color: '#6366f1' },
      { label: '🛡️ Max Giáp', val: `${p.armor_max_calc || 100}`, color: '#64748b' },
      { label: '🔰 DEF', val: `${p.def_calc || 10}`, color: '#0ea5e9' },
      { label: '💥 CRIT %', val: `${p.crit_pct || 0}%`, color: '#f59e0b' },
      { label: '💨 Dodge %', val: `${p.dodge_pct || 0}%`, color: '#14b8a6' },
      { label: '🗡️ Pistol ATK', val: `${p.atk_pistol || 20}`, color: '#f43f5e' },
      { label: '🏹 Sniper ATK', val: `${p.atk_sniper || 120}`, color: '#ec4899' },
      { label: '⚔️ Knife ATK', val: `${p.atk_knife || 10}`, color: '#10b981' },
      { label: '🗼 Turret ATK', val: `${p.atk_turret || 20}`, color: '#8b5cf6' }
    ];

    let html = '';
    items.forEach(it => {
      html += `
        <div class="combat-summary-card">
          <span class="combat-summary-label">${it.label}</span>
          <span class="combat-summary-value" style="color:${it.color};">${it.val}</span>
        </div>
      `;
    });
    el.innerHTML = html;
  }

  // Switch Tab
  window.switchTab = function(uid, tabId) {
    const isCurrentlyActive = activeTabs[uid] === tabId;
    const targetTabId = isCurrentlyActive ? null : tabId;
    activeTabs[uid] = targetTabId;
    
    const tabLinks = document.querySelectorAll(`#card-${uid} .tab-link`);
    tabLinks.forEach(link => {
      link.classList.toggle('active', targetTabId !== null && link.id === `tab-btn-${targetTabId}-${uid}`);
    });

    const panes = document.querySelectorAll(`#card-${uid} .tab-pane`);
    panes.forEach(pane => {
      pane.classList.toggle('active', targetTabId !== null && pane.id === `pane-${targetTabId}-${uid}`);
    });

    const content = document.querySelector(`#card-${uid} .card-tab-content`);
    if (content) {
      content.classList.toggle('active', targetTabId !== null);
    }

    // Cleanup active sub-pane intervals when switching away
    if (targetTabId !== 'event' && window._eventHistoryIntervals && window._eventHistoryIntervals[uid]) {
      clearInterval(window._eventHistoryIntervals[uid]);
      delete window._eventHistoryIntervals[uid];
    }
    if (targetTabId !== 'mvp' && window._bossLogIntervals && window._bossLogIntervals[uid]) {
      clearInterval(window._bossLogIntervals[uid]);
      delete window._bossLogIntervals[uid];
    }

    if (targetTabId === 'log') {
      const subTabId = activeLogSubTabs[uid] || 'act';
      switchLogSubTab(uid, subTabId);
    } else if (targetTabId === 'event') {
      const subTabId = activeEventSubTabs[uid] || 'cfg';
      switchEventSubTab(uid, subTabId);
    } else if (targetTabId === 'mvp') {
      const subTabId = activeMvpSubTabs[uid] || 'cfg';
      switchMvpSubTab(uid, subTabId);
    } else if (targetTabId === 'market-buy') {
      const subTabId = activeMarketSubTabs[uid] || 'live';
      switchMarketSubTab(uid, subTabId);
    } else {
      if (targetTabId) {
        fetchAccounts();
      }
    }
  };

  // Switch Sub-Tab inside Log Pane
  window.switchLogSubTab = function(uid, subTabId) {
    activeLogSubTabs[uid] = subTabId;
    
    const btnAct = document.getElementById(`log-subtab-btn-act-${uid}`);
    const btnLoot = document.getElementById(`log-subtab-btn-loot-${uid}`);
    const btnMarket = document.getElementById(`log-subtab-btn-market-${uid}`);

    const paneAct = document.getElementById(`log-subpane-act-${uid}`);
    const paneLoot = document.getElementById(`log-subpane-loot-${uid}`);
    const paneMarket = document.getElementById(`log-subpane-market-${uid}`);

    if (btnAct) btnAct.classList.toggle('active', subTabId === 'act');
    if (btnLoot) btnLoot.classList.toggle('active', subTabId === 'loot');
    if (btnMarket) btnMarket.classList.toggle('active', subTabId === 'market');

    if (paneAct) paneAct.style.display = subTabId === 'act' ? 'block' : 'none';
    if (paneLoot) paneLoot.style.display = subTabId === 'loot' ? 'block' : 'none';
    if (paneMarket) paneMarket.style.display = subTabId === 'market' ? 'block' : 'none';

    if (subTabId === 'act') {
      fetchLogs(uid);
    } else if (subTabId === 'loot') {
      fetchDropLogs(uid);
    } else if (subTabId === 'market') {
      fetchMarketHistory(uid);
    }
  };

  // Toggle Rate Unit for combat stats (/m -> /h -> /d)
  window.toggleRateUnit = function(uid) {
    const current = rateUnits[uid] || 'min';
    let next = 'min';
    if (current === 'min') next = 'hour';
    else if (current === 'hour') next = 'day';
    rateUnits[uid] = next;
    
    // Refresh card immediately
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) {
        updateCard(acc);
      }
    }
  };

  // Switch Sub-Tab inside Character Pane
  window.switchSubTab = function(uid, subTabId) {
    const btnStats = document.getElementById(`subtab-btn-stats-${uid}`);
    const btnSkills = document.getElementById(`subtab-btn-skills-${uid}`);
    const btnCards = document.getElementById(`subtab-btn-cards-${uid}`);
    const btnEggs = document.getElementById(`subtab-btn-eggs-${uid}`);

    const paneStats = document.getElementById(`subpane-stats-${uid}`);
    const paneSkills = document.getElementById(`subpane-skills-${uid}`);
    const paneCards = document.getElementById(`subpane-cards-${uid}`);
    const paneEggs = document.getElementById(`subpane-eggs-${uid}`);

    if (btnStats) btnStats.classList.toggle('active', subTabId === 'stats');
    if (btnSkills) btnSkills.classList.toggle('active', subTabId === 'skills');
    if (btnCards) btnCards.classList.toggle('active', subTabId === 'cards');
    if (btnEggs) btnEggs.classList.toggle('active', subTabId === 'eggs');

    if (paneStats) paneStats.style.display = subTabId === 'stats' ? 'block' : 'none';
    if (paneSkills) paneSkills.style.display = subTabId === 'skills' ? 'block' : 'none';
    if (paneCards) paneCards.style.display = subTabId === 'cards' ? 'block' : 'none';
    if (paneEggs) paneEggs.style.display = subTabId === 'eggs' ? 'block' : 'none';
  };

  // ==================== ⚔️ WEAPON TAB (100% IN-GAME DARK MODE) SYSTEM ====================
  const activeWeaponSubTabs = {};
  const activeWeaponInvFilters = {};
  const activeCardPicks = {}; // { [uid]: { weapon, slot, sidx } }
  const activeModManages = {}; // { [uid]: { [weapon]: boolean } }
  const activeModSelections = {}; // { [uid]: { [weapon]: Set<number> } }

  const MODULE_RARITY = [
    { id: 1, n: 'Thường', c: '#9ca3af', bg: 'rgba(156, 163, 175, 0.12)' },
    { id: 2, n: 'Cao cấp', c: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
    { id: 3, n: 'Hiếm', c: '#3b82f6', bg: 'rgba(59, 130, 246, 0.18)' },
    { id: 4, n: 'Sử thi', c: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
    { id: 5, n: 'Sử thi+', c: '#ec4899', bg: 'rgba(236, 72, 153, 0.22)' },
    { id: 6, n: 'Huyền thoại', c: '#f59e0b', bg: 'rgba(245, 158, 11, 0.25)' },
    { id: 7, n: 'Thần thoại', c: '#ef4444', bg: 'rgba(239, 68, 68, 0.28)' }
  ];

  const AMMO_TIER_ICONS = ['⚪', '🟢', '🔵', '🟣', '🟡', '🔴'];
  const AMMO_TIER_DMG = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
  const AMMO_TIER_UNLOCK_LV = [1, 10, 25, 50, 80, 100];

  function _ammoEnabledMask(p, gun) {
    if (gun === 'turret') {
      return (p.turret_tier_enabled != null && p.turret_tier_enabled !== '')
        ? (parseInt(p.turret_tier_enabled) || 0)
        : ((parseInt(p.sniper_tier_enabled) || 1) | 1);
    }
    if (gun === 'sniper') return parseInt(p.sniper_tier_enabled ?? p.ammo_sniper_tiers ?? 1) || 1;
    return parseInt(p.pistol_tier_enabled ?? p.ammo_pistol_tiers ?? 1) || 1;
  }

  function parseJsonSafe(str, defaultVal = {}) {
    if (!str) return defaultVal;
    if (typeof str === 'object') return str;
    try {
      return JSON.parse(str) || defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }


  function _ammoActiveT(p, gun) {
    const mask = _ammoEnabledMask(p, gun);
    const isSniperOrTurret = (gun === 'sniper' || gun === 'turret');
    for (let t = 6; t >= 2; t--) {
      if (!(mask & (1 << (t - 1)))) continue;
      const extraVal = isSniperOrTurret
        ? (p.sniper_ammo_extra ? p.sniper_ammo_extra[t - 2] : (parseInt(p[`ammo_sniper_t${t}`]) || 0))
        : (p.ammo_extra ? p.ammo_extra[t - 2] : (parseInt(p[`ammo_pistol_t${t}`]) || 0));
      if (extraVal > 0) return { tier: t, dmg: AMMO_TIER_DMG[t - 1] };
    }
    const t1Val = isSniperOrTurret ? (p.ammo_sniper || p.ammo_sniper_t1 || 0) : (p.ammo_pistol || p.ammo_pistol_t1 || 0);
    if ((mask & 1) && t1Val > 0) return { tier: 1, dmg: 1.0 };
    return { tier: 0, dmg: 1.0 };
  }

  function _renderAmmoTierStripHtml(uid, gun, p) {
    const mask = _ammoEnabledMask(p, gun);
    const activeT = _ammoActiveT(p, gun);
    const hLv = parseInt(p.home_lv || p.house_lv || 1);
    const isTurret = gun === 'turret';
    const isSniper = gun === 'sniper';
    const autoRefill = isSniper ? p.auto_refill_sniper : p.auto_refill_pistol;

    let tierBoxes = '';
    for (let t = 1; t <= 6; t++) {
      const unlock = AMMO_TIER_UNLOCK_LV[t - 1];
      const locked = hLv < unlock;
      const enabled = !locked && Boolean(mask & (1 << (t - 1)));
      const isActive = !locked && enabled && activeT.tier === t;
      const mult = AMMO_TIER_DMG[t - 1];
      
      let stock = 0;
      if (isTurret || isSniper) {
        if (t === 1) stock = parseInt(p.ammo_sniper ?? p.ammo_sniper_t1 ?? 0) || 0;
        else stock = (p.sniper_ammo_extra ? p.sniper_ammo_extra[t - 2] : (parseInt(p[`ammo_sniper_t${t}`]) || 0)) || 0;
      } else {
        if (t === 1) stock = parseInt(p.ammo_pistol ?? p.ammo_pistol_t1 ?? 0) || 0;
        else stock = (p.ammo_extra ? p.ammo_extra[t - 2] : (parseInt(p[`ammo_pistol_t${t}`]) || 0)) || 0;
      }

      const nextOn = enabled ? 0 : 1;
      const onclick = locked ? '' : `triggerAction('${uid}', 'set_ammo_tier_enabled', null, { gun: '${gun}', tier: ${t}, on: ${nextOn} })`;

      const bottomBtn = locked
        ? `<div style="font-size:0.58rem; font-weight:700; color:#fbbf24; background:rgba(245, 158, 11, 0.2); border-radius:3px; padding:2px 0; line-height:1.1; width:100%; box-sizing:border-box; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="Yêu cầu Phi Thuyền Lv.${unlock}">Lv.${unlock}</div>`
        : `<button onclick="event.stopPropagation(); ${onclick}" style="font-size:0.62rem; padding:2px 0; width:100%; border-radius:3px; border:none; font-weight:700; background:${enabled ? '#16a34a' : '#475569'}; color:#fff; cursor:pointer;">${enabled ? 'BẬT' : 'TẮT'}</button>`;

      tierBoxes += `
        <div onclick="${onclick}" style="background:${locked ? 'rgba(15, 23, 42, 0.4)' : (enabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.75)')}; border:${isActive ? '2px solid #f59e0b' : (enabled ? '1.5px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)')}; border-radius:6px; padding:4px 2px; text-align:center; cursor:${locked ? 'default' : 'pointer'}; opacity:${locked ? 0.6 : 1}; display:flex; flex-direction:column; justify-content:space-between; gap:2px; min-width:0; box-sizing:border-box; width:100%; overflow:hidden;">
          <div style="font-size:0.68rem; color:${enabled ? '#86efac' : '#94a3b8'}; white-space:nowrap; font-weight:700; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:2px;">
            <span>${AMMO_TIER_ICONS[t - 1]}T${t}</span> <span style="font-size:0.58rem; color:#fcd34d;">×${mult.toFixed(1)}</span>
          </div>
          <div style="font-size:0.8rem; font-weight:700; color:${locked ? '#64748b' : (stock > 0 ? '#f8fafc' : '#ef4444')}; margin:1px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${locked ? '🔒' : stock}
          </div>
          ${bottomBtn}
        </div>
      `;
    }

    const titleText = isTurret
      ? '🗼 Cấu Hình Đạn Pháo Tháp (Bắn đạn Dao Dài)'
      : `🎒 Quản Lý Đạn (${isSniper ? 'Dao Dài' : 'Dao Găm'})`;

    const activeInfo = isTurret
      ? '💣 Pháo tháp ưu tiên bắn đạn Tier cao nhất có sẵn trong kho (DMG lên tới ×2.0).'
      : (activeT.tier > 0 ? `🗡️ Đạn đang dùng: <b>${AMMO_TIER_ICONS[activeT.tier - 1]} Tier ${activeT.tier}</b> — Sát thương <b>DMG ×${activeT.dmg.toFixed(1)}</b>` : '⚠️ Hết đạn hoặc chưa bật Tier đạn nào!');

    const refillCheckbox = isTurret ? '' : `
      <label style="font-size:0.72rem; color:#cbd5e1; display:flex; align-items:center; gap:4px; cursor:pointer; white-space:nowrap;">
        <input type="checkbox" ${autoRefill ? 'checked' : ''} onchange="triggerAction('${uid}', 'auto_refill', null, { gun_type: '${gun}' })"> Tự nạp đạn (Auto Refill)
      </label>
    `;

    return `
      <div style="background:rgba(15, 23, 42, 0.85); border:1px solid rgba(255, 255, 255, 0.1); border-radius:10px; padding:8px 10px; margin-top:8px; width:100%; box-sizing:border-box; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:4px;">
          <span style="font-size:0.78rem; font-weight:800; color:#a5b4fc;">${titleText}</span>
          ${refillCheckbox}
        </div>
        <div style="display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:4px; width:100%; box-sizing:border-box;">
          ${tierBoxes}
        </div>
        <div style="font-size:0.68rem; color:#94a3b8; margin-top:6px; padding-top:4px; border-top:1px dashed rgba(255, 255, 255, 0.08); overflow:hidden; text-overflow:ellipsis;">
          ${activeInfo}
        </div>
      </div>
    `;
  }

  function _rarBg(r) {
    return r >= 7 ? 'background:linear-gradient(90deg,#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa)' : `background:${(MODULE_RARITY[r-1]||MODULE_RARITY[0]).c}`;
  }

  function _modEnhCost(to) {
    return { blue: to, red: to >= 6 ? to - 5 : 0, green: to >= 12 ? to - 11 : 0, gold: Math.max(1, to) * 1000 };
  }

  function _modRate(to) {
    return to <= 5 ? 100 : (to === 6 ? 90 : (to <= 11 ? (150 - to * 10) : 30));
  }

  function calcTierGold(lv) {
    const START = [100, 1000, 10000, 100000, 1000000, 10000000, 50000000];
    const END = [1000, 10000, 100000, 1000000, 10000000, 50000000, 100000000];
    const b = Math.min(6, Math.max(0, Math.floor((lv - 1) / 10)));
    const pos = (lv - 1) % 10;
    return Math.round(START[b] + pos * (END[b] - START[b]) / 9);
  }

  function calcTierRes(lv) {
    const START_RES = [10, 50, 200, 1000, 5000, 20000, 50000];
    const END_RES = [50, 200, 1000, 5000, 20000, 50000, 100000];
    const b = Math.min(6, Math.max(0, Math.floor((lv - 1) / 10)));
    const pos = (lv - 1) % 10;
    return Math.round(START_RES[b] + pos * (END_RES[b] - START_RES[b]) / 9);
  }

  function _upgCostMult(lv) {
    return lv >= 20 ? (1.0 + 0.25 * (Math.floor(lv / 10) - 1)) : 1.0;
  }

  function _pmodsObj(player, weapon) {
    const f = (weapon || 'pistol') + '_modules';
    const v = player && player[f];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try {
        const o = JSON.parse(v);
        return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
      } catch (e) {}
    }
    return {};
  }

  function _modSlotsFor(w) {
    if (w === 'robot') return [
      { key: 'core_back', name: 'Lõi Lưng (Back)', icon: '🔋', stat: '⚡ Năng lượng + 🔋 Recover' },
      { key: 'core_brain', name: 'Lõi Não (Brain)', icon: '🧠', stat: '⚡ Năng lượng + 🔋 Recover' },
      { key: 'core_center', name: 'Lõi Trung Tâm', icon: '🔩', stat: '⚡ Năng lượng + 🔋 Recover' }
    ];
    if (w === 'house') return [
      { key: 'h_roof', name: 'Module Mái', icon: '🏠', stat: '⚡ Năng lượng Phi Thuyền' },
      { key: 'h_wall', name: 'Module Tường', icon: '🧱', stat: '⚡ Năng lượng Phi Thuyền' },
      { key: 'h_floor', name: 'Module Sàn', icon: '▦', stat: '⚡ Năng lượng Phi Thuyền' }
    ];
    if (w === 'armor') return [
      { key: 'a_max', name: 'Lõi Giáp MAX', icon: '🛡️', stat: '+Giáp tối đa' },
      { key: 'a_regen', name: 'Lõi Hồi Giáp', icon: '♻️', stat: '+Hồi giáp/s' },
      { key: 'a_return', name: 'Lõi Phản Sát Thương', icon: '⚡', stat: 'Phản dame % + ATK' }
    ];
    if (w === 'turret') return [
      { key: 't_atk', name: 'Lõi Tấn Công', icon: '🎯', stat: '+ATK (Tổng Module)' },
      { key: 't_range', name: 'Lõi Tầm Bắn', icon: '🔭', stat: '+Tầm 1m/Lv · +ATK' },
      { key: 't_dur', name: 'Lõi Bền Bỉ', icon: '⏳', stat: '+Thời gian 0.5s/Lv · +ATK' }
    ];
    if (w === 'knife') return [
      { key: 'barrel', name: 'Lưỡi Kiếm', icon: '🔪', stat: 'Tầm chém + ATK' },
      { key: 'sight', name: 'Chuôi Kiếm', icon: '🤺', stat: 'Tầm với + ATK' },
      { key: 'mag', name: 'Lưỡi Phụ', icon: '⚔️', stat: 'ATK' }
    ];
    if (w === 'axe') return [
      { key: 'barrel', name: 'Lưỡi Rìu', icon: '🪓', stat: 'Tầm chém + ATK' },
      { key: 'sight', name: 'Cán Rìu', icon: '🪵', stat: 'Tầm với + ATK' },
      { key: 'mag', name: 'Lưỡi Phụ', icon: '⚔️', stat: 'ATK' }
    ];
    return [
      { key: 'barrel', name: w === 'sniper' ? 'Lưỡi Dao Dài' : 'Lưỡi Dao Găm', icon: '📏', stat: 'ATK' },
      { key: 'sight', name: w === 'sniper' ? 'Ống Ngắm Tầm Xa' : 'Ống Ngắm', icon: '🎯', stat: 'Tầm ném + ATK' },
      { key: 'mag', name: w === 'sniper' ? 'Băng Đạn Lớn' : 'Băng Đạn', icon: '⚔️', stat: 'ATK' }
    ];
  }

  function formatModOptionText(slotId, m) {
    if (!m) return '';
    const r = parseInt(m.rarity) || 1;
    const plus = parseInt(m.plus) || 0;
    const enhAtk = plus > 0 ? (plus <= 5 ? plus * (plus + 1) : (plus <= 10 ? 30 + 10 * (plus - 5) : 80 + 20 * (plus - 10))) : 0;
    const atkVal = (r - 1) * 3 + enhAtk;
    
    if (slotId === 'barrel' || slotId === 'mag') return `⚔️ ATK +${atkVal}`;
    if (slotId === 'sight') return `🔭 Tầm +${(r * 0.3).toFixed(1)}m · ⚔️ ATK +${atkVal}`;
    if (slotId === 't_atk') return `⚔️ ATK +${atkVal}`;
    if (slotId === 't_range') return `🔭 Tầm +${r}m · ⚔️ ATK +${atkVal}`;
    if (slotId === 't_dur') return `⏳ Thời gian +${(r * 0.5).toFixed(1)}s · ⚔️ ATK +${atkVal}`;
    if (slotId === 'a_max') return `🛡️ Giáp tối đa +${r * 3 + plus * 2} · 🔰 DEF +${plus * 3}`;
    if (slotId === 'a_regen') return `♻️ Hồi giáp +${plus + Math.floor((r - 1) / 2)}/s · 🔰 DEF +${plus * 3}`;
    if (slotId === 'a_return') return `⚡ Phản dame +${Math.min(50, r * 2 + plus)}% · 🔰 DEF +${plus * 3}`;
    if (slotId === 'core_back' || slotId === 'core_brain' || slotId === 'core_center') return `⚡ Năng lượng +${plus + 1} · 🔋 Recover +${plus + 1}`;
    if (slotId === 'h_roof' || slotId === 'h_wall' || slotId === 'floor' || slotId === 'h_floor') return `⚡ Năng lượng +${plus + 1}`;
    return `⚔️ ATK +${atkVal}`;
  }

  function _modEffectShort(w, m) {
    return formatModOptionText(m.slot, m);
  }

  const _MOD_INV_FIELD = {
    pistol: 'module_inventory', sniper: 'sniper_module_inventory', knife: 'knife_module_inventory',
    axe: 'axe_module_inventory', turret: 'turret_module_inventory', armor: 'armor_module_inventory',
    robot: 'robot_module_inventory', house: 'house_module_inventory'
  };

  const _MOD_WEAPON_LABEL = {
    pistol: 'Module Dao Găm', sniper: 'Module Dao Dài', knife: 'Module Kiếm',
    axe: 'Module Rìu', turret: 'Module Pháo Tháp', armor: 'Module Khiên Giáp',
    robot: 'Module Titan Robot', house: 'Module Phi Thuyền Orion'
  };

  window.switchWeaponSubTab = function(uid, subTabId) {
    activeWeaponSubTabs[uid] = subTabId;
    const subnav = document.getElementById(`weapon-subnav-${uid}`);
    if (subnav) {
      const btns = subnav.querySelectorAll('.weapon-nav-btn');
      btns.forEach(b => {
        b.classList.toggle('active', b.id === `wpn-btn-${subTabId}-${uid}`);
      });
    }
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.switchWeaponInvFilter = function(uid, filterCat) {
    activeWeaponInvFilters[uid] = filterCat;
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.openCardPick = function(uid, weapon, slot, sidx = 0) {
    activeCardPicks[uid] = { weapon, slot, sidx, filter: 'all' };
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.closeCardPick = function(uid) {
    delete activeCardPicks[uid];
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.filterCardPick = function(uid, filterType) {
    if (activeCardPicks[uid]) {
      activeCardPicks[uid].filter = filterType;
      if (window.lastFetchedAccounts) {
        const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
        if (acc) renderWeaponTab(acc);
      }
    }
  };

  window.toggleModManage = function(uid, weapon) {
    if (!activeModManages[uid]) activeModManages[uid] = {};
    activeModManages[uid][weapon] = !activeModManages[uid][weapon];
    if (!activeModSelections[uid]) activeModSelections[uid] = {};
    if (!activeModSelections[uid][weapon]) activeModSelections[uid][weapon] = new Set();
    else activeModSelections[uid][weapon].clear();
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.toggleModSelect = function(uid, weapon, idx) {
    if (!activeModSelections[uid]) activeModSelections[uid] = {};
    if (!activeModSelections[uid][weapon]) activeModSelections[uid][weapon] = new Set();
    const sel = activeModSelections[uid][weapon];
    if (sel.has(idx)) sel.delete(idx);
    else sel.add(idx);
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.selectAllMod = function(uid, weapon, totalLen) {
    if (!activeModSelections[uid]) activeModSelections[uid] = {};
    if (!activeModSelections[uid][weapon]) activeModSelections[uid][weapon] = new Set();
    const sel = activeModSelections[uid][weapon];
    if (sel.size >= totalLen) sel.clear();
    else {
      for (let i = 0; i < totalLen; i++) sel.add(i);
    }
    if (window.lastFetchedAccounts) {
      const acc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
      if (acc) renderWeaponTab(acc);
    }
  };

  window.discardSelectedMods = function(uid, weapon) {
    const sel = activeModSelections[uid] && activeModSelections[uid][weapon];
    if (!sel || !sel.size) return;
    const indices = Array.from(sel);
    if (!confirm(`Xác nhận phá hủy ${indices.length} module đã chọn?\n(Thu hồi 100% Kim cương cường hóa và Thẻ bài về kho)`)) return;
    triggerAction(uid, 'module_discard_multi', null, { weapon, indices: JSON.stringify(indices) });
    sel.clear();
  };

  // 100% In-Game Module Socket Strip Renderer (Dark Mode)
  function _renderModSocketStripHtml(uid, weapon, slotKey, m, monMasters) {
    const n = Math.max(1, parseInt(m.sockets) || (m.cards ? m.cards.length : 1));
    const cards = Array.isArray(m.cards) ? m.cards : [];
    const filled = cards.filter(Boolean).length;

    let tiles = '';
    for (let i = 0; i < n; i++) {
      const c = cards[i];
      if (c) {
        const mid = c.mid || c.id || c;
        const cInfo = getCardDetails(mid, typeof c === 'object' ? c : {}, monMasters);
        const mvp = cInfo.isMvp;
        tiles += `
          <div style="position:relative; box-sizing:border-box; min-width:0; background:${mvp ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)'}; border:1px solid ${mvp ? '#ef4444' : '#475569'}; border-radius:8px; padding:4px 6px; display:flex; flex-direction:column; gap:2px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span style="font-size:0.95rem;">${cInfo.emoji}</span>
              <span style="font-size:0.65rem; font-weight:700; color:${mvp ? '#fb7185' : '#38bdf8'};">${mvp ? '⭐ MVP' : 'Thường'}</span>
            </div>
            <div style="font-size:0.72rem; font-weight:700; color:#f8fafc; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${cInfo.name} <small style="color:#94a3b8;">Lv.${cInfo.lv}</small>
            </div>
            <div style="font-size:0.68rem; color:#38bdf8; font-weight:600;">+${cInfo.statVal} ${cInfo.statLabel}</div>
            ${mvp ? `<div style="font-size:0.62rem; color:#fbbf24;">⚔️ ${cInfo.cbBonus}</div>` : ''}
            <button onclick="triggerAction('${uid}', 'card_unsocket', null, { weapon: '${weapon}', slot: '${slotKey}', sidx: ${i}, pay: 'gold' })" title="Gỡ thẻ về kho (3,000 G x Bậc)" style="margin-top:2px; font-size:0.65rem; padding:2px 4px; border:none; border-radius:4px; background:#7f1d1d; color:#fecaca; cursor:pointer; font-weight:600;">
              ↩️ Gỡ Thẻ
            </button>
          </div>
        `;
      } else {
        const isPicking = activeCardPicks[uid] && activeCardPicks[uid].weapon === weapon && activeCardPicks[uid].slot === slotKey && activeCardPicks[uid].sidx === i;
        tiles += `
          <div style="box-sizing:border-box; min-width:0; background:rgba(255, 255, 255, 0.02); border:1px dashed ${isPicking ? '#a855f7' : 'rgba(255, 255, 255, 0.15)'}; border-radius:8px; padding:6px 4px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;">
            <span style="font-size:0.68rem; color:#94a3b8;">— Lỗ #${i+1} Trống —</span>
            <button onclick="openCardPick('${uid}', '${weapon}', '${slotKey}', ${i})" style="font-size:0.68rem; padding:2px 6px; border:1px solid #8b5cf6; border-radius:4px; background:${isPicking ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)'}; color:#fff; cursor:pointer; font-weight:600;">
              ${isPicking ? '👉 Đang Chọn' : '🎴 Khảm Thẻ'}
            </button>
          </div>
        `;
      }
    }

    return `
      <div style="padding:4px 8px 8px 8px; border-top:1px dashed rgba(255, 255, 255, 0.1); margin-top:4px;">
        <div style="font-size:0.72rem; color:#fcd34d; font-weight:700; margin-bottom:4px;">
          🎴 Ô Khảm Thẻ (${filled}/${n})
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(105px, 1fr)); gap:6px;">
          ${tiles}
        </div>
      </div>
    `;
  }

  // 100% In-Game Inline Card Picker Renderer (Dark Mode)
  function _renderCardPickerHtml(uid, weapon, p, monMasters) {
    const pick = activeCardPicks[uid];
    if (!pick || pick.weapon !== weapon || !pick.slot) return '';

    const ownedCards = parseJsonSafe(p.cards, {});
    const cardFilter = pick.filter || 'all';

    let cardsList = [];
    Object.keys(ownedCards).forEach(cid => {
      const c = ownedCards[cid];
      if (c && typeof c === 'object') {
        const countNormal = parseInt(c.n) || 0;
        const countMvp = parseInt(c.m) || 0;
        if (countNormal > 0 || countMvp > 0) {
          const cInfo = getCardDetails(cid, c, monMasters);
          if (countNormal > 0 && (cardFilter === 'all' || cardFilter === 'normal')) {
            cardsList.push({ ...cInfo, cid, isMvp: false, count: countNormal });
          }
          if (countMvp > 0 && (cardFilter === 'all' || cardFilter === 'mvp')) {
            cardsList.push({ ...cInfo, cid, isMvp: true, statVal: Math.ceil(cInfo.lv / 10) * 3, count: countMvp });
          }
        }
      }
    });

    cardsList.sort((a, b) => (a.lv - b.lv) || (a.cid - b.cid));

    let cardsHtml = '';
    if (cardsList.length === 0) {
      cardsHtml = `<div style="grid-column:1/-1; font-size:0.75rem; color:#94a3b8; text-align:center; padding:12px 0;">— Không có thẻ bài phù hợp trong kho —</div>`;
    } else {
      cardsList.forEach(c => {
        cardsHtml += `
          <button onclick="triggerAction('${uid}', 'card_socket', null, { weapon: '${weapon}', slot: '${pick.slot}', mid: '${c.cid}', mvp: ${c.isMvp ? 1 : 0}, sidx: '${pick.sidx}' }); closeCardPick('${uid}');" style="position:relative; display:flex; flex-direction:column; align-items:center; gap:2px; background:${c.isMvp ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.8)'}; border:1px solid ${c.isMvp ? '#ef4444' : '#38bdf8'}; border-radius:8px; padding:5px 4px; cursor:pointer; min-width:0;">
            ${c.isMvp ? `<span style="position:absolute; top:1px; left:2px; font-size:0.6rem; font-weight:800; color:#fff; background:#dc2626; padding:0 3px; border-radius:3px;">MVP</span>` : ''}
            <span style="position:absolute; top:1px; right:2px; font-size:0.65rem; font-weight:700; color:#fcd34d;">x${c.count}</span>
            <div style="font-size:1.3rem; margin-top:2px;">${c.emoji}</div>
            <div style="font-size:0.68rem; font-weight:700; color:#f8fafc; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%; text-align:center;">${c.name}</div>
            <div style="font-size:0.65rem; color:#38bdf8; font-weight:700;">+${c.statVal} ${c.statLabel}</div>
            ${c.isMvp ? `<div style="font-size:0.6rem; color:#fbbf24; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%; text-align:center;">⚔️ ${c.cbBonus}</div>` : ''}
          </button>
        `;
      });
    }

    return `
      <div style="margin-top:10px; background:rgba(30, 41, 59, 0.9); border:1px solid #a855f7; border-radius:10px; padding:10px; box-shadow:0 8px 25px rgba(0,0,0,0.5);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.78rem; font-weight:800; color:#d8b4fe;">
            🎴 Chọn Thẻ Khảm vào Lỗ #${pick.sidx + 1} (${pick.slot.toUpperCase()}) <small style="color:#a855f7;">(Khảm vĩnh viễn)</small>
          </span>
          <button onclick="closeCardPick('${uid}')" style="font-size:0.7rem; padding:2px 8px; border:1px solid #475569; border-radius:5px; background:rgba(15, 23, 42, 0.8); color:#cbd5e1; cursor:pointer;">✕ Đóng</button>
        </div>
        <div style="display:flex; gap:4px; margin-bottom:8px;">
          <button class="weapon-nav-btn ${cardFilter === 'all' ? 'active' : ''}" style="font-size:0.68rem; padding:2px 6px;" onclick="filterCardPick('${uid}', 'all')">Tất Cả</button>
          <button class="weapon-nav-btn ${cardFilter === 'mvp' ? 'active' : ''}" style="font-size:0.68rem; padding:2px 6px;" onclick="filterCardPick('${uid}', 'mvp')">⭐ MVP</button>
          <button class="weapon-nav-btn ${cardFilter === 'normal' ? 'active' : ''}" style="font-size:0.68rem; padding:2px 6px;" onclick="filterCardPick('${uid}', 'normal')">🎴 Thường</button>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(72px, 1fr)); gap:5px; max-height:220px; overflow-y:auto; padding-right:2px;">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // 100% In-Game Module Panel Renderer (Dark Mode)
  function _renderInGameModulePanel(uid, weapon, p, monMasters) {
    const invField = _MOD_INV_FIELD[weapon] || 'module_inventory';
    const manage = Boolean(activeModManages[uid] && activeModManages[uid][weapon]);
    const sel = (activeModSelections[uid] && activeModSelections[uid][weapon]) || new Set();
    const mods = _pmodsObj(p, weapon);
    const inv = Array.isArray(p[invField]) ? p[invField] : (parseJsonSafe(p[invField], []));
    const db = p.diamond_blue || 0, dr = p.diamond_red || 0, dg = p.diamond_green || 0;
    const slotDefs = _modSlotsFor(weapon);
    const eqCount = slotDefs.filter(s => mods[s.key]).length;

    // 1. Equipped Slot Rows
    const slotRows = slotDefs.map(s => {
      const m = mods[s.key];
      if (!m) {
        return `
          <div style="background:rgba(15, 23, 42, 0.6); border:1px dashed rgba(255, 255, 255, 0.15); border-radius:8px; padding:8px 10px; display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.1rem; width:24px; text-align:center; opacity:0.6;">${s.icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.75rem; font-weight:700; color:#94a3b8;">${s.name}</div>
              <div style="font-size:0.68rem; color:#64748b;">— Trống — (Chạm module bên dưới để lắp)</div>
            </div>
          </div>
        `;
      }

      const rar = MODULE_RARITY[Math.max(0, Math.min(6, (m.rarity || 1) - 1))];
      const statTxt = formatModOptionText(s.key, m);
      const isMax = (m.plus || 0) >= 15;
      const to = (m.plus || 0) + 1;
      const cost = _modEnhCost(to);
      const rate = _modRate(to);
      const costTxt = isMax ? '' : `🔷${cost.blue}${cost.red ? ` 🔴${cost.red}` : ''}${cost.green ? ` 🟢${cost.green}` : ''} 💰${formatNumber(cost.gold)}`;

      return `
        <div style="background:rgba(15, 23, 42, 0.75); border:1px solid ${rar.c}; border-left:4px solid ${rar.c}; border-radius:0 8px 8px 0; margin-bottom:4px;">
          <div style="display:flex; align-items:center; gap:8px; padding:6px 8px;">
            <span style="font-size:1.2rem; width:24px; flex:none; text-align:center;">${s.icon}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.78rem; font-weight:700; color:#f8fafc;">
                ${s.name} <span style="font-size:0.65rem; color:#fff; ${_rarBg(m.rarity)}; border-radius:4px; padding:1px 5px;">${rar.n}</span> <b style="color:#c084fc;">+${m.plus || 0}</b>
              </div>
              <div style="font-size:0.72rem; color:#4ade80; font-weight:600;">${statTxt}</div>
            </div>
            <button onclick="triggerAction('${uid}', 'module_unequip', null, { weapon: '${weapon}', slot: '${s.key}' })" style="font-size:0.68rem; padding:3px 8px; border:1px solid #475569; border-radius:5px; background:rgba(30, 41, 59, 0.8); color:#cbd5e1; cursor:pointer; font-weight:600;">
              Tháo
            </button>
            ${isMax ? '<button disabled style="flex:none; width:90px; font-size:0.68rem; padding:4px; border:none; border-radius:5px; background:#475569; color:#fff;">MAX</button>'
              : `<button onclick="triggerAction('${uid}', 'module_enhance', null, { weapon: '${weapon}', slot: '${s.key}' })" style="flex:none; width:95px; box-sizing:border-box; font-size:0.68rem; padding:4px; border:none; border-radius:6px; background:#7c3aed; color:#fff; cursor:pointer; text-align:center; line-height:1.2; white-space:nowrap; font-weight:700;">
                  <b>+${to}</b> (${rate}%)<br><span style="font-size:0.6rem; font-weight:normal; opacity:0.9;">${costTxt}</span>
                </button>`}
          </div>
          ${_renderModSocketStripHtml(uid, weapon, s.key, m, monMasters)}
        </div>
      `;
    }).join('');

    // 2. Module Inventory Grid (5-column in-game grid)
    const _slotOrd = {};
    slotDefs.forEach((s, idx) => { _slotOrd[s.key] = idx; });

    let invHtml = '';
    if (inv.length) {
      invHtml = inv.map((it, i) => ({ it, i }))
        .sort((a, b) => ((_slotOrd[a.it.slot] ?? 99) - (_slotOrd[b.it.slot] ?? 99)) || (b.it.rarity - a.it.rarity) || ((b.it.plus || 0) - (a.it.plus || 0)))
        .map(({ it, i }) => {
          const rar = MODULE_RARITY[Math.max(0, Math.min(6, (it.rarity || 1) - 1))];
          const slotTxt = _modEffectShort(weapon, it);
          const seld = manage && sel.has(i);
          const bdr = seld ? 'border:2px solid #ef4444' : `border:1px solid rgba(255, 255, 255, 0.1); border-left:3px solid ${rar.c}`;
          const check = seld ? '<span style="position:absolute; top:-4px; right:-4px; width:14px; height:14px; border-radius:50%; background:#ef4444; color:#fff; font-size:9px; display:flex; align-items:center; justify-content:center; z-index:1;">✓</span>' : '';
          const cardCount = Array.isArray(it.cards) ? it.cards.length : 0;

          return `
            <button onclick="${manage ? `toggleModSelect('${uid}', '${weapon}', ${i})` : `triggerAction('${uid}', 'module_equip', null, { weapon: '${weapon}', slot: '${it.slot}', idx: ${i} })`}" style="position:relative; width:100%; box-sizing:border-box; min-height:64px; display:flex; flex-direction:column; align-items:stretch; gap:2px; text-align:left; background:${seld ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.7)'}; ${bdr}; border-radius:${seld ? '6px' : '0 6px 6px 0'}; padding:5px; cursor:pointer;">
              ${check}
              <div style="display:flex; align-items:center; width:100%;">
                <span style="font-size:0.75rem;">${it.slot || '⚙️'}</span>
                <span style="margin-left:auto; font-size:0.68rem; font-weight:700; color:${it.plus > 0 ? '#c084fc' : '#94a3b8'};">+${it.plus || 0}</span>
              </div>
              <span style="font-size:0.62rem; color:#fff; ${_rarBg(it.rarity)}; border-radius:3px; padding:0 3px; line-height:1.4; display:block; width:100%; text-align:center;">${rar.n}</span>
              <span style="font-size:0.65rem; font-weight:600; color:#4ade80; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${slotTxt}</span>
              ${cardCount > 0 ? `<span style="position:absolute; bottom:2px; right:2px; font-size:0.6rem; font-weight:800; color:#fff; background:#7c3aed; border-radius:4px; padding:0 3px;">🎴${cardCount}</span>` : ''}
            </button>
          `;
        }).join('');
    } else {
      invHtml = `<span style="font-size:0.75rem; color:#94a3b8; grid-column:1/-1; text-align:center; padding:10px 0;">— Kho trống —</span>`;
    }

    return `
      <div style="background:rgba(15, 23, 42, 0.85); padding:10px; border-radius:10px; border:1px solid rgba(255, 255, 255, 0.08); margin-top:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.8rem; color:#fcd34d; font-weight:700;">
            🔧 ${_MOD_WEAPON_LABEL[weapon] || 'Module'} <span style="color:#94a3b8; font-weight:normal;">(${eqCount}/${slotDefs.length})</span>
          </span>
          <span style="font-size:0.72rem; color:#cbd5e1; display:inline-flex; align-items:center; gap:4px;">
            🔷${db} 🔴${dr} 🟢${dg} 💰${formatNumber(p.gold || 0)}
          </span>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px;">
          ${slotRows}
        </div>

        ${_renderCardPickerHtml(uid, weapon, p, monMasters)}

        <div style="margin-top:10px; padding-top:8px; border-top:1px solid rgba(255, 255, 255, 0.08);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            ${manage
              ? `<span style="font-size:0.72rem; color:#ef4444; font-weight:700;">Đã chọn ${sel.size} món</span>
                 <div style="display:flex; gap:4px;">
                   <button onclick="selectAllMod('${uid}', '${weapon}', ${inv.length})" style="font-size:0.68rem; padding:2px 6px; border:1px solid #7c3aed; border-radius:4px; background:rgba(124,58,237,0.3); color:#fff; cursor:pointer;">${sel.size >= inv.length ? '☐ Bỏ chọn' : '☑ Tất cả'}</button>
                   <button onclick="toggleModManage('${uid}', '${weapon}')" style="font-size:0.68rem; padding:2px 6px; border:1px solid #64748b; border-radius:4px; background:rgba(30,41,59,0.8); color:#cbd5e1; cursor:pointer;">Hủy</button>
                   <button onclick="discardSelectedMods('${uid}', '${weapon}')" ${sel.size ? '' : 'disabled'} style="font-size:0.68rem; padding:2px 6px; border:none; border-radius:4px; background:${sel.size ? '#dc2626' : '#475569'}; color:#fff; cursor:pointer; font-weight:700;">🗑️ Phá hủy (${sel.size})</button>
                 </div>`
              : `<span style="font-size:0.72rem; color:#94a3b8;">Kho Module ${inv.length}/30 (Chạm để lắp)</span>
                 <button onclick="toggleModManage('${uid}', '${weapon}')" style="font-size:0.68rem; padding:2px 8px; border:none; border-radius:4px; background:rgba(239, 68, 68, 0.2); color:#f87171; cursor:pointer; font-weight:600;">🗑️ Quản lý</button>`}
          </div>
          <div style="display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:4px;">
            ${invHtml}
          </div>
          ${manage ? `<div style="font-size:0.65rem; color:#4ade80; background:rgba(34, 197, 94, 0.1); border:1px solid rgba(34, 197, 94, 0.2); border-radius:6px; padding:4px 6px; margin-top:6px; line-height:1.4;">♻️ Phá hủy sẽ hoàn <b>100% Thẻ bài khảm + Kim cương</b> về kho.</div>` : ''}
        </div>
      </div>
    `;
  }

  function renderWeaponTab(acc) {
    const heroEl = document.getElementById(`weapon-hero-${acc.line_uid}`);
    const detailEl = document.getElementById(`wpn-pane-detail-${acc.line_uid}`);
    if (!heroEl || !detailEl) return;

    const p = acc.player || {};
    const isSniper = Number(p.active_gun) === 1;
    const currentActiveWeapon = isSniper ? 'Dao Dài (Sniper)' : 'Dao Găm (Pistol)';
    const currentActiveIco = isSniper ? '🎯' : '🔪';
    const activeAtk = isSniper ? (p.atk_sniper || 120) : (p.atk_pistol || 20);
    const dexVal = p.dex_eff || p.dex || 5;
    const dexBonusRange = Math.floor(dexVal / 24);
    const baseRange = isSniper ? 55 : 35;
    const totalRange = baseRange + dexBonusRange;
    const ammoCapacity = 50 + (p.lv || 1) * 5;

    // 1. Render Hero Section
    heroEl.innerHTML = `
      <div class="weapon-hero-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.4rem;">${currentActiveIco}</span>
          <div>
            <div style="font-size:0.95rem; font-weight:800; color:#f8fafc;">${currentActiveWeapon}</div>
            <span class="weapon-active-badge">✨ Đang trang bị</span>
          </div>
        </div>
        <button class="btn-switch-weapon" onclick="triggerAction('${acc.line_uid}', 'gun_use', null, { gun_type: '${isSniper ? 'pistol' : 'sniper'}' })">
          🔄 Đổi sang ${isSniper ? 'Dao Găm' : 'Dao Dài'}
        </button>
      </div>
      <div class="weapon-stats-strip">
        <div class="weapon-stat-box">
          <span class="weapon-stat-lbl">⚔️ Sát Thương (ATK)</span>
          <span class="weapon-stat-val" style="color:#f43f5e;">${activeAtk}</span>
        </div>
        <div class="weapon-stat-box">
          <span class="weapon-stat-lbl">🎯 Tầm Ném (+DEX)</span>
          <span class="weapon-stat-val" style="color:#38bdf8;">${totalRange}m <small style="font-size:0.68rem; color:#94a3b8; font-weight:normal;">(+${dexBonusRange}m)</small></span>
        </div>
        <div class="weapon-stat-box">
          <span class="weapon-stat-lbl">🎒 Sức Chứa Đạn</span>
          <span class="weapon-stat-val" style="color:#10b981;">${ammoCapacity} <small style="font-size:0.68rem; color:#94a3b8; font-weight:normal;">viên T1</small></span>
        </div>
      </div>
    `;

    // 2. Render Active Subtab Content
    const subTab = activeWeaponSubTabs[acc.line_uid] || (isSniper ? 'sniper' : 'pistol');
    
    // Update button states in subnav
    const subnav = document.getElementById(`weapon-subnav-${acc.line_uid}`);
    if (subnav) {
      const btns = subnav.querySelectorAll('.weapon-nav-btn');
      btns.forEach(b => {
        b.classList.toggle('active', b.id === `wpn-btn-${subTab}-${acc.line_uid}`);
      });
    }

    if (subTab === 'inv') {
      // ── SUBTAB: KHO MODULE TOÀN BỘ ──
      const filterCat = activeWeaponInvFilters[acc.line_uid] || 'all';
      const invSources = [
        { cat: 'pistol', label: 'Dao Găm', ico: '🔪', list: parseJsonSafe(p.module_inventory, []) },
        { cat: 'sniper', label: 'Dao Dài', ico: '🎯', list: parseJsonSafe(p.sniper_module_inventory, []) },
        { cat: 'knife', label: 'Kiếm', ico: '🗡️', list: parseJsonSafe(p.knife_module_inventory, []) },
        { cat: 'axe', label: 'Rìu', ico: '🪓', list: parseJsonSafe(p.axe_module_inventory, []) },
        { cat: 'turret', label: 'Pháo Tháp', ico: '🗼', list: parseJsonSafe(p.turret_module_inventory, []) },
        { cat: 'armor', label: 'Khiên Giáp', ico: '🛡️', list: parseJsonSafe(p.armor_module_inventory, []) },
        { cat: 'robot', label: 'Titan', ico: '🔋', list: parseJsonSafe(p.robot_module_inventory, []) },
        { cat: 'house', label: 'Phi Thuyền', ico: '🛸', list: parseJsonSafe(p.house_module_inventory, []) }
      ];

      let allModules = [];
      invSources.forEach(src => {
        const rawList = Array.isArray(src.list) ? src.list : (typeof src.list === 'object' ? Object.values(src.list) : []);
        rawList.forEach((m, idx) => {
          if (m && typeof m === 'object') {
            allModules.push({ ...m, _cat: src.cat, _catLabel: src.label, _catIco: src.ico, _idx: idx });
          }
        });
      });

      const filteredModules = filterCat === 'all' ? allModules : allModules.filter(m => m._cat === filterCat);

      let filterBtnsHtml = `
        <button class="weapon-nav-btn ${filterCat === 'all' ? 'active' : ''}" style="font-size:0.7rem; padding:3px 8px;" onclick="switchWeaponInvFilter('${acc.line_uid}', 'all')">Tất Cả (${allModules.length})</button>
      `;
      invSources.forEach(src => {
        const cnt = allModules.filter(m => m._cat === src.cat).length;
        filterBtnsHtml += `
          <button class="weapon-nav-btn ${filterCat === src.cat ? 'active' : ''}" style="font-size:0.7rem; padding:3px 8px;" onclick="switchWeaponInvFilter('${acc.line_uid}', '${src.cat}')">${src.ico} ${src.label} (${cnt})</button>
        `;
      });

      let invCardsHtml = '';
      if (filteredModules.length === 0) {
        invCardsHtml = `<div style="grid-column:1/-1; text-align:center; padding:25px 0; color:#94a3b8; font-size:0.82rem;">📦 Kho Module đang trống.</div>`;
      } else {
        filteredModules.forEach(m => {
          const rar = MODULE_RARITY[Math.max(0, Math.min(6, (m.rarity || 1) - 1))];
          const slotTxt = _modEffectShort(m._cat, m);
          const cardCount = Array.isArray(m.cards) ? m.cards.length : 0;

          invCardsHtml += `
            <button onclick="triggerAction('${acc.line_uid}', 'module_equip', null, { weapon: '${m._cat}', slot: '${m.slot}', idx: ${m._idx} })" style="position:relative; width:100%; box-sizing:border-box; min-height:64px; display:flex; flex-direction:column; align-items:stretch; gap:2px; text-align:left; background:rgba(15, 23, 42, 0.7); border:1px solid rgba(255, 255, 255, 0.1); border-left:3px solid ${rar.c}; border-radius:0 6px 6px 0; padding:5px; cursor:pointer;">
              <div style="display:flex; align-items:center; width:100%;">
                <span style="font-size:0.75rem;">${m._catIco} ${m.slot || '⚙️'}</span>
                <span style="margin-left:auto; font-size:0.68rem; font-weight:700; color:${m.plus > 0 ? '#c084fc' : '#94a3b8'};">+${m.plus || 0}</span>
              </div>
              <span style="font-size:0.62rem; color:#fff; ${_rarBg(m.rarity)}; border-radius:3px; padding:0 3px; line-height:1.4; display:block; width:100%; text-align:center;">${rar.n}</span>
              <span style="font-size:0.65rem; font-weight:600; color:#4ade80; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${slotTxt}</span>
              ${cardCount > 0 ? `<span style="position:absolute; bottom:2px; right:2px; font-size:0.6rem; font-weight:800; color:#fff; background:#7c3aed; border-radius:4px; padding:0 3px;">🎴${cardCount}</span>` : ''}
            </button>
          `;
        });
      }

      detailEl.innerHTML = `
        <div class="module-inv-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.88rem; font-weight:800; color:#c4b5fd;">📦 Kho Module Nhân Vật (${allModules.length}/30)</span>
          <span style="font-size:0.72rem; color:#fbbf24;">💎 Kim Cương: <b>${p.diamond || 0}</b></span>
        </div>
        <div style="display:flex; gap:4px; margin-bottom:10px; overflow-x:auto;">
          ${filterBtnsHtml}
        </div>
        <div style="display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:4px;">
          ${invCardsHtml}
        </div>
      `;
    } else {
      // ── SUBTAB: 1 TRONG 8 VŨ KHÍ / TRANG BỊ ──
      const lvKeyMap = {
        pistol: 'gun_pistol_lv', sniper: 'gun_sniper_lv', knife: 'knife_lv',
        axe: 'axe_lv', turret: 'turret_lv', armor: 'armor_lv',
        robot: 'robot_lv', house: 'home_lv'
      };
      const curLv = parseInt(p[lvKeyMap[subTab]]) || (subTab === 'armor' ? 0 : 1);
      const nextLv = curLv + 1;
      const upgGold = Math.ceil(calcTierGold(nextLv) * _upgCostMult(nextLv));
      const upgRes = Math.ceil(calcTierRes(nextLv) * _upgCostMult(nextLv));
      const canUp = (parseInt(p.gold) || 0) >= upgGold;

      let upgAction = 'gun_up';
      let upgParam = subTab;
      if (subTab === 'armor') { upgAction = 'upgrade_armor'; upgParam = null; }
      else if (subTab === 'robot') { upgAction = 'robot_body_up'; upgParam = null; }
      else if (subTab === 'house') { upgAction = 'home_up'; upgParam = null; }

      // Ammo Strip for pistol, sniper, turret, and robot (100% In-Game T1..T6 Multi-Tier Toggles)
      let ammoHtml = '';
      if (subTab === 'pistol' || subTab === 'sniper' || subTab === 'turret' || subTab === 'robot') {
        ammoHtml = _renderAmmoTierStripHtml(acc.line_uid, subTab, p);
      }

      let statusHtml = '';
      if (subTab === 'pistol' || subTab === 'sniper' || subTab === 'turret' || subTab === 'robot') {
        const useKey = subTab === 'robot' ? 'gun_use_robot_gun' : `gun_use_${subTab}`;
        const isUsed = p[useKey] !== undefined ? Boolean(parseInt(p[useKey])) : true;
        const statusLabel = isUsed ? '🟢 Đang hoạt động' : '🔴 Đang tắt';
        const btnLabel = isUsed ? '🔴 Tắt Kích Hoạt' : '🟢 Kích Hoạt';
        const gunTypeParam = subTab === 'robot' ? 'robot_gun' : subTab;
        
        statusHtml = `
          <div style="background:rgba(15, 23, 42, 0.75); border:1px solid rgba(255, 255, 255, 0.1); border-radius:10px; padding:10px 12px; margin-top:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.75rem; color:#94a3b8;">Trạng thái hoạt động</div>
              <div style="font-size:0.85rem; font-weight:800; color:${isUsed ? '#22c55e' : '#ef4444'}; margin-top:2px;">
                ${statusLabel}
              </div>
            </div>
            <button onclick="triggerAction('${acc.line_uid}', 'gun_use', null, { gun_type: '${gunTypeParam}' })" style="font-size:0.75rem; font-weight:700; padding:6px 12px; border:none; border-radius:6px; background:${isUsed ? '#7f1d1d' : '#15803d'}; color:#fff; cursor:pointer;">
              ${btnLabel}
            </button>
          </div>
        `;
      }

      detailEl.innerHTML = `
        <div style="background:rgba(15, 23, 42, 0.75); border:1px solid rgba(255, 255, 255, 0.1); border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.9rem; font-weight:800; color:#f8fafc;">
              ${_MOD_WEAPON_LABEL[subTab] || 'Vũ Khí'} <span style="font-size:0.75rem; background:#3b82f6; color:#fff; padding:1px 6px; border-radius:4px;">Lv.${curLv}</span>
            </div>
            <div style="font-size:0.72rem; color:#94a3b8; margin-top:2px;">
              Lên Lv.${nextLv}: 💰<b>${formatNumber(upgGold)}</b> G · 🪨/🔩<b>${formatNumber(upgRes)}</b>
            </div>
          </div>
          <button ${canUp ? '' : 'disabled'} onclick="triggerAction('${acc.line_uid}', '${upgAction}', '${upgParam}')" style="font-size:0.75rem; font-weight:700; padding:6px 12px; border:none; border-radius:6px; background:${canUp ? '#10b981' : '#475569'}; color:#fff; cursor:pointer;">
            ⬆️ Nâng Cấp
          </button>
        </div>

        ${statusHtml}

        ${ammoHtml}

        ${_renderInGameModulePanel(acc.line_uid, subTab, p, acc.mon_masters)}
      `;
    }
  }

  const activeMarketSubTabs = {};

  // Switch Sub-Tab inside Market Pane
  window.switchMarketSubTab = function(uid, subTabId) {
    activeMarketSubTabs[uid] = subTabId;

    const btnLive = document.getElementById(`subtab-btn-mkt-live-${uid}`);
    const btnMine = document.getElementById(`subtab-btn-mkt-mine-${uid}`);
    const btnSettings = document.getElementById(`subtab-btn-mkt-settings-${uid}`);
    const btnFilters = document.getElementById(`subtab-btn-mkt-filters-${uid}`);
    const btnHistory = document.getElementById(`subtab-btn-mkt-history-${uid}`);
    const btnTrade = document.getElementById(`subtab-btn-mkt-trade-${uid}`);

    const paneLive = document.getElementById(`subpane-mkt-live-${uid}`);
    const paneMine = document.getElementById(`subpane-mkt-mine-${uid}`);
    const paneSettings = document.getElementById(`subpane-mkt-settings-${uid}`);
    const paneFilters = document.getElementById(`subpane-mkt-filters-${uid}`);
    const paneHistory = document.getElementById(`subpane-mkt-history-${uid}`);
    const paneTrade = document.getElementById(`subpane-mkt-trade-${uid}`);

    if (btnLive) btnLive.classList.toggle('active', subTabId === 'live');
    if (btnMine) btnMine.classList.toggle('active', subTabId === 'mine');
    if (btnSettings) btnSettings.classList.toggle('active', subTabId === 'settings');
    if (btnFilters) btnFilters.classList.toggle('active', subTabId === 'filters');
    if (btnHistory) btnHistory.classList.toggle('active', subTabId === 'history');
    if (btnTrade) btnTrade.classList.toggle('active', subTabId === 'trade');

    if (paneLive) paneLive.style.display = subTabId === 'live' ? 'block' : 'none';
    if (paneMine) paneMine.style.display = subTabId === 'mine' ? 'block' : 'none';
    if (paneSettings) paneSettings.style.display = subTabId === 'settings' ? 'block' : 'none';
    if (paneFilters) paneFilters.style.display = subTabId === 'filters' ? 'block' : 'none';
    if (paneHistory) paneHistory.style.display = subTabId === 'history' ? 'block' : 'none';
    if (paneTrade) paneTrade.style.display = subTabId === 'trade' ? 'block' : 'none';

    if (subTabId === 'live') {
      loadLiveMarket(uid);
    } else if (subTabId === 'mine') {
      loadMyListings(uid);
    } else if (subTabId === 'trade' && typeof tradeOpen === 'function') {
      tradeOpen(uid);
    }
  };

  // ── 🏪 MANUAL MARKET LIVE SYSTEM (Mua Chợ Trực Tiếp, Đang Bán, Đăng Bán) ──
  window.liveMarketCache = {};
  window.myListingsCache = {};
  window.sellInventoryCache = {};

  const RARITY_COLORS = {
    white: '#94a3b8',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
    gold: '#f59e0b',
    red: '#ef4444'
  };

  // 1. Tải danh sách Chợ Live từ server
  window.loadLiveMarket = async function(uid, force = false) {
    const grid = document.getElementById(`mkt-live-grid-${uid}`);
    const goldElem = document.getElementById(`mkt-live-gold-${uid}`);
    if (!grid) return;

    if (!force && window.liveMarketCache[uid] && window.liveMarketCache[uid].listings) {
      renderLiveMarketGrid(uid);
      return;
    }

    grid.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;"><span class="spinner" style="display:inline-block; margin-right:6px;"></span> Đang tải danh sách chợ từ server...</div>`;

    try {
      const res = await fetch(`/api/accounts/${uid}/market/listings`);
      const data = await res.json();
      if (!data.ok) {
        grid.innerHTML = `<div style="text-align: center; color: #f87171; padding: 24px 0; grid-column: 1 / -1;">❌ ${data.error || 'Lỗi tải danh sách chợ'}</div>`;
        return;
      }

      window.liveMarketCache[uid] = {
        listings: data.listings || [],
        gold: data.gold || 0
      };

      if (goldElem) {
        goldElem.textContent = (data.gold || 0).toLocaleString();
      }

      renderLiveMarketGrid(uid);
    } catch (e) {
      grid.innerHTML = `<div style="text-align: center; color: #f87171; padding: 24px 0; grid-column: 1 / -1;">❌ Lỗi kết nối: ${e.message}</div>`;
    }
  };

  // 2. Render lưới Live Market (Hỗ trợ Lọc Danh mục, Search và Sắp xếp Giá)
  window.renderLiveMarketGrid = function(uid) {
    const grid = document.getElementById(`mkt-live-grid-${uid}`);
    if (!grid) return;

    const cache = window.liveMarketCache[uid];
    if (!cache || !cache.listings) {
      grid.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;">Không có dữ liệu chợ.</div>`;
      return;
    }

    const searchInput = document.getElementById(`mkt-live-search-${uid}`);
    const catSelect = document.getElementById(`mkt-live-cat-${uid}`);
    const sortSelect = document.getElementById(`mkt-live-sort-${uid}`);

    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedCat = catSelect ? catSelect.value : 'all';
    const sortOrder = sortSelect ? sortSelect.value : 'asc';

    let filtered = [...cache.listings];

    // Lọc theo danh mục
    if (selectedCat !== 'all') {
      if (selectedCat === 'resource' || selectedCat === 'diamond' || selectedCat === 'ore' || selectedCat === 'ammo' || selectedCat === 'card' || selectedCat === 'egg' || selectedCat === 'module_box' || selectedCat === 'card_box' || selectedCat === 'egg_box' || selectedCat === 'eq2' || selectedCat === 'treasure' || selectedCat === 'hardware' || selectedCat === 'weapon_parts' || selectedCat === 'house_parts' || selectedCat === 'stat_parts') {
        filtered = filtered.filter(l => l.item_type === selectedCat);
      } else if (selectedCat.startsWith('module_')) {
        filtered = filtered.filter(l => l.item_type === selectedCat);
      }
    }

    // Lọc theo từ khóa tìm kiếm (Tên, mô tả, người bán)
    if (q) {
      filtered = filtered.filter(l => {
        const name = (l.item_name || '').toLowerCase();
        const rawName = (l.item_name_raw || '').toLowerCase();
        const desc = (l.item_desc || '').toLowerCase();
        const seller = (l.seller_name || '').toLowerCase();
        return name.includes(q) || rawName.includes(q) || desc.includes(q) || seller.includes(q);
      });
    }

    // Sắp xếp theo giá (Thấp -> Cao hoặc Cao -> Thấp)
    filtered.sort((a, b) => {
      const pA = a.price_per || 0;
      const pB = b.price_per || 0;
      return sortOrder === 'desc' ? (pB - pA) : (pA - pB);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;">🔍 Không tìm thấy vật phẩm phù hợp bộ lọc.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const rarColor = RARITY_COLORS[item.item_rarity] || '#cbd5e1';
      const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
      const isMvp = item.item_name.includes('⭐MVP') || item.item_name.includes('MVP');
      
      return `
        <div class="mkt-card-item" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3.5px solid ${rarColor}; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: 1.25rem; line-height: 1;">${item.item_icon || '📦'}</span>
              <span style="font-size: 0.68rem; font-weight: 700; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px;">
                ×${(item.qty || 1).toLocaleString()}
              </span>
            </div>
            <div style="font-weight: 700; color: #fff; font-size: 0.78rem; line-height: 1.2; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.item_name}">
              ${isMvp ? '<span style="color:#ef4444; margin-right:2px;">⭐</span>' : ''}${item.item_name}
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; line-height: 1.3; min-height: 24px; max-height: 32px; overflow: hidden; margin-top: 2px;" title="${item.item_desc || ''}">
              ${item.item_desc || 'Không có mô tả'}
            </div>
          </div>

          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 0.68rem; color: #64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px;" title="Người bán: ${item.seller_name}">👤 ${item.seller_name}</span>
              <span style="font-size: 0.82rem; font-weight: 800; color: #fbbf24;">${(item.price_per || 0).toLocaleString()} <span style="font-size: 0.65rem; color: #94a3b8; font-weight: normal;">G</span></span>
            </div>
            <button class="btn btn-primary" onclick="openMarketBuyModal('${uid}', ${itemJson})" style="width: 100%; padding: 4px 0; font-size: 0.74rem; font-weight: 700; border-radius: 6px; background: #0284c7; border-color: #38bdf8;">
              🛒 Mua Ngay
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  window.onLiveMarketSearch = function(uid) {
    renderLiveMarketGrid(uid);
  };

  window.onLiveMarketFilterChange = function(uid) {
    renderLiveMarketGrid(uid);
  };

  // 3. Tải danh sách vật phẩm Đang Rao Bán
  window.loadMyListings = async function(uid, force = false) {
    const grid = document.getElementById(`mkt-mine-grid-${uid}`);
    if (!grid) return;

    if (!force && window.myListingsCache[uid] && window.myListingsCache[uid].listings) {
      renderMyListingsGrid(uid);
      return;
    }

    grid.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;"><span class="spinner" style="display:inline-block; margin-right:6px;"></span> Đang tải danh sách đang bán...</div>`;

    try {
      const res = await fetch(`/api/accounts/${uid}/market/my-listings`);
      const data = await res.json();
      if (!data.ok) {
        grid.innerHTML = `<div style="text-align: center; color: #f87171; padding: 24px 0; grid-column: 1 / -1;">❌ ${data.error || 'Lỗi tải danh sách'}</div>`;
        return;
      }

      window.myListingsCache[uid] = {
        listings: data.listings || [],
        gold: data.gold || 0
      };

      renderMyListingsGrid(uid);
    } catch (e) {
      grid.innerHTML = `<div style="text-align: center; color: #f87171; padding: 24px 0; grid-column: 1 / -1;">❌ Lỗi kết nối: ${e.message}</div>`;
    }
  };

  window.renderMyListingsGrid = function(uid) {
    const grid = document.getElementById(`mkt-mine-grid-${uid}`);
    if (!grid) return;

    const cache = window.myListingsCache[uid];
    if (!cache || !cache.listings || cache.listings.length === 0) {
      grid.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px 0; grid-column: 1 / -1;">📭 Bạn hiện không có vật phẩm nào đang treo bán trên chợ.</div>`;
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    grid.innerHTML = cache.listings.map(item => {
      const rarColor = RARITY_COLORS[item.item_rarity] || '#cbd5e1';
      const hoursLeft = Math.max(0, Math.round(((item.expires_at || 0) - now) / 3600));

      return `
        <div class="mkt-card-item" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255, 255, 255, 0.08); border-left: 3.5px solid ${rarColor}; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; gap: 4px;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: 1.25rem; line-height: 1;">${item.item_icon || '📦'}</span>
              <span style="font-size: 0.65rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.1); padding: 1px 5px; border-radius: 4px;">
                ⏳ Còn ${hoursLeft}h
              </span>
            </div>
            <div style="font-weight: 700; color: #fff; font-size: 0.78rem; line-height: 1.2; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.item_name}
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; line-height: 1.3; min-height: 24px; max-height: 32px; overflow: hidden; margin-top: 2px;">
              ${item.item_desc || ''}
            </div>
          </div>

          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 0.7rem; color: #cbd5e1;">Số lượng: <b>×${(item.qty || 1).toLocaleString()}</b></span>
              <span style="font-size: 0.82rem; font-weight: 800; color: #fbbf24;">${(item.price_per || 0).toLocaleString()} <span style="font-size: 0.65rem; color: #94a3b8; font-weight: normal;">G/món</span></span>
            </div>
            <button class="btn btn-secondary" onclick="cancelMarketListing('${uid}', ${item.id})" style="width: 100%; padding: 4px 0; font-size: 0.74rem; font-weight: 700; border-radius: 6px; color: #f87171; border-color: rgba(248, 113, 113, 0.3);">
              ❌ Hủy Bán (Thu hồi)
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  // 4. Modal Mua Vật Phẩm (Buy Modal)
  window.openMarketBuyModal = function(uid, item) {
    const modal = document.getElementById('manual-market-buy-modal');
    if (!modal) return;

    document.getElementById('mkt-buy-acc-uid').value = uid;
    document.getElementById('mkt-buy-listing-id').value = item.id;
    document.getElementById('mkt-buy-unit-price').value = item.price_per;
    document.getElementById('mkt-buy-max-qty').value = item.qty;

    const gold = window.liveMarketCache[uid]?.gold || 0;
    document.getElementById('mkt-buy-current-gold').value = gold;

    document.getElementById('mkt-buy-item-icon').innerHTML = item.item_icon || '📦';
    document.getElementById('mkt-buy-item-name').textContent = item.item_name;
    document.getElementById('mkt-buy-item-desc').textContent = item.item_desc || '';
    document.getElementById('mkt-buy-item-seller').textContent = `Người bán: ${item.seller_name} (Có sẵn: ×${item.qty})`;

    document.getElementById('mkt-buy-price-disp').textContent = `${(item.price_per || 0).toLocaleString()} G / món`;
    
    const qtyInput = document.getElementById('mkt-buy-qty-input');
    qtyInput.value = 1;
    qtyInput.max = item.qty;

    document.getElementById('mkt-buy-modal-error').textContent = '';
    calcBuyModalTotal();

    modal.style.display = 'flex';
  };

  window.closeMarketBuyModal = function() {
    const modal = document.getElementById('manual-market-buy-modal');
    if (modal) modal.style.display = 'none';
  };

  window.adjustBuyModalQty = function(delta) {
    const input = document.getElementById('mkt-buy-qty-input');
    const max = parseInt(document.getElementById('mkt-buy-max-qty').value) || 1;
    let cur = parseInt(input.value) || 1;
    cur = Math.max(1, Math.min(max, cur + delta));
    input.value = cur;
    calcBuyModalTotal();
  };

  window.setBuyModalMax = function() {
    const max = parseInt(document.getElementById('mkt-buy-max-qty').value) || 1;
    const unitPrice = parseInt(document.getElementById('mkt-buy-unit-price').value) || 1;
    const currentGold = parseInt(document.getElementById('mkt-buy-current-gold').value) || 0;
    const maxAffordable = unitPrice > 0 ? Math.floor(currentGold / unitPrice) : max;
    const finalQty = Math.max(1, Math.min(max, maxAffordable));
    document.getElementById('mkt-buy-qty-input').value = finalQty;
    calcBuyModalTotal();
  };

  window.calcBuyModalTotal = function() {
    const unitPrice = parseInt(document.getElementById('mkt-buy-unit-price').value) || 0;
    const maxQty = parseInt(document.getElementById('mkt-buy-max-qty').value) || 1;
    const currentGold = parseInt(document.getElementById('mkt-buy-current-gold').value) || 0;
    let qty = parseInt(document.getElementById('mkt-buy-qty-input').value) || 1;
    qty = Math.max(1, Math.min(maxQty, qty));
    document.getElementById('mkt-buy-qty-input').value = qty;

    const total = unitPrice * qty;
    const remain = currentGold - total;

    document.getElementById('mkt-buy-total-cost').textContent = `${total.toLocaleString()} G`;
    const remainElem = document.getElementById('mkt-buy-gold-remain');
    remainElem.textContent = `${remain.toLocaleString()} G`;
    remainElem.style.color = remain >= 0 ? '#4ade80' : '#f87171';

    const confirmBtn = document.getElementById('mkt-buy-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = remain < 0;
      confirmBtn.style.opacity = remain >= 0 ? '1' : '0.5';
    }
  };

  window.submitMarketBuy = async function() {
    const uid = document.getElementById('mkt-buy-acc-uid').value;
    const listingId = document.getElementById('mkt-buy-listing-id').value;
    const qty = parseInt(document.getElementById('mkt-buy-qty-input').value) || 1;
    const errElem = document.getElementById('mkt-buy-modal-error');
    const spinner = document.getElementById('mkt-buy-spinner');
    const confirmBtn = document.getElementById('mkt-buy-confirm-btn');

    if (!uid || !listingId) return;

    errElem.textContent = '';
    if (spinner) spinner.style.display = 'inline-block';
    if (confirmBtn) confirmBtn.disabled = true;

    try {
      const res = await fetch(`/api/accounts/${uid}/market/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, qty })
      });
      const data = await res.json();
      if (!data.ok) {
        errElem.textContent = data.error || 'Lỗi mua vật phẩm';
        return;
      }

      closeMarketBuyModal();
      alert('🛒 ' + (data.msg || 'Mua thành công!'));

      // Tải lại danh sách Live chợ & Gold
      loadLiveMarket(uid, true);
      fetchAccounts();
    } catch (e) {
      errElem.textContent = `Lỗi mạng: ${e.message}`;
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (confirmBtn) confirmBtn.disabled = false;
    }
  };

  // 5. Hủy Bán Vật Phẩm (Cancel Listing)
  window.cancelMarketListing = async function(uid, listingId) {
    if (!confirm('Bạn có chắc chắn muốn hủy bán vật phẩm này và thu hồi lại vào rương?')) return;

    try {
      const res = await fetch(`/api/accounts/${uid}/market/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId })
      });
      const data = await res.json();
      if (!data.ok) {
        alert('❌ ' + (data.error || 'Lỗi hủy bán'));
        return;
      }

      alert('❌ ' + (data.msg || 'Hủy bán thành công!'));
      loadMyListings(uid, true);
      fetchAccounts();
    } catch (e) {
      alert(`Lỗi mạng: ${e.message}`);
    }
  };

  // 6. Modal Đăng Bán Vật Phẩm (Sell Modal)
  let currentSellItem = null;
  window.openMarketSellModal = async function(uid) {
    const modal = document.getElementById('manual-market-sell-modal');
    if (!modal) return;

    document.getElementById('mkt-sell-acc-uid').value = uid;
    document.getElementById('mkt-sell-modal-error').textContent = '';
    currentSellItem = null;

    document.getElementById('mkt-sell-step-2').style.display = 'none';
    const confirmBtn = document.getElementById('mkt-sell-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
    }

    modal.style.display = 'flex';
    reloadSellInventory();
  };

  window.closeMarketSellModal = function() {
    const modal = document.getElementById('manual-market-sell-modal');
    if (modal) modal.style.display = 'none';
  };

  window.reloadSellInventory = async function() {
    const uid = document.getElementById('mkt-sell-acc-uid').value;
    const invGrid = document.getElementById('mkt-sell-inv-grid');
    if (!uid || !invGrid) return;

    invGrid.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px; grid-column:1 / -1;"><span class="spinner" style="display:inline-block; margin-right:6px;"></span> Đang tải vật phẩm trong túi đồ...</div>`;

    try {
      const res = await fetch(`/api/accounts/${uid}/market/inventory-for-sell`);
      const data = await res.json();
      if (!data.ok) {
        invGrid.innerHTML = `<div style="text-align:center; color:#f87171; padding:20px; grid-column:1 / -1;">❌ ${data.error || 'Lỗi tải túi đồ'}</div>`;
        return;
      }

      window.sellInventoryCache[uid] = data.items || [];
      filterSellInventory('all');
    } catch (e) {
      invGrid.innerHTML = `<div style="text-align:center; color:#f87171; padding:20px; grid-column:1 / -1;">❌ Lỗi kết nối: ${e.message}</div>`;
    }
  };

  window.filterSellInventory = function(cat) {
    const uid = document.getElementById('mkt-sell-acc-uid').value;
    const invGrid = document.getElementById('mkt-sell-inv-grid');
    const chipBtns = document.querySelectorAll('#mkt-sell-cat-chips .subtab-btn');
    chipBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.cat === cat));

    const items = window.sellInventoryCache[uid] || [];
    let filtered = items;

    if (cat === 'resource' || cat === 'diamond' || cat === 'ore' || cat === 'card' || cat === 'egg') {
      filtered = items.filter(it => it.item_type === cat);
    } else if (cat === 'boxes') {
      filtered = items.filter(it => it.item_type.endsWith('_box'));
    } else if (cat === 'modules') {
      filtered = items.filter(it => it.item_type.startsWith('module_') && !it.item_type.endsWith('_box'));
    }

    if (filtered.length === 0) {
      invGrid.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:20px; grid-column:1 / -1;">Túi đồ không có vật phẩm nào thuộc nhóm này.</div>`;
      return;
    }

    invGrid.innerHTML = filtered.map(item => {
      const rarColor = RARITY_COLORS[item.rarity] || '#cbd5e1';
      const isSel = currentSellItem && currentSellItem.id === item.id;
      const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');

      return `
        <div onclick="selectSellItem(${itemJson})" style="background: ${isSel ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0,0,0,0.3)'}; border: 1.5px solid ${isSel ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; border-left: 3px solid ${rarColor}; border-radius: 6px; padding: 6px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; gap: 2px;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:1.1rem;">${item.icon || '📦'}</span>
            <span style="font-size:0.65rem; font-weight:700; color:#4ade80;">×${item.qty}</span>
          </div>
          <div style="font-size:0.75rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.name}">
            ${item.name}
          </div>
          <div style="font-size:0.65rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${item.desc || ''}
          </div>
        </div>
      `;
    }).join('');
  };

  window.selectSellItem = function(item) {
    currentSellItem = item;
    const uid = document.getElementById('mkt-sell-acc-uid').value;
    filterSellInventory(document.querySelector('#mkt-sell-cat-chips .subtab-btn.active')?.dataset.cat || 'all');

    const step2 = document.getElementById('mkt-sell-step-2');
    step2.style.display = 'block';

    document.getElementById('mkt-sell-item-icon').innerHTML = item.icon || '📦';
    document.getElementById('mkt-sell-item-name').textContent = item.name;
    document.getElementById('mkt-sell-item-desc').textContent = item.desc || '';
    document.getElementById('mkt-sell-item-owned').textContent = `Trong túi: ×${item.qty}`;

    const priceInput = document.getElementById('mkt-sell-price-input');
    const qtyInput = document.getElementById('mkt-sell-qty-input');

    priceInput.value = item.suggested || 100;
    qtyInput.value = 1;
    qtyInput.max = item.qty;

    calcSellModalNet();

    const confirmBtn = document.getElementById('mkt-sell-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
    }
  };

  window.setSellModalMax = function() {
    if (!currentSellItem) return;
    document.getElementById('mkt-sell-qty-input').value = currentSellItem.qty;
    calcSellModalNet();
  };

  window.calcSellModalNet = function() {
    if (!currentSellItem) return;
    const price = Math.max(1, parseInt(document.getElementById('mkt-sell-price-input').value) || 1);
    let qty = parseInt(document.getElementById('mkt-sell-qty-input').value) || 1;
    qty = Math.max(1, Math.min(currentSellItem.qty, qty));
    document.getElementById('mkt-sell-qty-input').value = qty;

    const totalGross = price * qty;
    const feePerPiece = Math.ceil(price * 0.05);
    const totalFee = feePerPiece * qty;
    const net = (price - feePerPiece) * qty;

    document.getElementById('mkt-sell-fee-disp').textContent = `-${totalFee.toLocaleString()} G (${feePerPiece} G/món)`;
    document.getElementById('mkt-sell-net-disp').textContent = `${net.toLocaleString()} G`;
  };

  window.submitMarketSell = async function() {
    if (!currentSellItem) return;
    const uid = document.getElementById('mkt-sell-acc-uid').value;
    const price = parseInt(document.getElementById('mkt-sell-price-input').value) || 1;
    const qty = parseInt(document.getElementById('mkt-sell-qty-input').value) || 1;
    const errElem = document.getElementById('mkt-sell-modal-error');
    const spinner = document.getElementById('mkt-sell-spinner');
    const confirmBtn = document.getElementById('mkt-sell-confirm-btn');

    errElem.textContent = '';
    if (spinner) spinner.style.display = 'inline-block';
    if (confirmBtn) confirmBtn.disabled = true;

    try {
      const payload = {
        item_type: currentSellItem.item_type,
        item_id: currentSellItem.item_id,
        item_slot: currentSellItem.item_slot,
        item_tier: currentSellItem.item_tier,
        item_icon: currentSellItem.icon,
        item_name: currentSellItem.raw_name || currentSellItem.name,
        item_desc: currentSellItem.desc,
        item_rarity: currentSellItem.rarity,
        qty: qty,
        price_per: price,
        item_payload: currentSellItem.item_payload || null
      };

      const res = await fetch(`/api/accounts/${uid}/market/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) {
        errElem.textContent = data.error || 'Lỗi đăng bán';
        return;
      }

      closeMarketSellModal();
      alert('🏷️ ' + (data.msg || 'Đăng bán thành công!'));

      // Chuyển sang subtab "Đang Rao Bán" và làm mới
      switchMarketSubTab(uid, 'mine');
      fetchAccounts();
    } catch (e) {
      errElem.textContent = `Lỗi mạng: ${e.message}`;
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (confirmBtn) confirmBtn.disabled = false;
    }
  };

  // Render Cards Inventory & Exchange Panel (Compact 50% Height Layout)
  function renderCardBook(acc) {
    const el = document.getElementById(`cards-book-${acc.line_uid}`);
    const cntBadge = document.getElementById(`cards-cnt-val-${acc.line_uid}`);
    if (!el) return;

    const p = acc.player;
    const cardsData = (() => {
      if (!p || !p.cards) return {};
      if (typeof p.cards === 'object' && !Array.isArray(p.cards)) return p.cards;
      try { return JSON.parse(p.cards || '{}') || {}; } catch(e) { return {}; }
    })();

    const monMasters = acc.mon_masters || {};
    const STAT_COLORS = { str: '#ef4444', agi: '#22c55e', vit: '#f59e0b', dex: '#06b6d4', intel: '#a855f7', luk: '#eab308' };
    const STAT_LABELS = { str: 'STR', agi: 'AGI', vit: 'VIT', dex: 'DEX', intel: 'INT', luk: 'LUK' };
    const STAT_KEYS = ['str', 'agi', 'vit', 'dex', 'intel', 'luk'];

    const cardIds = Object.keys(cardsData);
    if (cntBadge) cntBadge.textContent = cardIds.length;

    if (cardIds.length === 0) {
      el.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); opacity: 0.85; font-size: 0.8rem; padding: 16px 0;">
          🎴 Chưa sở hữu thẻ bài nào trong kho. Hãy tiếp tục treo máy farm quái!
        </div>
      `;
      return;
    }

    let html = '';
    cardIds.forEach(mid => {
      const entry = cardsData[mid] || {};
      const countNormal = parseInt(entry.n) || 0;
      const countMvp = parseInt(entry.m) || 0;

      const defMon = MONSTER_DICT[mid] || {};
      const mm = monMasters[mid] || {};
      const monName = mm.n || mm.name || defMon.n || `Quái #${mid}`;
      const monLv = parseInt(mm.lv) || defMon.lv || Math.max(1, parseInt(mid) * 2);
      const monEmoji = mm.e || defMon.e || '👾';

      const statType = (mm.cs || defMon.cs || STAT_KEYS[(parseInt(mid) - 1) % 6]).toLowerCase();
      const statLabel = STAT_LABELS[statType] || statType.toUpperCase();
      const statColor = STAT_COLORS[statType] || '#a855f7';

      // Stat values (Math.ceil(Lv / 10) * 1 for normal, * 3 for MVP)
      const valNormal = Math.ceil(monLv / 10) * 1;
      const valMvp = Math.ceil(monLv / 10) * 3;

      // MVP Combat Bonus calculation (2nd attribute when socketed in Module)
      const cbTypes = ['str','agi','vit','dex','intel','luk','atk','armor','hp','mp','hp_regen','mp_regen'];
      const cbType = cbTypes[Math.abs(parseInt(mid)) % 12];
      let cbVal = 0;
      if (cbType === 'hp' || cbType === 'mp') cbVal = Math.round(monLv * 30 / 4);
      else if (cbType === 'armor') cbVal = Math.ceil(monLv / 10) * 30;
      else if (cbType === 'hp_regen' || cbType === 'mp_regen') cbVal = Math.max(1, Math.floor(monLv / 10)) * 3;
      else cbVal = Math.ceil(monLv / 10) * 3;
      const cbLabel = cbType.toUpperCase();

      const N = 100;
      const isReady = countNormal >= N;
      const pct = Math.min(100, Math.round((countNormal / N) * 100));

      html += `
        <div class="card-item-box compact">
          <div class="card-item-header">
            <div class="card-title-wrap">
              <span class="card-mon-emoji">${monEmoji}</span>
              <span class="card-mon-name">${monName}</span>
              <span class="card-mon-lv">Lv.${monLv}</span>
            </div>
            <div class="card-progress-badge ${isReady ? 'ready' : ''}">
              <b>${countNormal}</b> / ${N} ${isReady ? '✓' : ''}
            </div>
          </div>

          <div class="card-exchange-progress">
            <div class="card-exchange-fill" style="width: ${pct}%; background: ${isReady ? '#22c55e' : '#f59e0b'};"></div>
          </div>

          <div class="card-types-container">
            <div class="card-type-subbox normal">
              <span class="card-type-lbl" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎴 <b style="color: ${statColor};">+${valNormal} ${statLabel}</b></span>
              <span class="card-type-count">(<b>${countNormal}</b>)</span>
            </div>

            <div class="card-type-subbox mvp" title="Thuộc tính khảm Module: +${cbVal} ${cbLabel}">
              <span class="card-type-lbl" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">⭐ <b style="color: #f43f5e;">+${valMvp}${statLabel}</b> <span style="color:#a78bfa; font-size:0.42rem;">(+${cbVal}${cbLabel})</span></span>
              <span class="card-type-count">(<b>${countMvp}</b>)</span>
            </div>
          </div>

          <button class="btn-exchange-mvp ${isReady ? 'ready' : 'disabled'}" 
            onclick="exchangeMvpCard('${acc.line_uid}', '${mid}', ${countNormal})"
            ${isReady ? '' : 'disabled'}>
            🔄 Đổi 1 Thẻ MVP (100 ➔ 1 ⭐)
          </button>
        </div>
      `;
    });

    el.innerHTML = html;
  }

  // Handle Exchange MVP Card Action
  window.exchangeMvpCard = async function(uid, mid, countNormal) {
    if (countNormal < 100) {
      alert('Bạn chưa đủ 100 Thẻ Thường để đổi 1 Thẻ MVP!');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn dùng 100 Thẻ Thường để đổi lấy 1 Thẻ ⭐ MVP không?')) {
      return;
    }
    try {
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'card_mvp_exchange', extra: { mid } })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.msg || 'Đổi Thẻ MVP thành công!');
        if (window.fetchAccounts) window.fetchAccounts();
      } else {
        alert(data.error || 'Đổi Thẻ MVP thất bại!');
      }
    } catch(e) {
      alert('Lỗi kết nối: ' + e.message);
    }
  };

  // Render Pet Eggs Inventory & Exchange Panel
  function renderEggBook(acc) {
    const el = document.getElementById(`eggs-book-${acc.line_uid}`);
    const cntBadge = document.getElementById(`eggs-cnt-val-${acc.line_uid}`);
    if (!el) return;

    const p = acc.player;
    const eggsData = (() => {
      if (!p || !p.eggs) return {};
      if (typeof p.eggs === 'object' && !Array.isArray(p.eggs)) return p.eggs;
      try { return JSON.parse(p.eggs || '{}') || {}; } catch(e) { return {}; }
    })();

    const monMasters = acc.mon_masters || {};
    const eggIds = Object.keys(eggsData);
    if (cntBadge) cntBadge.textContent = eggIds.length;

    if (eggIds.length === 0) {
      el.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); opacity: 0.85; font-size: 0.8rem; padding: 16px 0;">
          🥚 Chưa sở hữu trứng thú cưng nào trong kho. Hãy tiếp tục đánh quái để nhặt trứng!
        </div>
      `;
      return;
    }

    let html = '';
    eggIds.forEach(mid => {
      const entry = eggsData[mid] || {};
      const countNormal = parseInt(entry.n) || 0;
      const countMvp = parseInt(entry.m) || 0;

      const mm = monMasters[mid] || {};
      const monName = mm.n || mm.name || `Quái #${mid}`;
      const monLv = parseInt(mm.lv) || 1;
      const monEmoji = mm.e || '👾';

      const hatchCostNorm = monLv * 100;

      const N = 100;
      const isReady = countNormal >= N;
      const pct = Math.min(100, Math.round((countNormal / N) * 100));

      html += `
        <div class="card-item-box compact">
          <div class="card-item-header">
            <div class="card-title-wrap">
              <span class="card-mon-emoji">🥚 ${monEmoji}</span>
              <span class="card-mon-name">${monName}</span>
              <span class="card-mon-lv">Lv.${monLv}</span>
            </div>
            <div class="card-progress-badge ${isReady ? 'ready' : ''}">
              <b>${countNormal}</b> / ${N} ${isReady ? '✓' : ''}
            </div>
          </div>

          <div class="card-exchange-progress">
            <div class="card-exchange-fill" style="width: ${pct}%; background: ${isReady ? '#22c55e' : '#f59e0b'};"></div>
          </div>

          <div class="card-types-container">
            <div class="card-type-subbox normal">
              <span class="card-type-lbl">🥚 Thường</span>
              <b style="color:${countNormal > 0 ? '#38bdf8' : '#94a3b8'}; font-size:0.52rem;">${countNormal}</b>
            </div>

            <div class="card-type-subbox mvp">
              <span class="card-type-lbl">⭐🥚 MVP</span>
              <b style="color:${countMvp > 0 ? '#f43f5e' : '#94a3b8'}; font-size:0.52rem;">${countMvp}</b>
            </div>
          </div>

          <button class="btn-exchange-mvp ${isReady ? 'ready' : 'disabled'}" 
            onclick="exchangeMvpEgg('${acc.line_uid}', '${mid}', ${countNormal})"
            ${isReady ? '' : 'disabled'}>
            🔄 Đổi 1 Trứng MVP (100 ➔ 1 ⭐)
          </button>
        </div>
      `;
    });

    el.innerHTML = html;
  }

  // Handle Exchange MVP Egg Action
  window.exchangeMvpEgg = async function(uid, mid, countNormal) {
    if (countNormal < 100) {
      alert('Bạn chưa đủ 100 Trứng Thường để đổi 1 Trứng MVP!');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn dùng 100 Trứng Thường để đổi lấy 1 Trứng ⭐ MVP không?')) {
      return;
    }
    try {
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'egg_mvp_exchange', extra: { mid } })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.msg || 'Đổi Trứng MVP thành công!');
        if (window.fetchAccounts) window.fetchAccounts();
      } else {
        alert(data.error || 'Đổi Trứng MVP thất bại!');
      }
    } catch(e) {
      alert('Lỗi kết nối: ' + e.message);
    }
  };

  // Handle Hatch Pet Egg Action
  window.hatchPetEgg = async function(uid, mid, isMvp, cost) {
    if (!confirm(`Bạn có chắc chắn muốn tiêu tốn ${cost.toLocaleString()} Gold để ấp trứng thú cưng này không?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pet_hatch', extra: { mid, mvp: isMvp ? 1 : 0 } })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.msg || 'Ấp trứng thú cưng thành công!');
        if (window.fetchAccounts) window.fetchAccounts();
      } else {
        alert(data.error || 'Ấp trứng thất bại!');
      }
    } catch(e) {
      alert('Lỗi kết nối: ' + e.message);
    }
  };

  // Fetch account terminal logs
  async function fetchLogs(uid) {
    try {
      const response = await fetch(`/api/accounts/${uid}/logs`);
      const data = await response.json();
      
      // Update general logs
      const term = document.getElementById(`terminal-${uid}`);
      if (term) {
        term.innerHTML = '';
        const logsList = data.logs || [];
        if (logsList.length === 0) {
          term.innerHTML = `<div class="log-line"><span class="log-text-content">Không có nhật ký hoạt động nào.</span></div>`;
        } else {
          logsList.forEach(l => {
            const line = document.createElement('div');
            line.className = 'log-line';
            
            let typeClass = 'system';
            if (l.type === 'kill') typeClass = 'kill';
            else if (l.type === 'drop') typeClass = 'drop';
            else if (l.type === 'levelup') typeClass = 'levelup';
            else if (l.type === 'error') typeClass = 'error';
            else if (l.type === 'action') typeClass = 'action';
            
            line.innerHTML = `
              <span class="log-time">[${l.time}]</span>
              <span class="log-type ${typeClass}">${l.type}</span>
              <span class="log-text-content">${l.msg}</span>
            `;
            term.appendChild(line);
          });
        }
        term.scrollTop = term.scrollHeight;
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }

  // Fetch official drop logs on-demand from server game
  window.fetchDropLogs = async function(uid) {
    const lootTerm = document.getElementById(`loot-terminal-${uid}`);
    if (!lootTerm) return;

    lootTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#a7f3d0; font-size:0.6rem;">⏳ Đang tải lịch sử rơi đồ từ máy chủ...</span></div>`;

    try {
      const response = await fetch(`/api/accounts/${uid}/droplogs`);
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(!contentType.includes('application/json') 
          ? 'Server chưa nạp API mới (Vui lòng khởi động lại server.js bằng Ctrl+C và npm start)' 
          : `Lỗi HTTP ${response.status}`);
      }

      const data = await response.json();

      lootTerm.innerHTML = '';
      if (!data.ok || !data.drops || data.drops.length === 0) {
        lootTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="font-size:0.6rem;">Chưa có lịch sử rơi đồ nào trên máy chủ.</span></div>`;
        return;
      }

      data.drops.forEach(item => {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.style.cssText = 'display:flex; align-items:center; gap:8px; padding:4px 6px; border-bottom:1px solid rgba(255,255,255,0.05);';

        const badgeStyle = item.isOffline ? 'background:rgba(147,51,234,0.2); color:#c084fc; border:1px solid rgba(147,51,234,0.4);' : 'background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.4);';
        const badgeText = item.isOffline ? '🌙 Offline' : '🟢 Online';

        let highlightStyle = '';
        if (item.category === 'card') highlightStyle = 'color:#fbbf24; font-weight:700;';
        else if (item.category === 'egg') highlightStyle = 'color:#f472b6; font-weight:700;';
        else if (item.category === 'equipment') highlightStyle = 'color:#60a5fa; font-weight:700;';
        else if (item.category === 'gem') highlightStyle = 'color:#38bdf8; font-weight:700;';

        line.innerHTML = `
          <span style="color:var(--text-muted); font-size:0.6rem; min-width:115px;">[${item.time}]</span>
          <span style="font-size:0.56rem; padding:1px 5px; border-radius:4px; ${badgeStyle}">${badgeText}</span>
          <span style="font-size:0.72rem;">${item.icon}</span>
          <span style="flex:1; font-size:0.68rem; ${highlightStyle}">${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
        `;
        lootTerm.appendChild(line);
      });
    } catch (err) {
      console.error('Error fetching droplogs:', err);
      lootTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#ef4444; font-size:0.6rem;">❌ Lỗi kết nối máy chủ: ${err.message}</span></div>`;
    }
  };

  // Fetch market history on-demand from game server
  window.fetchMarketHistory = async function(uid) {
    const marketTerm = document.getElementById(`market-terminal-${uid}`);
    if (!marketTerm) return;

    marketTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#a7f3d0; font-size:0.6rem;">⏳ Đang tải lịch sử chợ từ máy chủ...</span></div>`;

    try {
      const response = await fetch(`/api/accounts/${uid}/market-history`);
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(!contentType.includes('application/json') 
          ? 'Server chưa nạp API mới (Vui lòng khởi động lại server.js bằng Ctrl+C và npm start)' 
          : `Lỗi HTTP ${response.status}`);
      }

      const data = await response.json();

      marketTerm.innerHTML = '';

      // Render summary if available
      if (data.summary) {
        const sumLine = document.createElement('div');
        sumLine.className = 'log-line';
        sumLine.style.cssText = 'padding:4px 6px; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.08); font-weight:600; color:#fbbf24; font-size:0.65rem;';
        sumLine.innerHTML = `📊 ${data.summary}`;
        marketTerm.appendChild(sumLine);
      }

      // Render message if available
      if (data.message) {
        const msgLine = document.createElement('div');
        msgLine.className = 'log-line';
        msgLine.style.cssText = 'padding:4px 6px; font-size:0.62rem; color:var(--text-secondary);';
        msgLine.innerHTML = `ℹ️ ${data.message}`;
        marketTerm.appendChild(msgLine);
      }

      if (!data.history || data.history.length === 0) {
        if (!data.summary && !data.message) {
          marketTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="font-size:0.6rem;">Chưa có lịch sử giao dịch chợ nào trên máy chủ.</span></div>`;
        }
        return;
      }

      data.history.forEach(item => {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.style.cssText = 'display:flex; align-items:center; gap:8px; padding:4px 6px; border-bottom:1px solid rgba(255,255,255,0.05);';

        let badgeStyle = 'background:rgba(100,116,139,0.2); color:#94a3b8; border:1px solid rgba(100,116,139,0.4);';
        if (item.typeLabel === 'Đã bán') badgeStyle = 'background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.4);';
        else if (item.typeLabel === 'Đã mua') badgeStyle = 'background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.4);';
        else if (item.typeLabel === 'Hết hạn') badgeStyle = 'background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.4);';
        else if (item.typeLabel === 'Đã hủy') badgeStyle = 'background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.4);';

        const priceStr = item.price ? `${item.price.toLocaleString()}G` : '';
        const timeDisplay = item.time ? `[${item.time}]` : '';

        line.innerHTML = `
          ${timeDisplay ? `<span style="color:var(--text-muted); font-size:0.6rem; min-width:115px;">${timeDisplay}</span>` : ''}
          <span style="font-size:0.56rem; padding:1px 5px; border-radius:4px; ${badgeStyle}">${item.typeIcon} ${item.typeLabel}</span>
          <span style="flex:1; font-size:0.68rem; color:#e2e8f0;">${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
          ${priceStr ? `<span style="font-size:0.65rem; color:#fbbf24; font-weight:600;">${priceStr}</span>` : ''}
        `;
        marketTerm.appendChild(line);
      });
    } catch (err) {
      console.error('Error fetching market history:', err);
      marketTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#ef4444; font-size:0.6rem;">❌ Lỗi kết nối máy chủ: ${err.message}</span></div>`;
    }
  };

  // Switch Event Sub-Tab
  window.switchEventSubTab = function(uid, subTabId) {
    activeEventSubTabs[uid] = subTabId;
    
    const btnCfg = document.getElementById(`event-subtab-btn-cfg-${uid}`);
    const btnHistory = document.getElementById(`event-subtab-btn-history-${uid}`);
    
    const paneCfg = document.getElementById(`event-subpane-cfg-${uid}`);
    const paneHistory = document.getElementById(`event-subpane-history-${uid}`);
    
    if (btnCfg) btnCfg.classList.toggle('active', subTabId === 'cfg');
    if (btnHistory) btnHistory.classList.toggle('active', subTabId === 'history');
    
    if (paneCfg) paneCfg.style.display = subTabId === 'cfg' ? 'block' : 'none';
    if (paneHistory) paneHistory.style.display = subTabId === 'history' ? 'block' : 'none';
    
    // Clear existing interval for this bot event history
    if (!window._eventHistoryIntervals) window._eventHistoryIntervals = {};
    if (window._eventHistoryIntervals[uid]) {
      clearInterval(window._eventHistoryIntervals[uid]);
      delete window._eventHistoryIntervals[uid];
    }
    
    if (subTabId === 'history') {
      fetchEventWarHistory(uid);
      // Auto-refresh event history every 8 seconds while active
      window._eventHistoryIntervals[uid] = setInterval(() => {
        const pane = document.getElementById(`pane-event-${uid}`);
        const subpane = document.getElementById(`event-subpane-history-${uid}`);
        if (pane && pane.classList.contains('active') && subpane && subpane.style.display !== 'none') {
          fetchEventWarHistory(uid);
        } else {
          clearInterval(window._eventHistoryIntervals[uid]);
          delete window._eventHistoryIntervals[uid];
        }
      }, 8000);
    }
  };

  // Switch MVP Sub-Tab
  window.switchMvpSubTab = function(uid, subTabId) {
    activeMvpSubTabs[uid] = subTabId;

    const btnCfg = document.getElementById(`mvp-subtab-btn-cfg-${uid}`);
    const btnMonitor = document.getElementById(`mvp-subtab-btn-monitor-${uid}`);

    const paneCfg = document.getElementById(`mvp-subpane-cfg-${uid}`);
    const paneMonitor = document.getElementById(`mvp-subpane-monitor-${uid}`);

    if (btnCfg) btnCfg.classList.toggle('active', subTabId === 'cfg');
    if (btnMonitor) btnMonitor.classList.toggle('active', subTabId === 'monitor');

    if (paneCfg) paneCfg.style.display = subTabId === 'cfg' ? 'block' : 'none';
    if (paneMonitor) paneMonitor.style.display = subTabId === 'monitor' ? 'block' : 'none';

    // Clear existing interval for boss log
    if (!window._bossLogIntervals) window._bossLogIntervals = {};
    if (window._bossLogIntervals[uid]) {
      clearInterval(window._bossLogIntervals[uid]);
      delete window._bossLogIntervals[uid];
    }

    if (subTabId === 'monitor') {
      fetchBossLog(uid);
      // Auto-refresh boss log every 5 seconds while active
      window._bossLogIntervals[uid] = setInterval(() => {
        const pane = document.getElementById(`pane-mvp-${uid}`);
        const subpane = document.getElementById(`mvp-subpane-monitor-${uid}`);
        if (pane && pane.classList.contains('active') && subpane && subpane.style.display !== 'none' && activeTabs[uid] === 'mvp' && activeMvpSubTabs[uid] === 'monitor') {
          fetchBossLog(uid);
        } else {
          clearInterval(window._bossLogIntervals[uid]);
          delete window._bossLogIntervals[uid];
        }
      }, 5000);
    }
  };

  // Fetch bot event war history
  window.fetchEventWarHistory = async function(uid) {
    const listContainer = document.getElementById(`event-history-list-${uid}`);
    if (!listContainer) return;

    try {
      const response = await fetch(`/api/accounts/${uid}/event-war-history`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.ok) {
        // Initialize client-side cache
        window._warHistoryCache = window._warHistoryCache || {};
        
        let pName = data.playerName || '';
        // Fallback: lookup in lastFetchedAccounts if server hasn't polled player name yet
        if (!pName && window.lastFetchedAccounts) {
          const matchedAcc = window.lastFetchedAccounts.find(a => a.line_uid === uid);
          if (matchedAcc && matchedAcc.player && matchedAcc.player.name) {
            pName = matchedAcc.player.name;
          }
        }

        window._warHistoryCache[uid] = {
          playerName: pName,
          history: data.history || [],
          currentTab: (window._warHistoryCache[uid] && window._warHistoryCache[uid].currentTab) || 'all'
        };
        renderEventWarHistory(uid);
      } else {
        listContainer.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px 0;">Lỗi: ${data.error || 'Không thể lấy lịch sử'}</div>`;
      }
    } catch (err) {
      console.error('Error fetching event war history:', err);
      listContainer.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 20px 0;">Lỗi kết nối: ${err.message}</div>`;
    }
  };

  // Clear bot event war history
  window.clearEventWarHistory = async function(uid) {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch sử chiến trận của tài khoản này không?')) return;
    const listContainer = document.getElementById(`event-history-list-${uid}`);
    if (listContainer) {
      listContainer.innerHTML = `<div style="text-align: center; color: #64748b; padding: 20px 0;">⏳ Đang xóa...</div>`;
    }

    try {
      const response = await fetch(`/api/accounts/${uid}/event-war-history`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        if (window._warHistoryCache && window._warHistoryCache[uid]) {
          window._warHistoryCache[uid].history = [];
        }
        fetchEventWarHistory(uid);
      } else {
        alert('🔴 Lỗi: ' + (data.error || 'Không thể xóa lịch sử'));
        fetchEventWarHistory(uid);
      }
    } catch (err) {
      alert(`❌ Lỗi kết nối: ${err.message}`);
      fetchEventWarHistory(uid);
    }
  };

  // Switch tabs
  window.switchWarHistoryTab = function(uid, tab) {
    if (!window._warHistoryCache || !window._warHistoryCache[uid]) return;
    window._warHistoryCache[uid].currentTab = tab;
    
    // Update active tab class styling
    const tabs = document.querySelectorAll(`.war-tab-${uid}`);
    tabs.forEach(t => {
      const isTarget = t.getAttribute('onclick').includes(`'${tab}'`);
      if (isTarget) {
        t.classList.add('active');
        t.style.background = 'rgba(255,255,255,0.08)';
        t.style.borderColor = 'var(--border-color)';
        t.style.color = '#fff';
        t.style.fontWeight = '700';
      } else {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.borderColor = 'transparent';
        t.style.color = '#94a3b8';
        t.style.fontWeight = 'normal';
      }
    });
    
    renderEventWarHistory(uid);
  };

  // Render event war history
  function renderEventWarHistory(uid) {
    const listContainer = document.getElementById(`event-history-list-${uid}`);
    const statsContainer = document.getElementById(`event-war-stats-${uid}`);
    if (!listContainer) return;

    const cache = window._warHistoryCache ? window._warHistoryCache[uid] : null;
    if (!cache || !cache.history || cache.history.length === 0) {
      if (statsContainer) statsContainer.innerHTML = '';
      listContainer.innerHTML = `<div style="text-align: center; color: #64748b; padding: 20px 0;">Chưa có lịch sử chiến đấu. Lịch sử được tự động thu thập từ server khi bot tham gia Bang Chiến/Quốc Chiến.</div>`;
      return;
    }

    const playerName = cache.playerName || '';
    const history = cache.history;
    const currentTab = cache.currentTab || 'all';

    // Calculate self-centric statistics
    const selfKills = history.filter(item => {
      const k = (item.killer || '').toLowerCase().trim();
      const p = (playerName || '').toLowerCase().trim();
      return k && p && k === p;
    });
    const selfDeaths = history.filter(item => {
      const v = (item.victim || '').toLowerCase().trim();
      const p = (playerName || '').toLowerCase().trim();
      return v && p && v === p;
    });
    const totalPoints = selfKills.reduce((sum, item) => sum + item.points, 0);
    const kdRatio = selfDeaths.length === 0 ? selfKills.length.toFixed(1) : (selfKills.length / selfDeaths.length).toFixed(2);

    // Update stats panel
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 6px 8px; text-align: center; font-size: 0.72rem;">
          <div>
            <div style="color: #94a3b8; font-size: 0.65rem; margin-bottom: 2px;">🗡️ Hạ gục</div>
            <div style="color: #4ade80; font-weight: 800; font-size: 0.85rem; font-variant-numeric: tabular-nums;">${selfKills.length}</div>
          </div>
          <div>
            <div style="color: #94a3b8; font-size: 0.65rem; margin-bottom: 2px;">💀 Bị hạ</div>
            <div style="color: #f87171; font-weight: 800; font-size: 0.85rem; font-variant-numeric: tabular-nums;">${selfDeaths.length}</div>
          </div>
          <div>
            <div style="color: #94a3b8; font-size: 0.65rem; margin-bottom: 2px;">📊 Tỉ lệ K/D</div>
            <div style="color: #38bdf8; font-weight: 800; font-size: 0.85rem; font-variant-numeric: tabular-nums;">${kdRatio}</div>
          </div>
          <div>
            <div style="color: #94a3b8; font-size: 0.65rem; margin-bottom: 2px;">🏆 Điểm PK</div>
            <div style="color: #fbbf24; font-weight: 800; font-size: 0.85rem; font-variant-numeric: tabular-nums;">+${totalPoints}</div>
          </div>
        </div>
      `;
    }

    // Filter history based on tab
    let displayList = history;
    if (currentTab === 'kills') {
      displayList = selfKills;
    } else if (currentTab === 'deaths') {
      displayList = selfDeaths;
    }

    if (displayList.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: #64748b; padding: 25px 0;">Không tìm thấy bản ghi phù hợp.</div>`;
      return;
    }

    listContainer.innerHTML = displayList.map((item, idx) => {
      const d = new Date(item.time);
      const timeStr = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      
      const eventBadge = item.eventKind === 'gw' 
        ? `<span style="background: rgba(168, 85, 247, 0.15); color: #e9d5ff; padding: 1px 4px; border-radius: 4px; font-size: 0.62rem; margin-right: 4px; border: 1px solid rgba(168, 85, 247, 0.3)">Bang</span>`
        : `<span style="background: rgba(14, 165, 233, 0.15); color: #bae6fd; padding: 1px 4px; border-radius: 4px; font-size: 0.62rem; margin-right: 4px; border: 1px solid rgba(14, 165, 233, 0.3)">Quốc</span>`;
        
      const isSelfKill = (item.killer || '').toLowerCase().trim() === (playerName || '').toLowerCase().trim();
      const isSelfDeath = (item.victim || '').toLowerCase().trim() === (playerName || '').toLowerCase().trim();

      let killerStr = '';
      let victimStr = '';
      let pointStr = '';
      let rowStyle = `padding: 5px 6px; border-bottom: 1px solid rgba(255,255,255,0.03); display: block; line-height: 1.45; overflow: hidden;`;
      
      if (isSelfKill) {
        rowStyle += ` border-left: 3px solid #22c55e; background: rgba(34, 197, 94, 0.06);`;
        killerStr = `<span style="color: #4ade80; font-weight: 700;">★ Bạn</span>`;
        victimStr = item.victimTag ? `<span style="color: #e2e8f0;">[${item.victimTag}] ${item.victim}</span>` : `<span style="color: #e2e8f0;">${item.victim}</span>`;
        pointStr = `<span style="color: #4ade80; font-weight: 800; float: right;">+${item.points}</span>`;
      } else if (isSelfDeath) {
        rowStyle += ` border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.06);`;
        killerStr = item.killerTag ? `<span style="color: #e2e8f0;">[${item.killerTag}] ${item.killer}</span>` : `<span style="color: #e2e8f0;">${item.killer}</span>`;
        victimStr = `<span style="color: #f87171; font-weight: 700;">★ Bạn 💀</span>`;
        pointStr = `<span style="color: #ef4444; font-weight: 800; float: right;">0</span>`;
      } else {
        if (idx % 2) {
          rowStyle += ` background: rgba(255,255,255,0.01);`;
        }
        killerStr = item.killerTag ? `<span>[${item.killerTag}] ${item.killer}</span>` : `<span>${item.killer}</span>`;
        victimStr = item.victimTag ? `<span>[${item.victimTag}] ${item.victim}</span>` : `<span>${item.victim}</span>`;
        pointStr = item.points > 0 ? `<span style="color: #4ade80; font-weight: 800; float: right;">+${item.points}</span>` : `<span style="color: #6b7280; float: right;">--</span>`;
      }

      return `
        <div style="${rowStyle}">
          <span style="color: #64748b; margin-right: 6px; font-variant-numeric: tabular-nums;">${timeStr}</span>
          ${eventBadge}
          <span>${killerStr} ⚔️ ${victimStr}</span>
          ${pointStr}
        </div>
      `;
    }).join('');
  }

  // Helper formatting for milliseconds
  function fmtMs(ms) {
    if (!ms || ms <= 0) return '—';
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m${secs}s`;
  }

  // Compute MVP Boss hunting statistics
  function computeBossStats(log) {
    const kills = log.filter(e => e.event === 'boss_killed');
    const losts = log.filter(e => e.event === 'boss_lost');
    const cycles = log.filter(e => e.event === 'cycle_done');
    const mapCounts = {};
    kills.forEach(k => {
      if (k.mapId) mapCounts[k.mapId] = (mapCounts[k.mapId] || 0) + 1;
    });
    const mapEntries = Object.entries(mapCounts).sort((a, b) => b[1] - a[1]);
    const hotMap = mapEntries.length > 0 ? mapEntries[0][0] : '-';
    const hotMapCount = mapEntries.length > 0 ? mapEntries[0][1] : 0;
    const totalMs = kills.reduce((s, k) => s + (k.durationMs || 0), 0);
    const avgDurMs = kills.length > 0 ? Math.round(totalMs / kills.length) : 0;

    const totalKills = kills.length;
    const totalLosts = losts.length;
    const successRate = (totalKills + totalLosts) > 0 ? Math.round((totalKills / (totalKills + totalLosts)) * 100) : 100;
    const totalCycleTimeMs = cycles.reduce((s, c) => s + (c.totalTimeMs || 0), 0);

    return {
      totalKills,
      totalCycles: cycles.length,
      avgDurMs,
      hotMap,
      hotMapCount,
      successRate,
      totalCycleTimeMs
    };
  }

  // Render Boss Hunt Journal UI
  function renderBossLog(uid, log) {
    const statsContainer = document.getElementById(`boss-stats-${uid}`);
    if (statsContainer) {
      const st = computeBossStats(log);
      statsContainer.innerHTML = `
        <div class="boss-stats-grid" style="grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 6px 8px; background: rgba(192, 132, 252, 0.08); border: 1px solid rgba(192, 132, 252, 0.2); border-radius: 6px;">
          <div class="boss-stat-item">
            <span class="bsi-val">💀 ${st.totalKills}</span>
            <span class="bsi-label">Boss đã hạ</span>
          </div>
          <div class="boss-stat-item" title="Tỷ lệ hạ Boss thành công so với bị người khác Ks">
            <span class="bsi-val" style="color: ${st.successRate >= 70 ? '#34d399' : (st.successRate >= 40 ? '#fbbf24' : '#ef4444')};">🎯 ${st.successRate}%</span>
            <span class="bsi-label">Tỷ lệ diệt</span>
          </div>
          <div class="boss-stat-item">
            <span class="bsi-val">🔄 ${st.totalCycles}</span>
            <span class="bsi-label">Chu kỳ chạy</span>
          </div>
          <div class="boss-stat-item">
            <span class="bsi-val">⏱️ ${fmtMs(st.avgDurMs)}</span>
            <span class="bsi-label">TB / Boss</span>
          </div>
          <div class="boss-stat-item" title="Tổng thời gian chạy trong các chu kỳ xoay vòng">
            <span class="bsi-val">⏳ ${fmtMs(st.totalCycleTimeMs)}</span>
            <span class="bsi-label">Tổng tg săn</span>
          </div>
          <div class="boss-stat-item">
            <span class="bsi-val">🗺️ Map ${st.hotMap}</span>
            <span class="bsi-label">${st.hotMapCount} Boss</span>
          </div>
        </div>
      `;
    }

    const term = document.getElementById(`boss-terminal-${uid}`);
    if (!term) return;
    if (!log || log.length === 0) {
      term.innerHTML = `<div class="log-line"><span class="log-text-content" style="font-size:0.68rem; color:var(--text-muted);">Chưa có nhật ký sự kiện săn Boss.</span></div>`;
      return;
    }

    // Show newest first
    const reversed = [...log].reverse();
    term.innerHTML = reversed.map(e => {
      let icon = '📌';
      let title = e.event;
      let colorStyle = 'color:#94a3b8;';
      let detail = '';

      if (e.event === 'cycle_start') {
        icon = '🚀';
        title = 'Bắt đầu chu kỳ săn Boss';
        colorStyle = 'color:#60a5fa; font-weight:600;';
        detail = `Bản đồ: ${e.maps || ''} (Gốc: Map ${e.originMap || '?'})`;
      } else if (e.event === 'boss_found') {
        icon = '👁️';
        title = 'Phát hiện Boss';
        colorStyle = 'color:#fbbf24; font-weight:600;';
        detail = `${e.bossEmoji || '👾'} <b>${e.bossName || 'Boss'}</b> Lv.${e.bossLv || 1} (HP: ${e.hpPct || 100}%) [Map ${e.mapId}]`;
      } else if (e.event === 'boss_killed') {
        icon = '💀';
        title = 'Hạ gục Boss';
        colorStyle = 'color:#4ade80; font-weight:700;';
        detail = `${e.bossEmoji || '👾'} <b>${e.bossName || 'Boss'}</b> Lv.${e.bossLv || 1} [Map ${e.mapId}] — ⏱️ <b>${fmtMs(e.durationMs)}</b>`;
      } else if (e.event === 'boss_lost') {
        icon = '❌';
        title = 'Mất dấu Boss';
        colorStyle = 'color:#f87171; font-weight:600;';
        detail = `${e.bossEmoji || '👾'} <b>${e.bossName || 'Boss'}</b> Lv.${e.bossLv || 1} [Map ${e.mapId}] bị cướp hoặc mất dấu — ⏱️ <b>${fmtMs(e.durationMs)}</b>`;
      } else if (e.event === 'map_clear') {
        const killed = e.bossKilledCount || 0;
        icon = killed > 0 ? '✅' : '🔍';
        title = killed > 0 ? 'Dọn sạch Boss Map' : 'Không có Boss';
        colorStyle = killed > 0 ? 'color:#34d399; font-weight:600;' : 'color:#94a3b8; font-weight:600;';
        detail = killed > 0 
          ? `<b>Map ${e.mapId}</b> — Hạ ${killed} Boss (⏱️ ${fmtMs(e.timeSpentMs)})`
          : `<b>Map ${e.mapId}</b> — Không có Boss mục tiêu (⏱️ ${fmtMs(e.timeSpentMs)})`;
      } else if (e.event === 'map_timeout') {
        icon = '⏰';
        title = 'Timeout Map';
        colorStyle = 'color:#f87171; font-weight:600;';
        detail = `<b>Map ${e.mapId}</b> — Hết thời gian chờ (⏱️ ${fmtMs(e.timeSpentMs)})`;
      } else if (e.event === 'warp') {
        icon = '🗺️';
        title = 'Chuyển Map săn';
        colorStyle = 'color:#818cf8;';
        detail = `Sang <b>Map ${e.mapId}</b>`;
      } else if (e.event === 'cycle_done') {
        icon = '🏁';
        title = 'Hoàn thành chu kỳ';
        colorStyle = 'color:#c084fc; font-weight:700;';
        detail = `Đã tiêu diệt <b>${e.totalBossKilled || 0} Boss</b> (⏱️ ${fmtMs(e.totalTimeMs)}) → Về Map ${e.returnMap}`;
      } else if (e.event === 'map_skip_level') {
        icon = '⚠️';
        title = 'Bỏ qua Map (Lv)';
        colorStyle = 'color:#fb923c; font-weight:600;';
        detail = `Bỏ qua <b>Map ${e.mapId}</b> — Yêu cầu Lv.${e.reqLv} (Lv hiện tại: Lv.${e.playerLv})`;
      } else if (e.event === 'map_skip_warp_failed') {
        icon = '⚠️';
        title = 'Bỏ qua Map (Lỗi)';
        colorStyle = 'color:#ef4444; font-weight:600;';
        detail = `Không thể di chuyển đến <b>Map ${e.mapId}</b> sau 16s`;
      }

      return `
        <div class="log-line boss-log-item" style="padding: 4px 6px; border-bottom: 1px dashed rgba(255,255,255,0.06); font-size: 0.72rem; display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.15);">
          <span style="color:var(--text-muted); font-size:0.62rem; min-width: 58px;">${e.time}</span>
          <span style="font-size:0.8rem;">${icon}</span>
          <span style="${colorStyle}; min-width: 120px;">${title}</span>
          <span style="color:var(--text-secondary); flex: 1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${detail}</span>
        </div>
      `;
    }).join('');
  }

  // Fetch boss log on-demand from server
  window.fetchBossLog = async function(uid) {
    const bossTerm = document.getElementById(`boss-terminal-${uid}`);
    if (bossTerm) {
      bossTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#c084fc; font-size:0.65rem;">⏳ Đang tải nhật ký săn Boss...</span></div>`;
    }
    try {
      const response = await fetch(`/api/accounts/${uid}/logs`);
      const data = await response.json();
      renderBossLog(uid, data.mvpHuntLog || []);
    } catch (err) {
      console.error('Error fetching boss logs:', err);
      if (bossTerm) {
        bossTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#ef4444; font-size:0.65rem;">❌ Lỗi tải nhật ký: ${err.message}</span></div>`;
      }
    }
  };

  // Open Client game window
  window.openGameLink = function(uid, token) {
    const safeUid = encodeURIComponent(uid || '');
    const safeToken = encodeURIComponent(token || '');
    const url = `/play?line_uid=${safeUid}&session_token=${safeToken}`;
    window.open(url, '_blank');
  };

  // Open Battle Radar window
  window.openBattleLink = function(uid, token) {
    const safeUid = encodeURIComponent(uid || '');
    const safeToken = encodeURIComponent(token || '');
    const url = `/battle?line_uid=${safeUid}&session_token=${safeToken}`;
    window.open(url, '_blank');
  };

  // Open Edit Account modal
  window.openEditTokenModal = function(uid) {
    const nameEl = document.getElementById(`name-${uid}`);
    const currentName = nameEl ? nameEl.textContent : '';
    const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
    document.getElementById('edit-acc-uid').value = uid;
    document.getElementById('edit-acc-name').value = currentName;
    document.getElementById('edit-acc-token').value = '';
    const phpInput = document.getElementById('edit-acc-phpsessid');
    if (phpInput) phpInput.value = (acc && acc.phpsessid) || '';
    editAccountModal.classList.add('open');
    editModalError.textContent = '';
  };

  // Delete account from system
  window.deleteAccount = async function(uid) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi trình quản lý?')) return;
    
    try {
      const response = await fetch(`/api/accounts/${uid}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  // Update Settings (Toggles)
  window.toggleSetting = async function(uid, settingKey) {
    let idKey = settingKey.toLowerCase();
    if (settingKey === 'activeHealEnabled') {
      idKey = 'active-heal-enabled';
    } else if (settingKey === 'eventTargetMinDef') {
      idKey = 'event-target-mindef';
    } else if (settingKey === 'autoHomeUpgrade') {
      idKey = 'autohomeup';
    } else if (settingKey === 'autoEventJoinInv') {
      idKey = 'auto-event-join-inv';
    } else if (settingKey === 'autoEventJoinGw') {
      idKey = 'auto-event-join-gw';
    } else if (settingKey === 'autoEventJoinCw') {
      idKey = 'auto-event-join-cw';
    }
    
    let chk = document.getElementById(`chk-${idKey}-${uid}`);
    if (!chk) {
      chk = document.getElementById(`chk-${settingKey.toLowerCase()}-${uid}`);
    }
    if (!chk) return;
    
    const val = chk.checked;
    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [settingKey]: val })
      });
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  };

  // Update Numeric Settings
  window.updateNumericSetting = async function(uid, settingKey) {
    const hyphenated = settingKey.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
    let input = document.getElementById(`num-${hyphenated}-${uid}`);
    if (!input) {
      input = document.getElementById(`sel-${hyphenated}-${uid}`);
    }
    if (!input) return;

    let cleanVal = input.value;
    if (typeof cleanVal === 'string') {
      cleanVal = cleanVal.replace(/[^\d]/g, '');
    }
    const val = isNaN(parseInt(cleanVal)) ? 0 : parseInt(cleanVal);
    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [settingKey]: val })
      });
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  };

  // Update Market Category Max Qty
  window.updateMarketCategoryMaxQty = async function(uid, category) {
    const input = document.getElementById(`num-market-max-qty-${category}-${uid}`);
    if (!input) return;
    const val = isNaN(parseInt(input.value)) ? 1 : Math.max(1, parseInt(input.value));

    const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
    if (acc) {
      if (!acc.settings.marketCategoryMaxQtys) {
        acc.settings.marketCategoryMaxQtys = {};
      }
      acc.settings.marketCategoryMaxQtys[category] = val;

      try {
        await fetch(`/api/accounts/${uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketCategoryMaxQtys: acc.settings.marketCategoryMaxQtys })
        });
      } catch (err) {
        console.error('Error updating market max qty:', err);
      }
    }
  };

  // Adjust Market Category Qty +/- buttons
  window.adjustMarketQty = function(uid, category, amount) {
    const input = document.getElementById(`num-market-max-qty-${category}-${uid}`);
    if (!input) return;
    let val = parseInt(input.value) || 1;
    val = Math.max(1, val + amount);
    input.value = val;
    window.updateMarketCategoryMaxQty(uid, category);
  };

  // Update String Settings
  window.updateStringSetting = async function(uid, settingKey) {
    const hyphenated = settingKey.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
    let input = document.getElementById(`txt-${hyphenated}-${uid}`);
    if (!input) {
      input = document.getElementById(`sel-${hyphenated}-${uid}`);
    }
    if (!input) return;

    let val = input.value;

    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [settingKey]: val })
      });
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  };

  // Helper functions for Boss Hunt Maps v2
  window.toggleAddMapDropdown = function(uid) {
    const dropdown = document.getElementById(`dropdown-add-map-${uid}`);
    if (!dropdown) return;
    
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
      return;
    }
    
    // Close other dropdowns first
    document.querySelectorAll('[id^="dropdown-add-map-"]').forEach(d => {
      d.style.display = 'none';
    });

    const maps = window.cachedMapsList || [];
    if (maps.length === 0) {
      dropdown.innerHTML = `<div style="padding: 6px 10px; font-size: 0.75rem; color: #94a3b8; font-style: italic;">Chờ tải danh sách map...</div>`;
    } else {
      dropdown.innerHTML = maps.map(m => {
        return `<div onclick="addBossHuntMap('${uid}', ${m.id})" style="padding: 6px 10px; font-size: 0.78rem; color: #f1f5f9; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,0.2)'" onmouseout="this.style.background='none'">${m.emoji || '🗺️'} ${m.name} <span style="font-size: 0.65rem; color: #94a3b8;">(Lv.${m.req}+)</span></div>`;
      }).join('');
    }
    
    dropdown.style.display = 'block';

    const outsideClick = function(e) {
      const btn = document.getElementById(`btn-add-map-menu-${uid}`);
      if (!dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', outsideClick);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', outsideClick);
    }, 10);
  };

  window.addBossHuntMap = async function(uid, mapId) {
    const dropdown = document.getElementById(`dropdown-add-map-${uid}`);
    if (dropdown) dropdown.style.display = 'none';

    const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
    if (!acc) return;
    
    const currentMaps = acc.settings.bossHuntMaps || [];
    if (currentMaps.includes(mapId)) {
      alert('⚠️ Bản đồ này đã được thêm vào danh sách.');
      return;
    }
    
    const newMaps = [...currentMaps, mapId];
    acc.settings.bossHuntMaps = newMaps;
    
    // Refresh card representation immediately
    const mapsContainer = document.getElementById(`boss-hunt-maps-container-${uid}`);
    if (mapsContainer) {
      if (typeof updateCard === 'function') updateCard(acc);
    }

    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bossHuntMaps: newMaps })
      });
      if (typeof fetchAccounts === 'function') fetchAccounts();
    } catch (e) {
      console.error('Error adding boss hunt map:', e);
    }
  };

  window.removeBossHuntMap = async function(uid, index) {
    const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
    if (!acc) return;
    
    const currentMaps = acc.settings.bossHuntMaps || [];
    const newMaps = currentMaps.filter((_, idx) => idx !== index);
    acc.settings.bossHuntMaps = newMaps;

    if (typeof updateCard === 'function') updateCard(acc);

    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bossHuntMaps: newMaps })
      });
      if (typeof fetchAccounts === 'function') fetchAccounts();
    } catch (e) {
      console.error('Error removing boss hunt map:', e);
    }
  };

  window.moveBossHuntMap = async function(uid, index, direction) {
    const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
    if (!acc) return;
    
    const currentMaps = [...(acc.settings.bossHuntMaps || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= currentMaps.length) return;
    
    const temp = currentMaps[index];
    currentMaps[index] = currentMaps[targetIdx];
    currentMaps[targetIdx] = temp;
    acc.settings.bossHuntMaps = currentMaps;

    if (typeof updateCard === 'function') updateCard(acc);

    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bossHuntMaps: currentMaps })
      });
      if (typeof fetchAccounts === 'function') fetchAccounts();
    } catch (e) {
      console.error('Error moving boss hunt map:', e);
    }
  };

  // Save map and warp immediately
  window.changeTargetMap = async function(uid, mapId) {
    const val = parseInt(mapId) || 1;

    // Check level requirement client-side using dynamic maps cache
    const maps = window.cachedMapsList || [];
    const mapDef = maps.find(m => m.id === val);
    const reqLv = mapDef ? (mapDef.req || 1) : 1;
    const mapName = mapDef ? `${mapDef.emoji || '🗺️'} ${mapDef.name}` : `Bản đồ #${val}`;

    const lvEl = document.getElementById(`lv-txt-${uid}`);
    if (lvEl) {
      const match = lvEl.textContent.match(/Lv\.\s*(\d+)/i);
      if (match) {
        const currentLv = parseInt(match[1]) || 1;
        if (currentLv < reqLv) {
          alert(`Cấp độ không đủ! ${mapName} yêu cầu Lv.${reqLv}+. Nhân vật của bạn hiện tại là Lv.${currentLv}.`);
          fetchAccounts(); // Restore select box selection
          return;
        }
      }
    }

    try {
      const res = await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMap: val, autoMap: true })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Lỗi thay đổi bản đồ');
        fetchAccounts();
        return;
      }
      await triggerAction(uid, 'warp', val);
      fetchAccounts();
    } catch (err) {
      console.error('Error changing target map:', err);
    }
  };

  // Toggle skill auto utilization status
  window.toggleSkillAuto = async function(uid, skillId, btn) {
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skill_toggle', extra: { skill_id: skillId } })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi bật tắt kỹ năng');
      }
      fetchAccounts();
    } catch (err) {
      console.error('Error toggling skill auto:', err);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  // Save zone and enable autoZone immediately
  window.changeTargetZone = async function(uid, zoneIdx) {
    if (zoneIdx === "") return;
    const val = parseInt(zoneIdx);
    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetZone: val, autoZone: true })
      });
      fetchAccounts();
    } catch (err) {
      console.error('Error changing target zone:', err);
    }
  };

  // Change bot proxy assignment (Admin only)
  window.changeBotProxy = async function(uid, value) {
    try {
      const res = await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId: value })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`🔴 Lỗi: ${errData.error || 'Không thể cập nhật Proxy'}`);
        return;
      }
      fetchAccounts();
    } catch (e) {
      console.error('Error changing bot proxy:', e);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  // Verify outbound public IP for a specific bot instance
  window.verifyBotProxyIp = async function(uid) {
    try {
      const res = await fetch(`/api/accounts/${uid}/proxy-check`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(`🔴 KIỂM TRA PROXY THẤT BẠI!\n\nLỗi: ${data.error || 'Không thể kết nối qua Proxy'}`);
        return;
      }
      const p = data.proxyInfo || {};
      alert(
        `🟢 XÁC MINH KẾT NỐI PROXY THÀNH CÔNG!\n\n` +
        `・ Bot Target: ${data.accountName} (${data.line_uid})\n` +
        `・ Cấu hình Proxy: ${p.label || 'Direct'}\n` +
        `・ Public IP thực tế đi ra: ${data.outboundIp}\n` +
        `・ Độ trễ (Latency): ${data.latencyMs}ms\n\n` +
        `✅ Gói tin của bot ĐÃ ĐƯỢC ĐỊNH TUYẾN CHUẨN XÁC qua Proxy!`
      );
    } catch (e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    }
  };

  // Trigger manual force MVP Boss Hunt Cycle
  window.forceMvpHunt = async function(uid) {
    try {
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_mvp_hunt' })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        alert('🟢 ' + data.msg);
        fetchAccounts();
      } else {
        alert('🔴 Lỗi: ' + (data.error || 'Không thể kích hoạt săn Boss'));
      }
    } catch (e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    }
  };

  window.joinEventDirectly = async function(uid, action) {
    try {
      let bodyData = { action: action };
      if (action === 'inv_join') {
        bodyData = { action: 'warp', param: 2 };
      }
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (res.ok && (data.ok || data.success)) {
        alert('🟢 Tham gia sự kiện thành công! Bot đang di chuyển...');
        fetchAccounts();
      } else {
        alert('🔴 Lỗi: ' + (data.error || 'Không thể tham gia sự kiện'));
      }
    } catch (e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    }
  };

  window.selectBossTarget = async function(uid, bossId) {
    try {
      const res = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_boss_target', extra: { bossId } })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        fetchAccounts();
      } else {
        alert('🔴 Lỗi: ' + (data.error || 'Không thể chọn Boss'));
      }
    } catch (e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    }
  };

  // Verify outbound public IPs for all proxy streams (Admin only)
  window.verifyAllProxiesIp = async function() {
    try {
      const res = await fetch('/api/admin/proxies/verify-all');
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(`🔴 Lỗi: ${data.error || 'Không thể kiểm tra'}`);
        return;
      }
      let msg = `🔍 KẾT QUẢ KIỂM TRA KẾT NỐI OUTBOUND IP CÁC LUỒNG PROXY (${data.results.length} luồng):\n\n`;
      data.results.forEach((r, idx) => {
        if (r.ok) {
          msg += `${idx + 1}. ${r.label} [${r.botCount}/${r.maxBots} Bot]\n   👉 Outbound IP thực tế: ${r.outboundIp} (${r.latencyMs}ms) ✅\n\n`;
        } else {
          msg += `${idx + 1}. ${r.label} [Off/Lỗi]\n   ❌ Lỗi: ${r.error}\n\n`;
        }
      });
      alert(msg);
    } catch (e) {
      alert(`❌ Lỗi kết nối: ${e.message}`);
    }
  };

  // Start or Stop bot loop
  window.toggleBotLoop = async function(uid) {
    const chk = document.getElementById(`chk-bot-loop-${uid}`);
    if (!chk) return;
    
    const action = chk.checked ? 'start' : 'stop';
    
    try {
      const response = await fetch(`/api/accounts/${uid}/${action}`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error('Error toggling bot status:', err);
    }
  };

  // Trigger manual API actions from frontend buttons
  window.triggerAction = async function(uid, actionName, paramVal = null, extraData = null) {
    const payload = {
      action: actionName
    };
    if (paramVal) payload.param = paramVal;
    if (extraData) payload.extra = extraData;

    try {
      const response = await fetch(`/api/accounts/${uid}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.error || data.ok === false) {
        if (typeof showToast === 'function') {
          showToast(`❌ Thao tác thất bại: ${data.error || data.msg || 'Lỗi không xác định'}`, 'error');
        } else {
          alert(`Thao tác thất bại: ${data.error || data.msg || 'Lỗi không xác định'}`);
        }
      } else {
        if (typeof showToast === 'function') {
          showToast(`✅ ${data.msg || 'Thao tác thành công!'}`, 'success');
        }
        await fetchAccounts();
      }
    } catch (err) {
      console.error('Error triggering action:', err);
      if (typeof showToast === 'function') {
        showToast(`❌ Lỗi kết nối: ${err.message}`, 'error');
      } else {
        alert(`Lỗi kết nối: ${err.message}`);
      }
    }
  };

  window.copyAutoTokenCode = function() {
    const origin = window.location.origin;
    const code = `javascript:(function(){fetch('/human/xhrpg_google_auth.php').then(r=>r.json()).then(d=>{if(d&&d.ok&&d.player&&d.session_token){const u='${origin}/api/auto-add-account?line_uid='+encodeURIComponent(d.player.line_uid)+'&session_token='+encodeURIComponent(d.session_token)+'&name='+encodeURIComponent(d.player.name||'');location.href=u;}else{alert('⚠️ Chưa đăng nhập game! Vui lòng Đăng nhập Google trên game trước.');}}).catch(()=>alert('⚠️ Vui lòng mở game (ragnalok.online) trước khi bấm Bookmark này!'));})();`;
    
    const showNotice = () => {
      alert('📋 ĐÃ COPY MÃ DẤU TRANG (BOOKMARKLET)!\n\nHướng dẫn cài trên Điện thoại (Chỉ cài 1 lần):\n1. Bấm Bookmark (Lưu dấu trang) trang web bất kỳ.\n2. Sửa tên dấu trang thành: ⚡ Lấy Token Bot\n3. Xóa URL cũ và DÁN đoạn mã vừa copy vào phần URL.\n4. Mở game (ragnalok.online), đăng nhập Google xong thì bấm Dấu trang này để tự động thêm Bot!');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      prompt('Copy đoạn mã dưới đây và dán vào thanh địa chỉ trang game:', code);
    }
  };

  // ==================== PROXY POOL MANAGEMENT ====================

  async function fetchAdminProxies() {
    try {
      const res = await fetch('/api/admin/proxies');
      if (!res.ok) return;
      const data = await res.json();
      adminProxiesList = data.list || [];
      renderProxySettings(data.settings);
      renderProxyTable(data.list);
      renderBackupSettings(data.settings);
      // Fix #3: Sau khi có danh sách proxy, rebuild tất cả batch-proxy dropdowns
      // trong accordion cards (tránh dropdown trống khi proxy chưa load kịp)
      refreshAllBatchProxySelects();
    } catch (e) {
      console.error('Error fetching proxies:', e);
    }
  }

  // Fix #3: Rebuild tất cả dropdown "Đổi Proxy Hàng Loạt" trên accordion cards
  function refreshAllBatchProxySelects() {
    const selects = document.querySelectorAll('[id^="user-batch-proxy-"]');
    if (!selects.length) return;
    const optionsHtml = `
      <option value="direct">🌐 Direct Connection</option>
      <option value="auto">🔄 Auto Rotation Pool</option>
      ${adminProxiesList.map(p => `<option value="${p.id}">${p.label}${!p.active ? ' (Off)' : ''}</option>`).join('')}
    `;
    selects.forEach(sel => {
      const prev = sel.value; // giữ lại lựa chọn cũ
      sel.innerHTML = optionsHtml;
      if (prev) sel.value = prev; // khôi phục lựa chọn cũ nếu còn trong list
    });
  }

  window.testAdminProxy = async function(id, btn) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳';
      btn.style.opacity = '0.7';
    }
    try {
      const res = await fetch(`/api/admin/proxies/${id}/test`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert(`🟢 Kết nối thành công!\nĐộ trễ (Latency): ${data.latency}ms`);
      } else {
        alert(`🔴 Kết nối thất bại!\nLỗi: ${data.error || 'Timeout hoặc không khả dụng'}`);
      }
    } catch (e) {
      console.error('Error testing proxy:', e);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Test';
        btn.style.opacity = '1';
      }
    }
  };

  function renderProxySettings(settings) {
    const chkDirect = document.getElementById('proxy-use-direct');
    const inpMax    = document.getElementById('proxy-max-bots');
    if (chkDirect && document.activeElement !== chkDirect) chkDirect.checked = settings.useDirectConnection === true;
    if (inpMax    && document.activeElement !== inpMax)    inpMax.value = settings.maxBotsPerProxy || 10;
  }

  function renderBackupSettings(settings) {
    const txtToken = document.getElementById('backup-tele-token');
    const txtChatId = document.getElementById('backup-tele-chatid');
    const numInterval = document.getElementById('backup-interval');
    const chkAuto = document.getElementById('backup-auto-enabled');
    const statusText = document.getElementById('backup-status-text');

    if (txtToken && document.activeElement !== txtToken) txtToken.value = settings.telegramBotToken || '';
    if (txtChatId && document.activeElement !== txtChatId) txtChatId.value = settings.telegramChatId || '';
    if (numInterval && document.activeElement !== numInterval) numInterval.value = settings.backupIntervalHours || 12;
    if (chkAuto && document.activeElement !== chkAuto) chkAuto.checked = settings.autoBackupEnabled === true;

    if (statusText) {
      if (settings.telegramBotToken && settings.telegramChatId) {
        if (settings.autoBackupEnabled) {
          const lastStr = settings.lastBackupTime ? new Date(settings.lastBackupTime).toLocaleString('vi-VN') : 'Chưa sao lưu';
          statusText.textContent = `Auto ON (Lần cuối: ${lastStr})`;
          statusText.style.color = '#34d399';
        } else {
          statusText.textContent = 'Auto OFF (Đã cấu hình)';
          statusText.style.color = '#fbbf24';
        }
      } else {
        statusText.textContent = 'Chưa cấu hình';
        statusText.style.color = '#ef4444';
      }
    }
  }

  window.saveBackupSettings = async function(e) {
    if (e) e.preventDefault();
    const token = document.getElementById('backup-tele-token').value.trim();
    const chatId = document.getElementById('backup-tele-chatid').value.trim();
    const interval = parseInt(document.getElementById('backup-interval').value) || 12;
    const enabled = document.getElementById('backup-auto-enabled').checked;

    if (token && chatId) {
      const botId = token.split(':')[0];
      if (chatId === botId) {
        alert('🔴 Lỗi: Chat ID không được trùng với ID của Bot (phần số trước dấu hai chấm ở Token). Vui lòng điền Chat ID cá nhân của bạn!');
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/proxies/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramBotToken: token,
          telegramChatId: chatId,
          backupIntervalHours: interval,
          autoBackupEnabled: enabled
        })
      });
      if (res.ok) {
        alert('🟢 Đã lưu cấu hình sao lưu Telegram thành công!');
        fetchAdminProxies();
      } else {
        const err = await res.json();
        alert(`🔴 Lỗi: ${err.error || 'Không thể lưu cấu hình'}`);
      }
    } catch (err) {
      console.error('Error saving backup settings:', err);
      alert('Không thể kết nối đến máy chủ.');
    }
  };

  window.triggerTelegramBackupNow = async function(btn) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang gửi...';
    }
    try {
      const res = await fetch('/api/admin/backup-now', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('🟢 Đã gửi bản sao lưu thành công lên Telegram chat của bạn!');
        fetchAdminProxies();
      } else {
        alert(`🔴 Gửi thất bại: ${data.error || 'Vui lòng kiểm tra lại token/chat ID'}`);
      }
    } catch (err) {
      console.error('Error triggering backup:', err);
      alert('Lỗi kết nối đến máy chủ.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Gửi Backup Lên Telegram';
      }
    }
  };

  window.downloadBackupNow = function() {
    window.open('/api/admin/backup-download', '_blank');
  };

  window.handleRestoreUpload = async function(input) {
    const file = input.files[0];
    const fileNameSpan = document.getElementById('restore-file-name');
    if (!file) {
      if (fileNameSpan) fileNameSpan.textContent = 'Chưa chọn file';
      return;
    }
    
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    
    const confirmRestore = confirm(`⚠️ CẢNH BÁO AN TOÀN QUAN TRỌNG:\n\nHành động này sẽ giải nén ghi đè toàn bộ dữ liệu hiện tại (bao gồm người dùng, proxy, bot) và khởi động lại tất cả bot.\n\nBạn có chắc chắn muốn khôi phục từ tệp "${file.name}" không?`);
    if (!confirmRestore) {
      input.value = '';
      if (fileNameSpan) fileNameSpan.textContent = 'Chưa chọn file';
      return;
    }
    
    const formData = new FormData();
    formData.append('backupFile', file);
    
    try {
      fileNameSpan.textContent = '⏳ Đang khôi phục...';
      const res = await fetch('/api/admin/restore-upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(`🟢 Khôi phục thành công!\n\n${data.message}`);
        location.reload();
      } else {
        alert(`🔴 Lỗi phục hồi: ${data.error || 'File không hợp lệ'}`);
        fileNameSpan.textContent = 'Lỗi phục hồi';
      }
    } catch (err) {
      console.error('Error during restore upload:', err);
      alert('Lỗi kết nối khi gửi file khôi phục.');
      fileNameSpan.textContent = 'Lỗi kết nối';
    } finally {
      input.value = '';
    }
  };

  function renderProxyTable(list) {
    const tbody = document.getElementById('proxy-table-body');
    if (!tbody) return;
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:14px; text-align:center; color:var(--text-secondary);">Chưa có proxy nào. Thêm proxy hoặc bật kết nối trực tiếp.</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(p => {
      const pct = Math.round((p.botCount / p.maxBots) * 100);
      const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#34d399';
      // Mask password in URL
      let displayUrl = p.url;
      try { displayUrl = p.url.replace(/(:)[^@]+(@)/, '$1****$2'); } catch(e) {}
      const isDirect = p.isDirect;
      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); ${!p.active ? 'opacity:0.5;' : ''}">
          <td style="padding:7px; font-weight:600; color:${isDirect ? '#34d399' : '#a5b4fc'}">${p.label}</td>
          <td style="padding:7px; font-family:monospace; font-size:0.78rem; color:var(--text-secondary); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.url}">${displayUrl}</td>
          <td style="padding:7px; text-align:center;">
            <div style="font-size:0.78rem; font-weight:700; color:${barColor}">${p.botCount}/${p.maxBots}</div>
            <div style="height:4px; border-radius:2px; background:#1e293b; margin-top:3px;">
              <div style="height:4px; border-radius:2px; background:${barColor}; width:${Math.min(100,pct)}%;"></div>
            </div>
          </td>
          <td style="padding:7px; text-align:center;">
            ${isDirect
              ? '<span style="color:#34d399; font-size:0.78rem;">🟢 Luôn bật</span>'
              : p.active
                ? '<span style="color:#34d399; font-size:0.78rem;">🟢 Hoạt động</span>'
                : '<span style="color:#ef4444; font-size:0.78rem;">🔴 Tắt</span>'}
          </td>
          <td style="padding:7px; text-align:right;">
            <div style="display:flex; justify-content:flex-end; gap:4px;">
              <button class="btn-mini" style="width:auto; padding:2px 8px; background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.3);" onclick="testAdminProxy('${p.id}', this)">⚡ Test</button>
              ${isDirect ? '' : `
                <button class="btn-mini" style="width:auto; padding:2px 8px; background:${p.active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; color:${p.active ? '#ef4444' : '#34d399'}; border-color:${p.active ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'};" onclick="toggleAdminProxy('${p.id}', ${!p.active})">${p.active ? 'Tắt' : 'Bật'}</button>
                <button class="btn-mini" style="width:auto; padding:2px 8px; background:rgba(239,68,68,0.2); color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="deleteAdminProxy('${p.id}', '${p.label}')">Xóa</button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.updateProxySettings = async function() {
    const chkDirect = document.getElementById('proxy-use-direct');
    const inpMax    = document.getElementById('proxy-max-bots');
    try {
      await fetch('/api/admin/proxies/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useDirectConnection: chkDirect ? chkDirect.checked : true,
          maxBotsPerProxy: inpMax ? parseInt(inpMax.value) || 10 : 10
        })
      });
      fetchAdminProxies();
    } catch(e) { console.error(e); }
  };

  window.toggleAdminProxy = async function(id, active) {
    try {
      await fetch(`/api/admin/proxies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      fetchAdminProxies();
    } catch(e) { console.error(e); }
  };

  window.deleteAdminProxy = async function(id, label) {
    if (!confirm(`Xóa proxy "${label}"? Các bot đang dùng proxy này sẽ tự động được gán lại.`)) return;
    try {
      await fetch(`/api/admin/proxies/${id}`, { method: 'DELETE' });
      fetchAdminProxies();
    } catch(e) { console.error(e); }
  };

  // Add Proxy Form handler
  const addProxyForm = document.getElementById('admin-add-proxy-form');
  if (addProxyForm) {
    addProxyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('proxy-add-error');
      errEl.textContent = '';
      const label = document.getElementById('proxy-new-label').value.trim();
      const url   = document.getElementById('proxy-new-url').value.trim();
      const typeEl = document.getElementById('proxy-new-type');
      const type  = typeEl ? typeEl.value : 'http';
      try {
        const res = await fetch('/api/admin/proxies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, url, type })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          addProxyForm.reset();
          fetchAdminProxies();
        } else {
          errEl.textContent = data.error || 'Lỗi thêm proxy';
        }
      } catch(e) {
        errEl.textContent = 'Không thể kết nối server';
      }
    });
  }

  // ==================== END PROXY MANAGEMENT ====================

  // ==================== ANNOUNCEMENTS LOGIC ====================

  window.dismissAnnouncement = function(id) {
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
      }
      const element = document.getElementById(`ann-banner-${id}`);
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          element.remove();
          if (announcementsContainer.children.length === 0) {
            announcementsContainer.style.display = 'none';
          }
        }, 200);
      }
    } catch (e) {
      console.error('Error dismissing announcement:', e);
    }
  };

  async function fetchAnnouncements() {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.announcements) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
        const active = data.announcements.filter(ann => !dismissed.includes(ann.id));
        
        if (active.length === 0) {
          announcementsContainer.innerHTML = '';
          announcementsContainer.style.display = 'none';
          return;
        }

        announcementsContainer.innerHTML = active.map(ann => {
          let emoji = 'ℹ️';
          let className = 'ann-info';
          if (ann.type === 'success') { emoji = '✅'; className = 'ann-success'; }
          if (ann.type === 'warning') { emoji = '⚠️'; className = 'ann-warning'; }
          if (ann.type === 'critical') { emoji = '🚨'; className = 'ann-critical'; }

          const timeStr = new Date(ann.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          });

          return `
            <div class="announcement-banner ${className}" id="ann-banner-${ann.id}">
              <div class="ann-body">
                <span class="ann-icon">${emoji}</span>
                <div class="ann-content-wrapper">
                  <div class="ann-message">${ann.message}</div>
                  <div class="ann-meta">🕒 ${timeStr} bởi ${ann.createdBy}</div>
                </div>
              </div>
              <button class="ann-close-btn" onclick="dismissAnnouncement('${ann.id}')" title="Đóng thông báo">&times;</button>
            </div>
          `;
        }).join('');
        
        announcementsContainer.style.display = 'flex';
      }
    } catch (e) {
      console.error('Error fetching announcements:', e);
    }
  }

  async function fetchAnnouncementsAdmin() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const res = await fetch('/api/announcements');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.announcements) {
        if (data.announcements.length === 0) {
          adminAnnouncementsTableBody.innerHTML = `
            <tr><td colspan="5" style="padding: 12px; text-align: center; color: var(--text-muted);">Chưa có thông báo nào.</td></tr>
          `;
          return;
        }

        adminAnnouncementsTableBody.innerHTML = data.announcements.map(ann => {
          let typeLabel = 'Thông tin';
          let badgeClass = 'badge-ann-info';
          if (ann.type === 'success') { typeLabel = 'Thành công'; badgeClass = 'badge-ann-success'; }
          if (ann.type === 'warning') { typeLabel = 'Cảnh báo'; badgeClass = 'badge-ann-warning'; }
          if (ann.type === 'critical') { typeLabel = 'Khẩn cấp'; badgeClass = 'badge-ann-critical'; }

          const timeStr = new Date(ann.createdAt).toLocaleString('vi-VN');

          return `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 8px; color: var(--text-muted);">${timeStr}</td>
              <td style="padding: 8px;"><span class="${badgeClass}">${typeLabel}</span></td>
              <td style="padding: 8px; font-weight: 600;">${ann.createdBy}</td>
              <td style="padding: 8px; white-space: pre-wrap; line-height: 1.4;">${ann.message}</td>
              <td style="padding: 8px; text-align: right;">
                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteAnnouncement('${ann.id}')">
                  🗑️ Xóa
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('Error fetching admin announcements:', e);
    }
  }

  window.deleteAnnouncement = async function(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchAnnouncementsAdmin();
        fetchAnnouncements();
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa thông báo');
      }
    } catch (e) {
      alert('Không thể kết nối đến máy chủ');
    }
  };

  window.createAnnouncement = async function(event) {
    if (event) event.preventDefault();
    adminAnnouncementError.textContent = '';
    
    const type = announcementTypeSelect.value;
    const message = announcementContentTextarea.value.trim();
    if (!message) return;

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        announcementContentTextarea.value = '';
        fetchAnnouncementsAdmin();
        fetchAnnouncements();
      } else {
        adminAnnouncementError.textContent = data.error || 'Lỗi khi tạo thông báo';
      }
    } catch (e) {
      adminAnnouncementError.textContent = 'Không thể kết nối đến máy chủ';
    }
  };

  // Initial Startup
  checkAuth().then(authed => {
    if (authed) {
      fetchAccounts();
      fetchAnnouncements();
      if (currentUser && currentUser.role === 'admin') {
        fetchAdminProxies();
      }
    }
  });

  // Periodic account polling & live Admin table tick
  let adminProxyTick = 0;
  let announcementTick = 0;
  setInterval(() => {
    if (currentUser) {
      fetchAccounts();
      
      announcementTick++;
      if (announcementTick >= 20) { // Every 20 seconds
        announcementTick = 0;
        fetchAnnouncements();
      }
      
      // Fetch admin proxies list every 5 seconds for cards selector mapping
      if (currentUser.role === 'admin') {
        adminProxyTick++;
        if (adminProxyTick >= 5) {
          adminProxyTick = 0;
          fetchAdminProxies();
        }
      }
    }
    if (adminUsersModal && adminUsersModal.classList.contains('open')) {
      const proxyTabVisible = document.getElementById('admin-tab-proxies') &&
        document.getElementById('admin-tab-proxies').style.display !== 'none';
      if (proxyTabVisible) {
        fetchAdminProxies();
      } else {
        fetchAdminUsers();
      }
    }
  }, 1000);
});

// ── 🏡 Home Farm (Nông Trại & Trồng Cây) Helpers & Triggers ──
function parseHomeSeeds(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  let cur = raw;
  for (let i = 0; i < 3; i++) {
    if (typeof cur === 'string') {
      try {
        cur = JSON.parse(cur);
      } catch (e) {
        break;
      }
    }
  }
  if (cur && typeof cur === 'object' && !Array.isArray(cur)) return cur;
  return {};
}

function updateHomeTabUI(acc) {
  const p = acc.player || {};
  const line_uid = acc.line_uid;

  // 1. Home Level & Plots
  const HOME_PLOT_LV = [20, 40, 60, 80, 100];
  const lv = Math.max(1, p.home_lv | 0);
  const plots = 1 + HOME_PLOT_LV.filter(q => lv >= q).length;
  const totalHoles = plots * 16;

  const elLv = document.getElementById(`home-lv-${line_uid}`);
  if (elLv) elLv.textContent = lv;

  const elPlots = document.getElementById(`home-plots-${line_uid}`);
  if (elPlots) elPlots.textContent = plots;

  const elTotal = document.getElementById(`home-total-${line_uid}`);
  if (elTotal) elTotal.textContent = totalHoles;

  // 2. Crops Status
  let crops = [];
  try {
    const c = p.home_crops;
    crops = Array.isArray(c) ? c : (typeof c === 'string' ? (JSON.parse(c || '[]') || []) : []);
  } catch (e) {}

  const usedHoles = crops.filter(c => c.p < plots).length;
  const nowS = Date.now() / 1000;
  const SEED_NAMES  = ['Nho dại', 'Đậu leo', 'Ớt đỏ', 'Bắp cải', 'Hoa khoai lang', 'Lá ngọc', 'Lô hội gai', 'Lúa mì', 'Táo', 'Chanh vàng', 'Anh đào', 'Dừa'];
  const SEED_GROW_H = [1, 2, 4, 8, 16, 24];
  const SEED_PRICE  = [80, 160, 400, 800, 1920, 3200];
  const seedTier   = id => (((id - 1) / 4) | 0) + 1;
  const seedGold   = id => ((id - 1) & 1) === 1;
  const seedSprite = id => ((((id - 1) / 4) | 0) * 2) + (((id - 1) >> 1) & 1) + 1;
  const seedPrice  = id => SEED_PRICE[seedTier(id) - 1] * (seedGold(id) ? 3 : 1);
  const seedGrowS  = id => SEED_GROW_H[seedTier(id) - 1] * 3600;
  const seedLabel  = id => (seedGold(id) ? '⭐ ' : '') + (SEED_NAMES[seedSprite(id) - 1] || 'Cây') + (seedGold(id) ? ' (Vàng)' : '');

  let ripeCount = 0, nextS = Infinity;
  crops.forEach(c => {
    const left = seedGrowS(c.s) - (nowS - c.t);
    if (c.r || left <= 0) ripeCount++;
    else nextS = Math.min(nextS, left);
  });

  const elUsed = document.getElementById(`home-used-${line_uid}`);
  if (elUsed) elUsed.textContent = usedHoles;

  const elRipe = document.getElementById(`home-ripe-${line_uid}`);
  if (elRipe) elRipe.textContent = ripeCount;

  const elNext = document.getElementById(`home-next-ripe-${line_uid}`);
  if (elNext) {
    if (nextS !== Infinity && nextS > 0) {
      const minLeft = Math.max(1, Math.ceil(nextS / 60));
      elNext.textContent = `⏳ Cây tiếp theo sẽ chín sau ~${minLeft} phút`;
    } else if (ripeCount > 0) {
      elNext.textContent = `✅ Có ${ripeCount} cây đã sẵn sàng thu hoạch!`;
    } else {
      elNext.textContent = `🌱 Tất cả các ô đất chưa trồng hoặc mới trồng`;
    }
  }

  // 3. Toggles & Settings Sync
  const chkHarvest = document.getElementById(`chk-autohomeharvest-${line_uid}`);
  if (chkHarvest && document.activeElement !== chkHarvest) chkHarvest.checked = acc.settings.autoHomeHarvest !== false;

  const chkPlant = document.getElementById(`chk-autohomeplant-${line_uid}`);
  if (chkPlant && document.activeElement !== chkPlant) chkPlant.checked = acc.settings.autoHomePlant !== false;

  const selPriority = document.getElementById(`sel-home-priority-${line_uid}`);
  if (selPriority && document.activeElement !== selPriority) selPriority.value = acc.settings.homePlantPriority || 'highest_tier';

  const chkUp = document.getElementById(`chk-autohomeup-${line_uid}`);
  if (chkUp && document.activeElement !== chkUp) chkUp.checked = acc.settings.autoHomeUpgrade === true;

  const chkBypassWarp = document.getElementById(`chk-bypasshomewarp-${line_uid}`);
  if (chkBypassWarp && document.activeElement !== chkBypassWarp) chkBypassWarp.checked = acc.settings.bypassHomeWarp === true;

  // 4. Seeds Inventory List
  const seedsListEl = document.getElementById(`home-seeds-list-${line_uid}`);
  if (seedsListEl) {
    const seedsObj = parseHomeSeeds(p.home_seeds);
    const seedIds = Object.keys(seedsObj).map(Number).filter(id => id >= 1 && id <= 24 && (parseInt(seedsObj[id]) || 0) > 0).sort((a, b) => b - a);

    if (seedIds.length === 0) {
      seedsListEl.innerHTML = `<div style="font-size: 0.78rem; color: #9ca3af; text-align: center; padding: 10px 0;">Chưa có hạt giống nào trong kho (Hạt giống tự động rớt khi săn quái trên bản đồ)</div>`;
    } else {
      seedsListEl.innerHTML = seedIds.map(id => {
        const qty = parseInt(seedsObj[id]) || 0;
        const isGold = seedGold(id);
        const tier = seedTier(id);
        const name = seedLabel(id);
        const price = seedPrice(id);
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.06);">
            <span style="font-size: 0.7rem; font-weight: 800; color: #fff; background: ${isGold ? '#b45309' : '#16a34a'}; border-radius: 4px; padding: 1px 5px; flex: none;">T${tier}</span>
            <span style="font-size: 0.8rem; color: #f3f4f6; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${name}">${name}</span>
            <b style="font-size: 0.8rem; color: #fbbf24; flex: none;">×${qty}</b>
            <span style="font-size: 0.72rem; color: #94a3b8; flex: none;">(${price.toLocaleString()}G)</span>
            <button onclick="triggerHomePlant('${line_uid}', ${id}, 0)" style="font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; background: #16a34a; color: #fff; padding: 2px 6px; cursor: pointer; flex: none;">×1</button>
            <button onclick="triggerHomePlant('${line_uid}', ${id}, 1)" style="font-size: 0.72rem; font-weight: 700; border: none; border-radius: 4px; background: #0891b2; color: #fff; padding: 2px 6px; cursor: pointer; flex: none;">Hết</button>
          </div>
        `;
      }).join('');
    }
  }

  // 5. Planted Crops Grid & Countdown List
  const cropsListEl = document.getElementById(`home-crops-list-${line_uid}`);
  if (cropsListEl) {
    if (crops.length === 0) {
      cropsListEl.innerHTML = `<div style="font-size: 0.78rem; color: #9ca3af; text-align: center; padding: 10px 0;">Tất cả luống đất đang trống</div>`;
    } else {
      cropsListEl.innerHTML = crops.map(c => {
        const seedId = c.s || 1;
        const holeIdx = (c.i != null) ? c.i : 0;
        const plotIdx = (c.p != null) ? c.p : 0;
        const globalHoleIdx = plotIdx * 16 + holeIdx;
        const left = seedGrowS(seedId) - (nowS - c.t);
        const isRipe = c.r || left <= 0;
        const name = seedLabel(seedId);
        const isGold = seedGold(seedId);
        const tier = seedTier(seedId);

        let statusText = '';
        if (isRipe) {
          statusText = `<span style="color: #4ade80; font-weight: 700;">✅ Đã chín</span>`;
        } else {
          const minLeft = Math.max(1, Math.ceil(left / 60));
          statusText = `<span style="color: #fbbf24;">⏳ ~${minLeft} phút nữa chín</span>`;
        }

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.06); font-size: 0.76rem;">
            <span style="font-weight: 700; color: #94a3b8; flex: none;">Luống #${globalHoleIdx + 1}</span>
            <span style="font-weight: 800; color: #fff; background: ${isGold ? '#b45309' : '#16a34a'}; border-radius: 4px; padding: 1px 5px; font-size: 0.68rem; flex: none;">T${tier}</span>
            <span style="color: #f3f4f6; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${name}">${name}</span>
            <span style="flex: none;">${statusText}</span>
          </div>
        `;
      }).join('');
    }
  }
}

window.triggerHomeHarvest = async function(line_uid) {
  try {
    const res = await fetch(`/api/accounts/${line_uid}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'home_harvest' })
    });
    const data = await res.json();
    if (data.ok) {
      const hv = data.hv || {};
      showToast(`🌾 Thu hoạch ${hv.n || 0} luống (+${(hv.g || 0).toLocaleString()} Gold)`);
    } else {
      showToast(`❌ Thu hoạch thất bại: ${data.error || 'Lỗi không xác định'}`, true);
    }
  } catch (e) {
    showToast(`❌ Lỗi kết nối: ${e.message}`, true);
  }
};

window.triggerHomePlant = async function(line_uid, seedId, all = 1) {
  try {
    const res = await fetch(`/api/accounts/${line_uid}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'home_plant', extra: { seed: seedId, all: all ? 1 : 0 } })
    });
    const data = await res.json();
    if (data.ok) {
      showToast(`🌱 Trồng hạt #${seedId} thành công`);
    } else {
      showToast(`❌ Trồng cây thất bại: ${data.error || 'Lỗi không xác định'}`, true);
    }
  } catch (e) {
    showToast(`❌ Lỗi kết nối: ${e.message}`, true);
  }
};

window.triggerHomeUpgrade = async function(line_uid) {
  try {
    const res = await fetch(`/api/accounts/${line_uid}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'home_up' })
    });
    const data = await res.json();
    if (data.ok) {
      showToast(`⬆️ Nâng cấp nhà thành công!`);
    } else {
      showToast(`❌ Nâng cấp nhà thất bại: ${data.error || 'Tài nguyên chưa đủ'}`, true);
    }
  } catch (e) {
    showToast(`❌ Lỗi kết nối: ${e.message}`, true);
  }
};

window.sendAccountAction = async function(line_uid, action, extra = null) {
  try {
    const payload = { action };
    if (extra && typeof extra === 'object') {
      Object.assign(payload, extra);
    }
    const res = await fetch(`/api/accounts/${line_uid}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      if (typeof window.showToast === 'function') {
        window.showToast('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', true);
      }
      setTimeout(() => location.reload(), 1500);
      return;
    }

    const data = await res.json();
    if (data.ok) {
      if (typeof window.showToast === 'function') {
        window.showToast(`✅ ${data.msg || 'Thao tác thành công'}`);
      }
      if (typeof fetchAccounts === 'function') fetchAccounts();
    } else {
      if (typeof window.showToast === 'function') {
        window.showToast(`❌ Thao tác thất bại: ${data.error || data.msg || 'Lỗi không xác định'}`, true);
      }
    }
  } catch (e) {
    if (typeof window.showToast === 'function') {
      window.showToast(`❌ Lỗi kết nối: ${e.message}`, true);
    }
  }
};

// 🐾 Pet Stats & Upgrade Helper
function expNextPet(lv) {
  if (lv >= 41) return 100000000 + (lv - 41) * 15000000;
  let e = 100;
  for (let k = 2; k <= lv; k++) {
    const b = k <= 10 ? 1.50 : k <= 20 ? 1.45 : k <= 30 ? 1.40 : 1.35;
    e = Math.round(e * b);
  }
  return e;
}

function _petLvInfoCalc(exp) {
  let lv = 1, e = Math.max(0, Math.floor(Number(exp) || 0));
  while (lv < 99) {
    const need = expNextPet(lv);
    if (e < need) break;
    e -= need;
    lv++;
  }
  return { lv, cur: e, need: expNextPet(lv) };
}

function renderPetSection(acc) {
  const p = acc.player || {};
  const line_uid = acc.line_uid;
  const mid = (p.pet_mid | 0);

  const elPts = document.getElementById(`pet-pts-${line_uid}`);
  const elAtk = document.getElementById(`pet-atk-val-${line_uid}`);
  const elDef = document.getElementById(`pet-def-val-${line_uid}`);
  const elHp = document.getElementById(`pet-hp-val-${line_uid}`);
  const elRegen = document.getElementById(`pet-regen-val-${line_uid}`);

  const elUpAtkLv = document.getElementById(`pet-up-atk-lv-${line_uid}`);
  const elUpHpLv = document.getElementById(`pet-up-hp-lv-${line_uid}`);
  const elUpRecoLv = document.getElementById(`pet-up-reco-lv-${line_uid}`);

  if (mid <= 0) {
    if (elPts) elPts.textContent = 0;
    if (elAtk) elAtk.textContent = '--';
    if (elDef) elDef.textContent = '--';
    if (elHp) elHp.textContent = '--';
    if (elRegen) elRegen.textContent = '--';
    if (elUpAtkLv) elUpAtkLv.textContent = 0;
    if (elUpHpLv) elUpHpLv.textContent = 0;
    if (elUpRecoLv) elUpRecoLv.textContent = 0;

    ['atk', 'hp', 'reco'].forEach(st => {
      const btn = document.getElementById(`btn-petup-${st}-${line_uid}`);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });
    return;
  }

  // Lookup Pet Monster master info
  const mm = (acc.mon_masters && acc.mon_masters[mid]) || (window.cachedMonMasters && window.cachedMonMasters[mid]) || {};

  const monLv = mm.lv || (p.pet_olv | 0) || 1;
  const batk = (p.pet_batk | 0) || (mm.batk | 0) || (monLv * 10) || 50;
  const bhp = (p.pet_bhp | 0) || (mm.bhp | 0) || (monLv * 100) || 500;

  // Calculate Pet level & EXP info from pet_exp
  const petExp = parseInt(p.pet_exp) || 0;
  const expNext = (lv) => {
    if (lv >= 41) return 100000000 + (lv - 41) * 15000000;
    let e = 100;
    for (let k = 2; k <= lv; k++) {
      const b = k <= 10 ? 1.50 : k <= 20 ? 1.45 : k <= 30 ? 1.40 : 1.35;
      e = Math.round(e * b);
    }
    return e;
  };

  const getPetLvInfo = (exp) => {
    let lv = 1, e = Math.max(0, Math.floor(Number(exp) || 0));
    while (lv < 99) {
      const need = expNext(lv);
      if (e < need) break;
      e -= need;
      lv++;
    }
    return { lv, cur: e, need: expNext(lv) };
  };

  const info = getPetLvInfo(petExp);
  const petLv = info.lv;
  const mvp = (+p.pet_mvp || 0) ? 2 : 1;

  const upAtk = p.pet_up_atk | 0;
  const upHp = p.pet_up_hp | 0;
  const upReco = p.pet_up_reco | 0;

  const atk = Math.max(1, Math.round(batk * (2 + 0.20 * petLv + 0.30 * upAtk) * mvp));
  const hpMax = Math.max(1, Math.round(0.5 * bhp * (1 + 0.25 * petLv) * mvp));
  const def = Math.max(0, Math.round(((p.pet_olv | 0) + petLv + 2 * upHp) * mvp));
  const regen = 1.0 + 0.20 * upReco;
  const pts = Math.max(0, (petLv - 1) - upAtk - upHp - upReco);

  // Update DOM
  if (elPts) elPts.textContent = pts;
  if (elAtk) elAtk.textContent = atk.toLocaleString();
  if (elDef) elDef.textContent = def.toLocaleString();
  if (elHp) elHp.textContent = hpMax.toLocaleString();
  if (elRegen) elRegen.textContent = `${regen.toFixed(2)}%/s`;

  if (elUpAtkLv) elUpAtkLv.textContent = upAtk;
  if (elUpHpLv) elUpHpLv.textContent = upHp;
  if (elUpRecoLv) elUpRecoLv.textContent = upReco;

  // Enable/Disable buttons based on unallocated points
  ['atk', 'hp', 'reco'].forEach(st => {
    const btn = document.getElementById(`btn-petup-${st}-${line_uid}`);
    if (btn) {
      btn.disabled = pts <= 0;
      btn.style.opacity = pts > 0 ? '1' : '0.5';
      btn.style.cursor = pts > 0 ? 'pointer' : 'not-allowed';
    }
  });
}

window.upgradePetStat = async function(line_uid, stat) {
  try {
    const res = await fetch(`/api/accounts/${line_uid}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pet_up', extra: { stat: stat } })
    });
    const data = await res.json();
    if (data.ok) {
      showToast(`✨ Cộng điểm Pet (${stat.toUpperCase()}) thành công!`);
      if (window.fetchAccounts) window.fetchAccounts();
    } else {
      showToast(`❌ Cộng điểm Pet thất bại: ${data.error || 'Điểm không đủ'}`, true);
    }
  } catch (e) {
    showToast(`❌ Lỗi kết nối: ${e.message}`, true);
  }
};

let draggedCard = null;

// Initialize drag and drop event listeners
function initDragAndDrop(container) {
  container.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.account-card');
    if (!card) return;
    draggedCard = card;
    isDraggingCard = true;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
  });

  container.addEventListener('dragend', async (e) => {
    if (!draggedCard) return;
    draggedCard.classList.remove('dragging');
    draggedCard.draggable = false; // Reset to false after drag
    draggedCard = null;
    isDraggingCard = false;
    
    await saveNewAccountOrder(container);
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedCard) return;
    const card = e.target.closest('.account-card');
    if (!card || card === draggedCard) return;

    // Must be dragging within the same container
    if (card.parentElement !== container) return;

    const rect = card.getBoundingClientRect();
    const next = (e.clientY - rect.top) > (rect.height / 2);
    container.insertBefore(draggedCard, next ? card.nextSibling : card);
  });
}

// Send reordered line_uids to server
async function saveNewAccountOrder(container) {
  const cardEls = container.querySelectorAll('.account-card');
  const line_uids = Array.from(cardEls).map(el => el.id.replace('card-', ''));
  if (line_uids.length === 0) return;
  
  try {
    const res = await fetch('/api/accounts/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line_uids })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Lỗi lưu thứ tự:', data.error);
    } else {
      // Reload silently to sync settings
      const response = await fetch('/api/accounts');
      if (response.ok) {
        window.lastFetchedAccounts = await response.json();
      }
    }
  } catch (err) {
    console.error('Không thể kết nối đến server để lưu thứ tự:', err);
  }
}

// Sync Leader settings to all Members
window.syncTeamSetup = async function(uid) {
  if (!confirm('Bạn có chắc chắn muốn đồng bộ thiết lập của Leader này cho tất cả thành viên trong Team không?')) return;
  
  try {
    const res = await fetch('/api/team/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leader_uid: uid })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      alert('🟢 ' + data.msg);
      if (window.fetchAccounts) window.fetchAccounts();
    } else {
      alert('🔴 Lỗi: ' + (data.error || 'Không thể đồng bộ thiết lập'));
    }
  } catch (e) {
    alert(`❌ Lỗi kết nối: ${e.message}`);
  }
};



window.toggleMarketFilter = async function(line_uid, category) {
  const acc = window.lastFetchedAccounts.find(x => x.line_uid === line_uid);
  if (!acc) return;
  
  // Clone mảng để tránh lỗi tham chiếu
  let filters = [...(acc.settings.marketFilters || [])];
  
  const index = filters.indexOf(category);
  if (index !== -1) {
    filters.splice(index, 1);
  } else {
    filters.push(category);
  }
  
  // Cập nhật UI cục bộ lập tức
  acc.settings.marketFilters = filters;
  updateCard(acc);
  
  try {
    const response = await fetch(`/api/accounts/${line_uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketFilters: filters })
    });
    if (!response.ok) {
      // Rollback
      const idx = filters.indexOf(category);
      if (idx !== -1) filters.splice(idx, 1);
      else filters.push(category);
      acc.settings.marketFilters = filters;
      updateCard(acc);
    }
  } catch (err) {
    console.error('Error updating market filter:', err);
    // Rollback
    const idx = filters.indexOf(category);
    if (idx !== -1) filters.splice(idx, 1);
    else filters.push(category);
    acc.settings.marketFilters = filters;
    updateCard(acc);
  }
};

window.filterCardList = function(line_uid, searchVal) {
  const container = document.getElementById(`market-card-subpanel-${line_uid}`);
  if (!container) return;
  const q = (searchVal || '').toLowerCase().trim();
  const rows = container.querySelectorAll('.card-item-select-row');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? 'flex' : 'none';
  });
};

window.filterCollectibleList = function(line_uid, searchVal) {
  const container = document.getElementById(`market-collectible-subpanel-${line_uid}`);
  if (!container) return;
  const q = (searchVal || '').toLowerCase().trim();
  const rows = container.querySelectorAll('.collectible-item-select-row');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? 'flex' : 'none';
  });
};

window.toggleMarketItemKeyword = async function(line_uid, fieldType, itemName) {
  const acc = window.lastFetchedAccounts.find(x => x.line_uid === line_uid);
  if (!acc) return;
  acc.settings = acc.settings || {};
  
  const settingsField = fieldType === 'card' ? 'marketCardNames' : 'marketCollectibleNames';
  let currentNames = (acc.settings[settingsField] || '').split(',').map(s => s.trim()).filter(Boolean);
  
  const idx = currentNames.indexOf(itemName);
  if (idx !== -1) {
    currentNames.splice(idx, 1);
  } else {
    currentNames.push(itemName);
  }
  
  const newVal = currentNames.join(', ');
  acc.settings[settingsField] = newVal;
  
  // Update local UI
  window.updateCard(acc);
  
  try {
    await fetch(`/api/accounts/${line_uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [settingsField]: newVal })
    });
  } catch (err) {
    console.error(`Error updating ${settingsField}:`, err);
  }
};

window.toggleSelectAllKeywords = async function(line_uid, fieldType, groupType, action) {
  const acc = window.lastFetchedAccounts.find(x => x.line_uid === line_uid);
  if (!acc) return;
  acc.settings = acc.settings || {};
  
  const settingsField = fieldType === 'card' ? 'marketCardNames' : 'marketCollectibleNames';
  let currentNames = (acc.settings[settingsField] || '').split(',').map(s => s.trim()).filter(Boolean);
  
  let targetList = [];
  if (fieldType === 'card') {
    targetList = groupType === 'normal' ? NORMAL_MONSTERS : MVP_MONSTERS;
  } else {
    targetList = groupType === 'normal' ? NORMAL_COLLECTIBLES : MVP_COLLECTIBLES;
  }
  
  if (action === 'select') {
    // Add all items in targetList that are not already present
    targetList.forEach(item => {
      if (!currentNames.includes(item)) {
        currentNames.push(item);
      }
    });
  } else {
    // Remove all items in targetList
    currentNames = currentNames.filter(item => !targetList.includes(item));
  }
  
  const newVal = currentNames.join(', ');
  acc.settings[settingsField] = newVal;
  
  // Update UI
  window.updateCard(acc);
  
  try {
    await fetch(`/api/accounts/${line_uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [settingsField]: newVal })
    });
  } catch (err) {
    console.error(`Error updating ${settingsField}:`, err);
  }
};

window.toggleModuleTierFilter = async function(line_uid, tier) {
  const acc = window.lastFetchedAccounts.find(x => x.line_uid === line_uid);
  if (!acc) return;
  acc.settings = acc.settings || {};
  let tiers = acc.settings.marketModuleTiers || [];
  if (!Array.isArray(tiers)) tiers = [];
  const idx = tiers.indexOf(tier);
  if (idx !== -1) tiers.splice(idx, 1);
  else tiers.push(tier);
  acc.settings.marketModuleTiers = tiers;
  window.updateCard(acc);
  try {
    await fetch(`/api/accounts/${line_uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketModuleTiers: tiers })
    });
  } catch (err) {
    console.error('Error updating market module tiers:', err);
  }
};

window.toggleModuleTypeFilter = async function(line_uid, type) {
  const acc = window.lastFetchedAccounts.find(x => x.line_uid === line_uid);
  if (!acc) return;
  acc.settings = acc.settings || {};
  let types = acc.settings.marketModuleTypes || [];
  if (!Array.isArray(types)) types = [];
  const idx = types.indexOf(type);
  if (idx !== -1) types.splice(idx, 1);
  else types.push(type);
  acc.settings.marketModuleTypes = types;
  window.updateCard(acc);
  try {
    await fetch(`/api/accounts/${line_uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketModuleTypes: types })
    });
  } catch (err) {
    console.error('Error updating market module types:', err);
  }
};

// ==================== REVAMPED AUTO MARKET BUY ENGINE & ACCORDION UI ====================
const MARKET_CATEGORY_DEFS = [
  { key: 'module', title: 'Module (Phân theo Tier T1 - T5)', icon: '🔧', filterable: true, desc: 'Lọc mua các loại Module phụ trợ theo Tier (T1 đến T5).' },
  { key: 'card', title: 'Thẻ Quái Lẻ (Phân theo Tên quái)', icon: '🎴', filterable: true, desc: 'Lọc mua thẻ quái vật theo danh sách tên quái chỉ định.' },
  { key: 'egg', title: 'Trứng Thú Cưng (Phân theo Tên quái)', icon: '🥚', filterable: true, desc: 'Lọc mua trứng Pet theo danh sách quái chỉ định.' },
  { key: 'collectible', title: 'Đồ Sưu Tầm & Chứng', icon: '🗃️', filterable: true, desc: 'Lọc mua các loại Chứng Titan, Bảo vật, Linh kiện.' },
  { key: 'resource', title: 'Nguyên Liệu (Đá, Thuốc, Đạn...) — Mặc định OFF', icon: '🪵', filterable: false, desc: '⚠️ Coi là rác. Mặc định OFF. Bật công tắc nếu muốn tự động mua.' },
  { key: 'card_box', title: 'Hộp Thẻ Bài', icon: '🎁', filterable: true, desc: 'Lọc mua hộp thẻ bài theo Bậc (bậc 1 đến bậc 8).' },
  { key: 'egg_box', title: 'Hộp Trứng Pet', icon: '🎁', filterable: true, desc: 'Lọc mua hộp trứng Pet theo Bậc (bậc 1 đến bậc 8).' },
  { key: 'module_box', title: 'Hộp Module', icon: '📦', filterable: true, desc: 'Lọc mua hộp Module theo loại (Cao cấp, Hiếm, Sử thi, Sử thi+).' },
  { key: 'diamond', title: 'Kim Cương', icon: '💎', filterable: false, desc: 'Tự động mua Kim Cương khi giá <= mức giá tối đa.' }
];

function isMvpName(name) {
  return name.startsWith('MVP ');
}

function getMonsterLists(acc) {
  const normSet = new Set();
  const mvpSet = new Set();

  NORMAL_MONSTERS.forEach(m => {
    if (isMvpName(m)) {
      mvpSet.add(m);
    } else {
      normSet.add(m);
      mvpSet.add(`MVP ${m}`);
    }
  });

  if (acc && acc.mon_masters) {
    for (const mid in acc.mon_masters) {
      const mm = acc.mon_masters[mid];
      if (!mm || !mm.n) continue;
      const name = mm.n;
      if (isMvpName(name)) {
        mvpSet.add(name);
      } else {
        normSet.add(name);
        mvpSet.add(`MVP ${name}`);
      }
    }
  }

  // Ensure strict mutual exclusivity by removing any MVP names from the normal set
  mvpSet.forEach(m => {
    normSet.delete(m);
  });

  return {
    normal: Array.from(normSet),
    mvp: Array.from(mvpSet)
  };
}

function renderMarketCategoryAccordion(acc) {
  const container = document.getElementById(`market-categories-accordion-${acc.line_uid}`);
  if (!container) return;

  const categoriesConfig = (acc.settings && acc.settings.marketCategories) || {};
  const selectedCards = (acc.settings && acc.settings.marketSelectedCards) || [];
  const selectedEggs = (acc.settings && acc.settings.marketSelectedEggs) || [];
  const selectedTiers = (acc.settings && acc.settings.marketSelectedModuleTiers) || [];
  const selectedCollectibles = (acc.settings && acc.settings.marketSelectedCollectibles) || [];
  const selectedModuleBoxes = (acc.settings && acc.settings.marketSelectedModuleBoxes) || [];
  const selectedCardBoxes = (acc.settings && acc.settings.marketSelectedCardBoxes) || [];
  const selectedEggBoxes = (acc.settings && acc.settings.marketSelectedEggBoxes) || [];

  const { normal, mvp } = getMonsterLists(acc);

  const totalMonsters = normal.length + mvp.length;
  const prevMonsterCount = parseInt(container.getAttribute('data-monster-count') || '0');
  const needsReRender = !container.getAttribute('data-rendered') || (totalMonsters > prevMonsterCount);

  if (needsReRender) {
    container.setAttribute('data-rendered', 'true');
    container.setAttribute('data-monster-count', String(totalMonsters));

    let html = '';
    MARKET_CATEGORY_DEFS.forEach(cat => {
      const isON = !!categoriesConfig[cat.key];

      html += `
        <div class="market-category-card ${isON ? 'active-on' : ''}" id="catcard-marketcat-${cat.key}-${acc.line_uid}">
          <div class="market-category-header" onclick="toggleCategoryAccordion('${acc.line_uid}', '${cat.key}')">
            <div class="market-category-title-wrap">
              <span class="market-category-icon">${cat.icon}</span>
              <span class="market-category-name">${cat.title}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;" onclick="event.stopPropagation();">
              <span class="market-category-badge ${isON ? 'badge-on' : 'badge-off'}" id="badge-marketcat-${cat.key}-${acc.line_uid}">
                ${isON ? 'BẬT' : 'TẮT'}
              </span>
              <label class="switch" style="transform: scale(0.8);">
                <input type="checkbox" id="chk-marketcat-${cat.key}-${acc.line_uid}" ${isON ? 'checked' : ''} onchange="toggleMarketCategory('${acc.line_uid}', '${cat.key}')">
                <span class="slider"></span>
              </label>
              ${cat.filterable ? `<span id="chevron-marketcat-${cat.key}-${acc.line_uid}" style="font-size: 0.75rem; color: #94a3b8; margin-left: 4px; cursor: pointer;" onclick="event.stopPropagation(); toggleCategoryAccordion('${acc.line_uid}', '${cat.key}')">▼</span>` : ''}
            </div>
          </div>

          ${cat.filterable ? `
            <div class="market-category-body" id="subpanel-marketcat-${cat.key}-${acc.line_uid}" style="display: none;">
              <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 8px;">${cat.desc}</div>

              ${cat.key === 'module' ? `
                <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span class="market-label-text" style="color: #fbbf24; font-weight: 700;">📦 Chọn Bậc Module (Tier T1 - T5):</span>
                  <div class="market-checklist-actions">
                    <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'module', 'all', 'select'); return false;">☑️ Chọn tất cả</a>
                    <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'module', 'all', 'clear'); return false;">❌ Bỏ chọn tất cả</a>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px;">
                  ${['T1', 'T2', 'T3', 'T4', 'T5'].map(tier => `
                    <label class="market-filter-label" style="font-size: 0.75rem; color: #38bdf8;">
                      <input type="checkbox" class="market-filter-checkbox" id="chk-marketitem-module-${tier}-${acc.line_uid}" ${selectedTiers.includes(tier) ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', 'module', '${tier}')"> ${tier}
                    </label>
                  `).join('')}
                </div>
              ` : ''}

              ${(cat.key === 'card' || cat.key === 'egg') ? `
                <div style="margin-bottom: 8px;">
                  <input type="text" id="txt-market-${cat.key}-search-${acc.line_uid}" class="market-search-input" placeholder="🔍 Tìm tên ${cat.key === 'card' ? 'thẻ quái vật' : 'trứng thú cưng'}..." oninput="filterMarketCategoryItems('${acc.line_uid}', '${cat.key}', this.value)">
                  <div class="market-checklist-grid">
                    <div>
                      <div class="market-checklist-header">
                        <span style="color: #60a5fa;">👾 Quái Thường (${normal.length}):</span>
                        <div class="market-checklist-actions">
                          <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', '${cat.key}', 'normal', 'select'); return false;">☑️ Chọn hết</a>
                          <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', '${cat.key}', 'normal', 'clear'); return false;">❌ Bỏ</a>
                        </div>
                      </div>
                      <div class="market-checklist-scroll">
                        ${normal.map(m => {
                          const isChecked = cat.key === 'card' ? selectedCards.includes(m) : selectedEggs.includes(m);
                          const safeId = m.replace(/\s+/g, '_');
                          return `
                            <label class="card-item-select-row normal-card-row market-item-row-${cat.key}-${acc.line_uid}" data-name="${m}">
                              <input type="checkbox" id="chk-marketitem-${cat.key}-${safeId}-${acc.line_uid}" ${isChecked ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', '${cat.key}', '${m}')"> ${m}
                            </label>
                          `;
                        }).join('')}
                      </div>
                    </div>

                    <div>
                      <div class="market-checklist-header">
                        <span style="color: #fbbf24;">👑 Boss MVP (${mvp.length}):</span>
                        <div class="market-checklist-actions">
                          <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', '${cat.key}', 'mvp', 'select'); return false;">☑️ Chọn hết</a>
                          <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', '${cat.key}', 'mvp', 'clear'); return false;">❌ Bỏ</a>
                        </div>
                      </div>
                      <div class="market-checklist-scroll">
                        ${mvp.map(m => {
                          const isChecked = cat.key === 'card' ? selectedCards.includes(m) : selectedEggs.includes(m);
                          const safeId = m.replace(/\s+/g, '_');
                          return `
                            <label class="card-item-select-row mvp-card-row market-item-row-${cat.key}-${acc.line_uid}" data-name="${m}">
                              <input type="checkbox" id="chk-marketitem-${cat.key}-${safeId}-${acc.line_uid}" ${isChecked ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', '${cat.key}', '${m}')"> ${m}
                            </label>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${cat.key === 'collectible' ? `
                <div style="margin-bottom: 8px;">
                  <div class="market-checklist-grid">
                    <div>
                      <div class="market-checklist-header">
                        <span>🗃️ Chứng & Linh kiện Thường:</span>
                        <div class="market-checklist-actions">
                          <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'collectible', 'normal', 'select'); return false;">☑️ Chọn hết</a>
                          <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'collectible', 'normal', 'clear'); return false;">❌ Bỏ</a>
                        </div>
                      </div>
                      <div class="market-checklist-scroll">
                        ${NORMAL_COLLECTIBLES.map(c => `
                          <label class="collectible-item-select-row normal-collectible-row">
                            <input type="checkbox" id="chk-marketitem-collectible-${c.replace(/\s+/g, '_')}-${acc.line_uid}" ${selectedCollectibles.includes(c) ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', 'collectible', '${c}')"> ${c}
                          </label>
                        `).join('')}
                      </div>
                    </div>
                    <div>
                      <div class="market-checklist-header">
                        <span style="color: #fbbf24;">👑 Chứng Titan & Bảo Vật:</span>
                        <div class="market-checklist-actions">
                          <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'collectible', 'mvp', 'select'); return false;">☑️ Chọn hết</a>
                          <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'collectible', 'mvp', 'clear'); return false;">❌ Bỏ</a>
                        </div>
                      </div>
                      <div class="market-checklist-scroll">
                        ${MVP_COLLECTIBLES.map(c => `
                          <label class="collectible-item-select-row mvp-collectible-row">
                            <input type="checkbox" id="chk-marketitem-collectible-${c.replace(/\s+/g, '_')}-${acc.line_uid}" ${selectedCollectibles.includes(c) ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', 'collectible', '${c}')"> ${c}
                          </label>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${cat.key === 'module_box' ? `
                <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span class="market-label-text" style="color: #fbbf24; font-weight: 700;">📦 Chọn Loại Hộp Module:</span>
                  <div class="market-checklist-actions">
                    <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'module_box', 'all', 'select'); return false;">☑️ Chọn tất cả</a>
                    <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'module_box', 'all', 'clear'); return false;">❌ Bỏ chọn tất cả</a>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px;">
                  ${['Cao cấp', 'Hiếm', 'Sử thi', 'Sử thi+'].map(type => {
                    const safeId = type.replace(/\s+/g, '_').replace(/\+/g, '_plus');
                    return `
                      <label class="market-filter-label" style="font-size: 0.75rem; color: #38bdf8;">
                        <input type="checkbox" class="market-filter-checkbox" id="chk-marketitem-module_box-${safeId}-${acc.line_uid}" ${selectedModuleBoxes.includes(type) ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', 'module_box', '${type}')"> ${type}
                      </label>
                    `;
                  }).join('')}
                </div>
              ` : ''}

              ${cat.key === 'card_box' ? `
                <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span class="market-label-text" style="color: #fbbf24; font-weight: 700;">🎁 Chọn Bậc Hộp Thẻ Bài:</span>
                  <div class="market-checklist-actions">
                    <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'card_box', 'all', 'select'); return false;">☑️ Chọn tất cả</a>
                    <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'card_box', 'all', 'clear'); return false;">❌ Bỏ chọn tất cả</a>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px;">
                  ${['Bậc 1', 'Bậc 2', 'Bậc 3', 'Bậc 4', 'Bậc 5', 'Bậc 6', 'Bậc 7', 'Bậc 8'].map(tier => {
                    const safeId = tier.replace(/\s+/g, '_');
                    return `
                      <label class="market-filter-label" style="font-size: 0.75rem; color: #38bdf8;">
                        <input type="checkbox" class="market-filter-checkbox" id="chk-marketitem-card_box-${safeId}-${acc.line_uid}" ${selectedCardBoxes.includes(tier) ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', 'card_box', '${tier}')"> ${tier}
                      </label>
                    `;
                  }).join('')}
                </div>
              ` : ''}

              ${cat.key === 'egg_box' ? `
                <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span class="market-label-text" style="color: #fbbf24; font-weight: 700;">🥚 Chọn Bậc Hộp Trứng Pet:</span>
                  <div class="market-checklist-actions">
                    <a href="#" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'egg_box', 'all', 'select'); return false;">☑️ Chọn tất cả</a>
                    <a href="#" class="clear" onclick="toggleSelectAllMarketCategoryItems('${acc.line_uid}', 'egg_box', 'all', 'clear'); return false;">❌ Bỏ chọn tất cả</a>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px;">
                  ${['Bậc 1', 'Bậc 2', 'Bậc 3', 'Bậc 4', 'Bậc 5', 'Bậc 6', 'Bậc 7', 'Bậc 8'].map(tier => {
                    const safeId = tier.replace(/\s+/g, '_');
                    return `
                      <label class="market-filter-label" style="font-size: 0.75rem; color: #38bdf8;">
                        <input type="checkbox" class="market-filter-checkbox" id="chk-marketitem-egg_box-${safeId}-${acc.line_uid}" ${selectedEggBoxes.includes(tier) ? 'checked' : ''} onchange="toggleMarketItemSelection('${acc.line_uid}', 'egg_box', '${tier}')"> ${tier}
                      </label>
                    `;
                  }).join('')}
                </div>
              ` : ''}

            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  } else {
    MARKET_CATEGORY_DEFS.forEach(cat => {
      const isON = !!categoriesConfig[cat.key];
      const chk = document.getElementById(`chk-marketcat-${cat.key}-${acc.line_uid}`);
      if (chk && document.activeElement !== chk) chk.checked = isON;

      const badge = document.getElementById(`badge-marketcat-${cat.key}-${acc.line_uid}`);
      if (badge) {
        badge.textContent = isON ? 'BẬT' : 'TẮT';
        badge.className = `market-category-badge ${isON ? 'badge-on' : 'badge-off'}`;
      }

      const cardEl = document.getElementById(`catcard-marketcat-${cat.key}-${acc.line_uid}`);
      if (cardEl) {
        if (isON) cardEl.classList.add('active-on');
        else cardEl.classList.remove('active-on');
      }

      if (cat.key === 'module') {
        ['T1', 'T2', 'T3', 'T4', 'T5'].forEach(tier => {
          const chkTier = document.getElementById(`chk-marketitem-module-${tier}-${acc.line_uid}`);
          if (chkTier && document.activeElement !== chkTier) chkTier.checked = selectedTiers.includes(tier);
        });
      } else if (cat.key === 'card' || cat.key === 'egg') {
        const list = cat.key === 'card' ? selectedCards : selectedEggs;
        const { normal, mvp } = getMonsterLists(acc);
        [...normal, ...mvp].forEach(m => {
          const chkMon = document.getElementById(`chk-marketitem-${cat.key}-${m.replace(/\s+/g, '_')}-${acc.line_uid}`);
          if (chkMon && document.activeElement !== chkMon) chkMon.checked = list.includes(m);
        });
      } else if (cat.key === 'collectible') {
        ALL_COLLECTIBLES.forEach(c => {
          const chkCol = document.getElementById(`chk-marketitem-collectible-${c.replace(/\s+/g, '_')}-${acc.line_uid}`);
          if (chkCol && document.activeElement !== chkCol) chkCol.checked = selectedCollectibles.includes(c);
        });
      } else if (cat.key === 'module_box') {
        ['Cao cấp', 'Hiếm', 'Sử thi', 'Sử thi+'].forEach(type => {
          const chkBox = document.getElementById(`chk-marketitem-module_box-${type.replace(/\s+/g, '_').replace(/\+/g, '_plus')}-${acc.line_uid}`);
          if (chkBox && document.activeElement !== chkBox) chkBox.checked = selectedModuleBoxes.includes(type);
        });
      } else if (cat.key === 'card_box') {
        ['Bậc 1', 'Bậc 2', 'Bậc 3', 'Bậc 4', 'Bậc 5', 'Bậc 6', 'Bậc 7', 'Bậc 8'].forEach(tier => {
          const chkBox = document.getElementById(`chk-marketitem-card_box-${tier.replace(/\s+/g, '_')}-${acc.line_uid}`);
          if (chkBox && document.activeElement !== chkBox) chkBox.checked = selectedCardBoxes.includes(tier);
        });
      } else if (cat.key === 'egg_box') {
        ['Bậc 1', 'Bậc 2', 'Bậc 3', 'Bậc 4', 'Bậc 5', 'Bậc 6', 'Bậc 7', 'Bậc 8'].forEach(tier => {
          const chkBox = document.getElementById(`chk-marketitem-egg_box-${tier.replace(/\s+/g, '_')}-${acc.line_uid}`);
          if (chkBox && document.activeElement !== chkBox) chkBox.checked = selectedEggBoxes.includes(tier);
        });
      }
    });
  }
}

function renderMarketBuyHistory(acc) {
  const tbody = document.getElementById(`tbl-market-buy-history-${acc.line_uid}`);
  if (!tbody) return;

  const history = acc.marketBuyHistory || [];
  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px 0;">Chưa có lịch sử tự động mua.</td></tr>`;
    return;
  }

  const categoryIcons = {
    card: '🎴', egg: '🥚', module: '🔧', collectible: '🗃️', resource: '🪵',
    card_box: '🎁', egg_box: '🎁', module_box: '📦', diamond: '💎'
  };

  tbody.innerHTML = history.map(item => {
    const isSuccess = item.status === 'success';
    const icon = categoryIcons[item.category] || '📦';
    return `
      <tr class="market-history-row ${isSuccess ? 'success' : 'failed'}">
        <td style="color: #94a3b8;">${item.time || '--:--'}</td>
        <td style="font-weight: 600;">${icon} ${item.itemName || 'Vật phẩm'}</td>
        <td style="color: #fbbf24; font-weight: 700;">${(item.price || 0).toLocaleString()}G</td>
        <td>
          <span class="market-history-status-badge ${isSuccess ? 'success' : 'failed'}">
            ${isSuccess ? '✓ Thành công' : '✕ Thất bại'}
          </span>
          ${item.error ? `<div style="font-size: 0.65rem; color: #fca5a5; margin-top: 2px;">${item.error}</div>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleMarketCategory = async function(uid, categoryKey) {
  const chk = document.getElementById(`chk-marketcat-${categoryKey}-${uid}`);
  if (!chk) return;
  const isChecked = chk.checked;

  const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
  const categories = { ...((acc && acc.settings && acc.settings.marketCategories) || {}) };
  categories[categoryKey] = isChecked;

  try {
    await fetch(`/api/accounts/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketCategories: categories })
    });
    if (acc && acc.settings) acc.settings.marketCategories = categories;
    updateCard(acc || { line_uid: uid });
  } catch (err) {
    console.error('Error updating market category:', err);
  }
};

window.toggleCategoryAccordion = function(uid, categoryKey) {
  const panel = document.getElementById(`subpanel-marketcat-${categoryKey}-${uid}`);
  const chevron = document.getElementById(`chevron-marketcat-${categoryKey}-${uid}`);
  if (!panel) return;
  const isHidden = panel.style.display === 'none' || !panel.style.display;
  panel.style.display = isHidden ? 'block' : 'none';
  if (chevron) chevron.textContent = isHidden ? '▲' : '▼';
};

window.toggleMarketItemSelection = async function(uid, category, itemVal) {
  const safeId = itemVal.replace(/\s+/g, '_').replace(/\+/g, '_plus');
  const chk = document.getElementById(`chk-marketitem-${category}-${safeId}-${uid}`);
  if (!chk) return;
  const isChecked = chk.checked;

  const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
  if (!acc || !acc.settings) return;

  let fieldKey = 'marketSelectedCards';
  if (category === 'egg') fieldKey = 'marketSelectedEggs';
  else if (category === 'module') fieldKey = 'marketSelectedModuleTiers';
  else if (category === 'collectible') fieldKey = 'marketSelectedCollectibles';
  else if (category === 'module_box') fieldKey = 'marketSelectedModuleBoxes';
  else if (category === 'card_box') fieldKey = 'marketSelectedCardBoxes';
  else if (category === 'egg_box') fieldKey = 'marketSelectedEggBoxes';

  let currentList = [...(acc.settings[fieldKey] || [])];
  if (isChecked) {
    if (!currentList.includes(itemVal)) currentList.push(itemVal);
  } else {
    currentList = currentList.filter(x => x !== itemVal);
  }

  try {
    await fetch(`/api/accounts/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [fieldKey]: currentList })
    });
    acc.settings[fieldKey] = currentList;
  } catch (err) {
    console.error(`Error updating ${fieldKey}:`, err);
  }
};

window.toggleSelectAllMarketCategoryItems = async function(uid, category, group, action) {
  const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
  if (!acc || !acc.settings) return;

  let fieldKey = 'marketSelectedCards';
  if (category === 'egg') fieldKey = 'marketSelectedEggs';
  else if (category === 'module') fieldKey = 'marketSelectedModuleTiers';
  else if (category === 'collectible') fieldKey = 'marketSelectedCollectibles';
  else if (category === 'module_box') fieldKey = 'marketSelectedModuleBoxes';
  else if (category === 'card_box') fieldKey = 'marketSelectedCardBoxes';
  else if (category === 'egg_box') fieldKey = 'marketSelectedEggBoxes';

  let targetItems = [];
  if (category === 'module') {
    targetItems = ['T1', 'T2', 'T3', 'T4', 'T5'];
  } else if (category === 'module_box') {
    targetItems = ['Cao cấp', 'Hiếm', 'Sử thi', 'Sử thi+'];
  } else if (category === 'card_box' || category === 'egg_box') {
    targetItems = ['Bậc 1', 'Bậc 2', 'Bậc 3', 'Bậc 4', 'Bậc 5', 'Bậc 6', 'Bậc 7', 'Bậc 8'];
  } else if (category === 'collectible') {
    targetItems = group === 'normal' ? NORMAL_COLLECTIBLES : group === 'mvp' ? MVP_COLLECTIBLES : ALL_COLLECTIBLES;
  } else {
    const { normal, mvp } = getMonsterLists(acc);
    targetItems = group === 'normal' ? normal : group === 'mvp' ? mvp : [...normal, ...mvp];
  }

  let currentList = [...(acc.settings[fieldKey] || [])];
  if (action === 'select') {
    targetItems.forEach(item => {
      if (!currentList.includes(item)) currentList.push(item);
    });
  } else {
    currentList = currentList.filter(item => !targetItems.includes(item));
  }

  try {
    await fetch(`/api/accounts/${uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [fieldKey]: currentList })
    });
    acc.settings[fieldKey] = currentList;
    updateCard(acc);
  } catch (err) {
    console.error(`Error in select all ${fieldKey}:`, err);
  }
};

window.filterMarketCategoryItems = function(uid, category, query) {
  const q = (query || '').toLowerCase().trim();
  const rows = document.querySelectorAll(`.market-item-row-${category}-${uid}`);
  rows.forEach(row => {
    const name = row.getAttribute('data-name') || '';
    row.style.display = (!q || name.toLowerCase().includes(q)) ? 'flex' : 'none';
  });
};

window.clearMarketBuyHistory = async function(uid) {
  try {
    await fetch(`/api/accounts/${uid}/market-buy-history`, { method: 'DELETE' });
    const acc = (window.lastFetchedAccounts || []).find(a => a.line_uid === uid);
    if (acc) acc.marketBuyHistory = [];
    const tbody = document.getElementById(`tbl-market-buy-history-${uid}`);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px 0;">Chưa có lịch sử tự động mua.</td></tr>`;
    }
  } catch (err) {
    console.error('Error clearing market buy history:', err);
  }
};

// =========================================================
// TRADE SYSTEM (Giao Dịch 1-1) & DIRECT AUTO TRANSFER (100% PORT FROM GAME)
// =========================================================
window.tradeStates = {};
window._seenTradeInv = window._seenTradeInv || {};

// Khởi tạo state trade cho từng bot giống 100% game client
function initTradeState(uid) {
  if (!window.tradeStates[uid]) {
    window.tradeStates[uid] = {
      view: 'idle', // idle | sent | room | ended
      room: null,
      searchRes: [],
      hist: null,
      items: [],
      inventory: [],
      cat: 'diamond',
      selIdx: -1,
      lastQ: '',
      busy: false,
      sig: '',
      timer: null,
      tickCount: 0
    };
  }
  return window.tradeStates[uid];
}

// 1. Vào Tab Giao Dịch
window.tradeOpen = function(uid) {
  const st = initTradeState(uid);
  st.searchRes = [];
  st.selIdx = -1;
  st.busy = false;

  // Lấy danh sách đồ trong túi đồ của bot để chuẩn bị cho picker
  loadTradeInventory(uid);

  // Gửi lấy status
  tradePost(uid, { action: 'status' }).then(d => {
    if (d) tradeApplyStatus(uid, d);
  });

  // Gửi lấy history
  st.hist = null;
  tradePost(uid, { action: 'history' }).then(d => {
    st.hist = (d && d.rows) || [];
    tradeRefresh(uid, false);
  });

  // Bắt đầu timer tick 1s
  tradeTickStart(uid);
};

// 2. Tải túi đồ bot cho Trade Picker
async function loadTradeInventory(uid) {
  try {
    const res = await fetch(`/api/accounts/${uid}/market/inventory-for-sell`);
    const data = await res.json();
    if (data && data.ok) {
      initTradeState(uid).inventory = data.items || [];
      const st = initTradeState(uid);
      if (st.view === 'room' && !st.room?.me?.locked) {
        tradeRefresh(uid, true);
      }
    }
  } catch (e) {
    console.error('[Trade Inv Error]', e);
  }
}

// 3. Gửi Request tới endpoint Trade proxy
window.tradePost = async function(uid, data) {
  try {
    const res = await fetch(`/api/accounts/${uid}/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    console.error('[Trade Post Error]', e);
    return null;
  }
};

// 4. Áp dụng Status trả về từ game server (giống 100% _trApplyStatus)
window.tradeApplyStatus = function(uid, d) {
  const st = initTradeState(uid);
  if (!d || !d.ok) return;

  if (d.msg) showToast(d.msg, 'info');

  if (d.st === 'sent') {
    st.view = 'sent';
    st.room = { partner: d.to_name || 'Đối tác' };
  } else if (d.st === 'room') {
    const prevLocked = st.room && st.room.me && st.room.me.locked;
    st.view = 'room';
    st.room = d.room;
    if (prevLocked === undefined && d.room.me && !d.room.me.locked) {
      st.selIdx = -1;
    }
  } else if (d.st === 'ended') {
    st.view = 'ended';
    st.room = d.room;
  } else {
    const wasActive = st.view === 'room' || st.view === 'sent';
    st.view = 'idle';
    st.room = null;
    if (wasActive) {
      st.hist = null;
      tradePost(uid, { action: 'history' }).then(h => {
        st.hist = (h && h.rows) || [];
        tradeRefresh(uid, true);
      });
    }
  }
  tradeRefresh(uid, false);
};

// 5. Tính Signature để chống rebuild giật input (giống 100% _trCalcSig)
function tradeCalcSig(uid) {
  const st = initTradeState(uid);
  const r = st.room || {};
  return [
    st.view,
    r.st || '',
    r.ver || 0,
    r.partner || '',
    r.me && r.me.locked ? 1 : 0,
    r.me && (r.me.confirm || r.me.confirmed) ? 1 : 0,
    r.other && r.other.locked ? 1 : 0,
    r.other && (r.other.confirm || r.other.confirmed) ? 1 : 0,
    st.hist === null ? -1 : st.hist.length
  ].join('|');
}

// 6. Timer Tick và Polling (giống 100% _trTickStart & _trTimerTick)
function tradeTickStart(uid) {
  const st = initTradeState(uid);
  if (st.timer) return;

  st.timer = setInterval(() => {
    const panel = document.getElementById(`mkt-trade-panel-${uid}`);
    if (!panel || panel.closest('.subtab-pane')?.style.display === 'none') {
      clearInterval(st.timer);
      st.timer = null;
      return;
    }

    // Cập nhật đồng hồ đếm ngược
    tradeTimerTick(uid);

    // Nếu trạng thái thay đổi thì refresh
    const sig = tradeCalcSig(uid);
    if (sig !== st.sig) {
      tradeRefresh(uid, false);
    }

    // Poll status mỗi 2 giây khi đang ở phòng hoặc đang gửi mời
    st.tickCount = (st.tickCount || 0) + 1;
    if (st.tickCount >= 2) {
      st.tickCount = 0;
      if (st.view === 'sent' || st.view === 'room') {
        tradePost(uid, { action: 'status' }).then(d => tradeApplyStatus(uid, d));
      }
    }
  }, 1000);
}

window.tradeTimerTick = function(uid) {
  const st = initTradeState(uid);
  const el = document.getElementById(`tr-timer-${uid}`);
  if (!el || !st.room || !st.room.deadline) return;

  const left = Math.max(0, (st.room.deadline | 0) - Math.floor(Date.now() / 1000));
  const tstr = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
  el.textContent = '⏳ ' + tstr;
  el.style.color = left < 60 ? '#ef4444' : '#94a3b8';
};

// 7. Render giao diện Trade (100% port layout game sang Dark Theme)
window.tradeRefresh = function(uid, force = false) {
  const st = initTradeState(uid);
  const panel = document.getElementById(`mkt-trade-panel-${uid}`);
  if (!panel) return;

  const ae = document.activeElement;
  if (!force && ae && ae.tagName === 'INPUT' && ae.closest && ae.closest(`#mkt-trade-panel-${uid}`)) {
    return; // Đang gõ phím -> hoãn rebuild tránh mất focus
  }

  const sig = tradeCalcSig(uid);
  if (!force && sig === st.sig) {
    tradeTimerTick(uid);
    return;
  }
  st.sig = sig;

  // Lưu lại giá trị ô input trước khi render
  const prevG = document.getElementById(`tr-gold-${uid}`)?.value;
  const prevQ = document.getElementById(`tr-qty-${uid}`)?.value;

  panel.innerHTML = tradeBuildBodyHtml(uid, st);

  // Khôi phục giá trị đã nhập
  const newG = document.getElementById(`tr-gold-${uid}`);
  const newQ = document.getElementById(`tr-qty-${uid}`);
  if (newG && prevG) newG.value = prevG;
  if (newQ && prevQ && prevQ !== '1') newQ.value = prevQ;
};

// Xây dựng nội dung HTML tương ứng từng trạng thái (giống 100% _trBody)
function tradeBuildBodyHtml(uid, st) {
  // A. Trạng thái SENT: Đang chờ đối tác trả lời
  if (st.view === 'sent') {
    return `
      <div style="text-align:center; padding:24px 10px; background:rgba(15,23,42,0.6); border:1px dashed rgba(56,189,248,0.3); border-radius:12px;">
        <div style="font-size:38px; line-height:1; animation:pulse 1.5s infinite;">🤝</div>
        <div style="font-size:14px; font-weight:800; color:#fbbf24; margin-top:8px;">
          Đang chờ <span style="color:#38bdf8;">${st.room?.partner || 'đối tác'}</span> trả lời...
        </div>
        <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Lời mời hết hạn sau 60 giây — Không trả lời = Tự động hủy</div>
        <div style="margin-top:16px;">
          <button class="btn btn-secondary" onclick="tradeCancel('${uid}')" style="color:#f87171; border-color:rgba(248,113,113,0.3); padding:6px 16px; font-weight:700;">
            ❌ Hủy Lời Mời
          </button>
        </div>
      </div>
    `;
  }

  // B. Trạng thái ROOM: Phòng giao dịch 1-1
  if (st.view === 'room' && st.room) {
    const r = st.room;
    const left = Math.max(0, (r.deadline | 0) - Math.floor(Date.now() / 1000));
    const tstr = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    
    const me = r.me || {};
    const other = r.other || r.partner || {};
    const meL = !!me.locked, otL = !!other.locked;
    const meC = !!(me.confirm || me.confirmed), otC = !!(other.confirm || other.confirmed);

    let stTxt = 'Chọn đồ và tiền rồi bấm Khóa Lời Đề Nghị';
    if (meL && !otL) stTxt = 'Đang chờ đối tác khóa lời đề nghị...';
    else if (!meL && otL) stTxt = 'Đối tác đã khóa! Hãy chọn đồ và bấm Khóa Lời Đề Nghị';
    else if (meL && otL && !meC) stTxt = 'Kiểm tra kỹ vật phẩm 2 bên rồi bấm Xác Nhận Giao Dịch';
    else if (meC && !otC) stTxt = 'Bạn đã xác nhận. Đang chờ đối tác bấm xác nhận...';

    let myEscHtml = tradeBuildEscRowHtml(me.esc, me.gold);
    let otherEscHtml = tradeBuildEscRowHtml(other.esc, other.gold);

    let feeHtml = '';
    if (r.initiator && r.fee) {
      const p = r.fee.p | 0;
      feeHtml = `
        <div style="margin-top:8px; border:1px solid rgba(192,132,252,0.3); background:rgba(192,132,252,0.1); border-radius:8px; padding:6px 10px; font-size:11px; color:#c084fc;">
          💎 Phí dịch vụ: <b>${p} P</b> (Người bắt đầu giao dịch chi trả khi hoàn tất)
        </div>
      `;
    }

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:800; color:#f1f5f9; margin-bottom:8px;">
        <span>🤝 Giao dịch với: <span style="color:#38bdf8;">${r.partner || other.name || 'Đối tác'}</span></span>
        <span id="tr-timer-${uid}" style="color:${left < 60 ? '#ef4444' : '#94a3b8'};">⏳ ${tstr}</span>
      </div>

      <!-- 2 Cột Thẻ Đề Nghị -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
        <!-- Của Tôi -->
        <div style="border:1.5px solid ${meL ? '#10b981' : 'rgba(255,255,255,0.1)'}; border-radius:10px; padding:8px; background:${meL ? 'rgba(16,185,129,0.12)' : 'rgba(30,41,59,0.5)'};">
          <div style="font-size:11px; font-weight:800; color:#38bdf8; display:flex; justify-content:space-between;">
            <span>BẠN ĐƯA ${meL ? '🔒' : ''} ${meC ? '✅' : ''}</span>
          </div>
          ${myEscHtml}
          ${meL && !meC ? `<button onclick="tradeUnlock('${uid}')" style="width:100%; margin-top:6px; background:rgba(255,255,255,0.1); color:#cbd5e1; border:1px solid rgba(255,255,255,0.2); border-radius:6px; padding:4px; font-size:10px; font-weight:700; cursor:pointer;">🔓 Mở Khóa / Chỉnh Lại</button>` : ''}
        </div>

        <!-- Của Đối Tác -->
        <div style="border:1.5px solid ${otL ? '#10b981' : 'rgba(255,255,255,0.1)'}; border-radius:10px; padding:8px; background:${otL ? 'rgba(16,185,129,0.12)' : 'rgba(30,41,59,0.5)'};">
          <div style="font-size:11px; font-weight:800; color:#c084fc; display:flex; justify-content:space-between;">
            <span>ĐỐI TÁC ĐƯA ${otL ? '🔒' : ''} ${otC ? '✅' : ''}</span>
          </div>
          ${otherEscHtml}
        </div>
      </div>

      <!-- Bộ chọn vật phẩm (Picker) khi chưa khóa -->
      ${!meL ? tradeBuildPickerHtml(uid, st) : ''}

      ${feeHtml}

      <div style="font-size:11px; color:#fbbf24; text-align:center; margin:8px 0; font-weight:600;">${stTxt}</div>

      <!-- Nút Hành Động -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <button onclick="tradeConfirm('${uid}')" ${meL && otL && !meC ? '' : 'disabled'} style="width:100%; padding:9px; border-radius:8px; border:none; font-size:13px; font-weight:800; cursor:${meL && otL && !meC ? 'pointer' : 'default'}; background:${meL && otL && !meC ? '#16a34a' : 'rgba(255,255,255,0.1)'}; color:${meL && otL && !meC ? '#fff' : '#64748b'};">
          ✅ Xác Nhận Giao Dịch
        </button>
        <button onclick="tradeCancel('${uid}')" style="width:100%; padding:6px; border-radius:8px; border:1px solid rgba(248,113,113,0.3); background:rgba(248,113,113,0.1); color:#f87171; font-size:11px; font-weight:700; cursor:pointer;">
          ❌ Hủy Giao Dịch
        </button>
      </div>
    `;
  }

  // C. Trạng thái ENDED: Kết thúc
  if (st.view === 'ended' && st.room) {
    const done = st.room.st === 'done';
    setTimeout(() => {
      if (st.view === 'ended') {
        st.view = 'idle';
        st.room = null;
        st.hist = null;
        tradePost(uid, { action: 'history' }).then(d => {
          st.hist = (d && d.rows) || [];
          tradeRefresh(uid, true);
        });
      }
    }, 4000);

    return `
      <div style="text-align:center; padding:20px 10px; background:rgba(15,23,42,0.6); border:1px solid ${done ? '#16a34a' : '#f59e0b'}; border-radius:12px;">
        <div style="font-size:38px;">${done ? '🎉' : '↩️'}</div>
        <div style="font-size:14px; font-weight:800; color:${done ? '#4ade80' : '#fbbf24'}; margin-top:6px;">
          ${done ? 'Giao dịch thành công!' : 'Giao dịch đã bị hủy'}
        </div>
        <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
          ${done ? 'Vật phẩm và Vàng đã vào túi đồ của bạn.' : 'Toàn bộ vật phẩm đã được hoàn trả về rương.'}
        </div>
      </div>
    `;
  }

  // D. Trạng thái IDLE: Mặc định (Tìm kiếm người chơi + Lịch sử)
  const hist = st.hist == null
    ? '<div style="text-align:center; padding:10px; color:#94a3b8; font-size:11px;"><span class="spinner" style="display:inline-block; margin-right:4px;"></span> Đang tải lịch sử...</div>'
    : (!st.hist.length
      ? '<div style="font-size:10px; color:#94a3b8; text-align:center; padding:8px 0;">Chưa có lịch sử giao dịch</div>'
      : st.hist.map(h => {
          const ok = h.status === 'done';
          const gv = (h.gave_item ? `${h.gave_item.icon || '📦'} ${h.gave_item.name} ×${h.gave_item.q | 0}` : '') + ((h.gave_gold | 0) > 0 ? ` 💰${(h.gave_gold | 0).toLocaleString()}G` : '');
          const gt = (h.got_item ? `${h.got_item.icon || '📦'} ${h.got_item.name} ×${h.got_item.q | 0}` : '') + ((h.got_gold | 0) > 0 ? ` 💰${(h.got_gold | 0).toLocaleString()}G` : '');
          return `
            <div style="border-bottom:1px dashed rgba(255,255,255,0.08); padding:6px 4px; font-size:11px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span style="font-weight:700; color:${ok ? '#4ade80' : '#94a3b8'};">${ok ? '✅' : '↩️'} ${h.partner || 'Đối tác'}</span>
                <span style="color:#64748b; font-size:10px;">${String(h.when || '').slice(5, 16)}</span>
              </div>
              ${ok ? `
                <div style="color:#f87171; font-size:10.5px;">↗ Gửi: ${gv || '---'}</div>
                <div style="color:#4ade80; font-size:10.5px;">↘ Nhận: ${gt || '---'}</div>
                ${(h.fee | 0) > 0 ? `<div style="color:#c084fc; font-size:10px;">💎 -${h.fee | 0} P</div>` : ''}
              ` : `
                <div style="color:#64748b; font-size:10px;">Đã hủy / hết hạn</div>
              `}
            </div>
          `;
        }).join(''));

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-size:12px; font-weight:800; color:#fbbf24;">🤝 Giao Dịch 1-1</div>
      </div>
      <div style="font-size:10.5px; color:#94a3b8; margin-bottom:8px;">
        Tìm kiếm người chơi đang online để gửi lời mời giao dịch (mỗi bên tối đa 1 vật phẩm + Vàng).
      </div>

      <!-- Ô Nhập Tìm Kiếm -->
      <input id="tr-search-input-${uid}" class="tr-search-input" type="text" placeholder="🔍 Nhập tên người chơi (ít nhất 2 ký tự)..." value="${st.lastQ || ''}" oninput="tradeSearchInput('${uid}', this.value)">
      
      <!-- Hộp Danh Sách Kết Quả Tìm Kiếm -->
      <div id="tr-results-${uid}" style="margin-top:4px; max-height:150px; overflow-y:auto; background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:8px; ${st.lastQ ? 'display:block;' : 'display:none;'}">
        ${tradeBuildResultsHtml(uid, st)}
      </div>

      <!-- Lịch Sử -->
      <div style="font-size:11px; font-weight:700; color:#cbd5e1; margin-top:12px; border-top:1px solid rgba(255,255,255,0.08); padding-top:8px; margin-bottom:4px;">
        📜 Lịch Sử Giao Dịch
      </div>
      <div style="max-height:160px; overflow-y:auto; background:rgba(15,23,42,0.4); border-radius:8px; padding:4px 6px;">
        ${hist}
      </div>
    </div>
  `;
}

// 8. Hiển thị đề nghị đồ và tiền
function tradeBuildEscRowHtml(esc, gold) {
  let h = '';
  if (esc) {
    h += `
      <div style="display:flex; align-items:center; gap:5px; font-size:11px; color:#f1f5f9; margin-top:4px;">
        <span style="font-size:15px;">${esc.icon || '📦'}</span>
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600;">${esc.name}</span>
        <b style="color:#4ade80;">×${esc.q | 0}</b>
      </div>
    `;
    if (esc.desc) {
      h += `<div style="font-size:9.5px; color:#94a3b8; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc.desc}</div>`;
    }
  }
  if ((gold | 0) > 0) {
    h += `<div style="font-size:11.5px; color:#fbbf24; font-weight:700; margin-top:4px;">💰 ${(gold | 0).toLocaleString()} G</div>`;
  }
  if (!h) {
    h = '<div style="font-size:10px; color:#64748b; margin-top:4px;">(Chưa đặt gì)</div>';
  }
  return h;
}

// 9. Bộ Chọn Vật Phẩm trong phòng (giống 100% _trPickerHtml)
function tradeBuildPickerHtml(uid, st) {
  const inv = st.inventory || [];
  let items = inv;

  if (st.cat === 'diamond' || st.cat === 'resource' || st.cat === 'ore' || st.cat === 'card' || st.cat === 'egg') {
    items = inv.filter(it => it.item_type === st.cat);
  } else if (st.cat === 'boxes') {
    items = inv.filter(it => it.item_type && it.item_type.endsWith('_box'));
  } else if (st.cat === 'modules') {
    items = inv.filter(it => it.item_type && it.item_type.startsWith('module_') && !it.item_type.endsWith('_box'));
  }
  st.items = items;

  const cats = [
    { k: 'diamond', n: '💎 Kim Cương' },
    { k: 'resource', n: '🪵 Nguyên Liệu' },
    { k: 'ore', n: '🪨 Quặng' },
    { k: 'boxes', n: '📦 Hộp' },
    { k: 'card', n: '🎴 Thẻ Bài' },
    { k: 'egg', n: '🥚 Trứng' },
    { k: 'modules', n: '🔧 Module' }
  ];

  const catBtns = cats.map(c => `
    <button class="subtab-btn ${st.cat === c.k ? 'active' : ''}" onclick="tradeSetCat('${uid}', '${c.k}')" style="font-size:10px; padding:2px 6px;">
      ${c.n}
    </button>
  `).join('');

  const grid = items.length ? items.map((it, i) => `
    <div onclick="tradePickItem('${uid}', ${i})" style="display:flex; align-items:center; gap:4px; border:1.5px solid ${i === st.selIdx ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; background:${i === st.selIdx ? 'rgba(56,189,248,0.2)' : 'rgba(0,0,0,0.3)'}; border-radius:6px; padding:4px 6px; font-size:10px; cursor:pointer; overflow:hidden;">
      <span style="font-size:14px;">${it.icon || '📦'}</span>
      <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#fff; flex:1;">${it.name}</span>
      <b style="color:#4ade80;">×${it.qty | 0}</b>
    </div>
  `).join('') : '<div style="font-size:10px; color:#94a3b8; padding:8px; grid-column:1/-1; text-align:center;">Không có vật phẩm trong nhóm này.</div>';

  const sel = st.selIdx >= 0 ? items[st.selIdx] : null;
  const maxQ = sel ? Math.max(1, sel.qty | 0) : 1;

  return `
    <div style="background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px; margin-top:6px;">
      <div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:4px; margin-bottom:4px;">${catBtns}</div>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:4px; max-height:120px; overflow-y:auto;">
        ${grid}
      </div>
      <div style="display:flex; align-items:center; gap:8px; margin-top:8px; font-size:11px;">
        <span>Số lượng:</span>
        <input id="tr-qty-${uid}" type="number" min="1" max="${maxQ}" value="1" ${sel && maxQ > 1 ? '' : 'disabled'} style="width:60px; padding:3px 6px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#fff; text-align:center;">
        <span>💰 Vàng:</span>
        <input id="tr-gold-${uid}" type="number" min="0" value="0" placeholder="0" style="width:80px; padding:3px 6px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#fbbf24; font-weight:700;">
      </div>
      <button onclick="tradeLock('${uid}')" style="width:100%; margin-top:8px; background:#0284c7; color:#fff; border:none; border-radius:8px; padding:7px; font-size:12px; font-weight:700; cursor:pointer;">
        🔒 Khóa Lời Đề Nghị
      </button>
    </div>
  `;
}

// 10. Tìm kiếm người chơi (giống 100% _trSearchInput & _trResultsHtml)
let _tradeSearchTimeout = {};
window.tradeSearchInput = function(uid, val) {
  const st = initTradeState(uid);
  st.lastQ = String(val || '');
  clearTimeout(_tradeSearchTimeout[uid]);

  const resEl = document.getElementById(`tr-results-${uid}`);
  if (!val || val.trim().length < 2) {
    st.searchRes = [];
    if (resEl) {
      resEl.innerHTML = tradeBuildResultsHtml(uid, st);
      resEl.style.display = val.trim() ? 'block' : 'none';
    }
    return;
  }

  _tradeSearchTimeout[uid] = setTimeout(async () => {
    const d = await tradePost(uid, { action: 'search', q: st.lastQ.trim() });
    st.searchRes = (d && d.players) || [];
    if (resEl) {
      resEl.innerHTML = tradeBuildResultsHtml(uid, st);
      resEl.style.display = 'block';
    }
  }, 350);
};

function tradeBuildResultsHtml(uid, st) {
  if (!st.searchRes.length) {
    return `<div style="font-size:10px; color:#94a3b8; text-align:center; padding:8px 0;">${st.lastQ.trim().length >= 2 ? 'Không tìm thấy người chơi online' : 'Nhập ít nhất 2 ký tự...'}</div>`;
  }
  return st.searchRes.map(p => `
    <div style="display:flex; align-items:center; gap:6px; padding:6px 8px; border-bottom:1px dashed rgba(255,255,255,0.05);">
      <span style="width:7px; height:7px; border-radius:50%; background:#22c55e; flex:none;"></span>
      <span style="flex:1; font-size:12px; font-weight:700; color:#f1f5f9; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</span>
      <span style="font-size:10px; color:#94a3b8;">Lv.${p.lv | 0}</span>
      ${(p.vip | 0) > 0 ? `<span style="font-size:9px; font-weight:800; color:#fbbf24;">VIP${p.vip | 0}</span>` : ''}
      <button onclick="tradeInvite('${uid}', '${p.uid || p.id}', '${p.name}')" style="flex:none; font-size:10px; font-weight:700; border:none; border-radius:6px; background:#0d9488; color:#fff; padding:4px 10px; cursor:pointer;">
        Mời
      </button>
    </div>
  `).join('');
}

// 11. Các hành động Mời, Phản hồi, Khóa, Mở Khóa, Xác Nhận, Hủy (giống 100% game client)
window.tradeInvite = function(uid, targetUid, targetName) {
  const st = initTradeState(uid);
  if (st.busy) return;
  st.busy = true;

  tradePost(uid, { action: 'invite', target: targetUid }).then(d => {
    st.busy = false;
    if (!d) return;
    if (!d.ok) {
      showToast('Lỗi: ' + (d.error || '?'), 'error');
      return;
    }
    showToast(`Đã gửi lời mời tới ${targetName}`);
    tradeApplyStatus(uid, Object.assign({ ok: 1, st: 'sent', to_name: targetName }, d));
  });
};

window.tradeRespond = function(uid, accept) {
  tradePost(uid, { action: 'respond', accept: accept ? 1 : 0 }).then(d => {
    if (!d) return;
    if (!d.ok) {
      if (d.error) showToast('❌ ' + d.error, 'error');
      return;
    }
    if (accept && d.st === 'room') {
      switchTab(uid, 'market-buy');
      switchMarketSubTab(uid, 'trade');
      tradeApplyStatus(uid, d);
    } else {
      tradeApplyStatus(uid, { ok: 1, st: 'none' });
    }
  });
};

window.tradeSetCat = function(uid, c) {
  const st = initTradeState(uid);
  st.cat = c;
  st.selIdx = -1;
  tradeRefresh(uid, true);
};

window.tradePickItem = function(uid, i) {
  const st = initTradeState(uid);
  st.selIdx = (st.selIdx === i ? -1 : i);
  tradeRefresh(uid, true);
};

window.tradeLock = function(uid) {
  const st = initTradeState(uid);
  if (st.busy) return;

  const gold = Math.max(0, parseInt(document.getElementById(`tr-gold-${uid}`)?.value || 0) || 0);
  const sel = st.selIdx >= 0 ? st.items[st.selIdx] : null;
  const qty = sel ? Math.max(1, Math.min(sel.qty | 0 || 1, parseInt(document.getElementById(`tr-qty-${uid}`)?.value || 1) || 1)) : 0;

  if (!sel && gold <= 0) {
    showToast('Vui lòng chọn ít nhất 1 vật phẩm hoặc nhập số Vàng', 'warning');
    return;
  }

  st.busy = true;
  const data = { action: 'lock', gold: gold };
  if (sel) {
    Object.assign(data, {
      item_type: sel.item_type,
      item_id: sel.item_id || 0,
      item_slot: sel.item_slot || sel.slot || '',
      item_tier: sel.tier || 0,
      qty: sel.isModule ? 1 : qty,
      item_icon: sel.icon,
      item_name: sel.name,
      item_desc: sel.desc,
      item_rarity: sel.rarity || 'white'
    });
  }

  tradePost(uid, data).then(d => {
    st.busy = false;
    if (!d) return;
    if (!d.ok) {
      showToast('Lỗi: ' + (d.error || '?'), 'error');
      tradePost(uid, { action: 'status' }).then(s => tradeApplyStatus(uid, s));
      return;
    }
    st.selIdx = -1;
    tradeApplyStatus(uid, d);
  });
};

window.tradeUnlock = function(uid) {
  const st = initTradeState(uid);
  if (st.busy) return;
  st.busy = true;
  tradePost(uid, { action: 'unlock' }).then(d => {
    st.busy = false;
    if (d && !d.ok && d.error) showToast('Lỗi: ' + d.error, 'error');
    if (d) tradeApplyStatus(uid, d);
  });
};

window.tradeConfirm = function(uid) {
  const st = initTradeState(uid);
  if (st.busy || !st.room) return;
  st.busy = true;
  tradePost(uid, { action: 'confirm', ver: st.room.ver | 0 }).then(d => {
    st.busy = false;
    if (d && !d.ok && d.error) {
      showToast('⚠️ ' + d.error, 'error');
      if (d.room) {
        st.room = d.room;
        tradeRefresh(uid, false);
      }
      return;
    }
    if (d) tradeApplyStatus(uid, d);
  });
};

window.tradeCancel = function(uid) {
  const st = initTradeState(uid);
  if (st.busy) return;
  st.busy = true;
  tradePost(uid, { action: 'cancel' }).then(d => {
    st.busy = false;
    if (d) tradeApplyStatus(uid, d);
    st.hist = null;
  });
};

// 12. Popup Lời Mời Giao Dịch Nổi (Giống 100% _trInvitePopup trong game)
window.showTradePopup = function(uid, inv) {
  if (!inv || !inv.tid) return;
  if (window._seenTradeInv[uid] === inv.tid) return;
  if (document.getElementById(`tr-inv-pop-${inv.tid}`)) return;

  window._seenTradeInv[uid] = inv.tid;

  const accounts = window.lastFetchedAccounts || [];
  const bot = accounts.find(a => a.line_uid === uid);
  const botName = bot ? bot.name : 'Bot';
  const fromName = inv.from_name || 'Người chơi';

  const ov = document.createElement('div');
  ov.id = `tr-inv-pop-${inv.tid}`;
  ov.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:10007; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(3px); animation:fadeIn 0.2s ease-out;';

  const box = document.createElement('div');
  box.style.cssText = 'background:#1e293b; border:1.5px solid rgba(56,189,248,0.5); border-radius:16px; padding:20px 22px; max-width:320px; width:100%; text-align:center; box-shadow:0 15px 40px rgba(0,0,0,0.6); color:#f1f5f9;';
  box.innerHTML = `
    <div style="font-size:38px; line-height:1; animation:pulse 1.5s infinite;">🤝</div>
    <div style="font-size:14px; font-weight:800; color:#fbbf24; margin-top:8px;">
      <span style="color:#38bdf8;">${fromName}</span> muốn giao dịch với <span style="color:#a855f7;">${botName}</span>
    </div>
    <div style="font-size:10.5px; color:#94a3b8; margin-top:4px;">Lời mời hết hạn sau 60 giây</div>
  `;

  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:8px; margin-top:16px;';

  const bA = document.createElement('button');
  bA.textContent = '✅ Chấp Nhận';
  bA.style.cssText = 'flex:1; background:#16a34a; color:#fff; border:none; border-radius:10px; padding:10px; font-size:12.5px; font-weight:700; cursor:pointer; transition:0.2s;';
  bA.onclick = () => {
    ov.remove();
    tradeRespond(uid, true);
    // Scroll tới bot card
    const card = document.getElementById(`card-${uid}`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const bD = document.createElement('button');
  bD.textContent = '❌ Từ Chối';
  bD.style.cssText = 'flex:1; background:rgba(255,255,255,0.1); color:#cbd5e1; border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:10px; font-size:12.5px; font-weight:700; cursor:pointer; transition:0.2s;';
  bD.onclick = () => {
    ov.remove();
    tradeRespond(uid, false);
  };

  row.appendChild(bA);
  row.appendChild(bD);
  box.appendChild(row);
  ov.appendChild(box);
  document.body.appendChild(ov);

  setTimeout(() => {
    if (ov.parentNode) ov.remove();
  }, 60000);
};
