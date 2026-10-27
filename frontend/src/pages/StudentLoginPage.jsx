// User Login component 
import React from 'react';
import StudentLogin from '../components/StudentLogin';

function StudentLoginPage({setIsAuthenticated, setUserId}) {
    return (
      <div>
          <StudentLogin setIsAuthenticated={setIsAuthenticated} setUserId={setUserId}/>
      </div>
    )
  }
  
  export default StudentLoginPage