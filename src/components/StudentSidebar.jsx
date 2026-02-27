import React from 'react';

const StudentSidebar = ({ students, selectedId, onSelect }) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 h-full overflow-y-auto" dir="rtl">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-blue-600">רשימת תלמידים</h2>
      </div>
      <nav className="p-2 space-y-1">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => onSelect(student.id)}
            className={`w-full text-right px-4 py-3 rounded-xl transition-all ${
              selectedId === student.id 
              ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {student.full_name}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default StudentSidebar;