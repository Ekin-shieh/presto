import React, { useEffect } from "react";

interface ConfirmDialogProps {
  message: string;
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  visible,
  onConfirm,
  onClose,
}) => {
  const [animate, setAnimate] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setAnimate(false);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <dialog
      className="overlay modal-overlay visible"
      onClick={onClose}
    >
      <div
        className={`confirm ${animate ? "show" : "hide"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>{message}</div>
        <div className="buttons">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            确认
          </button>
          <button className="cancelBtn" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;