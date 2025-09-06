import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css';

import show1 from '../assets/show1.jpg';
import show2 from '../assets/show2.jpg';
import show3 from '../assets/show3.jpg';
import show4 from '../assets/show4.jpg';
import show5 from '../assets/show5.jpg';
import show6 from '../assets/show6.jpg';

interface LoginPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [newData, setNewData] = useState({ email: '', password: '', confirmPassword: '', name: '' });
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [images, setImages] = useState([show1, show2, show3]);
  const [fade, setFade] = useState([false, false, false]);
  const navigate = useNavigate();

  useEffect(() => {
    const pairs = [
      [show1, show4],
      [show2, show5],
      [show3, show6],
    ];
    const timers: NodeJS.Timeout[] = [];

    pairs.forEach(([imgA, imgB], index) => {
      const delay = (index + 1) * 500; // 0.5s / 1s / 1.5s
      let toggle = false;

      const cycle = () => {
        setFade(prev => {
          const newFade = [...prev];
          newFade[index] = true;
          return newFade;
        });

        const t1 = setTimeout(() => {
          setImages(prev => {
            const newImages = [...prev];
            newImages[index] = toggle ? imgA : imgB;
            return newImages;
          });

          setFade(prev => {
            const newFade = [...prev];
            newFade[index] = false;
            return newFade;
          });

          toggle = !toggle;
          const t2 = setTimeout(cycle, 4000);
          timers.push(t2);
        }, 1000);

        timers.push(t1);
      };

      const starter = setTimeout(cycle, delay);
      timers.push(starter);
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  const loginChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const registerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5005/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('出错了，请再试一次');
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (_) {
      setError('该账号未注册或密码错误');
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newData.password !== newData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    try {
      const { email, password, name } = newData;
      const response = await fetch('http://localhost:5005/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!response.ok) throw new Error('出错了，请再试一次');
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (_) {
      setError('出错了，请再试一次');
    }
  };

  useEffect(() => {
    if (error) {
      setShowError(true);
      requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    } else {
      setAnimateIn(false);
      const t = setTimeout(() => setShowError(false), 400);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className={`container ${styles.container}`}>
      <div className='loginside'></div>
      <div className='loginsheet'>
        {showLogin ? (
          <form onSubmit={handleSubmit} className={styles.loginform}>
            <div className={styles.headline}>登 录</div>
            <div className='link' tabIndex={0} onClick={() => setShowLogin(false)}>没有账号？现在注册</div>
            <input type="email" name="email" placeholder="输入你的邮箱" defaultValue={formData.email} onBlur={loginChange} required />
            <input type="password" name="password" placeholder="输入你的密码" defaultValue={formData.password} onBlur={loginChange} required />
            <button type="submit">确 认</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.loginform}>
            <div className={styles.headline}>注 册</div>
            <div className='link' tabIndex={0} onClick={() => setShowLogin(true)}>已有账号？返回登录</div>
            <input type="text" name="name" placeholder="输入你的昵称" defaultValue={newData.name} onBlur={registerChange} required />
            <input type="email" name="email" placeholder="输入你的邮箱" defaultValue={newData.email} onBlur={registerChange} required />
            <input type="password" name="password" placeholder="输入你的密码" defaultValue={newData.password} onBlur={registerChange} required />
            <input type="password" name="confirmPassword" placeholder="再次确认密码" defaultValue={newData.confirmPassword} onBlur={registerChange} required />
            <button type="submit">确 认</button>
          </form>
        )}
      {showError && (
        <div className={`overlay error-overlay ${error ? 'visible' : ''}`} onClick={() => setError('')}>
          <div className={`error-message ${animateIn ? 'show' : 'hide'}`}>
            {error}
          </div>
        </div>
      )}
      </div>
      <img src={images[0]} alt="幻灯片1" id="show1" className={`${styles.sample} ${styles.fadeImg} ${fade[0] ? styles.fadeOut : ''}`} />
      <img src={images[1]} alt="幻灯片2" id="show2" className={`${styles.sample} ${styles.fadeImg} ${fade[1] ? styles.fadeOut : ''}`} />
      <img src={images[2]} alt="幻灯片3" id="show3" className={`${styles.sample} ${styles.fadeImg} ${fade[2] ? styles.fadeOut : ''}`} />
    </div>
  );
};

export default LoginPage;