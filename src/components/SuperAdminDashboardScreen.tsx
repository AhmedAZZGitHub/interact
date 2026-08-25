import React, { useState } from 'react';
import { Club, User } from '../types';

interface SuperAdminDashboardScreenProps {
  currentUser: User;
  clubs: (Club & { membersCount?: number; membersList?: User[] })[];
  onEnterClub?: (clubId: string) => void;
  onApproveClub: (clubId: string) => void;
  onSuspendClub: (clubId: string) => void;
  onActivateClub: (clubId: string) => void;
  onDeleteClub: (clubId: string) => void;
  onToggleUserStatus?: (userId: string, clubId: string, newStatus: 'active' | 'suspended') => void;
  onDeleteUser?: (userId: string, clubId: string) => void;
}

export const SuperAdminDashboardScreen: React.FC<SuperAdminDashboardScreenProps> = ({
  currentUser,
  clubs,
  onEnterClub,
  onApproveClub,
  onSuspendClub,
  onActivateClub,
  onDeleteClub,
  onToggleUserStatus,
  onDeleteUser
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubForMembers, setSelectedClubForMembers] = useState<(Club & { membersList?: User[] }) | null>(null);

  // Security Check: Only Super Admin
  if (!currentUser.isSuperAdmin && currentUser.role !== 'superadmin') {
    return (
      <div style={styles.accessDenied}>
        <h2>🚫 Accès Réservé au Super Admin</h2>
        <p>Vous devez posséder les privilèges de Super Admin Global pour accéder à cette interface de gestion multi-clubs.</p>
      </div>
    );
  }

  // Calculate Metrics
  const totalClubs = clubs.length;
  const activeClubs = clubs.filter(c => c.status === 'active').length;
  const pendingClubs = clubs.filter(c => c.status === 'pending_superadmin').length;
  const suspendedClubs = clubs.filter(c => c.status === 'suspended').length;
  const totalPlatformMembers = clubs.reduce((acc, c) => acc + (c.membersCount || 0), 0);

  // Filter Clubs
  const filteredClubs = clubs.filter(c => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending'
        ? c.status === 'pending_superadmin'
        : c.status === filterStatus;

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.presidentName && c.presidentName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.superBadgeIcon}>🛡️</div>
          <div>
            <h1 style={styles.pageTitle}>Portail d'Administration Globale (Super Admin)</h1>
            <p style={styles.pageSubtitle}>
              Supervision des Clubs Interact • District 9010 • Gestion des Comptes & Activations
            </p>
          </div>
        </div>
        <div style={styles.adminUserBadge}>
          <span>Connecté : <strong>{currentUser.displayName}</strong></span>
          <span style={styles.superAdminTag}>MASTER SUPER ADMIN</span>
        </div>
      </div>

      {/* KPI Platform Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Clubs Enregistrés</span>
          <span style={{ ...styles.kpiValue, color: '#F7A81B' }}>{totalClubs}</span>
          <span style={styles.kpiSub}>Plateforme Globale</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Clubs Actifs</span>
          <span style={{ ...styles.kpiValue, color: '#34C759' }}>{activeClubs}</span>
          <span style={styles.kpiSub}>En pleine activité</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Clubs en Attente</span>
          <span style={{ ...styles.kpiValue, color: '#FF9500' }}>{pendingClubs}</span>
          <span style={styles.kpiSub}>Validation requise</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Membres & Comptes</span>
          <span style={{ ...styles.kpiValue, color: '#00F0FF' }}>{totalPlatformMembers}</span>
          <span style={styles.kpiSub}>Utilisateurs actifs</span>
        </div>
      </div>

      {/* Controls Bar (Filter + Search) */}
      <div style={styles.controlsBar}>
        <div style={styles.filterGroup}>
          <button
            style={{ ...styles.filterBtn, ...(filterStatus === 'all' ? styles.filterBtnActive : {}) }}
            onClick={() => setFilterStatus('all')}
          >
            Tous ({totalClubs})
          </button>
          <button
            style={{ ...styles.filterBtn, ...(filterStatus === 'active' ? styles.filterBtnActive : {}) }}
            onClick={() => setFilterStatus('active')}
          >
            Actifs ({activeClubs})
          </button>
          <button
            style={{ ...styles.filterBtn, ...(filterStatus === 'pending' ? styles.filterBtnActive : {}) }}
            onClick={() => setFilterStatus('pending')}
          >
            En Attente ({pendingClubs})
          </button>
          <button
            style={{ ...styles.filterBtn, ...(filterStatus === 'suspended' ? styles.filterBtnActive : {}) }}
            onClick={() => setFilterStatus('suspended')}
          >
            Suspendus ({suspendedClubs})
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Rechercher un club ou un président..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Clubs List */}
      <div style={styles.clubsListContainer}>
        {filteredClubs.length === 0 ? (
          <div style={styles.emptyCard}>Aucun club ne correspond à vos critères de recherche.</div>
        ) : (
          filteredClubs.map(club => {
            const isActive = club.status === 'active';
            const isPending = club.status === 'pending_superadmin';
            const isSuspended = club.status === 'suspended';

            return (
              <div
                key={club.id}
                style={{
                  ...styles.clubCard,
                  borderColor: isPending
                    ? '#F7A81B'
                    : isSuspended
                    ? '#FF3B30'
                    : 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={styles.clubCardHeader}>
                  <div>
                    <div style={styles.clubTitleRow}>
                      <span style={styles.clubName}>{club.name}</span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: isActive
                            ? 'rgba(52, 199, 89, 0.15)'
                            : isPending
                            ? 'rgba(247, 168, 27, 0.15)'
                            : 'rgba(255, 59, 48, 0.15)',
                          color: isActive ? '#34C759' : isPending ? '#F7A81B' : '#FF3B30',
                          borderColor: isActive ? 'rgba(52, 199, 89, 0.4)' : isPending ? 'rgba(247, 168, 27, 0.4)' : 'rgba(255, 59, 48, 0.4)'
                        }}
                      >
                        {isActive ? '✓ ACTIF' : isPending ? '⏳ EN ATTENTE SUPER ADMIN' : '🚫 SUSPENDU'}
                      </span>
                    </div>

                    <div style={styles.clubMeta}>
                      <span>🏛️ {club.district}</span>
                      {club.sponsorRotaryClub && <span>• ⚙️ Parrain : {club.sponsorRotaryClub}</span>}
                      <span>• 👑 Président : {club.presidentName || 'N/A'} ({club.presidentEmail})</span>
                    </div>
                  </div>

                  {/* Member Count Pill */}
                  <div style={styles.memberCountPill}>
                    <span style={styles.memberCountNum}>{club.membersCount || 0}</span>
                    <span style={styles.memberCountLabel}>Comptes Membres</span>
                  </div>
                </div>

                {/* Card Action Buttons for Super Admin */}
                <div style={styles.clubCardActions}>
                  {/* Enter/Browse Club Workspace */}
                  <button
                    style={styles.btnEnterClub}
                    onClick={() => {
                      if (onEnterClub) onEnterClub(club.id);
                    }}
                  >
                    🚀 Entrer dans ce Club ➔
                  </button>

                  {/* View Members List Button */}
                  <button
                    style={styles.btnViewMembers}
                    onClick={() => setSelectedClubForMembers(club)}
                  >
                    👥 Gérer les Comptes ({club.membersCount || 0})
                  </button>

                  {/* Activation / Suspension / Deletion */}
                  {isPending && (
                    <button
                      style={styles.btnActivate}
                      onClick={() => onApproveClub(club.id)}
                    >
                      ✓ Valider & Activer Club
                    </button>
                  )}

                  {isActive && (
                    <button
                      style={styles.btnSuspend}
                      onClick={() => onSuspendClub(club.id)}
                    >
                      ⏸️ Suspendre le Club
                    </button>
                  )}

                  {isSuspended && (
                    <button
                      style={styles.btnActivate}
                      onClick={() => onActivateClub(club.id)}
                    >
                      ▶️ Réactiver le Club
                    </button>
                  )}

                  <button
                    style={styles.btnDelete}
                    onClick={() => {
                      if (confirm(`Êtes-vous certain de vouloir SUPPRIMER DÉFINITIVEMENT le club "${club.name}" ainsi que tous ses comptes associés ?`)) {
                        onDeleteClub(club.id);
                      }
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Member Management Modal */}
      {selectedClubForMembers && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedClubForMembers(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.1rem' }}>
                  👥 Comptes Membres : {selectedClubForMembers.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  Total : {selectedClubForMembers.membersList?.length || 0} comptes enregistrés
                </span>
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setSelectedClubForMembers(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.membersListModalBody}>
              {(!selectedClubForMembers.membersList || selectedClubForMembers.membersList.length === 0) ? (
                <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Aucun compte membre dans ce club.</p>
              ) : (
                selectedClubForMembers.membersList.map(member => (
                  <div key={member.uid || (member as any).id} style={styles.memberRowCard}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFF', fontSize: '0.9rem' }}>
                        {member.displayName}
                        <span style={styles.memberRoleBadge}>{member.role}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {member.email} {member.phoneNumber ? `• 📞 ${member.phoneNumber}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {member.status === 'active' ? (
                        <button
                          style={styles.btnSmallSuspend}
                          onClick={() => {
                            if (onToggleUserStatus) onToggleUserStatus(member.uid || (member as any).id, selectedClubForMembers.id, 'suspended');
                          }}
                        >
                          Suspendre
                        </button>
                      ) : (
                        <button
                          style={styles.btnSmallActivate}
                          onClick={() => {
                            if (onToggleUserStatus) onToggleUserStatus(member.uid || (member as any).id, selectedClubForMembers.id, 'active');
                          }}
                        >
                          Activer
                        </button>
                      )}

                      <button
                        style={styles.btnSmallDelete}
                        onClick={() => {
                          if (confirm(`Supprimer le compte de ${member.displayName} ?`)) {
                            if (onDeleteUser) onDeleteUser(member.uid || (member as any).id, selectedClubForMembers.id);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#F8FAFC'
  },
  accessDenied: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    border: '1px solid #FF3B30',
    borderRadius: '16px',
    padding: '30px',
    textAlign: 'center',
    color: '#FF3B30'
  },
  headerCard: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(247, 168, 27, 0.3)',
    borderRadius: '18px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  },
  superBadgeIcon: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    backgroundColor: '#003366',
    border: '2px solid #F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem'
  },
  pageTitle: { fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#FFF' },
  pageSubtitle: { fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' },
  adminUserBadge: {
    backgroundColor: '#0B1220',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: '0.8rem'
  },
  superAdminTag: {
    fontSize: '0.68rem',
    fontWeight: 800,
    color: '#F7A81B',
    letterSpacing: '0.5px'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    marginBottom: '20px'
  },
  kpiCard: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  kpiLabel: { fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 },
  kpiValue: { fontSize: '1.8rem', fontWeight: 800 },
  kpiSub: { fontSize: '0.72rem', color: '#64748B' },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#0B1220',
    padding: '4px',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  filterBtn: {
    padding: '8px 14px',
    borderRadius: '100px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  filterBtnActive: {
    backgroundColor: '#003366',
    color: '#F7A81B',
    border: '1px solid #F7A81B'
  },
  searchInput: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
    padding: '9px 18px',
    color: '#FFF',
    fontSize: '0.85rem',
    outline: 'none',
    minWidth: '280px'
  },
  clubsListContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  clubCard: {
    backgroundColor: '#131B2E',
    border: '1px solid',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
  },
  clubCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  clubTitleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  clubName: { fontSize: '1.15rem', fontWeight: 800, color: '#FFF' },
  statusBadge: {
    border: '1px solid',
    padding: '3px 10px',
    borderRadius: '100px',
    fontSize: '0.7rem',
    fontWeight: 800
  },
  clubMeta: { fontSize: '0.78rem', color: '#94A3B8', display: 'flex', gap: '8px', flexWrap: 'wrap' },
  memberCountPill: {
    backgroundColor: '#0B1220',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    borderRadius: '12px',
    padding: '8px 16px',
    textAlign: 'center'
  },
  memberCountNum: { fontSize: '1.2rem', fontWeight: 800, color: '#00F0FF', display: 'block' },
  memberCountLabel: { fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase' },
  clubCardActions: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '14px',
    flexWrap: 'wrap'
  },
  btnEnterClub: {
    background: 'linear-gradient(135deg, #003366, #001F3F)',
    border: '1px solid #F7A81B',
    color: '#F7A81B',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnViewMembers: {
    backgroundColor: '#003366',
    border: '1px solid rgba(0, 240, 255, 0.4)',
    color: '#00F0FF',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnActivate: {
    background: 'linear-gradient(135deg, #34C759, #28A745)',
    color: '#FFF',
    border: 'none',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnSuspend: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    border: '1px solid #FF9500',
    color: '#FF9500',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnDelete: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    border: '1px solid rgba(255, 59, 48, 0.4)',
    color: '#FF3B30',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '620px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#FFF',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },
  membersListModalBody: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  memberRowCard: {
    backgroundColor: '#0B1220',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  memberRoleBadge: {
    fontSize: '0.7rem',
    color: '#F7A81B',
    marginLeft: '8px',
    backgroundColor: 'rgba(247, 168, 27, 0.1)',
    padding: '2px 6px',
    borderRadius: '6px'
  },
  btnSmallActivate: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    border: '1px solid #34C759',
    color: '#34C759',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    cursor: 'pointer'
  },
  btnSmallSuspend: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    border: '1px solid #FF9500',
    color: '#FF9500',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    cursor: 'pointer'
  },
  btnSmallDelete: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid #FF3B30',
    color: '#FF3B30',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    cursor: 'pointer'
  },
  emptyCard: {
    backgroundColor: '#131B2E',
    padding: '30px',
    borderRadius: '14px',
    textAlign: 'center',
    color: '#94A3B8'
  }
};
