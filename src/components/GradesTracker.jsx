import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Trophy, Plus, Trash2 } from 'lucide-react';

const GradesTracker = ({ studentId }) => {
  const [grades, setGrades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newGrade, setNewGrade] = useState({ test_name: '', score: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (studentId) fetchGrades();
  }, [studentId]);

  const fetchGrades = async () => {
    const { data } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });
    setGrades(data || []);
  };

  const addGrade = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('grades').insert([{ ...newGrade, student_id: studentId }]);
    if (!error) {
      setNewGrade({ test_name: '', score: '', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchGrades();
    }
  };

  // חישוב ממוצע ציונים
  const average = grades.length > 0 
    ? (grades.reduce((acc, curr) => acc + curr.score, 0) / grades.length).toFixed(1) 
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">מעקב ציונים</h3>
            <p className="text-sm text-slate-500">ממוצע נוכחי: <span className="font-bold text-blue-600">{average}</span></p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          הוסף ציון
        </button>
      </div>

      {showForm && (
        <form onSubmit={addGrade} className="mb-6 p-4 bg-slate-50 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text" placeholder="שם המבחן" required
            className="px-3 py-2 rounded-lg border border-slate-200"
            value={newGrade.test_name} onChange={e => setNewGrade({...newGrade, test_name: e.target.value})}
          />
          <input 
            type="number" placeholder="ציון (0-100)" required min="0" max="100"
            className="px-3 py-2 rounded-lg border border-slate-200"
            value={newGrade.score} onChange={e => setNewGrade({...newGrade, score: parseInt(e.target.value)})}
          />
          <button type="submit" className="bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">שמור ציון</button>
        </form>
      )}

      <div className="space-y-3">
        {grades.map(grade => (
          <div key={grade.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <span className="font-medium text-slate-800">{grade.test_name}</span>
              <span className="text-xs text-slate-400 mr-3">{new Date(grade.date).toLocaleDateString('he-IL')}</span>
            </div>
            <div className={`text-lg font-black ${grade.score >= 90 ? 'text-green-600' : grade.score >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>
              {grade.score}
            </div>
          </div>
        ))}
        {grades.length === 0 && <p className="text-center text-slate-400 text-sm py-4">אין ציונים רשומים לתלמיד זה</p>}
      </div>
    </div>
  );
};

export default GradesTracker;