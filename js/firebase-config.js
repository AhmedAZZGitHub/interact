/**
 * ==========================================================================
 * FIREBASE & UNIFIED DATA STORE CONFIGURATION (EXTENDED COLLABORATIVE SCHEMA)
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
 * EXTENDED DEFAULT SEED DATA
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
        "user_superadmin": {
          id: "user_superadmin",
          email: "ahmedazzouzi72@gmail.com",
          displayName: "Ahmed Azzouzi (Super Admin)",
          role: "superadmin",
          isSuperAdmin: true,
          phoneNumber: "+216 20 000 000",
          birthDate: "1998-05-12",
          commissionId: "comm_direction",
          dateJoined: "2023-01-01T00:00:00Z",
          strikesCount: 0,
          status: "active",
          history: [{ year: "2023-2027", role: "superadmin", notes: "Super Admin Fondateur Plateforme Interact" }]
        },
        "user_pres": {
          id: "user_pres",
          email: "president@interact-carthage.org",
          displayName: "Youssef Mahjoub",
          role: "president",
          phoneNumber: "+216 98 111 222",
          birthDate: "2006-03-15",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          status: "active",
          history: [
            { year: "2024-2025", role: "vice_president", commissionName: "Direction" },
            { year: "2025-2026", role: "president", commissionName: "Bureau Exécutif" }
          ]
        },
        "user_vp": {
          id: "user_vp",
          email: "vp@interact-carthage.org",
          displayName: "Sarra Trabelsi",
          role: "vice_president",
          phoneNumber: "+216 98 222 333",
          birthDate: "2006-07-22",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          status: "active",
          history: [
            { year: "2024-2025", role: "chef_commission", commissionName: "Action Sociale" },
            { year: "2025-2026", role: "vice_president", commissionName: "Direction" }
          ]
        },
        "user_sec": {
          id: "user_sec",
          email: "secretaire@interact-carthage.org",
          displayName: "Nour Khemir",
          role: "secretaire",
          phoneNumber: "+216 98 333 444",
          birthDate: "2007-01-10",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          status: "active",
          history: [
            { year: "2025-2026", role: "secretaire", commissionName: "Bureau Exécutif (RH)" }
          ]
        },
        "user_proto": {
          id: "user_proto",
          email: "protocole@interact-carthage.org",
          displayName: "Aziz Chaabane",
          role: "protocole",
          phoneNumber: "+216 98 444 555",
          birthDate: "2006-11-30",
          commissionId: "comm_direction",
          dateJoined: "2024-09-01T10:00:00Z",
          strikesCount: 0,
          status: "active",
          history: [
            { year: "2025-2026", role: "protocole", commissionName: "Discipline & Protocole" }
          ]
        },
        "user_chef_action": {
          id: "user_chef_action",
          email: "action@interact-carthage.org",
          displayName: "Mehdi Ben Amor",
          role: "chef_commission",
          phoneNumber: "+216 98 555 666",
          birthDate: "2006-09-05",
          commissionId: "comm_sociale",
          dateJoined: "2024-10-15T14:00:00Z",
          strikesCount: 0,
          status: "active",
          history: [
            { year: "2025-2026", role: "chef_commission", commissionName: "Action Sociale" }
          ]
        },
        "user_cochef_action": {
          id: "user_cochef_action",
          email: "cochef@interact-carthage.org",
          displayName: "Ines Ghorbel",
          role: "co_chef",
          phoneNumber: "+216 98 666 777",
          birthDate: "2007-04-18",
          commissionId: "comm_sociale",
          dateJoined: "2024-11-01T09:00:00Z",
          strikesCount: 1,
          status: "active"
        },
        "user_chef_com": {
          id: "user_chef_com",
          email: "com@interact-carthage.org",
          displayName: "Rayan Dridi",
          role: "chef_commission",
          phoneNumber: "+216 98 777 888",
          birthDate: "2006-12-02",
          commissionId: "comm_communication",
          dateJoined: "2024-10-20T11:00:00Z",
          strikesCount: 0,
          status: "active"
        },
        "user_rep": {
          id: "user_rep",
          email: "representant@interact-carthage.org",
          displayName: "Amine Sassi",
          role: "representant",
          phoneNumber: "+216 98 888 999",
          birthDate: "2006-08-14",
          commissionId: "comm_seminaires",
          dateJoined: "2024-09-10T15:00:00Z",
          strikesCount: 0,
          status: "active"
        },
        "user_membre_01": {
          id: "user_membre_01",
          email: "membre@interact-carthage.org",
          displayName: "Kenza Jlassi",
          role: "membre",
          phoneNumber: "+216 98 000 111",
          birthDate: "2007-06-25",
          commissionId: "comm_sociale",
          dateJoined: "2025-01-10T12:00:00Z",
          strikesCount: 1,
          status: "active"
        },
        "user_recrue_01": {
          id: "user_recrue_01",
          email: "recrue@interact-carthage.org",
          displayName: "Omar Fakhfakh",
          role: "recrue",
          phoneNumber: "+216 98 123 789",
          birthDate: "2007-09-19",
          commissionId: "comm_sociale",
          dateJoined: "2025-02-01T16:00:00Z",
          strikesCount: 0,
          status: "active"
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
                  deadline: "2026-08-24T18:00:00Z",
                  status: "pending",
                  completedAt: null,
                  priority: "urgent"
                },
                "tsk_02": {
                  id: "tsk_02",
                  title: "Collecte des denrées alimentaires au supermarché partenaire",
                  assignedTo: ["user_membre_01", "user_recrue_01"],
                  deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
                  status: "pending",
                  completedAt: null,
                  priority: "warning"
                },
                "tsk_03": {
                  id: "tsk_03",
                  title: "Organisation du planning de tri et d'emballage",
                  assignedTo: ["user_cochef_action"],
                  deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
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
        }
      },
      channels: {
        "chan_general": {
          id: "chan_general",
          clubId: "club_carthage_01",
          commissionId: null,
          taskId: null,
          name: "📢 Annonces Officielles (Bureau)",
          type: "announcements",
          allowedWriters: ["president", "vice_president", "secretaire", "protocole"],
          meetUrl: "https://meet.jit.si/Interact_Carthage_General_Live",
          createdAt: "2026-08-20T10:00:00Z"
        },
        "chan_sociale": {
          id: "chan_sociale",
          clubId: "club_carthage_01",
          commissionId: "comm_sociale",
          taskId: null,
          name: "🤝 Commission Action Sociale",
          type: "commission",
          allowedWriters: ["all"],
          meetUrl: "https://meet.jit.si/Interact_Carthage_Sociale_Live",
          createdAt: "2026-08-20T10:00:00Z"
        },
        "chan_sub_sponsoring": {
          id: "chan_sub_sponsoring",
          clubId: "club_carthage_01",
          commissionId: "comm_sociale",
          taskId: "tsk_01",
          name: "🎯 Équipe Sponsoring Couvertures J-5",
          type: "task_custom",
          allowedWriters: ["all"],
          meetUrl: "https://meet.jit.si/Interact_Carthage_Sponsoring_Task",
          createdAt: "2026-08-22T14:00:00Z"
        }
      },
      messages: {
        "chan_general": {
          "msg_01": {
            id: "msg_01",
            channelId: "chan_general",
            senderId: "user_pres",
            senderName: "Youssef Mahjoub",
            senderRole: "president",
            text: "Bienvenue à tous sur la nouvelle plateforme mobile et collaborative Interact Carthage ! Retrouvez ici toutes les annonces officielles du Bureau.",
            attachments: [],
            reactions: {
              "👍": ["user_vp", "user_sec", "user_membre_01"],
              "🔥": ["user_chef_action", "user_recrue_01"],
              "❤️": ["user_proto"]
            },
            createdAt: "2026-08-24T18:30:00Z"
          },
          "msg_02": {
            id: "msg_02",
            channelId: "chan_general",
            senderId: "user_sec",
            senderName: "Nour Khemir",
            senderRole: "secretaire",
            text: "Rappel : La feuille de présence pour la réunion de dimanche est disponible dans le calendrier. N'oubliez pas de confirmer votre présence.",
            attachments: [],
            reactions: {
              "👀": ["user_membre_01", "user_cochef_action"],
              "🎉": ["user_vp"]
            },
            createdAt: "2026-08-24T20:15:00Z"
          }
        },
        "chan_sociale": {
          "msg_soc_01": {
            id: "msg_soc_01",
            channelId: "chan_sociale",
            senderId: "user_chef_action",
            senderName: "Mehdi Ben Amor",
            senderRole: "chef_commission",
            text: "L'équipe sociale, nous organisons un Meet rapide ce soir à 21h pour finaliser la liste des bénéficiaires de l'action Hiver Chaud !",
            attachments: [],
            reactions: {
              "👍": ["user_cochef_action", "user_membre_01"]
            },
            createdAt: "2026-08-25T00:10:00Z"
          }
        },
        "chan_sub_sponsoring": {
          "msg_sp_01": {
            id: "msg_sp_01",
            channelId: "chan_sub_sponsoring",
            senderId: "user_cochef_action",
            senderName: "Ines Ghorbel",
            senderRole: "co_chef",
            text: "J'ai déposé le devis du fabricant de couvertures dans l'espace de rendu de la tâche. Merci de valider !",
            attachments: ["https://drive.google.com/file/d/sample-devis-couvertures/view"],
            reactions: {
              "🔥": ["user_chef_action"]
            },
            createdAt: "2026-08-25T01:15:00Z"
          }
        }
      },
      task_submissions: {
        "tsk_01": {
          "sub_01": {
            id: "sub_01",
            taskId: "tsk_01",
            clubId: "club_carthage_01",
            submittedBy: ["user_cochef_action"],
            submitterName: "Ines Ghorbel",
            textNotes: "Devis négocié à 18 DT TTC par couverture polaire haute densité (100 unités). Remise accordée de 15% pour le club Interact.",
            fileUrls: ["https://drive.google.com/file/d/devis-couvertures-interact.pdf"],
            submittedAt: "2026-08-24T17:45:00Z",
            validated: false,
            validatedBy: null,
            validationFeedback: null
          }
        }
      },
      events_schedule: {
        "ev_01": {
          id: "ev_01",
          clubId: "club_carthage_01",
          actionId: null,
          title: "Réunion Statutaire de Rentrée",
          description: "Ordre du jour : Bilan financier, validation des budgets des commissions et points Protocole.",
          startDateTime: "2026-08-30T10:00:00Z",
          endDateTime: "2026-08-30T12:30:00Z",
          location: "Siège Rotary Club Carthage",
          type: "statutaire",
          isPublicToClub: true
        },
        "ev_02": {
          id: "ev_02",
          clubId: "club_carthage_01",
          actionId: "act_hiver_chaud",
          title: "Distribution sur le Terrain — Hiver Chaud",
          description: "Départ de la caravane solidaire vers la région de Siliana.",
          startDateTime: "2026-09-05T07:00:00Z",
          endDateTime: "2026-09-05T18:00:00Z",
          location: "Siliana (Centre Nord)",
          type: "action",
          isPublicToClub: true
        },
        "ev_03": {
          id: "ev_03",
          clubId: "club_carthage_01",
          actionId: null,
          title: "Atelier RYLA & Leadership Jeunesse",
          description: "Formation animée par les membres du Rotary sur la prise de parole et la gestion de projet.",
          startDateTime: "2026-09-12T14:00:00Z",
          endDateTime: "2026-09-12T17:30:00Z",
          location: "Hôtel Carthage Thalasso / Meet",
          type: "formation",
          isPublicToClub: true
        }
      }
    }
  }
};

/**
 * DBStore - Reactive Unified Database Bridge
 */
