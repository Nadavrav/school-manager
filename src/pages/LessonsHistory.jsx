import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './LessonsHistory.css';

const LessonsHistory = () => {
  const [lessons, setLessons] = useState([]);
  const [studentsList, setStudentsList] = useState([]); 
  const [teachersList, setTeachersList] = useState([]); 
  const [subjectsList, setSubjectsList] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    date: '', student: '', teacher: '', subject_name: '', subject_topic: '', status: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '', teacher_id: '', subject_id: '', 
    lesson_date: '', start_time: '', end_time: '', subject: '', status: 'בוצע'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          { data: students }, { data: teachers }, { data: subjects }
        ] = await Promise.all([
          supabase.from('students').select('id, full_name').eq('status', 'active'),
          supabase.from('teachers').select('id, full_name'),
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
            time: `${l.start_time?.substring(0, 5)} - ${l.end_time?.substring(0, 5)}`,
            student: l.students?.full_name || 'תלמיד נמחק',
            teacher: l.teachers?.full_name || 'ללא מורה',
            subject_name: l.subjects?.name || 'ללא מקצוע',
            subject_topic: l.subject,
            status: l.status,
            statusType: l.status === 'בוצע' ? 'done' : 'cancel',
            initials: l.students?.full_name?.charAt(0) || '?'
          }));
          setLessons(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // לוגיקת סינון הכוללת סינון מדויק לפי שם מקצוע מהרשימה
  const filteredLessons = lessons.filter(lesson => {
    return (
      (lesson.date.includes(filters.date) || lesson.time.includes(filters.date)) &&
      lesson.student.includes(filters.student) &&
      lesson.teacher.includes(filters.teacher) &&
      (filters.subject_name === '' || lesson.subject_name === filters.subject_name) &&
      lesson.subject_topic.includes(filters.subject_topic) &&
      lesson.status.includes(filters.status)
    );
  });

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const currentLessons = filteredLessons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lessons').insert([{ 
        student_id: formData.student_id,
        teacher_id: formData.teacher_id || null,
        subject_id: formData.subject_id,
        lesson_date: formData.lesson_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        subject: formData.subject,
        status: formData.status
      }]);
      if (error) throw error;
      window.location.reload(); 
    } catch (err) {
      alert("שגיאה בשמירה");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content-wrapper">
      <header className="top-bar">
        <h2>היסטוריית שיעורים</h2>
      </header>

      <main className="scroll-content">
        <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px'}}>
          <button className="btn-primary" onClick={() => {
            setFormData({...formData, student_id: studentsList[0]?.id, subject_id: subjectsList[0]?.id, lesson_date: new Date().toISOString().split('T')[0]});
            setIsModalOpen(true);
          }}>שיעור חדש</button>
        </div>

        <div className="history-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>תאריך ושעה</th>
                <th>תלמיד</th>
                <th>מקצוע</th>
                <th>נושא</th>
                <th>סטטוס</th>
                <th style={{textAlign: 'left'}}>פעולות</th>
              </tr>
              <tr className="filter-row">
                <th><input type="text" placeholder="חיפוש..." className="col-filter-input" onChange={e => setFilters({...filters, date: e.target.value})} /></th>
                <th><input type="text" placeholder="תלמיד..." className="col-filter-input" onChange={e => setFilters({...filters, student: e.target.value})} /></th>
                <th>
                  {/* סינון מקצוע באמצעות רשימה נפתחת */}
                  <select className="col-filter-input" onChange={e => setFilters({...filters, subject_name: e.target.value})}>
                    <option value="">כל המקצועות</option>
                    {subjectsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </th>
                <th><input type="text" placeholder="נושא..." className="col-filter-input" onChange={e => setFilters({...filters, subject_topic: e.target.value})} /></th>
                <th>
                  <select className="col-filter-input" onChange={e => setFilters({...filters, status: e.target.value})}>
                    <option value="">הכל</option>
                    <option value="בוצע">בוצע</option>
                    <option value="לא בוצע">לא בוצע</option>
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentLessons.map(lesson => (
                <tr key={lesson.id}>
                  <td>{lesson.date} <br/><small>{lesson.time}</small></td>
                  <td>{lesson.student}</td>
                  <td style={{fontWeight: '700', color: '#137fec'}}>{lesson.subject_name}</td>
                  <td>{lesson.subject_topic}</td>
                  <td><span className={`status ${lesson.statusType}`}>{lesson.status}</span></td>
                  <td style={{textAlign: 'left'}}>
                    <span className="material-symbols-outlined" style={{color: '#ef4444', cursor: 'pointer'}} onClick={() => supabase.from('lessons').delete().eq('id', lesson.id).then(() => window.location.reload())}>delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Component logic... */}
        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>הוספת שיעור חדש</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>תלמיד</label>
                <select className="form-input" onChange={e => setFormData({...formData, student_id: e.target.value})} required>
                  <option value="">בחר תלמיד</option>
                  {studentsList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>מקצוע</label>
                <select className="form-input" onChange={e => setFormData({...formData, subject_id: e.target.value})} required>
                  <option value="">בחר מקצוע</option>
                  {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>נושא</label>
                <input type="text" className="form-input" onChange={e => setFormData({...formData, subject: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>שמור</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonsHistory;