import React, { useState } from 'react';

export interface CalendarEvent {
  id: string;
  clubId: string;
  actionId?: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  type: 'statutaire' | 'action' | 'deadline' | 'formation';
  isPublicToClub: boolean;
}

interface ScheduleCalendarViewProps {
  events: CalendarEvent[];
  currentUserRole: string;
  onAddEvent: (eventData: Omit<CalendarEvent, 'id' | 'clubId'>) => void;
}

type CalendarViewMode = 'month' | 'week' | 'agenda';

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  events,
  currentUserRole,
  onAddEvent,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<'statutaire' | 'action' | 'deadline' | 'formation'>('statutaire');

  const canAddEvent = [
    'president',
    'vice_president',
    'secretaire',
    'protocole',
    'chef_commission',
    'representant',
  ].includes(currentUserRole);

  const filteredEvents = events.filter((ev) => {
    if (selectedFilter === 'all') return true;
    return ev.type === selectedFilter;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDateTime) return;

    onAddEvent({
      title,
      description,
      startDateTime,
      endDateTime: endDateTime || startDateTime,
      location,
      type: eventType,
      isPublicToClub: true,
    });

    setTitle('');
    setDescription('');
    setStartDateTime('');
    setEndDateTime('');
    setLocation('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="calendar-view-wrapper">
      {/* Calendar Header Controls */}
      <div className="calendar-top-controls">
        <div className="calendar-navigation">
          <button
            className="btn-calendar-nav"
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1
                )
              )
            }
          >
            ◀
          </button>
          <h3 className="calendar-month-label">
            {currentDate.toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <button
            className="btn-calendar-nav"
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1
                )
              )
            }
          >
            ▶
          </button>
        </div>

        {/* View Switcher Chips (Month / Week / Agenda) */}
        <div className="view-mode-tabs">
          <button
            className={`tab-chip ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mois
          </button>
          <button
            className={`tab-chip ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semaine
          </button>
          <button
            className={`tab-chip ${viewMode === 'agenda' ? 'active' : ''}`}
            onClick={() => setViewMode('agenda')}
          >
            Agenda
          </button>
        </div>

        {canAddEvent && (
          <button
            className="btn-primary-compact"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Événement
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="calendar-filters-bar">
        <button
          className={`filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          Tous ({events.length})
        </button>
        <button
          className={`filter-pill type-statutaire ${
            selectedFilter === 'statutaire' ? 'active' : ''
          }`}
          onClick={() => setSelectedFilter('statutaire')}
        >
          🏛️ Statutaires
        </button>
        <button
          className={`filter-pill type-action ${
            selectedFilter === 'action' ? 'active' : ''
          }`}
          onClick={() => setSelectedFilter('action')}
        >
          🎯 Actions
        </button>
        <button
          className={`filter-pill type-deadline ${
            selectedFilter === 'deadline' ? 'active' : ''
          }`}
          onClick={() => setSelectedFilter('deadline')}
        >
          ⏰ Deadlines
        </button>
        <button
          className={`filter-pill type-formation ${
            selectedFilter === 'formation' ? 'active' : ''
          }`}
          onClick={() => setSelectedFilter('formation')}
        >
          🎓 Formations / RYLA
        </button>
      </div>

      {/* View Content */}
      {viewMode === 'agenda' ? (
        <div className="agenda-list-container">
          {filteredEvents.length === 0 ? (
            <div className="empty-agenda">
              Aucun événement prévu dans cette sélection.
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <div key={ev.id} className={`agenda-card type-${ev.type}`}>
                <div className="agenda-date-box">
                  <span className="agenda-day">
                    {new Date(ev.startDateTime).getDate()}
                  </span>
                  <span className="agenda-month">
                    {new Date(ev.startDateTime).toLocaleDateString('fr-FR', {
                      month: 'short',
                    })}
                  </span>
                </div>
                <div className="agenda-info">
                  <div className="agenda-title-row">
                    <h4>{ev.title}</h4>
                    <span className={`event-type-badge ${ev.type}`}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="agenda-desc">{ev.description}</p>
                  <div className="agenda-footer">
                    <span>
                      🕒{' '}
                      {new Date(ev.startDateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {ev.location && <span>📍 {ev.location}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Month Grid View */
        <div className="month-calendar-grid">
          <div className="weekdays-row">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="weekday-header">
                {day}
              </div>
            ))}
          </div>

          <div className="days-matrix">
            {/* Simple standard 35 days matrix rendering */}
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNumber = (i % 31) + 1;
              const hasEvents = filteredEvents.filter(
                (e) => new Date(e.startDateTime).getDate() === dayNumber
              );

              return (
                <div key={i} className="calendar-day-cell">
                  <span className="day-number">{dayNumber}</span>
                  <div className="day-events-dots">
                    {hasEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`event-dot-chip type-${ev.type}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop active">
          <div className="modal-content">
            <header className="modal-header">
              <h3>📅 Nouvel Événement au Planning</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </header>
            <form onSubmit={handleCreateEvent} className="event-form">
              <div className="form-group">
                <label className="form-label">Titre de l'événement *</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Réunion statutaire, Don du sang..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type d'événement</label>
                <select
                  className="form-select"
                  value={eventType}
                  onChange={(e) =>
                    setEventType(
                      e.target.value as
                        | 'statutaire'
                        | 'action'
                        | 'deadline'
                        | 'formation'
                    )
                  }
                >
                  <option value="statutaire">🏛️ Réunion Statutaire</option>
                  <option value="action">🎯 Action sur le terrain</option>
                  <option value="deadline">⏰ Échéance / Deadline</option>
                  <option value="formation">🎓 Formation / Séminaire</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description & Ordre du jour</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails du programme et consignes..."
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Date & Heure Début *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date & Heure Fin</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lieu ou Lien Visioconférence</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Siège Rotary, En ligne via Meet..."
                />
              </div>

              <button type="submit" className="btn-primary">
                Enregistrer au Calendrier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
