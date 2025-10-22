import React from "react";

type SlideElement = {
  type: "text" | "image" | "video" | "code";
  size: { width: number; height: number };
  position: { x: number; y: number };
  properties: any;
  layer: number;
};

type Slide = {
  id: number;
  index: number;
  background: { type: "color" | "image" | "gradient"; value: string };
  content: SlideElement[];
};

interface SlideRendererProps {
  slide: Slide;
  scale?: number;
  width: number;
  height: number;
  mode?: "display" | "export"; // 导出模式会省略 iframe 等复杂元素
}

/**
 * React 组件：渲染幻灯片内容（展示或导出共用）
 */
const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  scale = 1,
  width,
  height,
  mode = "display",
}) => {
  const slideCenterX = width / 2;
  const slideCenterY = height / 2;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledCenterX = scaledWidth / 2;
  const scaledCenterY = scaledHeight / 2;

  const bgStyle =
    slide.background.type === "color"
      ? { backgroundColor: slide.background.value }
      : slide.background.type === "image"
      ? {
          backgroundImage: `url(${slide.background.value})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }
      : {
          backgroundImage: slide.background.value,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        };

  return (
    <div
      style={{
        ...bgStyle,
        position: "relative",
        width: scaledWidth,
        height: scaledHeight,
        overflow: "hidden",
      }}
    >
      {slide.content.map((el, idx) => {
        const centerX = el.position.x + el.size.width / 2;
        const centerY = el.position.y + el.size.height / 2;
        const offsetX = (centerX - slideCenterX) * scale;
        const offsetY = (centerY - slideCenterY) * scale;
        const scaledX = scaledCenterX + offsetX - (el.size.width * scale) / 2;
        const scaledY = scaledCenterY + offsetY - (el.size.height * scale) / 2;

        if (el.type === "text") {
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: scaledX,
                top: scaledY,
                width: el.size.width * scale,
                height: el.size.height * scale,
                fontSize: `${el.properties.fontSize * scale}px`,
                fontFamily: el.properties.fontFamily,
                fontWeight:
                  el.properties.fontWeight === "bold"
                    ? 700
                    : el.properties.fontWeight === "light"
                    ? 300
                    : 400,
                fontStyle: el.properties.fontStyle,
                textDecoration: el.properties.textDecoration,
                color: el.properties.color,
                padding: `${5 * scale}px`,
                whiteSpace: "normal",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                zIndex: el.layer,
              }}
            >
              {el.properties.text}
            </div>
          );
        }

        if (el.type === "image") {
          return (
            <img
              key={idx}
              src={el.properties.url}
              alt={el.properties.description || "image"}
              style={{
                position: "absolute",
                left: scaledX,
                top: scaledY,
                width: el.size.width * scale,
                height: el.size.height * scale,
                objectFit: "contain",
                zIndex: el.layer,
              }}
            />
          );
        }

        if (el.type === "video" && mode === "display") {
          return (
            <iframe
              key={idx}
              src={`${el.properties.url}${
                el.properties.autoPlay ? "?autoplay=1&mute=1" : ""
              }`}
              style={{
                position: "absolute",
                left: scaledX,
                top: scaledY,
                width: el.size.width * scale,
                height: el.size.height * scale,
                border: "none",
                zIndex: el.layer,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          );
        }

        // PDF 导出模式：视频转成文本占位
        if (el.type === "video" && mode === "export") {
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: scaledX,
                top: scaledY,
                width: el.size.width * scale,
                height: el.size.height * scale,
                border: "1px solid #000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#333",
              }}
            >
              [视频]
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default SlideRenderer;