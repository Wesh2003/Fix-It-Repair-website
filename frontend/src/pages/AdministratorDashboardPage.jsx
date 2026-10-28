import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, apiRequestAll } from '../api';
import '../css/OperationsDashboard.css';

function AdministratorDashboardPage({ setIsAuthenticated, setUserRole }) {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username') || 'administrator';
  const staff = users.filter((user) => user.role === 'staff' && user.is_active);

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
      navigate('/admin/login', { replace: true });
    }
  }, [navigate, setIsAuthenticated, setUserRole, token]);

  const loadDashboard = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const [requestData, userData] = await Promise.all([
        apiRequestAll('/repair-requests/', { token }),
        apiRequestAll('/users/', { token }),
      ]);
      setRequests(requestData);
      setUsers(userData);
      setAssignments(Object.fromEntries(
        requestData.map((request) => [request.id, request.assigned_staff || '']),
      ));
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

  const assignRequest = async (event, request) => {
    event.preventDefault();
    const staffId = assignments[request.id];
    if (!staffId) {
      setError(`Choose a staff member for request #${request.id}.`);
      return;
    }
    setError('');
    setUpdatingId(request.id);
    try {
      await apiRequest(`/repair-requests/${request.id}/assign/`, {
        method: 'POST',
        token,
        body: JSON.stringify({ staff_id: Number(staffId) }),
      });
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleUser = async (user) => {
    setError('');
    setUpdatingId(`user-${user.id}`);
    try {
      await apiRequest(`/users/${user.id}/`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openCount = requests.filter((request) => !['completed', 'cancelled'].includes(request.status)).length;
  const inProgressCount = requests.filter((request) => request.status === 'in_progress').length;
  const completedCount = requests.filter((request) => request.status === 'completed').length;
  const currentUserId = Number(localStorage.getItem('id'));

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
          <p className="auth-kicker">FIXIT ADMINISTRATION</p>
          <h1>Maintenance overview</h1>
          <p>Assign repair reports, monitor progress, and manage FixIt accounts.</p>
        </div>
        {error && <p className="auth-error operations-error" role="alert">{error}</p>}
        <div className="operations-stats">
          <article><span>Total reports</span><strong>{requests.length}</strong></article>
          <article><span>Open reports</span><strong>{openCount}</strong></article>
          <article><span>In progress</span><strong>{inProgressCount}</strong></article>
          <article><span>Resolved</span><strong>{completedCount}</strong></article>
          <article><span>Active staff</span><strong>{staff.length}</strong></article>
        </div>
        <section className="dashboard-panel operations-panel">
          <div className="dashboard-list-heading">
            <h2>Repair reports</h2>
            <button type="button" onClick={loadDashboard} disabled={isLoading}>Refresh</button>
          </div>
          {isLoading ? (
            <p className="dashboard-empty">Loading maintenance activity…</p>
          ) : requests.length === 0 ? (
            <p className="dashboard-empty">No repair reports have been submitted yet.</p>
          ) : (
            <ul className="operations-list">
              {requests.map((request) => {
                const isFinal = ['completed', 'cancelled'].includes(request.status);
                return (
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
                  <form className="operations-assign-form" onSubmit={(event) => assignRequest(event, request)}>
                    <label htmlFor={`assign-${request.id}`}>Assigned staff</label>
                    <select
                      id={`assign-${request.id}`}
                      value={assignments[request.id] || ''}
                      onChange={(event) => setAssignments((previous) => ({
                        ...previous,
                        [request.id]: event.target.value,
                      }))}
                      disabled={staff.length === 0 || isFinal}
                    >
                      <option value="">Choose staff member</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name || member.username} {member.last_name}
                        </option>
                      ))}
                    </select>
                    <button className="auth-submit" type="submit" disabled={updatingId === request.id || staff.length === 0 || isFinal}>
                      {updatingId === request.id ? 'Saving…' : isFinal ? 'Report closed' : 'Save assignment'}
                    </button>
                  </form>
                  {!isFinal && staff.length === 0 && <p className="dashboard-hint">Create or activate a staff account before assigning reports.</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="dashboard-panel operations-panel">
          <div className="dashboard-list-heading">
            <h2>Manage user accounts</h2>
            <span className="operations-count">{users.length} accounts</span>
          </div>
          {isLoading ? (
            <p className="dashboard-empty">Loading user accounts…</p>
          ) : users.length === 0 ? (
            <p className="dashboard-empty">No user accounts found.</p>
          ) : (
            <div className="operations-table-wrap">
              <table className="operations-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.first_name || user.username} {user.last_name}</td>
                      <td>{user.email || '—'}</td>
                      <td>{user.role}</td>
                      <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          className="operations-user-action"
                          type="button"
                          onClick={() => toggleUser(user)}
                          disabled={user.id === currentUserId || updatingId === `user-${user.id}`}
                        >
                          {updatingId === `user-${user.id}` ? 'Saving…' : user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdministratorDashboardPage;
