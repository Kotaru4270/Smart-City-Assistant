import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      toast.error('Google login failed');
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('sc_token', token);
      authAPI.me()
        .then((res) => {
          updateUser(res.data.user);
          toast.success('Welcome! 🎉');
          navigate('/dashboard');
        })
        .catch(() => {
          toast.error('Authentication failed');
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, []); // eslint-disable-line

  return (
    <div className="full-loader">
      <div>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Signing you in…</p>
      </div>
    </div>
  );
}
