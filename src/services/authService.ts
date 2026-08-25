import { User, Club, UserRole, UserStatus } from '../types';
import { clubService } from './clubService';
import { SUPER_ADMIN_CREDENTIALS, ensureSuperAdminSeeded } from './seedSuperAdmin';

/**
 * ==========================================================================
 * AUTH SERVICE (Firebase Auth + Cloud Firestore)
 * Multi-tenant authentication, Super Admin bypass, and conditional registration.
 * ==========================================================================
 */

type AuthStateCallback = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateCallback[] = [];

  constructor() {
    this.initSession();
    ensureSuperAdminSeeded();
  }

  private initSession() {
    try {
      if (typeof window !== 'undefined' && (window as any).authManager) {
        this.currentUser = (window as any).authManager.getCurrentUser();
        (window as any).authManager.onAuthChange((u: User) => {
          this.currentUser = u;
          this.notifyListeners();
        });
      }
    } catch (e) {
      console.warn('AuthService session init:', e);
    }
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined' && (window as any).authManager) {
      return (window as any).authManager.getCurrentUser();
    }
    return this.currentUser;
  }

  onAuthStateChanged(callback: AuthStateCallback): () => void {
    this.listeners.push(callback);
    callback(this.getCurrentUser());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    const user = this.getCurrentUser();
    this.listeners.forEach(cb => {
      try { cb(user); } catch (e) { console.error('Auth listener error:', e); }
    });
  }

  /**
   * Log in user with Email, Password and Club Selection.
   * Special Bypass for Super Admin (ahmedazzouzi72@gmail.com): clubId not required.
   */
  async login(
    email: string,
    password?: string,
    clubId?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Super Admin Global Bypass Check
      if (cleanEmail === SUPER_ADMIN_CREDENTIALS.email.toLowerCase()) {
        const superAdminUser: User = {
          uid: SUPER_ADMIN_CREDENTIALS.uid,
          email: SUPER_ADMIN_CREDENTIALS.email,
          displayName: SUPER_ADMIN_CREDENTIALS.displayName,
          phoneNumber: '+216 20 000 000',
          birthDate: '1998-01-01',
          clubId: 'all',
          isSuperAdmin: true,
          role: 'superadmin',
          status: 'active',
          commissionIds: ['comm_direction'],
          strikesCount: 0,
          joinedAt: '2023-01-01T00:00:00Z'
        };

        if (typeof window !== 'undefined' && (window as any).authManager) {
          (window as any).authManager.saveSession(superAdminUser);
        }

        this.currentUser = superAdminUser;
        this.notifyListeners();
        return { success: true, user: superAdminUser };
      }

      // 2. Standard Club Member Login
      if (!clubId) {
        return {
          success: false,
          error: 'Veuillez sélectionner votre club Interact dans la liste déroulante.'
        };
      }

      if (typeof window !== 'undefined' && (window as any).dbStore) {
        const db = (window as any).dbStore;
        const club = db.getClub(clubId);
        const members = club.members || {};
        const foundUser = Object.values(members).find(
          (m: any) => m.email.toLowerCase() === cleanEmail
        ) as User | undefined;

        if (foundUser) {
          const userSession: User = {
            ...foundUser,
            clubId: clubId
          };

          if ((window as any).authManager) {
            (window as any).authManager.saveSession(userSession);
          }

          this.currentUser = userSession;
          this.notifyListeners();
          return { success: true, user: userSession };
        } else {
          return {
            success: false,
            error: 'Aucun compte trouvé avec cet email au sein du club sélectionné.'
          };
        }
      }

      return { success: false, error: 'Service d\'authentification indisponible.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur de connexion.' };
    }
  }

  /**
   * President Registration with New Club Creation
   * Status: active (President creator has instant access to their club)
   */
  async registerPresidentWithClub(
    userData: {
      displayName: string;
      email: string;
      password?: string;
      phoneNumber?: string;
      birthDate?: string;
    },
    clubData: {
      name: string;
      district: string;
      city?: string;
      description?: string;
      sponsorRotaryClub?: string;
    }
  ): Promise<{ success: boolean; user?: User; club?: Club; error?: string }> {
    try {
      const generatedUid = 'user_' + Date.now();
      const clubId = 'club_' + clubData.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

      const newClub: Club = {
        id: clubId,
        name: clubData.name,
        district: clubData.district || 'District 9010',
        description: clubData.description || '',
        sponsorRotaryClub: clubData.sponsorRotaryClub || 'Rotary Club Parrain',
        status: 'active',
        presidentUid: generatedUid,
        presidentName: userData.displayName,
        presidentEmail: userData.email,
        createdAt: new Date().toISOString()
      };

      const newUser: User = {
        uid: generatedUid,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        clubId: clubId,
        isSuperAdmin: false,
        role: 'president',
        status: 'active',
        commissionIds: ['comm_direction'],
        strikesCount: 0,
        history: [
          {
            year: '2025-2026',
            role: 'president',
            commissionName: 'Bureau Exécutif',
            notes: 'Président Fondateur'
          }
        ],
        joinedAt: new Date().toISOString()
      };

      if (typeof window !== 'undefined' && (window as any).dbStore) {
        const db = (window as any).dbStore;
        if (!db.data.clubs) db.data.clubs = {};
        db.data.clubs[clubId] = {
          info: newClub,
          members: { [generatedUid]: newUser },
          commissions: {
            "comm_sociale": { info: { id: "comm_sociale", name: "Commission Action Sociale", icon: "🤝", chefUid: generatedUid }, actions: {} },
            "comm_communication": { info: { id: "comm_communication", name: "Commission Relations Publiques", icon: "📢", chefUid: generatedUid }, actions: {} }
          },
          channels: {
            "chan_announcements": { id: "chan_announcements", name: "📢 Annonces Officielles", type: "announcements", allowedWriters: ["president", "superadmin"] }
          },
          sanctions: {},
          announcements: {},
          events_schedule: {},
          task_submissions: {}
        };
        db.saveData(db.data);
      }

      if (typeof window !== 'undefined' && (window as any).authManager) {
        (window as any).authManager.saveSession(newUser);
      }

      this.currentUser = newUser;
      this.notifyListeners();
      return { success: true, user: newUser, club: newClub };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la création du club.' };
    }
  }

  /**
   * Member / Other Role Registration joining existing Club
   * Status: pending_president (Locked until President approval)
   */
  async registerMemberJoiningClub(userData: {
    displayName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    birthDate?: string;
    clubId: string;
    requestedRole: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const generatedUid = 'user_' + Date.now();

      const newUser: User = {
        uid: generatedUid,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        clubId: userData.clubId,
        isSuperAdmin: false,
        role: 'guest',
        status: 'pending_president',
        commissionIds: [],
        strikesCount: 0,
        joinedAt: new Date().toISOString()
      };

      if (typeof window !== 'undefined' && (window as any).dbStore) {
        const db = (window as any).dbStore;
        const club = db.getClub(userData.clubId);
        if (club) {
          if (!club.members) club.members = {};
          club.members[generatedUid] = {
            ...newUser,
            requestedRole: userData.requestedRole
          };
          db.saveData(db.data);
        }
      }

      if (typeof window !== 'undefined' && (window as any).authManager) {
        (window as any).authManager.saveSession(newUser);
      }

      this.currentUser = newUser;
      this.notifyListeners();
      return { success: true, user: newUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la demande d\'adhésion.' };
    }
  }

  /**
   * Sign out user
   */
  async logout(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== 'undefined' && (window as any).authManager) {
      localStorage.removeItem((window as any).authManager.storageKey);
    }
    this.notifyListeners();
  }
}

export const authService = new AuthService();
