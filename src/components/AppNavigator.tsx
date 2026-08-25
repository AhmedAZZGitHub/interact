import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { AuthScreen } from './AuthScreen';
import { PendingApprovalScreen } from './PendingApprovalScreen';
import { HRDirectoryScreen } from './HRDirectoryScreen';
import { ProtocolScreen } from './ProtocolScreen';
import { ChannelScreen } from './ChannelScreen';

interface AppNavigatorProps {
  // Optional child renderer or slot for the main tab application
  renderMainApp?: (user: User) => React.ReactNode;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ renderMainApp }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'channels' | 'protocol' | 'hr' | 'profile'>('home');

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user: User | null) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>⚙️</div>
        <p style={styles.loadingText}>Initialisation Interact Club Platform...</p>
      </div>
    );
  }

  // 1. Not Authenticated -> AuthScreen (Login / Registration)
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  // 2. Authenticated but Pending Approval -> PendingApprovalScreen
  if (
    currentUser.status === 'pending_superadmin' ||
    currentUser.status === 'pending_president' ||
    currentUser.status === 'rejected'
  ) {
    return (
      <PendingApprovalScreen
        currentUser={currentUser}
        onRefreshStatus={() => {
          const fresh = authService.getCurrentUser();
          setCurrentUser(fresh);
        }}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // 3. User is Active -> Render Main Application
  if (renderMainApp) {
    return <>{renderMainApp(currentUser)}</>;
  }

  // Default SPA / React Native View Shell with Bottom Navigation
  return (
    <div style={styles.mainShell}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={styles.headerLogo}>⚙️</span>
          <div>
            <h3 style={styles.headerClubName}>Interact Club Carthage</h3>
            <span style={styles.headerDistrict}>District 9010</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={styles.rolePill}>{currentUser.role.toUpperCase()}</span>
          <button
            style={styles.avatarButton}
            onClick={() => setActiveTab('profile')}
            title="Mon Profil & Paramètres"
          >
            {currentUser.displayName.charAt(0)}
          </button>
        </div>
      </header>

      {/* Workspace Viewport */}
      <main style={styles.viewport}>
        {activeTab === 'home' && (
          <div style={styles.homeCard}>
            <h2 style={{ color: '#FFF', margin: '0 0 8px 0' }}>👋 Bienvenue, {currentUser.displayName}</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Vous êtes connecté avec le rôle <strong>{currentUser.role}</strong>.
            </p>
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <span style={styles.statNum}>10</span>
                <span style={styles.statLabel}>Membres</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNum}>3</span>
                <span style={styles.statLabel}>Actions en cours</span>
              </div>
              <div style={styles.statBox}>
                <span style={{ ...styles.statNum, color: '#34C759' }}>0</span>
                <span style={styles.statLabel}>Retards</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <ChannelScreen
            channels={[
              { id: 'announcements', clubId: currentUser.clubId, name: '📢 Annonces Officielles', type: 'announcements', allowedWriters: ['president'], createdById: 'admin', createdAt: '' },
              { id: 'comm_sociale', clubId: currentUser.clubId, name: '👥 Action Sociale', type: 'commission', allowedWriters: ['all'], createdById: 'admin', createdAt: '' }
            ]}
            messages={[]}
            currentUser={currentUser}
            onSendMessage={() => {}}
            onToggleReaction={() => {}}
          />
        )}

        {activeTab === 'protocol' && (
          <ProtocolScreen
            sanctions={[]}
            members={{ [currentUser.uid]: currentUser }}
            currentUser={currentUser}
            onApproveSanction={() => {}}
            onRejectSanction={() => {}}
            onCreateManualSanction={() => {}}
          />
        )}

        {activeTab === 'hr' && (
          <HRDirectoryScreen
            members={[currentUser]}
            commissions={[]}
            currentUser={currentUser}
            onUpdateMemberRole={() => {}}
          />
        )}

        {activeTab === 'profile' && (
          <div style={styles.homeCard}>
            <h3 style={{ color: '#FFF', marginBottom: '12px' }}>⚙️ Mon Profil & Paramètres</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Email : {currentUser.email}</p>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Rôle : {currentUser.role}</p>
            <button
              style={{ ...styles.btnPrimaryRed, marginTop: '16px' }}
              onClick={async () => {
                await authService.logout();
                setCurrentUser(null);
              }}
            >
              🚪 Se Déconnecter
            </button>
          </div>
        )}
      </main>

      {/* Bottom Tab Navigation Bar */}
      <nav style={styles.bottomNav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'home' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('home')}
        >
          <span>🏠</span>
          <span style={styles.navLabel}>Accueil</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'channels' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('channels')}
        >
          <span>💬</span>
          <span style={styles.navLabel}>Canaux</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'protocol' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('protocol')}
        >
          <span>⚖️</span>
          <span style={styles.navLabel}>Protocole</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'hr' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('hr')}
        >
          <span>👥</span>
          <span style={styles.navLabel}>RH</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'profile' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('profile')}
        >
          <span>⚙️</span>
          <span style={styles.navLabel}>Profil</span>
        </button>
      </nav>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070D1A',
    color: '#F8FAFC',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  spinner: { fontSize: '2.5rem', animation: 'spin 2s linear infinite', marginBottom: '14px' },
  loadingText: { fontSize: '0.88rem', color: '#94A3B8' },
  mainShell: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#070D1A',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#F8FAFC'
  },
  header: {
    height: '60px',
    backgroundColor: '#0B1220',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerLogo: { fontSize: '1.4rem', color: '#F7A81B' },
  headerClubName: { fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#FFF' },
  headerDistrict: { fontSize: '0.7rem', color: '#94A3B8' },
  rolePill: {
    backgroundColor: 'rgba(247, 168, 27, 0.15)',
    color: '#F7A81B',
    border: '1px solid rgba(247, 168, 27, 0.35)',
    padding: '3px 8px',
    borderRadius: '100px',
    fontSize: '0.7rem',
    fontWeight: 700
  },
  avatarButton: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#003366',
    border: '2px solid #F7A81B',
    color: '#FFF',
    fontWeight: 800,
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewport: { flex: 1, padding: '20px', maxWidth: '1080px', margin: '0 auto', width: '100%', paddingBottom: '80px' },
  homeCard: {
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '18px' },
  statBox: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '14px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  statNum: { fontSize: '1.4rem', fontWeight: 800, color: '#F7A81B' },
  statLabel: { fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase' },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#0B1220',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 100
  },
  navBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    padding: '6px 0'
  },
  navBtnActive: { color: '#F7A81B', fontWeight: 700 },
  navLabel: { fontSize: '0.68rem' },
  btnPrimaryRed: {
    background: 'linear-gradient(135deg, #FF3B30, #D90429)',
    color: '#FFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer'
  }
};
