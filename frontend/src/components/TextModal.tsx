import React, { useEffect } from "react";

interface TextModalProps {
  visible: boolean;
  text: string;
  fontSize: number;
  font: string;
  color: string;
  weight: string;
  style: string;
  decoration: string;
  onChange: (fields: Partial<TextModalProps>) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const TextModal: React.FC<TextModalProps> = ({
  visible,
  text,
  fontSize,
  font,
  color,
  weight,
  style,
  decoration,
  onChange,
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
        <div className="presentationTitle">插入文本框</div>
        <label>文字内容</label>
        <textarea rows={3} value={text} onChange={(e) => onChange({ text: e.target.value })} />
        <label>字号</label>
        <input type="number" value={fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} />
        <label>字体</label>
        <select value={font} onChange={(e) => onChange({ font: e.target.value })}>
          <option value="Noto Sans SC">Noto Sans SC</option>
          <option value="Noto Serif SC">Noto Serif SC</option>
          <option value="LXGW WenKai">LXGW WenKai</option>
        </select>
        <label>颜色</label>
        <input type="color" value={color} onChange={(e) => onChange({ color: e.target.value })} />
        <label>字重</label>
        <select value={weight} onChange={(e) => onChange({ weight: e.target.value })}>
          <option value="light">Light</option>
          <option value="regular">Regular</option>
          <option value="bold">Bold</option>
        </select>
        <label><input type="checkbox" checked={style === "italic"} onChange={(e) => onChange({ style: e.target.checked ? "italic" : "normal" })} />斜体</label>
        <label><input type="checkbox" checked={decoration === "underline"} onChange={(e) => onChange({ decoration: e.target.checked ? "underline" : "none" })} />下划线</label>
        <div className="buttons">
          <button onClick={onConfirm}>确认</button>
          <button className="cancelBtn" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default TextModal;