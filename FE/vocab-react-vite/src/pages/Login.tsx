import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      navigate('/home');
    }
  }, [navigate]);

  const handleLogin = () => {
    // Force Google account selection every time
    window.location.href = 'http://localhost:3000/api/auth/google?prompt=select_account&client=react';
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginPage;