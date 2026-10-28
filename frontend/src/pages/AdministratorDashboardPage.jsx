import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, apiRequestAll } from '../api';
import '../css/OperationsDashboard.css';

function AdministratorDashboardPage({ setIsAuthenticated, setUserRole }) {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [reportFilters, setReportFilters] = useState({
    search: '',
    status: '',
    priority: '',
    service: '',
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [userEditData, setUserEditData] = useState({});
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
      const [requestData, userData, serviceData] = await Promise.all([
        apiRequestAll('/repair-requests/', { token }),
        apiRequestAll('/users/', { token }),
        apiRequestAll('/services/'),
      ]);
      setRequests(requestData);
      setUsers(userData);
      setServices(serviceData);
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

  const editUser = (user) => {
    setEditingUserId(user.id);
    setUserEditData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  };

  const saveUser = async (event, user) => {
    event.preventDefault();
    setError('');
    setUpdatingId(`user-${user.id}`);
    try {
      await apiRequest(`/users/${user.id}/`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(userEditData),
      });
      setEditingUserId(null);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const reportedCount = requests.filter((request) => request.status === 'requested').length;
  const assignedCount = requests.filter((request) => request.status === 'assigned').length;
  const inProgressCount = requests.filter((request) => request.status === 'in_progress').length;
  const completedCount = requests.filter((request) => request.status === 'completed').length;
  const currentUserId = Number(localStorage.getItem('id'));
  const searchTerm = reportFilters.search.trim().toLowerCase();
  const visibleRequests = requests.filter((request) => {
    const matchesSearch = !searchTerm || [
      request.description,
      request.location,
      request.service_name,
      request.customer_name,
    ].some((value) => value?.toLowerCase().includes(searchTerm));
    return matchesSearch
      && (!reportFilters.status || request.status === reportFilters.status)
      && (!reportFilters.priority || request.priority === reportFilters.priority)
      && (!reportFilters.service || String(request.service) === reportFilters.service);
  });
  const updateReportFilter = (event) => {
    const { name, value } = event.target;
    setReportFilters((previous) => ({ ...previous, [name]: value }));
  };

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
          <article><span>Reported</span><strong>{reportedCount}</strong></article>
          <article><span>Assigned</span><strong>{assignedCount}</strong></article>
          <article><span>Ongoing</span><strong>{inProgressCount}</strong></article>
          <article><span>Resolved</span><strong>{completedCount}</strong></article>
          <article><span>Active staff</span><strong>{staff.length}</strong></article>
        </div>
        <section className="dashboard-panel operations-panel">
          <div className="dashboard-list-heading">
            <h2>Repair reports</h2>
            <button type="button" onClick={loadDashboard} disabled={isLoading}>Refresh</button>
          </div>
          <div className="report-filters" aria-label="Filter repair reports">
            <label>
              Search reports
              <input
                type="search"
                name="search"
                value={reportFilters.search}
                onChange={updateReportFilter}
                placeholder="Description, location, category, or student"
              />
            </label>
            <label>
              Status
              <select name="status" value={reportFilters.status} onChange={updateReportFilter}>
                <option value="">All statuses</option>
                <option value="requested">Reported</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">Ongoing</option>
                <option value="completed">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              Priority
              <select name="priority" value={reportFilters.priority} onChange={updateReportFilter}>
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              Issue category
              <select name="service" value={reportFilters.service} onChange={updateReportFilter}>
                <option value="">All categories</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
            <button
              className="report-filter-reset"
              type="button"
              onClick={() => setReportFilters({ search: '', status: '', priority: '', service: '' })}
            >
              Clear filters
            </button>
            <span className="report-filter-count">Showing {visibleRequests.length} of {requests.length} reports</span>
          </div>
          {isLoading ? (
            <p className="dashboard-empty">Loading maintenance activity…</p>
          ) : visibleRequests.length === 0 ? (
            <p className="dashboard-empty">
              {requests.length === 0 ? 'No repair reports have been submitted yet.' : 'No reports match the selected filters.'}
            </p>
          ) : (
            <ul className="operations-list">
              {visibleRequests.map((request) => {
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
                    <Fragment key={user.id}>
                    <tr>
                      <td>{user.first_name || user.username} {user.last_name}</td>
                      <td>{user.email || '—'}</td>
                      <td>{user.role}</td>
                      <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          className="operations-user-action"
                          type="button"
                          onClick={() => editUser(user)}
                          disabled={updatingId === `user-${user.id}`}
                        >
                          Edit
                        </button>
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
                    {editingUserId === user.id && (
                      <tr>
                        <td colSpan="5">
                          <form className="operations-user-edit" onSubmit={(event) => saveUser(event, user)}>
                            <label>First name
                              <input
                                value={userEditData.first_name}
                                onChange={(event) => setUserEditData((previous) => ({
                                  ...previous,
                                  first_name: event.target.value,
                                }))}
                                required
                              />
                            </label>
                            <label>Last name
                              <input
                                value={userEditData.last_name}
                                onChange={(event) => setUserEditData((previous) => ({
                                  ...previous,
                                  last_name: event.target.value,
                                }))}
                                required
                              />
                            </label>
                            <label>Email
                              <input
                                type="email"
                                value={userEditData.email}
                                onChange={(event) => setUserEditData((previous) => ({
                                  ...previous,
                                  email: event.target.value,
                                }))}
                              />
                            </label>
                            <label>Phone
                              <input
                                value={userEditData.phone}
                                onChange={(event) => setUserEditData((previous) => ({
                                  ...previous,
                                  phone: event.target.value,
                                }))}
                              />
                            </label>
                            <div>
                              <button className="operations-user-action" type="submit" disabled={updatingId === `user-${user.id}`}>
                                {updatingId === `user-${user.id}` ? 'Saving…' : 'Save changes'}
                              </button>
                              <button className="operations-user-action" type="button" onClick={() => setEditingUserId(null)}>
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
