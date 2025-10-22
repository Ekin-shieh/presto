import React, { useEffect, useState } from "react";

interface InfoModalProps {
  visible: boolean;
  name: string;
  description: string;
  thumbnail: string | null;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onThumbChange: (v: string | null) => void;
  onSave: () => void;
  onClose: () => void;
  setError?: (msg: string) => void; // 可选：保持与原逻辑一致
}

const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  name,
  description,
  thumbnail,
  onNameChange,
  onDescChange,
  onThumbChange,
  onSave,
  onClose,
  setError,
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (visible) {
      setAnimate(false);
      requestAnimationFrame(() => setAnimate(true));
    }
  }, [visible]);

  if (!visible) return null;

  async function compressImage(
    file: File,
    targetWidth: number,
    targetHeight: number,
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not found");

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, 160, 90);
      onThumbChange(compressedBase64);
    } catch (err) {
      console.error("压缩缩略图失败:", err);
      setError?.("压缩缩略图失败");
    }
  };

  return (
    <div className="overlay modal-overlay visible" onClick={onClose}>
      <div className={`addform ${animate ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
        <div className="presentationTitle">编辑文件信息</div>

        <label>修改名称：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="输入幻灯片名称"
        />

        <label>修改描述：</label>
        <textarea
          value={description}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="输入描述"
          rows={3}
        />

        <label>修改封面:</label>
        <input type="file" accept="image/*" onChange={handleThumbnailChange} />

        {thumbnail && (
          <div className="thumbPreview">
            <img src={thumbnail} alt="封面预览" />
          </div>
        )}

        <div className="buttons">
          <button onClick={onSave}>保存</button>
          <button className="cancelBtn" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;