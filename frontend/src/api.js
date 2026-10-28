const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(
      'Could not reach the FixIt API. Make sure the Django server is running on port 8000.',
      { cause: error },
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const detail = data?.detail
      || data?.error
      || Object.values(data || {}).flat().join(' ')
      || `Request failed (${response.status}).`;
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function apiRequestAll(path, { token } = {}) {
  const results = [];
  let pagePath = path;

  while (pagePath) {
    const page = await apiRequest(pagePath, { token });
    if (!Array.isArray(page?.results)) {
      throw new Error('The API returned an unexpected paginated response.');
    }
    results.push(...page.results);
    if (!page.next) {
      return results;
    }
    pagePath = `${path}${new URL(page.next, API_URL).search}`;
  }

  return results;
}
