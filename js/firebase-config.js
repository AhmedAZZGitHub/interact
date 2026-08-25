/**
 * ==========================================================================
 * FIREBASE & UNIFIED DATA STORE CONFIGURATION
 * Firebase Web API Key: AIzaSyB_sLq0RLPplqNR9kQXx3wWyzQGgx_zdso
 * Realtime Database + Local Fallback Sync Engine (DBStore)
 * ==========================================================================
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_sLq0RLPplqNR9kQXx3wWyzQGgx_zdso",
  authDomain: "interact-platform.firebaseapp.com",
  databaseURL: "https://interact-platform-default-rtdb.firebaseio.com",
  projectId: "interact-platform",
  storageBucket: "interact-platform.appspot.com",
  messagingSenderId: "987654321000",
  appId: "1:987654321000:web:abcdef123456789"
};

// Global References
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let isFirebaseOnline = false;

// Initialize Firebase if SDK is available
try {
  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.database();
    isFirebaseOnline = true;
    console.log("🔥 Firebase initialized successfully.");
  }
} catch (e) {
  console.warn("⚠️ Firebase live connection not established, running in resilient DBStore mode:", e);
}

/**
 * DEFAULT DEMO DATA SEED
 */
const DEFAULT_SEED_DATA = {
  activeClubId: "club_carthage_01",
  clubs: {
    "club_carthage_01": {
      info: {
        id: "club_carthage_01",
        name: "Interact Club Carthage",
        description: "Servir d'abord - Club de jeunesse parrainé par Rotary Carthage",
        logoUrl: "icons/icon.svg",
        primaryColor: "#003366",
        district: "District 9010",
        mandateYear: "2025-2026",
        motto: "Lead, Connect, Inspire"
      },
      members: {
        "user_pres": {
          id: "user_pres",
          email: "president@interact-carthage.org",
          displayName: "Youssef Mahjoub",
          role: "president",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_vp": {
          id: "user_vp",
          email: "vp@interact-carthage.org",
          displayName: "Sarra Trabelsi",
          role: "vice_president",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_sec": {
          id: "user_sec",
          email: "secretaire@interact-carthage.org",
          displayName: "Nour Khemir",
          role: "secretaire",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_proto": {
          id: "user_proto",
          email: "protocole@interact-carthage.org",
          displayName: "Aziz Chaabane",
          role: "protocole",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_chef_action": {
          id: "user_chef_action",
          email: "action@interact-carthage.org",
          displayName: "Mehdi Ben Amor",
          role: "chef_commission",
          commissionId: "comm_sociale",
          dateJoined: "2024-10-15T14:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_cochef_action": {
          id: "user_cochef_action",
          email: "cochef@interact-carthage.org",
          displayName: "Ines Ghorbel",
          role: "co_chef",
          commissionId: "comm_sociale",
          dateJoined: "2024-11-01T09:00:00Z",
          strikesCount: 1,
          avatarUrl: ""
        },
        "user_chef_com": {
          id: "user_chef_com",
          email: "com@interact-carthage.org",
          displayName: "Rayan Dridi",
          role: "chef_commission",
          commissionId: "comm_communication",
          dateJoined: "2024-10-20T11:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_rep": {
          id: "user_rep",
          email: "representant@interact-carthage.org",
          displayName: "Amine Sassi",
          role: "representant",
          commissionId: "comm_seminaires",
          dateJoined: "2024-09-10T15:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        },
        "user_membre_01": {
          id: "user_membre_01",
          email: "membre@interact-carthage.org",
          displayName: "Kenza Jlassi",
          role: "membre",
          commissionId: "comm_sociale",
          dateJoined: "2025-01-10T12:00:00Z",
          strikesCount: 1,
          avatarUrl: ""
        },
        "user_recrue_01": {
          id: "user_recrue_01",
          email: "recrue@interact-carthage.org",
          displayName: "Omar Fakhfakh",
          role: "recrue",
          commissionId: "comm_sociale",
          dateJoined: "2025-02-01T16:00:00Z",
          strikesCount: 0,
          avatarUrl: ""
        }
      },
      commissions: {
        "comm_sociale": {
          info: {
            id: "comm_sociale",
            name: "Action Sociale & Humanitaire",
            description: "Aide aux familles nécessiteuses, collectes et actions caritatives",
            chefUid: "user_chef_action",
            coChefUid: "user_cochef_action",
            icon: "🤝",
            color: "#F7A81B"
          },
          actions: {
            "act_hiver_chaud": {
              info: {
                id: "act_hiver_chaud",
                title: "Action Hiver Chaud 2026",
                description: "Distribution de 120 colis d'hiver (couvertures, vêtements chauds, denrées) dans les zones rurales.",
                startDate: "2026-01-15",
                endDate: "2026-03-01",
                status: "in_progress"
              },
              tasks: {
                "tsk_01": {
                  id: "tsk_01",
                  title: "Négociation avec le fournisseur de couvertures (devis)",
                  assignedTo: ["user_chef_action"],
                  deadline: "2026-08-24T18:00:00Z", // Past -> Triggers auto-sanction
                  status: "pending",
                  completedAt: null,
                  priority: "urgent"
                },
                "tsk_02": {
                  id: "tsk_02",
                  title: "Collecte des denrées alimentaires au supermarché partenaire",
                  assignedTo: ["user_membre_01", "user_recrue_01"],
                  deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(), // < 24h
                  status: "pending",
                  completedAt: null,
                  priority: "warning"
                },
                "tsk_03": {
                  id: "tsk_03",
                  title: "Organisation du planning de tri et d'emballage",
                  assignedTo: ["user_cochef_action"],
                  deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), // Normal
                  status: "pending",
                  completedAt: null,
                  priority: "normal"
                },
                "tsk_04": {
                  id: "tsk_04",
                  title: "Autorisations administratives auprès des autorités locales",
                  assignedTo: ["user_pres"],
                  deadline: "2026-08-20T12:00:00Z",
                  status: "completed",
                  completedAt: "2026-08-19T16:30:00Z",
                  priority: "normal"
                }
              }
            }
          }
        },
        "comm_communication": {
          info: {
            id: "comm_communication",
            name: "Relations Publiques & Média",
            description: "Gestion des réseaux sociaux, identité visuelle, affiches et presse",
            chefUid: "user_chef_com",
            coChefUid: null,
            icon: "📢",
            color: "#00F0FF"
          },
          actions: {
            "act_campagne_notoriete": {
              info: {
                id: "act_campagne_notoriete",
                title: "Campagne de Recrutement Interact 2026",
                description: "Vidéos de témoignages et shooting photo des membres",
                startDate: "2026-02-01",
                endDate: "2026-03-15",
                status: "in_progress"
              },
              tasks: {
                "tsk_com_01": {
                  id: "tsk_com_01",
                  title: "Publication du Reel Instagram 'Pourquoi rejoindre Interact'",
                  assignedTo: ["user_chef_com"],
                  deadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
                  status: "pending",
                  completedAt: null,
                  priority: "warning"
                },
                "tsk_com_02": {
                  id: "tsk_com_02",
                  title: "Conception des badges officiels pour les recrues",
                  assignedTo: ["user_chef_com"],
                  deadline: new Date(Date.now() + 120 * 3600 * 1000).toISOString(),
                  status: "pending",
                  completedAt: null,
                  priority: "normal"
                }
              }
            }
          }
        },
        "comm_seminaires": {
          info: {
            id: "comm_seminaires",
            name: "Comités Séminaires & Formation",
            description: "Coordination des séminaires du District et ateliers RYLA",
            chefUid: "user_rep",
            coChefUid: null,
            icon: "🎓",
            color: "#9D4EDD"
          },
          actions: {
            "act_seminaire_district": {
              info: {
                id: "act_seminaire_district",
                title: "Participation au Séminaire Annuel Interact",
                description: "Préparation des délégations et du stand du club",
                startDate: "2026-03-01",
                endDate: "2026-04-10",
                status: "in_progress"
              },
              tasks: {
                "tsk_sem_01": {
                  id: "tsk_sem_01",
                  title: "Réservation du transport pour 25 membres",
                  assignedTo: ["user_rep"],
                  deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
                  status: "pending",
                  completedAt: null,
                  priority: "normal"
                }
              }
            }
          }
        }
      },
      sanctions: {
        "snc_01": {
          id: "snc_01",
          userId: "user_cochef_action",
          taskId: "tsk_old_01",
          actionTitle: "Collecte de Fonds Hiver",
          reason: "Retard de 48 heures sur le compte-rendu financier",
          date: "2026-08-22T14:30:00Z",
          status: "active",
          grade: "light",
          delayHours: 48,
          excuseReason: null,
          excusedBy: null
        }
      },
      announcements: {
        "ann_01": {
          id: "ann_01",
          title: "🏛️ Prochaine Réunion Statutaire ce Dimanche",
          content: "Chers Interactors,\nNotre réunion statutaire se tiendra ce dimanche à 10h00 au siège du club.\nOrdre du jour :\n1. Bilan d'avancement de l'action Hiver Chaud.\n2. Point de discipline et assiduité avec le Responsable Protocole.\n3. Vote pour les nouveaux projets du comité séminaire.\nPrésence obligatoire pour tous les membres et recrues.",
          authorUid: "user_pres",
          authorName: "Youssef Mahjoub (Président)",
          createdAt: "2026-08-24T18:00:00Z",
          category: "statutaire"
        },
        "ann_02": {
          id: "ann_02",
          title: "🔥 Urgence Logistique : Tri des vêtements chaud",
          content: "Nous recherchons 4 volontaires supplémentaires pour le centre de tri ce vendredi après-midi à 16h30. Merci de vous signaler auprès de la commission Action Sociale.",
          authorUid: "user_chef_action",
          authorName: "Mehdi Ben Amor (Chef Commission)",
          createdAt: "2026-08-24T21:15:00Z",
          category: "urgent"
        }
      }
    }
  }
};

/**
 * DBStore - Unified Reactive Database Bridge
 */
class DBStore {
  constructor() {
    this.storageKey = 'interact_platform_data_v1';
    this.listeners = [];
    this.data = this.loadInitialData();
  }

  loadInitialData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Storage parse error, resetting to default:", e);
    }
    this.saveData(DEFAULT_SEED_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_SEED_DATA));
  }

  saveData(newData) {
    this.data = newData;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("Local storage error:", e);
    }
    this.notifyListeners();
  }

  getClub(clubId = null) {
    const id = clubId || this.data.activeClubId || "club_carthage_01";
    return this.data.clubs[id] || DEFAULT_SEED_DATA.clubs["club_carthage_01"];
  }

  getMembers(clubId = null) {
    const club = this.getClub(clubId);
    return club.members || {};
  }

  getMember(userId, clubId = null) {
    const members = this.getMembers(clubId);
    return members[userId] || null;
  }

  getCommissions(clubId = null) {
    const club = this.getClub(clubId);
    return club.commissions || {};
  }

  getSanctions(clubId = null) {
    const club = this.getClub(clubId);
    return club.sanctions || {};
  }

  getAnnouncements(clubId = null) {
    const club = this.getClub(clubId);
    return club.announcements || {};
  }

  // Update operations
  updateMemberRole(userId, newRole, newCommissionId = null, clubId = null) {
    const club = this.getClub(clubId);
    if (club.members[userId]) {
      club.members[userId].role = newRole;
      if (newCommissionId !== null) {
        club.members[userId].commissionId = newCommissionId;
      }
      this.saveData(this.data);
    }
  }

  addAnnouncement(title, content, category, authorUid, authorName, clubId = null) {
    const club = this.getClub(clubId);
    const id = 'ann_' + Date.now();
    if (!club.announcements) club.announcements = {};
    club.announcements[id] = {
      id,
      title,
      content,
      category,
      authorUid,
      authorName,
      createdAt: new Date().toISOString()
    };
    this.saveData(this.data);
    return club.announcements[id];
  }

  addTask(commissionId, actionId, taskData, clubId = null) {
    const club = this.getClub(clubId);
    const taskId = 'tsk_' + Date.now();
    const newTask = {
      id: taskId,
      title: taskData.title,
      assignedTo: taskData.assignedTo || [],
      deadline: taskData.deadline,
      status: "pending",
      completedAt: null,
      priority: taskData.priority || "normal"
    };

    if (club.commissions[commissionId] && 
        club.commissions[commissionId].actions[actionId]) {
      if (!club.commissions[commissionId].actions[actionId].tasks) {
        club.commissions[commissionId].actions[actionId].tasks = {};
      }
      club.commissions[commissionId].actions[actionId].tasks[taskId] = newTask;
      this.saveData(this.data);
      return newTask;
    }
    return null;
  }

  toggleTaskStatus(commissionId, actionId, taskId, isCompleted, clubId = null) {
    const club = this.getClub(clubId);
    const task = club.commissions?.[commissionId]?.actions?.[actionId]?.tasks?.[taskId];
    if (task) {
      task.status = isCompleted ? "completed" : "pending";
      task.completedAt = isCompleted ? new Date().toISOString() : null;
      this.saveData(this.data);
      return task;
    }
    return null;
  }

  addAction(commissionId, actionData, clubId = null) {
    const club = this.getClub(clubId);
    const actionId = 'act_' + Date.now();
    const newAction = {
      info: {
        id: actionId,
        title: actionData.title,
        description: actionData.description,
        startDate: actionData.startDate || new Date().toISOString().split('T')[0],
        endDate: actionData.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: "in_progress"
      },
      tasks: {}
    };

    if (club.commissions[commissionId]) {
      if (!club.commissions[commissionId].actions) {
        club.commissions[commissionId].actions = {};
      }
      club.commissions[commissionId].actions[actionId] = newAction;
      this.saveData(this.data);
      return newAction;
    }
    return null;
  }

  addSanction(sanctionData, clubId = null) {
    const club = this.getClub(clubId);
    const sanctionId = 'snc_' + Date.now();
    const newSanction = {
      id: sanctionId,
      userId: sanctionData.userId,
      taskId: sanctionData.taskId,
      actionTitle: sanctionData.actionTitle || "Action Club",
      reason: sanctionData.reason,
      date: new Date().toISOString(),
      status: "active",
      grade: sanctionData.grade || "light",
      delayHours: sanctionData.delayHours || 24,
      excuseReason: null,
      excusedBy: null
    };

    if (!club.sanctions) club.sanctions = {};
    club.sanctions[sanctionId] = newSanction;

    // Increment member strikes count
    if (club.members[sanctionData.userId]) {
      club.members[sanctionData.userId].strikesCount = (club.members[sanctionData.userId].strikesCount || 0) + 1;
    }

    this.saveData(this.data);
    return newSanction;
  }

  updateSanction(sanctionId, updates, clubId = null) {
    const club = this.getClub(clubId);
    if (club.sanctions && club.sanctions[sanctionId]) {
      Object.assign(club.sanctions[sanctionId], updates);
      
      // If excused, decrement strikesCount
      if (updates.status === 'excused') {
        const userId = club.sanctions[sanctionId].userId;
        if (club.members[userId] && club.members[userId].strikesCount > 0) {
          club.members[userId].strikesCount -= 1;
        }
      }

      this.saveData(this.data);
      return club.sanctions[sanctionId];
    }
    return null;
  }

  resetToDefault() {
    this.saveData(JSON.parse(JSON.stringify(DEFAULT_SEED_DATA)));
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch (e) { console.error("Listener error:", e); }
    });
  }
}

// Global DBStore instance
const dbStore = new DBStore();
window.dbStore = dbStore;