class DBStore {
  constructor() {
    this.storageKey = 'interact_platform_data_v2';
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
    return this.getClub(clubId).members || {};
  }

  getMember(userId, clubId = null) {
    return this.getMembers(clubId)[userId] || null;
  }

  getCommissions(clubId = null) {
    return this.getClub(clubId).commissions || {};
  }

  getSanctions(clubId = null) {
    return this.getClub(clubId).sanctions || {};
  }

  getAnnouncements(clubId = null) {
    return this.getClub(clubId).announcements || {};
  }

  /* ================= CHANNELS & MESSAGING ================= */
  getChannels(clubId = null) {
    return this.getClub(clubId).channels || {};
  }

  getChannel(channelId, clubId = null) {
    return this.getChannels(clubId)[channelId] || null;
  }

  getMessages(channelId, clubId = null) {
    const club = this.getClub(clubId);
    if (!club.messages) club.messages = {};
    return club.messages[channelId] || {};
  }

  addMessage(channelId, messageData, clubId = null) {
    const club = this.getClub(clubId);
    if (!club.messages) club.messages = {};
    if (!club.messages[channelId]) club.messages[channelId] = {};

    const msgId = 'msg_' + Date.now();
    const newMsg = {
      id: msgId,
      channelId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderRole: messageData.senderRole,
      text: messageData.text,
      attachments: messageData.attachments || [],
      reactions: {},
      createdAt: new Date().toISOString()
    };

    club.messages[channelId][msgId] = newMsg;
    this.saveData(this.data);
    return newMsg;
  }

