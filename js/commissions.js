/**
 * ==========================================================================
 * COMMISSIONS & ACTIONS HIERARCHY MANAGER
 * Hierarchy: Club -> Commissions -> Actions -> Tasks
 * Encapsulated in modern Glassmorphism Interact Cards
 * ==========================================================================
 */

class CommissionsManager {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.getElementById('commissions-list-container');
    this.render();

    // Subscribe to database changes
    if (window.dbStore) {
      window.dbStore.subscribe(() => this.render());
    }
  }

  render() {
    if (!this.container || !window.dbStore) return;

    const club = window.dbStore.getClub();
    const commissions = club.commissions || {};
    const members = club.members || {};
    const currentUser = window.authManager.getCurrentUser();

    let html = '';

    const commKeys = Object.keys(commissions);
    if (commKeys.length === 0) {
      this.container.innerHTML = `
        <div class="interact-card" style="text-align:center; padding: 30px;">
          <p style="color:var(--text-muted);">Aucune commission configurée pour le moment.</p>
        </div>
      `;
      return;
    }

    commKeys.forEach((commId, index) => {
      const comm = commissions[commId];
      const info = comm.info || {};
      const actions = comm.actions || {};
      const actionKeys = Object.keys(actions);

      // Find Chef and Co-Chef names
      const chef = members[info.chefUid];
      const coChef = members[info.coChefUid];
      const chefName = chef ? chef.displayName : 'Non assigné';
      const coChefText = coChef ? ` • Co-chef: ${coChef.displayName}` : '';

      // Count total tasks in commission
      let totalTasks = 0;
      let completedTasks = 0;

      actionKeys.forEach(actId => {
        const act = actions[actId];
        const tasks = act.tasks || {};
        const tKeys = Object.keys(tasks);
        totalTasks += tKeys.length;
        completedTasks += tKeys.filter(k => tasks[k].status === 'completed').length;
      });

      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const canManage = window.authManager.canManageAction(commId);

      // Render Actions List inside this commission
      let actionsHtml = '';
      if (actionKeys.length === 0) {
        actionsHtml = `
          <div class="interact-subcard" style="text-align:center; color: var(--text-dim); font-size: 0.84rem; padding:16px;">
            Aucune action en cours dans cette commission.
          </div>
        `;
      } else {
        actionKeys.forEach(actId => {
          const act = actions[actId];
          const actInfo = act.info || {};
          const actTasks = act.tasks || {};
          const actTaskKeys = Object.keys(actTasks);
          const actTotal = actTaskKeys.length;
          const actDone = actTaskKeys.filter(k => actTasks[k].status === 'completed').length;
          const actProgress = actTotal > 0 ? Math.round((actDone / actTotal) * 100) : 0;
          const isDone = actInfo.status === 'completed' || (actTotal > 0 && actDone === actTotal);

          actionsHtml += `
            <div class="interact-subcard action-subcard">
              <div class="action-subcard-head">
                <div>
                  <h4 class="action-subcard-title">${actInfo.title || 'Action sans titre'}</h4>
                  <p class="action-subcard-desc">${actInfo.description || ''}</p>
                </div>
                <span class="status-tag ${isDone ? 'done' : 'inprogress'}">
                  ${isDone ? '✓ [TERMINÉ]' : '⏳ [EN COURS]'}
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div class="action-progress-box">
                <div class="action-progress-labels">
                  <span>Progression (${actDone}/${actTotal} tâches complétées)</span>
                  <span class="progress-percent">${actProgress}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${actProgress}%;"></div>
                </div>
              </div>

              <!-- Action Footer Info & Buttons -->
              <div class="action-subcard-footer">
                <span class="action-date-tag">🗓️ Du <strong>${actInfo.startDate || 'N/A'}</strong> au <strong>${actInfo.endDate || 'N/A'}</strong></span>
                ${canManage ? `
                  <button class="btn-primary-compact" onclick="window.commissionsManager.openNewTaskModal('${commId}', '${actId}')">
                    + Assigner Tâche
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        });
      }

      html += `
        <div class="interact-card commission-main-card ${index === 0 ? 'expanded' : ''}" id="commission-card-${commId}">
          <div class="commission-card-header" onclick="window.commissionsManager.toggleCommission('${commId}')">
            <div class="commission-header-main">
              <div class="commission-icon-badge">${info.icon || '💼'}</div>
              <div class="commission-header-titles">
                <h3 class="commission-main-title">${info.name || 'Commission'}</h3>
                <div class="commission-leaders-subtitle">👑 <strong>${chefName}</strong>${coChefText}</div>
              </div>
            </div>
            
            <div class="commission-header-meta">
              <div class="commission-progress-pill">
                <span class="progress-num">${overallProgress}%</span>
              </div>
              <span class="commission-toggle-arrow">▼</span>
            </div>
          </div>

          <div class="commission-card-body">
            <p class="commission-desc-paragraph">${info.description || ''}</p>
            
            <!-- Actions Section Header -->
            <div class="actions-section-toolbar">
              <span class="actions-section-title">🎯 Actions & Projets Opérationnels</span>
              ${canManage ? `
                <button class="btn-primary-compact gold" onclick="window.commissionsManager.openNewActionModal('${commId}')">
                  + Nouvelle Action
                </button>
              ` : ''}
            </div>

            <!-- Nested Action Subcards -->
            <div class="actions-subcards-list">
              ${actionsHtml}
            </div>
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
  }

  toggleCommission(commId) {
    const card = document.getElementById(`commission-card-${commId}`);
    if (card) {
      card.classList.toggle('expanded');
    }
  }

  openNewActionModal(commissionId) {
    const club = window.dbStore.getClub();
    const comm = club.commissions[commissionId];
    if (!comm) return;

    const modalBody = `
      <form id="form-new-action" onsubmit="window.commissionsManager.handleCreateAction(event, '${commissionId}')">
        <div class="form-group">
          <label class="form-label">Commission</label>
          <input type="text" class="form-input" value="${comm.info.name}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Titre de l'action *</label>
          <input type="text" name="title" class="form-input" placeholder="Ex: Hiver Chaud 2026, Don du sang..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Description & Objectifs</label>
          <textarea name="description" class="form-textarea" placeholder="Détaillez le but de l'action, les bénéficiaires et le déroulement..."></textarea>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label class="form-label">Date Début</label>
            <input type="date" name="startDate" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label">Date Fin</label>
            <input type="date" name="endDate" class="form-input" value="${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}" />
          </div>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px;">Créer l'Action</button>
      </form>
    `;

    window.app.openModal('🎯 Nouvelle Action de Commission', modalBody);
  }

  handleCreateAction(event, commissionId) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;

    if (!title) {
      window.app.showToast('Veuillez renseigner un titre pour l\'action.', 'error');
      return;
    }

    window.dbStore.addAction(commissionId, { title, description, startDate, endDate });
    window.app.closeModal();
    window.app.showToast('Action créée avec succès !', 'success');
  }

  openNewTaskModal(commissionId, actionId) {
    const club = window.dbStore.getClub();
    const members = club.members || {};
    const comm = club.commissions[commissionId];
    const action = comm?.actions[actionId];

    let memberOptions = '';
    Object.values(members).forEach(m => {
      memberOptions += `<option value="${m.id}">${m.displayName} (${window.ROLE_LABELS[m.role] || m.role})</option>`;
    });

    const defaultDeadline = new Date(Date.now() + 72 * 3600 * 1000).toISOString().slice(0, 16);

    const modalBody = `
      <form id="form-new-task" onsubmit="window.commissionsManager.handleCreateTask(event, '${commissionId}', '${actionId}')">
        <div class="form-group">
          <label class="form-label">Action rattachée</label>
          <input type="text" class="form-input" value="${action?.info?.title || 'Action'}" disabled />
        </div>
        <div class="form-group">
          <label class="form-label">Intitulé de la tâche *</label>
          <input type="text" name="title" class="form-input" placeholder="Ex: Rédaction du compte-rendu, Achat fournitures..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Membre assigné *</label>
          <select name="assignedTo" class="form-select">
            ${memberOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline (Date et Heure limite) *</label>
          <input type="datetime-local" name="deadline" class="form-input" value="${defaultDeadline}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Priorité</label>
          <select name="priority" class="form-select">
            <option value="normal">Normale (Standard)</option>
            <option value="warning">Haute (< 24h)</option>
            <option value="urgent">Critique / Urgente</option>
          </select>
        </div>
        <button type="submit" class="btn-primary" style="margin-top:12px;">Enregistrer la Tâche</button>
      </form>
    `;

    window.app.openModal('📋 Assigner une Nouvelle Tâche', modalBody);
  }

  handleCreateTask(event, commissionId, actionId) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value.trim();
    const assignedTo = form.assignedTo.value;
    const deadlineVal = form.deadline.value;
    const priority = form.priority.value;

    if (!title || !deadlineVal) {
      window.app.showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      return;
    }

    const deadline = new Date(deadlineVal).toISOString();

    window.dbStore.addTask(commissionId, actionId, {
      title,
      assignedTo: [assignedTo],
      deadline,
      priority
    });

    window.app.closeModal();
    window.app.showToast('Tâche assignée avec succès !', 'success');
  }
}

// Global commissions manager instance
const commissionsManager = new CommissionsManager();
window.commissionsManager = commissionsManager;
