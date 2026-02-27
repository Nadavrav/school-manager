import React, { useState } from 'react';
import { supabase } from '../../supabase';
import './Login.css'; // ניצור עיצוב בסיסי בהמשך

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('פרטי ההתחברות שגויים. אנא נסה שוב.');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#3b82f6' }}>school</span>
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