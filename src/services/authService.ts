import { User, Club, UserRole, UserStatus } from '../types';
import { clubService } from './clubService';

/**
 * ==========================================================================
 * AUTH SERVICE (Firebase Auth + Cloud Firestore)
 * Multi-tenant authentication, registration dispatch, and real-time state.
 * ==========================================================================
 */

type AuthStateCallback = (user: User | null) => void;

class AuthService {
  private currentUser: User | null = null;
  private listeners: AuthStateCallback[] = [];

  constructor() {
    this.initSession();
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
   * Log in user with Email & Password
   */
  async login(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (typeof window !== 'undefined' && (window as any).authManager) {
        const res = (window as any).authManager.login(email, password);
        if (res.success) {
          this.currentUser = res.user;
          this.notifyListeners();
          return { success: true, user: res.user };
        } else {
          return { success: false, error: res.message || 'Identifiants invalides.' };
        }
      }

      return { success: false, error: 'Service d\'authentification indisponible.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur de connexion.' };
    }
  }

  /**
   * Register as President and create new Club (pending_superadmin)
   */
  async registerPresident(
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
      description?: string;
      sponsorRotaryClub?: string;
    }
  ): Promise<{ success: boolean; user?: User; club?: Club; error?: string }> {
    try {
      const generatedUid = 'user_' + Date.now();

      const newClub = await clubService.createClub({
        ...clubData,
        presidentUid: generatedUid,
        presidentName: userData.displayName,
        presidentEmail: userData.email
      });

      const newUser: User = {
        uid: generatedUid,
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        clubId: newClub.id,
        isSuperAdmin: false,
        role: 'president',
        status: 'pending_superadmin',
        commissionIds: [],
        strikesCount: 0,
        joinedAt: new Date().toISOString()
      };

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
   * Register as Member / Guest to join an existing active Club (pending_president)
   */
  async registerMember(userData: {
    displayName: string;
    email: string;
    password?: string;
    phoneNumber?: string;
    birthDate?: string;
    clubId: string;
    requestedRole?: string;
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

      if (typeof window !== 'undefined' && (window as any).authManager) {
        (window as any).authManager.joinExistingClub({
          ...newUser,
          role: 'membre'
        });
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
