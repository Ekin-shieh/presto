import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/style.css';
import styles from '../styles/Dashboard.module.css';
import { Button } from "@mui/material";
const API_BASE = "http://localhost:5005";
import ErrorDialog from '../components/ErrorDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import AddPresentationModal from '../components/AddPresentationModal';
import PresentationCard from '../components/PresentationCard';
import { logout } from '../api/auth';

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
  const [showError, setShowError] = useState(false);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const openConfirm = (message: string, onConfirmAction: () => void) => {
    setConfirmMessage(message);
    setOnConfirm(() => onConfirmAction);
    setShowConfirm(true);
};

  const closeConfirm = () => {
      setTimeout(() => {
          setShowConfirm(false);
          setConfirmMessage('');
          setOnConfirm(null);
      }, 300);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/store`, {
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
      await fetch(`${API_BASE}/store`, {
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
      await logout();
      setIsAuthenticated(false);
      navigate('/');
    } catch (err) {
      setError('登出失败，请再次尝试');
    }
  };

  const handleCardClick = (id: number) => {
    navigate(`/presentation/${id}`);
  };

  useEffect(() => {
    if (error) {
      setShowError(true);
    } else if (showError) {
      const t = setTimeout(() => setShowError(false), 50);
      return () => clearTimeout(t);
    }
  }, [error]);

  const closeModal = () => {
    setTimeout(() => setShowModal(false), 300);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className={`container ${styles.container}`}>
      <div className={styles.headerback}>
          <h2>您已到达主页！</h2>
          <Link to="#" onClick={handleLogout} className={`link ${styles.link}`}>退出登录</Link>
          <button onClick={() => setShowModal(true)}>新建幻灯片</button>
          <div className= {`buttons ${styles.buttons}`}>
            <Button onClick={() => { if (selectMode) {setSelectedIds([]);} setSelectMode(!selectMode);}}>{selectMode ? "取消批量" : "批量删除"}</Button>
            {selectMode && selectedIds.length > 0 && (
              <Button
              onClick={() => {
                openConfirm(
                  `确定要删除选中的 ${selectedIds.length} 个幻灯片吗？`,
                  async () => {
                    const updated = presentations.filter(
                      (p) => !selectedIds.includes(p.id)
                    );
                    setPresentations(updated);
                    await updateData(updated);
                    setSelectedIds([]);
                    setSelectMode(false);
                    setError(`已删除 ${selectedIds.length} 个幻灯片`);
                  }
                );
              }}
              >
                删除选中
              </Button>
            )}
          </div>
      </div>
      <div className={styles.presentationsGrid}>
        {presentations.map((p) => (
          <PresentationCard
            key={p.id}
            id={p.id}
            name={p.name}
            description={p.description}
            slidesCount={p.slides.length}
            thumbnail={p.thumbnail}
            isSelected={selectedIds.includes(p.id)}
            selectMode={selectMode}
            onSelect={toggleSelect}
            onOpen={handleCardClick}
          />
        ))}
      </div>
      <AddPresentationModal
        visible={showModal}
        onClose={closeModal}
        onSubmit={(name, description, thumbnail) => {
          const newPresentation = {
            id: Date.now(),
            name,
            description,
            slides: [],
            thumbnail,
          };
          const updated = [...presentations, newPresentation];
          setPresentations(updated);
          updateData(updated);
          setShowModal(false);
        }}
      />
      <ErrorDialog
        message={error}
        visible={showError}
        onClose={() => setError('')}
      />
      <ConfirmDialog
        message={confirmMessage}
        visible={showConfirm}
        onConfirm={() => { if (onConfirm) onConfirm(); }}
        onClose={closeConfirm}
      />
    </div>
  );
};

export default Dashboard;