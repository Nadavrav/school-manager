import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './LessonsHistory.css';

const LessonsHistory = ({ onNavigate }) => {
  const [lessons, setLessons] = useState([]);
  const [studentsList, setStudentsList] = useState([]); 
  const [teachersList, setTeachersList] = useState([]); 
  const [subjectsList, setSubjectsList] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    date: '', student: '', teacher: '', subject_name: '', subject_topic: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null); 
  
  const [formData, setFormData] = useState({
    student_id: '', teacher_id: '', subject_id: '', 
    lesson_date: '', start_time: '', end_time: '', subject: '',
    is_irregular: false 
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherList, setShowTeacherList] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState({ title: '', content: '' });

  const handleOpenViewModal = (title, content) => {
    setViewModalData({ title, content });
    setIsViewModalOpen(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        { data: students }, { data: teachers }, { data: subjects }
      ] = await Promise.all([
        supabase.from('students').select('id, full_name').eq('status', 'active'),
        supabase.from('teachers').select('id, full_name').order('full_name'),
        supabase.from('subjects').select('id, name').order('name')
      ]);
      
      if (students) setStudentsList(students);
      if (teachers) setTeachersList(teachers);
      if (subjects) setSubjectsList(subjects);

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('*, students(full_name), teachers(full_name), subjects(name)')
        .order('lesson_date', { ascending: false });

      if (error) throw error;

      if (lessonsData) {
        const formatted = lessonsData.map(l => ({
          id: l.id,
          date: new Date(l.lesson_date).toLocaleDateString('he-IL'),
          time: l.start_time && l.end_time ? `${l.start_time.substring(0, 5)} - ${l.end_time.substring(0, 5)}` : 'לא צוינה שעה',
          student: l.students?.full_name || 'תלמיד נמחק',
          teacher: l.teachers?.full_name || 'ללא מורה',
          subject_name: l.subjects?.name || 'ללא מקצוע',
          subject_topic: l.subject,
          initials: l.students?.full_name?.charAt(0) || '?',
          is_irregular: l.is_irregular,
          is_handled: l.is_handled,
          handling_notes: l.handling_notes,
          raw_student_id: l.student_id,
          raw_teacher_id: l.teacher_id,
          raw_subject_id: l.subject_id,
          raw_date: l.lesson_date,
          raw_start_time: l.start_time,
          raw_end_time: l.end_time,
          raw_subject: l.subject
        }));
        setLessons(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredLessons = lessons.filter(lesson => {
    return (
      (lesson.date.includes(filters.date) || lesson.time.includes(filters.date)) &&
      lesson.student.includes(filters.student) &&
      lesson.teacher.includes(filters.teacher) &&
      (filters.subject_name === '' || lesson.subject_name === filters.subject_name) &&
      lesson.subject_topic.includes(filters.subject_topic)
    );
  });

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const currentLessons = filteredLessons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = (lesson) => {
    setEditingLessonId(lesson.id);
    setFormData({
      student_id: lesson.raw_student_id || '',
      teacher_id: lesson.raw_teacher_id || '',
      subject_id: lesson.raw_subject_id || '',
      lesson_date: lesson.raw_date || '',
      start_time: lesson.raw_start_time || '',
      end_time: lesson.raw_end_time || '',
      subject: lesson.raw_subject || '',
      is_irregular: lesson.is_irregular || false
    });
    
    setStudentSearch(lesson.student === 'תלמיד נמחק' ? '' : lesson.student);
    setTeacherSearch(lesson.teacher === 'ללא מורה' ? '' : lesson.teacher);
    
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.student_id) {
        alert("אנא בחר תלמיד מהרשימה המוצעת");
        return;
    }
    if (teacherSearch && !formData.teacher_id) {
        alert("אנא בחר מורה מהרשימה או השאר את השדה ריק");
        return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
        student_id: formData.student_id,
        teacher_id: formData.teacher_id || null,
        subject_id: formData.subject_id,
        lesson_date: formData.lesson_date,
        start_time: formData.start_time || null, 
        end_time: formData.end_time || null,
        subject: formData.subject,
        is_irregular: formData.is_irregular
      };

      if (editingLessonId) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', editingLessonId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lessons').insert([payload]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      await fetchAllData(); 
      
    } catch (err) {
      alert("שגיאה בשמירה - בדוק את הקונסול לפרטים");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('למחוק שיעור זה?')) {
      try {
        await supabase.from('lessons').delete().eq('id', id);
        await fetchAllData();
      } catch (err) {
        console.error('Error deleting lesson:', err);
        alert('שגיאה במחיקת השיעור');
      }
    }
  };

  const filteredStudentsForSearch = studentsList.filter(s => s.full_name.includes(studentSearch));
  const filteredTeachersForSearch = teachersList.filter(t => t.full_name.includes(teacherSearch));

  return (
    <div className="main-content-wrapper">
      <header className="top-bar">
        <h2>היסטוריית שיעורים</h2>
        <button className="btn-primary" onClick={() => {
          setEditingLessonId(null); 
          setFormData({
            student_id: '', 
            subject_id: subjectsList[0]?.id || '',
            teacher_id: '',
            lesson_date: new Date().toISOString().split('T')[0],
            start_time: '',
            end_time: '',
            subject: '',
            is_irregular: false 
          });
          setStudentSearch('');
          setTeacherSearch('');
          setIsModalOpen(true);
        }}>שיעור חדש</button>
      </header>

      <main className="scroll-content">
        <div className="history-card">
          <table className="custom-table">
            <thead>
              {/* העמודות עודכנו, עמודת הערות הוסרה ו"תוכן השיעור" קיבל 36% מהרוחב */}
              <tr>
                <th style={{ width: '12%' }}>תאריך ושעה</th>
                <th style={{ width: '14%' }}>תלמיד</th>
                <th style={{ width: '14%' }}>מורה</th>
                <th style={{ width: '12%' }}>מקצוע</th>
                <th style={{ width: '36%' }}>תוכן השיעור</th>
                <th style={{ width: '12%', textAlign: 'left' }}>פעולות</th>
              </tr>
              <tr className="filter-row">
                <th><input type="text" placeholder="חיפוש תאריך..." className="col-filter-input" onChange={e => setFilters({...filters, date: e.target.value})} /></th>
                <th><input type="text" placeholder="תלמיד..." className="col-filter-input" onChange={e => setFilters({...filters, student: e.target.value})} /></th>
                <th><input type="text" placeholder="מורה..." className="col-filter-input" onChange={e => setFilters({...filters, teacher: e.target.value})} /></th>
                <th>
                  <select className="col-filter-input" onChange={e => setFilters({...filters, subject_name: e.target.value})}>
                    <option value="">כל המקצועות</option>
                    {subjectsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </th>
                <th><input type="text" placeholder="תוכן..." className="col-filter-input" onChange={e => setFilters({...filters, subject_topic: e.target.value})} /></th>
                {/* הסרנו th ריק אחד שהיה שייך לעמודת ההערות */}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentLessons.map(lesson => (
                <tr key={lesson.id} style={{ backgroundColor: lesson.is_irregular && !lesson.is_handled ? '#fff5f5' : 'transparent' }}>
                  <td>{lesson.date} <br/><small style={{ color: '#64748b' }}>{lesson.time}</small></td>
                  
                  <td 
                    style={{ fontWeight: '600', color: '#137fec', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => onNavigate('profile', lesson.raw_student_id)}
                    title="עבור לפרופיל תלמיד"
                  >
                    {lesson.student}
                  </td>

                  <td 
                    style={{ color: lesson.raw_teacher_id ? '#137fec' : 'inherit', cursor: lesson.raw_teacher_id ? 'pointer' : 'default', textDecoration: lesson.raw_teacher_id ? 'underline' : 'none' }}
                    onClick={() => { if (lesson.raw_teacher_id) onNavigate('teacherProfile', lesson.raw_teacher_id) }}
                    title={lesson.raw_teacher_id ? "עבור לפרופיל מורה" : ""}
                  >
                    {lesson.teacher}
                  </td>

                  <td style={{fontWeight: '700', color: '#137fec'}}>{lesson.subject_name}</td>
                  
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* ה-maxWidth גדל משמעותית כדי לאפשר יותר טקסט לפני החיתוך */}
                      <span style={{ color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '250px' }}>
                        {lesson.subject_topic}
                      </span>
                      {lesson.subject_topic && (
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#137fec', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleOpenViewModal('תוכן השיעור', lesson.subject_topic)} title="קרא בהרחבה">open_in_new</span>
                      )}
                    </div>
                  </td>

                  <td style={{textAlign: 'left'}}>
                    <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center'}}>
                      
                      {/* שילוב האייקונים של דיווח חריג (אזהרה/הערות) בתוך עמודת פעולות */}
                      {lesson.is_irregular && (
                        lesson.is_handled ? (
                          <span 
                            className="material-symbols-outlined" 
                            style={{color: '#22c55e', cursor: 'pointer', fontSize: '18px'}} 
                            onClick={() => handleOpenViewModal('הערות הנהלה', lesson.handling_notes || 'טופל ללא הערות נוספות.')} 
                            title="צפה בהערות הנהלה"
                          >
                            speaker_notes
                          </span>
                        ) : (
                          <span 
                            className="material-symbols-outlined" 
                            style={{color: '#ef4444', cursor: 'help', fontSize: '18px'}} 
                            title="שיעור חריג - ממתין לטיפול הנהלה"
                          >
                            warning
                          </span>
                        )
                      )}

                      <span className="material-symbols-outlined" style={{color: '#137fec', cursor: 'pointer', fontSize: '18px'}} onClick={() => handleEditClick(lesson)} title="ערוך שיעור">edit</span>
                      <span className="material-symbols-outlined" style={{color: '#ef4444', cursor: 'pointer', fontSize: '18px'}} onClick={() => handleDelete(lesson.id)} title="מחק שיעור">delete</span>
                    </div>
                  </td>
                </tr>
              ))}
              {currentLessons.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    לא נמצאו שיעורים התואמים לחיפוש.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredLessons.length > 0 && (
            <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div className="pagination-info" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                עמוד {currentPage} מתוך {totalPages}
              </div>
              <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages || totalPages === 0 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {isViewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#0f172a' }}>
               <span className="material-symbols-outlined" style={{ color: '#137fec' }}>description</span>
               <h3 style={{ margin: 0 }}>{viewModalData.title}</h3>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '300px', overflowY: 'auto', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap' }}>
               {viewModalData.content || "אין תוכן להצגה."}
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsViewModalOpen(false)} style={{ width: 'auto', padding: '8px 24px' }}>סגור</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingLessonId ? 'עריכת שיעור' : 'הוספת שיעור חדש'}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff5f5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <input 
                  type="checkbox" 
                  id="irregularCheck"
                  checked={formData.is_irregular}
                  onChange={e => setFormData({...formData, is_irregular: e.target.checked})}
                  style={{ margin: 0, cursor: 'pointer' }}
                />
                <label htmlFor="irregularCheck" style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                  סמן כחריג
                </label>
              </div>
            </div>

            <form onSubmit={handleSave}>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                
                <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
                  <label>תלמיד</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="חפש תלמיד..."
                    value={studentSearch}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      setShowStudentList(true);
                      if (formData.student_id) setFormData({...formData, student_id: ''}); 
                    }}
                    onFocus={() => setShowStudentList(true)}
                    onBlur={() => setTimeout(() => setShowStudentList(false), 200)} 
                    required
                  />
                  {showStudentList && filteredStudentsForSearch.length > 0 && (
                    <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 50, maxHeight: '150px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: '4px 0 0 0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                      {filteredStudentsForSearch.map(s => (
                        <li key={s.id} 
                            style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}
                            onMouseDown={() => { 
                              setStudentSearch(s.full_name);
                              setFormData({...formData, student_id: s.id});
                              setShowStudentList(false);
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {s.full_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
                  <label>מורה (אופציונלי)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="חפש מורה..."
                    value={teacherSearch}
                    onChange={e => {
                      setTeacherSearch(e.target.value);
                      setShowTeacherList(true);
                      if (formData.teacher_id) setFormData({...formData, teacher_id: ''});
                    }}
                    onFocus={() => setShowTeacherList(true)}
                    onBlur={() => setTimeout(() => setShowTeacherList(false), 200)}
                  />
                  {showTeacherList && filteredTeachersForSearch.length > 0 && (
                    <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 50, maxHeight: '150px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: '4px 0 0 0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                      {filteredTeachersForSearch.map(t => (
                        <li key={t.id} 
                            style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}
                            onMouseDown={() => {
                              setTeacherSearch(t.full_name);
                              setFormData({...formData, teacher_id: t.id});
                              setShowTeacherList(false);
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {t.full_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>מקצוע</label>
                  <select className="form-input" value={formData.subject_id} onChange={e => setFormData({...formData, subject_id: e.target.value})} required>
                    <option value="" disabled>בחר מקצוע</option>
                    {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>תאריך</label>
                  <input type="date" className="form-input" value={formData.lesson_date} onChange={e => setFormData({...formData, lesson_date: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>שעת התחלה</label>
                  <input type="time" className="form-input" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>שעת סיום</label>
                  <input type="time" className="form-input" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>תוכן השיעור</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})} 
                  required 
                  placeholder="הקלד כאן את תוכן השיעור או תיאור מפורט..."
                  style={{ resize: 'vertical', fontFamily: 'inherit', width: '100%' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }} disabled={isSubmitting}>{editingLessonId ? 'עדכן שיעור' : 'שמור'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonsHistory;