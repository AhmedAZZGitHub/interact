/**
 * ==========================================================================
 * CHANNELS & REALTIME COLLABORATIVE MESSAGING (WITH MEET & EMOJI REACTIONS)
 * Channels: General Announcements, Commission Spaces & Task Sub-Groups
 * ==========================================================================
 */

const EMOJI_LIST = ['👍', '❤️', '🔥', '🎉', '👀'];

class ChannelsManager {
  constructor() {
    this.activeChannelId = 'chan_general';
    this.container = null;
    this.sidebarContainer = null;
    this.messagesContainer = null;
  }

  init() {
    this.container = document.getElementById('view-channels');
    this.render();

    // Subscribe to DB changes
    if (window.dbStore) {
      window.dbStore.subscribe(() => {
        if (window.app && window.app.currentTab === 'channels') {
          this.render();
        }
      });
    }
  }

  setActiveChannel(channelId) {
    this.activeChannelId = channelId;
    this.render();
  }

  render() {
    if (!this.container || !window.dbStore) return;

    const club = window.dbStore.getClub();
    const channels = club.channels || {};
    const currentUser = window.authManager.getCurrentUser();
    const activeChannel = channels[this.activeChannelId] || channels['chan_general'] || Object.values(channels)[0];
    if (!activeChannel) return;

    this.activeChannelId = activeChannel.id;
    const messages = window.dbStore.getMessages(activeChannel.id);
    const sortedMessages = Object.values(messages).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Permission checks
    const isExecutiveBoard = ['president', 'vice_president', 'secretaire', 'protocole'].includes(currentUser.role);
    const canWrite = activeChannel.type !== 'announcements' || isExecutiveBoard;
    const canCreateSubGroup = isExecutiveBoard || ['chef_commission', 'co_chef', 'representant'].includes(currentUser.role);

    // 1. Render Channels List Navigation
    let channelsListHtml = '';
    Object.values(channels).forEach(ch => {
      const isActive = ch.id === activeChannel.id;
      let icon = '🎯';
      if (ch.type === 'announcements') icon = '📢';
      else if (ch.type === 'commission') icon = '🤝';

      channelsListHtml += `
        <div class="channel-nav-item ${isActive ? 'active' : ''} type-${ch.type}" onclick="window.channelsManager.setActiveChannel('${ch.id}')">
          <span class="channel-icon">${icon}</span>
          <span class="channel-name-text">${ch.name}</span>
        </div>
      `;
    });

    // 2. Render Messages Stream
    let messagesHtml = '';
    if (sortedMessages.length === 0) {
      messagesHtml = `
        <div class="empty-messages-notice">
          <p>💬 Début de la conversation dans <strong>${activeChannel.name}</strong>.</p>
          <p style="font-size:0.75rem; color:var(--text-dim);">Soyez le premier à envoyer un message ou à lancer un Meet !</p>
        </div>
      `;
    } else {
      sortedMessages.forEach(msg => {
        const isMe = msg.senderId === currentUser.id;
        const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderRoleLabel = window.ROLE_LABELS[msg.senderRole] || msg.senderRole;

        // Render Reactions
        let reactionsHtml = '';
        if (msg.reactions) {
          Object.entries(msg.reactions).forEach(([emoji, uids]) => {
            if (uids.length > 0) {
              const hasReacted = uids.includes(currentUser.id);
              reactionsHtml += `
                <button class="reaction-pill ${hasReacted ? 'active' : ''}" onclick="window.channelsManager.handleToggleReaction('${activeChannel.id}', '${msg.id}', '${emoji}')">
                  <span>${emoji}</span>
                  <span class="reaction-count">${uids.length}</span>
                </button>
              `;
            }
          });
        }

        // Quick Emoji Selector
        let emojiPickerHtml = '';
        EMOJI_LIST.forEach(em => {
          emojiPickerHtml += `
            <button class="emoji-picker-btn" onclick="window.channelsManager.handleToggleReaction('${activeChannel.id}', '${msg.id}', '${em}')" title="Réagir avec ${em}">
              ${em}
            </button>
          `;
        });

        // Attachments
        let attachmentsHtml = '';
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att, idx) => {
            attachmentsHtml += `
              <a href="${att}" target="_blank" rel="noreferrer" class="msg-attachment-link">
                📎 Livrable #${idx + 1}
              </a>
            `;
          });
        }

        messagesHtml += `
          <div class="chat-msg-row ${isMe ? 'own' : 'other'}">
            <div class="chat-msg-bubble">
              <div class="chat-msg-meta">
                <span class="chat-msg-author">${msg.senderName}</span>
                <span class="chat-msg-role">${senderRoleLabel}</span>
                <span class="chat-msg-time">${timeStr}</span>
              </div>
              <div class="chat-msg-text">${msg.text}</div>
              ${attachmentsHtml ? `<div class="chat-msg-attachments">${attachmentsHtml}</div>` : ''}
              
              <div class="chat-msg-reactions-bar">
                <div class="active-reactions-group">
                  ${reactionsHtml}
                </div>
                <div class="quick-reactions-picker">
                  ${emojiPickerHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    // 3. Assemble Full Component HTML
    this.container.innerHTML = `
      <div class="channels-layout-wrapper">
        <!-- Channels Sidebar -->
        <aside class="channels-sidebar-pane">
          <div class="channels-sidebar-header">
            <span style="font-weight:700; font-size:0.9rem; color:#FFF;">💬 Espaces de Discussion</span>
            ${canCreateSubGroup ? `
              <button class="btn-link" onclick="window.channelsManager.openNewSubGroupModal()" style="font-size:0.75rem;">
                + Sous-groupe
              </button>
            ` : ''}
          </div>
          <div class="channels-nav-list">
            ${channelsListHtml}
          </div>
        </aside>

        <!-- Main Chat Area -->
        <main class="channels-chat-pane">
          <!-- Chat Header -->
          <header class="channel-chat-header">
            <div class="channel-info-block">
              <h3>${activeChannel.name}</h3>
              <span class="channel-badge-type">
                ${activeChannel.type === 'announcements' ? '📢 Canal Officiel' : (activeChannel.type === 'commission' ? '🤝 Commission' : '🎯 Sous-Groupe Projet')}
              </span>
            </div>
            <div class="channel-header-actions">
              <button class="btn-meet-action" onclick="window.channelsManager.openMeetModal('${activeChannel.meetUrl}', '${activeChannel.name}')">
                📹 Lancer un Meet
              </button>
            </div>
          </header>

          <!-- Messages Stream -->
          <div class="channel-messages-stream" id="channel-messages-stream">
            ${messagesHtml}
          </div>

          <!-- Chat Input Footer -->
          <footer class="channel-input-footer">
            ${canWrite ? `
              <form class="channel-input-form" onsubmit="window.channelsManager.handleSendMessage(event, '${activeChannel.id}')">
                <input 
                  type="text" 
                  name="messageText" 
                  class="channel-input-field" 
                  placeholder="Écrire dans ${activeChannel.name}..." 
                  autocomplete="off"
                  required 
                />
                <button type="submit" class="channel-send-btn">➤</button>
              </form>
            ` : `
              <div class="channel-locked-notice">
                🔒 <strong>Canal Officiel en lecture seule :</strong> Seuls les membres du Bureau peuvent publier des annonces. Vous pouvez réagir avec les emojis !
              </div>
            `}
          </footer>
        </main>
      </div>
    `;

    // Scroll to bottom
    const stream = document.getElementById('channel-messages-stream');
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  }

  handleSendMessage(event, channelId) {
    event.preventDefault();
    const form = event.target;
    const text = form.messageText.value.trim();
    const currentUser = window.authManager.getCurrentUser();

    if (!text) return;

    window.dbStore.addMessage(channelId, {
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderRole: currentUser.role,
      text: text,
      attachments: []
    });

    form.reset();
  }

  handleToggleReaction(channelId, messageId, emoji) {
    const currentUser = window.authManager.getCurrentUser();
    window.dbStore.toggleReaction(channelId, messageId, emoji, currentUser.id);
  }

  openMeetModal(meetUrl, channelName) {
    const safeUrl = meetUrl || `https://meet.jit.si/Interact_Meeting_${Date.now()}`;
    const modalBody = `
      <div class="meet-modal-container">
        <div class="meet-modal-topbar">
          <div>
            <h4 style="color:#FFF; margin-bottom:2px;">📹 Visioconférence — ${channelName}</h4>
            <p style="font-size:0.75rem; color:var(--text-muted);">Session WebRTC sécurisée et chiffrée</p>
          </div>
          <a href="${safeUrl}" target="_blank" rel="noreferrer" class="btn-secondary" style="font-size:0.75rem;">
            Ouvrir en plein écran ↗
          </a>
        </div>
        <div class="meet-iframe-frame">
          <iframe 
            src="${safeUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true" 
            allow="camera; microphone; fullscreen; display-capture; autoplay" 
            style="width:100%; height:450px; border:none; border-radius:12px;"
          ></iframe>
        </div>
      </div>
    `;
    window.app.openModal(`📹 Visioconférence Interact Meet`, modalBody);
  }

