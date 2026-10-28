import { Link } from 'react-router-dom';
import '../css/UserLogin.css';
import '../css/AuthRoleSelection.css';

const roles = [
  {
    name: 'Student',
    description: 'Report a repair and track its progress.',
    loginPath: '/studentlogin',
    signupPath: '/studentregister',
  },
  {
    name: 'Maintenance staff',
    description: 'View assigned repairs and update their status.',
    loginPath: '/staff/login',
    signupPath: '/staff/register',
  },
  {
    name: 'Administrator',
    description: 'Manage user accounts, reports, and staff assignments.',
    loginPath: '/admin/login',
    signupPath: '/admin/register',
  },
];

function AuthRoleSelectionPage({ mode }) {
  const isLogin = mode === 'login';
  const action = isLogin ? 'log in' : 'sign up';

  return (
    <main className="auth-page">
      <Link to="/" className="auth-brand" aria-label="FixIt home">
        <span className="auth-brand-mark">F</span>
        <span>Fix<span>It</span></span>
      </Link>
      <section className="auth-card auth-role-card">
        <p className="auth-kicker">WELCOME TO FIXIT</p>
        <h1>Who would you like to {action} as?</h1>
        <p className="auth-description">Choose your account type to continue.</p>
        <div className="auth-role-options">
          {roles.map((role) => (
            <Link
              className="auth-role-option"
              key={role.name}
              to={isLogin ? role.loginPath : role.signupPath}
            >
              <span>
                <strong>{role.name}</strong>
                <small>{role.description}</small>
              </span>
              <span className="auth-role-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <p className="auth-switch">
          <Link to="/">Back to home</Link>
        </p>
      </section>
    </main>
  );
}

export default AuthRoleSelectionPage;
