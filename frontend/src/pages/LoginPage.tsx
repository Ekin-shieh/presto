import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css';
import LoginSidePanel from '../components/LoginSidePanel';
import { useAuthForm } from '../hooks/useAuthForm';
import { login, register } from '../api/auth';
import ErrorDialog from '../components/ErrorDialog';

interface LoginPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  const [formData, loginChange, resetLoginForm] = useAuthForm({
    email: '',
    password: '',
  });

  const [newData, registerChange, resetRegisterForm] = useAuthForm({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // 切换时清空表单与错误
  const switchToRegister = () => {
    setShowLogin(false);
    resetLoginForm();
    setError('');
  };

  const switchToLogin = () => {
    setShowLogin(true);
    resetRegisterForm();
    setError('');
  };

  // 登录
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(formData);
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      resetLoginForm();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('该账号未注册或密码错误');
    }
  };

  // 注册
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newData.password !== newData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
    if (!passwordRegex.test(newData.password)) {
      setError('密码需至少6位，并包含字母、数字和符号');
      return;
    }
    try {
      const { email, password, name } = newData;
      const data = await register({ email, password, name });
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      resetRegisterForm();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('出错了，请再试一次');
    }
  };

  // 错误框动画控制
  useEffect(() => {
    if (error) {
      setShowError(true);
    } else {
      const t = setTimeout(() => setShowError(false), 50);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className={`container ${styles.container}`}>
      <LoginSidePanel />
      <div className='loginsheet'>
        {showLogin ? (
          <form onSubmit={handleSubmit} className={styles.loginform}>
            <div className={styles.headline}>登 录</div>
            <div className='link' tabIndex={0} onClick={switchToRegister}>
              没有账号？现在注册
            </div>
            <input
              type="email"
              name="email"
              placeholder="输入你的邮箱"
              value={formData.email}
              onChange={loginChange}
              autoComplete="email"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="输入你的密码"
              value={formData.password}
              onChange={loginChange}
              autoComplete="current-password"
              required
            />
            <button type="submit">确 认</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.loginform}>
            <div className={styles.headline}>注 册</div>
            <div className='link' tabIndex={0} onClick={switchToLogin}>
              已有账号？返回登录
            </div>
            <input
              type="text"
              name="name"
              placeholder="输入你的昵称"
              value={newData.name}
              onChange={registerChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="输入你的邮箱"
              value={newData.email}
              onChange={registerChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="输入你的密码"
              value={newData.password}
              onChange={registerChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="再次确认密码"
              value={newData.confirmPassword}
              onChange={registerChange}
              required
            />
            <button type="submit">确 认</button>
          </form>
        )}
      <ErrorDialog
        message={error}
        visible={showError}
        onClose={() => setError('')}
      />
      </div>
    </div>
  );
};

export default LoginPage;