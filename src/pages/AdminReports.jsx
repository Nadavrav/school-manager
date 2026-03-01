import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // התאם את הנתיב במידת הצורך
import './AdminReports.css';

const AdminReports = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalLessons: 0,
    irregularLessons: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // אנחנו משתמשים ב- count: 'exact' כדי לקבל רק את המספר בלי למשוך את כל הנתונים עצמם - זה סופר מהיר!
      const [
        { count: totalStudents },
        { count: activeStudents },
        { count: totalTeachers },
        { count: totalLessons },
        { count: irregularLessons }
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('is_irregular', true)
      ]);

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalLessons: totalLessons || 0,
        irregularLessons: irregularLessons || 0,
      });

    } catch (error) {
      console.error('שגיאה בשליפת נתונים סטטיסטיים:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">מכין את הנתונים למנהל...</div>
      </div>
    );
  }

  // חישוב אחוזים
  const activePercentage = stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0;
  const irregularRate = stats.totalLessons > 0 ? Math.round((stats.irregularLessons / stats.totalLessons) * 100) : 0;

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>דוחות וסטטיסטיקות</h1>
          <p>תמונת מצב בזמן אמת של פעילות המרכז</p>
        </div>
        <button className="btn-secondary" onClick={fetchStatistics} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined">refresh</span>
          רענן נתונים
        </button>
      </header>

      <div className="dashboard-grid">
        
        {/* כרטיסיית תלמידים */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">סה"כ תלמידים פעילים</h3>
            <div className="stat-value">{stats.activeStudents}</div>
            <div className="stat-desc">מתוך {stats.totalStudents} תלמידים רשומים ({activePercentage}% פעילים)</div>
          </div>
        </div>

        {/* כרטיסיית מורים */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#0ea5e9' }}>
            <span className="material-symbols-outlined">badge</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">צוות הוראה</h3>
            <div className="stat-value">{stats.totalTeachers}</div>
            <div className="stat-desc">מורים רשומים במערכת</div>
          </div>
        </div>

        {/* כרטיסיית שיעורים */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fdf4ff', color: '#a855f7' }}>
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">שיעורים שהועברו</h3>
            <div className="stat-value">{stats.totalLessons}</div>
            <div className="stat-desc">בכל הזמנים</div>
          </div>
        </div>

        {/* כרטיסיית חריגים */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">אירועים חריגים</h3>
            <div className="stat-value">{stats.irregularLessons}</div>
            <div className="stat-desc">{irregularRate}% מכלל השיעורים דווחו כחריגים</div>
          </div>
        </div>

      </div>

      {/* אזור להרחבה עתידית (גרפים וטבלאות) */}
      <div className="dashboard-extended">
        <div className="chart-placeholder">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }}>bar_chart</span>
          <h3>גרף פעילות שבועית</h3>
          <p>כאן נוכל להוסיף בעתיד גרפים אינטראקטיביים שיציגו את כמות השיעורים לפי ימים.</p>
        </div>
      </div>

    </div>
  );
};

export default AdminReports;