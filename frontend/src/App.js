import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentSignUpPage from './pages/StudentSignUpPage';

const createElement = React.createElement;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('access_token')),
  );

  return (
    createElement(
      Router,
      null,
      createElement(
        Routes,
        null,
        createElement(Route, { path: '/', element: createElement(EntryPage) }),
        createElement(Route, {
          path: '/studentlogin',
          element: createElement(StudentLoginPage, { setIsAuthenticated }),
        }),
        createElement(Route, {
          path: '/studentregister',
          element: createElement(StudentSignUpPage),
        }),
        createElement(Route, {
          path: '/student/dashboard',
          element: isAuthenticated
            ? createElement(StudentDashboardPage, { setIsAuthenticated })
            : createElement(Navigate, { to: '/studentlogin', replace: true }),
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
