import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Sidebar from "./components/Sidebar"; 
import LessonsHistory from "./pages/LessonsHistory"; 
import StudentsList from "./pages/StudentsList"; 
import StudentProfile from "./pages/StudentProfile"; 
import Login from "./pages/Login"; // ייבוא מסך ההתחברות שיצרנו
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [currentPage, setCurrentPage] = useState("students");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // האזנה לשינויים במצב ההתחברות (Login/Logout)
  useEffect(() => {
    // בדיקה ראשונית בטעינת העמוד
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false);
    });

    // הרשמה לאירועי התחברות/התנתקות שקורים ברקע
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page, id = null) => {
    setCurrentPage(page);
    if (id) {
      setSelectedStudentId(id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // מסך טעינה קצרצר בזמן ש-Supabase בודק את הטוקן ב-LocalStorage
  if (isInitializing) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>טוען...</div>;
  }

  // אם אין סשן פעיל, נציג אך ורק את מסך ההתחברות
  if (!session) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "history":
        return <LessonsHistory />;
      case "students":
        return <StudentsList onNavigate={handleNavigate} />;
      case "profile":
        return <StudentProfile studentId={selectedStudentId} onNavigate={handleNavigate} />;
      default:
        return <StudentsList onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container" dir="rtl">
      {/* העברנו פונקציית התנתקות לסיידבר כדי שתוכל להוסיף כפתור יציאה בהמשך אם תרצה */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />
      {renderPage()}
    </div>
  );
}

export default App;