import React from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface PendingApprovalScreenProps {
  currentUser: User;
  onRefreshStatus?: () => void;
  onLogout?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  currentUser,
  onRefreshStatus,
  onLogout
}) => {
  const isSuperAdminPending = currentUser.status === 'pending_superadmin';
  const isPresidentPending = currentUser.status === 'pending_president';
  const isRejected = currentUser.status === 'rejected';

  const handleLogout = async () => {
    await authService.logout();
    if (onLogout) onLogout();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Animated Icon Badge */}
        <div
          style={{
            ...styles.iconCircle,
            borderColor: isRejected ? '#FF3B30' : isSuperAdminPending ? '#F7A81B' : '#00F0FF',
            backgroundColor: isRejected
              ? 'rgba(255, 59, 48, 0.15)'
              : isSuperAdminPending
              ? 'rgba(247, 168, 27, 0.15)'
              : 'rgba(0, 240, 255, 0.15)'
          }}
        >
          {isRejected ? '🚫' : isSuperAdminPending ? '👑' : '📨'}
        </div>

        {/* Title */}
        <h2 style={styles.title}>
          {isRejected
            ? 'Demande d\'adhésion non retenue'
            : isSuperAdminPending
            ? 'Club en attente d\'approbation Super Admin'
            : 'Adhésion en attente de validation Président'}
        </h2>

        {/* User identification badge */}
        <div style={styles.userBadge}>
          <span style={styles.userName}>{currentUser.displayName}</span>
          <span style={styles.userEmail}>({currentUser.email})</span>
        </div>

        {/* Detailed Explanation */}
        <p style={styles.description}>
          {isRejected
            ? 'Votre demande n\'a pas pu être validée par les administrateurs du club. Veuillez contacter directement le bureau pour plus d\'informations.'
            : isSuperAdminPending
            ? 'Votre demande de création de Club Interact et votre compte Président officiel sont en cours d\'examen par le Super Admin de la plateforme. L\'accès complet à votre espace sera automatiquement activé dès validation.'
            : 'Votre demande d\'adhésion a été transmise au Président et au Secrétaire de votre club Interact. Vous recevrez l\'attribution de votre poste et l\'accès à vos commissions dès approbation.'}
        </p>

        {/* Stepper Progress Card */}
        {!isRejected && (
          <div style={styles.stepsContainer}>
            <div style={styles.stepItem}>
              <div style={styles.stepDotCompleted}>✓</div>
              <div style={styles.stepText}>
                <strong>1. Inscription soumise</strong>
                <span>Compte créé avec succès</span>
              </div>
            </div>
            <div style={styles.stepDivider} />
            <div style={styles.stepItem}>
              <div style={styles.stepDotCurrent}>⏳</div>
              <div style={styles.stepText}>
                <strong>2. Examen officiel</strong>
                <span>
                  {isSuperAdminPending
                    ? 'Vérification charte Rotary & District'
                    : 'Attribution de poste par le Président'}
                </span>
              </div>
            </div>
            <div style={styles.stepDivider} />
            <div style={styles.stepItem}>
              <div style={styles.stepDotPending}>3</div>
              <div style={styles.stepText}>
                <strong>3. Activation Plateforme</strong>
                <span>Déverrouillage instantané des canaux & tâches</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Status Pill */}
        <div style={styles.statusPillBox}>
          <span style={styles.statusPillLabel}>Statut actuel :</span>
          <span
            style={{
              ...styles.statusPillValue,
              color: isRejected ? '#FF3B30' : '#F7A81B'
            }}
          >
            {isRejected
              ? '❌ REJETÉ'
              : isSuperAdminPending
              ? '⏳ EN ATTENTE SUPER ADMIN'
              : '⏳ EN ATTENTE PRÉSIDENT'}
          </span>
        </div>

        {/* Actions */}
        <div style={styles.actionsRow}>
          <button style={styles.btnRefresh} onClick={onRefreshStatus}>
            🔄 Vérifier le statut
          </button>
          <button style={styles.btnLogout} onClick={handleLogout}>
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#070D1A',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#F8FAFC'
  },
  card: {
    width: '100%',
    maxWidth: '540px',
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '32px 28px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
    textAlign: 'center'
  },
  iconCircle: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    margin: '0 auto 18px auto'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#FFFFFF',
    margin: '0 0 10px 0'
  },
  userBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0B1220',
    padding: '5px 14px',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '16px'
  },
  userName: {
    fontWeight: 700,
    fontSize: '0.82rem',
    color: '#F7A81B'
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#94A3B8'
  },
  description: {
    fontSize: '0.85rem',
    color: '#94A3B8',
    lineHeight: 1.55,
    margin: '0 0 24px 0'
  },
  stepsContainer: {
    backgroundColor: '#0B1220',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '14px',
    padding: '16px 20px',
    textAlign: 'left',
    marginBottom: '20px'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  stepDivider: {
    width: '2px',
    height: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '4px 0 4px 13px'
  },
  stepDotCompleted: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#34C759',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 800
  },
  stepDotCurrent: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#003366',
    border: '1px solid #F7A81B',
    color: '#F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem'
  },
  stepDotPending: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#1E293B',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700
  },
  stepText: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.78rem',
    color: '#CBD5E1'
  },
  statusPillBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0E172A',
    padding: '10px 16px',
    borderRadius: '12px',
    marginBottom: '22px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  statusPillLabel: {
    fontSize: '0.76rem',
    color: '#94A3B8'
  },
  statusPillValue: {
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '0.5px'
  },
  actionsRow: {
    display: 'flex',
    gap: '10px'
  },
  btnRefresh: {
    flex: 1,
    background: 'linear-gradient(135deg, #003366, #001F3F)',
    border: '1px solid #F7A81B',
    color: '#F7A81B',
    padding: '11px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  btnLogout: {
    flex: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    border: '1px solid rgba(255, 59, 48, 0.35)',
    color: '#FF3B30',
    padding: '11px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer'
  }
};
