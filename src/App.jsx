import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Sidebar from "./components/Sidebar"; 
import LessonsHistory from "./pages/LessonsHistory"; 
import StudentsList from "./pages/StudentsList"; 
import StudentProfile from "./pages/StudentProfile"; 
import TeachersList from "./pages/TeachersList";
import TeacherProfile from "./pages/TeacherProfile";
import IrregularReports from "./pages/IrregularReports";
import Login from "./pages/Login";
import AdminReports from "./pages/AdminReports";
import "./App.css";

// כאן מגדירים מי המנהל הראשי של המערכת
const ADMIN_EMAIL = 'admin@royk.com'; 

function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // State חדש לבדיקת הרשאות מנהל
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [currentPage, setCurrentPage] = useState("students");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  
  const [unhandledCount, setUnhandledCount] = useState(0);

  useEffect(() => {
    // בדיקה ראשונית כשהאפליקציה עולה
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // עדכון הסטייט של המנהל לפי האימייל
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
      setIsInitializing(false);
    });

    // האזנה לשינויי התחברות/התנתקות
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
      
      // אם משתמש רגיל התחבר והיה על עמוד מנהל, נחזיר אותו לעמוד הראשי
      if (session?.user?.email !== ADMIN_EMAIL && (currentPage === 'reports' || currentPage === 'admin_reports')) {
        setCurrentPage('students');
      }
    });

    return () => subscription.unsubscribe();
  }, [currentPage]);

  const fetchUnhandledCount = async () => {
    // מורים רגילים לא צריכים למשוך את כמות הדיווחים החריגים
    if (!isAdmin) return;

    const { count, error } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('is_irregular', true)
      .eq('is_handled', false);

    if (!error) {
      setUnhandledCount(count || 0);
    }
  };

  useEffect(() => {
    if (session && isAdmin) {
      fetchUnhandledCount();

      const subscription = supabase
        .channel('public:lessons')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, payload => {
          fetchUnhandledCount(); 
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [session, isAdmin]);

  const handleNavigate = (page, id = null) => {
    setCurrentPage(page);
    if (id) {
      if (page === 'profile') {
        setSelectedStudentId(id);
      } else if (page === 'teacherProfile') {
        setSelectedTeacherId(id);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isInitializing) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>טוען מערכת...</div>;
  }

  // הצגת מסך ההתחברות אם אין משתמש מחובר
  // (אין צורך להעביר onLoginSuccess כי onAuthStateChange תופס את זה אוטומטית)
  if (!session) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "history":
        return <LessonsHistory onNavigate={handleNavigate} />;
      case "students":
        return <StudentsList onNavigate={handleNavigate} />;
      case "profile":
        return <StudentProfile studentId={selectedStudentId} onNavigate={handleNavigate} />;
      case "teachers":
        return <TeachersList onNavigate={handleNavigate} />;
      case "teacherProfile":
        return <TeacherProfile teacherId={selectedTeacherId} onNavigate={handleNavigate} />;
      case "reports":
        // חסימת גישה למסך חריגים אם המשתמש הוא לא מנהל
        return isAdmin ? <IrregularReports onNavigate={handleNavigate} /> : <StudentsList onNavigate={handleNavigate} />;
      case "admin_reports":
        return isAdmin ? <AdminReports /> : <StudentsList onNavigate={handleNavigate} />;
      default:
        return <StudentsList onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container" dir="rtl">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        onLogout={handleLogout} 
        unhandledCount={unhandledCount} 
        isAdmin={isAdmin} // מעבירים את ההרשאה לסיידבר
      />
      {renderPage()}
    </div>
  );
}

export default App;