  toggleReaction(channelId, messageId, emoji, userId, clubId = null) {
    const club = this.getClub(clubId);
    const msg = club.messages?.[channelId]?.[messageId];
    if (!msg) return null;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const index = msg.reactions[emoji].indexOf(userId);
    if (index > -1) {
      msg.reactions[emoji].splice(index, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }

    this.saveData(this.data);
    return msg;
  }

  addChannel(channelData, clubId = null) {
    const club = this.getClub(clubId);
    if (!club.channels) club.channels = {};

    const channelId = 'chan_sub_' + Date.now();
    const cleanRoomName = channelData.name.replace(/[^a-zA-Z0-9]/g, '_');
    const newChannel = {
      id: channelId,
      clubId: club.info.id,
      commissionId: channelData.commissionId || null,
      taskId: channelData.taskId || null,
      name: channelData.name,
      type: channelData.type || 'task_custom',
      allowedWriters: channelData.allowedWriters || ['all'],
      meetUrl: `https://meet.jit.si/Interact_Carthage_${cleanRoomName}`,
      createdAt: new Date().toISOString()
    };

    club.channels[channelId] = newChannel;
    this.saveData(this.data);
    return newChannel;
  }

  /* ================= TASK WORKSPACE & DELIVERABLES ================= */
  getTaskSubmissions(taskId, clubId = null) {
    const club = this.getClub(clubId);
    if (!club.task_submissions) club.task_submissions = {};
    return club.task_submissions[taskId] || {};
  }

  addTaskSubmission(taskId, submissionData, clubId = null) {
    const club = this.getClub(clubId);
    if (!club.task_submissions) club.task_submissions = {};
    if (!club.task_submissions[taskId]) club.task_submissions[taskId] = {};

    const subId = 'sub_' + Date.now();
    const newSub = {
      id: subId,
      taskId,
      clubId: club.info.id,
      submittedBy: submissionData.submittedBy || [],
      submitterName: submissionData.submitterName,
      textNotes: submissionData.textNotes,
      fileUrls: submissionData.fileUrls || [],
      submittedAt: new Date().toISOString(),
      validated: false,
      validatedBy: null,
      validationFeedback: null
    };

    club.task_submissions[taskId][subId] = newSub;
    this.saveData(this.data);
    return newSub;
  }

  validateTaskSubmission(taskId, submissionId, isValid, feedback, validatorName, clubId = null) {
    const club = this.getClub(clubId);
    const sub = club.task_submissions?.[taskId]?.[submissionId];
    if (sub) {
      sub.validated = isValid;
      sub.validatedBy = validatorName;
      sub.validationFeedback = feedback || null;

      // If validated, also complete the task in the commission tree
      if (isValid) {
        Object.values(club.commissions || {}).forEach(comm => {
          Object.values(comm.actions || {}).forEach(act => {
            if (act.tasks && act.tasks[taskId]) {
              act.tasks[taskId].status = 'completed';
              act.tasks[taskId].completedAt = new Date().toISOString();
            }
          });
        });
      }

      this.saveData(this.data);
      return sub;
    }
    return null;
  }

  /* ================= SHARED CALENDAR & EVENTS ================= */
  getEvents(clubId = null) {
    const club = this.getClub(clubId);
    return club.events_schedule || {};
  }

  addEvent(eventData, clubId = null) {
    const club = this.getClub(clubId);
    if (!club.events_schedule) club.events_schedule = {};

    const evId = 'ev_' + Date.now();
    const newEvent = {
      id: evId,
      clubId: club.info.id,
      actionId: eventData.actionId || null,
      title: eventData.title,
      description: eventData.description || '',
      startDateTime: eventData.startDateTime,
      endDateTime: eventData.endDateTime || eventData.startDateTime,
      location: eventData.location || '',
      type: eventData.type || 'statutaire',
      isPublicToClub: true
    };

    club.events_schedule[evId] = newEvent;
    this.saveData(this.data);
    return newEvent;
  }

  /* ================= EXISTING CORE UPDATES ================= */
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

  /* ================= MULTI-TENANT & APPROVAL WORKFLOW ================= */
  getAllClubs() {
    return Object.values(this.data.clubs || {}).map(c => ({
      id: c.info?.id || 'club',
      name: c.info?.name || 'Club',
      district: c.info?.district || 'District 9010',
      status: c.info?.status || 'active',
      description: c.info?.description || '',
      sponsorRotaryClub: c.info?.sponsorRotaryClub || '',
      logoUrl: c.info?.logoUrl || '',
      presidentUid: c.info?.presidentUid || '',
      presidentName: c.info?.presidentName || '',
      presidentEmail: c.info?.presidentEmail || '',
      createdAt: c.info?.createdAt || new Date().toISOString()
    }));
  }

  getActiveClubs() {
    return this.getAllClubs().filter(c => c.status === 'active' || !c.status);
  }

  getPendingClubs() {
    return this.getAllClubs().filter(c => c.status === 'pending_superadmin');
  }

  createClub(clubData, presidentData) {
    const clubId = 'club_' + clubData.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const presUid = 'user_' + Date.now();

    const newClub = {
      info: {
        id: clubId,
        name: clubData.name,
        description: clubData.description || "Club Interact",
        district: clubData.district || "District 9010",
        sponsorRotaryClub: clubData.sponsorRotaryClub || "Rotary Club Parrain",
        status: "pending_superadmin",
        presidentUid: presUid,
        presidentName: presidentData.displayName,
        presidentEmail: presidentData.email,
        createdAt: new Date().toISOString()
      },
      members: {
        [presUid]: {
          id: presUid,
          email: presidentData.email,
          displayName: presidentData.displayName,
          role: "president",
          phoneNumber: presidentData.phoneNumber || "",
          birthDate: presidentData.birthDate || "",
          commissionId: "comm_direction",
          status: "pending_superadmin",
          strikesCount: 0,
          dateJoined: new Date().toISOString()
        }
      },
      commissions: {
        "comm_sociale": {
          info: { id: "comm_sociale", name: "Commission Action Sociale", type: "social", icon: "🤝", chefUid: presUid },
          actions: {}
        }
      },
      channels: {
        "chan_announcements": {
          id: "chan_announcements",
          name: "📢 Annonces Officielles",
          type: "announcements",
          allowedWriters: ["president", "vice_president", "secretaire", "protocole", "superadmin"]
        }
      },
      sanctions: {},
      announcements: {},
      events_schedule: {},
      task_submissions: {}
    };

    if (!this.data.clubs) this.data.clubs = {};
    this.data.clubs[clubId] = newClub;
    this.saveData(this.data);
    return newClub;
  }

  approveClub(clubId) {
    if (this.data.clubs?.[clubId]) {
      this.data.clubs[clubId].info.status = 'active';
      const presUid = this.data.clubs[clubId].info.presidentUid;
      if (presUid && this.data.clubs[clubId].members?.[presUid]) {
        this.data.clubs[clubId].members[presUid].status = 'active';
      }
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  rejectClub(clubId) {
    if (this.data.clubs?.[clubId]) {
      this.data.clubs[clubId].info.status = 'rejected';
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  registerMember(userData) {
    const clubId = userData.clubId || this.data.activeClubId || "club_carthage_01";
    const club = this.getClub(clubId);
    const newUid = 'user_' + Date.now();

    const newMember = {
      id: newUid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role || "membre",
      phoneNumber: userData.phoneNumber || "",
      birthDate: userData.birthDate || "",
      commissionId: userData.commissionId || "comm_sociale",
      status: "pending_president",
      strikesCount: 0,
      dateJoined: new Date().toISOString()
    };

    if (!club.members) club.members = {};
    club.members[newUid] = newMember;
    this.saveData(this.data);
    return newMember;
  }

  approveMember(userId, clubId = null) {
    const club = this.getClub(clubId);
    if (club.members?.[userId]) {
      club.members[userId].status = 'active';
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  rejectMember(userId, clubId = null) {
    const club = this.getClub(clubId);
    if (club.members?.[userId]) {
      delete club.members[userId];
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  getPendingMembers(clubId = null) {
    const members = this.getMembers(clubId);
    return Object.values(members).filter(m => m.status === 'pending_president');
  }

  /* ================= PROTOCOLE ARBITRATION & TASK FREEZE ================= */
  approveSanction(sanctionId, severity = 'sanction_legere', reviewNotes = '', reviewedBy = 'Protocole', clubId = null) {
    const club = this.getClub(clubId);
    const s = club.sanctions?.[sanctionId];
    if (s) {
      s.status = 'approved';
      s.severity = severity;
      s.reviewedBy = reviewedBy;
      s.reviewNotes = reviewNotes;
      s.reviewedAt = new Date().toISOString();

      // Add strike to member profile
      const strikesToAdd = severity === 'sanction_lourde' ? 2 : 1;
      if (club.members[s.userId]) {
        club.members[s.userId].strikesCount = (club.members[s.userId].strikesCount || 0) + strikesToAdd;
      }

      this.saveData(this.data);
      return s;
    }
    return null;
  }

  rejectSanction(sanctionId, excuseReason = '', reviewedBy = 'Protocole', clubId = null) {
    const club = this.getClub(clubId);
    const s = club.sanctions?.[sanctionId];
    if (s) {
      s.status = 'excused';
      s.excuseReason = excuseReason;
      s.reviewedBy = reviewedBy;
      s.reviewedAt = new Date().toISOString();
      this.saveData(this.data);
      return s;
    }
    return null;
  }

  setTaskFlagReview(commissionId, actionId, taskId, isFlagged = true, clubId = null) {
    const club = this.getClub(clubId);
    const task = club.commissions?.[commissionId]?.actions?.[actionId]?.tasks?.[taskId];
    if (task) {
      task.flagReview = isFlagged;
      this.saveData(this.data);
      return task;
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
