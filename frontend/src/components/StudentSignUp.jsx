import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/UserSignUp.css';

function StudentSignUp() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/userregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert("User registered successfully!");
        navigate('/studentlogin');
      } else {
        const errorData = await response.json();
        console.error('Signup failed:', errorData.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <div className='signup-form-container'>
      <h2 className='sign-heading'>User Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div classname="form-group">
          <label className='signup-label' htmlFor='first_name'>First Name:</label>
          <input className='signup-input' type='text' id='first_name' name='first_name' value={formData.first_name} onChange={handleChange} required />
        </div>
        <div classname="form-group">
          <label className='signup-label' htmlFor='last_name'>Last Name:</label>
          <input className='signup-input' type='text' id='last_name' name='last_name' value={formData.last_name} onChange={handleChange} required />
        </div>
        <div classname="form-group">
          <label className='signup-label' htmlFor='email'>Email:</label>
          <input className='signup-input' type='email' id='email' name='email' value={formData.email} onChange={handleChange} required />
        </div>
        <div classname="form-group">
          <label className='signup-label' htmlFor='password'>Password:</label>
          <input className='signup-input' type='password' id='password' name='password' value={formData.password} onChange={handleChange} required />
        </div>
        <button className='signup-submit-btn' type='submit'>Sign Up as a New User</button>
      </form>
    </div>
  );
}

export default StudentSignUp;