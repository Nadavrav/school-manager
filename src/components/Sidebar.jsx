import React, { useState } from 'react';
import './Sidebar.css';

// הוספנו את isAdmin לפרופס
const Sidebar = ({ currentPage, onNavigate, onLogout, unhandledCount, isAdmin }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      
      {/* אזור הלוגו העליון עם כפתור הכיווץ */}
      <div className="app-sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'space-between', padding: isCollapsed ? '24px 0' : '24px' }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>school</span>
            <span className="app-sidebar-logo">EduTrack</span>
          </div>
        )}
        
        {/* כפתור שמחליף מצב פתוח/סגור */}
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "הרחב תפריט" : "כווץ תפריט"}>
          <span className="material-symbols-outlined">
            {isCollapsed ? 'menu' : 'chevron_right'}
          </span>
        </button>
      </div>

      {/* תפריט הניווט */}
      <nav className="app-sidebar-nav" style={{ marginTop: '24px' }}>
        
        <div 
          className={`app-nav-item ${currentPage === 'students' || currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('students')}
          title={isCollapsed ? "תלמידים" : ""}
        >
          <span className="material-symbols-outlined">group</span>
          {!isCollapsed && <span>תלמידים</span>}
        </div>

        <div 
          className={`app-nav-item ${currentPage === 'teachers' || currentPage === 'teacherProfile' ? 'active' : ''}`}
          onClick={() => onNavigate('teachers')}
          title={isCollapsed ? "מורים" : ""}
        >
          <span className="material-symbols-outlined">badge</span>
          {!isCollapsed && <span>מורים</span>}
        </div>
        
        <div 
          className={`app-nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => onNavigate('history')}
          title={isCollapsed ? "שיעורים" : ""}
        >
          <span className="material-symbols-outlined">menu_book</span>
          {!isCollapsed && <span>שיעורים</span>}
        </div>

        {/* --- אזור של מנהל בלבד --- */}
        {isAdmin && (
          <>
            <div 
              className={`app-nav-item ${currentPage === 'reports' ? 'active' : ''}`}
              onClick={() => onNavigate('reports')}
              style={{ position: 'relative' }}
              title={isCollapsed ? "שיעורים חריגים" : ""}
            >
              <span className="material-symbols-outlined">report_problem</span>
              {!isCollapsed && <span>שיעורים חריגים</span>}
              
              {unhandledCount > 0 && (
                <span className="notification-badge">
                  {unhandledCount > 99 ? '99+' : unhandledCount}
                </span>
              )}
            </div>

            <div 
              className={`app-nav-item ${currentPage === 'admin_reports' ? 'active' : ''}`}
              onClick={() => onNavigate('admin_reports')}
              title={isCollapsed ? "דוחות מנהל" : ""}
            >
              <span className="material-symbols-outlined">bar_chart</span>
              {!isCollapsed && <span>דוחות מנהל</span>}
            </div>
          </>
        )}

      </nav>

      {/* אזור תחתון עם כפתור יציאה */}
      <div className="app-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <div 
          className="app-nav-item" 
          style={{ margin: 0, color: '#ef4444', cursor: 'pointer', justifyContent: isCollapsed ? 'center' : 'flex-start' }} 
          onClick={onLogout}
          title={isCollapsed ? "יציאה" : ""}
        >
          <span className="material-symbols-outlined">logout</span>
          {!isCollapsed && <span>יציאה</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;