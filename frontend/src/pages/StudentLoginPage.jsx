// User Login component 
import React from 'react';
import StudentLogin from '../components/StudentLogin';

function StudentLoginPage({ setIsAuthenticated, setUserRole }) {
    return (
      <div>
          <StudentLogin setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole}/>
      </div>
    )
  }
  
  export default StudentLoginPage