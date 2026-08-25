/**
 * ==========================================================================
 * INTERACT PLATFORM - MAIN APP CONTROLLER & SPA ROUTER
 * UI rendering, state synchronization, RBAC visibility, toasts & modals.
 * ==========================================================================
 */

class AppController {
  constructor() {
    this.currentTab = 'home';
    this.toastTimeout = null;
  }

  init() {
    console.log("🚀 Initializing Interact Club Platform...");

    // 1. Setup Navigation Event Listeners FIRST so UI is always responsive
    this.setupNavigation();

    // 2. Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        console.log("📱 PWA Service Worker registered:", reg.scope);
      }).catch(err => {
        console.warn("PWA Service Worker registration skipped:", err);
      });
    }

    // 3. Initialize sub-modules safely with error isolation
    const safeInit = (name, mgr) => {
      try {
        if (mgr && typeof mgr.init === 'function') {
          mgr.init();
        }
      } catch (err) {
        console.error(`Error initializing module [${name}]:`, err);
      }
    };

    safeInit('commissionsManager', window.commissionsManager);
    safeInit('tasksManager', window.tasksManager);
    safeInit('protocolManager', window.protocolManager);
    safeInit('aiAssistant', window.aiAssistant);
    safeInit('channelsManager', window.channelsManager);
    safeInit('calendarManager', window.calendarManager);

    // 4. Render Home, Settings and Header safely
    try { this.renderHome(); } catch(e) { console.error('Error in renderHome:', e); }
    try { this.renderSettings(); } catch(e) { console.error('Error in renderSettings:', e); }
    try { this.updateHeaderUI(); } catch(e) { console.error('Error in updateHeaderUI:', e); }

    // 5. Subscribe to DB & Auth changes for reactive state updates
    if (window.dbStore) {
      window.dbStore.subscribe(() => {
        try {
          this.renderHome();
          this.renderSettings();
          this.updateHeaderUI();
          this.updateBadges();
        } catch (e) {
          console.error('Error on DB update sync:', e);
        }
      });
    }

    if (window.authManager) {
      window.authManager.onAuthChange(() => {
        try {
          this.renderHome();
          this.renderSettings();
          this.updateHeaderUI();
          this.updateRoleGatekeeping();
        } catch (e) {
          console.error('Error on Auth change sync:', e);
        }
      });
    }

    try { this.updateBadges(); } catch (e) { console.error(e); }
    try { this.updateRoleGatekeeping(); } catch (e) { console.error(e); }
    try {
      this.populateAuthScreenClubs();
      if (!localStorage.getItem('interact_current_user_v2')) {
        this.showAuthScreen();
      } else {
        this.hideAuthScreen();
        if (window.authManager && window.authManager.isPlatformSuperAdmin()) {
          this.switchTab('superadmin');
        }
      }
    } catch (e) { console.error(e); }
  }

  setupNavigation() {
    try {
      // Attach Navigation Event Listeners (Both Mobile Bottom Bar & Desktop Sidebar)
      document.querySelectorAll('.nav-tab-btn, .sidebar-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const tab = btn.dataset.tab;
          if (tab) this.switchTab(tab);
        });
      });

      // Quick Role Pill click -> Switch to settings / role simulator
      const rolePill = document.getElementById('header-role-pill');
      if (rolePill) {
        rolePill.addEventListener('click', () => this.switchTab('settings'));
      }

      // User Avatar click -> Switch to settings
      const avatarBtn = document.getElementById('header-avatar-btn');
      if (avatarBtn) {
        avatarBtn.addEventListener('click', () => this.switchTab('settings'));
      }
    } catch (err) {
      console.error('Error setting up navigation listeners:', err);
    }
  }

  switchTab(tabName) {
    try {
      this.currentTab = tabName;

      // Update bottom nav bar & sidebar buttons
      document.querySelectorAll('.nav-tab-btn, .sidebar-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      // Update view sections
      document.querySelectorAll('.view-section').forEach(view => {
        view.classList.toggle('active', view.id === `view-${tabName}`);
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Refresh sub-views safely when focused
      try {
        if (tabName === 'tasks' && window.tasksManager) window.tasksManager.render();
        if (tabName === 'commissions' && window.commissionsManager) window.commissionsManager.render();
        if (tabName === 'protocol' && window.protocolManager) window.protocolManager.render();
        if (tabName === 'channels' && window.channelsManager) window.channelsManager.render();
        if (tabName === 'calendar' && window.calendarManager) window.calendarManager.render();
        if (tabName === 'home') this.renderHome();
        if (tabName === 'superadmin') this.renderSuperAdminDashboard();
      } catch (subErr) {
        console.error(`Error rendering active tab [${tabName}]:`, subErr);
      }
    } catch (err) {
      console.error(`Error switching to tab [${tabName}]:`, err);
    }
  }

  updateHeaderUI() {
    const user = window.authManager.getCurrentUser();
    const club = window.dbStore.getClub();

    const clubNameElem = document.getElementById('header-club-name');
    if (clubNameElem) clubNameElem.textContent = user.isSuperAdmin ? 'Plateforme Super Admin (Tous les Clubs)' : (club.info?.name || 'Interact Club');

    const rolePillElem = document.getElementById('header-role-pill');
    if (rolePillElem) {
      const roleLabel = window.ROLE_LABELS[user.role] || user.role;
      rolePillElem.innerHTML = `<span>${roleLabel}</span>`;
    }

    const avatarElem = document.getElementById('header-avatar-btn');
    if (avatarElem) {
      avatarElem.textContent = (user.displayName || 'U').charAt(0).toUpperCase();
    }
  }

  updateBadges() {
    const allTasks = window.tasksManager ? window.tasksManager.getAllTasksWithMetadata() : [];
    const overdueTasks = allTasks.filter(t => t.isOverdue);
    const urgentBadge = document.getElementById('tasks-nav-badge');
    if (urgentBadge) {
      if (overdueTasks.length > 0) {
        urgentBadge.style.display = 'flex';
        urgentBadge.textContent = overdueTasks.length;
      } else {
        urgentBadge.style.display = 'none';
      }
    }

    const club = window.dbStore.getClub();
    const activeSanctions = Object.values(club.sanctions || {}).filter(s => s.status === 'active');
    const protocolBadge = document.getElementById('protocol-nav-badge');
    if (protocolBadge) {
      if (activeSanctions.length > 0) {
        protocolBadge.style.display = 'flex';
        protocolBadge.textContent = activeSanctions.length;
      } else {
        protocolBadge.style.display = 'none';
      }
    }
  }

  updateRoleGatekeeping() {
    const user = window.authManager.getCurrentUser();
    const isSuperAdmin = window.authManager.isPlatformSuperAdmin();
    const isBrowsingClub = isSuperAdmin && !!this.activeSuperAdminBrowsingClub;

    // Club-specific navigation items are strictly hidden for Super Admin unless actively browsing a club
    document.querySelectorAll('.club-nav-item').forEach(el => {
      el.style.display = (!isSuperAdmin || isBrowsingClub) ? '' : 'none';
    });

    const canPostAnn = window.authManager.canPostAnnouncement();
    const newAnnBtn = document.getElementById('btn-new-announcement');
    if (newAnnBtn) newAnnBtn.style.display = canPostAnn ? 'inline-flex' : 'none';

    const canProt = window.authManager.canManageProtocole();
    const scanBtn = document.getElementById('btn-protocol-scan');
    const manualSncBtn = document.getElementById('btn-manual-sanction');
    if (scanBtn) scanBtn.style.display = canProt ? 'flex' : 'none';
    if (manualSncBtn) manualSncBtn.style.display = canProt ? 'inline-flex' : 'none';

    // Exclusive Super Admin Navigation Controls
    const sidebarSuperAdmin = document.getElementById('sidebar-item-superadmin');
    const bottomNavSuperAdmin = document.getElementById('bottom-nav-btn-superadmin');
    if (sidebarSuperAdmin) sidebarSuperAdmin.style.display = isSuperAdmin ? 'block' : 'none';
    if (bottomNavSuperAdmin) bottomNavSuperAdmin.style.display = isSuperAdmin ? 'flex' : 'none';

    // Pending Status Alert Banner
    const pendingBanner = document.getElementById('app-pending-status-banner');
    if (pendingBanner) {
      if (user.status === 'pending_superadmin') {
        pendingBanner.style.display = 'block';
        pendingBanner.innerHTML = `
          <div style="background:rgba(247,168,27,0.15); border:1px solid #F7A81B; padding:10px 16px; border-radius:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.8rem; color:#F7A81B; font-weight:700;">⏳ Club & Compte Président en attente d'approbation Super Admin</span>
            <button class="btn-secondary compact" style="font-size:0.72rem; padding:3px 8px;" onclick="window.app.switchTab('settings')">Détails ➔</button>
          </div>
        `;
      } else if (user.status === 'pending_president') {
        pendingBanner.style.display = 'block';
        pendingBanner.innerHTML = `
          <div style="background:rgba(0,240,255,0.12); border:1px solid var(--accent-cyan); padding:10px 16px; border-radius:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.8rem; color:var(--accent-cyan); font-weight:700;">📨 Demande d'adhésion en attente de validation par le Président</span>
            <button class="btn-secondary compact" style="font-size:0.72rem; padding:3px 8px;" onclick="window.app.switchTab('settings')">Détails ➔</button>
          </div>
        `;
      } else {
        pendingBanner.style.display = 'none';
      }
    }

    // Super Admin Active Browsing Banner
    const browsingBanner = document.getElementById('app-superadmin-browsing-banner');
    if (browsingBanner) {
      if (isSuperAdmin && this.activeSuperAdminBrowsingClub) {
        browsingBanner.style.display = 'block';
        browsingBanner.innerHTML = `
          <div style="background:rgba(247,168,27,0.15); border:1px solid #F7A81B; padding:10px 16px; border-radius:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span style="font-size:0.82rem; color:#F7A81B; font-weight:700;">
              🛡️ Mode Super Admin : Navigation dans l'espace de <strong>« ${this.activeSuperAdminBrowsingClub.name} »</strong>
            </span>
            <button class="btn-primary compact" style="font-size:0.74rem; background:linear-gradient(135deg, #003366, #001F3F); border:1px solid #F7A81B; color:#F7A81B;" onclick="window.app.handleSuperAdminExitInspection()">
              🔙 Revenir au Contrôle Super Admin
            </button>
          </div>
        `;
      } else {
        browsingBanner.style.display = 'none';
      }
    }
  }

  renderHome() {
    const club = window.dbStore.getClub();
    const members = club.members || {};
    const announcements = club.announcements || {};
    const allTasks = window.tasksManager ? window.tasksManager.getAllTasksWithMetadata() : [];

    // 1. Calculate Stats
    const totalMembers = Object.keys(members).length;
    let totalActions = 0;
    Object.values(club.commissions || {}).forEach(c => {
      totalActions += Object.keys(c.actions || {}).length;
    });
    const overdueCount = allTasks.filter(t => t.isOverdue).length;

    const statMembers = document.getElementById('stat-total-members');
    if (statMembers) statMembers.textContent = totalMembers;
    const statActions = document.getElementById('stat-total-actions');
    if (statActions) statActions.textContent = totalActions;
    const statOverdue = document.getElementById('stat-total-overdue');
    if (statOverdue) statOverdue.textContent = overdueCount;

    // 2. Render Bureau Chips
    const bureauContainer = document.getElementById('bureau-scroll-container');
    if (bureauContainer) {
      const executiveRoles = [
        window.ROLES.PRESIDENT,
        window.ROLES.VICE_PRESIDENT,
        window.ROLES.SECRETAIRE,
        window.ROLES.PROTOCOLE,
        window.ROLES.REPRESENTANT
      ];

      const bureauMembers = Object.values(members).filter(m => executiveRoles.includes(m.role));
      let bureauHtml = '';

      bureauMembers.forEach(m => {
        bureauHtml += `
          <div class="bureau-chip">
            <div class="bureau-avatar">${m.displayName.charAt(0)}</div>
            <div class="bureau-name">${m.displayName}</div>
            <div class="bureau-role">${window.ROLE_LABELS[m.role] || m.role}</div>
          </div>
        `;
      });

      bureauContainer.innerHTML = bureauHtml;
    }

    // 3. Render Announcements Feed
    const feedContainer = document.getElementById('announcements-feed-container');
    if (feedContainer) {
      const annList = Object.values(announcements).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (annList.length === 0) {
        feedContainer.innerHTML = `
          <div class="glass-card" style="text-align:center; padding: 20px;">
            <p style="color:var(--text-muted); font-size:0.85rem;">Aucune annonce officielle publiée pour le moment.</p>
          </div>
        `;
      } else {
        let feedHtml = '';
        annList.forEach(ann => {
          const dateStr = new Date(ann.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          const isUrgent = ann.category === 'urgent';

          feedHtml += `
            <div class="feed-item ${isUrgent ? 'urgent' : ''}">
              <div class="feed-top">
                <span class="feed-category ${ann.category || 'statutaire'}">${ann.category || 'Information'}</span>
                <span class="feed-time">${dateStr}</span>
              </div>
              <div class="feed-title">${ann.title}</div>
              <div class="feed-content">${ann.content}</div>
              <div class="feed-author">
                <span>📢 Publié par <strong>${ann.authorName || 'Le Bureau'}</strong></span>
              </div>
            </div>
          `;
        });
        feedContainer.innerHTML = feedHtml;
      }
    }
  }

  renderSettings() {
    const user = window.authManager.getCurrentUser();
    const club = window.dbStore.getClub();
    const members = club.members || {};

    const profileName = document.getElementById('profile-user-name');
    if (profileName) profileName.textContent = user.displayName;
    const profileRole = document.getElementById('profile-user-role');
    if (profileRole) profileRole.textContent = window.ROLE_LABELS[user.role] || user.role;
    const profileEmail = document.getElementById('profile-user-email');
    if (profileEmail) profileEmail.textContent = user.email;
    const profileStrikes = document.getElementById('profile-user-strikes');
    if (profileStrikes) profileStrikes.textContent = `${user.strikesCount || 0} Strike(s)`;

    // Multi-tenant Approval Sections
    const approvalSection = document.getElementById('settings-approval-portal');
    if (approvalSection) {
      let portalHtml = '';

      // 1. Super Admin Platform Approvals (Pending Clubs)
      if (window.authManager.isPlatformSuperAdmin()) {
        const pendingClubs = window.dbStore.getPendingClubs();
        portalHtml += `
          <div class="interact-card" style="border:1px solid #F7A81B; margin-bottom:14px; background:rgba(247, 168, 27, 0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <h4 style="color:#F7A81B; margin:0; font-size:0.95rem;">👑 Portail Super Admin : Clubs en Attente (${pendingClubs.length})</h4>
            </div>
            ${pendingClubs.length === 0 ? `
              <p style="color:var(--text-muted); font-size:0.8rem; margin:0;">Aucun nouveau club en attente de validation plateforme.</p>
            ` : `
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${pendingClubs.map(pc => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#131B2E; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
                    <div>
                      <div style="font-weight:800; color:#FFF; font-size:0.88rem;">${pc.name} (${pc.district})</div>
                      <div style="font-size:0.74rem; color:var(--text-muted);">Président : ${pc.presidentName} (${pc.presidentEmail})</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button class="btn-primary" style="padding:4px 10px; font-size:0.72rem; background:linear-gradient(135deg, #34C759, #28A745);" onclick="window.app.handleSuperAdminApproveClub('${pc.id}')">
                        ✓ Activer Club
                      </button>
                      <button class="btn-secondary compact" style="padding:4px 8px; font-size:0.72rem; color:#FF3B30;" onclick="window.app.handleSuperAdminRejectClub('${pc.id}')">
                        ✕ Rejeter
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        `;
      }

      // 2. President Club Member Approvals
      if (user.role === 'president' || user.role === 'vice_president' || user.role === 'secretaire') {
        const pendingMembers = window.dbStore.getPendingMembers(user.clubId);
        if (pendingMembers.length > 0) {
          portalHtml += `
            <div class="interact-card" style="border:1px solid var(--accent-cyan); margin-bottom:14px; background:rgba(0, 240, 255, 0.08);">
              <h4 style="color:var(--accent-cyan); margin:0 0 8px 0; font-size:0.95rem;">👥 Demandes d'adhésion au Club (${pendingMembers.length})</h4>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${pendingMembers.map(pm => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#131B2E; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
                    <div>
                      <div style="font-weight:800; color:#FFF; font-size:0.88rem;">${pm.displayName}</div>
                      <div style="font-size:0.74rem; color:var(--text-muted);">${pm.email} ${pm.phoneNumber ? `• 📞 ${pm.phoneNumber}` : ''}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button class="btn-primary" style="padding:4px 10px; font-size:0.72rem; background:linear-gradient(135deg, #34C759, #28A745);" onclick="window.app.handlePresidentApproveMember('${pm.id}')">
                        ✓ Accepter Membre
                      </button>
                      <button class="btn-secondary compact" style="padding:4px 8px; font-size:0.72rem; color:#FF3B30;" onclick="window.app.handlePresidentRejectMember('${pm.id}')">
                        ✕ Rejeter
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      }

      approvalSection.innerHTML = portalHtml;
    }

    // Role Switcher Select
    const switcher = document.getElementById('role-switcher-select');
    if (switcher) {
      let options = '';
      Object.values(members).forEach(m => {
        const isSelected = m.id === user.id ? 'selected' : '';
        options += `<option value="${m.id}" ${isSelected}>${m.displayName} — ${window.ROLE_LABELS[m.role] || m.role}</option>`;
      });
      switcher.innerHTML = options;
    }

    // Custom API Key field
    const apiKeyInput = document.getElementById('settings-gemini-key');
    if (apiKeyInput && window.aiAssistant) {
      apiKeyInput.value = window.aiAssistant.apiKey || '';
    }
  }

  /* ================= FULLSCREEN AUTH SCREEN OVERLAY METHODS ================= */
  showAuthScreen(defaultTab = 'login') {
    const overlay = document.getElementById('auth-screen-overlay');
    if (overlay) {
      this.populateAuthScreenClubs();
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      this.switchAuthOverlayTab(defaultTab);
    }
  }

  hideAuthScreen() {
    const overlay = document.getElementById('auth-screen-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
  }

  populateAuthScreenClubs() {
    const clubs = window.dbStore ? window.dbStore.getActiveClubs() : [];
    let optionsHtml = '';
    clubs.forEach(c => {
      optionsHtml += `<option value="${c.id}">🏛️ ${c.name} (${c.district})</option>`;
    });
    if (!optionsHtml) {
      optionsHtml = '<option value="club_carthage_01">🏛️ Interact Club Carthage (District 9010)</option>';
    }

    const loginSelect = document.getElementById('auth-screen-club-select');
    const regSelect = document.getElementById('auth-reg-club-select');
    if (loginSelect) loginSelect.innerHTML = optionsHtml;
    if (regSelect) regSelect.innerHTML = optionsHtml;
  }

  switchAuthOverlayTab(tab) {
    const loginSection = document.getElementById('auth-overlay-login-section');
    const registerSection = document.getElementById('auth-overlay-register-section');
    const btnLogin = document.getElementById('auth-tab-btn-login');
    const btnRegister = document.getElementById('auth-tab-btn-register');

    if (tab === 'login') {
      if (loginSection) loginSection.style.display = 'block';
      if (registerSection) registerSection.style.display = 'none';
      if (btnLogin) btnLogin.classList.add('active');
      if (btnRegister) btnRegister.classList.remove('active');
    } else {
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'block';
      if (btnLogin) btnLogin.classList.remove('active');
      if (btnRegister) btnRegister.classList.add('active');
    }
  }

  quickFillSuperAdmin() {
    const emailInput = document.getElementById('auth-screen-email');
    const passInput = document.getElementById('auth-screen-password');
    if (emailInput) emailInput.value = 'ahmedazzouzi72@gmail.com';
    if (passInput) passInput.value = 'ADMIN2027';
    this.checkSuperAdminLoginEmail('ahmedazzouzi72@gmail.com');
  }

  quickFillPresident() {
    const emailInput = document.getElementById('auth-screen-email');
    const passInput = document.getElementById('auth-screen-password');
    const clubSelect = document.getElementById('auth-screen-club-select');
    if (emailInput) emailInput.value = 'president@interact-carthage.org';
    if (passInput) passInput.value = 'CARTHAGE2026';
    if (clubSelect) clubSelect.value = 'club_carthage_01';
    this.checkSuperAdminLoginEmail('president@interact-carthage.org');
  }

  handleAuthOverlayLogin(event) {
    event.preventDefault();
    const email = document.getElementById('auth-screen-email').value.trim();
    const password = document.getElementById('auth-screen-password').value;
    const clubSelect = document.getElementById('auth-screen-club-select');
    const clubId = clubSelect ? clubSelect.value : null;

    const res = window.authManager.login(email, password, clubId);
    if (res.success) {
      this.hideAuthScreen();
      this.showToast(`Connexion réussie : Bienvenue ${res.user.displayName} ! 👑`, 'success');
      this.updateHeaderUI();
      this.updateRoleGatekeeping();
      if (window.authManager.isPlatformSuperAdmin()) {
        this.activeSuperAdminBrowsingClub = null;
        this.switchTab('superadmin');
        this.renderSuperAdminDashboard();
      } else {
        this.switchTab('home');
        this.renderHome();
      }
      this.renderSettings();
    } else {
      this.showToast(res.message || 'Échec de connexion.', 'error');
    }
  }

  handleOverlayRoleChange(role) {
    const toggleBox = document.getElementById('auth-overlay-pres-toggle');
    if (toggleBox) {
      if (role === 'president') {
        toggleBox.style.display = 'block';
      } else {
        toggleBox.style.display = 'none';
        this.toggleOverlayClubCreation(false);
      }
    }
  }

  toggleOverlayClubCreation(isCreate) {
    const joinBox = document.getElementById('auth-overlay-join-box');
    const createBox = document.getElementById('auth-overlay-create-box');
    const btnJoin = document.getElementById('btn-overlay-join-choice');
    const btnCreate = document.getElementById('btn-overlay-create-choice');

    if (isCreate) {
      if (joinBox) joinBox.style.display = 'none';
      if (createBox) createBox.style.display = 'block';
      if (btnJoin) btnJoin.classList.remove('active');
      if (btnCreate) btnCreate.classList.add('active');
    } else {
      if (joinBox) joinBox.style.display = 'block';
      if (createBox) createBox.style.display = 'none';
      if (btnJoin) btnJoin.classList.add('active');
      if (btnCreate) btnCreate.classList.remove('active');
    }
  }

  handleAuthOverlayRegister(event) {
    event.preventDefault();
    const displayName = document.getElementById('auth-reg-name').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const password = document.getElementById('auth-reg-password').value;
    const phoneNumber = document.getElementById('auth-reg-phone').value.trim();
    const birthDate = document.getElementById('auth-reg-birth').value;
    const requestedRole = document.getElementById('auth-reg-role-select').value;

    const isCreatingClub = requestedRole === 'president' && 
      document.getElementById('auth-overlay-create-box') && 
      document.getElementById('auth-overlay-create-box').style.display !== 'none';

    if (isCreatingClub) {
      const clubName = document.getElementById('auth-reg-new-clubname').value.trim();
      const district = document.getElementById('auth-reg-new-district').value.trim();
      const city = document.getElementById('auth-reg-new-city').value.trim();

      if (!clubName) {
        this.showToast('Veuillez renseigner le nom de votre club.', 'error');
        return;
      }

      window.authManager.registerPresidentWithClub(
        { displayName, email, password, phoneNumber, birthDate },
        { name: clubName, district, city }
      );

      this.hideAuthScreen();
      this.showToast(`Club "${clubName}" créé ! Bienvenue Président ${displayName} 👑`, 'success');
    } else {
      const clubId = document.getElementById('auth-reg-club-select').value;
      window.authManager.registerMemberJoiningClub({
        displayName,
        email,
        password,
        phoneNumber,
        birthDate,
        clubId,
        requestedRole
      });

      this.hideAuthScreen();
      this.showToast('Demande transmise au Président ! Statut : En attente de validation ⏳', 'warning');
    }

    this.renderHome();
    this.renderSettings();
    this.updateHeaderUI();
    this.updateRoleGatekeeping();
  }

  /* ================= MULTI-TENANT AUTH & REGISTRATION MODALS ================= */
  openLoginModal() {
    const activeClubs = window.dbStore ? window.dbStore.getActiveClubs() : [];
    let clubOptions = '';
    activeClubs.forEach(c => {
      clubOptions += `<option value="${c.id}">🏛️ ${c.name} (${c.district})</option>`;
    });

    const modalBody = `
      <form id="form-app-login" onsubmit="window.app.handleLoginSubmit(event)">
        <div class="form-group">
          <label class="form-label">Adresse E-mail *</label>
          <input 
            type="email" 
            name="email" 
            id="login-input-email" 
            class="form-input" 
            placeholder="president@interact.org" 
            required 
            oninput="window.app.checkSuperAdminLoginEmail(this.value)"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Mot de passe *</label>
          <input type="password" name="password" class="form-input" placeholder="••••••••" required />
        </div>

        <!-- Super Admin Bypass Notification -->
        <div id="login-superadmin-badge" style="display:none; background:rgba(247,168,27,0.12); border:1px solid #F7A81B; color:#F7A81B; padding:10px 14px; border-radius:10px; font-size:0.78rem; margin-bottom:12px;">
          🛡️ <strong>Accès Super Admin Global Détecté :</strong> Bypass automatique du sélecteur de club (Accès direct à la plateforme).
        </div>

        <!-- Standard Club Selector -->
        <div class="form-group" id="login-club-selector-group">
          <label class="form-label">Sélectionnez votre Club Interact *</label>
          <select name="clubId" class="form-select">
            ${clubOptions || '<option value="club_carthage_01">🏛️ Interact Club Carthage (District 9010)</option>'}
          </select>
        </div>

        <button type="submit" class="btn-primary" style="width:100%; margin-top:8px;">
          🔐 Se Connecter à mon Espace
        </button>

        <div style="margin-top:12px; text-align:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
          <button 
            type="button" 
            style="background:none; border:none; color:#F7A81B; font-size:0.74rem; font-weight:700; cursor:pointer; text-decoration:underline;"
            onclick="document.getElementById('login-input-email').value='ahmedazzouzi72@gmail.com'; window.app.checkSuperAdminLoginEmail('ahmedazzouzi72@gmail.com');"
          >
            ⚡ Remplir Super Admin (ahmedazzouzi72@gmail.com)
          </button>
        </div>
      </form>
    `;

    this.openModal('🔑 Connexion Multi-Clubs Interact', modalBody);
  }

  checkSuperAdminLoginEmail(email) {
    const isSuperAdmin = email.trim().toLowerCase() === 'ahmedazzouzi72@gmail.com';
    const badge = document.getElementById('login-superadmin-badge');
    const clubGroup = document.getElementById('login-club-selector-group');

    if (badge && clubGroup) {
      if (isSuperAdmin) {
        badge.style.display = 'block';
        clubGroup.style.display = 'none';
      } else {
        badge.style.display = 'none';
        clubGroup.style.display = 'block';
      }
    }
  }

  handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const clubId = form.clubId ? form.clubId.value : null;

    const res = window.authManager.login(email, password, clubId);
    if (res.success) {
      this.closeModal();
      this.showToast(`Connexion réussie : Bienvenue ${res.user.displayName} !`, 'success');
      this.renderHome();
      this.renderSettings();
      this.updateHeaderUI();
      this.updateRoleGatekeeping();
    } else {
      this.showToast(res.message || 'Échec de connexion.', 'error');
    }
  }

  openRegistrationModal() {
    const activeClubs = window.dbStore ? window.dbStore.getActiveClubs() : [];
    let clubOptions = '';
    activeClubs.forEach(c => {
      clubOptions += `<option value="${c.id}">🏛️ ${c.name} (${c.district})</option>`;
    });

    const modalBody = `
      <form id="form-app-registration" onsubmit="window.app.handleRegistrationSubmit(event)">
        <h4 style="color:#F7A81B; margin:0 0 8px 0; font-size:0.82rem; text-transform:uppercase;">1. Informations Personnelles</h4>

        <div class="form-group">
          <label class="form-label">Nom et Prénom *</label>
          <input type="text" name="displayName" class="form-input" placeholder="Ex: Youssef Mahjoub" required />
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label class="form-label">Adresse Email *</label>
            <input type="email" name="email" class="form-input" placeholder="contact@interact.org" required />
          </div>
          <div class="form-group">
            <label class="form-label">Mot de passe *</label>
            <input type="password" name="password" class="form-input" placeholder="••••••••" required />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label class="form-label">Téléphone / WhatsApp</label>
            <input type="tel" name="phoneNumber" class="form-input" placeholder="+216 98 123 456" />
          </div>
          <div class="form-group">
            <label class="form-label">Date de Naissance</label>
            <input type="date" name="birthDate" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Poste Souhaité *</label>
          <select name="requestedRole" id="reg-select-role" class="form-select" onchange="window.app.handleRoleChangeInRegistration(this.value)">
            <option value="membre">🔹 Membre Actif</option>
            <option value="recrue">🌱 Recrue / Nouvel Adhérent</option>
            <option value="chef_commission">💼 Chef de Commission</option>
            <option value="co_chef">🤝 Co-Chef</option>
            <option value="secretaire">📋 Secrétaire</option>
            <option value="protocole">⚖️ Protocole</option>
            <option value="vice_president">⭐ Vice-Président</option>
            <option value="president">👑 Président (Créateur ou Adhérent)</option>
          </select>
        </div>

        <h4 style="color:#F7A81B; margin:12px 0 8px 0; font-size:0.82rem; text-transform:uppercase;">2. Rattachement au Club</h4>

        <!-- Option Toggle (Only visible if role is President) -->
        <div id="reg-president-toggle-box" style="display:none; background:#0E172A; padding:6px; border-radius:10px; margin-bottom:10px; border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; gap:6px;">
            <button type="button" class="cal-view-btn active" id="btn-choice-join" style="flex:1;" onclick="window.app.toggleClubCreationChoice(false)">
              🏛️ Rejoindre un Club
            </button>
            <button type="button" class="cal-view-btn" id="btn-choice-create" style="flex:1;" onclick="window.app.toggleClubCreationChoice(true)">
              ✨ Créer un nouveau Club
            </button>
          </div>
        </div>

        <!-- Section A: Join Existing Club -->
        <div id="reg-section-join-club">
          <div class="form-group">
            <label class="form-label">Sélectionnez le Club Interact *</label>
            <select name="clubId" class="form-select">
              ${clubOptions || '<option value="club_carthage_01">🏛️ Interact Club Carthage (District 9010)</option>'}
            </select>
          </div>
          <p style="font-size:0.74rem; color:var(--text-muted); margin:4px 0 12px 0;">
            ℹ️ Votre compte sera placé en attente jusqu'à approbation par le Président du club sélectionné.
          </p>
        </div>

        <!-- Section B: Create New Club (President) -->
        <div id="reg-section-create-club" style="display:none; background:#0B1220; padding:12px; border-radius:12px; border:1px solid rgba(247,168,27,0.25); margin-bottom:12px;">
          <div class="form-group">
            <label class="form-label">Nom Officiel du Club *</label>
            <input type="text" name="clubName" class="form-input" placeholder="Ex: Interact Club La Marsa" />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div class="form-group">
              <label class="form-label">District Rotary</label>
              <input type="text" name="district" class="form-input" value="District 9010" />
            </div>
            <div class="form-group">
              <label class="form-label">Ville</label>
              <input type="text" name="city" class="form-input" placeholder="Ex: Tunis" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Rotary Club Parrain</label>
            <input type="text" name="sponsorRotaryClub" class="form-input" placeholder="Rotary Club La Marsa" />
          </div>
          <div class="form-group">
            <label class="form-label">Devise / Description</label>
            <textarea name="description" class="form-input" style="height:50px; resize:vertical;" placeholder="Servir d'abord • Objectifs..."></textarea>
          </div>
          <div style="font-size:0.75rem; color:#34C759; background:rgba(52,199,89,0.12); padding:8px 10px; border-radius:8px;">
            👑 <strong>Accès Immédiat :</strong> En tant que Président Fondateur, vous accéderez instantanément à votre espace club.
          </div>
        </div>

        <button type="submit" class="btn-primary" style="width:100%; margin-top:8px;">
          🚀 Enregistrer & Continuer
        </button>
      </form>
    `;

    this.openModal('📝 Inscription Multi-Clubs Interact', modalBody);
  }

  handleRoleChangeInRegistration(role) {
    const toggleBox = document.getElementById('reg-president-toggle-box');
    if (toggleBox) {
      if (role === 'president') {
        toggleBox.style.display = 'block';
      } else {
        toggleBox.style.display = 'none';
        this.toggleClubCreationChoice(false);
      }
    }
  }

  toggleClubCreationChoice(isCreate) {
    const joinSection = document.getElementById('reg-section-join-club');
    const createSection = document.getElementById('reg-section-create-club');
    const btnJoin = document.getElementById('btn-choice-join');
    const btnCreate = document.getElementById('btn-choice-create');

    if (isCreate) {
      if (joinSection) joinSection.style.display = 'none';
      if (createSection) createSection.style.display = 'block';
      if (btnJoin) btnJoin.classList.remove('active');
      if (btnCreate) btnCreate.classList.add('active');
    } else {
      if (joinSection) joinSection.style.display = 'block';
      if (createSection) createSection.style.display = 'none';
      if (btnJoin) btnJoin.classList.add('active');
      if (btnCreate) btnCreate.classList.remove('active');
    }
  }

  handleRegistrationSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const displayName = form.displayName.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const phoneNumber = form.phoneNumber.value.trim();
    const birthDate = form.birthDate.value;
    const requestedRole = form.requestedRole.value;

    const isCreatingClub = requestedRole === 'president' && 
      document.getElementById('reg-section-create-club') && 
      document.getElementById('reg-section-create-club').style.display !== 'none';

    if (isCreatingClub) {
      const clubName = form.clubName.value.trim();
      const district = form.district.value.trim();
      const city = form.city.value.trim();
      const sponsorRotaryClub = form.sponsorRotaryClub.value.trim();
      const description = form.description.value.trim();

      if (!clubName) {
        this.showToast('Veuillez renseigner le nom officiel de votre club.', 'error');
        return;
      }

      window.authManager.registerPresidentWithClub(
        { displayName, email, password, phoneNumber, birthDate },
        { name: clubName, district, city, sponsorRotaryClub, description }
      );

      this.closeModal();
      this.showToast(`Club "${clubName}" créé ! Bienvenue Président ${displayName} 👑`, 'success');
    } else {
      const clubId = form.clubId.value;
      window.authManager.registerMemberJoiningClub({
        displayName,
        email,
        password,
        phoneNumber,
        birthDate,
        clubId,
        requestedRole
      });

      this.closeModal();
      this.showToast('Demande transmise au Président du club ! Statut : En attente de validation ⏳', 'warning');
    }

    this.renderHome();
    this.renderSettings();
    this.updateHeaderUI();
    this.updateRoleGatekeeping();
  }

  /* ================= SUPER ADMIN PLATFORM DASHBOARD & CLUB MANAGEMENT ================= */
  renderSuperAdminDashboard() {
    const container = document.getElementById('view-superadmin');
    if (!container) return;

    if (!window.authManager.isPlatformSuperAdmin()) {
      container.innerHTML = `
        <div class="interact-card" style="border:1px solid var(--urgent-red); text-align:center; padding:30px;">
          <h3 style="color:var(--urgent-red);">🚫 Accès Réservé au Super Admin</h3>
          <p style="color:var(--text-muted); font-size:0.85rem;">Seul le Super Admin Global de la plateforme (ahmedazzouzi72@gmail.com) peut accéder à cette vue de supervision.</p>
        </div>
      `;
      return;
    }

    const clubs = window.dbStore ? window.dbStore.getAllClubs() : [];
    const totalClubs = clubs.length;
    const activeClubs = clubs.filter(c => c.status === 'active').length;
    const pendingClubs = clubs.filter(c => c.status === 'pending_superadmin' || c.status === 'pending_validation').length;
    const suspendedClubs = clubs.filter(c => c.status === 'suspended').length;
    
    let totalPlatformUsers = 0;
    const clubsWithCounts = clubs.map(c => {
      const count = window.dbStore.getClubMembersCount(c.id);
      totalPlatformUsers += count;
      return { ...c, membersCount: count };
    });

    container.innerHTML = `
      <!-- Super Admin Hero Banner -->
      <div class="interact-card gold-border" style="margin-bottom:16px; background:linear-gradient(135deg, rgba(0,51,102,0.6), rgba(10,18,36,0.9));">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:48px; height:48px; border-radius:12px; background:#003366; border:2px solid var(--interact-gold); display:flex; align-items:center; justify-content:center; font-size:1.6rem;">
              🛡️
            </div>
            <div>
              <h2 style="color:#FFF; font-size:1.25rem; font-weight:800; margin:0;">Supervision Multi-Clubs Plateforme</h2>
              <p style="color:var(--text-muted); font-size:0.78rem; margin:2px 0 0 0;">Super Admin Global : ahmedazzouzi72@gmail.com</p>
            </div>
          </div>
          <button class="btn-primary" onclick="window.app.openRegistrationModal()" style="font-size:0.8rem; padding:8px 14px;">
            ➕ Déclarer / Créer un Club
          </button>
        </div>

        <!-- Global Platform KPIs -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-top:16px;">
          <div style="background:#0E172A; border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:10px; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Clubs</span>
            <div style="font-size:1.5rem; font-weight:800; color:var(--interact-gold);">${totalClubs}</div>
          </div>
          <div style="background:#0E172A; border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:10px; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Clubs Actifs</span>
            <div style="font-size:1.5rem; font-weight:800; color:var(--success-green);">${activeClubs}</div>
          </div>
          <div style="background:#0E172A; border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:10px; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">En Attente</span>
            <div style="font-size:1.5rem; font-weight:800; color:var(--warning-orange);">${pendingClubs}</div>
          </div>
          <div style="background:#0E172A; border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:10px; text-align:center;">
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Comptes</span>
            <div style="font-size:1.5rem; font-weight:800; color:var(--neon-cyan);">${totalPlatformUsers}</div>
          </div>
        </div>
      </div>

      <!-- Clubs Registry List -->
      <div class="section-header">
        <span class="section-title">🏛️ Registre des Clubs & Nombre de Comptes</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;" id="superadmin-clubs-list-container">
        ${clubsWithCounts.map(club => {
          const isActive = club.status === 'active';
          const isPending = club.status === 'pending_superadmin' || club.status === 'pending_validation';
          const isSuspended = club.status === 'suspended';

          return `
            <div class="interact-card" style="border-color:${isPending ? '#F7A81B' : isSuspended ? '#FF3B30' : 'rgba(255,255,255,0.08)'};">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                <div>
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <h3 style="font-size:1.05rem; font-weight:800; color:#FFF; margin:0;">${club.name}</h3>
                    <span class="header-badge" style="${isActive ? 'background:rgba(52,199,89,0.15); color:var(--success-green); border-color:rgba(52,199,89,0.4);' : isPending ? 'background:rgba(247,168,27,0.15); color:var(--interact-gold); border-color:rgba(247,168,27,0.4);' : 'background:rgba(255,59,48,0.15); color:var(--urgent-red); border-color:rgba(255,59,48,0.4);'}">
                      ${isActive ? '✓ ACTIF' : isPending ? '⏳ EN ATTENTE' : '🚫 SUSPENDU'}
                    </span>
                  </div>
                  <p style="font-size:0.76rem; color:var(--text-muted); margin:0;">
                    District : <strong>${club.district || 'District 9010'}</strong> • Parrain : <strong>${club.sponsorRotaryClub || 'Rotary International'}</strong>
                  </p>
                  <p style="font-size:0.76rem; color:var(--interact-gold); margin:2px 0 0 0;">
                    👑 Président : ${club.presidentName || 'Non assigné'} (${club.presidentEmail || 'N/A'})
                  </p>
                </div>

                <div style="background:#0B1220; border:1px solid rgba(0,240,255,0.3); border-radius:10px; padding:6px 14px; text-align:center;">
                  <span style="font-size:1.15rem; font-weight:800; color:var(--neon-cyan); display:block;">${club.membersCount}</span>
                  <span style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Comptes</span>
                </div>
              </div>

              <!-- Super Admin Action Bar -->
              <div style="display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; flex-wrap:wrap;">
                <button class="btn-primary compact" style="background:linear-gradient(135deg, #003366, #001F3F); border:1px solid var(--interact-gold); color:var(--interact-gold); font-weight:800;" onclick="window.app.handleSuperAdminEnterClub('${club.id}')">
                  🚀 Entrer dans ce Club ➔
                </button>

                <button class="btn-secondary compact" style="color:var(--accent-cyan); border-color:rgba(0,240,255,0.4);" onclick="window.app.openSuperAdminClubMembersModal('${club.id}')">
                  👥 Gérer Comptes (${club.membersCount})
                </button>

                ${isPending || isSuspended ? `
                  <button class="btn-primary compact" style="background:linear-gradient(135deg, #34C759, #28A745);" onclick="window.app.handleSuperAdminApproveClub('${club.id}')">
                    ✓ Activer le Club
                  </button>
                ` : `
                  <button class="btn-secondary compact" style="color:#FF9500; border-color:#FF9500;" onclick="window.app.handleSuperAdminSuspendClub('${club.id}')">
                    ⏸️ Suspendre
                  </button>
                `}

                <button class="btn-secondary compact" style="color:#FF3B30; border-color:rgba(255,59,48,0.4);" onclick="window.app.handleSuperAdminDeleteClub('${club.id}', '${club.name}')">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  handleSuperAdminEnterClub(clubId) {
    const club = window.dbStore.getClub(clubId);
    if (!club) return;

    window.dbStore.setActiveClub(clubId);
    this.activeSuperAdminBrowsingClub = club.info;
    this.showToast(`Mode Super Admin : Accès à "${club.info.name}" activé ! 🚀`, 'success');
    this.switchTab('home');
    this.renderHome();
    this.renderSettings();
    this.updateHeaderUI();
    this.updateRoleGatekeeping();
  }

  handleSuperAdminExitInspection() {
    this.activeSuperAdminBrowsingClub = null;
    this.showToast('Retour au Portail Super Admin Plateforme. 🛡️', 'info');
    this.switchTab('superadmin');
    this.renderSuperAdminDashboard();
    this.renderSettings();
    this.updateHeaderUI();
    this.updateRoleGatekeeping();
  }

  handleSuperAdminApproveClub(clubId) {
    window.dbStore.approveClub(clubId);
    this.showToast('Club activé sur la plateforme avec succès ! 👑', 'success');
    this.renderSuperAdminDashboard();
    this.renderSettings();
  }

  handleSuperAdminSuspendClub(clubId) {
    window.dbStore.suspendClub(clubId);
    this.showToast('Club suspendu temporairement. ⏸️', 'warning');
    this.renderSuperAdminDashboard();
  }

  handleSuperAdminDeleteClub(clubId, clubName = 'ce club') {
    if (confirm(`Êtes-vous certain de vouloir SUPPRIMER DÉFINITIVEMENT le club "${clubName}" ainsi que l'ensemble de ses comptes membres ?`)) {
      window.dbStore.deleteClub(clubId);
      this.showToast(`Club "${clubName}" supprimé avec succès.`, 'error');
      this.renderSuperAdminDashboard();
      this.renderSettings();
    }
  }

  openSuperAdminClubMembersModal(clubId) {
    const club = window.dbStore.getClub(clubId);
    const members = window.dbStore.getClubMembersList(clubId);

    const modalBody = `
      <div style="margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08);">
        <h4 style="margin:0; color:#FFF; font-size:0.95rem;">Comptes Membres : ${club.info?.name || 'Club'}</h4>
        <span style="font-size:0.75rem; color:var(--text-muted);">${members.length} compte(s) enregistré(s)</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto;">
        ${members.length === 0 ? `
          <p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">Aucun membre enregistré dans ce club.</p>
        ` : members.map(m => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:#0B1220; padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
            <div>
              <div style="font-weight:700; color:#FFF; font-size:0.88rem;">
                ${m.displayName}
                <span class="header-badge" style="font-size:0.68rem; margin-left:6px; background:rgba(247,168,27,0.1); color:var(--interact-gold); border-color:rgba(247,168,27,0.3);">
                  ${window.ROLE_LABELS[m.role] || m.role}
                </span>
              </div>
              <div style="font-size:0.74rem; color:var(--text-muted); margin-top:2px;">
                ${m.email} ${m.phoneNumber ? `• 📞 ${m.phoneNumber}` : ''} • Statut : <strong style="color:${m.status === 'active' ? '#34C759' : '#FF9500'}">${m.status || 'active'}</strong>
              </div>
            </div>

            <div style="display:flex; gap:6px;">
              ${m.status === 'active' ? `
                <button class="btn-secondary compact" style="font-size:0.72rem; color:#FF9500; border-color:#FF9500;" onclick="window.app.handleSuperAdminToggleUserStatus('${m.id}', '${clubId}', 'suspended')">
                  Suspendre
                </button>
              ` : `
                <button class="btn-primary compact" style="font-size:0.72rem; background:linear-gradient(135deg, #34C759, #28A745);" onclick="window.app.handleSuperAdminToggleUserStatus('${m.id}', '${clubId}', 'active')">
                  Activer
                </button>
              `}

              <button class="btn-secondary compact" style="font-size:0.72rem; color:#FF3B30; border-color:rgba(255,59,48,0.4);" onclick="window.app.handleSuperAdminDeleteUser('${m.id}', '${clubId}', '${m.displayName}')">
                🗑️
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.openModal(`👥 Gestion des Comptes — ${club.info?.name || 'Club'}`, modalBody);
  }

  handleSuperAdminToggleUserStatus(userId, clubId, newStatus) {
    window.dbStore.toggleMemberStatus(userId, clubId, newStatus);
    this.showToast(`Statut du compte mis à jour (${newStatus}) !`, 'success');
    this.openSuperAdminClubMembersModal(clubId);
    this.renderSuperAdminDashboard();
  }

  handleSuperAdminDeleteUser(userId, clubId, userName = 'ce membre') {
    if (confirm(`Supprimer définitivement le compte de ${userName} ?`)) {
      window.dbStore.deleteMemberFromClub(userId, clubId);
      this.showToast(`Compte de ${userName} supprimé.`, 'error');
      this.openSuperAdminClubMembersModal(clubId);
      this.renderSuperAdminDashboard();
    }
  }

  handleSuperAdminRejectClub(clubId) {
    window.dbStore.rejectClub(clubId);
    this.showToast('Création de club rejetée.', 'error');
    this.renderSuperAdminDashboard();
    this.renderSettings();
  }

  handlePresidentApproveMember(userId) {
    const user = window.authManager.getCurrentUser();
    window.dbStore.approveMember(userId, user.clubId);
    this.showToast('Membre validé et activé au sein du club ! ✓', 'success');
    this.renderSettings();
  }

  handlePresidentRejectMember(userId) {
    const user = window.authManager.getCurrentUser();
    window.dbStore.rejectMember(userId, user.clubId);
    this.showToast('Demande d\'adhésion refusée.', 'error');
    this.renderSettings();
  }

  openNewAnnouncementModal() {
    const modalBody = `
      <form id="form-new-announcement" onsubmit="window.app.handleCreateAnnouncement(event)">
        <div class="form-group">
          <label class="form-label">Titre de l'annonce *</label>
          <input type="text" name="title" class="form-input" placeholder="Ex: Réunion statutaire, Urgence logistique..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Catégorie</label>
          <select name="category" class="form-select">
            <option value="statutaire">🏛️ Statutaire (Réunions, Bureau)</option>
            <option value="action">🎯 Action & Événement</option>
            <option value="urgent">🔥 Urgente / Critique</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Contenu du message *</label>
          <textarea name="content" class="form-textarea" style="min-height:120px;" placeholder="Rédigez l'annonce officielle destinée aux membres du club..." required></textarea>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:10px;">📢 Publier l'Annonce</button>
      </form>
    `;
    this.openModal('📢 Publier une Annonce Officielle', modalBody);
  }

  handleCreateAnnouncement(event) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value.trim();
    const category = form.category.value;
    const content = form.content.value.trim();
    const currentUser = window.authManager.getCurrentUser();

    if (!title || !content) {
      this.showToast('Veuillez remplir tous les champs.', 'error');
      return;
    }

    window.dbStore.addAnnouncement(
      title,
      content,
      category,
      currentUser.id,
      `${currentUser.displayName} (${window.ROLE_LABELS[currentUser.role] || currentUser.role})`
    );

    this.closeModal();
    this.showToast('Annonce publiée instantanément ! 📣', 'success');
  }

  handleRoleSwitch(userId) {
    const success = window.authManager.switchUser(userId);
    if (success) {
      const user = window.authManager.getCurrentUser();
      this.showToast(`Session basculée sur : ${user.displayName} (${window.ROLE_LABELS[user.role] || user.role})`, 'success');
    }
  }

  handleSaveApiKey() {
    const input = document.getElementById('settings-gemini-key');
    if (input && window.aiAssistant) {
      const key = input.value.trim();
      window.aiAssistant.saveApiKey(key);
      this.showToast('Clé API Gemini sauvegardée !', 'success');
    }
  }

  handleResetData() {
    if (confirm("Réinitialiser toutes les données de démonstration du club ?")) {
      window.dbStore.resetToDefault();
      this.showToast('Données réinitialisées aux valeurs initiales.', 'warning');
    }
  }

  /* ================= MODAL SYSTEM ================= */
  openModal(title, contentHtml) {
    const backdrop = document.getElementById('global-modal-backdrop');
    const titleElem = document.getElementById('global-modal-title');
    const bodyElem = document.getElementById('global-modal-body');

    if (titleElem) titleElem.innerHTML = title;
    if (bodyElem) bodyElem.innerHTML = contentHtml;
    if (backdrop) backdrop.classList.add('active');
  }

  closeModal() {
    const backdrop = document.getElementById('global-modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  /* ================= TOAST NOTIFICATION SYSTEM ================= */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '🚨';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3800);
  }
}

// Instantiate global app controller
const app = new AppController();
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
