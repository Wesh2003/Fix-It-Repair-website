import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdministratorLogin from './components/AdministratorLogin';
import AdministratorSignUp from './components/AdministratorSignUp';
import MaintananceStaffLogin from './components/MaintananceStaffLogin';
import MaintananceStaffSignUp from './components/MaintananceStaffSignUp';
import AdministratorDashboardPage from './pages/AdministratorDashboardPage';
import AuthRoleSelectionPage from './pages/AuthRoleSelectionPage';
import EntryPage from './pages/EntryPage';
import MaintananceStaffDashboardPage from './pages/MaintananceStaffDashboardPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentSignUpPage from './pages/StudentSignUpPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('access_token')),
  );
  const [userRole, setUserRole] = useState(() => localStorage.getItem('role'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/login" element={<AuthRoleSelectionPage mode="login" />} />
        <Route path="/signup" element={<AuthRoleSelectionPage mode="signup" />} />
        <Route
          path="/studentlogin"
          element={(
            <StudentLoginPage
              setIsAuthenticated={setIsAuthenticated}
              setUserRole={setUserRole}
            />
          )}
        />
        <Route path="/studentregister" element={<StudentSignUpPage />} />
        <Route
          path="/student/dashboard"
          element={isAuthenticated && userRole === 'customer'
            ? <StudentDashboardPage setIsAuthenticated={setIsAuthenticated} />
            : <Navigate to="/studentlogin" replace />}
        />
        <Route
          path="/staff/login"
          element={(
            <MaintananceStaffLogin
              setIsAuthenticated={setIsAuthenticated}
              setUserRole={setUserRole}
            />
          )}
        />
        <Route path="/staff/register" element={<MaintananceStaffSignUp />} />
        <Route
          path="/staff/dashboard"
          element={isAuthenticated && userRole === 'staff'
            ? (
              <MaintananceStaffDashboardPage
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            )
            : <Navigate to="/staff/login" replace />}
        />
        <Route
          path="/admin/login"
          element={(
            <AdministratorLogin
              setIsAuthenticated={setIsAuthenticated}
              setUserRole={setUserRole}
            />
          )}
        />
        <Route path="/admin/register" element={<AdministratorSignUp />} />
        <Route
          path="/admin/dashboard"
          element={isAuthenticated && userRole === 'admin'
            ? (
              <AdministratorDashboardPage
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            )
            : <Navigate to="/admin/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
