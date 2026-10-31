import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import '../css/StudentDashboard.css';

const emptyRequest = { service: '', description: '', location: '', priority: 'medium' };

function StudentDashboardPage({ setIsAuthenticated }) {
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState(emptyRequest);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const photoInput = useRef(null);
  const username = localStorage.getItem('username') || 'student';
  const token = localStorage.getItem('access_token');

  const logOut = useCallback(async () => {
    let logoutMessage;
    try {
      if (token) {
        await apiRequest('/users/logout/', { method: 'POST', token });
      }
    } catch (logoutError) {
      if (logoutError.status !== 401) {
        logoutMessage = 'You have been logged out on this device. The server could not invalidate your session token.';
      }
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('id');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      setIsAuthenticated(false);
      navigate('/studentlogin', {
        replace: true,
        state: logoutMessage ? { message: logoutMessage } : null,
      });
    }
  }, [navigate, setIsAuthenticated, token]);

  const loadDashboard = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const [serviceData, requestData] = await Promise.all([
        apiRequest('/services/'),
        apiRequest('/repair-requests/', { token }),
      ]);
      setServices(serviceData.results || serviceData);
      setRequests(requestData.results || requestData);
    } catch (requestError) {
      if (requestError.status === 401) {
        await logOut();
        return;
      }
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [logOut, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const requestData = new FormData();
      Object.entries({ ...formData, service: String(formData.service) }).forEach(([key, value]) => {
        requestData.append(key, value);
      });
      if (photo) {
        requestData.append('photo', photo);
      }
      await apiRequest('/repair-requests/', {
        method: 'POST',
        token,
        body: requestData,
      });
      setFormData(emptyRequest);
      setPhoto(null);
      if (photoInput.current) {
        photoInput.current.value = '';
      }
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="auth-brand" to="/" aria-label="FixIt home">
          <span className="auth-brand-mark">F</span>
          <span>Fix<span>It</span></span>
        </Link>
        <div className="dashboard-user">
          <span>Hi, {username}</span>
          <button type="button" onClick={logOut}>Log out</button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-heading">
          <p className="auth-kicker">YOUR STUDENT REPAIR DESK</p>
          <h1>What needs fixing?</h1>
          <p>Send a repair request and come back here to check its progress.</p>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-panel" aria-labelledby="request-heading">
            <h2 id="request-heading">Post a repair request</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Repair type
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a repair type</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </label>
              {services.length === 0 && !isLoading && (
                <p className="dashboard-hint">
                  No repair types are set up yet. Ask an administrator to add services.
                </p>
              )}
              <label>
                Where is the repair needed?
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Building, room, or campus address"
                  required
                />
              </label>
              <label>
                Describe the issue
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is broken, and when did it start?"
                  rows="4"
                  required
                />
              </label>
              <label>
                Add a photo (optional, up to 5 MB)
                <input
                  ref={photoInput}
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={(event) => {
                    const selectedPhoto = event.target.files?.[0] || null;
                    if (selectedPhoto && selectedPhoto.size > 5 * 1024 * 1024) {
                      setError('The photo must be 5 MB or smaller.');
                      event.target.value = '';
                      setPhoto(null);
                      return;
                    }
                    setError('');
                    setPhoto(selectedPhoto);
                  }}
                />
              </label>
              <label>
                How urgent is it?
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting || services.length === 0}
              >
                {isSubmitting ? 'Sending request…' : 'Send repair request'}
              </button>
            </form>
          </section>

          <section className="dashboard-panel" aria-labelledby="requests-heading">
            <div className="dashboard-list-heading">
              <h2 id="requests-heading">Your repair requests</h2>
              <button type="button" onClick={loadDashboard} disabled={isLoading}>
                Refresh
              </button>
            </div>
            {isLoading ? (
              <p className="dashboard-empty">Loading your repair desk…</p>
            ) : requests.length === 0 ? (
              <p className="dashboard-empty">
                No requests yet. Once you send one, you can follow its status here.
              </p>
            ) : (
              <ul className="request-list">
                {requests.map((request) => (
                  <li className="request-item" key={request.id}>
                    <div className="request-item-top">
                      <strong>{request.service_name || 'Repair request'}</strong>
                      <span className={`request-status status-${request.status}`}>
                        {request.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p>{request.description}</p>
                    <span className="request-location">{request.location}</span>
                    {request.photo && (
                      <a className="request-photo-link" href={request.photo} target="_blank" rel="noreferrer">
                        View attached photo
                      </a>
                    )}
                    {request.progress_updates?.length > 0 && (
                      <ul className="request-progress-list" aria-label="Repair progress">
                        {request.progress_updates.map((update) => (
                          <li key={update.id}>
                            <span>{update.note}</span>
                            <time dateTime={update.created_at}>{new Date(update.created_at).toLocaleString()}</time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default StudentDashboardPage;
