import React, { useState } from 'react';

export interface TaskSubmission {
  id: string;
  taskId: string;
  clubId: string;
  submittedBy: string[];
  submitterName: string;
  textNotes: string;
  fileUrls: string[];
  submittedAt: string;
  validated: boolean;
  validatedBy?: string | null;
  validationFeedback?: string | null;
}

export interface TaskItem {
  id: string;
  title: string;
  commissionId: string;
  commissionName: string;
  actionTitle: string;
  deadline: string;
  status: 'pending' | 'completed';
  assignedTo: string[];
}

interface TaskSubmissionModalProps {
  task: TaskItem;
  submissions: TaskSubmission[];
  currentUserId: string;
  currentUserRole: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDeliverable: (taskId: string, notes: string, fileUrls: string[]) => void;
  onValidateSubmission: (submissionId: string, isValid: boolean, feedback?: string) => void;
}

export const TaskSubmissionModal: React.FC<TaskSubmissionModalProps> = ({
  task,
  submissions,
  currentUserId,
  currentUserRole,
  isOpen,
  onClose,
  onSubmitDeliverable,
  onValidateSubmission,
}) => {
  const [notes, setNotes] = useState('');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [fileList, setFileList] = useState<string[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');

  if (!isOpen) return null;

  const canValidate =
    ['president', 'vice_president', 'chef_commission', 'co_chef'].includes(
      currentUserRole
    );

  const handleAddFileUrl = () => {
    if (fileUrlInput.trim()) {
      setFileList([...fileList, fileUrlInput.trim()]);
      setFileUrlInput('');
    }
  };

  const handleRemoveFile = (index: number) => {
    setFileList(fileList.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && fileList.length === 0) return;
    onSubmitDeliverable(task.id, notes, fileList);
    setNotes('');
    setFileList([]);
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-content task-workspace-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h3 className="modal-title">📁 Espace de Rendu — {task.title}</h3>
            <span className="task-sub-meta">
              {task.commissionName} • {task.actionTitle} • Échéance :{' '}
              {new Date(task.deadline).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="task-workspace-body">
          {/* Section 1: Submit a new deliverable */}
          <section className="submission-form-card">
            <h4>📤 Déposer un Livrable / Rendu de Tâche</h4>
            <p className="helper-text">
              Déposez vos justificatifs, photos, documents ou liens Google Drive pour validation.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Notes & Compte-rendu d'exécution</label>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Expliquez ce qui a été réalisé, les résultats obtenus, les points d'attention..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Liens de fichiers ou Photos (Drive, Dropbox, Images)</label>
                <div className="file-input-row">
                  <input
                    type="url"
                    className="form-input"
                    value={fileUrlInput}
                    onChange={(e) => setFileUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/file/..."
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddFileUrl}
                  >
                    + Ajouter
                  </button>
                </div>

                {/* Uploaded File Chips */}
                <div className="file-chips-container">
                  {fileList.map((url, idx) => (
                    <div key={idx} className="file-chip">
                      <span>🔗 {url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary">
                🚀 Soumettre le Livrable pour Validation
              </button>
            </form>
          </section>

          {/* Section 2: Submissions History & Validation Workflow */}
          <section className="submissions-history-card">
            <h4>📋 Historique des Livrables Déposés</h4>

            {submissions.length === 0 ? (
              <p className="empty-state-text">
                Aucun livrable déposé pour le moment sur cette tâche.
              </p>
            ) : (
              <div className="submissions-list">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`submission-item ${
                      sub.validated ? 'validated' : 'pending'
                    }`}
                  >
                    <div className="submission-header">
                      <span className="submitter-name">
                        👤 {sub.submitterName}
                      </span>
                      <span
                        className={`status-badge ${
                          sub.validated ? 'badge-validated' : 'badge-pending'
                        }`}
                      >
                        {sub.validated ? '✅ Validé par le Chef' : '⏳ En attente de validation'}
                      </span>
                    </div>

                    <p className="submission-notes">{sub.textNotes}</p>

                    {sub.fileUrls && sub.fileUrls.length > 0 && (
                      <div className="submission-files">
                        {sub.fileUrls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-link"
                          >
                            📎 Fichier / Photo #{i + 1}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="submission-date">
                      Déposé le{' '}
                      {new Date(sub.submittedAt).toLocaleString('fr-FR')}
                    </div>

                    {/* Validation Actions for Commission Chef */}
                    {canValidate && !sub.validated && (
                      <div className="validation-actions-box">
                        <input
                          type="text"
                          placeholder="Commentaire de validation (optionnel)..."
                          className="form-input"
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                        />
                        <div className="validation-buttons">
                          <button
                            className="btn-success"
                            onClick={() =>
                              onValidateSubmission(sub.id, true, feedbackInput)
                            }
                          >
                            ✅ Valider & Clôturer la Tâche
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
