/**
 * ==========================================================================
 * SHARED INTERACTIVE CALENDAR & SCHEDULE MANAGER
 * Month Grid, Week Columns, and Agenda List with Task Deadlines & Events
 * Fully Defensive Programming with Optional Chaining & Fallbacks
 * ==========================================================================
 */

class CalendarManager {
  constructor() {
    this.container = null;
    this.currentDate = new Date();
    this.currentView = 'month'; // 'month' | 'week' | 'agenda'
    this.currentFilter = 'all'; // 'all' | 'statutaire' | 'action' | 'deadline' | 'formation'
  }

  init() {
    try {
      this.container = document.getElementById('view-calendar');
      this.render();

      // Subscribe to database changes
      if (window.dbStore) {
        window.dbStore.subscribe(() => {
          try {
            if (window.app && window.app.currentTab === 'calendar') {
              this.render();
            }
          } catch (e) {
            console.error('Calendar render on DB update error:', e);
          }
        });
      }
    } catch (err) {
      console.error('CalendarManager init error:', err);
    }
  }

  setView(view) {
    this.currentView = view;
    this.render();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.render();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.render();
  }

  getAllEventsAndDeadlines() {
    if (!window.dbStore) return [];

    try {
      const club = window.dbStore.getClub() || {};
      const rawEvents = Object.values(club.events_schedule || {});
      const combined = [...rawEvents];

      // Pull all task deadlines safely into the calendar
      const allTasks = window.tasksManager?.getAllTasksWithMetadata?.() || [];
      allTasks.forEach(t => {
        if (!t) return;
        
        let assignedText = 'Non assigné';
        if (Array.isArray(t.assignedNames) && t.assignedNames.length > 0) {
          assignedText = t.assignedNames.join(', ');
        } else if (Array.isArray(t.assignedMembers) && t.assignedMembers.length > 0) {
          assignedText = t.assignedMembers.map(m => m?.name || m || 'Membre').join(', ');
        } else if (Array.isArray(t.assignedTo) && t.assignedTo.length > 0) {
          assignedText = t.assignedTo.join(', ');
        }

        const deadlineDate = t.deadline || new Date().toISOString();

        combined.push({
          id: 'task_event_' + (t.id || Math.random().toString(36).substr(2, 9)),
          clubId: club.info?.id || 'interact_carthage',
          actionId: t.actionId || '',
          title: `⏰ Échéance : ${t.title || 'Tâche sans titre'}`,
          description: `Tâche assignée à : ${assignedText} (${t.commissionName || 'Commission'})`,
          startDateTime: deadlineDate,
          endDateTime: deadlineDate,
          location: 'Suivi de Commission',
          type: 'deadline',
          isPublicToClub: true,
          isTask: true,
          taskData: t
        });
      });

      // Sort by date ascending safely
      combined.sort((a, b) => {
        const dateA = new Date(a?.startDateTime || 0).getTime();
        const dateB = new Date(b?.startDateTime || 0).getTime();
        return dateA - dateB;
      });

      return combined;
    } catch (err) {
      console.error('Error in getAllEventsAndDeadlines:', err);
      return [];
    }
  }