  openNewSubGroupModal() {
    const club = window.dbStore.getClub();
    const commissions = club.commissions || {};

    let commOptions = '';
    Object.values(commissions).forEach(c => {
      commOptions += `<option value="${c.info.id}">${c.info.name}</option>`;
    });

    const modalBody = `
      <form id="form-new-subgroup" onsubmit="window.channelsManager.handleCreateSubGroup(event)">
        <div class="form-group">
          <label class="form-label">Nom du Sous-Groupe de Travail *</label>
          <input type="text" name="name" class="form-input" placeholder="Ex: Équipe Sponsoring J-5, Créa Affiche Média..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Commission de rattachement</label>
          <select name="commissionId" class="form-select">
            ${commOptions}
          </select>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px;">
          🎯 Créer l'Espace de Travail
        </button>
      </form>
    `;

    window.app.openModal('🎯 Créer un Sous-Groupe de Projet', modalBody);
  }

  handleCreateSubGroup(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value.trim();
    const commissionId = form.commissionId.value;

    if (!name) return;

    const newChannel = window.dbStore.addChannel({
      name,
      commissionId,
      type: 'task_custom'
    });

    window.app.closeModal();
    window.app.showToast(`Sous-groupe « ${name} » créé avec succès !`, 'success');
    this.setActiveChannel(newChannel.id);
  }
}

// Global channels manager instance
const channelsManager = new ChannelsManager();
window.channelsManager = channelsManager;
