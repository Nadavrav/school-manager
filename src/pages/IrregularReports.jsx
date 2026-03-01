import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import './StudentsList.css'; 

const IrregularReports = ({ onNavigate }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState('all'); 
  
  const [filters, setFilters] = useState({
    date: '', student: '', teacher: '', subject: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [handlingNotes, setHandlingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState({ title: '', content: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, filterStatus]);

  const handleOpenViewModal = (title, content) => {
    setViewModalData({ title, content });
    setIsViewModalOpen(true);
  };

  useEffect(() => {
    fetchIrregularReports();
  }, []);

  const fetchIrregularReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          students (full_name),
          teachers (full_name)
        `)
        .eq('is_irregular', true)
        .order('is_handled', { ascending: true }) 
        .order('lesson_date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openHandlingModal = (id, existingNotes = '') => {
    setSelectedLessonId(id);
    setHandlingNotes(existingNotes); 
    setIsModalOpen(true);
  };

  const submitHandling = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ 
          is_handled: true,
          handling_notes: handlingNotes 
        })
        .eq('id', selectedLessonId);

      if (error) throw error;
      
      setIsModalOpen(false);
      await fetchIrregularReports(); 
    } catch (error) {
      alert('שגיאה בעדכון הסטטוס');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIrregularity = async (id) => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל את סימון החריגות לשיעור זה? (השיעור לא יימחק מהמערכת)')) {
      try {
        const { error } = await supabase
          .from('lessons')
          .update({ is_irregular: false, is_handled: false, handling_notes: null })
          .eq('id', id);

        if (error) throw error;
        await fetchIrregularReports(); 
      } catch (error) {
        console.error('Error removing irregularity:', error);
        alert('שגיאה בביטול סימון החריגות');
      }
    }
  };

  const filteredReports = reports.filter(report => {
    let statusMatch = true;
    if (filterStatus === 'pending') statusMatch = !report.is_handled;
    if (filterStatus === 'handled') statusMatch = report.is_handled;

    const dateStr = new Date(report.lesson_date).toLocaleDateString('he-IL');
    const dateMatch = dateStr.includes(filters.date);
    const studentMatch = (report.students?.full_name || '').includes(filters.student);
    const teacherMatch = (report.teachers?.full_name || '').includes(filters.teacher);
    const subjectMatch = (report.subject || '').includes(filters.subject);

    return statusMatch && dateMatch && studentMatch && teacherMatch && subjectMatch;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="page-container">
      {/* --- שינוי ב-Header: הוספת flexbox והכנסת ה-Dropdown פנימה --- */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>שיעורים חריגים</h1>
          <p>ריכוז שיעורים הדורשים מעקב וטיפול מנהל</p>
        </div>
        
        {/* ה-Dropdown הועבר לכאן! */}
        <select 
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer', backgroundColor: 'white', fontFamily: 'inherit', fontWeight: '600', color: '#1e293b' }}
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">הצג הכל</option>
          <option value="pending">ממתינים לטיפול</option>
          <option value="handled">טופלו</option>
        </select>
      </header>

      {loading ? (
        <div className="loading">טוען נתונים...</div>
      ) : (
        <div className="section-card" style={{ margin: '0 40px', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
          <table className="profile-table" style={{ tableLayout: 'fixed', width: '100%', wordWrap: 'break-word' }}>
            <thead>
              <tr>
                <th style={{ width: '12%' }}>תאריך</th>
                <th style={{ width: '15%' }}>תלמיד</th>
                <th style={{ width: '15%' }}>מורה</th>
                <th style={{ width: '15%' }}>תוכן השיעור</th>
                <th style={{ width: '10%' }}>סטטוס טיפול</th>
                <th style={{ width: '18%' }}>הערות הנהלה</th>
                <th style={{ width: '15%', textAlign: 'left' }}>פעולות</th>
              </tr>
              <tr className="filter-row">
                <th><input type="text" placeholder="חיפוש..." className="col-filter-input" onChange={e => setFilters({...filters, date: e.target.value})} /></th>
                <th><input type="text" placeholder="תלמיד..." className="col-filter-input" onChange={e => setFilters({...filters, student: e.target.value})} /></th>
                <th><input type="text" placeholder="מורה..." className="col-filter-input" onChange={e => setFilters({...filters, teacher: e.target.value})} /></th>
                <th><input type="text" placeholder="תוכן..." className="col-filter-input" onChange={e => setFilters({...filters, subject: e.target.value})} /></th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentReports.length > 0 ? (
                currentReports.map(report => (
                  <tr key={report.id} style={{ backgroundColor: report.is_handled ? 'transparent' : '#fff5f5' }}>
                    <td>{new Date(report.lesson_date).toLocaleDateString('he-IL')}</td>
                    
                    <td 
                      style={{ fontWeight: '600', color: '#137fec', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onNavigate('profile', report.student_id)}
                      title="עבור לפרופיל תלמיד"
                    >
                      {report.students?.full_name}
                    </td>

                    <td 
                      style={{ color: report.teacher_id ? '#137fec' : 'inherit', cursor: report.teacher_id ? 'pointer' : 'default', textDecoration: report.teacher_id ? 'underline' : 'none' }}
                      onClick={() => { if (report.teacher_id) onNavigate('teacherProfile', report.teacher_id) }}
                      title={report.teacher_id ? "עבור לפרופיל מורה" : ""}
                    >
                      {report.teachers?.full_name || 'ללא מורה'}
                    </td>
                    
                    <td style={{ maxWidth: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '120px' }}>
                          {report.subject}
                        </span>
                        {report.subject && (
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#137fec', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleOpenViewModal('תוכן השיעור', report.subject)} title="קרא בהרחבה">open_in_new</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${report.is_handled ? 'badge-success' : 'badge-danger'}`}>
                        {report.is_handled ? 'טופל' : 'ממתין לטיפול'}
                      </span>
                    </td>
                    
                    <td style={{ maxWidth: '180px' }}>
                      {report.handling_notes ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '140px' }}>
                            {report.handling_notes}
                          </span>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#137fec', cursor: 'pointer', flexShrink: 0 }} onClick={() => handleOpenViewModal('הערות הנהלה', report.handling_notes)} title="קרא בהרחבה">open_in_new</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                        
                        {!report.is_handled ? (
                          <span 
                            className="material-symbols-outlined" 
                            style={{ color: '#22c55e', cursor: 'pointer' }} 
                            onClick={() => openHandlingModal(report.id)} 
                            title="סמן כטופל (הוסף הערות טיפול)"
                          >
                            check_circle
                          </span>
                        ) : (
                          <span 
                            className="material-symbols-outlined" 
                            style={{ color: '#137fec', cursor: 'pointer' }} 
                            onClick={() => openHandlingModal(report.id, report.handling_notes)} 
                            title="ערוך הערות טיפול"
                          >
                            edit
                          </span>
                        )}
                        
                        <span className="material-symbols-outlined" style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => handleRemoveIrregularity(report.id)} title="בטל חריגות והסר מרשימה זו">person_off</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    {filterStatus === 'pending' ? 'אין שיעורים חריגים שממתינים לטיפול.' : 'אין שיעורים חריגים במערכת.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredReports.length > 0 && (
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '8px' }}>סגירת שיעור חריג</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
              אנא פרט כיצד טופל האירוע. הערות אלו יישמרו במערכת לתיעוד ולשקיפות מול צוות ההוראה.
            </p>
            <form onSubmit={submitHandling}>
              <div className="form-group">
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>אופן הטיפול / הערות</label>
                <textarea 
                  className="form-input" 
                  rows="5"
                  value={handlingNotes} 
                  onChange={e => setHandlingNotes(e.target.value)} 
                  placeholder="לדוגמה: שוחחתי עם הורי התלמיד והמורה, הוחלט על..."
                  required 
                  style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', padding: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }} onClick={() => setIsModalOpen(false)}>ביטול</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }} disabled={isSubmitting}>
                  {isSubmitting ? 'שומר...' : 'שמור וסמן כטופל'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IrregularReports;