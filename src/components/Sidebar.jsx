import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentPage, onNavigate, onLogout }) => {
  return (
    <aside className="app-sidebar">
      {/* אזור הלוגו העליון */}
      <div className="app-sidebar-header">
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>school</span>
        <span className="app-sidebar-logo">EduTrack</span>
      </div>

      {/* תפריט הניווט (כפתורי תלמידים ושיעורים) */}
      <nav className="app-sidebar-nav" style={{ marginTop: '24px' }}>
        <div 
          className={`app-nav-item ${currentPage === 'students' || currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('students')}
        >
          <span className="material-symbols-outlined">group</span>
          <span>תלמידים</span>
        </div>
        
        <div 
          className={`app-nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => onNavigate('history')}
        >
          <span className="material-symbols-outlined">menu_book</span>
          <span>שיעורים</span>
        </div>
      </nav>

      {/* אזור תחתון עם כפתור יציאה */}
      <div className="app-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
        <div 
          className="app-nav-item" 
          style={{ margin: 0, color: '#ef4444', cursor: 'pointer' }} 
          onClick={onLogout}
        >
          <span className="material-symbols-outlined">logout</span>
          <span>יציאה</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;