  render() {
    if (!this.container || !window.dbStore) return;

    try {
      const currentUser = window.authManager?.getCurrentUser?.() || { role: 'membre' };
      const canAddEvent = ['president', 'vice_president', 'secretaire', 'protocole', 'chef_commission', 'representant'].includes(currentUser.role);
      const allEvents = this.getAllEventsAndDeadlines();

      const filteredEvents = allEvents.filter(ev => {
        if (!ev) return false;
        if (this.currentFilter === 'all') return true;
        return ev.type === this.currentFilter;
      });

      const monthName = this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      // 1. Build View Content
      let viewContentHtml = '';

      if (this.currentView === 'agenda') {
        if (filteredEvents.length === 0) {
          viewContentHtml = `
            <div class="interact-card" style="text-align:center; padding:30px;">
              <p style="color:var(--text-muted);">Aucun événement prévu dans cette sélection.</p>
            </div>
          `;
        } else {
          let agendaListHtml = '';
          filteredEvents.forEach(ev => {
            if (!ev) return;
            const evDate = new Date(ev.startDateTime || Date.now());
            const dayNum = evDate.getDate();
            const monthShort = evDate.toLocaleDateString('fr-FR', { month: 'short' });
            const timeStr = evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            agendaListHtml += `
              <div class="agenda-item-card type-${ev.type || 'action'}">
                <div class="agenda-date-badge">
                  <span class="agenda-day-num">${dayNum}</span>
                  <span class="agenda-month-str">${monthShort}</span>
                </div>
                <div class="agenda-details-col">
                  <div class="agenda-card-title-row">
                    <h4>${ev.title || 'Événement'}</h4>
                    <span class="status-tag ${ev.type || 'normal'}">${ev.type || 'action'}</span>
                  </div>
                  <p class="agenda-desc-text">${ev.description || ''}</p>
                  <div class="agenda-meta-row">
                    <span>🕒 ${timeStr}</span>
                    ${ev.location ? `<span>📍 ${ev.location}</span>` : ''}
                  </div>
                </div>
              </div>
            `;
          });
          viewContentHtml = `<div class="agenda-list-wrapper">${agendaListHtml}</div>`;
        }
      } else {
        // Month Grid View
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let daysGridHtml = '';

        // Blank cells before month start
        for (let i = 0; i < firstDayIndex; i++) {
          daysGridHtml += `<div class="calendar-cell-empty"></div>`;
        }

        // Month days
        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
          const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
          
          // Find events on this day
          const dayEvents = filteredEvents.filter(ev => {
            if (!ev?.startDateTime) return false;
            const eDate = new Date(ev.startDateTime);
            return eDate.getDate() === d && eDate.getMonth() === month && eDate.getFullYear() === year;
          });

          let eventChipsHtml = '';
          dayEvents.slice(0, 2).forEach(ev => {
            const evTitle = ev.title || 'Événement';
            eventChipsHtml += `
              <div class="cal-event-chip type-${ev.type || 'normal'}" title="${evTitle}">
                ${evTitle.slice(0, 18)}
              </div>
            `;
          });
          if (dayEvents.length > 2) {
            eventChipsHtml += `<div class="cal-event-more">+${dayEvents.length - 2} autres</div>`;
          }

          daysGridHtml += `
            <div class="calendar-cell-day ${isToday ? 'today' : ''}">
              <span class="day-number-label">${d}</span>
              <div class="day-chips-container">${eventChipsHtml}</div>
            </div>
          `;
        }

        viewContentHtml = `
          <div class="month-calendar-table">
            <div class="calendar-weekdays-header">
              <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
            </div>
            <div class="calendar-days-grid">
              ${daysGridHtml}
            </div>
          </div>
        `;
      }

      // 2. Assemble Master Calendar View
      this.container.innerHTML = `
        <div class="calendar-master-card">
          <!-- Top Navigation Bar -->
          <div class="calendar-header-toolbar">
            <div class="calendar-month-selector">
              <button class="btn-cal-arrow" onclick="window.calendarManager.prevMonth()">◀</button>
              <h3 class="calendar-current-month">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3>
              <button class="btn-cal-arrow" onclick="window.calendarManager.nextMonth()">▶</button>
            </div>

            <!-- View Switcher -->
            <div class="calendar-view-switcher">
              <button class="cal-view-btn ${this.currentView === 'month' ? 'active' : ''}" onclick="window.calendarManager.setView('month')">
                Mois
              </button>
              <button class="cal-view-btn ${this.currentView === 'agenda' ? 'active' : ''}" onclick="window.calendarManager.setView('agenda')">
                Agenda
              </button>
            </div>

            ${canAddEvent ? `
              <button class="btn-primary" style="padding:6px 14px; font-size:0.78rem; width:auto;" onclick="window.calendarManager.openNewEventModal()">
                + Événement
              </button>
            ` : ''}
          </div>

          <!-- Filter Chips Bar -->
          <div class="calendar-filter-chips-bar">
            <button class="cal-filter-pill ${this.currentFilter === 'all' ? 'active' : ''}" onclick="window.calendarManager.setFilter('all')">
              Tous (${allEvents.length})
            </button>
            <button class="cal-filter-pill type-statutaire ${this.currentFilter === 'statutaire' ? 'active' : ''}" onclick="window.calendarManager.setFilter('statutaire')">
              🏛️ Statutaires
            </button>
            <button class="cal-filter-pill type-action ${this.currentFilter === 'action' ? 'active' : ''}" onclick="window.calendarManager.setFilter('action')">
              🎯 Actions
            </button>
            <button class="cal-filter-pill type-deadline ${this.currentFilter === 'deadline' ? 'active' : ''}" onclick="window.calendarManager.setFilter('deadline')">
              ⏰ Deadlines
            </button>
            <button class="cal-filter-pill type-formation ${this.currentFilter === 'formation' ? 'active' : ''}" onclick="window.calendarManager.setFilter('formation')">
              🎓 Formations
            </button>
          </div>

          <!-- Render View -->
          <div class="calendar-render-viewport">
            ${viewContentHtml}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('CalendarManager render error:', err);
    }
  }

  openNewEventModal() {
    const defaultStart = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
    const modalBody = `
      <form id="form-new-calendar-event" onsubmit="window.calendarManager.handleCreateEvent(event)">
        <div class="form-group">
          <label class="form-label">Titre de l'événement *</label>
          <input type="text" name="title" class="form-input" placeholder="Ex: Réunion statutaire, Action caritative..." required />
        </div>
        <div class="form-group">
          <label class="form-label">Type d'événement</label>
          <select name="type" class="form-select">
            <option value="statutaire">🏛️ Réunion Statutaire</option>
            <option value="action">🎯 Action sur le terrain</option>
            <option value="deadline">⏰ Échéance / Deadline de Projet</option>
            <option value="formation">🎓 Formation / Séminaire / RYLA</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description & Ordre du jour</label>
          <textarea name="description" class="form-textarea" placeholder="Détails du déroulement, consignes aux membres..."></textarea>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label class="form-label">Date & Heure Début *</label>
            <input type="datetime-local" name="startDateTime" class="form-input" value="${defaultStart}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date & Heure Fin</label>
            <input type="datetime-local" name="endDateTime" class="form-input" value="${defaultStart}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Lieu ou Lien Visioconférence</label>
          <input type="text" name="location" class="form-input" placeholder="Ex: Siège Rotary Carthage / Meet" />
        </div>
        <button type="submit" class="btn-primary" style="margin-top:10px;">
          📅 Enregistrer au Calendrier du Club
        </button>
      </form>
    `;

    window.app.openModal('📅 Nouvel Événement au Planning', modalBody);
  }

  handleCreateEvent(event) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value.trim();
    const type = form.type.value;
    const description = form.description.value.trim();
    const startDateTime = new Date(form.startDateTime.value).toISOString();
    const endDateTime = form.endDateTime.value ? new Date(form.endDateTime.value).toISOString() : startDateTime;
    const location = form.location.value.trim();

    if (!title || !startDateTime) return;

    window.dbStore.addEvent({
      title,
      type,
      description,
      startDateTime,
      endDateTime,
      location
    });

    window.app.closeModal();
    window.app.showToast('Événement ajouté au calendrier officiel du club ! 📅', 'success');
    this.render();
  }
}

// Global calendar manager instance
const calendarManager = new CalendarManager();
window.calendarManager = calendarManager;
