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
  const activeTabs = {}; // line_uid -> tab_id

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
    currentUser = null;
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
    const btnUsers   = document.getElementById('admin-tab-btn-users');
    const btnProxies = document.getElementById('admin-tab-btn-proxies');
    if (btnUsers && btnProxies) {
      btnUsers.style.background   = tab === 'users'   ? 'rgba(165,180,252,0.2)' : 'transparent';
      btnUsers.style.color        = tab === 'users'   ? '#a5b4fc' : 'var(--text-secondary)';
      btnUsers.style.borderColor  = tab === 'users'   ? 'rgba(165,180,252,0.4)' : 'var(--border-color)';
      btnProxies.style.background = tab === 'proxies' ? 'rgba(165,180,252,0.2)' : 'transparent';
      btnProxies.style.color      = tab === 'proxies' ? '#a5b4fc' : 'var(--text-secondary)';
      btnProxies.style.borderColor= tab === 'proxies' ? 'rgba(165,180,252,0.4)' : 'var(--border-color)';
    }
    if (tab === 'proxies') fetchAdminProxies();
  };

  // Admin Fetch Users
  async function fetchAdminUsers() {
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
            ${isAdmin ? 'Vô hạn' : `
              <div style="display:flex; align-items:center; gap:6px;">
                <span>${u.botCount} /</span>
                <input type="number" value="${u.maxAccounts || 1}" min="1" style="width:50px; padding:2px 4px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); border-radius:4px; color:#fff; font-size:0.8rem;" onchange="updateUserQuota('${u.id}', this.value)">
              </div>
            `}
          </td>
          <td style="padding:8px;">${expiryHtml}</td>
          <td style="padding:8px; text-align:right;">
            ${isAdmin ? '<span style="font-size:0.75rem; color:var(--text-secondary);">Gốc</span>' : `
              <div style="display:flex; justify-content:flex-end; gap:4px;">
                <button class="btn-mini" style="width:auto; padding:2px 6px; background:rgba(234,88,12,0.25); color:#fb923c; border-color:rgba(234,88,12,0.4);" onclick="setTestUserExpiry1Min('${u.id}')" title="Set đúng 1 Phút để TEST">1Phút⚡</button>
                <button class="btn-mini" style="width:auto; padding:2px 6px; background:rgba(168,85,247,0.2); color:#c084fc; border-color:rgba(168,85,247,0.3);" onclick="extendUserExpiry('${u.id}', 1)" title="Gia hạn thêm 1 Ngày">+1Ngày</button>
                <button class="btn-mini" style="width:auto; padding:2px 6px; background:rgba(59,130,246,0.2); color:#60a5fa; border-color:rgba(59,130,246,0.3);" onclick="extendUserExpiry('${u.id}', 30)" title="Gia hạn thêm 30 Ngày">+30Ngày</button>
                <button class="btn-mini" style="width:auto; padding:2px 6px; background:rgba(239,68,68,0.2); color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="deleteAdminUser('${u.id}', '${u.username}')">Xóa</button>
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

  // Render accounts list
  function renderAccounts(accounts) {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      noAccountsMsg.style.display = 'block';
      accountsGrid.style.display = 'none';
      return;
    }

    noAccountsMsg.style.display = 'none';
    accountsGrid.style.display = 'grid';

    accounts.forEach(acc => {
      // Set default tab if not set or invalid
      if (!activeTabs[acc.line_uid] || !['core', 'logs'].includes(activeTabs[acc.line_uid])) {
        activeTabs[acc.line_uid] = 'core';
      }
      
      let card = document.getElementById(`card-${acc.line_uid}`);
      if (!card) {
        // Create new card skeleton
        card = document.createElement('div');
        card.id = `card-${acc.line_uid}`;
        card.className = `account-card ${acc.status}`;
        accountsGrid.appendChild(card);
        buildCardSkeleton(card, acc);
      }
      
      // Update values
      updateCard(acc);
    });

    // Remove cards for deleted accounts
    const cardElements = accountsGrid.querySelectorAll('.account-card');
    cardElements.forEach(cardEl => {
      const uid = cardEl.id.replace('card-', '');
      if (!accounts.some(acc => acc.line_uid === uid)) {
        cardEl.remove();
        delete activeTabs[uid];
      }
    });
  }

  // Build the skeleton structure for the card
  function buildCardSkeleton(cardEl, acc) {
    cardEl.innerHTML = `
      <div class="card-header">
        <div class="acc-info">
          <div class="acc-name-wrapper">
            <span class="acc-name" id="name-${acc.line_uid}">${acc.name}</span>
            <span class="badge badge-${acc.status}" id="status-badge-${acc.line_uid}">${acc.status}</span>
            <span id="proxy-badge-${acc.line_uid}" style="font-size:0.7rem; padding:2px 6px; border-radius:6px; background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.3); white-space:nowrap;">🌐 —</span>
          </div>
          <span class="acc-lv" id="lv-txt-${acc.line_uid}">Lv. --</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.85rem;" onclick="openEditTokenModal('${acc.line_uid}')">Sửa</button>
          <button class="btn btn-danger" style="padding:6px 12px; font-size:0.85rem;" onclick="deleteAccount('${acc.line_uid}')">Xóa</button>
        </div>
      </div>

      <div class="card-vitals">
        <div class="vital-row">
          <span class="vital-label">❤️ HP</span>
          <div class="bar-container">
            <div class="bar-fill bar-hp" id="hp-bar-${acc.line_uid}" style="width: 0%"></div>
            <div class="bar-text" id="hp-txt-${acc.line_uid}">-- / --</div>
          </div>
        </div>
        <div class="vital-row">
          <span class="vital-label">🛡️ Giáp</span>
          <div class="bar-container">
            <div class="bar-fill bar-armor" id="armor-bar-${acc.line_uid}" style="width: 0%"></div>
            <div class="bar-text" id="armor-txt-${acc.line_uid}">-- / --</div>
          </div>
        </div>
      </div>

      <div class="card-resources">
        <div class="resource-item" title="Vàng (Gold)">
          <span class="res-icon">💰</span>
          <span class="res-val" id="res-gold-${acc.line_uid}">--</span>
        </div>
        <div class="resource-item" title="Gỗ (Wood)">
          <span class="res-icon">🪵</span>
          <span class="res-val" id="res-wood-${acc.line_uid}">--</span>
        </div>
        <div class="resource-item" title="Đá (Stone)">
          <span class="res-icon">🪨</span>
          <span class="res-val" id="res-stone-${acc.line_uid}">--</span>
        </div>
        <div class="resource-item" title="Sắt (Iron)">
          <span class="res-icon">⚙️</span>
          <span class="res-val" id="res-iron-${acc.line_uid}">--</span>
        </div>
        <div class="resource-item" title="Đồng (Copper)">
          <span class="res-icon">🟫</span>
          <span class="res-val" id="res-copper-${acc.line_uid}">--</span>
        </div>
        <div class="resource-item" title="Thảo dược (Herb)">
          <span class="res-icon">🌿</span>
          <span class="res-val" id="res-herb-${acc.line_uid}">--</span>
        </div>
      </div>

      <div class="card-actions-strip">
        <button class="btn btn-open-game" onclick="openGameLink('${acc.line_uid}', '${acc.session_token}')">
          🎮 Mở Trực Tiếp Client Game
        </button>
      </div>

      <div class="card-tabs-nav">
        <button class="tab-link active" id="tab-btn-core-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'core')">Cơ Bản</button>
        <button class="tab-link" id="tab-btn-mvp-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'mvp')">Săn Boss</button>
        <button class="tab-link" id="tab-btn-logs-${acc.line_uid}" onclick="switchTab('${acc.line_uid}', 'logs')">Nhật Ký</button>
      </div>

      <div class="card-tab-content">
        <div class="tab-pane active" id="pane-core-${acc.line_uid}">
          <div class="settings-group" style="border: 1px solid rgba(165,180,252,0.15); background: rgba(165,180,252,0.02); border-radius: 12px; padding: 10px 12px; margin-bottom: 10px;">
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
                <option value="4">🏛️ Đấu trường Arena (Lv.20+)</option>
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

          <div style="font-size:0.85rem; font-weight:700; color:var(--text-secondary); margin-top:5px;">Chỉ số chính (Stat Points còn lại: <span id="pts-val-${acc.line_uid}">0</span>)</div>
          <div class="stats-list" id="stats-list-${acc.line_uid}">
            <!-- Stat rows rendered dynamically -->
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

    // Vitals
    const hpPct = p.hp_max > 0 ? (p.hp / p.hp_max) * 100 : 0;
    const hpBar = document.getElementById(`hp-bar-${acc.line_uid}`);
    hpBar.style.width = `${hpPct}%`;
    document.getElementById(`hp-txt-${acc.line_uid}`).textContent = `${p.hp} / ${p.hp_max}`;

    const armorBar = document.getElementById(`armor-bar-${acc.line_uid}`);
    armorBar.style.width = `${Math.min(100, (p.armor_lv / 50) * 100)}%`;
    document.getElementById(`armor-txt-${acc.line_uid}`).textContent = `Cấp giáp: ${p.armor_lv || 0}`;

    // Resource row
    document.getElementById(`res-gold-${acc.line_uid}`).textContent = p.gold ? p.gold.toLocaleString() : '0';
    document.getElementById(`res-wood-${acc.line_uid}`).textContent = p.wood ? p.wood.toLocaleString() : '0';
    document.getElementById(`res-stone-${acc.line_uid}`).textContent = p.stone ? p.stone.toLocaleString() : '0';
    document.getElementById(`res-iron-${acc.line_uid}`).textContent = p.iron ? p.iron.toLocaleString() : '0';
    document.getElementById(`res-copper-${acc.line_uid}`).textContent = p.copper ? p.copper.toLocaleString() : '0';
    document.getElementById(`res-herb-${acc.line_uid}`).textContent = p.herb ? p.herb.toLocaleString() : '0';

    // Settings checkboxes states
    const chkBotLoop = document.getElementById(`chk-bot-loop-${acc.line_uid}`);
    if (chkBotLoop && document.activeElement !== chkBotLoop) chkBotLoop.checked = acc.status === 'running';

    const chkBot = document.getElementById(`chk-bot-${acc.line_uid}`);
    if (document.activeElement !== chkBot) chkBot.checked = acc.settings.bot == 1;

    const chkLock = document.getElementById(`chk-lock_pos-${acc.line_uid}`);
    if (document.activeElement !== chkLock) chkLock.checked = acc.settings.lock_pos == 1;

    const chkAutoStats = document.getElementById(`chk-autostats-${acc.line_uid}`);
    if (chkAutoStats && document.activeElement !== chkAutoStats) chkAutoStats.checked = acc.settings.autoStats === true;

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
    if (selMap && document.activeElement !== selMap) selMap.value = String(acc.settings.targetMap || 1);

    // Auto Zone toggle & zone select: populate from acc.spots then sync value
    const chkAutoZone = document.getElementById(`chk-autozone-${acc.line_uid}`);
    if (chkAutoZone && document.activeElement !== chkAutoZone) chkAutoZone.checked = acc.settings.autoZone === true;

    const chkLockZoneCenter = document.getElementById(`chk-lock_zone_center-${acc.line_uid}`);
    if (chkLockZoneCenter && document.activeElement !== chkLockZoneCenter) chkLockZoneCenter.checked = acc.settings.lock_zone_center === true;

    populateZoneSelect(acc);

    // Proxy badge
    const proxyBadge = document.getElementById(`proxy-badge-${acc.line_uid}`);
    if (proxyBadge && acc.proxyInfo) {
      const info = acc.proxyInfo;
      proxyBadge.textContent = `🌐 ${info.label}`;
      proxyBadge.style.background = info.isDirect ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)';
      proxyBadge.style.color      = info.isDirect ? '#34d399' : '#818cf8';
      proxyBadge.style.borderColor= info.isDirect ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)';
    }

    // Core Stats allocation UI
    document.getElementById(`pts-val-${acc.line_uid}`).textContent = p.stat_pts || 0;
    renderStatsList(acc);

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
  const statLabels = {
    str: 'STR (Sức mạnh)',
    agi: 'AGI (Linh hoạt)',
    vit: 'VIT (Thể lực)',
    intel: 'INT (Trí tuệ)',
    dex: 'DEX (Khéo léo)',
    luk: 'LUK (May mắn)'
  };

  function renderStatsList(acc) {
    const el = document.getElementById(`stats-list-${acc.line_uid}`);
    if (!el) return;
    
    const p = acc.player;
    const stats = ['str', 'agi', 'vit', 'intel', 'dex', 'luk'];
    const hasPoints = p.stat_pts > 0;

    let html = '';
    stats.forEach(st => {
      const val = p[st] || 5;
      html += `
        <div class="stat-up-item">
          <span class="stat-up-label" title="${statLabels[st]}">${st.toUpperCase()}: <b style="color:#a78bfa;">${val}</b></span>
          <div class="stat-up-actions">
            <button class="btn-mini" ${hasPoints ? '' : 'disabled'} onclick="triggerAction('${acc.line_uid}', 'stat_up', '${st}')">+</button>
            <button class="btn-mini" style="width:36px; background:rgba(124, 58, 237, 0.1);" ${hasPoints ? '' : 'disabled'} onclick="triggerAction('${acc.line_uid}', 'stat_up', '${st}', { amount: ${p.stat_pts} })">ALL</button>
          </div>
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
    } else {
      fetchAccounts();
    }
  };

  // Fetch account terminal logs
  async function fetchLogs(uid) {
    try {
      const response = await fetch(`/api/accounts/${uid}/logs`);
      const logs = await response.json();
      
      const term = document.getElementById(`terminal-${uid}`);
      if (!term) return;

      term.innerHTML = '';
      if (logs.length === 0) {
        term.innerHTML = `<div class="log-line"><span class="log-text-content">Không có nhật ký hoạt động nào.</span></div>`;
        return;
      }

      logs.forEach(l => {
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

      term.scrollTop = term.scrollHeight;
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }

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
    let input = document.getElementById(`num-${settingKey.replace(/_/g, '-')}-${uid}`);
    if (!input) {
      input = document.getElementById(`sel-${settingKey.replace(/_/g, '-')}-${uid}`);
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
    let input = document.getElementById(`txt-${settingKey.replace(/_/g, '-')}-${uid}`);
    if (!input) {
      input = document.getElementById(`sel-${settingKey.replace(/_/g, '-')}-${uid}`);
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
    try {
      await fetch(`/api/accounts/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMap: val })
      });
      await triggerAction(uid, 'warp', val);
    } catch (err) {
      console.error('Error changing target map:', err);
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
      renderProxySettings(data.settings);
      renderProxyTable(data.list);
    } catch (e) {
      console.error('Error fetching proxies:', e);
    }
  }

  function renderProxySettings(settings) {
    const chkDirect = document.getElementById('proxy-use-direct');
    const inpMax    = document.getElementById('proxy-max-bots');
    if (chkDirect && document.activeElement !== chkDirect) chkDirect.checked = settings.useDirectConnection === true;
    if (inpMax    && document.activeElement !== inpMax)    inpMax.value = settings.maxBotsPerProxy || 10;
  }

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
            ${isDirect ? '' : `
              <div style="display:flex; justify-content:flex-end; gap:4px;">
                <button class="btn-mini" style="width:auto; padding:2px 8px; background:${p.active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; color:${p.active ? '#ef4444' : '#34d399'}; border-color:${p.active ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'};" onclick="toggleAdminProxy('${p.id}', ${!p.active})">${p.active ? 'Tắt' : 'Bật'}</button>
                <button class="btn-mini" style="width:auto; padding:2px 8px; background:rgba(239,68,68,0.2); color:#ef4444; border-color:rgba(239,68,68,0.4);" onclick="deleteAdminProxy('${p.id}', '${p.label}')">Xóa</button>
              </div>
            `}
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
    }
  });

  // Periodic account polling & live Admin table tick
  setInterval(() => {
    if (currentUser) {
      fetchAccounts();
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
