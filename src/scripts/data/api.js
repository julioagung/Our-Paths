import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
};

export async function registerUser({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  // Simulate loading
  await new Promise(resolve => setTimeout(resolve, 1000));
  return data;
}

export async function loginUser({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  // Simulate loading
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (data.error === false) {
    localStorage.setItem('token', data.loginResult.token);
    localStorage.setItem('userId', data.loginResult.userId);
    localStorage.setItem('name', data.loginResult.name);
  }
  return data;
}

export async function addStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== undefined) formData.append('lat', lat);
  if (lon !== undefined) formData.append('lon', lon);

  const token = localStorage.getItem('token');
  const endpoint = token ? ENDPOINTS.STORIES : ENDPOINTS.STORIES_GUEST;
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await response.json();
  // Simulate loading
  await new Promise(resolve => setTimeout(resolve, 1500));
  return data;
}

export async function getStories({ page = 1, size = 10, location = 0 } = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${ENDPOINTS.STORIES}?page=${page}&size=${size}&location=${location}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  // Simulate loading
  await new Promise(resolve => setTimeout(resolve, 800));
  return data;
}

export async function getStoryDetail(id) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return await response.json();
}
