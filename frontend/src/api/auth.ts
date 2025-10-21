const API_BASE = "http://localhost:5005";

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

/**
 * 登录接口
 */
export async function login(formData: LoginData) {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || '登录失败');
  }

  return res.json();
}

/**
 * 注册接口
 */
export async function register(formData: RegisterData) {
  const res = await fetch(`${API_BASE}/admin/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || '注册失败');
  }

  return res.json();
}

/**
 * 登出接口
 */
export async function logout(): Promise<void> {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_BASE}/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to log out');
    }

    localStorage.removeItem('token');
  } catch (error) {
    console.error('登出失败:', error);
    throw error;
  }
}