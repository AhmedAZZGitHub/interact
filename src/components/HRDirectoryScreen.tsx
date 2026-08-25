import React, { useState } from 'react';
import { User, UserRole, Commission } from '../types';

interface HRDirectoryScreenProps {
  members: User[];
  commissions: Commission[];
  currentUser: User;
  onUpdateMemberRole: (userId: string, newRole: UserRole, commissionIds: string[]) => void;
  onApprovePendingMember?: (userId: string) => void;
  onRejectPendingMember?: (userId: string) => void;
}

export const HRDirectoryScreen: React.FC<HRDirectoryScreenProps> = ({
  members,
  commissions,
  currentUser,
  onUpdateMemberRole,
  onApprovePendingMember,
  onRejectPendingMember
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole>('membre');
  const [editingCommissionId, setEditingCommissionId] = useState<string>('');

  const canManageHR = ['president', 'vice_president', 'secretaire', 'superadmin'].includes(currentUser.role);

  // Filter pending vs active
  const pendingMembers = members.filter(m => m.status === 'pending_president');
  const activeMembers = members.filter(m => m.status === 'active' || !m.status);

  // Search & Role filtering
  const filteredActiveMembers = activeMembers.filter(m => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phoneNumber && m.phoneNumber.includes(searchTerm));
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openEditModal = (member: User) => {
    setSelectedMember(member);
    setEditingRole(member.role);
    setEditingCommissionId(member.commissionIds?.[0] || '');
    setIsEditModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    onUpdateMemberRole(
      selectedMember.uid,
      editingRole,
      editingCommissionId ? [editingCommissionId] : []
    );
    setIsEditModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Nom,Email,Telephone,Role,Date_Naissance,Strikes,Taches_Faites,Taches_Retard,Date_Adhesion'];
    const rows = activeMembers.map(m => {
      return `"${m.displayName}","${m.email}","${m.phoneNumber || 'N/A'}","${m.role}","${m.birthDate || 'N/A'}","${m.strikesCount || 0}","${m.stats?.tasksCompleted || 0}","${m.stats?.tasksOverdue || 0}","${m.joinedAt}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `membres_interact_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for WhatsApp click
  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  return (
    <div style={styles.container}>
      {/* Top Header Card */}
      <div style={styles.heroCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={styles.heroTitle}>👥 Annuaire Officiel & Ressources Humaines</h2>
            <p style={styles.heroSubtitle}>
              Fiches membres complètes, coordonnées directes, suivi des mandats et affectation aux commissions.
            </p>
          </div>
          {canManageHR && (
            <button style={styles.btnExport} onClick={handleExportCSV}>
              📥 Exporter Annuaire (CSV / Excel)
            </button>
          )}
        </div>
      </div>

      {/* Pending Members Approval Banner (President / Secretary) */}
      {canManageHR && pendingMembers.length > 0 && (
        <div style={styles.pendingCard}>
          <h3 style={styles.pendingTitle}>
            🔔 Demandes d'adhésion en attente ({pendingMembers.length})
          </h3>
          <p style={styles.pendingSubtitle}>
            Ces utilisateurs ont demandé à rejoindre votre club et attendent votre validation.
          </p>

          <div style={styles.pendingGrid}>
            {pendingMembers.map(m => (
              <div key={m.uid} style={styles.pendingItem}>
                <div style={styles.avatarCircle}>{m.displayName.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#FFF' }}>{m.displayName}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{m.email} • {m.phoneNumber || 'Sans tel'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    style={styles.btnApproveMember}
                    onClick={() => onApprovePendingMember?.(m.uid)}
                  >
                    ✓ Approuver
                  </button>
                  <button
                    style={styles.btnRejectMember}
                    onClick={() => onRejectPendingMember?.(m.uid)}
                  >
                    ✕ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Rechercher par nom, email ou numéro de téléphone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={styles.roleSelectFilter}
        >
          <option value="all">Tous les Rôles</option>
          <option value="president">👑 Président</option>
          <option value="vice_president">VP</option>
          <option value="secretaire">Secrétaire</option>
          <option value="protocole">Protocole</option>
          <option value="chef_commission">Chef de Commission</option>
          <option value="membre">Membre</option>
          <option value="recrue">Recrue</option>
        </select>
      </div>

      {/* Members Directory Grid */}
      <div style={styles.grid}>
        {filteredActiveMembers.map(m => {
          const comm = commissions.find(c => m.commissionIds?.includes(c.id));
          const strikes = m.strikesCount || 0;

          return (
            <div key={m.uid} style={styles.memberCard}>
              <div style={styles.memberCardTop}>
                <div style={styles.avatarCircleLg}>
                  {m.photoURL ? (
                    <img src={m.photoURL} alt={m.displayName} style={styles.avatarImg} />
                  ) : (
                    m.displayName.charAt(0)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={styles.memberName}>{m.displayName}</h4>
                  <div style={styles.roleBadgeRow}>
                    <span style={styles.roleBadge}>{m.role.toUpperCase().replace('_', ' ')}</span>
                    <span style={styles.commBadge}>📁 {comm ? comm.name : 'Direction'}</span>
                  </div>
                </div>
                {/* Discipline Strike Pill */}
                <span
                  style={{
                    ...styles.strikesBadge,
                    backgroundColor: strikes > 0 ? 'rgba(255, 59, 48, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                    color: strikes > 0 ? '#FF3B30' : '#34C759',
                    borderColor: strikes > 0 ? 'rgba(255, 59, 48, 0.4)' : 'rgba(52, 199, 89, 0.4)'
                  }}
                >
                  {strikes === 0 ? '0 Strike' : `⚡ ${strikes} Strike${strikes > 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Contact and Direct Communication Action Buttons */}
              <div style={styles.contactRow}>
                <span style={styles.contactItem}>📧 {m.email}</span>
                {m.birthDate && <span style={styles.contactItem}>🎂 {m.birthDate}</span>}
              </div>

              {m.phoneNumber && (
                <div style={styles.quickContactButtons}>
                  <a href={`tel:${m.phoneNumber}`} style={styles.callBtn}>
                    📞 Appeler ({m.phoneNumber})
                  </a>
                  <a
                    href={getWhatsAppLink(m.phoneNumber)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.whatsappBtn}
                  >
                    💬 WhatsApp Direct
                  </a>
                </div>
              )}

              {/* Mandate History */}
              {m.history && m.history.length > 0 && (
                <div style={styles.historyBox}>
                  <div style={styles.historyTitle}>📜 Historique des Mandats :</div>
                  {m.history.map((h, i) => (
                    <div key={i} style={styles.historyItem}>
                      • <strong>{h.year} :</strong> {h.role} ({h.commissionName || 'Club'})
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              {canManageHR && (
                <div style={styles.cardFooter}>
                  <button style={styles.btnEditRole} onClick={() => openEditModal(m)}>
                    ✏️ Modifier Poste & Commission
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Edit Member Role & Commission */}
      {isEditModalOpen && selectedMember && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>📋 Attribution Rôle & Commission</h3>
            <p style={styles.modalDesc}>
              Modification du statut officiel de <strong>{selectedMember.displayName}</strong>.
            </p>

            <form onSubmit={handleSaveRole}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rôle au sein du Club *</label>
                <select
                  value={editingRole}
                  onChange={e => setEditingRole(e.target.value as UserRole)}
                  style={styles.select}
                >
                  <option value="president">👑 Président</option>
                  <option value="vice_president">Vice-Président</option>
                  <option value="secretaire">Secrétaire</option>
                  <option value="protocole">Responsable Protocole</option>
                  <option value="chef_commission">Chef de Commission</option>
                  <option value="co_chef">Co-Chef de Commission</option>
                  <option value="representant">Représentant Comités Séminaires</option>
                  <option value="membre">Membre Actif</option>
                  <option value="recrue">Recrue</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Commission de Rattachement</label>
                <select
                  value={editingCommissionId}
                  onChange={e => setEditingCommissionId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Aucune / Direction Club --</option>
                  {commissions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.btnSecondary} onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnPrimaryGold}>
                  💾 Sauvegarder Droits RH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', maxWidth: '1020px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  heroCard: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(247, 168, 27, 0.35)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '20px'
  },
  heroTitle: { fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: '#FFF' },
  heroSubtitle: { fontSize: '0.82rem', color: '#94A3B8', margin: 0 },
  btnExport: {
    backgroundColor: '#003366',
    color: '#F7A81B',
    border: '1px solid #F7A81B',
    padding: '9px 16px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  pendingCard: {
    backgroundColor: 'rgba(247, 168, 27, 0.08)',
    border: '1px solid rgba(247, 168, 27, 0.35)',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '20px'
  },
  pendingTitle: { fontSize: '1rem', fontWeight: 800, color: '#F7A81B', margin: '0 0 4px 0' },
  pendingSubtitle: { fontSize: '0.78rem', color: '#CBD5E1', marginBottom: '14px' },
  pendingGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pendingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#131B2E',
    padding: '10px 14px',
    borderRadius: '10px'
  },
  btnApproveMember: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    color: '#34C759',
    border: '1px solid rgba(52, 199, 89, 0.4)',
    padding: '5px 12px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  btnRejectMember: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    color: '#FF3B30',
    border: '1px solid rgba(255, 59, 48, 0.4)',
    padding: '5px 12px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '0.75rem',
    cursor: 'pointer'
  },
  toolbar: { display: 'flex', gap: '10px', marginBottom: '16px' },
  searchInput: {
    flex: 1,
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFF',
    fontSize: '0.85rem'
  },
  roleSelectFilter: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px',
    color: '#FFF',
    fontSize: '0.85rem'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' },
  memberCard: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '18px 20px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  memberCardTop: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarCircleLg: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: '#003366',
    border: '2px solid #F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#FFF',
    fontSize: '1.1rem',
    overflow: 'hidden'
  },
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#003366',
    border: '2px solid #F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#FFF',
    fontSize: '0.9rem'
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  memberName: { fontSize: '1rem', fontWeight: 800, color: '#FFF', margin: '0 0 3px 0' },
  roleBadgeRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  roleBadge: { fontSize: '0.68rem', color: '#F7A81B', fontWeight: 700 },
  commBadge: { fontSize: '0.68rem', color: '#94A3B8' },
  strikesBadge: { padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid' },
  contactRow: { display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem', color: '#94A3B8' },
  contactItem: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  quickContactButtons: { display: 'flex', gap: '8px', marginTop: '4px' },
  callBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    color: '#00F0FF',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center'
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    color: '#34C759',
    border: '1px solid rgba(52, 199, 89, 0.4)',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center'
  },
  historyBox: { backgroundColor: '#0B1220', borderRadius: '8px', padding: '8px 10px', fontSize: '0.72rem' },
  historyTitle: { fontWeight: 700, color: '#F7A81B', marginBottom: '3px' },
  historyItem: { color: '#94A3B8' },
  cardFooter: { paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' },
  btnEditRole: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#FFF',
    padding: '6px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(247, 168, 27, 0.35)',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '460px'
  },
  modalTitle: { fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: '0 0 6px 0' },
  modalDesc: { fontSize: '0.82rem', color: '#94A3B8', marginBottom: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '0.74rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' },
  select: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px',
    color: '#FFF',
    fontSize: '0.85rem'
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#FFF',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  btnPrimaryGold: {
    background: 'linear-gradient(135deg, #F7A81B, #D48806)',
    color: '#050B14',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 800,
    fontSize: '0.82rem',
    cursor: 'pointer'
  }
};
