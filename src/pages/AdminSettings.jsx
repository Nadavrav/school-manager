import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; 
import './AdminSettings.css';

const AdminSettings = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // משתנים לניהול מצב עריכה
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name'); 

    if (error) {
      console.error('Error fetching subjects:', error);
      setError('שגיאה בטעינת המקצועות');
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    if (subjects.some(sub => sub.name === newSubject.trim())) {
      setError('מקצוע זה כבר קיים במערכת');
      return;
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert([{ name: newSubject.trim() }])
      .select();

    if (error) {
      console.error('Error adding subject:', error);
      setError('שגיאה בהוספת המקצוע');
    } else if (data) {
      setSubjects([...subjects, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubject('');
      setError(null);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את המקצוע "${name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subject:', error);
      setError('שגיאה במחיקת המקצוע');
    } else {
      setSubjects(subjects.filter(sub => sub.id !== id));
      setError(null);
    }
  };

  // פונקציה חדשה לשמירת העריכה
  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    // בדיקה שלא שינינו לשם של מקצוע אחר שקיים
    if (subjects.some(sub => sub.name === editName.trim() && sub.id !== id)) {
      setError('מקצוע בשם זה כבר קיים במערכת');
      return;
    }

    const { error } = await supabase
      .from('subjects')
      .update({ name: editName.trim() })
      .eq('id', id);

    if (error) {
      console.error('Error updating subject:', error);
      setError('שגיאה בעדכון המקצוע');
    } else {
      setSubjects(subjects.map(sub => 
        sub.id === id ? { ...sub, name: editName.trim() } : sub
      ).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      setError(null);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.includes(searchTerm.trim())
  );

  if (loading && subjects.length === 0) {
    return <div className="page-container"><div className="loading">טוען הגדרות...</div></div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>הגדרות מערכת</h1>
          <p>ניהול תשתית המערכת ורשימות הבחירה</p>
        </div>
      </header>

      <div className="settings-content">
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="material-symbols-outlined icon">menu_book</span>
            <h2>מקצועות לימוד</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* --- סרגל כלים: חיפוש והוספה באותה שורה --- */}
          <div className="subjects-toolbar">
            <div className="search-box">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="חפש מקצוע..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
              />
            </div>

            <form onSubmit={handleAddSubject} className="add-subject-form">
              <input
                type="text"
                placeholder="הכנס שם מקצוע חדש..."
                value={newSubject}
                onChange={(e) => {
                  setNewSubject(e.target.value);
                  setError(null); 
                }}
                className="form-input"
              />
              <button type="submit" className="btn-primary" disabled={!newSubject.trim()}>
                הוסף מקצוע
              </button>
            </form>
          </div>

          <div className="subjects-list">
            {filteredSubjects.length === 0 ? (
              <p className="empty-state">
                {subjects.length === 0 ? "לא נמצאו מקצועות במערכת." : "לא נמצאו מקצועות תואמים לחיפוש."}
              </p>
            ) : (
              filteredSubjects.map((subject) => (
                <div key={subject.id} className="subject-item">
                  
                  {/* אם אנחנו במצב עריכה עבור המקצוע הספציפי הזה */}
                  {editingId === subject.id ? (
                    <div className="edit-mode-container">
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="form-input edit-input"
                        autoFocus
                      />
                      <div className="subject-actions">
                        <button 
                          onClick={() => handleSaveEdit(subject.id)}
                          className="btn-icon-success"
                          title="שמור"
                        >
                          <span className="material-symbols-outlined">check</span>
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="btn-icon-cancel"
                          title="בטל"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* מצב תצוגה רגיל */
                    <>
                      <span className="subject-name">{subject.name}</span>
                      <div className="subject-actions">
                        <button 
                          onClick={() => {
                            setEditingId(subject.id);
                            setEditName(subject.name);
                          }}
                          className="btn-icon-edit"
                          title="ערוך מקצוע"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteSubject(subject.id, subject.name)}
                          className="btn-icon-danger"
                          title="מחק מקצוע"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;