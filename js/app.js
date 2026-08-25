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

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        console.log("📱 PWA Service Worker registered:", reg.scope);
      }).catch(err => {
        console.warn("PWA Service Worker registration skipped:", err);
      });
    }

    // Initialize sub-modules safely
    const safeInit = (name, mgr) => {
      try {
        if (mgr && typeof mgr.init === 'function') mgr.init();
      } catch (err) {
        console.error(`Error initializing ${name}:`, err);
      }
    };

    safeInit('commissionsManager', window.commissionsManager);
    safeInit('tasksManager', window.tasksManager);
    safeInit('protocolManager', window.protocolManager);
    safeInit('aiAssistant', window.aiAssistant);
    safeInit('channelsManager', window.channelsManager);
    safeInit('calendarManager', window.calendarManager);

    // Render Home & Settings safely
    try { this.renderHome(); } catch(e) { console.error('Error in renderHome:', e); }
    try { this.renderSettings(); } catch(e) { console.error('Error in renderSettings:', e); }
    try { this.updateHeaderUI(); } catch(e) { console.error('Error in updateHeaderUI:', e); }

    // Attach Navigation Event Listeners (Both Mobile Bottom Bar & Desktop Sidebar)
    document.querySelectorAll('.nav-tab-btn, .sidebar-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Subscribe to DB & Auth changes for automatic updates
    if (window.dbStore) {
      window.dbStore.subscribe(() => {
        this.renderHome();
        this.renderSettings();
        this.updateHeaderUI();
        this.updateBadges();
      });
    }

    if (window.authManager) {
      window.authManager.onAuthChange(() => {
        this.renderHome();
        this.renderSettings();
        this.updateHeaderUI();
        this.updateRoleGatekeeping();
      });
    }

    this.updateBadges();
    this.updateRoleGatekeeping();
  }

  switchTab(tabName) {
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

    // Refresh sub-views when focused
    if (tabName === 'tasks' && window.tasksManager) window.tasksManager.render();
    if (tabName === 'commissions' && window.commissionsManager) window.commissionsManager.render();
    if (tabName === 'protocol' && window.protocolManager) window.protocolManager.render();
    if (tabName === 'channels' && window.channelsManager) window.channelsManager.render();
    if (tabName === 'calendar' && window.calendarManager) window.calendarManager.render();
  }

  updateHeaderUI() {
    const user = window.authManager.getCurrentUser();
    const club = window.dbStore.getClub();

    const clubNameElem = document.getElementById('header-club-name');
    if (clubNameElem) clubNameElem.textContent = club.info?.name || 'Interact Club';

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
    const canPostAnn = window.authManager.canPostAnnouncement();
    const newAnnBtn = document.getElementById('btn-new-announcement');
    if (newAnnBtn) newAnnBtn.style.display = canPostAnn ? 'inline-flex' : 'none';

    const canProt = window.authManager.canManageProtocole();
    const scanBtn = document.getElementById('btn-protocol-scan');
    const manualSncBtn = document.getElementById('btn-manual-sanction');
    if (scanBtn) scanBtn.style.display = canProt ? 'flex' : 'none';
    if (manualSncBtn) manualSncBtn.style.display = canProt ? 'inline-flex' : 'none';
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
