import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentSignUpPage from './pages/StudentSignUpPage';
import EntryPage from './pages/EntryPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [ClubLeaderId, setClubLeaderId] = useState('');
  const [AdminId, setAdminId] = useState('');

  return (
    <Router>
      <div>
        <Routes>
          <Route exact path="/studentlogin" element={<StudentLoginPage setIsAuthenticated={setIsAuthenticated} setUserId={setUserId} />} />
          <Route exact path="/studentregister" element={<StudentSignUpPage />} />
          <Route exact path="/" element={<EntryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;