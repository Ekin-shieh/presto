import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/style.css';
import styles from '../styles/Dashboard.module.css';

interface Slide {
  id: number;
  content: any[];
  background: { type: string; value: string };
}

interface Presentation {
  id: number;
  name: string;
  description?: string;
  slides: Slide[];
  thumbnail: string;
}

interface DashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const [error, setError] = useState<string>('');
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newPresentationName, setNewPresentationName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5005/store', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch presentations");
      const data = await response.json();
      setPresentations(data.store.presentations || []);
    } catch (error) {
      console.error(error);
      setError("加载幻灯片失败，请再次尝试");
    }
  };

  const updateData = async (updatedPresentations: Presentation[]) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5005/store', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ store: { presentations: updatedPresentations } }),
      });
    } catch (error) {
      console.error(error);
      setError("保存幻灯片失败，请注意填写信息");
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5005/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to log out');
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/');
    } catch (_) {
      setError('登出失败，请再次尝试');
    }
  };

  const handleCreatePresentation = () => {
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (newPresentationName.trim()) {
      const newPresentation: Presentation = {
        id: Date.now(),
        name: newPresentationName,
        description: 'Default description',
        slides: [{ id: 1, content: [], background: { type: 'color', value: '#FFFFFF' } }],
        thumbnail: '',
      };
      const updatedPresentations = [...presentations, newPresentation];
      setPresentations(updatedPresentations);
      updateData(updatedPresentations);
      setShowModal(false);
      setNewPresentationName('');
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/presentation/${id}`);
  };

  return (
    <div className={`container ${styles.container}`}>
      <div className={styles.headerback}>
          <h2>Welcome to the dashboard!</h2>
          <Link to="#" onClick={handleLogout} className="link">退出登录</Link>
          <button onClick={handleCreatePresentation}>新建幻灯片</button>
      </div>
      <div className={styles.presentationsGrid}>
          {presentations.map((presentation) => (
          <div
              key={presentation.id}
              className={styles.presentationCard}
              onClick={() => handleCardClick(presentation.id)}
              style={{
              backgroundImage: presentation.thumbnail ? `url(${presentation.thumbnail})` : 'none',
              }}
          >
            <div className={styles.presentationInfo}>
              <p>{presentation.name} Slides: {presentation.slides.length}</p>
              {presentation.description && <p>{presentation.description}</p>}
            </div>
          </div>
          ))}
      </div>
      {showModal && (
        <div className='overlay' onClick={() => setShowModal(false)}>
          <div className={styles.addform}>
            <div>新建幻灯片文件</div>
            <input
                type="text"
                value={newPresentationName}
                onChange={(e) => setNewPresentationName(e.target.value)}
                placeholder="输入幻灯片名称"
            />
            <button onClick={handleModalSubmit}>确认</button>
            <button onClick={() => setShowModal(false)}>取消</button>
          </div>
        </div>
      )}
      {error && (
        <div className='overlay' onClick={() => setError('')}>
          <div className='error-message'>{error}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;