import React, { useEffect, useState } from "react";

interface AddPresentationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, thumbnail: string) => void;
}

const AddPresentationModal: React.FC<AddPresentationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [animate, setAnimate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");

  useEffect(() => {
    if (visible) {
      setAnimate(false);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
      setName("");
      setDescription("");
      setThumbnailPreviewUrl("");
    }
  }, [visible]);

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

  const handleSubmit = () => {
    if (!name.trim()) return alert("幻灯片名称不得为空");
    onSubmit(name, description.trim(), thumbnailPreviewUrl);
  };

  if (!visible) return null;

  return (
    <dialog
      className="overlay modal-overlay visible"
      onClick={onClose}
    >
      <div
        className={`addform ${animate ? "show" : "hide"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="presentationTitle">新建幻灯片文件</div>
        <label>输入名称：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入幻灯片名称"
        />
        <label>输入描述：</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入描述"
          rows={4}
        />
        <label>选择封面:</label>
        <input type="file" accept="image/*" onChange={handleThumbnailChange} />
        {thumbnailPreviewUrl && (
          <div className="thumbPreview">
            <img src={thumbnailPreviewUrl} alt="封面预览" />
          </div>
        )}
        <div className="buttons">
          <button onClick={handleSubmit}>确认</button>
          <button className="cancelBtn" onClick={onClose}>取消</button>
        </div>
      </div>
    </dialog>
  );
};

export default AddPresentationModal;