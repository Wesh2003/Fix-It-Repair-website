import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, apiRequestAll } from '../api';
import '../css/OperationsDashboard.css';

function MaintananceStaffDashboardPage({ setIsAuthenticated, setUserRole }) {
  const [requests, setRequests] = useState([]);
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

  const activeCount = requests.filter((request) => request.status === 'in_progress').length;
  const completedCount = requests.length - activeCount;

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
          <article><span>Assigned jobs</span><strong>{requests.length}</strong></article>
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
