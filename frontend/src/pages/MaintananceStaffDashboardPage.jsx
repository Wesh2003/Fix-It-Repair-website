import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, apiRequestAll } from '../api';
import '../css/OperationsDashboard.css';

function MaintananceStaffDashboardPage({ setIsAuthenticated, setUserRole }) {
  const [requests, setRequests] = useState([]);
  const [progressNotes, setProgressNotes] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username') || 'staff member';

  const logOut = useCallback(async () => {
    try {
      if (token) {
        await apiRequest('/users/logout/', { method: 'POST', token });
      }
    } catch (logoutError) {
      if (logoutError.status !== 401) {
        setError('The server could not invalidate your session token.');
      }
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('id');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      setIsAuthenticated(false);
      setUserRole(null);
      navigate('/staff/login', { replace: true });
    }
  }, [navigate, setIsAuthenticated, setUserRole, token]);

  const loadRequests = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      setRequests(await apiRequestAll('/repair-requests/', { token }));
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
    loadRequests();
  }, [loadRequests]);

  const updateRequest = async (request, action) => {
    setError('');
    setUpdatingId(request.id);
    try {
      await apiRequest(`/repair-requests/${request.id}/${action}/`, {
        method: 'POST',
        token,
        body: JSON.stringify({}),
      });
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const addProgressNote = async (event, request) => {
    event.preventDefault();
    const note = (progressNotes[request.id] || '').trim();
    if (!note) {
      setError('Enter a progress update before submitting.');
      return;
    }
    setError('');
    setUpdatingId(request.id);
    try {
      await apiRequest(`/repair-requests/${request.id}/progress/`, {
        method: 'POST',
        token,
        body: JSON.stringify({ note }),
      });
      setProgressNotes((previous) => ({ ...previous, [request.id]: '' }));
      await loadRequests();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = requests.filter((request) => request.status === 'in_progress').length;
  const completedCount = requests.filter((request) => request.status === 'completed').length;

  return (
    <main className="dashboard-page operations-page">
      <header className="dashboard-header">
        <Link className="auth-brand" to="/" aria-label="FixIt home">
          <span className="auth-brand-mark">F</span><span>Fix<span>It</span></span>
        </Link>
        <div className="dashboard-user">
          <span>Hi, {username}</span>
          <button type="button" onClick={logOut}>Log out</button>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-heading">
          <p className="auth-kicker">MAINTENANCE STAFF WORKSPACE</p>
          <h1>Your assigned repairs</h1>
          <p>Update each job as work begins and mark it complete when resolved.</p>
        </div>
        <div className="operations-stats">
          <article><span>Assigned jobs</span><strong>{requests.filter((request) => request.status === 'assigned').length}</strong></article>
          <article><span>In progress</span><strong>{activeCount}</strong></article>
          <article><span>Resolved</span><strong>{completedCount}</strong></article>
        </div>
        <section className="dashboard-panel operations-panel">
          <div className="dashboard-list-heading">
            <h2>Repair assignments</h2>
            <button type="button" onClick={loadRequests} disabled={isLoading}>Refresh</button>
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {isLoading ? (
            <p className="dashboard-empty">Loading your assignments…</p>
          ) : requests.length === 0 ? (
            <p className="dashboard-empty">There are no repair requests assigned to you yet.</p>
          ) : (
            <ul className="operations-list">
              {requests.map((request) => (
                <li className="operations-item" key={request.id}>
                  <div className="operations-item-heading">
                    <div>
                      <p className="operations-label">REQUEST #{request.id} · {request.service_name || 'Repair'}</p>
                      <h3>{request.description}</h3>
                    </div>
                    <span className={`request-status status-${request.status}`}>
                      {request.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="operations-meta">{request.location} · Priority: {request.priority}</p>
                  <p className="operations-meta">Reported by {request.customer_name || 'FixIt customer'}</p>
                  {request.photo && (
                    <a className="operations-photo-link" href={request.photo} target="_blank" rel="noreferrer">
                      View attached photo
                    </a>
                  )}
                  {request.progress_updates?.length > 0 && (
                    <ul className="operations-progress-list" aria-label="Progress history">
                      {request.progress_updates.map((update) => (
                        <li key={update.id}>
                          <span>{update.note}</span>
                          <small>{update.author_name || 'Staff'} · {new Date(update.created_at).toLocaleString()}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                  {request.status === 'in_progress' && (
                    <form className="operations-progress-form" onSubmit={(event) => addProgressNote(event, request)}>
                      <label htmlFor={`progress-${request.id}`}>Add progress update</label>
                      <textarea
                        id={`progress-${request.id}`}
                        value={progressNotes[request.id] || ''}
                        onChange={(event) => setProgressNotes((previous) => ({
                          ...previous,
                          [request.id]: event.target.value,
                        }))}
                        maxLength="2000"
                        rows="3"
                        required
                      />
                      <button className="auth-submit" type="submit" disabled={updatingId === request.id}>
                        {updatingId === request.id ? 'Saving…' : 'Add update'}
                      </button>
                    </form>
                  )}
                  <div className="operations-actions">
                    {request.status === 'assigned' && (
                      <button
                        className="auth-submit"
                        type="button"
                        onClick={() => updateRequest(request, 'start')}
                        disabled={updatingId === request.id}
                      >
                        Start work
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        className="auth-submit"
                        type="button"
                        onClick={() => updateRequest(request, 'complete')}
                        disabled={updatingId === request.id}
                      >
                        Mark resolved
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

export default MaintananceStaffDashboardPage;
