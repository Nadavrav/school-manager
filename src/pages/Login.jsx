import React, { useState } from 'react';
import { supabase } from '../../supabase';
import './Login.css';

// הוספנו את onLoginSuccess כפרופ כדי לדווח ל-App על התחברות מוצלחת
const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // כאן אנחנו מגדירים מי המנהל במערכת (תוכל לשנות לאימייל שתגדיר ב-Supabase)
  const ADMIN_EMAIL = 'admin@royk.com'; 

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // הוספנו את data בנוסף ל-error כדי שנוכל לשלוף את פרטי המשתמש
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('פרטי ההתחברות שגויים. אנא נסה שוב.');
      setLoading(false); // במקרה של שגיאה מפסיקים את הטעינה כאן
    } else {
      // אם ההתחברות הצליחה, נבדוק אם זה המנהל
      const isUserAdmin = data.user.email === ADMIN_EMAIL;
      
      // נשלח את המידע ל-App.jsx (אם הפונקציה קיימת)
      if (onLoginSuccess) {
        onLoginSuccess(data.user, isUserAdmin);
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#137fec' }}>school</span>
          <h2>EduTrack</h2>
          <p>התחברות למערכת ניהול מורים</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label>דואר אלקטרוני</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              dir="ltr"
              placeholder="name@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>סיסמה</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              dir="ltr"
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;