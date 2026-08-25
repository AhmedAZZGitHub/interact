/**
 * ==========================================================================
 * PROTOCOLE & DISCIPLINE ENGINE (AUTOMATIC SANCTIONS WATCHDOG)
 * Automatic delay detection, strikes count, sanctions moderation & HR matrix.
 * ==========================================================================
 */

class ProtocolManager {
  constructor() {
    this.sanctionsContainer = null;
    this.membersContainer = null;
    this.scanInterval = null;
  }

  init() {
    this.sanctionsContainer = document.getElementById('protocol-sanctions-container');
    this.membersContainer = document.getElementById('protocol-members-container');

    // Run first watchdog scan immediately
    this.runDeadlinesWatchdog();

    // Setup recurring background scan every 60 seconds
    this.scanInterval = setInterval(() => {
      this.runDeadlinesWatchdog();
    }, 60000);

    this.render();

    // Subscribe to database changes
    if (window.dbStore) {
      window.dbStore.subscribe(() => this.render());
    }
  }

  /**
   * Automatic Deadline Watchdog
   * Checks every uncompleted task: if currentTime > task.deadline, generates a sanction.
   */
  runDeadlinesWatchdog(notify = false) {
    if (!window.dbStore) return 0;

    const club = window.dbStore.getClub();
    const commissions = club.commissions || {};
    const existingSanctions = club.sanctions || {};
    const now = new Date();
    let newSanctionsCount = 0;

    Object.keys(commissions).forEach(commId => {
      const comm = commissions[commId];
      const actions = comm.actions || {};

      Object.keys(actions).forEach(actId => {
        const action = actions[actId];
        const actionTitle = action.info?.title || 'Action Club';
        const tasks = action.tasks || {};

        Object.keys(tasks).forEach(taskId => {
          const task = tasks[taskId];
          const deadline = new Date(task.deadline);

          // Overdue condition
          if (now > deadline && task.status !== 'completed') {
            const delayHours = Math.max(1, Math.round((now - deadline) / (1000 * 60 * 60)));
            const assignedMembers = task.assignedTo || [];

            assignedMembers.forEach(userId => {
              // Check if a sanction already exists for this task & user
              const alreadySanctioned = Object.values(existingSanctions).some(
                s => s.taskId === taskId && s.userId === userId && s.status !== 'excused'
              );

              if (!alreadySanctioned) {
                // Generate automated sanction
                const grade = delayHours >= 48 ? 'severe' : 'light';
                const reason = `Retard automatique constaté de ${delayHours}h sur la tâche : "${task.title}" (${actionTitle})`;

                window.dbStore.addSanction({
                  userId,
                  taskId,
                  actionTitle,
                  reason,
                  delayHours,
                  grade
                });

                newSanctionsCount++;
              }
            });
          }
        });
      });
    });

    if (notify) {
      if (newSanctionsCount > 0) {
        window.app.showToast(`🚨 Watchdog Protocole : ${newSanctionsCount} nouvelle(s) sanction(s) générée(s) pour retard.`, 'error');
      } else {
        window.app.showToast(`✅ Watchdog Protocole : Toutes les deadlines sont à jour. Aucun nouveau retard.`, 'success');
      }
    }

    return newSanctionsCount;
  }

  render() {
    this.renderSanctions();
    this.renderMembersHR();
  }

