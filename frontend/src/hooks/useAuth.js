import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';

const emptyAuth = {
  name: '',
  email: '',
  password: '',
  role: 'student',
};

export function useAuth({ onMessage } = {}) {
  const [token, setToken] = useState(localStorage.getItem('lms-token') || '');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('lms-token')));
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuth);

  const loadUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return null;
    }

    try {
      const response = await apiRequest({ endpoint: '/users/me', token });
      setUser(response.user);
      return response.user;
    } catch (error) {
      onMessage?.(error.message);
      localStorage.removeItem('lms-token');
      setToken('');
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onMessage, token]);

  useEffect(() => {
    if (token && !user) loadUser();
  }, [loadUser, token, user]);

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  };

  const authenticate = async (event) => {
    event.preventDefault();

    try {
      const response = await apiRequest({
        endpoint: `/auth/${authMode}`,
        method: 'POST',
        body: {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: authForm.role,
          instructorExperience: authForm.instructorExperience,
        },
      });

      if (!response.token) {
        onMessage?.(response.message);
        setAuthMode('login');
        setAuthForm(emptyAuth);
        return;
      }

      localStorage.setItem('lms-token', response.token);
      setToken(response.token);
      setUser(response.user);
      setAuthForm(emptyAuth);
      onMessage?.(`${authMode === 'login' ? 'Logged in' : 'Registered'} successfully`);
    } catch (error) {
      onMessage?.(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('lms-token');
    setToken('');
    setUser(null);
    setAuthForm(emptyAuth);
  };

  return {
    token,
    user,
    isLoading,
    setUser,
    authMode,
    setAuthMode,
    authForm,
    handleAuthChange,
    authenticate,
    logout,
  };
}
