/**
 * ==========================================================================
 * PROTOCOLE & DISCIPLINE ENGINE (AUTOMATIC SANCTIONS WATCHDOG)
 * Automatic delay detection, strikes count, sanctions moderation & HR matrix.
 * Structured Glassmorphism Sanctions & HR Table with Direct WhatsApp Triggers
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
   * Checks every uncompleted task: if currentTime > task.deadline, generates a sanction
   * UNLESS the commission chef has activated `flagReview` to freeze sanctions.
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

          // If task has flagReview active, skip automatic sanctioning (frozen by Chef)
          if (task.flagReview) return;

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
    const canModerate = window.authManager?.canManageProtocole?.();

    const sanctionKeys = Object.keys(sanctions);
    if (sanctionKeys.length === 0) {
      this.sanctionsContainer.innerHTML = `
        <div class="interact-card" style="text-align:center; padding: 28px;">
          <p style="color:var(--text-muted); font-size:0.88rem;">🕊️ Aucune sanction enregistrée. La discipline du club est exemplaire.</p>
        </div>
      `;
      return;
    }

    // Sort sanctions: Active first (severe then light), then excused
    const sortedSanctions = Object.values(sanctions).sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    let html = '';
    sortedSanctions.forEach(s => {
      const member = members[s.userId];
      const memberName = member ? member.displayName : 'Membre inconnu';
      const isExcused = s.status === 'excused';
      const isSevere = s.grade === 'severe';

      let gradeBadge = '';
      if (isExcused) {
        gradeBadge = `<span class="status-tag done">🕊️ [EXCUSÉE]</span>`;
      } else if (isSevere) {
        gradeBadge = `<span class="status-tag urgent">⚡ [SÉVÈRE GR. 2]</span>`;
      } else {
        gradeBadge = `<span class="status-tag warning">⚠️ [LÉGÈRE GR. 1]</span>`;
      }

      html += `
        <div class="interact-card sanction-card ${isSevere ? 'severe' : ''} ${isExcused ? 'excused' : ''}">
          <div class="sanction-card-topbar">
            <div class="sanction-member-info">
              <span class="sanction-member-avatar">${memberName.charAt(0)}</span>
              <div>
                <h4 class="sanction-member-name">${memberName}</h4>
                <span class="sanction-action-ref">🎯 ${s.actionTitle || 'Discipline Club'}</span>
              </div>
            </div>
            ${gradeBadge}
          </div>

          <p class="sanction-reason-text">
            ${s.reason}
          </p>

          <div class="sanction-meta-row">
            <span class="sanction-date-tag">📅 ${new Date(s.date || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <span class="sanction-delay-tag">⏱️ Retard : <strong>${s.delayHours || 0}h</strong></span>
          </div>

          ${isExcused && s.excuseReason ? `
            <div class="sanction-excuse-feedback">
              📝 <strong>Motif de l'exemption :</strong> ${s.excuseReason} (${s.excusedBy || 'Protocole'})
            </div>
          ` : ''}

          ${canModerate && !isExcused ? `
            <div class="sanction-actions-toolbar">
              <button class="btn-secondary compact" onclick="window.protocolManager.toggleGrade('${s.id}', '${isSevere ? 'light' : 'severe'}')">
                ${isSevere ? 'Passer en Légère (Gr. 1)' : 'Passer en Sévère (Gr. 2)'}
              </button>
              <button class="btn-primary-compact green" onclick="window.protocolManager.openExcuseModal('${s.id}')">
                🕊️ Valider Excuse & Exemption
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
    const canManageHR = window.authManager?.canManageHR?.();

    let html = '';
    Object.values(members).forEach(m => {
      const comm = commissions[m.commissionId];
      const commName = comm ? comm.info?.name : 'Direction Club';
      const strikes = m.strikesCount || 0;

      let strikesBadge = '';
      if (strikes === 0) {
        strikesBadge = `<span class="status-tag done">0 Strike</span>`;
      } else {
        strikesBadge = `<span class="status-tag urgent">⚡ ${strikes} Strike${strikes > 1 ? 's' : ''}</span>`;
      }

      // WhatsApp direct link
      const phoneDigits = (m.phoneNumber || '').replace(/[^0-9]/g, '');
      const waLink = phoneDigits ? `https://wa.me/${phoneDigits}` : '#';

      html += `
        <div class="interact-card hr-member-card">
          <div class="hr-member-left">
            <div class="hr-member-avatar">${m.displayName.charAt(0)}</div>
            <div class="hr-member-details">
              <h4 class="hr-member-name">${m.displayName}</h4>
              <div class="hr-member-sub">
                <span class="hr-member-role">${window.ROLE_LABELS[m.role] || m.role}</span>
                <span class="hr-member-comm">📁 ${commName}</span>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">
                ${m.email} ${m.birthDate ? `• 🎂 ${m.birthDate}` : ''}
              </div>
            </div>
          </div>

          <div class="hr-member-right" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
            ${strikesBadge}
            ${m.phoneNumber ? `
              <div style="display:flex; gap:6px;">
                <a href="tel:${m.phoneNumber}" class="btn-secondary compact" style="text-decoration:none; font-size:0.72rem; padding:3px 8px; color:var(--accent-cyan);">
                  📞 ${m.phoneNumber}
                </a>
                <a href="${waLink}" target="_blank" class="btn-secondary compact" style="text-decoration:none; font-size:0.72rem; padding:3px 8px; color:#34C759;">
                  💬 WhatsApp
                </a>
              </div>
            ` : ''}
            ${canManageHR ? `
              <button class="btn-secondary compact" style="margin-top:2px;" onclick="window.protocolManager.openEditMemberModal('${m.id}')">
                ✏️ Modifier Rôle
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });

    this.membersContainer.innerHTML = `<div class="hr-members-grid">${html}</div>`;
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
            <option value="severe">⚡ Sanction Sévère (2 Strikes / Convocation Bureau)</option>
          </select>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px; background:linear-gradient(135deg, #FF3B30, #D90429); color:#FFF;">
          ⚡ Appliquer la Sanction Officielle
        </button>
      </form>
    `;

    window.app.openModal('⚖️ Nouvelle Sanction Disciplinaire', modalBody);
  }

  handleManualSanction(event) {
    event.preventDefault();
    const form = event.target;
    const userId = form.userId.value;
    const reason = form.reason.value.trim();
    const grade = form.grade.value;

    if (!userId || !reason) {
      window.app.showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    window.dbStore.addSanction({
      userId,
      reason,
      grade,
      delayHours: 0,
      actionTitle: 'Protocole & Discipline'
    });

    window.app.closeModal();
    window.app.showToast('Sanction disciplinaire enregistrée au registre officiel.', 'warning');
  }

  openEditMemberModal(userId) {
    const club = window.dbStore.getClub();
    const member = club.members?.[userId];
    if (!member) return;

    const commissions = club.commissions || {};
    let commOptions = `<option value="comm_direction">-- Direction / Bureau Exécutif --</option>`;
    Object.keys(commissions).forEach(cId => {
      commOptions += `<option value="${cId}" ${member.commissionId === cId ? 'selected' : ''}>${commissions[cId].info.name}</option>`;
    });

    let roleOptions = '';
    Object.keys(window.ROLES).forEach(rKey => {
      const rVal = window.ROLES[rKey];
      roleOptions += `<option value="${rVal}" ${member.role === rVal ? 'selected' : ''}>${window.ROLE_LABELS[rVal] || rVal}</option>`;
    });

    const modalBody = `
      <form id="form-edit-member-role" onsubmit="window.protocolManager.handleSaveMemberRole(event, '${userId}')">
        <div class="form-group">
          <label class="form-label">Membre</label>
          <input type="text" class="form-input" value="${member.displayName}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Rôle Officiel *</label>
          <select name="newRole" class="form-select">
            ${roleOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Commission de Rattachement</label>
          <select name="newCommId" class="form-select">
            ${commOptions}
          </select>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px;">
          💾 Enregistrer les Droits RH
        </button>
      </form>
    `;

    window.app.openModal('👥 Gestion RH : Droits & Rôle', modalBody);
  }

  handleSaveMemberRole(event, userId) {
    event.preventDefault();
    const form = event.target;
    const newRole = form.newRole.value;
    const newCommId = form.newCommId.value;

    window.dbStore.updateMemberRole(userId, newRole, newCommId);
    window.app.closeModal();
    window.app.showToast('Droits RH et poste mis à jour avec succès.', 'success');
  }
}

// Global protocol manager instance
const protocolManager = new ProtocolManager();
window.protocolManager = protocolManager;
