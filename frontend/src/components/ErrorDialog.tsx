import React, { useEffect, useState } from 'react';

interface ErrorDialogProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({ message, visible, onClose }) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div className="overlay error-overlay visible" onClick={onClose}>
      <dialog className={`error-message ${animateIn ? 'show' : 'hide'}`}>
        {message}
      </dialog>
    </div>
  );
};

export default ErrorDialog;