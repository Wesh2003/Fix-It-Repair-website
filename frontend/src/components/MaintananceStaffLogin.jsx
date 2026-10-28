import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import '../css/UserLogin.css';

function MaintananceStaffLogin({ setIsAuthenticated, setUserRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await apiRequest('/users/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.role !== 'staff') {
        setError('This account does not have maintenance staff access.');
        return;
      }
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('id', String(data.user_id));
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      setIsAuthenticated(true);
      setUserRole(data.role);
      navigate('/staff/dashboard', { replace: true });
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
        <p className="auth-kicker">MAINTENANCE STAFF</p>
        <h1>Staff log in</h1>
        <p className="auth-description">View the repair jobs assigned to you and update their progress.</p>
        {location.state?.message && <p className="auth-success" role="status">{location.state.message}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Username
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>Password
            <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">New staff member? <Link to="/staff/register">Create a staff account</Link></p>
      </section>
    </main>
  );
}

export default MaintananceStaffLogin;