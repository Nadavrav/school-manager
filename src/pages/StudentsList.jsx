import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './StudentsList.css';

const StudentsList = ({ onNavigate }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    class_name: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) console.error('Error fetching students:', error);
    else setStudents(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('students')
      .insert([
        { 
          full_name: formData.full_name, 
          class_name: formData.class_name,
          status: 'active'
        }
      ]);

    if (error) {
      alert('שגיאה בהוספת תלמיד');
    } else {
      setIsModalOpen(false);
      setFormData({ full_name: '', class_name: '' });
      fetchStudents(); // רענון הרשימה מה-DB
    }
  };

  const filteredStudents = students.filter(student => 
    (student.full_name && student.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.class_name && student.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>רשימת תלמידים</h1>
          <p>ניהול ומעקב אחר תלמידי המרכז</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add</span>
          הוספת תלמיד
        </button>
      </header>

      <div className="search-bar">
        <span className="material-symbols-outlined">search</span>
        <input 
          type="text" 
          placeholder="חיפוש לפי שם או כיתה..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">טוען תלמידים...</div>
      ) : (
        <div className="students-grid">
          {filteredStudents.map(student => (
            <div key={student.id} className="student-card">
              <div className="student-avatar">
                {student.full_name ? student.full_name.charAt(0) : '?'}
              </div>
              <div className="student-info">
                <h3>{student.full_name}</h3>
                <p>{student.class_name}</p>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => onNavigate('profile', student.id)}
              >
                צפייה בפרופיל
              </button>
            </div>
          ))}
        </div>
      )}

      {/* מודאל הוספת תלמיד */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>הוספת תלמיד חדש</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם מלא</label>
                <input 
                  type="text" 
                  required 
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>כיתה</label>
                <input 
                  type="text" 
                  required 
                  placeholder="לדוגמה: י' 2"
                  value={formData.class_name}
                  onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary">שמירה</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;