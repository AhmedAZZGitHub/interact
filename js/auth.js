/**
 * ==========================================================================
 * AUTHENTICATION & RBAC PERMISSION MATRIX
 * Manages user sessions, role checks, and instant role switching for simulation.
 * ==========================================================================
 */

const ROLES = {
  PRESIDENT: 'president',
  VICE_PRESIDENT: 'vice_president',
  SECRETAIRE: 'secretaire',
  PROTOCOLE: 'protocole',
  CHEF_COMMISSION: 'chef_commission',
  CO_CHEF: 'co_chef',
  REPRESENTANT: 'representant',
  MEMBRE: 'membre',
  RECRUE: 'recrue'
};

const ROLE_LABELS = {
  'president': '👑 Président',
  'vice_president': '⭐ Vice-Président',
  'secretaire': '📋 Secrétaire (RH)',
  'protocole': '⚖️ Responsable Protocole',
  'chef_commission': '💼 Chef de Commission',
  'co_chef': '🤝 Co-Chef',
  'representant': '🎓 Représentant Séminaires',
  'membre': '🔹 Membre Actif',
  'recrue': '🌱 Recrue'
};

class AuthManager {
  constructor() {
    this.storageKey = 'interact_current_user_v1';
    this.currentUser = this.loadSession();
    this.authListeners = [];
  }

  loadSession() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Session parse error:", e);
    }
    // Default active session: Youssef Mahjoub (Président)
    return {
      id: "user_pres",
      email: "president@interact-carthage.org",
      displayName: "Youssef Mahjoub",
      role: ROLES.PRESIDENT,
      commissionId: "comm_direction",
      clubId: "club_carthage_01",
      strikesCount: 0
    };
  }

  saveSession(user) {
    this.currentUser = user;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save auth session:", e);
    }
    this.notify();
  }

  getCurrentUser() {
    // Refresh user state from dbStore to get live strikes and details
    if (this.currentUser && window.dbStore) {
      const liveMember = window.dbStore.getMember(this.currentUser.id, this.currentUser.clubId);
      if (liveMember) {
        this.currentUser = {
          ...this.currentUser,
          ...liveMember,
          clubId: this.currentUser.clubId || "club_carthage_01"
        };
      }
    }
    return this.currentUser;
  }

  switchUser(userId) {
    if (!window.dbStore) return;
    const member = window.dbStore.getMember(userId);
    if (member) {
      this.saveSession({
        ...member,
        clubId: window.dbStore.data.activeClubId || "club_carthage_01"
      });
      return true;
    }
    return false;
  }

  login(email, password) {
    const club = window.dbStore.getClub();
    const foundUser = Object.values(club.members).find(m => m.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      this.saveSession({
        ...foundUser,
        clubId: club.info.id
      });
      return { success: true, user: foundUser };
    }
    return { success: false, message: "Utilisateur non trouvé avec cet email." };
  }

  register(userData) {
    const club = window.dbStore.getClub();
    const newUid = 'user_' + Date.now();
    const newMember = {
      id: newUid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role || ROLES.RECRUE,
      commissionId: userData.commissionId || "comm_sociale",
      dateJoined: new Date().toISOString(),
      strikesCount: 0,
      avatarUrl: ""
    };

    if (!club.members) club.members = {};
    club.members[newUid] = newMember;
    window.dbStore.saveData(window.dbStore.data);

    this.saveSession({
      ...newMember,
      clubId: club.info.id
    });
    return { success: true, user: newMember };
  }

  logout() {
    localStorage.removeItem(this.storageKey);
    // Fallback to recruit or guest
    this.saveSession({
      id: "user_guest",
      email: "invite@interact.org",
      displayName: "Visiteur / Invité",
      role: ROLES.RECRUE,
      commissionId: "comm_sociale",
      clubId: "club_carthage_01",
      strikesCount: 0
    });
  }

  /* ================= RBAC PERMISSIONS ================= */

  // Super Admin: President & Vice-President
  isSuperAdmin() {
    const role = this.getCurrentUser()?.role;
    return role === ROLES.PRESIDENT || role === ROLES.VICE_PRESIDENT;
  }

  // Secretariat & HR Management
  canManageHR() {
    const role = this.getCurrentUser()?.role;
    return this.isSuperAdmin() || role === ROLES.SECRETAIRE;
  }

  // Protocole: Sanctions & Discipline
  canManageProtocole() {
    const role = this.getCurrentUser()?.role;
    return this.isSuperAdmin() || role === ROLES.PROTOCOLE;
  }

  // Can Create / Edit Action
  canManageAction(commissionId) {
    if (this.isSuperAdmin()) return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Chef or Co-Chef of this commission
    if ((user.role === ROLES.CHEF_COMMISSION || user.role === ROLES.CO_CHEF) && user.commissionId === commissionId) {
      return true;
    }
    // Représentant for seminars
    if (user.role === ROLES.REPRESENTANT && commissionId === 'comm_seminaires') {
      return true;
    }
    return false;
  }

  // Can Create / Edit Task
  canManageTask(commissionId) {
    return this.canManageAction(commissionId) || this.canManageHR();
  }

  // Can Post Official Announcement
  canPostAnnouncement() {
    const role = this.getCurrentUser()?.role;
    return this.isSuperAdmin() || role === ROLES.SECRETAIRE || role === ROLES.PROTOCOLE || role === ROLES.CHEF_COMMISSION;
  }

  // Can Mark specific task complete
  canCompleteTask(task) {
    if (this.isSuperAdmin()) return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    // If assigned to user
    if (task.assignedTo && task.assignedTo.includes(user.id)) return true;
    // If chef of the commission
    if (user.role === ROLES.CHEF_COMMISSION || user.role === ROLES.CO_CHEF) return true;
    return false;
  }

  onAuthChange(callback) {
    this.authListeners.push(callback);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.authListeners.forEach(cb => {
      try { cb(this.currentUser); } catch (e) { console.error("Auth listener error:", e); }
    });
  }
}

// Global auth manager instance
const authManager = new AuthManager();
window.authManager = authManager;
window.ROLES = ROLES;
window.ROLE_LABELS = ROLE_LABELS;
