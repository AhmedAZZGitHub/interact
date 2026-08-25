/**
 * ==========================================================================
 * TASK WORKSPACE & DELIVERABLE SUBMISSION MANAGER
 * Dedicated workspace for submitting proofs, files, links and chef validation.
 * ==========================================================================
 */

class TaskWorkspaceManager {
  constructor() {
    this.activeTaskId = null;
    this.uploadedFiles = [];
  }

  openWorkspace(commissionId, actionId, taskId) {
    this.activeTaskId = taskId;
    this.activeCommissionId = commissionId;
    this.activeActionId = actionId;
    this.uploadedFiles = [];

    this.renderModal();
  }

  renderModal() {
    if (!window.dbStore || !this.activeTaskId) return;

    const club = window.dbStore.getClub();
    const comm = club.commissions?.[this.activeCommissionId];
    const action = comm?.actions?.[this.activeActionId];
    const task = action?.tasks?.[this.activeTaskId];
    if (!task) return;

    const currentUser = window.authManager.getCurrentUser();
    const submissions = window.dbStore.getTaskSubmissions(this.activeTaskId);
    const subList = Object.values(submissions).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const isAssigned = (task.assignedTo || []).includes(currentUser.id);
    const canValidate = ['president', 'vice_president', 'chef_commission', 'co_chef'].includes(currentUser.role);

    // 1. Build Submissions List HTML
    let submissionsHtml = '';
    if (subList.length === 0) {
      submissionsHtml = `
        <div class="empty-submission-box">
          <p>Aucun livrable déposé pour le moment sur cette tâche.</p>
          <p style="font-size:0.75rem; color:var(--text-dim);">Déposez vos justificatifs ci-dessous pour validation par votre Chef de Commission.</p>
        </div>
      `;
    } else {
      subList.forEach(sub => {
        const timeStr = new Date(sub.submittedAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });

        let filesHtml = '';
        if (sub.fileUrls && sub.fileUrls.length > 0) {
          sub.fileUrls.forEach((url, i) => {
            filesHtml += `
              <a href="${url}" target="_blank" rel="noreferrer" class="deliverable-file-chip">
                📎 Document / Livrable #${i + 1} ↗
              </a>
            `;
          });
        }

        submissionsHtml += `
          <div class="submission-history-item ${sub.validated ? 'validated' : 'pending'}">
            <div class="submission-top-row">
              <span style="font-weight:700; color:#FFF; font-size:0.85rem;">👤 ${sub.submitterName}</span>
              <span class="submission-status-pill ${sub.validated ? 'validated' : 'pending'}">
                ${sub.validated ? '✅ Validé par le Chef' : '⏳ En attente de validation'}
              </span>
            </div>
            <p class="submission-text-content">${sub.textNotes}</p>
            ${filesHtml ? `<div class="submission-files-row">${filesHtml}</div>` : ''}
            <div class="submission-timestamp">Déposé le ${timeStr}</div>

            ${sub.validated && sub.validationFeedback ? `
              <div class="submission-feedback-box">
                💬 <strong>Commentaire du Chef (${sub.validatedBy || 'Commission'}) :</strong> ${sub.validationFeedback}
              </div>
            ` : ''}

            ${canValidate && !sub.validated ? `
              <div class="validation-action-panel">
                <input 
                  type="text" 
                  id="feedback-input-${sub.id}" 
                  class="form-input" 
                  placeholder="Commentaire de validation ou félicitations..." 
                  style="font-size:0.8rem; margin-bottom:8px;"
                />
                <button 
                  class="btn-success" 
                  style="width:100%; font-size:0.82rem; padding:8px;"
                  onclick="window.taskWorkspaceManager.handleValidateSubmission('${sub.id}')"
                >
                  ✅ Valider le Livrable & Clôturer la Tâche
                </button>
              </div>
            ` : ''}
          </div>
        `;
      });
    }

    // 2. Render File Chips
    let fileChipsHtml = '';
    this.uploadedFiles.forEach((fileUrl, idx) => {
      fileChipsHtml += `
        <div class="file-chip-tag">
          <span>🔗 ${fileUrl.length > 35 ? fileUrl.slice(0, 32) + '...' : fileUrl}</span>
          <button type="button" onclick="window.taskWorkspaceManager.removeFile(${idx})">✕</button>
        </div>
      `;
    });

