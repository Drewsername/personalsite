// Thin fetch wrapper for the moveout + auth endpoints. Every server error
// response carries `{ error }`, so failures arrive as an Error with a message
// already fit to show the user.

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response (a proxy error page, say) — fall through to the status.
  }
  if (!res.ok) {
    const err = new Error(payload?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

const post = (url, body) => request(url, { method: 'POST', body: JSON.stringify(body ?? {}) });

export const api = {
  me: () => request('/api/auth/me'),
  login: (username, password) => post('/api/auth/login', { username, password }),
  logout: () => post('/api/auth/logout'),
  changePassword: (current, next) => post('/api/auth/password', { current, next }),

  items: () => request('/api/moveout/items'),
  submit: (body) => post('/api/moveout/submit', body),

  adminItems: () => request('/api/moveout/items'),
  createItem: (item) => post('/api/moveout/admin/items', item),
  updateItem: (id, item) =>
    request(`/api/moveout/admin/items/${id}`, { method: 'PATCH', body: JSON.stringify(item) }),
  deleteItem: (id) => request(`/api/moveout/admin/items/${id}`, { method: 'DELETE' }),
  moveItem: (id, direction) => post(`/api/moveout/admin/items/${id}/move`, { direction }),
  uploadPhoto: (dataUrl) => post('/api/moveout/admin/photos', { dataUrl }),
  submissions: () => request('/api/moveout/admin/submissions'),
};
