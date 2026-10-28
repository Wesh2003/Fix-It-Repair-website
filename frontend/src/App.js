import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentSignUpPage from './pages/StudentSignUpPage';
import MaintananceStaffDashboardPage from './pages/MaintananceStaffDashboardPage';
import AdministratorDashboardPage from './pages/AdministratorDashboardPage';
import MaintananceStaffLogin from './components/MaintananceStaffLogin';
import MaintananceStaffSignUp from './components/MaintananceStaffSignUp';
import AdministratorLogin from './components/AdministratorLogin';
import AdministratorSignUp from './components/AdministratorSignUp';
import AuthRoleSelectionPage from './pages/AuthRoleSelectionPage';

const createElement = React.createElement;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('access_token')),
  );
  const [userRole, setUserRole] = useState(() => localStorage.getItem('role'));

  return (
    createElement(
      Router,
      null,
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/', element: createElement(EntryPage) }),
        createElement(Route, {
          path: '/login',
          element: createElement(AuthRoleSelectionPage, { mode: 'login' }),
        }),
        createElement(Route, {
          path: '/signup',
          element: createElement(AuthRoleSelectionPage, { mode: 'signup' }),
        }),
        createElement(Route, {
          path: '/studentlogin',
          element: createElement(StudentLoginPage, { setIsAuthenticated, setUserRole }),
        }),
        createElement(Route, {
          path: '/studentregister',
          element: createElement(StudentSignUpPage),
        }),
        createElement(Route, {
          path: '/student/dashboard',
          element: isAuthenticated && userRole === 'customer'
            ? createElement(StudentDashboardPage, { setIsAuthenticated })
            : createElement(Navigate, { to: '/studentlogin', replace: true }),
        }),
        createElement(Route, {
          path: '/staff/login',
          element: createElement(MaintananceStaffLogin, { setIsAuthenticated, setUserRole }),
        }),
        createElement(Route, {
          path: '/staff/register',
          element: createElement(MaintananceStaffSignUp),
        }),
        createElement(Route, {
          path: '/staff/dashboard',
          element: isAuthenticated && userRole === 'staff'
            ? createElement(MaintananceStaffDashboardPage, { setIsAuthenticated, setUserRole })
            : createElement(Navigate, { to: '/staff/login', replace: true }),
        }),
        createElement(Route, {
          path: '/admin/login',
          element: createElement(AdministratorLogin, { setIsAuthenticated, setUserRole }),
        }),
        createElement(Route, {
          path: '/admin/register',
          element: createElement(AdministratorSignUp),
        }),
        createElement(Route, {
          path: '/admin/dashboard',
          element: isAuthenticated && userRole === 'admin'
            ? createElement(AdministratorDashboardPage, { setIsAuthenticated, setUserRole })
            : createElement(Navigate, { to: '/admin/login', replace: true }),
        }),
        createElement(Route, {
          path: '*',
          element: createElement(Navigate, { to: '/', replace: true }),
        }),
      ),
    )
  );
}

export default App;
