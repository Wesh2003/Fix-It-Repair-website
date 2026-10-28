import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import '../css/UserSignUp.css';
import '../css/UserLogin.css';

const initialForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
};

function MaintananceStaffSignUp() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await apiRequest('/users/staff_signup/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      navigate('/staff/login', {
        replace: true,
        state: { message: 'Your staff account is ready. Please log in.' },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand" aria-label="FixIt home">
        <span className="auth-brand-mark">F</span><span>Fix<span>It</span></span>
      </Link>
      <section className="auth-card">
        <p className="auth-kicker">JOIN THE MAINTENANCE TEAM</p>
        <h1>Create a staff account</h1>
        <p className="auth-description">Sign up to receive assigned repairs and keep your work status up to date.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Username
            <input autoComplete="username" name="username" value={formData.username} onChange={handleChange} minLength="3" required />
          </label>
          <div className="auth-form-row">
            <label>First name
              <input autoComplete="given-name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </label>
            <label>Last name
              <input autoComplete="family-name" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </label>
          </div>
          <label>Work email
            <input autoComplete="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label>Password
            <input autoComplete="new-password" type="password" name="password" value={formData.password} onChange={handleChange} minLength="8" required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create staff account'}
          </button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/staff/login">Log in</Link></p>
      </section>
    </main>
  );
}

export default MaintananceStaffSignUp;