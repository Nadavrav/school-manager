import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './StudentsList.css'; 

const TeachersList = ({ onNavigate }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // שורת חיפוש כללית
  const [searchTerm, setSearchTerm] = useState('');
  
  // פגינציה - 15 פריטים לעמוד (3 שורות של 5)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // ניהול טופס הוספת מורה חדש
  const [formData, setFormData] = useState({
    full_name: '',
    role: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  // איפוס עמוד כשמחפשים משהו חדש
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // שליפת המורים וגם ספירה של התלמידים שכל מורה אחראי עליהם
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .order('full_name', { ascending: true });

      if (teachersError) throw teachersError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('main_teacher_id');
        
      if (studentsError) throw studentsError;

      // ספירת התלמידים לכל מורה
      const teachersWithCount = teachersData.map(teacher => {
        const studentCount = studentsData.filter(s => s.main_teacher_id === teacher.id).length;
        return { ...teacher, studentCount };
      });

      setTeachers(teachersWithCount || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('teachers')
        .insert([
          { 
            full_name: formData.full_name, 
            role: formData.role 
          }
        ]);

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ full_name: '', role: '' });
      fetchTeachers(); 
    } catch (error) {
      alert('שגיאה בהוספת מורה');
    }
  };

  // סינון מורים לפי חיפוש (שם או תפקיד/מקצוע)
  const filteredTeachers = teachers.filter(teacher => 
    (teacher.full_name && teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (teacher.role && teacher.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // חישובי פגינציה
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const currentTeachers = filteredTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>צוות ההוראה</h1>
          <p>ניהול מורים והגדרת תחומי אחריות במרכז</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined">person_add</span>
          הוספת מורה
        </button>
      </header>

      {/* שורת חיפוש כללית */}
      <div style={{ margin: '0 40px 24px 40px', position: 'relative' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
        <input 
          type="text" 
          placeholder="חיפוש חופשי לפי שם או מקצוע..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
        />
      </div>

      {loading ? (
        <div className="loading">טוען צוות...</div>
      ) : (
        <div style={{ margin: '0 40px', display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
          
          {/* גריד כרטיסיות מורים קומפקטי - 5 בשורה */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {currentTeachers.length > 0 ? (
              currentTeachers.map(teacher => (
                <div 
                  key={teacher.id} 
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    padding: '16px', 
                    border: '1px solid #e2e8f0', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    position: 'relative'
                  }}
                >
                  {/* אווטאר קומפקטי בצבע כהה-מורה */}
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>
                    {teacher.full_name ? teacher.full_name.charAt(0) : '?'}
                  </div>
                  
                  {/* פרטים */}
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a' }}>{teacher.full_name}</h3>
                  <p style={{ margin: '0 0 12px 0', color: '#64748b', fontWeight: '500', fontSize: '0.9rem' }}>{teacher.role || 'מורה'}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.8rem', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '8px', marginBottom: '16px', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                    {teacher.studentCount} תלמידים
                  </div>

                  {/* כפתור מעבר */}
                  <button 
                    className="btn-secondary"
                    style={{ width: '100%', padding: '8px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}
                    onClick={() => onNavigate('teacherProfile', teacher.id)}
                  >
                    לפרופיל
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                  </button>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#64748b', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>group_off</span>
                <p style={{ fontSize: '1.1rem' }}>לא נמצאו מורים התואמים לחיפוש.</p>
              </div>
            )}
          </div>

          {/* פגינציה */}
          {filteredTeachers.length > 0 && (
            <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div className="pagination-info" style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                עמוד {currentPage} מתוך {totalPages}
              </div>
              <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, transition: 'all 0.2s' }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '8px', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages || totalPages === 0 ? 0.4 : 1, transition: 'all 0.2s' }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* מודאל הוספת מורה חדש */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
               <span className="material-symbols-outlined" style={{ color: '#137fec', fontSize: '28px' }}>person_add</span>
               <h3 style={{ margin: 0 }}>הוספת מורה חדש</h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>שם מלא</label>
                <input 
                  type="text" 
                  className="form-input"
                  required 
                  autoFocus
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>מקצועות לימוד</label>
                <input 
                  type="text" 
                  className="form-input"
                  required 
                  placeholder="לדוגמה: מתמטיקה, אנגלית"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }}>שמור מורה</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersList;