// Self-Injecting Stylesheet
(function injectSavedNotesStyles() {
  const styles = `
    .saved-notes-view {
      color: #e2e8f0;
      animation: fadeIn 0.4s ease-out;
    }
    
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .note-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .note-card:hover {
      border-color: rgba(168, 85, 247, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.15);
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 12px;
    }

    .note-date {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .note-content {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      white-space: pre-wrap;
      flex-grow: 1;
    }
    
    .no-notes-state {
      padding: 60px 20px;
      text-align: center;
      background: rgba(255,255,255,0.01);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 16px;
      margin-top: 20px;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
})();

function SavedNotesDashboard() {
  const [notes, setNotes] = React.useState([]);

  // Fetch saved notes on mount
  React.useEffect(() => {
    const loadNotes = () => {
      try {
        const stored = localStorage.getItem('ekvueCandidateSavedNotes');
        if (stored) {
          setNotes(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to parse saved notes:", err);
      }
    };
    
    loadNotes();
    
    // Set up a small interval to poll for updates in case they ended an interview in another tab
    const intervalId = setInterval(loadNotes, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const deleteNote = (id) => {
    const newNotes = notes.filter(n => n.id !== id);
    setNotes(newNotes);
    localStorage.setItem('ekvueCandidateSavedNotes', JSON.stringify(newNotes));
  };

  return (
    <div className="saved-notes-view">
      <div className="welcome">
        <h1>Your Saved Interview Notes</h1>
        <p>Review the technical notes and scratchpad logs you saved during your live mock interviews.</p>
      </div>

      {notes.length === 0 ? (
        <div className="no-notes-state">
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
          <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>No Saved Notes Yet</h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
            When you participate in a mock interview, any text you write in the "Notes" panel will be automatically saved here once you end the interview.
          </p>
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-header">
                <div className="note-date">
                  <span>🕒</span> {note.date}
                </div>
                <button 
                  onClick={() => deleteNote(note.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  Delete
                </button>
              </div>
              <div className="note-content">
                {note.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Bootstrap React App
const rootEl = document.getElementById('saved-notes-react-root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<SavedNotesDashboard />);
}
