import { User } from '../types';

/**
 * ==========================================================================
 * SUPER ADMIN SEEDING SERVICE
 * Platform Master Admin Initializer
 * Credentials: ahmedazzouzi72@gmail.com / ADMIN2027
 * ==========================================================================
 */

export const SUPER_ADMIN_CREDENTIALS = {
  email: 'ahmedazzouzi72@gmail.com',
  defaultPassword: 'ADMIN2027',
  uid: 'user_superadmin_ahmed',
  displayName: 'Ahmed Azzouzi (Super Admin)',
  role: 'superadmin' as const,
  isSuperAdmin: true,
  status: 'active' as const
};

export const ensureSuperAdminSeeded = async (): Promise<User> => {
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
    history: [
      {
        year: '2023-2027',
        role: 'superadmin',
        notes: 'Super Admin Fondateur Plateforme Interact'
      }
    ],
    joinedAt: '2023-01-01T00:00:00Z'
  };

  // Sync with DBStore if running in browser / live environment
  if (typeof window !== 'undefined' && (window as any).dbStore) {
    const db = (window as any).dbStore;
    const activeClub = db.getClub();
    if (activeClub && activeClub.members) {
      activeClub.members[SUPER_ADMIN_CREDENTIALS.uid] = superAdminUser;
      db.saveData(db.data);
    }
  }

  return superAdminUser;
};
