import React, { useEffect } from "react";

interface ExitConfirmModalProps {
  visible: boolean;
  onSaveAndExit: () => void;
  onExitWithoutSave: () => void;
  onClose: () => void;
}

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  visible,
  onSaveAndExit,
  onExitWithoutSave,
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
      <div className={`confirm ${animate ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
        <div>您有未保存的更改，是否保存后退出？</div>
        <div className="buttons">
          <button onClick={onSaveAndExit}>保存</button>
          <button onClick={onExitWithoutSave}>不保存</button>
          <button className="cancelBtn" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;