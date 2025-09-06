import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import '../styles/style.css';
import styles from '../styles/PresentationPage.module.css';
import { DndContext, closestCenter } from "@dnd-kit/core";
import {  SortableContext,  useSortable,  verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent } from "@dnd-kit/core";

function SortableSlideItem({ slide, idx, currentIndex, gotoIndex,
    }: {
        slide: Slide; idx: number; currentIndex: number;
        gotoIndex: (i: number) => void;
    }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id: slide.id});
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        border: idx === currentIndex ? "2px solid #4f46e5" : "1px solid #ddd",
        background: isDragging ? "#f0f0f0" : "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    };
    return (
        <button
        ref={setNodeRef}
        {...attributes}
        onClick={() => gotoIndex(idx)}
        className={styles.slides}
        style={style}
        title={`转到第 ${idx + 1} 张`}
        >
        <span style={{ color: idx === currentIndex ? "#4f46e5" : "#666" }}>
            幻灯片{idx + 1}
        </span>
        <span
            {...listeners}
            style={{ cursor: "grab", padding: "0 6px", color: "#aaa" }}
            title="拖拽调整顺序"
        >
            ≡
        </span>
        </button>
    );
}

function isValidGradientDirection(value: string): boolean {
    const angleRegex = /^\d+deg$/;
    const keywordRegex = /^to (left|right|top|bottom)( (left|right|top|bottom))?$/;
    return angleRegex.test(value) || keywordRegex.test(value);
}

function clampElementPosition(el: SlideElement, newX: number, newY: number, slideWidth: number, slideHeight: number, padding = 5) {
    const elementWidth = el.size.width + padding * 2;
    const elementHeight = el.size.height + padding * 2;
    const minX = -(elementWidth - 10);
    const maxX = slideWidth - 10;
    const minY = -(elementHeight - 10);
    const maxY = slideHeight - 10;
    return {
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
    };
}

type SlideElement =
| {
    type: "text";
    size: { width: number; height: number };
    position: { x: number; y: number };
    properties: {
        text: string;
        fontSize: number;
        color: string;
        fontFamily: "Noto Sans SC" | "Noto Serif SC" | "LXGW WenKai";
        fontWeight: "light" | "regular" | "bold"; 
        fontStyle: "normal" | "italic";
        textDecoration: "none" | "underline"; 
    };
    layer: number;
    }
| {
    type: "image";
    size: { width: number; height: number };
    position: { x: number; y: number };
    properties: {
        url: string;
        description: string;
    };
    layer: number;
    }
| {
    type: "video";
    size: { width: number; height: number };
    position: { x: number; y: number };
    properties: {
        url: string;
        autoPlay: boolean;
    };
    layer: number;
    }
| {
    type: "code";
    size: { width: number; height: number };
    position: { x: number; y: number };
    properties: {
        code: string;
        fontSize: number;
        language: string;
    };
    layer: number;
    };

type Slide = {
    id: number;
    index: number;
    background: {
        type: "color" | "image" | "gradient";
        value: string;
    };
    content: SlideElement[];
};

type Presentation = {
    id: number;
    name: string;
    description?: string;
    thumbnail?: string | null;
    slides: Slide[];
};

type StoreResponse = {
    store: {
        presentations: Presentation[];
    };
};

const PresentationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const presIdNum = useMemo(() => Number(id), [id]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [dirty, setDirty] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [tempName, setTempName] = useState("");
    const [tempDescription, setTempDescription] = useState("");
    const [tempThumbnail, setTempThumbnail] = useState<string | null>(null);
    const [showBgModal, setShowBgModal] = useState(false);
    const [tempBgType, setTempBgType] = useState<"color" | "image" | "gradient">("color");
    const [tempBgValue, setTempBgValue] = useState<string>("#FFFFFF");
    const [gradientDirection, setGradientDirection] = useState<string>("");
    const [gradientColor1, setGradientColor1] = useState<string>("#ff0000");
    const [gradientColor2, setGradientColor2] = useState<string>("#0000ff");
    const [showTextModal, setShowTextModal] = useState(false);
    const [textContent, setTextContent] = useState("");
    const [textFontSize, setTextFontSize] = useState(16);
    const [textFont, setTextFont] = useState<"Noto Sans SC" | "Noto Serif SC" | "LXGW WenKai">("Noto Sans SC");
    const [textColor, setTextColor] = useState("#000000");
    const [textWeight, setTextWeight] = useState<"light" | "regular" | "bold">("regular");
    const [textStyle, setTextStyle] = useState<"normal" | "italic">("normal");
    const [textDecoration, setTextDecoration] = useState<"none" | "underline">("none");
    const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const [elementStart, setElementStart] = useState<{ x: number; y: number } | null>(null);
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [resizeDir, setResizeDir] = useState<string | null>(null);
    const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);
    const [animateInfoModal, setAnimateInfoModal] = useState(false);
    const [animateBgModal, setAnimateBgModal] = useState(false);
    const [animateTextModal, setAnimateTextModal] = useState(false);

    const closeInfoModal = () => {
        setAnimateInfoModal(false);
        setTimeout(() => setShowInfoModal(false), 300);
    };

    const closeBgModal = () => {
        setAnimateBgModal(false);
        setTimeout(() => setShowBgModal(false), 300);
    };

    const openTextModal = () => {
        setShowTextModal(true);
        setAnimateTextModal(false);
        requestAnimationFrame(() => setAnimateTextModal(true));
    };

    async function apiRequest<T>(
        method: "GET" | "PUT",
        body?: any
        ): Promise<T | null> {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5005/store", {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token ?? ""}`,
            },
            body: body ? JSON.stringify(body) : undefined,
            });
            if (res.status === 401) {
            navigate("/");
            return null;
            }
            if (!res.ok) throw new Error(`Failed to ${method} store`);
            return (await res.json()) as T;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    const fetchStore = useCallback(async (): Promise<StoreResponse | null> => {
        return apiRequest<StoreResponse>("GET");
    }, [navigate]);

    const saveStore = useCallback(
        async (presentations: Presentation[]) => {
            return apiRequest("PUT", { store: { presentations } });
        },
        [navigate]
    );

    const load = useCallback(async () => {
        setLoading(true);
        const data = await fetchStore();
        if (!data) {
            setLoading(false);
            return;
        }
        const found = data.store.presentations.find((p) => p.id === presIdNum);
        if (!found) {
            navigate("/dashboard");
            return;
        }
        setPresentation(found);
        setCurrentIndex(0);
        setLoading(false);
    }, [fetchStore, navigate, presIdNum]);

    useEffect(() => {
        void load();
        setSelectedElementIndex(null);
    }, [load]);

    const persist = useCallback(
        async (updated: Presentation) => {
            const data = await fetchStore();
            if (!data) return;
            const updatedPresentations = data.store.presentations.map((p) =>
            p.id === updated.id ? updated : p
            );
            await saveStore(updatedPresentations);
        },
        [fetchStore, saveStore]
    );

    const addSlide = async () => {
        if (!presentation) return;
        const newSlide: Slide = {
            id: presentation.slides.length + 1,
            index: presentation.slides.length,
            background: { type: "color", value: "#FFFFFF"},
            content: []
        };
        const updated: Presentation = {
            ...presentation,
            slides: [...presentation.slides, newSlide]
        };
        setPresentation(updated);
        setCurrentIndex(updated.slides.length - 1);
        setDirty(true);
    };

    const deleteCurrentSlide = () => {
        if (!presentation || sortedSlides.length === 0) return;
        const updatedSlides = sortedSlides.filter((_, idx) => idx !== currentIndex);
        const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        const reindexedSlides = updatedSlides.map((s, idx) => ({
            ...s,
            index: idx,
        }));
        const updated: Presentation = {
            ...presentation,
            slides: reindexedSlides,
        };
        setPresentation(updated);
        setCurrentIndex(Math.min(newIndex, reindexedSlides.length - 1));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!presentation) return;
        await persist(presentation);
        setDirty(false);
        alert("修改已保存");
    };

    const confirmBeforeExit = async (action: () => void) => {
    if (dirty) {
        const ok = window.confirm("您有未保存的更改，是否先保存");
        if (ok) {
        await handleSave();
        }
    }
    action();
    };

    const sortedSlides = useMemo(() => {
        return presentation?.slides
            ? [...presentation.slides].sort((a, b) => a.index - b.index)
            : [];
    }, [presentation]);

    const gotoIndex = (i: number) => {
        const max = sortedSlides.length - 1;
        const clamped = Math.max(0, Math.min(max, i));
        setCurrentIndex(clamped);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
            if (sortedSlides.length === 0) return;
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
    }, [sortedSlides, currentIndex]);

    const onStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!presentation || presentation.slides.length === 0) return;
        if (e.deltaY > 0) {
            gotoIndex(currentIndex + 1);
        } else if (e.deltaY < 0) {
            gotoIndex(currentIndex - 1);
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const openInfoModal = () => {
        if (!presentation) return;
        setTempName(presentation.name);
        setTempDescription(presentation.description || "");
        setTempThumbnail(presentation.thumbnail || null);
        setShowInfoModal(true);
        setAnimateInfoModal(false);
        requestAnimationFrame(() => setAnimateInfoModal(true));
    };

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

    const handleTempThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressedBase64 = await compressImage(file, 160, 90);
            setTempThumbnail(compressedBase64);
        } catch (err) {
            console.error("压缩缩略图失败:", err);
        }
    };

    const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file, 800, 450);
            setTempBgValue(compressed);
        } catch (err) {
            console.error("压缩背景图失败:", err);
        }
    };

    const handleInfoSave = async () => {
        if (!presentation) return;
        const updated: Presentation = {
            ...presentation,
            name: tempName,
            description: tempDescription,
            thumbnail: tempThumbnail,
        };
        setPresentation(updated);
        await persist(updated);
        setShowInfoModal(false);
    };

    const deletePresentation = async () => {
        if (!presentation) return;
        const ok = window.confirm("确定要删除这个演示文稿吗？");
        if (!ok) return;
        const data = await fetchStore();
        if (!data) return;
        const updated = data.store.presentations.filter(p => p.id !== presIdNum);
        await saveStore(updated);
        navigate("/dashboard");
    };

    const openBgModal = () => {
        if (!presentation) return;
        const currentBg = sortedSlides[currentIndex].background;
        if (currentBg.type === "gradient") {
            setTempBgType("gradient");
            const match = currentBg.value.match(/^linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)$/);
            if (match) {
                setGradientDirection(match[1].trim());
                setGradientColor1(match[2].trim());
                setGradientColor2(match[3].trim());
            } else {
                setGradientDirection("");
                setGradientColor1("#ff0000");
                setGradientColor2("#0000ff");
            }
        } else {
            setTempBgType(currentBg.type as "color" | "image");
            setTempBgValue(currentBg.value);
            setGradientDirection("");
            setGradientColor1("#ff0000");
            setGradientColor2("#0000ff");
        }
        setAnimateBgModal(false);
        requestAnimationFrame(() => setAnimateBgModal(true));
        setShowBgModal(true);
    };

    const dragSlide = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortedSlides.findIndex((s) => s.id === active.id);
        const newIndex = sortedSlides.findIndex((s) => s.id === over.id);
        const reordered = Array.from(sortedSlides);
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        const reindexed = reordered.map((s, idx) => ({ ...s, index: idx }));
        const updated = { ...presentation!, slides: reindexed };
        setPresentation(updated);
        setCurrentIndex(newIndex);
        setDirty(true);
    }

    const changeBg = () => {
        if (!presentation) return;
        if (tempBgType === "gradient") {
            if (!isValidGradientDirection(gradientDirection)) {
            alert("错误：请输入合法的渐变方向，例如 '90deg' 或 'to right'");
            setGradientDirection("");
            return;
            }
        }
        const updatedSlides = [...presentation.slides];
        let value = tempBgValue;
        if (tempBgType === "gradient") {
            value = `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`;
        }
        updatedSlides[currentIndex] = {
            ...updatedSlides[currentIndex],
            background: { type: tempBgType, value },
        };
        setPresentation({ ...presentation, slides: updatedSlides });
        setDirty(true);
        setShowBgModal(false);
    };

    const isBase64Image = (val: string) => {
        return typeof val === "string" && val.startsWith("data:image/");
    };

    const handleAddTextElement = () => {
        if (!presentation || !textContent.trim()) return;
        const currentSlide = presentation.slides[currentIndex];
        if (!currentSlide) return;
        const lineHeight = 1.5;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.font = `${textWeight === "bold" ? "700" : "400"} ${textFontSize}px ${textFont}`;
        const metrics = ctx.measureText(textContent);
        const textWidth = metrics.width;
        const width = textWidth;
        const height = textFontSize * lineHeight;
        const newElement: SlideElement = {
            type: "text",
            size: { width, height },
            position: { x: 5, y: 5 },
            properties: {
                text: textContent,
                fontSize: textFontSize,
                color: textColor,
                fontFamily: textFont,
                fontWeight: textWeight,
                fontStyle: textStyle,
                textDecoration: textDecoration,
            },
            layer: currentSlide.content.length + 1,
        };
        const updatedSlides = [...presentation.slides];
        updatedSlides[currentIndex] = {
            ...currentSlide,
            content: [...currentSlide.content, newElement],
        };
        setPresentation({ ...presentation, slides: updatedSlides });
        closeTextModal();
        setSelectedElementIndex(currentSlide.content.length);
        setDirty(true);
    };

    const closeTextModal = () => {
        setShowTextModal(false);
        setTextContent("");
        setTextFontSize(16);
        setTextFont("Noto Sans SC");
        setTextColor("#000000");
        setTextWeight("regular");
        setTextStyle("normal");
        setTextDecoration("none");
        setTimeout(() => setShowTextModal(false), 300);
    };

    const handleResizeStart = (e: React.MouseEvent, idx: number, dir: string) => {
        e.stopPropagation();
        setResizingIndex(idx);
        setResizeDir(dir);
        setDragStart({ x: e.clientX, y: e.clientY });
        const currentSlide = presentation!.slides[currentIndex];
        const el = currentSlide.content[idx];
        setElementStart({ x: el.position.x, y: el.position.y });
        setResizeStartSize({ width: el.size.width, height: el.size.height });
    };

    const handleMouseDown = (e: React.MouseEvent, idx: number) => {
        e.stopPropagation();
        if (!presentation) return;
        setDraggingIndex(idx);
        setDragStart({ x: e.clientX, y: e.clientY });
        const currentSlide = presentation.slides[currentIndex];
        const el = currentSlide.content[idx];
        setElementStart({ x: el.position.x, y: el.position.y });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!presentation) return;
        const updatedSlides = [...presentation.slides];
        const currentSlide = updatedSlides[currentIndex];

        if (draggingIndex !== null && dragStart && elementStart) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const el = currentSlide.content[draggingIndex];
            const newX = elementStart.x + dx;
            const newY = elementStart.y + dy;
            const { x, y } = clampElementPosition(el, newX, newY, 800, 450);
            el.position = { x, y };
        }

        if (resizingIndex !== null && dragStart && elementStart && resizeDir && resizeStartSize) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const el = currentSlide.content[resizingIndex];
            let newWidth = resizeStartSize.width;
            let newHeight = resizeStartSize.height;
            let newX = elementStart.x;
            let newY = elementStart.y;
            if (resizeDir.includes("right")) newWidth = Math.max(7, resizeStartSize.width + dx);
            if (resizeDir.includes("bottom")) newHeight = Math.max(7, resizeStartSize.height + dy);
            if (resizeDir.includes("left")) {
                newWidth = Math.max(7, resizeStartSize.width - dx);
                newX = elementStart.x + dx;
            }
            if (resizeDir.includes("top")) {
                newHeight = Math.max(7, resizeStartSize.height - dy);
                newY = elementStart.y + dy;
            }
            el.size = { width: newWidth, height: newHeight };
            el.position = { x: newX, y: newY };
        }
        const updated: Presentation = {...presentation, slides: updatedSlides,};
        setPresentation(updated);
        setDirty(true);
        };

    const handleMouseUp = () => {
        setDraggingIndex(null);
        setDragStart(null);
        setElementStart(null);
        setResizingIndex(null);
        setResizeDir(null);
        setResizeStartSize(null);
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove]);

    if (loading) return <div className="load">加载中...</div>;
    if (!presentation) return <div className="load">未找到演示文稿</div>;

    return (
    <div className='container'>
        <div className={styles.aside}>
            <div className={styles.slideList}>
                {sortedSlides.length > 0 ? (
                <DndContext collisionDetection={closestCenter} onDragEnd={dragSlide}>
                    <SortableContext
                    items={sortedSlides.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                    >
                    {sortedSlides.map((s, idx) => (
                        <SortableSlideItem
                        key={s.id}
                        slide={s}
                        idx={idx}
                        currentIndex={currentIndex}
                        gotoIndex={gotoIndex}
                        />
                    ))}
                    </SortableContext>
                </DndContext>
                ) : (
                <div className="gray">暂无幻灯片</div>
                )}
            </div>
            <div className={styles.asideTitle}>
                <div>
                {sortedSlides.length > 0
                    ? `${currentIndex + 1}/${sortedSlides.length}`
                    : "0/0"}
                </div>
                <button onClick={addSlide}>新建幻灯片</button>
            </div>
        </div>
        <div className={styles.slideBox}>
            <header className={styles.slideHeader}>
                <div className={styles.slideHeader}>
                    <img src="../src/assets/react.svg"></img>
                    <div>{presentation.name}</div>
                </div>
                <div className={styles.menu}>
                    <div className={styles.menuItem}>编辑
                        <div className={styles.submenu}>
                            <div onClick={openInfoModal}>文件信息</div>
                            <div onClick={openBgModal}>当前背景</div>
                        </div>
                    </div>
                    <div className={styles.menuItem}>添加
                        <div className={styles.submenu}>
                            <div onClick={addSlide}>新幻灯片</div>
                            <div onClick={openTextModal}>文本内容</div>
                            <div>插入图片</div>
                            <div>添加视频</div>
                            <div>新增代码</div>
                        </div>
                    </div>
                    <div className={styles.menuItem}>删除
                        <div className={styles.submenu}>
                            <div onClick={deletePresentation}>当前文件</div>
                            <div onClick={deleteCurrentSlide}>此幻灯片</div>
                        </div>
                    </div>
                    <div className={styles.menuItem}>保存
                        <div className={styles.submenu}>
                            <div onClick={handleSave}>保存修改</div>
                            <div>预览文件</div>
                            <div>导出PDF</div>
                        </div>
                    </div>
                    <div className={styles.menuItem}>退出
                        <div className={styles.submenu}>
                            <div onClick={() => confirmBeforeExit(() => navigate('/dashboard'))}>返回主页</div>
                            <div onClick={() => confirmBeforeExit(handleLogout)}>退出登录</div>
                        </div>
                    </div>
                </div>
            </header>
            <main ref={stageRef} onWheel={onStageWheel} className={styles.slideMain} onClick={() => setSelectedElementIndex(null)}>
                {sortedSlides.length > 0 ? (
                    <div
                    className={
                        sortedSlides[currentIndex].background.type === "color"
                        ? styles.slideColor
                        : styles.slideImage
                    }
                    style={
                        sortedSlides[currentIndex].background.type === "color"
                        ? { backgroundColor: sortedSlides[currentIndex].background.value }
                        : sortedSlides[currentIndex].background.type === "image"
                        ? { backgroundImage: `url(${sortedSlides[currentIndex].background.value})` }
                        : { backgroundImage: sortedSlides[currentIndex].background.value }
                    }
                    >
                    {sortedSlides[currentIndex].content.map((el, idx) => {
                    if (el.type === "text") {
                        return (
                        <div
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedElementIndex(idx);
                            }}
                            onMouseDown={(e) => handleMouseDown(e, idx)}
                            style={{
                            position: "absolute",
                            left: el.position.x,
                            top: el.position.y,
                            width: el.size.width,
                            height: el.size.height,
                            fontSize: `${el.properties.fontSize}px`,
                            fontFamily: el.properties.fontFamily,
                            fontWeight:
                                el.properties.fontWeight === "bold" ? 700 :
                                el.properties.fontWeight === "light" ? 300 : 400,
                            fontStyle: el.properties.fontStyle,
                            textDecoration: el.properties.textDecoration,
                            color: el.properties.color,
                            padding: "5px",
                            whiteSpace: "nowmal",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                            border: selectedElementIndex === idx ? "1px dashed gray" : "none",
                            zIndex: el.layer,
                            cursor: draggingIndex === idx ? "grabbing" : "grab",
                            }}
                        >
                            {el.properties.text}
                            {selectedElementIndex === idx && (
                                <>
                                <div className={styles.resizeHandle} style={{ left: -3, top: -3, cursor: "nwse-resize" }} onMouseDown={(e) => handleResizeStart(e, idx, "top-left")} />
                                <div className={styles.resizeHandle} style={{ right: -3, top: -3, cursor: "nesw-resize" }} onMouseDown={(e) => handleResizeStart(e, idx, "top-right")} />
                                <div className={styles.resizeHandle} style={{ left: -3, bottom: -3, cursor: "nesw-resize" }} onMouseDown={(e) => handleResizeStart(e, idx, "bottom-left")} />
                                <div className={styles.resizeHandle} style={{ right: -3, bottom: -3, cursor: "nwse-resize" }} onMouseDown={(e) => handleResizeStart(e, idx, "bottom-right")} />
                                </>
                            )}
                        </div>
                        );
                    }
                    return null;
                    })}
                    </div>
                ) : (
                    <button onClick={addSlide} className={styles.addFirstSlide} title="点击添加第一张幻灯片">点击添加第一张幻灯片</button>
                )}
            </main>
        </div>
        <div className={styles.elementBox}></div>
        {showInfoModal && (
        <div className="overlay modal-overlay visible" onClick={closeInfoModal}>
            <div className={`addform ${animateInfoModal ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
                <div className='presentationTitle'>编辑文件信息</div>
                <label>修改名称：</label>
                <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="输入幻灯片名称" />
                <label>修改描述：</label>
                <textarea value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} placeholder="输入描述" rows={3} />
                <label>修改封面:</label>
                <input type="file" accept="image/*" onChange={handleTempThumbnailChange} />
                {tempThumbnail && (
                    <div className='thumbPreview'>
                    <img src={tempThumbnail} alt="封面预览" />
                    </div>
                )}
                <div className='buttons'>
                    <button onClick={handleInfoSave}>保存</button>
                    <button className="cancelBtn" onClick={closeInfoModal}>取消</button>
                </div>
            </div>
        </div>
        )}
        {showBgModal && (
        <div className="overlay modal-overlay visible" onClick={closeBgModal}>
            <div className={`addform ${animateBgModal ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
            <div className="presentationTitle">编辑背景</div>
            <div className="radioGroup">
                <label>
                    <input type="radio" checked={tempBgType === "color"} onChange={() => setTempBgType("color")}/>颜色
                </label>
                <label>
                    <input type="radio" checked={tempBgType === "image"} onChange={() => setTempBgType("image")}/>图片
                </label>
                <label>
                    <input type="radio" checked={tempBgType === "gradient"} onChange={() => setTempBgType("gradient")}/>渐变
                </label>
            </div>
            {tempBgType === "color" && (
                <div className="colorPreview">
                    <div>当前选择颜色</div>
                    <div className="colorBox" style={{ background: tempBgValue }} />
                    <HexColorPicker color={tempBgValue} onChange={setTempBgValue} />
                </div>
            )}
            {tempBgType === "image" && (
                <>
                <input type="file" accept="image/*" onChange={(e) => handleBgImageChange(e)}/>
                {isBase64Image(tempBgValue) && tempBgValue && (
                    <div className="thumbPreview">
                    <img src={tempBgValue} alt="背景预览" />
                    </div>
                )}
                </>
            )}
            {tempBgType === "gradient" && (
            <>
                <label>方向（角度）：
                    <input type="text" value={gradientDirection} onChange={(e) => setGradientDirection(e.target.value)} placeholder="例如：90deg" style={{ width: "100px", marginLeft: "8px" }}/>
                </label>
                <div>当前渐变效果</div>
                <div className="colorBox" style={{ background: `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})` }} />
                <div className={styles.gradientBox}>
                    <label>颜色1
                        <HexColorPicker color={gradientColor1} onChange={setGradientColor1} style={{ width: "150px", height: "150px" }} />
                    </label>
                    <label>颜色2
                        <HexColorPicker color={gradientColor2} onChange={setGradientColor2} style={{ width: "150px", height: "150px" }} />
                    </label>
                </div>
            </>
            )}
            <div className="buttons">
                <button onClick={changeBg}>保存</button>
                <button className="cancelBtn" onClick={closeBgModal}>取消</button>
            </div>
            </div>
        </div>
        )}
        {showTextModal && (
        <div className="overlay modal-overlay visible" onClick={closeTextModal}>
            <div className={`addform ${animateTextModal ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
            <div className="presentationTitle">插入文本框</div>
            <label>文字内容</label>
            <textarea rows={3} value={textContent} onChange={(e) => setTextContent(e.target.value)}/>
            <label>大小</label>
            <input type="number" value={textFontSize} onChange={(e) => setTextFontSize(Number(e.target.value))} />
            <label>字体</label>
            <select value={textFont} onChange={(e) => setTextFont(e.target.value as any)}>
                <option value="Noto Sans SC">Noto Sans SC</option>
                <option value="Noto Serif SC">Noto Serif SC</option>
                <option value="LXGW WenKai">LXGW WenKai</option>
            </select>
            <label>颜色 
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            </label>
            <label>字重</label>
            <select value={textWeight} onChange={(e) => setTextWeight(e.target.value as any)}>
                <option value="light">Light</option>
                <option value="regular">Regular</option>
                <option value="bold">Bold</option>
            </select>
            <label>
                <input
                    type="checkbox"
                    checked={textStyle === "italic"}
                    onChange={(e) => setTextStyle(e.target.checked ? "italic" : "normal")}
                />斜体
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={textDecoration === "underline"}
                    onChange={(e) => setTextDecoration(e.target.checked ? "underline" : "none")}
                />下划线
            </label>
            <div className="buttons">
                <button onClick={handleAddTextElement}>确认</button>
                <button className="cancelBtn" onClick={closeTextModal}>取消</button>
            </div>
            </div>
        </div>
        )}
    </div>
    );
};

export default PresentationPage;