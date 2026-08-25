/**
 * ==========================================================================
 * AUTHENTICATION & RBAC PERMISSION MATRIX
 * Manages user sessions, multi-tenant roles, and simulation switching.
 * ==========================================================================
 */

const ROLES = {
  SUPERADMIN: 'superadmin',
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
  'superadmin': '🛡️ Super Admin (Plateforme)',
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
    this.storageKey = 'interact_current_user_v2';
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
      strikesCount: 0,
      status: "active"
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

  login(email, password, clubId = null) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Super Admin Global Bypass
    if (cleanEmail === 'ahmedazzouzi72@gmail.com') {
      const superAdminUser = {
        id: "user_superadmin",
        email: "ahmedazzouzi72@gmail.com",
        displayName: "Ahmed Azzouzi (Super Admin)",
        role: ROLES.SUPERADMIN,
        isSuperAdmin: true,
        commissionId: "comm_direction",
        clubId: "all",
        strikesCount: 0,
        status: "active"
      };

      this.saveSession(superAdminUser);
      return { success: true, user: superAdminUser };
    }

    // 2. Standard Club Member Login
    const targetClubId = clubId || (window.dbStore ? window.dbStore.data.activeClubId : "club_carthage_01");
    const club = window.dbStore ? window.dbStore.getClub(targetClubId) : null;
    
    if (!club) {
      return { success: false, message: "Club introuvable." };
    }

    const foundUser = Object.values(club.members || {}).find(m => m.email.toLowerCase() === cleanEmail);
    if (foundUser) {
      this.saveSession({
        ...foundUser,
        clubId: club.info?.id || targetClubId
      });
      return { success: true, user: foundUser };
    }
    return { success: false, message: "Utilisateur non trouvé avec cet email au sein du club sélectionné." };
  }

  registerPresidentWithClub(userData, clubData) {
    if (!window.dbStore) return null;
    const newClub = window.dbStore.createClub(clubData, userData);
    const presUid = newClub.info.presidentUid;
    const presMember = newClub.members[presUid];

    // Founder President has active status
    presMember.status = 'active';
    newClub.info.status = 'active';
    window.dbStore.saveData(window.dbStore.data);

    this.saveSession({
      ...presMember,
      clubId: newClub.info.id
    });
    return { club: newClub, user: presMember };
  }

  registerMemberJoiningClub(userData) {
    if (!window.dbStore) return null;
    const newMember = window.dbStore.registerMember({
      ...userData,
      role: 'guest',
      status: 'pending_president'
    });

    this.saveSession({
      ...newMember,
      clubId: userData.clubId
    });
    return newMember;
  }

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn("Error removing session:", e);
    }
    this.notify();
    if (window.app) {
      window.app.showAuthScreen();
      window.app.showToast('Déconnexion effectuée. À bientôt ! 👋', 'info');
    }
  }

  /* ================= RBAC PERMISSIONS ================= */

  isPlatformSuperAdmin() {
    const user = this.getCurrentUser();
    return user?.role === ROLES.SUPERADMIN || user?.isSuperAdmin === true;
  }

  isExecutiveBoard() {
    const role = this.getCurrentUser()?.role;
    return this.isPlatformSuperAdmin() || [ROLES.PRESIDENT, ROLES.VICE_PRESIDENT, ROLES.SECRETAIRE, ROLES.PROTOCOLE].includes(role);
  }

  canManageHR() {
    const role = this.getCurrentUser()?.role;
    return this.isPlatformSuperAdmin() || [ROLES.PRESIDENT, ROLES.VICE_PRESIDENT, ROLES.SECRETAIRE].includes(role);
  }

  canManageProtocole() {
    const role = this.getCurrentUser()?.role;
    return this.isPlatformSuperAdmin() || [ROLES.PRESIDENT, ROLES.VICE_PRESIDENT, ROLES.PROTOCOLE].includes(role);
  }

  canManageAction(commissionId) {
    if (this.isPlatformSuperAdmin() || this.getCurrentUser()?.role === ROLES.PRESIDENT || this.getCurrentUser()?.role === ROLES.VICE_PRESIDENT) return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if ((user.role === ROLES.CHEF_COMMISSION || user.role === ROLES.CO_CHEF) && user.commissionId === commissionId) {
      return true;
    }
    if (user.role === ROLES.REPRESENTANT && commissionId === 'comm_seminaires') {
      return true;
    }
    return false;
  }

  canManageTask(commissionId) {
    return this.canManageAction(commissionId) || this.canManageHR();
  }

  canPostAnnouncement() {
    return this.isExecutiveBoard();
  }

  canCompleteTask(task) {
    if (this.isExecutiveBoard()) return true;
    const user = this.getCurrentUser();
    if (!user) return false;
    if (task.assignedTo && task.assignedTo.includes(user.id)) return true;
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
