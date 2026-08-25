/**
 * ==========================================================================
 * TASKS & TO-DO MANAGER
 * Real-time tracking, urgency sorting (Red/Orange/Green), status toggles.
 * Structured Glassmorphism Task Cards & Badges
 * ==========================================================================
 */

class TasksManager {
  constructor() {
    this.container = null;
    this.currentFilter = 'all'; // 'all' | 'mine' | 'overdue' | 'completed'
  }

  init() {
    this.container = document.getElementById('tasks-board-container');
    this.render();

    // Subscribe to DB updates
    if (window.dbStore) {
      window.dbStore.subscribe(() => this.render());
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update chip styling
    const chips = document.querySelectorAll('#tasks-filter-chips .filter-chip');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === filter);
    });

    this.render();
  }

  getAllTasksWithMetadata() {
    if (!window.dbStore) return [];

    const club = window.dbStore.getClub();
    const commissions = club.commissions || {};
    const members = club.members || {};
    const allTasks = [];
    const now = new Date();

    Object.keys(commissions).forEach(commId => {
      const comm = commissions[commId];
      const commName = comm.info?.name || 'Commission';
      const actions = comm.actions || {};

      Object.keys(actions).forEach(actId => {
        const action = actions[actId];
        const actionTitle = action.info?.title || 'Action';
        const tasks = action.tasks || {};

        Object.keys(tasks).forEach(taskId => {
          const task = tasks[taskId];
          const deadlineDate = new Date(task.deadline);
          const isOverdue = now > deadlineDate && task.status !== 'completed';
          const hoursRemaining = (deadlineDate - now) / (1000 * 60 * 60);

          // Determine Urgency Category
          let urgencyClass = 'status-normal';
          let badgeClass = 'badge-normal';
          let badgeText = '';

          if (task.status === 'completed') {
            urgencyClass = 'status-completed';
            badgeClass = 'badge-done';
            badgeText = '✓ [TERMINÉE]';
          } else if (isOverdue) {
            urgencyClass = 'status-urgent';
            badgeClass = 'badge-urgent';
            const hoursOverdue = Math.max(1, Math.round((now - deadlineDate) / (1000 * 60 * 60)));
            badgeText = `🚨 [RETARD ${hoursOverdue}h]`;
          } else if (hoursRemaining <= 24) {
            urgencyClass = 'status-warning';
            badgeClass = 'badge-warning';
            const hrs = Math.max(1, Math.round(hoursRemaining));
            badgeText = `⏰ [URGENT ${hrs}h]`;
          } else {
            urgencyClass = 'status-normal';
            badgeClass = 'badge-normal';
            badgeText = `🗓️ [${deadlineDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}]`;
          }

          // Assigned member names and initials
          const assignedMembers = (task.assignedTo || []).map(uid => {
            const m = members[uid];
            return m ? { id: uid, name: m.displayName, initial: m.displayName.charAt(0) } : { id: uid, name: 'Membre inconnu', initial: '?' };
          });
          const assignedNames = assignedMembers.map(m => m.name);

          allTasks.push({
            ...task,
            commissionId: commId,
            commissionName: commName,
            actionId: actId,
            actionTitle: actionTitle,
            isOverdue,
            hoursRemaining,
            urgencyClass,
            badgeClass,
            badgeText,
            assignedMembers,
            assignedNames
          });
        });
      });
    });

    // Sorting: Overdue first -> <24h -> Normal -> Completed last
    allTasks.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    return allTasks;
  }

  render() {
    if (!this.container || !window.dbStore) return;

    const currentUser = window.authManager.getCurrentUser();
    const tasks = this.getAllTasksWithMetadata();

    // Filter tasks based on selected tab
    const filtered = tasks.filter(task => {
      if (this.currentFilter === 'mine') {
        return task.assignedTo && task.assignedTo.includes(currentUser.id);
      }
      if (this.currentFilter === 'overdue') {
        return task.isOverdue;
      }
      if (this.currentFilter === 'completed') {
        return task.status === 'completed';
      }
      return true;
    });

    if (filtered.length === 0) {
      let emptyMsg = "Aucune tâche répertoriée dans cette catégorie.";
      if (this.currentFilter === 'mine') emptyMsg = "Bravo ! Vous n'avez aucune tâche assignée en attente.";
      if (this.currentFilter === 'overdue') emptyMsg = "Superbe ! Aucun retard constaté sur l'ensemble du club.";
      if (this.currentFilter === 'completed') emptyMsg = "Aucune tâche terminée pour le moment.";

      this.container.innerHTML = `
        <div class="interact-card" style="text-align:center; padding: 36px 20px;">
          <p style="color:var(--text-muted); font-size:0.92rem;">${emptyMsg}</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(task => {
      const isChecked = task.status === 'completed';
      const canToggle = window.authManager.canCompleteTask(task);
      const submissions = window.dbStore.getTaskSubmissions(task.id);
      const hasSubmissions = Object.keys(submissions).length > 0;
      const hasValidatedSub = Object.values(submissions).some(s => s.validated);

      let deliverableBadge = '';
      if (hasValidatedSub) {
        deliverableBadge = `<span class="status-tag done" style="font-size:0.68rem;">📎 Livrable Validé</span>`;
      } else if (hasSubmissions) {
        deliverableBadge = `<span class="status-tag inprogress" style="font-size:0.68rem;">⏳ Livrable en Attente</span>`;
      }
      const isChefOrBoard = window.authManager.canManageAction(task.commissionId);
      let flagReviewBadge = '';
      if (task.flagReview) {
        flagReviewBadge = `<span class="status-tag warning" style="font-size:0.68rem; border-color:#F7A81B;">🛡️ Sanction Gelée (Chef Review)</span>`;
      }

      html += `
        <div class="interact-card task-card ${task.urgencyClass}" id="task-card-${task.id}">
          <div class="task-card-inner">
            <input 
              type="checkbox" 
              class="task-custom-checkbox" 
              ${isChecked ? 'checked' : ''} 
              ${!canToggle ? 'disabled' : ''}
              onchange="window.tasksManager.handleToggleTask('${task.commissionId}', '${task.actionId}', '${task.id}', this.checked)"
              title="${canToggle ? 'Valider la tâche' : 'Non autorisé'}"
            />
            
            <div class="task-card-content">
              <div class="task-card-header-row" onclick="window.taskWorkspaceManager.openWorkspace('${task.commissionId}', '${task.actionId}', '${task.id}')">
                <h4 class="task-card-title">${task.title}</h4>
                <div style="display:flex; gap:6px; align-items:center;">
                  ${flagReviewBadge}
                  <span class="status-tag ${task.badgeClass}">
                    ${task.badgeText}
                  </span>
                </div>
              </div>

              <div class="task-card-meta-row">
                <span class="meta-pill commission-pill">
                  📁 ${task.commissionName}
                </span>
                <span class="meta-pill action-pill">
                  🎯 ${task.actionTitle}
                </span>
                <span class="meta-pill assignee-pill">
                  👤 ${memberNames}
                </span>
                ${deliverableBadge}
                
                <span class="btn-link task-open-btn" onclick="window.taskWorkspaceManager.openWorkspace('${task.commissionId}', '${task.actionId}', '${task.id}')">
                  Espace Rendu ➔
                </span>

                ${isChefOrBoard ? `
                  <button 
                    class="btn-secondary compact" 
                    style="font-size:0.68rem; padding:2px 8px; margin-left:auto;" 
                    onclick="window.tasksManager.handleToggleFlagReview('${task.commissionId}', '${task.actionId}', '${task.id}', ${!task.flagReview})"
                    title="Geler temporairement l'application des sanctions automatiques pour cette tâche"
                  >
                    ${task.flagReview ? '🔓 Dégeler Sanction' : '🛡️ Geler Sanction'}
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
  }

  handleToggleFlagReview(commissionId, actionId, taskId, isFlagged) {
    window.dbStore.setTaskFlagReview(commissionId, actionId, taskId, isFlagged);
    if (isFlagged) {
      window.app.showToast('Sanction automatique gelée pour révision par le Chef. 🛡️', 'warning');
    } else {
      window.app.showToast('Surveillance automatique réactivée sur la tâche.', 'success');
    }
  }

  handleToggleTask(commissionId, actionId, taskId, isChecked) {
    window.dbStore.toggleTaskStatus(commissionId, actionId, taskId, isChecked);
    
    if (isChecked) {
      window.app.showToast('Tâche validée avec succès ! ✨', 'success');
    } else {
      window.app.showToast('Tâche marquée comme en attente.', 'warning');
    }
  }
}

// Global tasks manager instance
const tasksManager = new TasksManager();
window.tasksManager = tasksManager;
