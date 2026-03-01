import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './StudentProfile.css'; 

const TeacherProfile = ({ teacherId, onNavigate }) => {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [myStudents, setMyStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // States לעריכת פרטי מורה
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherFormData, setTeacherFormData] = useState({
    full_name: '',
    role: ''
  });

  // States למודאל הצגת "שיעור אחרון"
  const [isLastLessonModalOpen, setIsLastLessonModalOpen] = useState(false);
  const [selectedLastLesson, setSelectedLastLesson] = useState(null);

  // --- States חדשים לסינון ופגינציה של טבלת התלמידים ---
  const [studentFilters, setStudentFilters] = useState({ name: '', className: '' });
  const [currentStudentPage, setCurrentStudentPage] = useState(1);
  const studentsPerPage = 5;

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    fetchTeacherData();
  }, [teacherId]);

  // איפוס עמוד הפגינציה ל-1 כאשר מבצעים סינון
  useEffect(() => {
    setCurrentStudentPage(1);
  }, [studentFilters]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // 1. שליפת פרטי המורה
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (teacherError) throw teacherError;
      setTeacherInfo(teacherData);

      // 2. שליפת כל התלמידים שמשויכים למורה הזה
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, class_name, status')
        .eq('main_teacher_id', teacherId)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // 3. שליפת השיעורים של התלמידים כדי למצוא את "השיעור האחרון" של כל אחד
      if (studentsData && studentsData.length > 0) {
        const studentIds = studentsData.map(s => s.id);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, student_id, lesson_date, start_time, end_time, subject, status, subjects(name)')
          .in('student_id', studentIds)
          .order('lesson_date', { ascending: false });
        
        if (lessonsError) throw lessonsError;

        // חיבור הנתונים - מציאת השיעור האחרון לכל תלמיד
        const formattedStudents = studentsData.map(student => {
          const studentLessons = lessonsData ? lessonsData.filter(l => l.student_id === student.id) : [];
          const lastLesson = studentLessons.length > 0 ? studentLessons[0] : null;
          
          return {
            ...student,
            lastLesson: lastLesson ? {
              date: new Date(lastLesson.lesson_date).toLocaleDateString('he-IL'),
              time: lastLesson.start_time && lastLesson.end_time ? `${lastLesson.start_time.substring(0, 5)} - ${lastLesson.end_time.substring(0, 5)}` : 'לא צוינה שעה',
              subject_name: lastLesson.subjects?.name || 'ללא מקצוע',
              topic: lastLesson.subject,
              status: lastLesson.status
            } : null
          };
        });

        setMyStudents(formattedStudents);
      } else {
        setMyStudents([]);
      }

    } catch (error) {
      console.error('שגיאה בשליפת נתוני מורה:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setTeacherFormData({
      full_name: teacherInfo.full_name,
      role: teacherInfo.role || 'מורה'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          full_name: teacherFormData.full_name,
          role: teacherFormData.role
        })
        .eq('id', teacherId);

      if (error) throw error;
      setIsEditModalOpen(false);
      fetchTeacherData();
    } catch (error) {
      alert('שגיאה בשמירת פרטי המורה');
      console.error(error);
    }
  };

  const handleDeleteTeacher = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מורה זה מהמערכת? פעולה זו אינה ניתנת לביטול.')) {
      try {
        const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
        if (error) throw error;
        onNavigate('teachers'); 
      } catch (error) {
        alert('שגיאה במחיקת המורה. ייתכן שיש לו שיעורים משויכים שמונעים את המחיקה.');
        console.error(error);
      }
    }
  };

  const handleRemoveStudentFromTeacher = async (studentId, studentName) => {
    if (window.confirm(`האם אתה בטוח שברצונך להסיר את ${studentName} מרשימת התלמידים של ${teacherInfo?.full_name}?`)) {
      try {
        const { error } = await supabase
          .from('students')
          .update({ main_teacher_id: null }) 
          .eq('id', studentId);

        if (error) throw error;
        fetchTeacherData(); 
      } catch (error) {
        alert('שגיאה בהסרת התלמיד');
        console.error(error);
      }
    }
  };

  const openLastLessonModal = (lesson) => {
    setSelectedLastLesson(lesson);
    setIsLastLessonModalOpen(true);
  };

  // --- לוגיקת סינון ופגינציה של התלמידים ---
  const filteredStudents = myStudents.filter(student => {
    const studentNameMatch = student.full_name.includes(studentFilters.name);
    const classNameMatch = (student.class_name || '').includes(studentFilters.className);
    return studentNameMatch && classNameMatch;
  });

  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudentsList = filteredStudents.slice((currentStudentPage - 1) * studentsPerPage, currentStudentPage * studentsPerPage);


  if (loading) return <div className="loading-state">טוען נתוני מורה...</div>;

  return (
    <div className="student-profile-wrapper">
      
      <header className="profile-header-section" style={{ marginBottom: '24px' }}>
        <div className="profile-card" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="profile-avatar-large" style={{ width: '48px', height: '48px', fontSize: '1.2rem', margin: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              {teacherInfo?.full_name?.charAt(0)}
            </div>
            
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{teacherInfo?.full_name}</h2>
            
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
              {teacherInfo?.role || 'מורה'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span>
              אחראי על {myStudents.length} תלמידים
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-secondary" style={{ width: 'auto', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }} onClick={handleOpenEditModal}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> 
              ערוך מורה
            </button>
            <button className="btn-secondary" style={{ width: 'auto', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fff5f5', fontSize: '0.9rem' }} onClick={handleDeleteTeacher}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> 
              מחק
            </button>
          </div>

        </div>
      </header>

      <div className="section-container">
        {/* שינוי שם הכותרת בהתאם לבקשה */}
        <h3 className="section-title">
          <span className="material-symbols-outlined" style={{ marginLeft: '8px', verticalAlign: 'bottom' }}>school</span>
          תלמידים קבועים של המורה
        </h3>
        
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
          <table className="profile-table" style={{ tableLayout: 'fixed', width: '100%', wordWrap: 'break-word' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>שם התלמיד</th>
                <th style={{ width: '20%' }}>כיתה</th>
                <th style={{ width: '30%' }}>שיעור אחרון</th>
                <th style={{ width: '20%', textAlign: 'left' }}>פעולות</th>
              </tr>
              {/* --- הוספת שורת סינון לתלמידים --- */}
              <tr className="filter-row">
                <th>
                  <input 
                    type="text" 
                    placeholder="חיפוש שם..." 
                    className="col-filter-input" 
                    value={studentFilters.name}
                    onChange={e => setStudentFilters({...studentFilters, name: e.target.value})} 
                  />
                </th>
                <th>
                  <input 
                    type="text" 
                    placeholder="חיפוש כיתה..." 
                    className="col-filter-input" 
                    value={studentFilters.className}
                    onChange={e => setStudentFilters({...studentFilters, className: e.target.value})} 
                  />
                </th>
                <th></th> 
                <th></th> 
              </tr>
            </thead>
            <tbody>
              {currentStudentsList.length > 0 ? (
                currentStudentsList.map(student => (
                  <tr key={student.id}>
                    <td 
                      style={{ fontWeight: '700', color: '#1e293b' }}
                    >
                      {student.full_name}
                    </td>
                    <td>{student.class_name}</td>
                    
                    <td>
                      {student.lastLesson ? (
                        <span 
                          style={{ color: '#137fec', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => openLastLessonModal(student.lastLesson)}
                          title="צפה בפרטי השיעור"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event_note</span>
                          {student.lastLesson.date}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>אין שיעורים</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                        <span 
                          className="material-symbols-outlined" 
                          style={{ color: '#137fec', cursor: 'pointer', fontSize: '22px' }} 
                          onClick={() => onNavigate('profile', student.id)}
                          title="מעבר לפרופיל תלמיד"
                        >
                          account_circle
                        </span>
                        <span 
                          className="material-symbols-outlined" 
                          style={{ color: '#ef4444', cursor: 'pointer', fontSize: '22px' }} 
                          onClick={() => handleRemoveStudentFromTeacher(student.id, student.full_name)}
                          title="הסר מרשימת התלמידים של מורה זה"
                        >
                          person_remove
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    לא נמצאו תלמידים התואמים לחיפוש.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* --- הוספת מנגנון הפגינציה --- */}
          {filteredStudents.length > 0 && (
            <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div className="pagination-info" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                עמוד {currentStudentPage} מתוך {totalStudentPages}
              </div>
              <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentStudentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentStudentPage === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentStudentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentStudentPage === 1 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentStudentPage(prev => Math.min(prev + 1, totalStudentPages))}
                  disabled={currentStudentPage === totalStudentPages || totalStudentPages === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentStudentPage === totalStudentPages || totalStudentPages === 0 ? 'not-allowed' : 'pointer', opacity: currentStudentPage === totalStudentPages || totalStudentPages === 0 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* מודאל פרטי שיעור אחרון */}
      {isLastLessonModalOpen && selectedLastLesson && (
        <div className="modal-overlay" onClick={() => setIsLastLessonModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
               <span className="material-symbols-outlined" style={{ color: '#137fec' }}>info</span>
               <h3 style={{ margin: 0 }}>פרטי שיעור אחרון</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>תאריך:</span>
                <span style={{ color: '#1e293b' }}>{selectedLastLesson.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>שעות:</span>
                <span style={{ color: '#1e293b' }}>{selectedLastLesson.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>מקצוע:</span>
                <span style={{ color: '#137fec', fontWeight: '700' }}>{selectedLastLesson.subject_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', color: '#64748b' }}>סטטוס ביצוע:</span>
                <span style={{ color: selectedLastLesson.status === 'בוצע' ? '#22c55e' : '#ef4444', fontWeight: '600' }}>{selectedLastLesson.status}</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>תוכן השיעור:</span>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'pre-wrap' }}>
                  {selectedLastLesson.topic || 'לא הוזן תוכן.'}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsLastLessonModalOpen(false)} style={{ width: 'auto', padding: '8px 24px' }}>סגור</button>
            </div>
          </div>
        </div>
      )}

      {/* מודאל עריכת פרטי מורה */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '20px' }}>עריכת פרטי מורה</h3>
            <form onSubmit={handleSaveTeacher}>
              <div className="form-group">
                <label>שם מלא</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={teacherFormData.full_name} 
                  onChange={e => setTeacherFormData({...teacherFormData, full_name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>תפקיד</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={teacherFormData.role} 
                  onChange={e => setTeacherFormData({...teacherFormData, role: e.target.value})} 
                  placeholder="לדוגמה: מורה לאנגלית, רכז שכבה..."
                  required
                />
              </div>
              
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsEditModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }}>שמור שינויים</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherProfile;