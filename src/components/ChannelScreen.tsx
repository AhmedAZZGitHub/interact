import React, { useState } from 'react';
import { Channel, Message, User, ChannelType } from '../types';

interface ChannelScreenProps {
  channels: Channel[];
  messages: Message[];
  currentUser: User;
  onSendMessage: (channelId: string, content: string) => void;
  onToggleReaction: (messageId: string, emoji: '👍' | '❤️' | '🔥' | '🎉' | '👀') => void;
  onCreateTaskSubGroup?: (commissionId: string, name: string) => void;
  onOpenVideoMeet?: (meetUrl: string, channelName: string) => void;
}

export const ChannelScreen: React.FC<ChannelScreenProps> = ({
  channels,
  messages,
  currentUser,
  onSendMessage,
  onToggleReaction,
  onCreateTaskSubGroup,
  onOpenVideoMeet
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id || 'announcements');
  const [inputText, setInputText] = useState('');
  const [isSubGroupModalOpen, setIsSubGroupModalOpen] = useState(false);
  const [newSubGroupName, setNewSubGroupName] = useState('');

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const isExecutiveBoard = ['president', 'vice_president', 'secretaire', 'protocole', 'superadmin'].includes(currentUser.role);
  const isChefOrCoChef = ['chef_commission', 'co_chef', 'president', 'vice_president', 'superadmin'].includes(currentUser.role);

  // Write permissions:
  // In announcements channel, only Executive Board can write
  const canWriteInActiveChannel =
    activeChannel?.type !== 'announcements' || isExecutiveBoard;

  const activeMessages = messages.filter(m => m.channelId === activeChannelId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !canWriteInActiveChannel) return;
    onSendMessage(activeChannelId, inputText.trim());
    setInputText('');
  };

  const handleStartMeet = () => {
    const meetUrl =
      activeChannel?.meetUrl ||
      `https://meet.jit.si/Interact_${activeChannel?.clubId || 'Club'}_${activeChannel?.id || 'General'}`;
    onOpenVideoMeet?.(meetUrl, activeChannel?.name || 'Visioconférence');
  };

  const handleCreateSubGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubGroupName.trim() || !activeChannel?.commissionId) return;
    onCreateTaskSubGroup?.(activeChannel.commissionId, newSubGroupName.trim());
    setIsSubGroupModalOpen(false);
    setNewSubGroupName('');
  };

  return (
    <div style={styles.layoutWrapper}>
      {/* 1. Left Channels Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>💬 Salons & Visio</h3>
          {isChefOrCoChef && activeChannel?.type === 'commission' && (
            <button
              style={styles.btnAddSubGroup}
              onClick={() => setIsSubGroupModalOpen(true)}
              title="Créer un mini-groupe de tâche"
            >
              + Sous-groupe
            </button>
          )}
        </div>

        <div style={styles.channelList}>
          {channels.map(c => {
            const isActive = c.id === activeChannelId;
            let icon = '💬';
            if (c.type === 'announcements') icon = '📢';
            if (c.type === 'commission') icon = '👥';
            if (c.type === 'task_custom') icon = '⚡';

            return (
              <div
                key={c.id}
                style={{
                  ...styles.channelItem,
                  ...(isActive ? styles.channelItemActive : {})
                }}
                onClick={() => setActiveChannelId(c.id)}
              >
                <span>{icon}</span>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Chat Workspace */}
      <div style={styles.chatArea}>
        {/* Header with Video Call Button */}
        <div style={styles.chatHeader}>
          <div>
            <h4 style={styles.channelTitle}>{activeChannel?.name}</h4>
            <span style={styles.channelSubtitle}>
              {activeChannel?.type === 'announcements'
                ? '📢 Canal Principal • Écriture réservée au Bureau Exécutif'
                : '👥 Espace de travail collaboratif de commission'}
            </span>
          </div>

          <button style={styles.btnMeet} onClick={handleStartMeet}>
            📹 Lancer / Rejoindre un Meet
          </button>
        </div>

        {/* Messages Stream */}
        <div style={styles.messagesStream}>
          {activeMessages.length === 0 ? (
            <div style={styles.emptyMessages}>
              Aucun message dans ce salon. Soyez le premier à engager la discussion !
            </div>
          ) : (
            activeMessages.map(msg => {
              const isOwn = msg.senderId === currentUser.uid;
              const reactions = msg.reactions || {};

              return (
                <div
                  key={msg.id}
                  style={{
                    ...styles.msgRow,
                    justifyContent: isOwn ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      ...styles.msgBubble,
                      backgroundColor: isOwn ? 'rgba(0, 51, 102, 0.7)' : '#0E172A',
                      borderColor: isOwn ? 'rgba(247, 168, 27, 0.3)' : 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {/* Author Meta */}
                    <div style={styles.msgMeta}>
                      <span style={styles.msgAuthor}>{msg.senderName}</span>
                      <span style={styles.msgRole}>• {msg.senderRole}</span>
                      <span style={styles.msgTime}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <p style={styles.msgText}>{msg.content}</p>

                    {/* Reactions Bar */}
                    <div style={styles.reactionsBar}>
                      {(['👍', '❤️', '🔥', '🎉', '👀'] as const).map(emoji => {
                        const uids = reactions[emoji] || [];
                        const hasReacted = uids.includes(currentUser.uid);
                        const count = uids.length;

                        return (
                          <button
                            key={emoji}
                            style={{
                              ...styles.reactionBtn,
                              ...(hasReacted ? styles.reactionBtnActive : {})
                            }}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span style={styles.reactionCount}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Footer or Lock Notice */}
        <div style={styles.inputFooter}>
          {canWriteInActiveChannel ? (
            <form onSubmit={handleSend} style={styles.inputForm}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={`Envoyer un message dans #${activeChannel?.name}...`}
                style={styles.chatInput}
              />
              <button type="submit" style={styles.sendBtn}>
                ➤
              </button>
            </form>
          ) : (
            <div style={styles.lockNotice}>
              🔒 <strong>Canal Officiel d'Annonces :</strong> Seuls les membres du Bureau Exécutif (Président, VP, Secrétaire, Protocole) peuvent publier. Vous pouvez interagir via les réactions emojis.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Create Task Sub-Group */}
      {isSubGroupModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>⚡ Créer un Mini-Groupe de Tâche</h3>
            <p style={styles.modalDesc}>
              Ce sous-groupe de discussion permettra à l'équipe assignée de collaborer spécifiquement sur un projet.
            </p>

            <form onSubmit={handleCreateSubGroupSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Intitulé du Sous-Groupe *</label>
                <input
                  type="text"
                  required
                  value={newSubGroupName}
                  onChange={e => setNewSubGroupName(e.target.value)}
                  placeholder="Ex: Équipe Sponsoring Couvertures J-5"
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.btnSecondary} onClick={() => setIsSubGroupModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.btnPrimaryGold}>
                  + Créer le Sous-Groupe
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
  layoutWrapper: {
    display: 'flex',
    height: 'calc(100vh - 120px)',
    backgroundColor: '#131B2E',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#0B1220',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sidebarTitle: { fontSize: '0.95rem', fontWeight: 800, color: '#FFF', margin: 0 },
  btnAddSubGroup: {
    backgroundColor: 'rgba(247, 168, 27, 0.15)',
    color: '#F7A81B',
    border: '1px solid rgba(247, 168, 27, 0.4)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.68rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  channelList: { flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  channelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 12px',
    borderRadius: '8px',
    color: '#94A3B8',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  channelItemActive: {
    backgroundColor: 'rgba(0, 51, 102, 0.6)',
    color: '#F7A81B',
    borderLeft: '3px solid #F7A81B',
    fontWeight: 700
  },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#131B2E' },
  chatHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 18, 36, 0.4)'
  },
  channelTitle: { fontSize: '1rem', fontWeight: 800, color: '#FFF', margin: '0 0 2px 0' },
  channelSubtitle: { fontSize: '0.72rem', color: '#94A3B8' },
  btnMeet: {
    background: 'linear-gradient(135deg, #00C853, #009624)',
    color: '#FFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '100px',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 200, 83, 0.35)'
  },
  messagesStream: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  emptyMessages: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: '0.85rem',
    marginTop: '40px'
  },
  msgRow: { display: 'flex' },
  msgBubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid'
  },
  msgMeta: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', marginBottom: '4px' },
  msgAuthor: { fontWeight: 800, color: '#FFF' },
  msgRole: { color: '#F7A81B', fontSize: '0.68rem' },
  msgTime: { color: '#64748B', marginLeft: 'auto' },
  msgText: { fontSize: '0.88rem', color: '#F8FAFC', lineHeight: 1.45, margin: '0 0 8px 0' },
  reactionsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
  },
  reactionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '100px',
    padding: '2px 6px',
    fontSize: '0.72rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    color: '#94A3B8'
  },
  reactionBtnActive: {
    backgroundColor: 'rgba(247, 168, 27, 0.2)',
    borderColor: '#F7A81B',
    color: '#F7A81B'
  },
  reactionCount: { fontSize: '0.68rem', fontWeight: 700 },
  inputFooter: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0E172A'
  },
  inputForm: { display: 'flex', gap: '10px' },
  chatInput: {
    flex: 1,
    backgroundColor: '#131B2E',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
    padding: '10px 18px',
    color: '#FFF',
    fontSize: '0.88rem',
    outline: 'none'
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #F7A81B, #D48806)',
    border: 'none',
    color: '#050B14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    cursor: 'pointer'
  },
  lockNotice: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    border: '1px solid rgba(255, 149, 0, 0.3)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '0.78rem',
    color: '#FF9500',
    textAlign: 'center',
    lineHeight: 1.4
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
  modalInput: {
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
