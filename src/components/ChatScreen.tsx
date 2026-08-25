import React, { useState } from 'react';

export interface Channel {
  id: string;
  clubId: string;
  commissionId?: string;
  taskId?: string;
  name: string;
  type: 'announcements' | 'commission' | 'task_custom';
  allowedWriters: string[];
  meetUrl: string;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  attachments?: string[];
  reactions?: Record<string, string[]>; // { "👍": ["uid1", "uid2"] }
  createdAt: string;
}

export interface User {
  id: string;
  displayName: string;
  role: string;
  commissionId?: string;
}

interface ChatScreenProps {
  currentUser: User;
  channels: Channel[];
  activeChannel: Channel;
  messages: Message[];
  onSelectChannel: (channelId: string) => void;
  onSendMessage: (text: string, attachments?: string[]) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onCreateTaskSubGroup?: (name: string, taskId?: string) => void;
  onOpenMeet: (meetUrl: string, channelName: string) => void;
}

const EMOJI_LIST = ['👍', '❤️', '🔥', '🎉', '👀'];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  channels,
  activeChannel,
  messages,
  onSelectChannel,
  onSendMessage,
  onToggleReaction,
  onCreateTaskSubGroup,
  onOpenMeet,
}) => {
  const [inputText, setInputText] = useState('');
  const [isCreatingSubGroup, setIsCreatingSubGroup] = useState(false);
  const [subGroupName, setSubGroupName] = useState('');

  // RBAC Write Permission Check
  const isExecutiveBoard = ['president', 'vice_president', 'secretaire', 'protocole'].includes(
    currentUser.role
  );
  const canWrite =
    activeChannel.type !== 'announcements' || isExecutiveBoard;

  const canCreateSubGroups =
    isExecutiveBoard ||
    ['chef_commission', 'co_chef', 'representant'].includes(currentUser.role);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !canWrite) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="chat-screen-container">
      {/* Channels Sidebar / Selector */}
      <aside className="chat-channels-sidebar">
        <div className="channels-section-title">
          <span>💬 Canaux & Groupes</span>
          {canCreateSubGroups && (
            <button
              className="btn-create-subgroup"
              onClick={() => setIsCreatingSubGroup(true)}
              title="Créer un sous-groupe de tâche"
            >
              + Sous-groupe
            </button>
          )}
        </div>

        <ul className="channels-list">
          {channels.map((channel) => (
            <li
              key={channel.id}
              className={`channel-item ${
                channel.id === activeChannel.id ? 'active' : ''
              } type-${channel.type}`}
              onClick={() => onSelectChannel(channel.id)}
            >
              <span className="channel-icon">
                {channel.type === 'announcements'
                  ? '📢'
                  : channel.type === 'commission'
                  ? '👥'
                  : '🎯'}
              </span>
              <span className="channel-name">{channel.name}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Chat Conversation View */}
      <section className="chat-main-area">
        {/* Channel Header with Meet Button */}
        <header className="chat-header">
          <div className="chat-header-info">
            <h3>{activeChannel.name}</h3>
            <span className="chat-header-type">
              {activeChannel.type === 'announcements'
                ? 'Canal Officiel (Lecture réservée)'
                : activeChannel.type === 'commission'
                ? 'Espace Commission'
                : 'Sous-Groupe Projet'}
            </span>
          </div>

          <button
            className="btn-meet-launcher"
            onClick={() => onOpenMeet(activeChannel.meetUrl, activeChannel.name)}
          >
            📹 Rejoindre le Meet
          </button>
        </header>

        {/* Message Stream */}
        <div className="messages-stream">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`message-card ${isMe ? 'message-own' : 'message-other'}`}
              >
                <div className="message-meta">
                  <span className="message-author">{msg.senderName}</span>
                  <span className="message-role-tag">{msg.senderRole}</span>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="message-content">{msg.text}</div>

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="message-attachments">
                    {msg.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-chip"
                      >
                        📎 Livrable #{idx + 1}
                      </a>
                    ))}
                  </div>
                )}

                {/* Emoji Reaction Bar */}
                <div className="message-reactions-row">
                  {/* Current Active Reactions */}
                  {msg.reactions &&
                    Object.entries(msg.reactions).map(([emoji, uids]) => {
                      if (uids.length === 0) return null;
                      const hasReacted = uids.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          className={`reaction-badge ${hasReacted ? 'active' : ''}`}
                          onClick={() => onToggleReaction(msg.id, emoji)}
                        >
                          {emoji} {uids.length}
                        </button>
                      );
                    })}

                  {/* Add Quick Reaction Selector */}
                  <div className="quick-emoji-selector">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        className="emoji-btn"
                        onClick={() => onToggleReaction(msg.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar or Read-Only Notice */}
        <footer className="chat-input-footer">
          {canWrite ? (
            <form onSubmit={handleSend} className="chat-input-form">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Écrire dans ${activeChannel.name}...`}
                className="chat-input-field"
              />
              <button type="submit" className="chat-send-btn">
                ➤
              </button>
            </form>
          ) : (
            <div className="chat-readonly-banner">
              🔒 <strong>Canal Général en lecture seule :</strong> Seuls les membres du Bureau peuvent publier des annonces. Vous pouvez réagir avec les emojis ci-dessus !
            </div>
          )}
        </footer>
      </section>

      {/* Create Sub-Group Modal */}
      {isCreatingSubGroup && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>🎯 Nouveau Sous-Groupe de Tâche</h3>
            <p>Créez un salon de travail temporaire pour un projet spécifique.</p>
            <input
              type="text"
              placeholder="Ex: Équipe Sponsoring J-5, Créa Affiche..."
              value={subGroupName}
              onChange={(e) => setSubGroupName(e.target.value)}
              className="form-input"
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setIsCreatingSubGroup(false)}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (subGroupName.trim() && onCreateTaskSubGroup) {
                    onCreateTaskSubGroup(subGroupName.trim());
                    setSubGroupName('');
                    setIsCreatingSubGroup(false);
                  }
                }}
              >
                Créer le Sous-Groupe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
