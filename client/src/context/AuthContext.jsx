import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readStoredUser() : null));

  const saveSession = useCallback((token, nextUser) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    // Refresh the stored user in case the account was changed by an admin
    if (localStorage.getItem('token')) {
      api('/auth/me')
        .then(({ user: fresh }) => saveSession(null, fresh))
        .catch(() => {});
    }
  }, [logout, saveSession]);

  const login = async (email, password) => {
    const { token, user: loggedIn } = await api('/auth/login', { method: 'POST', body: { email, password } });
    saveSession(token, loggedIn);
    return loggedIn;
  };

  const register = async (values) => {
    const { token, user: created } = await api('/auth/register', { method: 'POST', body: values });
    saveSession(token, created);
    return created;
  };

  const updateUser = (nextUser) => saveSession(null, nextUser);

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
