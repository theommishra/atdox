const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('authToken');
    throw new Error('Authentication expired. Please sign in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  return response.json();
};

export const api = {
  // User endpoints
  getUserPermissions: () => makeAuthenticatedRequest('/api/user/permissions'),
  getMe: () => makeAuthenticatedRequest('/api/me'),
  
  // Project endpoints
  getAllProjects: () => makeAuthenticatedRequest('/api/allprojects'),
  getProject: (id: string) => makeAuthenticatedRequest(`/api/getProject/${id}`),
  createProject: (data: any) => makeAuthenticatedRequest('/api/createProject', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  saveProject: (data: any) => makeAuthenticatedRequest('/api/saveproject', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteProject: (id: string) => makeAuthenticatedRequest(`/api/deleteproject?id=${id}`, {
    method: 'DELETE',
  }),
  
  // Collaborator endpoints
  getCollaborators: (projectId: string) => makeAuthenticatedRequest(`/api/projects/${projectId}/collaborators`),
  addCollaborator: (projectId: string, data: any) => makeAuthenticatedRequest(`/api/projects/${projectId}/collaborators`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCollaboratorRole: (projectId: string, data: any) => makeAuthenticatedRequest(`/api/projects/${projectId}/collaborators`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  removeCollaborator: (projectId: string, userId: string) => makeAuthenticatedRequest(`/api/projects/${projectId}/collaborators?userId=${userId}`, {
    method: 'DELETE',
  }),
  
  // AI endpoint
  hitApi: (prompt: string) => makeAuthenticatedRequest('/api/hitapi', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }),
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const logout = () => {
  localStorage.removeItem('authToken');
  window.location.href = '/signin';
};
