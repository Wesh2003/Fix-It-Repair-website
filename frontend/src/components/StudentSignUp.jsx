import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import '../css/UserSignUp.css';

const initialForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
};

function StudentSignUp() {
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
      await apiRequest('/users/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      navigate('/studentlogin', {
        replace: true,
        state: { message: 'Your student account is ready. Please log in.' },
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
        <span className="auth-brand-mark">F</span>
        <span>Fix<span>It</span></span>
      </Link>
      <section className="auth-card">
        <p className="auth-kicker">GET STARTED WITH FIXIT</p>
        <h1>Create your student account</h1>
        <p className="auth-description">
          Sign up to report repairs and keep track of their progress.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              minLength="3"
              required
            />
          </label>
          <div className="auth-form-row">
            <label>
              First name
              <input
                autoComplete="given-name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Last name
              <input
                autoComplete="family-name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <label>
            Student email
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete="new-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              required
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/studentlogin">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default StudentSignUp;
