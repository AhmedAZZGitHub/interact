import React, { useState, useEffect } from 'react';
import { Club, User, ClubStatus, UserStatus } from '../types';

interface RegistrationScreenProps {
  onRegisterSuccess: (user: User, club?: Club) => void;
  activeClubs?: Club[];
  onNavigateLogin?: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  onRegisterSuccess,
  activeClubs = [],
  onNavigateLogin
}) => {
  const [mode, setMode] = useState<'join_club' | 'create_club'>('join_club');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<UserStatus | null>(null);

  // Common User Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Mode: Join Club
  const [selectedClubId, setSelectedClubId] = useState('');

  // Mode: Create Club (President)
  const [clubName, setClubName] = useState('');
  const [district, setDistrict] = useState('District 9010 (Tunisie, Algérie, Maroc, Mauritanie)');
  const [sponsorRotaryClub, setSponsorRotaryClub] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default selected club
  useEffect(() => {
    if (activeClubs.length > 0 && !selectedClubId) {
      setSelectedClubId(activeClubs[0].id);
    }
  }, [activeClubs, selectedClubId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (!displayName || !email || !password) {
        throw new Error('Veuillez remplir tous les champs obligatoires.');
      }

      const generatedUid = 'user_' + Date.now();

      if (mode === 'create_club') {
        if (!clubName) throw new Error('Veuillez renseigner le nom de votre club.');

        const generatedClubId = 'club_' + clubName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

        const newClub: Club = {
          id: generatedClubId,
          name: clubName,
          district: district,
          sponsorRotaryClub: sponsorRotaryClub || 'Rotary Club Parrain',
          logoUrl: logoUrl || '',
          description: clubDescription,
          status: 'pending_superadmin',
          presidentUid: generatedUid,
          presidentName: displayName,
          presidentEmail: email,
          createdAt: new Date().toISOString()
        };

        const newUser: User = {
          uid: generatedUid,
          email,
          displayName,
          phoneNumber,
          birthDate,
          clubId: generatedClubId,
          isSuperAdmin: false,
          role: 'president',
          status: 'pending_superadmin',
          commissionIds: [],
          strikesCount: 0,
          joinedAt: new Date().toISOString()
        };

        setIsSubmitted(true);
        setSubmittedStatus('pending_superadmin');
        onRegisterSuccess(newUser, newClub);
      } else {
        // Joining existing active club
        if (!selectedClubId) throw new Error('Veuillez sélectionner un club actif dans la liste.');

        const newUser: User = {
          uid: generatedUid,
          email,
          displayName,
          phoneNumber,
          birthDate,
          clubId: selectedClubId,
          isSuperAdmin: false,
          role: 'membre',
          status: 'pending_president',
          commissionIds: [],
          strikesCount: 0,
          joinedAt: new Date().toISOString()
        };

        setIsSubmitted(true);
        setSubmittedStatus('pending_president');
        onRegisterSuccess(newUser);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de votre inscription.');
    } finally {
      setLoading(false);
    }
  };

  // Pending Status Screen View
  if (isSubmitted) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconCircle}>
            {submittedStatus === 'pending_superadmin' ? '⏳' : '📨'}
          </div>
          <h2 style={styles.title}>
            {submittedStatus === 'pending_superadmin'
              ? 'Club en attente d\'approbation Super Admin'
              : 'Inscription en attente d\'approbation'}
          </h2>
          <p style={styles.subtitle}>
            {submittedStatus === 'pending_superadmin'
              ? 'Votre demande de création de club et votre compte Président ont été transmis au Super Admin de la plateforme. Vous recevrez une notification dès validation.'
              : 'Votre demande d\'adhésion a été transmise au Président de votre club. L\'accès complet à la plateforme sera déverrouillé après confirmation.'}
          </p>

          <div style={styles.infoBox}>
            <strong>Statut : </strong>
            <span style={{ color: '#F7A81B', fontWeight: 'bold' }}>
              {submittedStatus === 'pending_superadmin' ? 'Validation Plateforme en cours' : 'Validation Club en cours'}
            </span>
          </div>

          <button style={styles.primaryButton} onClick={onNavigateLogin}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <div style={styles.logoBadge}>⚙️</div>
          <div>
            <h1 style={styles.brandTitle}>Interact Club Platform</h1>
            <span style={styles.brandSubtitle}>Rotary International • District 9010</span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={styles.modeTabs}>
          <button
            type="button"
            style={{
              ...styles.modeTabBtn,
              ...(mode === 'join_club' ? styles.modeTabBtnActive : {})
            }}
            onClick={() => setMode('join_club')}
          >
            👤 Rejoindre un Club
          </button>
          <button
            type="button"
            style={{
              ...styles.modeTabBtn,
              ...(mode === 'create_club' ? styles.modeTabBtnActive : {})
            }}
            onClick={() => setMode('create_club')}
          >
            👑 Créer un Club (Président)
          </button>
        </div>

        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* User Personal Info */}
          <h3 style={styles.sectionHeading}>1. Informations Personnelles</h3>

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
                placeholder="president@interact.org"
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
              <label style={styles.label}>Date de naissance</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* Mode 1: Join Existing Club */}
          {mode === 'join_club' && (
            <>
              <h3 style={styles.sectionHeading}>2. Sélection du Club Interact</h3>
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
                    <option value="interact_carthage">Interact Club Carthage (District 9010)</option>
                  )}
                </select>
                <span style={styles.hintText}>
                  ℹ️ Votre compte sera actif dès approbation par le Président de votre club.
                </span>
              </div>
            </>
          )}

          {/* Mode 2: Create New Club (President) */}
          {mode === 'create_club' && (
            <>
              <h3 style={styles.sectionHeading}>2. Informations du Nouveau Club</h3>

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
                <label style={styles.label}>Description & Objectifs du Club</label>
                <textarea
                  value={clubDescription}
                  onChange={e => setClubDescription(e.target.value)}
                  placeholder="Présentation du club, ville, historique..."
                  style={{ ...styles.input, height: '70px', resize: 'vertical' }}
                />
              </div>

              <div style={styles.noticeBox}>
                🛡️ <strong>Approbation Super Admin :</strong> La création de nouveaux clubs est soumise à la vérification et validation par le Super Admin de la plateforme.
              </div>
            </>
          )}

          <button type="submit" disabled={loading} style={styles.primaryButton}>
            {loading ? 'Traitement en cours...' : mode === 'create_club' ? '🚀 Créer mon Club & Enregistrer' : '📨 Rejoindre le Club'}
          </button>
        </form>
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
    maxWidth: '560px',
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  logoBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#003366',
    border: '1px solid #F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem'
  },
  brandTitle: {
    fontSize: '1.15rem',
    fontWeight: 800,
    margin: 0,
    color: '#FFFFFF'
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: '#94A3B8'
  },
  modeTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    backgroundColor: '#0B1220',
    padding: '4px',
    borderRadius: '100px',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  modeTabBtn: {
    flex: 1,
    padding: '9px 14px',
    borderRadius: '100px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  modeTabBtnActive: {
    backgroundColor: '#003366',
    color: '#FFFFFF',
    border: '1px solid #F7A81B',
    boxShadow: '0 0 10px rgba(247, 168, 27, 0.25)'
  },
  sectionHeading: {
    fontSize: '0.88rem',
    fontWeight: 800,
    color: '#F7A81B',
    margin: '14px 0 10px 0',
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
  primaryButton: {
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
  errorAlert: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.4)',
    color: '#FF3B30',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.82rem',
    marginBottom: '12px'
  },
  noticeBox: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
    color: '#00F0FF',
    padding: '10px 12px',
    borderRadius: '10px',
    fontSize: '0.78rem',
    lineHeight: 1.4
  },
  hintText: {
    fontSize: '0.72rem',
    color: '#64748B',
    marginTop: '2px'
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(247, 168, 27, 0.15)',
    border: '2px solid #F7A81B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    margin: '0 auto 16px auto'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 1.5,
    marginBottom: '20px'
  },
  infoBox: {
    backgroundColor: '#0E172A',
    padding: '12px',
    borderRadius: '10px',
    textAlign: 'center',
    fontSize: '0.82rem',
    marginBottom: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  }
};
