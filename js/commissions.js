/**
 * ==========================================================================
 * COMMISSIONS & ACTIONS HIERARCHY MANAGER
 * Hierarchy: Club -> Commissions -> Actions -> Tasks
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
        <div class="glass-card" style="text-align:center; padding: 30px;">
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
          <div style="padding: 12px; text-align: center; color: var(--text-dim); font-size: 0.82rem;">
            Aucune action en cours.
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

          actionsHtml += `
            <div class="action-card">
              <div class="action-head">
                <div class="action-title">${actInfo.title || 'Action sans titre'}</div>
                <span class="header-badge" style="font-size:0.65rem;">${actInfo.status === 'completed' ? 'Terminée' : 'En cours'}</span>
              </div>
              <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">${actInfo.description || ''}</p>
              
              <div class="action-progress-container">
                <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:3px;">
                  <span>Progression (${actDone}/${actTotal} tâches)</span>
                  <span style="color:var(--neon-cyan); font-weight:700;">${actProgress}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${actProgress}%;"></div>
                </div>
              </div>

              <div class="action-footer">
                <span>🗓️ Du ${actInfo.startDate || 'N/A'} au ${actInfo.endDate || 'N/A'}</span>
                ${canManage ? `
                  <button class="btn-link" onclick="window.commissionsManager.openNewTaskModal('${commId}', '${actId}')" style="font-size:0.75rem;">
                    + Tâche
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        });
      }

      html += `
        <div class="commission-card ${index === 0 ? 'expanded' : ''}" id="commission-card-${commId}">
          <div class="commission-header" onclick="window.commissionsManager.toggleCommission('${commId}')">
            <div class="commission-info">
              <div class="commission-badge-icon">${info.icon || '💼'}</div>
              <div>
                <div class="commission-title">${info.name || 'Commission'}</div>
                <div class="commission-leaders">👑 ${chefName}${coChefText}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="header-badge" style="background:rgba(0,240,255,0.12); color:var(--neon-cyan); border-color:var(--border-cyan);">
                ${overallProgress}%
              </span>
              <span class="commission-toggle-icon">▼</span>
            </div>
          </div>
          <div class="commission-body">
            <p style="font-size:0.82rem; color:var(--text-muted); margin: 10px 0 6px 0;">${info.description || ''}</p>
            
            <div class="section-header" style="margin-top:12px; margin-bottom:6px;">
              <span style="font-size:0.85rem; font-weight:700; color:var(--text-main);">🎯 Actions de la Commission</span>
              ${canManage ? `
                <button class="btn-link" onclick="window.commissionsManager.openNewActionModal('${commId}')">
                  + Nouvelle Action
                </button>
              ` : ''}
            </div>

            <div class="actions-list">
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

    // Default deadline 3 days from now
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
