import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Send, CheckCircle } from 'lucide-react';

const AddLessonForm = ({ studentId, onLessonAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    content: '',
    status: 'בוצע',
    date: new Date().toISOString().split('T')[0] // תאריך של היום כברירת מחדל
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // הוספת השיעור ל-Supabase
    const { error } = await supabase.from('lessons').insert([
      {
        student_id: studentId,
        topic: formData.topic,
        content: formData.content,
        status: formData.status,
        date: formData.date,
      },
    ]);

    setLoading(false);

    if (error) {
      alert('שגיאה בשמירת השיעור: ' + error.message);
    } else {
      // איפוס הטופס
      setFormData({ ...formData, topic: '', content: '' });
      // קריאה לפונקציה שמרעננת את הרשימה ב-App.js
      onLessonAdded();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <CheckCircle className="text-blue-600 w-5 h-5" />
        דיווח על שיעור חדש
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">נושא השיעור</label>
            <input
              type="text"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="למשל: הכנה למבחן באנגלית"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">תאריך</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">פירוט (מה למדנו?)</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows="3"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="כתוב כאן הערות חשובות מהשיעור..."
          ></textarea>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="בוצע"
                checked={formData.status === 'בוצע'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="text-blue-600"
              />
              <span className="text-sm">בוצע</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="בוטל"
                checked={formData.status === 'בוטל'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="text-red-600"
              />
              <span className="text-sm">בוטל</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'שומר...' : 'שמור שיעור'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLessonForm;