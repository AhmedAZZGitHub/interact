import React, { useState, useEffect } from 'react';
import { Club, User } from '../types';
import { authService } from '../services/authService';
import { clubService } from '../services/clubService';
import { SUPER_ADMIN_CREDENTIALS } from '../services/seedSuperAdmin';

interface AuthScreenProps {
  onAuthSuccess?: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active Clubs from Firestore
  const [clubsList, setClubsList] = useState<Club[]>([]);

  // ================= 1. LOGIN FORM STATE =================
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSelectedClubId, setLoginSelectedClubId] = useState('');

  // Check if current login email is Super Admin
  const isSuperAdminLogin = loginEmail.trim().toLowerCase() === SUPER_ADMIN_CREDENTIALS.email.toLowerCase();

  // ================= 2. REGISTER FORM STATE =================
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [requestedRole, setRequestedRole] = useState('membre');

  // If role is President -> Option to Create New Club vs Join Existing
  const [isCreatingNewClub, setIsCreatingNewClub] = useState(false);

  // Join Existing Club State
  const [regSelectedClubId, setRegSelectedClubId] = useState('');

  // Create New Club State (President only)
  const [newClubName, setNewClubName] = useState('');
  const [newDistrict, setNewDistrict] = useState('District 9010');
  const [newCity, setNewCity] = useState('Tunis');
  const [newDescription, setNewDescription] = useState("Servir d'abord");
  const [newSponsorRotaryClub, setNewSponsorRotaryClub] = useState('');

  // Load Clubs on Mount
  useEffect(() => {
    const loadClubs = async () => {
      const clubs = await clubService.getActiveClubs();
      setClubsList(clubs);
      if (clubs.length > 0) {
        if (!loginSelectedClubId) setLoginSelectedClubId(clubs[0].id);
        if (!regSelectedClubId) setRegSelectedClubId(clubs[0].id);
      }
    };
    loadClubs();
  }, []);

  // Update creation toggle if role changes
  useEffect(() => {
    if (requestedRole !== 'president') {
      setIsCreatingNewClub(false);
    }
  }, [requestedRole]);

  // Quick fill Super Admin demo credentials helper
  const handleFillSuperAdmin = () => {
    setLoginEmail(SUPER_ADMIN_CREDENTIALS.email);
    setLoginPassword(SUPER_ADMIN_CREDENTIALS.defaultPassword);
  };

  // ================= HANDLE LOGIN =================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!loginEmail || !loginPassword) {
        throw new Error('Veuillez saisir votre adresse e-mail et mot de passe.');
      }

      const res = await authService.login(
        loginEmail,
        loginPassword,
        isSuperAdminLogin ? undefined : loginSelectedClubId
      );

      if (res.success && res.user) {
        if (onAuthSuccess) onAuthSuccess(res.user);
      } else {
        throw new Error(res.error || 'Identifiants invalides.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE REGISTER =================
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!displayName || !email || !password) {
        throw new Error('Veuillez renseigner tous les champs obligatoires.');
      }

      // Case 1: President creating a new Club
      if (requestedRole === 'president' && isCreatingNewClub) {
        if (!newClubName.trim()) {
          throw new Error('Veuillez saisir le nom officiel de votre nouveau club.');
        }

        const res = await authService.registerPresidentWithClub(
          { displayName, email, password, phoneNumber, birthDate },
          {
            name: newClubName,
            district: newDistrict,
            city: newCity,
            description: newDescription,
            sponsorRotaryClub: newSponsorRotaryClub
          }
        );

        if (res.success && res.user) {
          if (onAuthSuccess) onAuthSuccess(res.user);
        } else {
          throw new Error(res.error || 'Erreur lors de la création du club.');
        }
      } else {
        // Case 2: Member / Any role joining an existing Club
        if (!regSelectedClubId) {
          throw new Error('Veuillez sélectionner un club dans la liste déroulante.');
        }

        const res = await authService.registerMemberJoiningClub({
          displayName,
          email,
          password,
          phoneNumber,
          birthDate,
          clubId: regSelectedClubId,
          requestedRole
        });

        if (res.success && res.user) {
          if (onAuthSuccess) onAuthSuccess(res.user);
        } else {
          throw new Error(res.error || 'Erreur lors de l\'inscription.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur d\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        {/* Brand Banner */}
        <div style={styles.brandRow}>
          <div style={styles.brandLogo}>⚙️</div>
          <div>
            <h1 style={styles.brandTitle}>Interact Club Platform</h1>
            <span style={styles.brandSub}>Rotary International • Multi-Clubs</span>
          </div>
        </div>

        {/* Master Tabs (Connexion vs Inscription) */}
        <div style={styles.tabsBar}>
          <button
            type="button"
            style={{
              ...styles.tabItem,
              ...(tab === 'login' ? styles.tabItemActive : {})
            }}
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
          >
            🔑 Connexion (Sign In)
          </button>
          <button
            type="button"
            style={{
              ...styles.tabItem,
              ...(tab === 'register' ? styles.tabItemActive : {})
            }}
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
          >
            📝 Inscription (Sign Up)
          </button>
        </div>

        {errorMsg && <div style={styles.errorBanner}>🚨 {errorMsg}</div>}

        {/* ================= 1. TAB: SIGN IN ================= */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={styles.formContainer}>
            <div style={styles.formGroup}>
              <label style={styles.fieldLabel}>Adresse E-mail *</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="president@interact.org"
                style={styles.formInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.fieldLabel}>Mot de passe *</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.formInput}
              />
            </div>

            {/* Conditional Club Selector (Bypassed if Super Admin) */}
            {isSuperAdminLogin ? (
              <div style={styles.superAdminPill}>
                🛡️ <strong>Accès Super Admin Global Détecté :</strong> Bypass automatique de la sélection de club (Accès direct à tous les clubs).
              </div>
            ) : (
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Sélectionnez votre Club Interact *</label>
                <select
                  value={loginSelectedClubId}
                  onChange={e => setLoginSelectedClubId(e.target.value)}
                  style={styles.formSelect}
                  required
                >
                  {clubsList.map(c => (
                    <option key={c.id} value={c.id}>
                      🏛️ {c.name} ({c.district})
                    </option>
                  ))}
                  {clubsList.length === 0 && (
                    <option value="club_carthage_01">🏛️ Interact Club Carthage (District 9010)</option>
                  )}
                </select>
                <span style={styles.hintText}>
                  ℹ️ Sélectionnez le club auquel vous êtes rattaché.
                </span>
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.btnPrimary}>
              {loading ? 'Connexion en cours...' : '🔐 Se Connecter à mon Espace'}
            </button>

            {/* Quick Demo Credentials Footer */}
            <div style={styles.demoFooter}>
              <button
                type="button"
                style={styles.btnDemoSuperAdmin}
                onClick={handleFillSuperAdmin}
              >
                ⚡ Remplir Identifiants Super Admin (ahmedazzouzi72@gmail.com)
              </button>
            </div>
          </form>
        )}

        {/* ================= 2. TAB: SIGN UP ================= */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={styles.formContainer}>
            <h4 style={styles.sectionHeader}>1. Informations Personnelles</h4>

            <div style={styles.formGroup}>
              <label style={styles.fieldLabel}>Nom et Prénom *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ex: Youssef Mahjoub"
                style={styles.formInput}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@interact.org"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Mot de passe *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+216 98 123 456"
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Date de Naissance</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  style={styles.formInput}
                />
              </div>
            </div>

            {/* Role Selection Dropdown */}
            <div style={styles.formGroup}>
              <label style={styles.fieldLabel}>Poste Souhaité *</label>
              <select
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value)}
                style={styles.formSelect}
              >
                <option value="membre">🔹 Membre Actif</option>
                <option value="recrue">🌱 Recrue / Nouvel Adhérent</option>
                <option value="chef_commission">💼 Chef de Commission</option>
                <option value="co_chef">🤝 Co-Chef</option>
                <option value="secretaire">📋 Secrétaire</option>
                <option value="protocole">⚖️ Protocole</option>
                <option value="vice_president">⭐ Vice-Président</option>
                <option value="president">👑 Président</option>
              </select>
            </div>

            {/* Dynamic Section: Club Affiliation vs New Club Creation */}
            <h4 style={styles.sectionHeader}>2. Rattachement au Club</h4>

            {/* If role is President -> Toggle "Create New Club" */}
            {requestedRole === 'president' && (
              <div style={styles.presidentToggleBox}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    style={{
                      ...styles.toggleChoiceBtn,
                      ...(!isCreatingNewClub ? styles.toggleChoiceBtnActive : {})
                    }}
                    onClick={() => setIsCreatingNewClub(false)}
                  >
                    🏛️ Rejoindre un Club existant
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.toggleChoiceBtn,
                      ...(isCreatingNewClub ? styles.toggleChoiceBtnActive : {})
                    }}
                    onClick={() => setIsCreatingNewClub(true)}
                  >
                    ✨ Créer un nouveau Club
                  </button>
                </div>
              </div>
            )}

            {/* Mode A: Join Existing Club */}
            {!isCreatingNewClub && (
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Sélectionnez le Club à rejoindre *</label>
                <select
                  value={regSelectedClubId}
                  onChange={e => setRegSelectedClubId(e.target.value)}
                  style={styles.formSelect}
                  required
                >
                  {clubsList.map(c => (
                    <option key={c.id} value={c.id}>
                      🏛️ {c.name} ({c.district})
                    </option>
                  ))}
                  {clubsList.length === 0 && (
                    <option value="club_carthage_01">🏛️ Interact Club Carthage (District 9010)</option>
                  )}
                </select>
                <div style={styles.pendingNotice}>
                  📨 <strong>Approbation requise :</strong> Votre demande sera soumise au Président de ce club pour validation et attribution de commissions.
                </div>
              </div>
            )}

            {/* Mode B: Create New Club (President) */}
            {requestedRole === 'president' && isCreatingNewClub && (
              <div style={styles.newClubSubform}>
                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Nom Officiel du Club *</label>
                  <input
                    type="text"
                    required
                    value={newClubName}
                    onChange={e => setNewClubName(e.target.value)}
                    placeholder="Ex: Interact Club La Marsa"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>District Rotary</label>
                    <input
                      type="text"
                      value={newDistrict}
                      onChange={e => setNewDistrict(e.target.value)}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.fieldLabel}>Ville / Région</label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      placeholder="Ex: Tunis"
                      style={styles.formInput}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Rotary Club Parrain</label>
                  <input
                    type="text"
                    value={newSponsorRotaryClub}
                    onChange={e => setNewSponsorRotaryClub(e.target.value)}
                    placeholder="Ex: Rotary Club La Marsa"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.fieldLabel}>Devise & Description</label>
                  <textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Servir d'abord • Objectifs de mandat..."
                    style={{ ...styles.formInput, height: '55px', resize: 'vertical' }}
                  />
                </div>

                <div style={styles.instantAccessNotice}>
                  👑 <strong>Accès Immédiat :</strong> En tant que Président Fondateur, vous serez immédiatement redirigé vers l'accueil de votre nouveau club.
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.btnPrimary}>
              {loading
                ? 'Enregistrement en cours...'
                : isCreatingNewClub
                ? '🚀 Créer mon Club & Accéder'
                : '📨 Soumettre ma Demande d\'Adhésion'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
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
    maxWidth: '560px',
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  brandLogo: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#003366',
    border: '1px solid #F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem'
  },
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    margin: 0,
    color: '#FFFFFF'
  },
  brandSub: {
    fontSize: '0.75rem',
    color: '#94A3B8'
  },
  tabsBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    backgroundColor: '#0B1220',
    padding: '4px',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  tabItem: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '100px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  tabItemActive: {
    backgroundColor: '#003366',
    color: '#FFFFFF',
    border: '1px solid #F7A81B',
    boxShadow: '0 0 12px rgba(247, 168, 27, 0.25)'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: 1
  },
  row: {
    display: 'flex',
    gap: '10px'
  },
  fieldLabel: {
    fontSize: '0.74rem',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  formInput: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '0.88rem',
    outline: 'none'
  },
  formSelect: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '0.88rem',
    outline: 'none'
  },
  superAdminPill: {
    backgroundColor: 'rgba(247, 168, 27, 0.12)',
    border: '1px solid #F7A81B',
    color: '#F7A81B',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.78rem',
    lineHeight: 1.4
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #F7A81B, #D48806)',
    color: '#050B14',
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    fontWeight: 800,
    fontSize: '0.92rem',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 8px 20px rgba(247, 168, 27, 0.35)'
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.4)',
    color: '#FF3B30',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.82rem',
    marginBottom: '12px'
  },
  hintText: {
    fontSize: '0.72rem',
    color: '#64748B',
    marginTop: '2px'
  },
  sectionHeader: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#F7A81B',
    margin: '12px 0 6px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  presidentToggleBox: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '8px',
    marginBottom: '6px'
  },
  toggleChoiceBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  toggleChoiceBtnActive: {
    backgroundColor: '#003366',
    color: '#F7A81B',
    border: '1px solid #F7A81B'
  },
  pendingNotice: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
    color: '#00F0FF',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '0.76rem',
    marginTop: '6px',
    lineHeight: 1.4
  },
  newClubSubform: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#0B1220',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(247, 168, 27, 0.25)'
  },
  instantAccessNotice: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    border: '1px solid rgba(52, 199, 89, 0.35)',
    color: '#34C759',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.75rem',
    lineHeight: 1.4
  },
  demoFooter: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center'
  },
  btnDemoSuperAdmin: {
    background: 'none',
    border: 'none',
    color: '#F7A81B',
    fontSize: '0.74rem',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};
