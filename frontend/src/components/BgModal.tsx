import React, { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";

interface BgModalProps {
  visible: boolean;
  bgType: "color" | "image" | "gradient";
  bgValue: string;
  gradientDirection: string;
  gradientColor1: string;
  gradientColor2: string;
  onTypeChange: (v: "color" | "image" | "gradient") => void;
  onValueChange: (v: string) => void;
  onGradientDirChange: (v: string) => void;
  onGradientColor1Change: (v: string) => void;
  onGradientColor2Change: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  setError?: (msg: string) => void;
}

const BgModal: React.FC<BgModalProps> = ({
  visible,
  bgType,
  bgValue,
  gradientDirection,
  gradientColor1,
  gradientColor2,
  onTypeChange,
  onValueChange,
  onGradientDirChange,
  onGradientColor1Change,
  onGradientColor2Change,
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

  // ✅ 图片压缩逻辑保留
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

  const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 450);
      onValueChange(compressed);
    } catch (err) {
      console.error("压缩背景图失败:", err);
      setError?.("压缩背景图失败");
    }
  };

  const isBase64Image = (val: string) => typeof val === "string" && val.startsWith("data:image/");

  return (
    <div className="overlay modal-overlay visible" onClick={onClose}>
      <div className={`addform ${animate ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
        <div className="presentationTitle">编辑背景</div>

        <div className="radioGroup">
          <label>
            <input type="radio" checked={bgType === "color"} onChange={() => onTypeChange("color")} />
            颜色
          </label>
          <label>
            <input type="radio" checked={bgType === "image"} onChange={() => onTypeChange("image")} />
            图片
          </label>
          <label>
            <input
              type="radio"
              checked={bgType === "gradient"}
              onChange={() => onTypeChange("gradient")}
            />
            渐变
          </label>
        </div>

        {bgType === "color" && (
          <div className="colorPreview">
            <div>当前选择颜色</div>
            <div className="colorBox" style={{ background: bgValue }} />
            <HexColorPicker color={bgValue} onChange={onValueChange} />
          </div>
        )}

        {bgType === "image" && (
          <>
            <input type="file" accept="image/*" onChange={handleBgImageChange} />
            {isBase64Image(bgValue) && bgValue && (
              <div className="thumbPreview">
                <img src={bgValue} alt="背景预览" />
              </div>
            )}
          </>
        )}

        {bgType === "gradient" && (
          <>
            <label>
              方向（角度）：
              <input
                type="text"
                value={gradientDirection}
                onChange={(e) => onGradientDirChange(e.target.value)}
                placeholder="例如：90deg"
                style={{ width: "100px", marginLeft: "8px" }}
              />
            </label>
            <div>当前渐变效果</div>
            <div
              className="colorBox"
              style={{
                background: `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`,
              }}
            />
            <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
              <label>
                颜色1
                <HexColorPicker
                  color={gradientColor1}
                  onChange={onGradientColor1Change}
                  style={{ width: "150px", height: "150px" }}
                />
              </label>
              <label>
                颜色2
                <HexColorPicker
                  color={gradientColor2}
                  onChange={onGradientColor2Change}
                  style={{ width: "150px", height: "150px" }}
                />
              </label>
            </div>
          </>
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

export default BgModal;