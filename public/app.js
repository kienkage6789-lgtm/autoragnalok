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

  // State
  let currentUser = null;
  let adminProxiesList = [];
  const activeTabs = {}; // line_uid -> tab_id
  let expandedUserGroups = new Set();
  let isUserGroupInitialized = false;
  let lastFetchedAccounts = [];

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
      if (lastFetchedAccounts && lastFetchedAccounts.length > 0) {
        renderAccounts(lastFetchedAccounts);
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
    lastFetchedAccounts = [];
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
    document.getElementById('admin-tab-users').style.display    = tab === 'users'   ? '' : 'none';
    document.getElementById('admin-tab-proxies').style.display  = tab === 'proxies' ? '' : 'none';
    document.getElementById('admin-tab-backup').style.display   = tab === 'backup'  ? '' : 'none';
    
    const btnUsers   = document.getElementById('admin-tab-btn-users');
    const btnProxies = document.getElementById('admin-tab-btn-proxies');
    const btnBackup  = document.getElementById('admin-tab-btn-backup');
    
    const tabs = ['users', 'proxies', 'backup'];
    const buttons = { users: btnUsers, proxies: btnProxies, backup: btnBackup };
    
    tabs.forEach(t => {
      const btn = buttons[t];
      if (btn) {
        btn.style.background = tab === t ? 'rgba(165,180,252,0.2)' : 'transparent';
        btn.style.color      = tab === t ? '#a5b4fc' : 'var(--text-secondary)';
        btn.style.borderColor= tab === t ? 'rgba(165,180,252,0.4)' : 'var(--border-color)';
      }
    });
    
    if (tab === 'proxies' || tab === 'backup') fetchAdminProxies();
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
          <td style="padding:8px;">${expiryHtml}</td>
          <td style="padding:8px; text-align:right;">
            ${isAdmin ? '<span style="font-size:0.75rem; color:var(--text-secondary);">Gốc</span>' : `
              <div style="display:flex; justify-content:flex-end; gap:4px; flex-wrap:wrap;">
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(234,88,12,0.25); color:#fb923c; border-color:rgba(234,88,12,0.4);" onclick="setTestUserExpiry1Min('${u.id}')" title="Set đúng 1 Phút để TEST">1Phút⚡</button>
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(168,85,247,0.2); color:#c084fc; border-color:rgba(168,85,247,0.3);" onclick="extendUserExpiry('${u.id}', 1)" title="Gia hạn thêm 1 Ngày">+1Ngày</button>
                <button class="btn-mini" style="width:auto; padding:3px 6px; background:rgba(59,130,246,0.2); color:#60a5fa; border-color:rgba(59,130,246,0.3);" onclick="extendUserExpiry('${u.id}', 30)" title="Gia hạn thêm 30 Ngày">+30Ngày</button>
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

    const payload = {
      name: document.getElementById('acc-name').value.trim(),
      line_uid: document.getElementById('acc-uid').value.trim(),
      session_token: document.getElementById('acc-token').value.trim()
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
      modalError.textContent = 'Không thể kết nối đến server quản lý';
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

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';
      }

      const phpsessid = inputPhpsessid.value.trim();

      try {
        const response = await fetch('/api/add-by-phpsessid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phpsessid })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          closeModal();
          fetchAccounts();
          addPhpsessidForm.reset();
        } else {
          phpsessidError.textContent = data.error || 'PHPSESSID không hợp lệ hoặc hết hạn!';
        }
      } catch (err) {
        phpsessidError.textContent = 'Không thể kết nối đến server quản lý';
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
    const token = document.getElementById('edit-acc-token').value.trim();

    const payload = { name };
    if (token) {
      payload.session_token = token;
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
      } else {
        editModalError.textContent = data.error || 'Có lỗi xảy ra khi cập nhật tài khoản';
      }
    } catch (err) {
      editModalError.textContent = 'Không thể kết nối đến server quản lý';
    } finally {
      editSubmitSpinner.classList.remove('active');
      editModalSubmitBtn.disabled = false;
    }
  });

  // Fetch all accounts
  async function fetchAccounts() {
    if (!currentUser) return;
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

  // Render accounts list (Grouped by User for Admin)
  function renderAccounts(accounts) {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      noAccountsMsg.style.display = 'block';
      accountsGrid.style.display = 'none';
      return;
    }

    lastFetchedAccounts = accounts;
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
      accounts.forEach(acc => {
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
            if (!activeTabs[acc.line_uid] || !['core', 'logs'].includes(activeTabs[acc.line_uid])) {
              activeTabs[acc.line_uid] = 'core';
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

      accounts.forEach(acc => {
        if (!activeTabs[acc.line_uid] || !['core', 'logs'].includes(activeTabs[acc.line_uid])) {
          activeTabs[acc.line_uid] = 'core';
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

      // Remove deleted cards
      const cardElements = accountsGrid.querySelectorAll('.account-card');
      cardElements.forEach(cardEl => {
        const uid = cardEl.id.replace('card-', '');
        if (!accounts.some(acc => acc.line_uid === uid)) {
          cardEl.remove();
          delete activeTabs[uid];
        }
      });
    }
  }

  // Build the skeleton structure for the card
  function buildCardSkeleton(cardEl, acc) {
    cardEl.innerHTML = `
      <div class="card-header">
        <div class="acc-info-compact">
          <span class="acc-name" id="name-${acc.line_uid}">${acc.name}</span>
          <span class="acc-lv" id="lv-txt-${acc.line_uid}">Lv.--</span>
          <span class="badge badge-${acc.status}" id="status-badge-${acc.line_uid}">${acc.status}</span>
          <span id="proxy-badge-${acc.line_uid}" style="font-size:0.7rem; padding:1px 5px; border-radius:4px; background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3); white-space:nowrap; display: none;">🌐 —</span>
        </div>
        <div class="header-actions-compact">
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

      <div class="combat-rates-strip">
        <span class="stat-pill" title="Số quái hạ gục mỗi phút">⚔️ <strong id="rate-kills-${acc.line_uid}">0/m</strong></span>
        <span class="stat-pill" title="Vàng nhận được mỗi phút">💰 <strong id="rate-gold-${acc.line_uid}">+0/m</strong></span>
        <span class="stat-pill" title="EXP nhận được mỗi phút">⭐ <strong id="rate-exp-${acc.line_uid}">+0/m</strong></span>
      </div>

      <div class="resources-strip">
        <span class="stat-pill" title="Vàng (Gold)">💰 <strong id="res-gold-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Gỗ (Wood)">🪵 <strong id="res-wood-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Đá (Stone)">🪨 <strong id="res-stone-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Sắt (Iron)">⚙️ <strong id="res-iron-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Đồng (Copper)">🟫 <strong id="res-copper-${acc.line_uid}">--</strong></span>
        <span class="stat-pill" title="Thảo dược (Herb)">🌿 <strong id="res-herb-${acc.line_uid}">--</strong></span>
      </div>

      <div class="card-tabs-nav">
        <button class="tab-link active" id="tab-btn-core-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'core')">Cơ Bản</button>
        <button class="tab-link" id="tab-btn-mvp-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'mvp')">Săn Boss</button>
        <button class="tab-link" id="tab-btn-skills-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'skills')">👤 Nhân Vật</button>
        <button class="tab-link" id="tab-btn-loot-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'loot')">Vật Phẩm</button>
        <button class="tab-link" id="tab-btn-logs-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'logs')">Nhật Ký</button>
      </div>

      <div class="card-tab-content">
        <div class="tab-pane active" id="pane-core-${acc.line_uid}">
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
              <label for="num-potion-${acc.line_uid}">🍷 Bơm Potion khi HP &lt; (%)</label>
              <input type="number" id="num-potion-${acc.line_uid}" value="50" onchange="updateNumericSetting('${acc.line_uid}', 'auto_potion_threshold')">
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
          <div class="settings-group">
            <div class="toggle-control">
              <span class="toggle-label">👿 Auto Săn Boss MVP</span>
              <label class="switch">
                <input type="checkbox" id="chk-automvp-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoMVP')">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-control">
              <span class="toggle-label">🏟️ Auto Đấu Trường</span>
              <label class="switch">
                <input type="checkbox" id="chk-autoarena-${acc.line_uid}" onchange="toggleSetting('${acc.line_uid}', 'autoArena')">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-group" style="margin-top: 10px;">
            <div class="input-control" style="grid-column: span 2;">
              <label for="sel-mvp-priority-mode-${acc.line_uid}">🎯 Tiêu chí ưu tiên săn Boss</label>
              <select id="sel-mvp-priority-mode-${acc.line_uid}" onchange="updateStringSetting('${acc.line_uid}', 'mvpPriorityMode')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
                <option value="distance">📍 Gần nhất (Khoảng cách)</option>
                <option value="level_asc">🐣 Cấp độ thấp nhất (Lv tăng dần)</option>
                <option value="level_desc">🦅 Cấp độ cao nhất (Lv giảm dần)</option>
              </select>
            </div>
          </div>

          <div class="settings-group" style="margin-top: 10px;">
            <div class="input-control" style="grid-column: span 2;">
              <label for="txt-mvp-name-priority-${acc.line_uid}">⭐ Tên Boss ưu tiên (cách nhau bởi dấu phẩy)</label>
              <input type="text" id="txt-mvp-name-priority-${acc.line_uid}" placeholder="VD: Baphomet, Pharaoh (để trống nếu săn hết)" onchange="updateStringSetting('${acc.line_uid}', 'mvpNamePriority')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
            </div>
          </div>

          <div class="settings-group" style="margin-top: 10px;">
            <div class="input-control" style="grid-column: span 2;">
              <label for="txt-mvp-name-blacklist-${acc.line_uid}">🚫 Tên Boss bỏ qua (cách nhau bởi dấu phẩy)</label>
              <input type="text" id="txt-mvp-name-blacklist-${acc.line_uid}" placeholder="VD: Slime King, Goblin Leader" onchange="updateStringSetting('${acc.line_uid}', 'mvpNameBlacklist')" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 6px; color: #fff; padding: 6px; font-family: inherit; font-size: 0.85rem; outline: none; margin-top:2px;">
            </div>
          </div>
        </div>

        <!-- Loot Tab Pane -->
        <div class="tab-pane" id="pane-loot-${acc.line_uid}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:0 2px;">
            <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">🎁 Nhật ký rơi đồ (Database Máy Chủ)</span>
            <button class="btn btn-secondary btn-sm" onclick="fetchDropLogs('${acc.line_uid}')" style="padding:2px 8px; font-size:0.75rem;">🔄 Cập nhật</button>
          </div>
          <div class="log-terminal" id="loot-terminal-${acc.line_uid}">
            <div class="log-line"><span class="log-text-content">Chuyển sang tab này để tải lịch sử rơi đồ từ máy chủ.</span></div>
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

        <!-- Logs Tab Pane -->
        <div class="tab-pane" id="pane-logs-${acc.line_uid}">
          <div class="log-terminal" id="terminal-${acc.line_uid}">
            <!-- Log lines will be appended here -->
          </div>
        </div>
      </div>
    `;
  }

  // Update card UI with fresh account data
  function updateCard(acc) {
    const card = document.getElementById(`card-${acc.line_uid}`);
    if (!card) return;

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
    document.getElementById(`res-wood-${acc.line_uid}`).textContent = p.wood ? p.wood.toLocaleString() : '0';
    document.getElementById(`res-stone-${acc.line_uid}`).textContent = p.stone ? p.stone.toLocaleString() : '0';
    document.getElementById(`res-iron-${acc.line_uid}`).textContent = p.iron ? p.iron.toLocaleString() : '0';
    document.getElementById(`res-copper-${acc.line_uid}`).textContent = p.copper ? p.copper.toLocaleString() : '0';
    document.getElementById(`res-herb-${acc.line_uid}`).textContent = p.herb ? p.herb.toLocaleString() : '0';

    // Combat rates
    const rates = acc.combatRates || { killsPerMin: 0, goldPerMin: 0, expPerMin: 0 };
    const formatRateValue = (val, isKills = false) => {
      const prefix = isKills ? '' : '+';
      const suffix = ' /m';
      if (val >= 1000) {
        return `${prefix}${(val / 1000).toFixed(1)}k${suffix}`;
      }
      return `${prefix}${val.toLocaleString()}${suffix}`;
    };

    const elKills = document.getElementById(`rate-kills-${acc.line_uid}`);
    if (elKills) elKills.textContent = formatRateValue(rates.killsPerMin, true);

    const elGold = document.getElementById(`rate-gold-${acc.line_uid}`);
    if (elGold) elGold.textContent = formatRateValue(rates.goldPerMin, false);

    const elExp = document.getElementById(`rate-exp-${acc.line_uid}`);
    if (elExp) elExp.textContent = formatRateValue(rates.expPerMin, false);

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

    const chkAutoMVP = document.getElementById(`chk-automvp-${acc.line_uid}`);
    if (chkAutoMVP && document.activeElement !== chkAutoMVP) chkAutoMVP.checked = acc.settings.autoMVP === true;

    const chkAutoArena = document.getElementById(`chk-autoarena-${acc.line_uid}`);
    if (chkAutoArena && document.activeElement !== chkAutoArena) chkAutoArena.checked = acc.settings.autoArena === true;

    // MVP Boss settings sync
    const selMvpPriority = document.getElementById(`sel-mvp-priority-mode-${acc.line_uid}`);
    if (selMvpPriority && document.activeElement !== selMvpPriority) selMvpPriority.value = acc.settings.mvpPriorityMode || 'distance';

    const txtMvpPriority = document.getElementById(`txt-mvp-name-priority-${acc.line_uid}`);
    if (txtMvpPriority && document.activeElement !== txtMvpPriority) txtMvpPriority.value = acc.settings.mvpNamePriority || '';

    const txtMvpBlacklist = document.getElementById(`txt-mvp-name-blacklist-${acc.line_uid}`);
    if (txtMvpBlacklist && document.activeElement !== txtMvpBlacklist) txtMvpBlacklist.value = acc.settings.mvpNameBlacklist || '';

    // Auto Map toggle & map select sync
    const chkAutoMap = document.getElementById(`chk-automap-${acc.line_uid}`);
    if (chkAutoMap && document.activeElement !== chkAutoMap) chkAutoMap.checked = acc.settings.autoMap === true;

    const selMap = document.getElementById(`sel-map-${acc.line_uid}`);
    if (selMap && document.activeElement !== selMap) {
      const currentTargetMap = acc.settings.targetMap !== undefined ? acc.settings.targetMap : (acc.player ? acc.player.map : 1);
      selMap.value = String(currentTargetMap || 1);
    }

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

    // Render tab contents based on active state
    const currentTab = activeTabs[acc.line_uid];
    if (currentTab === 'logs') {
      fetchLogs(acc.line_uid);
    }
  }

  // Populate zone dropdown from spots data returned by server
  function populateZoneSelect(acc) {
    const sel = document.getElementById(`sel-zone-${acc.line_uid}`);
    if (!sel) return;

    const spots = acc.spots; // object keyed by zone id, or null
    if (!spots || typeof spots !== 'object') {
      // No spots data yet — keep placeholder, disable select
      sel.innerHTML = `<option value="">⏳ Chờ tải dữ liệu Zone...</option>`;
      return;
    }

    const spotsList = Object.values(spots);
    if (spotsList.length === 0) {
      sel.innerHTML = `<option value="">🗺️ Không có Zone trên bản đồ này</option>`;
      return;
    }

    // Only re-render if spots list changed (avoid dropdown flicker)
    const currentCount = sel.querySelectorAll('option[value]').length;
    if (currentCount !== spotsList.length || sel.dataset.lastMap !== String(acc.player && acc.player.map)) {
      sel.dataset.lastMap = String(acc.player && acc.player.map);
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
    activeTabs[uid] = tabId;
    
    const tabLinks = document.querySelectorAll(`#card-${uid} .tab-link`);
    tabLinks.forEach(link => {
      link.classList.toggle('active', link.id === `tab-btn-${tabId}-${uid}`);
    });

    const panes = document.querySelectorAll(`#card-${uid} .tab-pane`);
    panes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tabId}-${uid}`);
    });

    if (tabId === 'logs') {
      fetchLogs(uid);
    } else if (tabId === 'loot') {
      fetchDropLogs(uid);
    } else {
      fetchAccounts();
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

    lootTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#a7f3d0;">⏳ Đang tải lịch sử rơi đồ từ máy chủ...</span></div>`;

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
        lootTerm.innerHTML = `<div class="log-line"><span class="log-text-content">Chưa có lịch sử rơi đồ nào trên máy chủ.</span></div>`;
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
          <span style="color:var(--text-muted); font-size:0.75rem; min-width:115px;">[${item.time}]</span>
          <span style="font-size:0.7rem; padding:1px 5px; border-radius:4px; ${badgeStyle}">${badgeText}</span>
          <span style="font-size:0.9rem;">${item.icon}</span>
          <span style="flex:1; font-size:0.85rem; ${highlightStyle}">${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
        `;
        lootTerm.appendChild(line);
      });
    } catch (err) {
      console.error('Error fetching droplogs:', err);
      lootTerm.innerHTML = `<div class="log-line"><span class="log-text-content" style="color:#ef4444;">❌ Lỗi kết nối máy chủ: ${err.message}</span></div>`;
    }
  };

  // Open Client game window
  window.openGameLink = function(uid, token) {
    const url = `/play?line_uid=${uid}&session_token=${token}`;
    window.open(url, '_blank');
  };

  // Open Edit Account modal
  window.openEditTokenModal = function(uid) {
    const nameEl = document.getElementById(`name-${uid}`);
    const currentName = nameEl ? nameEl.textContent : '';
    document.getElementById('edit-acc-uid').value = uid;
    document.getElementById('edit-acc-name').value = currentName;
    document.getElementById('edit-acc-token').value = '';
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
    const chk = document.getElementById(`chk-${settingKey.toLowerCase()}-${uid}`);
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

    const val = isNaN(parseInt(input.value)) ? 0 : parseInt(input.value);
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

  // Update String Settings
  window.updateStringSetting = async function(uid, settingKey) {
    const hyphenated = settingKey.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
    let input = document.getElementById(`txt-${hyphenated}-${uid}`);
    if (!input) {
      input = document.getElementById(`sel-${hyphenated}-${uid}`);
    }
    if (!input) return;

    const val = input.value;
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

  // Save map and warp immediately
  window.changeTargetMap = async function(uid, mapId) {
    const val = parseInt(mapId) || 1;
    
    // Check level requirement client-side
    const MAP_REQS = { 1: 1, 2: 25, 3: 40, 4: 20, 5: 55, 6: 70 };
    const MAP_NAMES = {
      1: 'Thung lũng Trung tâm',
      2: 'Sa mạc Vĩnh hằng',
      3: 'Vùng đất Băng giá',
      4: 'Đấu trường Arena',
      5: 'Tàn tích Cổ đại',
      6: 'Núi lửa Sôi trào'
    };
    
    const reqLv = MAP_REQS[val] || 1;
    const lvEl = document.getElementById(`lv-txt-${uid}`);
    if (lvEl) {
      const match = lvEl.textContent.match(/Lv\.\s*(\d+)/i);
      if (match) {
        const currentLv = parseInt(match[1]) || 1;
        if (currentLv < reqLv) {
          alert(`Cấp độ không đủ! Bản đồ ${MAP_NAMES[val]} yêu cầu Lv.${reqLv}+. Nhân vật của bạn hiện tại là Lv.${currentLv}.`);
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
      if (data.error) {
        alert(`Thao tác thất bại: ${data.error}`);
      } else {
        fetchAccounts();
      }
    } catch (err) {
      console.error('Error triggering action:', err);
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
    } catch (e) {
      console.error('Error fetching proxies:', e);
    }
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
      try {
        const res = await fetch('/api/admin/proxies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, url })
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

  // Initial Startup
  checkAuth().then(authed => {
    if (authed) {
      fetchAccounts();
      if (currentUser && currentUser.role === 'admin') {
        fetchAdminProxies();
      }
    }
  });

  // Periodic account polling & live Admin table tick
  let adminProxyTick = 0;
  setInterval(() => {
    if (currentUser) {
      fetchAccounts();
      
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
