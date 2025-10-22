import React, { useEffect } from "react";

interface VideoModalProps {
  visible: boolean;
  url: string;
  autoPlay: boolean;
  onUrlChange: (v: string) => void;
  onAutoPlayChange: (v: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({
  visible,
  url,
  autoPlay,
  onUrlChange,
  onAutoPlayChange,
  onConfirm,
  onClose,
}) => {
  const [animate, setAnimate] = React.useState(false);
  useEffect(() => {
    if (visible) {
      setAnimate(false);
      requestAnimationFrame(() => setAnimate(true));
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="overlay modal-overlay visible" onClick={onClose}>
      <div className={`addform ${animate ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
        <div className="presentationTitle">插入视频</div>
        <label>视频 URL（YouTube 嵌入链接）</label>
        <input type="text" value={url} onChange={(e) => onUrlChange(e.target.value)} />
        <label><input type="checkbox" checked={autoPlay} onChange={(e) => onAutoPlayChange(e.target.checked)} />自动播放</label>
        <div className="buttons">
          <button onClick={onConfirm}>确认</button>
          <button className="cancelBtn" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;