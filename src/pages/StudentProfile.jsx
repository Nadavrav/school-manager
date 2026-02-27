import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './StudentProfile.css';

const StudentProfile = ({ studentId, onNavigate }) => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States לסינון וניהול המודאל
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('הכל');
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({
    subject_id: '',
    exam_name: '',
    score: '',
    exam_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // 1. שליפת רשימת המקצועות
      const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');
      if (subjectsData) setSubjectsList(subjectsData);

      // 2. שליפת פרטי התלמיד
      const { data: studentData, error: studentError } = await supabase
        .from('students').select('*').eq('id', studentId).single();
      if (studentError) throw studentError;

      // 3. שליפת שיעורים עם JOIN למקצוע
      const { data: lessonsData } = await supabase
        .from('lessons').select('*, subjects(name)')
        .eq('student_id', studentId).order('lesson_date', { ascending: false });

      // 4. שליפת ציונים עם JOIN למקצוע
      const { data: gradesData } = await supabase
        .from('grades').select('*, subjects(name)')
        .eq('student_id', studentId).order('exam_date', { ascending: false });

      setStudentInfo(studentData);
      
      if (lessonsData) {
        setLessons(lessonsData.map(l => ({
          id: l.id,
          date: new Date(l.lesson_date).toLocaleDateString('he-IL'),
          subject_name: l.subjects?.name || 'ללא מקצוע',
          topic: l.subject,
          status: l.status,
          statusType: l.status === 'בוצע' ? 'success' : (l.status === 'לא בוצע' ? 'danger' : 'warning')
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

  // לוגיקת סינון ציונים
  const filteredGrades = grades.filter(g => 
    selectedSubjectFilter === 'הכל' || g.subject_name === selectedSubjectFilter
  );

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingGradeId(null);
    setGradeFormData({
      subject_id: subjectsList.length > 0 ? subjectsList[0].id : '',
      exam_name: '', score: '', exam_date: new Date().toISOString().split('T')[0]
    });
    setIsGradeModalOpen(true);
  };

  const handleOpenEditModal = (grade) => {
    setModalMode('edit');
    setEditingGradeId(grade.id);
    setGradeFormData({
      subject_id: grade.subject_id,
      exam_name: grade.exam_name,
      score: grade.score,
      exam_date: grade.date
    });
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        student_id: studentId,
        subject_id: gradeFormData.subject_id,
        exam_name: gradeFormData.exam_name,
        score: parseInt(gradeFormData.score),
        exam_date: gradeFormData.exam_date
      };

      if (modalMode === 'add') {
        await supabase.from('grades').insert([payload]);
      } else {
        await supabase.from('grades').update(payload).eq('id', editingGradeId);
      }
      setIsGradeModalOpen(false);
      fetchStudentData();
    } catch (error) {
      alert('שגיאה בשמירה');
    }
  };

  const handleDeleteGrade = async (id) => {
    if (window.confirm('למחוק ציון זה?')) {
      await supabase.from('grades').delete().eq('id', id);
      fetchStudentData();
    }
  };

  if (loading) return <div className="loading-state">טוען נתונים...</div>;

  return (
    <div className="student-profile-wrapper">
      <div style={{marginBottom: '16px'}}>
        <button onClick={() => onNavigate('students')} className="btn-back-link">
          <span className="material-symbols-outlined">arrow_forward</span> חזרה לרשימה
        </button>
      </div>

      <header className="profile-header-section">
        <div className="profile-card">
          <div className="profile-info-wrap">
            <div className="profile-avatar-large">{studentInfo?.full_name?.charAt(0)}</div>
            <div className="profile-details">
              <h2>{studentInfo?.full_name}</h2>
              <span className="meta-item">{studentInfo?.class_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-content-grid">
        {/* היסטוריית שיעורים */}
        <div className="section-container">
          <h3 className="section-title">היסטוריית שיעורים</h3>
          <div className="section-card">
            <table className="profile-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>מקצוע</th>
                  <th>נושא</th>
                  <th style={{textAlign: 'center'}}>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map(l => (
                  <tr key={l.id}>
                    <td>{l.date}</td>
                    <td style={{fontWeight: '700', color: '#137fec'}}>{l.subject_name}</td>
                    <td>{l.topic}</td>
                    <td style={{textAlign: 'center'}}><span className={`badge badge-${l.statusType}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ציונים */}
        <div className="section-container">
          <div className="section-header">
            <h3 className="section-title">ציונים</h3>
            <button className="btn-add-inline" onClick={handleOpenAddModal}>הוספת ציון</button>
          </div>

          {/* כפתורי סינון מהירים */}
          <div className="quick-filters">
            <button 
              className={`filter-tag ${selectedSubjectFilter === 'הכל' ? 'active' : ''}`}
              onClick={() => setSelectedSubjectFilter('הכל')}
            >הכל</button>
            {subjectsList.map(s => (
              <button 
                key={s.id} 
                className={`filter-tag ${selectedSubjectFilter === s.name ? 'active' : ''}`}
                onClick={() => setSelectedSubjectFilter(s.name)}
              >{s.name}</button>
            ))}
          </div>

          <div className="section-card">
            <table className="profile-table">
              <thead>
                <tr>
                  <th>מקצוע</th>
                  <th>מבחן</th>
                  <th>ציון</th>
                  <th style={{textAlign: 'left'}}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map(g => (
                  <tr key={g.id}>
                    <td style={{fontWeight: '700', color: '#137fec'}}>{g.subject_name}</td>
                    <td>{g.exam_name}</td>
                    <td style={{fontWeight: '800'}}>{g.score}</td>
                    <td style={{textAlign: 'left'}}>
                      <div className="action-btns">
                        <span className="material-symbols-outlined" onClick={() => handleOpenEditModal(g)}>edit</span>
                        <span className="material-symbols-outlined delete" onClick={() => handleDeleteGrade(g.id)}>delete</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isGradeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{modalMode === 'add' ? 'הוספת ציון' : 'עריכת ציון'}</h2>
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
                <input type="text" value={gradeFormData.exam_name} onChange={e => setGradeFormData({...gradeFormData, exam_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>ציון</label>
                <input type="number" value={gradeFormData.score} onChange={e => setGradeFormData({...gradeFormData, score: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsGradeModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary">שמור</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;