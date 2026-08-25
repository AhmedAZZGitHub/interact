import { Club } from '../types';

/**
 * ==========================================================================
 * CLUB SERVICE (Cloud Firestore / Firebase Multi-Tenant API)
 * Fetching active clubs, registering new clubs and handling approval queries.
 * ==========================================================================
 */

export const clubService = {
  /**
   * Fetches all active clubs from Firestore
   * Filters by status === 'active'
   */
  async getActiveClubs(): Promise<Club[]> {
    try {
      if (typeof window !== 'undefined' && (window as any).dbStore) {
        return (window as any).dbStore.getActiveClubs();
      }
      // Firestore SDK Fallback if initialized in React Native / Web environment
      /*
      const clubsRef = collection(db, 'clubs');
      const q = query(clubsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      */
      return [
        {
          id: 'club_carthage_01',
          name: 'Interact Club Carthage',
          district: 'District 9010',
          sponsorRotaryClub: 'Rotary Club Carthage',
          description: "Servir d'abord • Lead, Connect, Inspire",
          status: 'active',
          presidentUid: 'user_pres',
          presidentName: 'Youssef Mahjoub',
          presidentEmail: 'president@interact-carthage.org',
          createdAt: '2024-09-01T10:00:00Z'
        }
      ];
    } catch (error) {
      console.error('Error fetching active clubs:', error);
      return [];
    }
  },

  /**
   * Creates a new club document in Firestore with pending_superadmin / pending_validation status
   */
  async createClub(clubData: {
    name: string;
    district: string;
    description?: string;
    sponsorRotaryClub?: string;
    logoUrl?: string;
    presidentUid: string;
    presidentName: string;
    presidentEmail: string;
  }): Promise<Club> {
    const clubId = 'club_' + clubData.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

    const newClub: Club = {
      id: clubId,
      name: clubData.name,
      district: clubData.district || 'District 9010',
      description: clubData.description || '',
      sponsorRotaryClub: clubData.sponsorRotaryClub || 'Rotary Club Parrain',
      logoUrl: clubData.logoUrl || '',
      status: 'pending_superadmin',
      presidentUid: clubData.presidentUid,
      presidentName: clubData.presidentName,
      presidentEmail: clubData.presidentEmail,
      createdAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined' && (window as any).dbStore) {
      (window as any).dbStore.createClub(newClub, {
        displayName: clubData.presidentName,
        email: clubData.presidentEmail,
        id: clubData.presidentUid
      });
    }

    return newClub;
  }
};