  renderSanctions() {
    if (!this.sanctionsContainer || !window.dbStore) return;

    const club = window.dbStore.getClub();
    const sanctions = club.sanctions || {};
    const members = club.members || {};
    const canModerate = window.authManager.canManageProtocole();

    const sanctionKeys = Object.keys(sanctions);
    if (sanctionKeys.length === 0) {
      this.sanctionsContainer.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 24px;">
          <p style="color:var(--text-muted); font-size:0.85rem;">🕊️ Aucune sanction enregistrée. La discipline du club est exemplaire.</p>
        </div>
      `;
      return;
    }

    // Sort sanctions: Active first (severe then light), then excused
    const sortedSanctions = Object.values(sanctions).sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.date) - new Date(a.date);
    });

    let html = '';
    sortedSanctions.forEach(s => {
      const member = members[s.userId];
      const memberName = member ? member.displayName : 'Membre inconnu';
      const isExcused = s.status === 'excused';
      const isSevere = s.grade === 'severe';

      let gradeBadge = '';
      if (isExcused) {
        gradeBadge = `<span class="sanction-grade-badge excused">🕊️ Excusée</span>`;
      } else if (isSevere) {
        gradeBadge = `<span class="sanction-grade-badge severe">⚡ Sévère (Gr. 2)</span>`;
      } else {
        gradeBadge = `<span class="sanction-grade-badge light">⚠️ Légère (Gr. 1)</span>`;
      }

      html += `
        <div class="sanction-item ${isSevere ? 'severe' : ''} ${isExcused ? 'excused' : ''}">
          <div class="sanction-top">
            <div class="sanction-member">👤 ${memberName}</div>
            ${gradeBadge}
          </div>
          <div class="sanction-reason">
            ${s.reason}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-dim);">
            <span>📅 ${new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <span>Retard : ${s.delayHours || 0}h</span>
          </div>
          ${isExcused && s.excuseReason ? `
            <div style="font-size:0.75rem; color:var(--success-green); background:rgba(52,199,89,0.1); padding:6px 8px; border-radius:6px; border:1px solid rgba(52,199,89,0.2);">
              📝 <strong>Motif d'excuse :</strong> ${s.excuseReason} (${s.excusedBy || 'Protocole'})
            </div>
          ` : ''}
          ${canModerate && !isExcused ? `
            <div class="sanction-actions-row">
              <button class="btn-sanction-action severe-toggle" onclick="window.protocolManager.toggleGrade('${s.id}', '${isSevere ? 'light' : 'severe'}')">
                ${isSevere ? 'Passer en Légère' : 'Passer en Sévère'}
              </button>
              <button class="btn-sanction-action excuse" onclick="window.protocolManager.openExcuseModal('${s.id}')">
                🕊️ Valider Excuse
              </button>
            </div>
          ` : ''}
        </div>
      `;
    });

    this.sanctionsContainer.innerHTML = html;
  }

  renderMembersHR() {
    if (!this.membersContainer || !window.dbStore) return;

    const club = window.dbStore.getClub();
    const members = club.members || {};
    const commissions = club.commissions || {};
    const canManageHR = window.authManager.canManageHR();

    let html = '';
    Object.values(members).forEach(m => {
      const comm = commissions[m.commissionId];
      const commName = comm ? comm.info?.name : 'Non rattaché';
      const strikes = m.strikesCount || 0;

      let strikesHtml = '';
      if (strikes === 0) {
        strikesHtml = `<span style="font-size:0.75rem; color:var(--success-green); font-weight:700;">0 Strike</span>`;
      } else {
        strikesHtml = `<span class="member-strikes-badge">⚡ ${strikes} Strike${strikes > 1 ? 's' : ''}</span>`;
      }

      html += `
        <div class="member-row">
          <div class="member-info-col">
            <div class="member-avatar-mini">${m.displayName.charAt(0)}</div>
            <div>
              <div class="member-name-text">${m.displayName}</div>
              <div class="member-role-sub">${window.ROLE_LABELS[m.role] || m.role} • <span style="color:var(--interact-gold);">${commName}</span></div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${strikesHtml}
            ${canManageHR ? `
              <button class="btn-link" onclick="window.protocolManager.openEditMemberModal('${m.id}')" style="font-size:0.75rem;">
                Modifier
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    this.membersContainer.innerHTML = html;
  }

  toggleGrade(sanctionId, newGrade) {
    window.dbStore.updateSanction(sanctionId, { grade: newGrade });
    window.app.showToast(`Gradation de la sanction mise à jour (${newGrade === 'severe' ? 'Sévère' : 'Légère'}).`, 'warning');
  }

  openExcuseModal(sanctionId) {
    const club = window.dbStore.getClub();
    const sanction = club.sanctions?.[sanctionId];
    if (!sanction) return;

    const modalBody = `
      <form id="form-excuse-sanction" onsubmit="window.protocolManager.handleExcuseSanction(event, '${sanctionId}')">
        <div class="form-group">
          <label class="form-label">Sanction concernée</label>
          <input type="text" class="form-input" value="${sanction.reason}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Motif de l'excuse ou justification officielle *</label>
          <textarea name="excuseReason" class="form-textarea" placeholder="Ex: Certificat médical validé par le bureau, examen universitaire justifiable..." required></textarea>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, #34C759, #28A745); color:#FFF;">
          🕊️ Valider l'Exemption (Supprimer le Strike)
        </button>
      </form>
    `;

    window.app.openModal('⚖️ Exemption / Excuse Protocole', modalBody);
  }

  handleExcuseSanction(event, sanctionId) {
    event.preventDefault();
    const form = event.target;
    const excuseReason = form.excuseReason.value.trim();
    const currentUser = window.authManager.getCurrentUser();

    if (!excuseReason) {
      window.app.showToast('Veuillez fournir un motif pour l\'excuse.', 'error');
      return;
    }

    window.dbStore.updateSanction(sanctionId, {
      status: 'excused',
      excuseReason: excuseReason,
      excusedBy: `${currentUser.displayName} (${window.ROLE_LABELS[currentUser.role] || currentUser.role})`
    });

    window.app.closeModal();
    window.app.showToast('Sanction excusée et strike retiré du profil.', 'success');
  }

  openNewSanctionModal() {
    const club = window.dbStore.getClub();
    const members = club.members || {};

    let memberOptions = '';
    Object.values(members).forEach(m => {
      memberOptions += `<option value="${m.id}">${m.displayName} (${window.ROLE_LABELS[m.role] || m.role})</option>`;
    });

    const modalBody = `
      <form id="form-manual-sanction" onsubmit="window.protocolManager.handleManualSanction(event)">
        <div class="form-group">
          <label class="form-label">Membre sanctionné *</label>
          <select name="userId" class="form-select">
            ${memberOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Motif du manquement disciplinaire *</label>
          <textarea name="reason" class="form-textarea" placeholder="Ex: Absence non justifiée à la réunion statutaire, non-respect du code vestimentaire..." required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Gradation</label>
          <select name="grade" class="form-select">
            <option value="light">⚠️ Sanction Légère (Avertissement / 1 Strike)</option>
            <option value="severe">⚡ Sanction Sévère (Manquement grave)</option>
          </select>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, #FF3B30, #D90429); color:#FFF;">
          ⚡ Appliquer la Sanction Protocole
        </button>
      </form>
    `;

    window.app.openModal('⚖️ Nouvelle Sanction Protocole', modalBody);
  }

  handleManualSanction(event) {
    event.preventDefault();
    const form = event.target;
    const userId = form.userId.value;
    const reason = form.reason.value.trim();
    const grade = form.grade.value;

    if (!userId || !reason) {
      window.app.showToast('Veuillez renseigner tous les champs.', 'error');
      return;
    }

    window.dbStore.addSanction({
      userId,
      taskId: 'manual_' + Date.now(),
      actionTitle: 'Protocole Général & Discipline',
      reason,
      grade,
      delayHours: 0
    });

    window.app.closeModal();
    window.app.showToast('Sanction enregistrée avec succès.', 'error');
  }

  openEditMemberModal(userId) {
    const club = window.dbStore.getClub();
    const member = club.members?.[userId];
    const commissions = club.commissions || {};
    if (!member) return;

    let roleOptions = '';
    Object.keys(window.ROLES).forEach(k => {
      const rVal = window.ROLES[k];
      const isSelected = member.role === rVal ? 'selected' : '';
      roleOptions += `<option value="${rVal}" ${isSelected}>${window.ROLE_LABELS[rVal] || rVal}</option>`;
    });

    let commOptions = `<option value="">-- Aucune commission --</option>`;
    Object.keys(commissions).forEach(cId => {
      const isSelected = member.commissionId === cId ? 'selected' : '';
      commOptions += `<option value="${cId}" ${isSelected}>${commissions[cId].info?.name || cId}</option>`;
    });

    const modalBody = `
      <form id="form-edit-member-hr" onsubmit="window.protocolManager.handleEditMemberHR(event, '${userId}')">
        <div class="form-group">
          <label class="form-label">Membre</label>
          <input type="text" class="form-input" value="${member.displayName} (${member.email})" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Attribution du Rôle *</label>
          <select name="role" class="form-select">
            ${roleOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Commission assignée</label>
          <select name="commissionId" class="form-select">
            ${commOptions}
          </select>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px;">Sauvegarder les Droits RH</button>
      </form>
    `;

    window.app.openModal('📋 Modification Profil & Rôle (RH)', modalBody);
  }

  handleEditMemberHR(event, userId) {
    event.preventDefault();
    const form = event.target;
    const newRole = form.role.value;
    const newComm = form.commissionId.value || null;

    window.dbStore.updateMemberRole(userId, newRole, newComm);
    window.app.closeModal();
    window.app.showToast('Droits et rôle du membre mis à jour !', 'success');
  }
}

// Global protocol manager instance
const protocolManager = new ProtocolManager();
window.protocolManager = protocolManager;