    const modalBody = `
      <div class="task-workspace-container">
        <!-- Task Header Banner -->
        <div class="task-workspace-hero">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h4 style="color:#FFF; font-size:1.05rem; margin-bottom:4px;">${task.title}</h4>
              <p style="font-size:0.78rem; color:var(--interact-gold);">
                📁 ${comm?.info?.name || 'Commission'} • ${action?.info?.title || 'Action'}
              </p>
            </div>
            <span class="header-badge" style="${task.status === 'completed' ? 'background:rgba(52,199,89,0.2); color:var(--success-green); border-color:var(--success-green);' : ''}">
              ${task.status === 'completed' ? '✓ Terminée' : 'En cours'}
            </span>
          </div>
        </div>

        <!-- Section 1: Deposer un livrable -->
        <div class="workspace-section-card">
          <h5 style="color:#FFF; margin-bottom:6px; font-size:0.9rem;">📤 Déposer un Rendu / Livrable</h5>
          <form onsubmit="window.taskWorkspaceManager.handleSubmitDeliverable(event)">
            <div class="form-group">
              <label class="form-label">Compte-rendu d'exécution & Notes explicatives *</label>
              <textarea 
                name="notes" 
                class="form-textarea" 
                placeholder="Détaillez les actions réalisées, les montants, les démarches effectuées..." 
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Liens de Fichiers, Photos ou Google Drive</label>
              <div style="display:flex; gap:8px;">
                <input 
                  type="url" 
                  id="task-file-url-input" 
                  class="form-input" 
                  placeholder="https://drive.google.com/file/..." 
                />
                <button type="button" class="btn-secondary" onclick="window.taskWorkspaceManager.addFileUrl()">
                  + Ajouter
                </button>
              </div>
              <div class="file-chips-wrapper" id="task-file-chips-wrapper">
                ${fileChipsHtml}
              </div>
            </div>

            <button type="submit" class="btn-primary" style="margin-top:8px;">
              🚀 Soumettre le Livrable au Chef de Commission
            </button>
          </form>
        </div>

        <!-- Section 2: Historique -->
        <div class="workspace-section-card" style="margin-top:14px;">
          <h5 style="color:#FFF; margin-bottom:10px; font-size:0.9rem;">📋 Historique des Livrables Soumis</h5>
          <div class="submissions-stream">
            ${submissionsHtml}
          </div>
        </div>
      </div>
    `;

    window.app.openModal(`📁 Espace de Rendu — ${task.title}`, modalBody);
  }

  addFileUrl() {
    const input = document.getElementById('task-file-url-input');
    if (input && input.value.trim()) {
      this.uploadedFiles.push(input.value.trim());
      input.value = '';
      this.renderModal();
    }
  }

  removeFile(index) {
    this.uploadedFiles.splice(index, 1);
    this.renderModal();
  }

  handleSubmitDeliverable(event) {
    event.preventDefault();
    const form = event.target;
    const notes = form.notes.value.trim();
    const currentUser = window.authManager.getCurrentUser();

    if (!notes) return;

    window.dbStore.addTaskSubmission(this.activeTaskId, {
      submittedBy: [currentUser.id],
      submitterName: currentUser.displayName,
      textNotes: notes,
      fileUrls: [...this.uploadedFiles]
    });

    this.uploadedFiles = [];
    window.app.showToast('Livrable soumis avec succès ! Notification envoyée au Chef. ✨', 'success');
    this.renderModal();
  }

  handleValidateSubmission(submissionId) {
    const feedbackInput = document.getElementById(`feedback-input-${submissionId}`);
    const feedback = feedbackInput ? feedbackInput.value.trim() : '';
    const currentUser = window.authManager.getCurrentUser();

    window.dbStore.validateTaskSubmission(
      this.activeTaskId,
      submissionId,
      true,
      feedback,
      `${currentUser.displayName} (${window.ROLE_LABELS[currentUser.role] || currentUser.role})`
    );

    window.app.showToast('Livrable validé et tâche marquée comme terminée ! 🏆', 'success');
    this.renderModal();
  }
}

// Global task workspace instance
const taskWorkspaceManager = new TaskWorkspaceManager();
window.taskWorkspaceManager = taskWorkspaceManager;
