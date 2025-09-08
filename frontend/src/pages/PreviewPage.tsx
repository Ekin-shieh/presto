import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/PreviewPage.module.css";
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

type Presentation = {
    id: number;
    name: string;
    slides: Slide[];
};

type StoreResponse = {
    store: { presentations: Presentation[] };
};

const PreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const presIdNum = useMemo(() => Number(id), [id]);
    const navigate = useNavigate();
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const slideWidth = 800;
    const slideHeight = 450;
    const scale = 1.5;
    const scaledWidth = slideWidth * scale;
    const scaledHeight = slideHeight * scale;

const [animatingIndex, setAnimatingIndex] = useState(currentIndex);
const [animate, setAnimate] = useState(false);

useEffect(() => {
  if (presentation && currentIndex !== animatingIndex) {
    setAnimate(true);
    const t = setTimeout(() => {
      setAnimatingIndex(currentIndex);
      setAnimate(false);
    }, 300); // 动画时间 300ms
    return () => clearTimeout(t);
  }
}, [currentIndex, presentation, animatingIndex]);


    const fetchStore = useCallback(async (): Promise<StoreResponse | null> => {
        try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5005/store", {
            method: "GET",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
            },
        });
        if (!res.ok) return null;
        return (await res.json()) as StoreResponse;
        } catch {
        return null;
        }
    }, []);

    const load = useCallback(async () => {
        const data = await fetchStore();
        if (!data) return;
        const found = data.store.presentations.find((p) => p.id === presIdNum);
        if (!found) {
        navigate("/dashboard");
        return;
        }
        setPresentation(found);
        setCurrentIndex(0);
    }, [fetchStore, presIdNum, navigate]);

    useEffect(() => {
        void load();
    }, [load]);

    const gotoIndex = (i: number) => {
        if (!presentation) return;
        const max = presentation.slides.length - 1;
        const clamped = Math.max(0, Math.min(max, i));
        setCurrentIndex(clamped);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
        if (!presentation) return;
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            gotoIndex(currentIndex - 1);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            gotoIndex(currentIndex + 1);
        }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [presentation, currentIndex]);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const onStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!presentation || presentation.slides.length === 0) return;
        if (e.deltaY > 0) {
        gotoIndex(currentIndex + 1);
        } else if (e.deltaY < 0) {
        gotoIndex(currentIndex - 1);
        }
    };

    const exportToPDF = async () => {
        if (!presentation) return;
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: [slideWidth, slideHeight],
        });
        for (let i = 0; i < presentation.slides.length; i++) {
        const slide = presentation.slides[i];
        const slideEl = document.createElement("div");
        slideEl.style.width = `${slideWidth}px`;
        slideEl.style.height = `${slideHeight}px`;
        slideEl.style.position = "absolute";
        slideEl.style.left = "-99999px";
        slideEl.style.top = "0";
        slideEl.style.background =
            slide.background.type === "color"
            ? slide.background.value
            : slide.background.type === "image"
            ? `url(${slide.background.value}) center/cover no-repeat`
            : slide.background.value;
        document.body.appendChild(slideEl);
        slide.content.forEach((el) => {
            if (el.type === "text") {
            const textDiv = document.createElement("div");
            textDiv.innerText = el.properties.text;
            Object.assign(textDiv.style, {
                position: "absolute",
                left: `${el.position.x}px`,
                top: `${el.position.y}px`,
                width: `${el.size.width}px`,
                height: `${el.size.height}px`,
                fontSize: `${el.properties.fontSize}px`,
                fontFamily: el.properties.fontFamily,
                fontWeight:
                el.properties.fontWeight === "bold"
                    ? "700"
                    : el.properties.fontWeight === "light"
                    ? "300"
                    : "400",
                fontStyle: el.properties.fontStyle,
                textDecoration: el.properties.textDecoration,
                color: el.properties.color,
                padding: "5px",
                whiteSpace: "normal",
                overflowWrap: "break-word",
                wordBreak: "break-word",
            });
            slideEl.appendChild(textDiv);
            }
            if (el.type === "image") {
            const img = document.createElement("img");
            img.src = el.properties.url;
            img.style.position = "absolute";
            img.style.left = `${el.position.x}px`;
            img.style.top = `${el.position.y}px`;
            img.style.width = `${el.size.width}px`;
            img.style.height = `${el.size.height}px`;
            img.style.objectFit = "contain";
            slideEl.appendChild(img);
            }
            if (el.type === "video") {
            const videoBox = document.createElement("div");
            videoBox.innerText = "[视频]";
            Object.assign(videoBox.style, {
                position: "absolute",
                left: `${el.position.x}px`,
                top: `${el.position.y}px`,
                width: `${el.size.width}px`,
                height: `${el.size.height}px`,
                border: "1px solid #000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            });
            slideEl.appendChild(videoBox);
            }
        });

        const canvas = await html2canvas(slideEl, {
            backgroundColor: null,
            scale: 2,
        });
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, slideWidth, slideHeight);

        document.body.removeChild(slideEl);
        }
        pdf.save(`${presentation.name || "presentation"}.pdf`);
    };

    if (!presentation) return <div className="load">加载中...</div>;
    const slide = presentation.slides[currentIndex];
    if (!slide) return <div>没有幻灯片</div>;

    const slideCenterX = slideWidth / 2;
    const slideCenterY = slideHeight / 2;
    const scaledCenterX = scaledWidth / 2;
    const scaledCenterY = scaledHeight / 2;

    return (
        <div className={`container ${styles.container}`} onWheel={onStageWheel}>
        <header className={styles.previewAside}>
            <h2>{presentation.name}</h2>
            <Button onClick={() => navigate(`/presentation/${presentation.id}`)}>返回编辑</Button>
            <Button onClick={exportToPDF}>导出 PDF</Button>
            <Button onClick={logout}>退出登录</Button>
        </header>
        <main className={styles.previewSlide}>
            <div className={styles.slideWrapper}>
                <div
                className={`${styles.slideContent} ${animate ? styles.fadeOut : ""}`}
                style={
                    slide.background.type === "color"
                    ? { backgroundColor: presentation.slides[animatingIndex].background.value }
                    : slide.background.type === "image"
                    ? {
                        backgroundImage: `url(${presentation.slides[animatingIndex].background.value})`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        }
                    : {
                        backgroundImage: presentation.slides[animatingIndex].background.value,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        }
                }
                >
                {presentation.slides[animatingIndex].content.map((el, idx) => {
                const centerX = el.position.x + el.size.width / 2;
                const centerY = el.position.y + el.size.height / 2;
                const offsetX = (centerX - slideCenterX) * scale;
                const offsetY = (centerY - slideCenterY) * scale;
                const scaledX =
                    scaledCenterX + offsetX - (el.size.width * scale) / 2;
                const scaledY =
                    scaledCenterY + offsetY - (el.size.height * scale) / 2;

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
                if (el.type === "video") {
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
                return null;
                })}
                </div>
            </div>
        </main>

        </div>
    );
};

export default PreviewPage;