import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/PreviewPage.module.css";
import { Button } from "@mui/material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const API_BASE = "http://localhost:5005";
import { logout } from "../api/auth";
import SlideRenderer from "../components/SlideRenderer";
import { createRoot } from "react-dom/client";

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
    const [animatingIndex, setAnimatingIndex] = useState(currentIndex);
    const [animate, setAnimate] = useState(false);
    const [wheelLocked, setWheelLocked] = useState(false);

    useEffect(() => {
        if (presentation && currentIndex !== animatingIndex) {
            setAnimate(true);
            const t = setTimeout(() => {
            setAnimatingIndex(currentIndex);
            setAnimate(false);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [currentIndex, presentation, animatingIndex]);


    const fetchStore = useCallback(async (): Promise<StoreResponse | null> => {
        try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/store`, {
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

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const onStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (wheelLocked || !presentation || presentation.slides.length === 0) return;

        setWheelLocked(true);

        if (e.deltaY > 0) {
            gotoIndex(currentIndex + 1);
        } else if (e.deltaY < 0) {
            gotoIndex(currentIndex - 1);
        }

        setTimeout(() => setWheelLocked(false), 400);
    };

    const exportToPDF = async () => {
        if (!presentation) return;
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: [slideWidth, slideHeight],
        });

        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-99999px";
        document.body.appendChild(container);

        const root = createRoot(container);

        for (let i = 0; i < presentation.slides.length; i++) {
            root.render(
            <SlideRenderer
                slide={presentation.slides[i]}
                width={slideWidth}
                height={slideHeight}
                mode="export"
            />
            );

            await new Promise((r) => setTimeout(r, 100));

            const canvas = await html2canvas(container.firstChild as HTMLElement, {
            backgroundColor: null,
            scale: 2,
            });

            const imgData = canvas.toDataURL("image/png");
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, 0, slideWidth, slideHeight);
        }

        root.unmount();
        document.body.removeChild(container);
        pdf.save(`${presentation.name || "presentation"}.pdf`);
    };

    if (!presentation) return <div className="load">加载中...</div>;
    const slide = presentation.slides[currentIndex];
    if (!slide) return (
        <div className='container'>
            <header className={styles.previewAside}>
                <h2>{presentation.name}</h2>
                <Button onClick={() => navigate(`/presentation/${presentation.id}`)}>返回编辑</Button>
                <Button onClick={handleLogout}>退出登录</Button>
            </header>
            <main className={styles.noSlide}>
                没有幻灯片
            </main>
        </div>
    );

    return (
        <div className={`container ${styles.container}`} onWheel={onStageWheel}>
            <header className={styles.previewAside}>
                <h2>{presentation.name}</h2>
                <Button onClick={() => navigate(`/presentation/${presentation.id}`)}>返回编辑</Button>
                <Button onClick={exportToPDF}>导出 PDF</Button>
                <Button onClick={handleLogout}>退出登录</Button>
            </header>
            <main className={styles.previewSlide}>
                <div className={styles.slideWrapper}>
                    <div className={`${styles.slideContent} ${animate ? styles.fadeOut : ""}`}>
                    <SlideRenderer
                        slide={presentation.slides[animatingIndex]}
                        width={slideWidth}
                        height={slideHeight}
                        scale={scale}
                        mode="display"
                    />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PreviewPage;