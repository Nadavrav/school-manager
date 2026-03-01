import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './StudentProfile.css';

const StudentProfile = ({ studentId, onNavigate }) => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('הכל');
  
  const [isGradesListModalOpen, setIsGradesListModalOpen] = useState(false);
  const [gradesModalView, setGradesModalView] = useState('list'); 
  const [currentGradePage, setCurrentGradePage] = useState(1);
  const gradesPerPage = 10;
  
  const [modalMode, setModalMode] = useState('add');
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({
    subject_id: '',
    exam_name: '',
    score: '',
    exam_date: new Date().toISOString().split('T')[0]
  });

  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    full_name: '',
    class_name: '',
    status: 'active'
  });

  const [lessonFilters, setLessonFilters] = useState({ date: '', teacher: '', subject: '', topic: '' });
  const [currentLessonPage, setCurrentLessonPage] = useState(1);
  const lessonsPerPage = 5;
  
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonFormData, setLessonFormData] = useState({
    subject_id: '', teacher_id: '', lesson_date: '', start_time: '', end_time: '', subject: '', is_irregular: false
  });
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    fetchStudentData();
  }, [studentId]);

  useEffect(() => { setCurrentGradePage(1); }, [selectedSubjectFilter, isGradesListModalOpen]);
  useEffect(() => { setCurrentLessonPage(1); }, [lessonFilters]);

  const handleOpenViewModal = (title, content) => {
    setViewModalData({ title, content });
    setIsViewModalOpen(true);
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');
      const { data: teachersData } = await supabase.from('teachers').select('id, full_name').order('full_name');
      
      if (subjectsData) setSubjectsList(subjectsData);
      if (teachersData) setTeachersList(teachersData);

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`*, teachers:main_teacher_id (id, full_name)`)
        .eq('id', studentId)
        .single();
      
      if (studentError) throw studentError;

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*, subjects(name), teachers(full_name)')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false });

      const { data: gradesData } = await supabase
        .from('grades').select('*, subjects(name)')
        .eq('student_id', studentId).order('exam_date', { ascending: false });

      setStudentInfo(studentData);
      
      if (lessonsData) {
        setLessons(lessonsData.map(l => ({
          id: l.id,
          date: new Date(l.lesson_date).toLocaleDateString('he-IL'),
          time: l.start_time && l.end_time ? `${l.start_time.substring(0, 5)} - ${l.end_time.substring(0, 5)}` : 'לא צוינה שעה',
          teacher_name: l.teachers?.full_name || 'ללא מורה',
          subject_name: l.subjects?.name || 'ללא מקצוע',
          topic: l.subject,
          is_irregular: l.is_irregular,
          is_handled: l.is_handled,
          handling_notes: l.handling_notes,
          raw_date: l.lesson_date,
          raw_start_time: l.start_time,
          raw_end_time: l.end_time,
          raw_subject_id: l.subject_id,
          raw_subject: l.subject,
          raw_teacher_id: l.teacher_id
        })));
      }

      if (gradesData) {
        setGrades(gradesData.map(g => ({
          id: g.id,
          subject_id: g.subject_id,
          subject_name: g.subjects?.name || 'ללא מקצוע',
          exam_name: g.exam_name,
          date: g.exam_date,
          displayDate: new Date(g.exam_date).toLocaleDateString('he-IL'),
          score: g.score
        })));
      }
    } catch (error) {
      console.error('שגיאה בשליפת נתונים:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeacher = async (teacherId) => {
    const valueToUpdate = teacherId === "" ? null : teacherId;
    try {
      const { error } = await supabase.from('students').update({ main_teacher_id: valueToUpdate }).eq('id', studentId);
      if (error) throw error;
      setIsEditingTeacher(false);
      fetchStudentData(); 
    } catch (error) { alert('שגיאה בעדכון המורה'); }
  };

  const handleOpenEditStudentModal = () => {
    setStudentFormData({
      full_name: studentInfo.full_name, class_name: studentInfo.class_name, status: studentInfo.status
    });
    setIsEditStudentModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').update({
        full_name: studentFormData.full_name, class_name: studentFormData.class_name, status: studentFormData.status
      }).eq('id', studentId);

      if (error) throw error;
      setIsEditStudentModalOpen(false);
      fetchStudentData();
    } catch (error) { alert('שגיאה בשמירת פרטי התלמיד'); }
  };

  const handleDeleteStudent = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תלמיד זה לחלוטין מהמערכת? פעולה זו תמחק גם את כל היסטוריית השיעורים והציונים שלו.')) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) throw error;
        onNavigate('students'); 
      } catch (error) { alert('שגיאה במחיקת התלמיד'); }
    }
  };

  const filteredGrades = grades.filter(g => selectedSubjectFilter === 'הכל' || g.subject_name === selectedSubjectFilter);
  const totalGradePages = Math.ceil(filteredGrades.length / gradesPerPage);
  const currentGrades = filteredGrades.slice((currentGradePage - 1) * gradesPerPage, currentGradePage * gradesPerPage);

  const handleOpenAddGradeView = () => {
    setModalMode('add');
    setEditingGradeId(null);
    setGradeFormData({ subject_id: subjectsList.length > 0 ? subjectsList[0].id : '', exam_name: '', score: '', exam_date: new Date().toISOString().split('T')[0] });
    setGradesModalView('form'); 
  };

  const handleOpenEditGradeView = (grade) => {
    setModalMode('edit');
    setEditingGradeId(grade.id);
    setGradeFormData({ subject_id: grade.subject_id, exam_name: grade.exam_name, score: grade.score, exam_date: grade.date });
    setGradesModalView('form'); 
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      const payload = { student_id: studentId, subject_id: gradeFormData.subject_id, exam_name: gradeFormData.exam_name, score: parseInt(gradeFormData.score), exam_date: gradeFormData.exam_date };
      if (modalMode === 'add') await supabase.from('grades').insert([payload]);
      else await supabase.from('grades').update(payload).eq('id', editingGradeId);
      
      setGradesModalView('list'); 
      fetchStudentData();
    } catch (error) { alert('שגיאה בשמירה'); }
  };

  const handleDeleteGrade = async (id) => {
    if (window.confirm('למחוק ציון זה?')) {
      await supabase.from('grades').delete().eq('id', id);
      fetchStudentData();
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    return (
      (lesson.date.includes(lessonFilters.date) || lesson.time.includes(lessonFilters.date)) &&
      lesson.teacher_name.includes(lessonFilters.teacher) &&
      (lessonFilters.subject === '' || lesson.subject_name === lessonFilters.subject) &&
      lesson.topic.includes(lessonFilters.topic)
    );
  });
  const totalLessonPages = Math.ceil(filteredLessons.length / lessonsPerPage);
  const currentLessons = filteredLessons.slice((currentLessonPage - 1) * lessonsPerPage, currentLessonPage * lessonsPerPage);

  const handleEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonFormData({
      subject_id: lesson.raw_subject_id || '',
      teacher_id: lesson.raw_teacher_id || '',
      lesson_date: lesson.raw_date || '',
      start_time: lesson.raw_start_time || '',
      end_time: lesson.raw_end_time || '',
      subject: lesson.raw_subject || '',
      is_irregular: lesson.is_irregular || false
    });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        student_id: studentId,
        teacher_id: lessonFormData.teacher_id || null,
        subject_id: lessonFormData.subject_id,
        lesson_date: lessonFormData.lesson_date,
        start_time: lessonFormData.start_time || null, 
        end_time: lessonFormData.end_time || null,
        subject: lessonFormData.subject,
        is_irregular: lessonFormData.is_irregular
      };
      const { error } = await supabase.from('lessons').update(payload).eq('id', editingLessonId);
      if (error) throw error;
      
      setIsLessonModalOpen(false);
      fetchStudentData(); 
    } catch (err) { alert("שגיאה בעדכון השיעור"); }
  };

  const handleDeleteLesson = async (id) => {
    if(window.confirm('למחוק שיעור זה מהיסטוריית התלמיד?')) {
      await supabase.from('lessons').delete().eq('id', id);
      fetchStudentData();
    }
  };

  if (loading) return <div className="loading-state">טוען נתונים...</div>;

  return (
    <div className="student-profile-wrapper">
      
      <header className="profile-header-section" style={{ marginBottom: '16px' }}>
        <div className="profile-card" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="profile-avatar-large" style={{ width: '48px', height: '48px', fontSize: '1.2rem', margin: 0 }}>
              {studentInfo?.full_name?.charAt(0)}
            </div>
            
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{studentInfo?.full_name}</h2>
            
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
              {studentInfo?.class_name}
            </span>
            
            <div className="teacher-selector-area" style={{ margin: 0 }}>
              {isEditingTeacher ? (
                <select 
                  className="form-input-sm"
                  value={studentInfo?.main_teacher_id || ''}
                  onChange={(e) => handleUpdateTeacher(e.target.value)}
                  onBlur={() => setIsEditingTeacher(false)}
                  autoFocus
                  style={{ margin: 0, padding: '6px 12px' }}
                >
                  <option value="">ללא מורה ראשי</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              ) : (
                <span 
                  style={{ color: '#137fec', cursor: 'pointer', backgroundColor: 'rgba(19, 127, 236, 0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={() => setIsEditingTeacher(true)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                  מורה ראשי: {studentInfo?.teachers?.full_name || 'לא הוגדר'}
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-secondary" style={{ width: 'auto', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }} onClick={() => { setGradesModalView('list'); setIsGradesListModalOpen(true); }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grading</span> 
              ציונים ({grades.length})
            </button>
            <button className="btn-secondary" style={{ width: 'auto', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }} onClick={handleOpenEditStudentModal}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> 
              ערוך תלמיד
            </button>
            <button className="btn-secondary" style={{ width: 'auto', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fff5f5', fontSize: '0.9rem' }} onClick={handleDeleteStudent}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> 
              מחק
            </button>
          </div>

        </div>
      </header>

      <div className="section-container">
        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
          <table className="profile-table" style={{ tableLayout: 'fixed', width: '100%', wordWrap: 'break-word' }}>
            <thead>
              {/* הוספת עמודת מורה לטבלה וחלוקה מחדש של האחוזים */}
              <tr>
                <th style={{ width: '15%' }}>תאריך ושעה</th>
                <th style={{ width: '15%' }}>מורה</th>
                <th style={{ width: '15%' }}>מקצוע</th>
                <th style={{ width: '40%' }}>תוכן השיעור</th>
                <th style={{ width: '15%', textAlign: 'left' }}>פעולות</th>
              </tr>
              <tr className="filter-row">
                <th><input type="text" placeholder="תאריך/שעה..." className="col-filter-input" onChange={e => setLessonFilters({...lessonFilters, date: e.target.value})} /></th>
                <th><input type="text" placeholder="מורה..." className="col-filter-input" onChange={e => setLessonFilters({...lessonFilters, teacher: e.target.value})} /></th>
                <th>
                  <select className="col-filter-input" onChange={e => setLessonFilters({...lessonFilters, subject: e.target.value})}>
                    <option value="">כל המקצועות</option>
                    {subjectsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </th>
                <th><input type="text" placeholder="תוכן..." className="col-filter-input" onChange={e => setLessonFilters({...lessonFilters, topic: e.target.value})} /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentLessons.length > 0 ? (
                currentLessons.map(l => (
                  <tr key={l.id} style={{ backgroundColor: l.is_irregular && !l.is_handled ? '#fff5f5' : 'transparent' }}>
                    <td>{l.date} <br/><small style={{ color: '#64748b' }}>{l.time}</small></td>
                    
                    {/* הוספת לחיצה למעבר לפרופיל מורה */}
                    <td 
                      style={{ color: l.raw_teacher_id ? '#137fec' : 'inherit', cursor: l.raw_teacher_id ? 'pointer' : 'default', textDecoration: l.raw_teacher_id ? 'underline' : 'none' }}
                      onClick={() => { if (l.raw_teacher_id) onNavigate('teacherProfile', l.raw_teacher_id) }}
                      title={l.raw_teacher_id ? "עבור לפרופיל מורה" : ""}
                    >
                      {l.teacher_name}
                    </td>

                    <td style={{fontWeight: '700', color: '#137fec'}}>{l.subject_name}</td>
                    
                    <td style={{ maxWidth: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '140px' }}>
                          {l.topic}
                        </span>
                        {l.topic && (
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#137fec', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleOpenViewModal('תוכן השיעור', l.topic)} title="קרא בהרחבה">open_in_new</span>
                        )}
                      </div>
                    </td>

                    <td style={{textAlign: 'left'}}>
                      <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center'}}>
                        
                        {l.is_irregular && (
                          l.is_handled ? (
                            <span 
                              className="material-symbols-outlined" 
                              style={{color: '#22c55e', cursor: 'pointer', fontSize: '18px'}} 
                              onClick={() => handleOpenViewModal('הערות הנהלה', l.handling_notes || 'טופל ללא הערות נוספות.')} 
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
                        
                        <span className="material-symbols-outlined" style={{color: '#137fec', cursor: 'pointer', fontSize: '18px'}} onClick={() => handleEditLesson(l)} title="ערוך שיעור">edit</span>
                        <span className="material-symbols-outlined" style={{color: '#ef4444', cursor: 'pointer', fontSize: '18px'}} onClick={() => handleDeleteLesson(l.id)} title="מחק שיעור">delete</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    לא נמצאו שיעורים התואמים לחיפוש.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredLessons.length > 0 && (
            <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
              <div className="pagination-info" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                עמוד {currentLessonPage} מתוך {totalLessonPages}
              </div>
              <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentLessonPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentLessonPage === 1}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentLessonPage === 1 ? 'not-allowed' : 'pointer', opacity: currentLessonPage === 1 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={() => setCurrentLessonPage(prev => Math.min(prev + 1, totalLessonPages))}
                  disabled={currentLessonPage === totalLessonPages || totalLessonPages === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentLessonPage === totalLessonPages || totalLessonPages === 0 ? 'not-allowed' : 'pointer', opacity: currentLessonPage === totalLessonPages || totalLessonPages === 0 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isGradesListModalOpen && (
        <div className="modal-overlay" onClick={() => { if (gradesModalView === 'list') setIsGradesListModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: gradesModalView === 'list' ? '800px' : '500px', maxHeight: '90vh', transition: 'max-width 0.3s', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            {gradesModalView === 'list' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>גיליון ציונים - {studentInfo?.full_name}</h3>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select 
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer', backgroundColor: '#f8fafc', fontFamily: 'inherit', fontWeight: '500', color: '#1e293b' }}
                      value={selectedSubjectFilter} 
                      onChange={e => setSelectedSubjectFilter(e.target.value)}
                    >
                      <option value="הכל">כל המקצועות</option>
                      {subjectsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px' }} onClick={handleOpenAddGradeView}>הוספת ציון חדש</button>
                  </div>
                </div>

                <div className="section-card" style={{ padding: 0, boxShadow: 'none', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
                  <div style={{ overflowY: 'auto' }}>
                    <table className="profile-table">
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                        <tr>
                          <th>מקצוע</th>
                          <th>מבחן</th>
                          <th>ציון</th>
                          <th style={{textAlign: 'left'}}>פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentGrades.length > 0 ? (
                          currentGrades.map(g => (
                            <tr key={g.id}>
                              <td style={{fontWeight: '700', color: '#137fec'}}>{g.subject_name}</td>
                              <td>{g.exam_name}</td>
                              <td style={{fontWeight: '800'}}>{g.score}</td>
                              <td style={{textAlign: 'left'}}>
                                <div className="action-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                  <span className="material-symbols-outlined" style={{ cursor: 'pointer', color: '#137fec', fontSize: '18px' }} onClick={() => handleOpenEditGradeView(g)}>edit</span>
                                  <span className="material-symbols-outlined delete" style={{ cursor: 'pointer', color: '#ef4444', fontSize: '18px' }} onClick={() => handleDeleteGrade(g.id)}>delete</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                              אין ציונים להצגה.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {filteredGrades.length > 0 && (
                    <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
                      <div className="pagination-info" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                        עמוד {currentGradePage} מתוך {totalGradePages}
                      </div>
                      <div className="pagination-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="pagination-btn" 
                          onClick={() => setCurrentGradePage(prev => Math.max(prev - 1, 1))}
                          disabled={currentGradePage === 1}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentGradePage === 1 ? 'not-allowed' : 'pointer', opacity: currentGradePage === 1 ? 0.4 : 1 }}
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                        <button 
                          className="pagination-btn" 
                          onClick={() => setCurrentGradePage(prev => Math.min(prev + 1, totalGradePages))}
                          disabled={currentGradePage === totalGradePages || totalGradePages === 0}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: currentGradePage === totalGradePages || totalGradePages === 0 ? 'not-allowed' : 'pointer', opacity: currentGradePage === totalGradePages || totalGradePages === 0 ? 0.4 : 1 }}
                        >
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsGradesListModalOpen(false)}>סגור</button>
                </div>
              </>
            )}

            {gradesModalView === 'form' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <span className="material-symbols-outlined" style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setGradesModalView('list')} title="חזור לרשימת הציונים">arrow_forward</span>
                  <h3 style={{ margin: 0 }}>{modalMode === 'add' ? 'הוספת ציון חדש' : 'עריכת ציון'}</h3>
                </div>
                
                <form onSubmit={handleSaveGrade}>
                  <div className="form-group">
                    <label>מקצוע</label>
                    <select 
                      className="form-input" 
                      value={gradeFormData.subject_id} 
                      onChange={e => setGradeFormData({...gradeFormData, subject_id: e.target.value})}
                      required
                    >
                      <option value="" disabled>בחר מקצוע</option>
                      {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>שם המבחן</label>
                    <input type="text" className="form-input" value={gradeFormData.exam_name} onChange={e => setGradeFormData({...gradeFormData, exam_name: e.target.value})} required />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>תאריך המבחן</label>
                      <input type="date" className="form-input" value={gradeFormData.exam_date} onChange={e => setGradeFormData({...gradeFormData, exam_date: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>ציון</label>
                      <input type="number" className="form-input" value={gradeFormData.score} onChange={e => setGradeFormData({...gradeFormData, score: e.target.value})} required min="0" max="100" />
                    </div>
                  </div>
                  <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                    <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setGradesModalView('list')}>ביטול</button>
                    <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }}>שמור ציון</button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      {isEditStudentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '20px' }}>עריכת פרטי תלמיד</h3>
            <form onSubmit={handleSaveStudent}>
              <div className="form-group">
                <label>שם מלא</label>
                <input type="text" className="form-input" value={studentFormData.full_name} onChange={e => setStudentFormData({...studentFormData, full_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>כיתה</label>
                <input type="text" className="form-input" value={studentFormData.class_name} onChange={e => setStudentFormData({...studentFormData, class_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>סטטוס פעילות</label>
                <select className="form-input" value={studentFormData.status} onChange={e => setStudentFormData({...studentFormData, status: e.target.value})}>
                  <option value="active">פעיל (לומד כרגע)</option>
                  <option value="inactive">לא פעיל (סיים/הוקפא)</option>
                </select>
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsEditStudentModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }}>שמור שינויים</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>עריכת שיעור</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff5f5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <input 
                  type="checkbox" 
                  id="irregularCheckProfile"
                  checked={lessonFormData.is_irregular}
                  onChange={e => setLessonFormData({...lessonFormData, is_irregular: e.target.checked})}
                  style={{ margin: 0, cursor: 'pointer' }}
                />
                <label htmlFor="irregularCheckProfile" style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                  סמן כחריג
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveLesson}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>מורה</label>
                  <select className="form-input" value={lessonFormData.teacher_id} onChange={e => setLessonFormData({...lessonFormData, teacher_id: e.target.value})}>
                    <option value="">ללא מורה / מורה מחליף</option>
                    {teachersList.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>מקצוע</label>
                  <select className="form-input" value={lessonFormData.subject_id} onChange={e => setLessonFormData({...lessonFormData, subject_id: e.target.value})} required>
                    <option value="" disabled>בחר מקצוע</option>
                    {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>תאריך</label>
                  <input type="date" className="form-input" value={lessonFormData.lesson_date} onChange={e => setLessonFormData({...lessonFormData, lesson_date: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>שעת התחלה</label>
                  <input type="time" className="form-input" value={lessonFormData.start_time} onChange={e => setLessonFormData({...lessonFormData, start_time: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>שעת סיום</label>
                  <input type="time" className="form-input" value={lessonFormData.end_time} onChange={e => setLessonFormData({...lessonFormData, end_time: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>תוכן השיעור</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  value={lessonFormData.subject} 
                  onChange={e => setLessonFormData({...lessonFormData, subject: e.target.value})} 
                  required 
                  style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsLessonModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }}>עדכן שיעור</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </div>
  );
};

export default StudentProfile;