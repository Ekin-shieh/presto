import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/style.css';
import styles from '../styles/Dashboard.module.css';
import { Button } from "@mui/material";

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
  const [animateModal, setAnimateModal] = useState(false);
  const [newPresentationName, setNewPresentationName] = useState<string>('');
  const [newPresentationDescription, setNewPresentationDescription] = useState<string>("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>("");
  const navigate = useNavigate();
  const [animateError, setAnimateError] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [animateConfirm, setAnimateConfirm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const openConfirm = (message: string, onConfirmAction: () => void) => {
    setConfirmMessage(message);
    setOnConfirm(() => onConfirmAction);
    setShowConfirm(true);
    setAnimateConfirm(false);
    requestAnimationFrame(() => setAnimateConfirm(true));
};

  const closeConfirm = () => {
      setAnimateConfirm(false);
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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setThumbnailPreviewUrl("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const targetWidth = 160;
        const targetHeight = 90;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setThumbnailPreviewUrl(base64);
      };
    };

    reader.readAsDataURL(file);
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

  const handleModalSubmit = () => {
    if (newPresentationName.trim()) {
      const newPresentation: Presentation = {
        id: Date.now(),
        name: newPresentationName,
        description: newPresentationDescription.trim(),
        slides: [],
        thumbnail: thumbnailPreviewUrl || "",
      };

      const updatedPresentations = [...presentations, newPresentation];
      setPresentations(updatedPresentations);
      updateData(updatedPresentations);

      setShowModal(false);
      setNewPresentationName("");
      setNewPresentationDescription("");
      setThumbnailPreviewUrl("");
    } else {
      setError("幻灯片名称不得为空");
    }
  };

  const cancelAdd = () => {
    closeModal();
    setNewPresentationName("");
    setNewPresentationDescription("");
    setThumbnailPreviewUrl("");
  }

  const handleCardClick = (id: number) => {
    navigate(`/presentation/${id}`);
  };

  useEffect(() => {
    if (showModal) {
      setAnimateModal(false);
      requestAnimationFrame(() => setAnimateModal(true));
    }
  }, [showModal]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      setAnimateError(false);
      requestAnimationFrame(() => setAnimateError(true));
    } else if (showError) {
      setAnimateError(false);
      const t = setTimeout(() => setShowError(false), 400);
      return () => clearTimeout(t);
    }
  }, [error]);

  const openModal = () => {
    setShowModal(true);
    setAnimateModal(false);
    requestAnimationFrame(() => setAnimateModal(true));
  };

  const closeModal = () => {
    setAnimateModal(false);
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
          <button onClick={openModal}>新建幻灯片</button>
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
          {presentations.map((presentation) => (
            <div
              key={presentation.id}
              className={styles.presentationCard}
              onClick={() => {
                if (selectMode) {
                  toggleSelect(presentation.id);
                } else {
                  handleCardClick(presentation.id);
                }
              }}
              style={{
                backgroundImage: presentation.thumbnail ? `url(${presentation.thumbnail})` : 'none',
              }}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(presentation.id)}
                  onChange={() => toggleSelect(presentation.id)}
                  className={styles.checkbox}
                />
              )}
              <div className={styles.presentationInfo}>
                <div className={styles.presentationTitle}>{presentation.name}</div>
                <div>幻灯片数量：{presentation.slides.length}</div>
                <p>{presentation.description?.trim() ? presentation.description : "无特定描述"}</p>
              </div>
            </div>
          ))}
      </div>
      {showModal && (
        <div className="overlay modal-overlay visible" onClick={closeModal}>
          <div className={`addform ${animateModal ? 'show' : 'hide'}`} onClick={(e) => e.stopPropagation()}>
            <div className='presentationTitle'>新建幻灯片文件</div>
            <label>输入名称：</label>
            <input
              type="text"
              value={newPresentationName}
              onChange={(e) => setNewPresentationName(e.target.value)}
              placeholder="输入幻灯片名称"
            />
            <label>输入描述：</label>
            <textarea
              value={newPresentationDescription}
              onChange={(e) => setNewPresentationDescription(e.target.value)}
              placeholder="输入描述"
              rows={4}
            />
            <label>选择封面:</label>
            <input type="file" accept="image/*" onChange={handleThumbnailChange} />
            {thumbnailPreviewUrl && (
              <div className='thumbPreview'>
                <img src={thumbnailPreviewUrl} alt="封面预览" />
              </div>
            )}
            <div className='buttons'>
              <button onClick={handleModalSubmit}>确认</button>
              <button className='cancelBtn' onClick={cancelAdd}>取消</button>
            </div>
          </div>
        </div>
      )}
      {showError && (
        <div className="overlay error-overlay visible" onClick={() => setError('')}>
          <div className={`error-message ${animateError ? 'show' : 'hide'}`}>
            {error}
          </div>
        </div>
      )}
      {showConfirm && (
        <div className="overlay modal-overlay visible" onClick={closeConfirm}>
            <div className={`confirm ${animateConfirm ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()} >
            <div>{confirmMessage}</div>
            <div className="buttons">
                <button onClick={() => { if (onConfirm) onConfirm(); closeConfirm();}}>确认</button>
                <button className="cancelBtn" onClick={closeConfirm}>取消</button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;