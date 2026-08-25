import React, { useState } from 'react';
import { Sanction, SanctionSeverity, SanctionStatus, User } from '../types';

interface ProtocolScreenProps {
  sanctions: Sanction[];
  members: Record<string, User>;
  currentUser: User;
  onApproveSanction: (sanctionId: string, severity: SanctionSeverity, reviewNotes?: string) => void;
  onRejectSanction: (sanctionId: string, excuseReason: string) => void;
  onCreateManualSanction: (newSanction: Partial<Sanction>) => void;
}

export const ProtocolScreen: React.FC<ProtocolScreenProps> = ({
  sanctions,
  members,
  currentUser,
  onApproveSanction,
  onRejectSanction,
  onCreateManualSanction
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'create' | null>(null);

  // Modal Form State
  const [chosenSeverity, setChosenSeverity] = useState<SanctionSeverity>('sanction_legere');
  const [reviewNotes, setReviewNotes] = useState('');
  const [excuseReason, setExcuseReason] = useState('');

  // Manual Sanction State
  const [manualUserId, setManualUserId] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualSeverity, setManualSeverity] = useState<SanctionSeverity>('sanction_legere');

  const canModerate = ['president', 'vice_president', 'protocole', 'superadmin'].includes(currentUser.role);

  // Filter queues
  const pendingQueue = sanctions.filter(s => s.status === 'pending_review');
  const historyList = sanctions.filter(s => s.status !== 'pending_review');

  const openApproveModal = (s: Sanction) => {
    setSelectedSanction(s);
    setChosenSeverity(s.severity || 'sanction_legere');
    setReviewNotes('');
    setModalAction('approve');
  };

  const openRejectModal = (s: Sanction) => {
    setSelectedSanction(s);
    setExcuseReason('');
    setModalAction('reject');
  };

  const handleConfirmApprove = () => {
    if (!selectedSanction) return;
    onApproveSanction(selectedSanction.id, chosenSeverity, reviewNotes);
    setModalAction(null);
  };

  const handleConfirmReject = () => {
    if (!selectedSanction) return;
    onRejectSanction(selectedSanction.id, excuseReason);
    setModalAction(null);
  };

  const handleCreateManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId || !manualReason) return;

    onCreateManualSanction({
      userId: manualUserId,
      reason: manualReason,
      type: 'manquement_disciplinaire',
      status: 'approved',
      severity: manualSeverity,
      delayHours: 0,
      createdAt: new Date().toISOString()
    });

    setModalAction(null);
    setManualReason('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Membre,Type,Statut,Severite,Motif,Retard_Heures,Date'];
    const rows = sanctions.map(s => {
      const member = members[s.userId]?.displayName || s.userName || 'Inconnu';
      return `"${s.id}","${member}","${s.type}","${s.status}","${s.severity}","${s.reason.replace(/"/g, '""')}","${s.delayHours || 0}","${s.createdAt}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sanctions_interact_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.heroCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.heroTitle}>⚖️ Protocole & Discipline Officielle</h2>
            <p style={styles.heroSubtitle}>
              Arbitrage des manquements, retards automatiques et validation des excuses officielles.
            </p>
          </div>
          {canModerate && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={styles.btnSecondary} onClick={handleExportCSV}>
                📥 Exporter CSV
              </button>
              <button style={styles.btnPrimaryRed} onClick={() => setModalAction('create')}>
                ⚡ Sanction Manuelle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'queue' ? styles.tabBtnActive : {})
          }}
          onClick={() => setActiveTab('queue')}
        >
          🚨 File d'Attente d'Arbitrage ({pendingQueue.length})
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'history' ? styles.tabBtnActive : {})
          }}
          onClick={() => setActiveTab('history')}
        >
          📜 Registre & Historique Disciplinaire ({historyList.length})
        </button>
      </div>

      {/* 1. Pending Arbitrage Queue */}
      {activeTab === 'queue' && (
        <div style={styles.listContainer}>
          {pendingQueue.length === 0 ? (
            <div style={styles.emptyCard}>
              🕊️ Aucune sanction en attente d'arbitrage. La discipline du club est exemplaire.
            </div>
          ) : (
            pendingQueue.map(s => {
              const memberName = members[s.userId]?.displayName || s.userName || 'Membre';
              return (
                <div key={s.id} style={styles.sanctionCardPending}>
                  <div style={styles.cardHeaderRow}>
                    <div style={styles.memberInfoRow}>
                      <div style={styles.avatarCircle}>{memberName.charAt(0)}</div>
                      <div>
                        <h4 style={styles.memberName}>{memberName}</h4>
                        <span style={styles.actionRef}>
                          {s.type === 'tache_non_faite' ? '⏰ Tâche non réalisée après deadline' : '🏛️ Absence réunion'}
                        </span>
                      </div>
                    </div>
                    <span style={styles.pendingBadge}>⏳ En Attente de Décision</span>
                  </div>

                  <p style={styles.reasonText}>{s.reason}</p>

                  <div style={styles.metaRow}>
                    <span>📅 Constaté le {new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>⏱️ Retard calculé : <strong>{s.delayHours || 0}h</strong></span>
                  </div>

                  {canModerate && (
                    <div style={styles.actionsBar}>
                      <button style={styles.btnApprove} onClick={() => openApproveModal(s)}>
                        ✓ Accepter & Appliquer Sanction
                      </button>
                      <button style={styles.btnReject} onClick={() => openRejectModal(s)}>
                        🕊️ Refuser & Justifier Excuse
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. History Registry */}
      {activeTab === 'history' && (
        <div style={styles.listContainer}>
          {historyList.length === 0 ? (
            <div style={styles.emptyCard}>Aucune sanction archivée.</div>
          ) : (
            historyList.map(s => {
              const memberName = members[s.userId]?.displayName || s.userName || 'Membre';
              const isApproved = s.status === 'approved';
              const isExcused = s.status === 'excused' || s.status === 'rejected';

              return (
                <div
                  key={s.id}
                  style={{
                    ...styles.sanctionCardHistory,
                    borderLeft: isApproved ? '4px solid #FF3B30' : '4px solid #34C759'
                  }}
                >
                  <div style={styles.cardHeaderRow}>
                    <div style={styles.memberInfoRow}>
                      <div style={styles.avatarCircle}>{memberName.charAt(0)}</div>
                      <div>
                        <h4 style={styles.memberName}>{memberName}</h4>
                        <span style={styles.actionRef}>
                          {s.type === 'tache_non_faite' ? 'Tâche dépassée' : 'Protocole'}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.statusTag,
                        backgroundColor: isApproved ? 'rgba(255, 59, 48, 0.15)' : 'rgba(52, 199, 89, 0.15)',
                        color: isApproved ? '#FF3B30' : '#34C759',
                        borderColor: isApproved ? 'rgba(255, 59, 48, 0.4)' : 'rgba(52, 199, 89, 0.4)'
                      }}
                    >
                      {isApproved ? `⚡ ${s.severity.toUpperCase().replace('_', ' ')}` : '🕊️ EXCUSÉE / REFUSÉE'}
                    </span>
                  </div>

                  <p style={styles.reasonText}>{s.reason}</p>

                  {s.excuseReason && (
                    <div style={styles.excuseBox}>
                      📝 <strong>Justification de refus :</strong> {s.excuseReason} ({s.reviewedBy || 'Protocole'})
                    </div>
                  )}

                  <div style={styles.metaRow}>
                    <span>📅 Date : {new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>Arbitré par : <strong>{s.reviewedBy || 'Protocole Club'}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: Approve Sanction */}
      {modalAction === 'approve' && selectedSanction && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>⚖️ Valider la Sanction Protocole</h3>
            <p style={styles.modalDesc}>
              Sélectionnez la gradation de sévérité à appliquer au dossier de{' '}
              <strong>{members[selectedSanction.userId]?.displayName || selectedSanction.userName}</strong>.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gradation de la Sanction *</label>
              <select
                value={chosenSeverity}
                onChange={e => setChosenSeverity(e.target.value as SanctionSeverity)}
                style={styles.select}
              >
                <option value="avertissement">⚠️ Avertissement Officiel (Rappel au Règlement)</option>
                <option value="sanction_legere">⚠️ Sanction Légère (+1 Strike au profil)</option>
                <option value="sanction_lourde">⚡ Sanction Lourde (+2 Strikes / Suspension temporaire)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Commentaire / Décision Protocole</label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Rappels au règlement, impact sur la commission..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setModalAction(null)}>
                Annuler
              </button>
              <button style={styles.btnPrimaryRed} onClick={handleConfirmApprove}>
                ⚡ Confirmer & Appliquer la Sanction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject / Excuse Sanction */}
      {modalAction === 'reject' && selectedSanction && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>🕊️ Refuser la Sanction / Valider l'Excuse</h3>
            <p style={styles.modalDesc}>
              Annuler la sanction automatique pour{' '}
              <strong>{members[selectedSanction.userId]?.displayName || selectedSanction.userName}</strong>.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Motif officiel de l'exemption ou excuse justifiable *</label>
              <textarea
                required
                value={excuseReason}
                onChange={e => setExcuseReason(e.target.value)}
                placeholder="Ex: Certificat médical transmis au secrétariat, examen universitaire, impératif familial..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setModalAction(null)}>
                Annuler
              </button>
              <button style={styles.btnPrimaryGreen} onClick={handleConfirmReject}>
                🕊️ Valider l'Exemption
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Manual Sanction */}
      {modalAction === 'create' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>⚡ Appliquer une Sanction Manuelle</h3>
            <form onSubmit={handleCreateManualSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Membre concerné *</label>
                <select
                  required
                  value={manualUserId}
                  onChange={e => setManualUserId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Choisir un membre --</option>
                  {Object.values(members).map(m => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Gradation *</label>
                <select
                  value={manualSeverity}
                  onChange={e => setManualSeverity(e.target.value as SanctionSeverity)}
                  style={styles.select}
                >
                  <option value="avertissement">⚠️ Avertissement (0 Strike)</option>
                  <option value="sanction_legere">⚠️ Sanction Légère (1 Strike)</option>
                  <option value="sanction_lourde">⚡ Sanction Lourde (2 Strikes)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Motif du manquement disciplinaire *</label>
                <textarea
                  required
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                  placeholder="Ex: Retard répété aux réunions, non-respect du code protocolaire..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.btnSecondary} onClick={() => setModalAction(null)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnPrimaryRed}>
                  ⚡ Enregistrer la Sanction
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
  container: {
    padding: '20px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#F8FAFC',
    maxWidth: '960px',
    margin: '0 auto'
  },
  heroCard: {
    backgroundColor: 'rgba(19, 27, 46, 0.85)',
    border: '1px solid rgba(255, 59, 48, 0.35)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
  },
  heroTitle: { fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: '#FFF' },
  heroSubtitle: { fontSize: '0.82rem', color: '#94A3B8', margin: 0 },
  tabsRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
  tabBtn: {
    padding: '9px 18px',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: '#131B2E',
    color: '#94A3B8',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  tabBtnActive: {
    backgroundColor: '#003366',
    color: '#F7A81B',
    borderColor: '#F7A81B',
    boxShadow: '0 0 12px rgba(247, 168, 27, 0.3)'
  },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  emptyCard: {
    backgroundColor: '#131B2E',
    borderRadius: '14px',
    padding: '30px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '0.9rem',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  sanctionCardPending: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 149, 0, 0.35)',
    borderLeft: '4px solid #FF9500',
    borderRadius: '14px',
    padding: '18px 20px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
  },
  sanctionCardHistory: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '18px 20px'
  },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  memberInfoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarCircle: {
    width: '38px',
    height: '38px',
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
  memberName: { fontSize: '1rem', fontWeight: 800, margin: 0, color: '#FFF' },
  actionRef: { fontSize: '0.72rem', color: '#94A3B8' },
  pendingBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    color: '#FF9500',
    border: '1px solid rgba(255, 149, 0, 0.4)',
    padding: '3px 10px',
    borderRadius: '100px',
    fontSize: '0.72rem',
    fontWeight: 700
  },
  statusTag: {
    padding: '3px 10px',
    borderRadius: '100px',
    fontSize: '0.72rem',
    fontWeight: 700,
    border: '1px solid'
  },
  reasonText: { fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.45, margin: '0 0 10px 0' },
  excuseBox: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    border: '1px solid rgba(52, 199, 89, 0.3)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.78rem',
    color: '#34C759',
    marginBottom: '10px'
  },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' },
  actionsBar: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' },
  btnApprove: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    color: '#FF3B30',
    border: '1px solid rgba(255, 59, 48, 0.5)',
    padding: '7px 14px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.78rem',
    cursor: 'pointer'
  },
  btnReject: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    color: '#34C759',
    border: '1px solid rgba(52, 199, 89, 0.5)',
    padding: '7px 14px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.78rem',
    cursor: 'pointer'
  },
  btnPrimaryRed: {
    background: 'linear-gradient(135deg, #FF3B30, #D90429)',
    color: '#FFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  btnPrimaryGreen: {
    background: 'linear-gradient(135deg, #34C759, #28A745)',
    color: '#FFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
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
    maxWidth: '500px'
  },
  modalTitle: { fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: '#FFF' },
  modalDesc: { fontSize: '0.82rem', color: '#94A3B8', marginBottom: '16px', lineHeight: 1.4 },
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
  textarea: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px',
    color: '#FFF',
    fontSize: '0.85rem',
    minHeight: '70px'
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }
};
