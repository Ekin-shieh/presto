import React from "react";
import styles from "../styles/PresentationPage.module.css";
import { Slider, Checkbox, FormControlLabel } from "@mui/material";

interface ElementEditorProps {
  selectedElementIndex: number | null;
  sortedSlides: any[];
  currentIndex: number;
  presentation: any;
  updateTextProperty: (idx: number, key: any, value: any) => void;
  updateImageProperty: (idx: number, key: any, value: any) => void;
  deleteSelectedElement: () => void;
  updateElementLayer: (action: "up" | "down" | "top" | "bottom", idx: number) => void;
  setError: (msg: string) => void;
  setPresentation: React.Dispatch<React.SetStateAction<any>>;
  setDirty: (dirty: boolean) => void;
}

const ElementEditor: React.FC<ElementEditorProps> = ({
  selectedElementIndex,
  sortedSlides,
  currentIndex,
  presentation,
  updateTextProperty,
  updateImageProperty,
  deleteSelectedElement,
  updateElementLayer,
  setError,
  setPresentation,
  setDirty,
}) => {
  if (selectedElementIndex === null) {
    return <div className={styles.elementBox}><div className="gray">当前无选中可编辑元素</div></div>;
  }

  const el = sortedSlides[currentIndex].content[selectedElementIndex];

  const LayerControls = ({ idx }: { idx: number }) => (
    <>
      <div className={styles.layerControls}>
        <button onClick={() => updateElementLayer("up", idx)}>上移一层</button>
        <button onClick={() => updateElementLayer("down", idx)}>下移一层</button>
        <button onClick={() => updateElementLayer("top", idx)}>移至顶层</button>
        <button onClick={() => updateElementLayer("bottom", idx)}>移至底层</button>
      </div>
      <button onClick={deleteSelectedElement}>删除该元素</button>
    </>
  );

  if (el.type === "text") {
    return (
      <div className={styles.elementBox}>
        <div className={styles.elementForm}>
          <h3>编辑文本元素</h3>
          <label>文字内容</label>
          <textarea
            rows={3}
            value={el.properties.text}
            onChange={(e) => updateTextProperty(selectedElementIndex, "text", e.target.value)}
          />
          <label>字号</label>
          <input
            type="number"
            value={el.properties.fontSize}
            onChange={(e) => updateTextProperty(selectedElementIndex, "fontSize", Number(e.target.value))}
          />
          <label>字体</label>
          <select
            value={el.properties.fontFamily}
            onChange={(e) => updateTextProperty(selectedElementIndex, "fontFamily", e.target.value)}
          >
            <option value="Noto Sans SC">Noto Sans SC</option>
            <option value="Noto Serif SC">Noto Serif SC</option>
            <option value="LXGW WenKai">LXGW WenKai</option>
          </select>
          <label>颜色</label>
          <input
            type="color"
            value={el.properties.color}
            onChange={(e) => updateTextProperty(selectedElementIndex, "color", e.target.value)}
          />
          <label>字重</label>
          <select
            value={el.properties.fontWeight}
            onChange={(e) => updateTextProperty(selectedElementIndex, "fontWeight", e.target.value)}
          >
            <option value="light">Light</option>
            <option value="regular">Regular</option>
            <option value="bold">Bold</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={el.properties.fontStyle === "italic"}
              onChange={(e) =>
                updateTextProperty(selectedElementIndex, "fontStyle", e.target.checked ? "italic" : "normal")
              }
            />
            斜体
          </label>
          <label>
            <input
              type="checkbox"
              checked={el.properties.textDecoration === "underline"}
              onChange={(e) =>
                updateTextProperty(
                  selectedElementIndex,
                  "textDecoration",
                  e.target.checked ? "underline" : "none"
                )
              }
            />
            下划线
          </label>
          <LayerControls idx={selectedElementIndex} />
        </div>
      </div>
    );
  }

  if (el.type === "image") {
    return (
      <div className={styles.elementBox}>
        <div className={styles.elementForm}>
          <h3>编辑图片元素</h3>
          <label>亮度</label>
          <Slider
            value={el.properties.brightness}
            min={0}
            max={200}
            step={1}
            onChange={(_, value) => updateImageProperty(selectedElementIndex, "brightness", value as number)}
          />
          <label>对比度</label>
          <Slider
            value={el.properties.contrast}
            min={0}
            max={200}
            step={1}
            onChange={(_, value) => updateImageProperty(selectedElementIndex, "contrast", value as number)}
          />
          <label>饱和度</label>
          <Slider
            value={el.properties.saturation}
            min={0}
            max={200}
            step={1}
            onChange={(_, value) => updateImageProperty(selectedElementIndex, "saturation", value as number)}
          />
          <label>透明度</label>
          <Slider
            value={el.properties.opacity}
            min={0}
            max={100}
            step={1}
            onChange={(_, value) => updateImageProperty(selectedElementIndex, "opacity", value as number)}
          />
          <label>旋转角度</label>
          <Slider
            value={el.properties.rotation}
            min={-180}
            max={180}
            step={1}
            onChange={(_, value) => updateImageProperty(selectedElementIndex, "rotation", value as number)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={el.properties.flipH}
                onChange={(e) => updateImageProperty(selectedElementIndex, "flipH", e.target.checked)}
              />
            }
            label="水平翻转"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={el.properties.flipV}
                onChange={(e) => updateImageProperty(selectedElementIndex, "flipV", e.target.checked)}
              />
            }
            label="垂直翻转"
          />
          <LayerControls idx={selectedElementIndex} />
        </div>
      </div>
    );
  }

  if (el.type === "video") {
    return (
      <div className={styles.elementBox}>
        <div className={styles.elementForm}>
          <h3>编辑视频元素</h3>
          <label>视频 URL</label>
          <textarea
            rows={5}
            defaultValue={el.properties.url}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (!value) {
                setError("视频 URL 不能为空");
                return;
              }
              const isValidYoutubeEmbed = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/.test(value);
              if (!isValidYoutubeEmbed) {
                setError("请输入有效的 YouTube 嵌入视频 URL（例如：https://www.youtube.com/embed/...）");
                return;
              }
              const updatedSlides = [...presentation.slides];
              updatedSlides[currentIndex].content[selectedElementIndex] = {
                ...el,
                properties: { ...el.properties, url: value },
              };
              setPresentation({ ...presentation, slides: updatedSlides });
              setDirty(true);
            }}
          />
          <label>
            <input
              type="checkbox"
              checked={el.properties.autoPlay}
              onChange={(e) => {
                const updatedSlides = [...presentation.slides];
                updatedSlides[currentIndex].content[selectedElementIndex] = {
                  ...el,
                  properties: { ...el.properties, autoPlay: e.target.checked },
                };
                setPresentation({ ...presentation, slides: updatedSlides });
                setDirty(true);
              }}
            />
            自动播放
          </label>
          <LayerControls idx={selectedElementIndex} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.elementBox}>
      <div className="gray">该类型元素暂不支持编辑</div>
    </div>
  );
};

export default ElementEditor;