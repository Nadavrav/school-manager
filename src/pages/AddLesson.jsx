import React from 'react';
import { Send, X, User, CalendarDays, BookOpen } from 'lucide-react';

const AddLesson = () => {
  return (
    <div className="flex-1 flex justify-center py-10 px-4 bg-slate-50/50 overflow-y-auto text-right">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">דיווח סיום שיעור</h1>
            <p className="text-slate-500 text-base">אנא מלא את פרטי השיעור שהסתיים לתיוק ההתקדמות.</p>
          </div>
          <X className="text-slate-400 cursor-pointer" />
        </div>
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-2"><User size={18} className="text-slate-400"/> שם התלמיד</label>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-right focus:border-[#137fec] outline-none">
                <option>אלכס כהן</option><option>שרה לוי</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-2"><CalendarDays size={18} className="text-slate-400"/> תאריך ושעה</label>
              <div className="flex gap-2">
                <input type="date" className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-right" defaultValue="2023-10-27" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-2"><BookOpen size={18} className="text-slate-400"/> מה למדנו היום?</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-4 py-3 text-right focus:border-[#137fec] outline-none" rows="5" placeholder="תאר את הנושאים שנלמדו..."></textarea>
          </div>
        </div>

        <div className="bg-slate-50 px-8 py-5 border-t flex justify-end gap-3">
          <button className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-medium transition-colors">ביטול</button>
          <button className="px-5 py-2.5 rounded-lg bg-[#137fec] text-white font-medium flex items-center gap-2 hover:bg-blue-600 shadow-sm transition-all">
            <Send size={18} /> שלח דיווח
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLesson;