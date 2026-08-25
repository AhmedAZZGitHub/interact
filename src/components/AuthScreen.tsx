import React, { useState, useEffect } from 'react';
import { Club, User } from '../types';
import { authService } from '../services/authService';
import { clubService } from '../services/clubService';

interface AuthScreenProps {
  onAuthSuccess?: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [registerOption, setRegisterOption] = useState<'join_club' | 'create_club'>('join_club');

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Clubs for Dropdown
  const [activeClubs, setActiveClubs] = useState<Club[]>([]);

  // Form Fields: Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form Fields: Common User Info
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Form Fields: Option 1 (President / Create Club)
  const [clubName, setClubName] = useState('');
  const [district, setDistrict] = useState('District 9010');
  const [sponsorRotaryClub, setSponsorRotaryClub] = useState('');
  const [clubDescription, setClubDescription] = useState('');

  // Form Fields: Option 2 (Join Club)
  const [selectedClubId, setSelectedClubId] = useState('');
  const [requestedRole, setRequestedRole] = useState('membre');

  // Load Active Clubs
  useEffect(() => {
    const fetchClubs = async () => {
      const clubs = await clubService.getActiveClubs();
      setActiveClubs(clubs);
      if (clubs.length > 0 && !selectedClubId) {
        setSelectedClubId(clubs[0].id);
      }
    };
    fetchClubs();
  }, []);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!loginEmail || !loginPassword) {
        throw new Error('Veuillez renseigner votre email et mot de passe.');
      }

      const res = await authService.login(loginEmail, loginPassword);
      if (res.success && res.user) {
        if (onAuthSuccess) onAuthSuccess(res.user);
      } else {
        throw new Error(res.error || 'Email ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!displayName || !email || !password) {
        throw new Error('Veuillez remplir tous les champs obligatoires.');
      }

      if (registerOption === 'create_club') {
        if (!clubName.trim()) {
          throw new Error('Veuillez saisir le nom officiel de votre club.');
        }

        const res = await authService.registerPresident(
          { displayName, email, password, phoneNumber, birthDate },
          { name: clubName, district, description: clubDescription, sponsorRotaryClub }
        );

        if (res.success && res.user) {
          if (onAuthSuccess) onAuthSuccess(res.user);
        } else {
          throw new Error(res.error || 'Erreur lors de la création du club.');
        }
      } else {
        // Joining existing club
        if (!selectedClubId) {
          throw new Error('Veuillez sélectionner un club actif dans la liste.');
        }

        const res = await authService.registerMember({
          displayName,
          email,
          password,
          phoneNumber,
          birthDate,
          clubId: selectedClubId,
          requestedRole
        });

        if (res.success && res.user) {
          if (onAuthSuccess) onAuthSuccess(res.user);
        } else {
          throw new Error(res.error || 'Erreur lors de l\'envoi de votre demande.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Pour réinitialiser votre mot de passe, un lien a été envoyé à votre adresse email (ou contactez le secrétariat de votre club).');
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.authCard}>
        {/* Brand Banner */}
        <div style={styles.brandBanner}>
          <div style={styles.rotaryGear}>⚙️</div>
          <div>
            <h1 style={styles.brandTitle}>Interact Club Platform</h1>
            <span style={styles.brandSubtitle}>Rotary International • District 9010</span>
          </div>
        </div>

        {/* Master Tabs (Se connecter vs S'inscrire) */}
        <div style={styles.tabsContainer}>
          <button
            type="button"
            style={{
              ...styles.tabButton,
              ...(tab === 'login' ? styles.tabButtonActive : {})
            }}
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
          >
            🔑 Se connecter
          </button>
          <button
            type="button"
            style={{
              ...styles.tabButton,
              ...(tab === 'register' ? styles.tabButtonActive : {})
            }}
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
          >
            📝 S'inscrire
          </button>
        </div>

        {errorMsg && <div style={styles.alertError}>🚨 {errorMsg}</div>}
        {successMsg && <div style={styles.alertSuccess}>✅ {successMsg}</div>}

        {/* ================= 1. TAB: LOGIN ================= */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Adresse Email Officielle *</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="president@interact-carthage.org"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mot de passe *</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </div>

            <div style={styles.forgotPasswordRow}>
              <span style={styles.forgotPasswordLink} onClick={handleForgotPassword}>
                Mot de passe oublié ?
              </span>
            </div>

            <button type="submit" disabled={loading} style={styles.btnPrimaryGold}>
              {loading ? 'Connexion en cours...' : '🔐 Se Connecter à mon Espace'}
            </button>
          </form>
        )}

        {/* ================= 2. TAB: REGISTER ================= */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            {/* Interactive Register Path Selector */}
            <div style={styles.registerOptionSelector}>
              <button
                type="button"
                style={{
                  ...styles.registerOptionBtn,
                  ...(registerOption === 'join_club' ? styles.registerOptionBtnActive : {})
                }}
                onClick={() => setRegisterOption('join_club')}
              >
                👤 Rejoindre un Club
              </button>
              <button
                type="button"
                style={{
                  ...styles.registerOptionBtn,
                  ...(registerOption === 'create_club' ? styles.registerOptionBtnActive : {})
                }}
                onClick={() => setRegisterOption('create_club')}
              >
                👑 Créer un Club (Président)
              </button>
            </div>

            {/* User Personal Info Header */}
            <h4 style={styles.sectionHeader}>1. Informations Personnelles</h4>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nom et Prénom *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ex: Youssef Mahjoub"
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Adresse Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@interact.org"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mot de passe *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+216 98 123 456"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date de Naissance</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Option 1: Create New Club (President) */}
            {registerOption === 'create_club' && (
              <>
                <h4 style={styles.sectionHeader}>2. Informations du Nouveau Club</h4>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom Officiel du Club *</label>
                  <input
                    type="text"
                    required
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                    placeholder="Ex: Interact Club Carthage"
                    style={styles.input}
                  />
                </div>

                <div style={styles.row}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>District Rotary</label>
                    <input
                      type="text"
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Rotary Club Parrain</label>
                    <input
                      type="text"
                      value={sponsorRotaryClub}
                      onChange={e => setSponsorRotaryClub(e.target.value)}
                      placeholder="Ex: Rotary Club Carthage"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Devise / Description du Club</label>
                  <textarea
                    value={clubDescription}
                    onChange={e => setClubDescription(e.target.value)}
                    placeholder="Servir d'abord • Objectifs de mandat..."
                    style={{ ...styles.input, height: '60px', resize: 'vertical' }}
                  />
                </div>

                <div style={styles.noticeSuperAdmin}>
                  🛡️ <strong>Validation Super Admin requise :</strong> Votre club et compte Président seront soumis à l'approbation du Super Admin de la plateforme.
                </div>
              </>
            )}

            {/* Option 2: Join Existing Club (Member) */}
            {registerOption === 'join_club' && (
              <>
                <h4 style={styles.sectionHeader}>2. Rattachement au Club</h4>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Sélectionnez votre Club Actif *</label>
                  <select
                    value={selectedClubId}
                    onChange={e => setSelectedClubId(e.target.value)}
                    style={styles.select}
                    required
                  >
                    {activeClubs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district})
                      </option>
                    ))}
                    {activeClubs.length === 0 && (
                      <option value="club_carthage_01">Interact Club Carthage (District 9010)</option>
                    )}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Poste / Statut souhaité</label>
                  <select
                    value={requestedRole}
                    onChange={e => setRequestedRole(e.target.value)}
                    style={styles.select}
                  >
                    <option value="membre">🔹 Membre Actif</option>
                    <option value="recrue">🌱 Recrue / Nouvel Adhérent</option>
                    <option value="chef_commission">💼 Chef de Commission</option>
                    <option value="co_chef">🤝 Co-Chef</option>
                    <option value="secretaire">📋 Secrétaire</option>
                    <option value="protocole">⚖️ Protocole</option>
                  </select>
                </div>

                <div style={styles.noticePresident}>
                  📨 <strong>Validation Président requise :</strong> Votre compte sera placé en attente jusqu'à l'approbation officielle par le Président de votre club.
                </div>
              </>
            )}

            <button type="submit" disabled={loading} style={styles.btnPrimaryGold}>
              {loading
                ? 'Traitement en cours...'
                : registerOption === 'create_club'
                ? '🚀 Créer mon Club & Soumettre au Super Admin'
                : '📨 Envoyer ma Demande d\'Adhésion'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#070D1A',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#F8FAFC'
  },
  authCard: {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)'
  },
  brandBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  rotaryGear: {
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
  brandSubtitle: {
    fontSize: '0.75rem',
    color: '#94A3B8'
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    backgroundColor: '#0B1220',
    padding: '4px',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  tabButton: {
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
  tabButtonActive: {
    backgroundColor: '#003366',
    color: '#FFFFFF',
    border: '1px solid #F7A81B',
    boxShadow: '0 0 12px rgba(247, 168, 27, 0.25)'
  },
  registerOptionSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    backgroundColor: '#0E172A',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  registerOptionBtn: {
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
  registerOptionBtnActive: {
    backgroundColor: '#003366',
    color: '#F7A81B',
    border: '1px solid #F7A81B'
  },
  sectionHeader: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#F7A81B',
    margin: '12px 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  form: {
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
  label: {
    fontSize: '0.74rem',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '0.88rem',
    outline: 'none'
  },
  select: {
    backgroundColor: '#0E172A',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '0.88rem',
    outline: 'none'
  },
  forgotPasswordRow: {
    textAlign: 'right',
    marginTop: '-4px'
  },
  forgotPasswordLink: {
    fontSize: '0.75rem',
    color: '#F7A81B',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  btnPrimaryGold: {
    background: 'linear-gradient(135deg, #F7A81B, #D48806)',
    color: '#050B14',
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    fontWeight: 800,
    fontSize: '0.92rem',
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '0 8px 20px rgba(247, 168, 27, 0.35)'
  },
  alertError: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.4)',
    color: '#FF3B30',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.82rem',
    marginBottom: '12px'
  },
  alertSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    border: '1px solid rgba(52, 199, 89, 0.4)',
    color: '#34C759',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.82rem',
    marginBottom: '12px'
  },
  noticeSuperAdmin: {
    backgroundColor: 'rgba(247, 168, 27, 0.08)',
    border: '1px solid rgba(247, 168, 27, 0.3)',
    color: '#F7A81B',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '0.76rem',
    lineHeight: 1.4
  },
  noticePresident: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
    color: '#00F0FF',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '0.76rem',
    lineHeight: 1.4
  }
};
