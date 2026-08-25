/**
 * ==========================================================================
 * TASKS & TO-DO MANAGER
 * Real-time tracking, urgency sorting (Red/Orange/Green), status toggles.
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
            badgeText = '✓ Terminée';
          } else if (isOverdue) {
            urgencyClass = 'status-urgent';
            badgeClass = 'badge-urgent';
            const hoursOverdue = Math.max(1, Math.round((now - deadlineDate) / (1000 * 60 * 60)));
            badgeText = `🚨 Retard (${hoursOverdue}h)`;
          } else if (hoursRemaining <= 24) {
            urgencyClass = 'status-warning';
            badgeClass = 'badge-warning';
            const hrs = Math.max(1, Math.round(hoursRemaining));
            badgeText = `⏰ Urgence (${hrs}h)`;
          } else {
            urgencyClass = 'status-normal';
            badgeClass = 'badge-normal';
            badgeText = `🗓️ ${deadlineDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
          }

          // Assigned member names
          const assignedNames = (task.assignedTo || []).map(uid => {
            return members[uid] ? members[uid].displayName : 'Membre inconnu';
          });

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

      this.container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 30px;">
          <p style="color:var(--text-muted); font-size:0.9rem;">${emptyMsg}</p>
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
        deliverableBadge = `<span class="deadline-badge badge-done" style="font-size:0.68rem;">📎 Livrable Validé</span>`;
      } else if (hasSubmissions) {
        deliverableBadge = `<span class="deadline-badge badge-warning" style="font-size:0.68rem;">⏳ Livrable en Attente</span>`;
      }

      html += `
        <div class="task-item ${task.urgencyClass}" id="task-card-${task.id}">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${isChecked ? 'checked' : ''} 
            ${!canToggle ? 'disabled' : ''}
            onchange="window.tasksManager.handleToggleTask('${task.commissionId}', '${task.actionId}', '${task.id}', this.checked)"
          />
          <div class="task-body" onclick="window.taskWorkspaceManager.openWorkspace('${task.commissionId}', '${task.actionId}', '${task.id}')" style="cursor:pointer;">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
              <span class="deadline-badge ${task.badgeClass}">${task.badgeText}</span>
              ${deliverableBadge}
              <span style="color:var(--interact-gold);">📁 ${task.commissionName}</span>
              <span class="task-assignee">👤 ${task.assignedNames.join(', ') || 'Non assigné'}</span>
              <span class="btn-link" style="font-size:0.72rem; padding:0; margin-left:auto;">
                Ouvrir l'Espace ➔
              </span>
            </div>
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
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
