import { useNavigate } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { useGoogleLogin } from '@react-oauth/google';
import './Login.css';

type LoginResponse = {
  message: string;
  user: {
    username: string;
    id: string;
  };
};

export const Login = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const googleLoginUrl = import.meta.env.VITE_GOOGLE_LOGIN_URL;
  const navigate = useNavigate();
  const redirectTo = new URLSearchParams(location.search).get("redirectTo") || "/";
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed!');
      }

      const data: LoginResponse = await response.json();

      if (data.message === 'Login successful') {
        setIsLoading(false);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('user_id', data.user.id);
        toast.success('Login successful!');
        navigate('/');
      } else {setIsLoading(false);
        toast.error(data.message || 'Login failed!');
      }
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || "User doesn't exist.");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await axios.post(googleLoginUrl, {
          access_token: tokenResponse.access_token,
        });

        const data = res.data;
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("token", data.token);
        toast.success("Google Login successful!");
        navigate(redirectTo);
      } catch (error) {
        toast.error("Google login failed.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Google Login was cancelled or failed.");
    },
    flow: "implicit",
  });

  return (
    <div className="login-container">
      {isLoading && (
        <div className="full-page-loader">
          <div className="spinner"></div>
        </div>
      )}
      <div className="login_container">
        <div className="login-auth-box">
          <div className="signup-info">
            <p style={{ fontSize: '40px' }}>Hello, Welcome!</p>
            <p style={{ fontSize: '15px' }}>Don't have an account?</p>
            <button onClick={() => navigate('/register')} className="login-btn">Register</button>
          </div>

          <div className="login-section">
            <div className="heading">
              <p>Login</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span><FontAwesomeIcon icon={faEnvelope} /></span>
              </div>

              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span><FontAwesomeIcon icon={faLock} /></span>
              </div>

              <span className="password-checkbox">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                />
                <label style={{ paddingLeft: '2px' }}>Show password</label>
              </span>

              <div className="login-btn">
                <button type="submit">Login</button>
              </div>
              <p className="social-text">or register with social platforms</p>
            </form>

            <div className="social-icons">
              <button className="google-btn" onClick={() => googleLogin()}>
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
