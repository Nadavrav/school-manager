import React from 'react';

const LessonLog = ({ lessons }) => {
  return (
    <div className="space-y-4 mt-8 text-right">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">היסטוריית שיעורים</h3>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 text-slate-500 uppercase font-medium">
              <tr>
                <th className="px-5 py-3 w-32 text-right">תאריך</th>
                <th className="px-5 py-3 text-right">נושא השיעור</th>
                <th className="px-5 py-3 w-32 text-right">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {new Date(lesson.date).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{lesson.topic}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{lesson.content}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      lesson.status === 'בוצע' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`size-1.5 rounded-full ${lesson.status === 'בוצע' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {lesson.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LessonLog;