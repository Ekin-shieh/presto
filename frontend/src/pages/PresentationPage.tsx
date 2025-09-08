import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import '../styles/style.css';
import styles from '../styles/PresentationPage.module.css';
import { DndContext, closestCenter } from "@dnd-kit/core";
import {  SortableContext,  useSortable,  verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragEndEvent } from "@dnd-kit/core";
import { Slider, Checkbox, FormControlLabel, Button } from "@mui/material";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5005";

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
    rotation: number;
    flipH: boolean;
    flipV: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
    opacity: number;
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
    //基础
    const { id } = useParams<{ id: string }>();
    const presIdNum = useMemo(() => Number(id), [id]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [dirty, setDirty] = useState(false);

    //页码转换
    const [currentIndex, setCurrentIndex] = useState(0);
    const stageRef = useRef<HTMLDivElement | null>(null);

    //文件信息
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [tempName, setTempName] = useState("");
    const [tempDescription, setTempDescription] = useState("");
    const [tempThumbnail, setTempThumbnail] = useState<string | null>(null);
    const [animateInfoModal, setAnimateInfoModal] = useState(false);

    //修改背景
    const [showBgModal, setShowBgModal] = useState(false);
    const [tempBgType, setTempBgType] = useState<"color" | "image" | "gradient">("color");
    const [tempBgValue, setTempBgValue] = useState<string>("#FFFFFF");
    const [gradientDirection, setGradientDirection] = useState<string>("");
    const [gradientColor1, setGradientColor1] = useState<string>("#ff0000");
    const [gradientColor2, setGradientColor2] = useState<string>("#0000ff");
    const [animateBgModal, setAnimateBgModal] = useState(false);

    //文本框
    const [showTextModal, setShowTextModal] = useState(false);
    const [textContent, setTextContent] = useState("");
    const [textFontSize, setTextFontSize] = useState(16);
    const [textFont, setTextFont] = useState<"Noto Sans SC" | "Noto Serif SC" | "LXGW WenKai">("Noto Sans SC");
    const [textColor, setTextColor] = useState("#000000");
    const [textWeight, setTextWeight] = useState<"light" | "regular" | "bold">("regular");
    const [textStyle, setTextStyle] = useState<"normal" | "italic">("normal");
    const [textDecoration, setTextDecoration] = useState<"none" | "underline">("none");
    const [animateTextModal, setAnimateTextModal] = useState(false);

    //修改元素
    const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const [elementStart, setElementStart] = useState<{ x: number; y: number } | null>(null);
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [resizeDir, setResizeDir] = useState<string | null>(null);
    const [resizeStartSize, setResizeStartSize] = useState<{ width: number; height: number } | null>(null);
    
    //插入视频
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [animateVideoModal, setAnimateVideoModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const [videoAutoPlay, setVideoAutoPlay] = useState(false);

    //提示信息
    const [error, setError] = useState<string>('');
    const [showError, setShowError] = useState(false);
    const [animateError, setAnimateError] = useState(false);

    //确认功能
    const [confirmMessage, setConfirmMessage] = useState<string>('');
    const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [animateConfirm, setAnimateConfirm] = useState(false);

    //退出前确认
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [exitAction, setExitAction] = useState<(() => void) | null>(null);
    const [animateExitConfirm, setAnimateExitConfirm] = useState(false);

    //提示信息
    useEffect(() => {
    if (error) {
        setShowError(true);
        setAnimateError(false);
        requestAnimationFrame(() => setAnimateError(true));
    } else if (showError) {
        setAnimateError(false);
        const t = setTimeout(() => setShowError(false), 400);
        return () => clearTimeout(t);
    }
    }, [error]);

    //确认功能
    const openConfirm = (message: string, onConfirmAction: () => void) => {
        setConfirmMessage(message);
        setOnConfirm(() => onConfirmAction);
        setShowConfirm(true);
        setAnimateConfirm(false);
        requestAnimationFrame(() => setAnimateConfirm(true));
    };

    const closeConfirm = () => {
        setAnimateConfirm(false);
        setTimeout(() => {
            setShowConfirm(false);
            setConfirmMessage('');
            setOnConfirm(null);
        }, 300);
    };

    //加载信息相关
    async function apiRequest<T>(
        method: "GET" | "PUT",
        body?: any
        ): Promise<T | null> {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/store`, {
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

    //保存信息
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
        setSelectedElementIndex(null);
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

    //添加与删除当前幻灯片
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
        setSelectedElementIndex(null);
        setDirty(true);
    };

    const deleteCurrentSlide = () => {
        if (!presentation || sortedSlides.length === 0) return;
        openConfirm("确定要删除当前幻灯片吗？", () => {
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
            setSelectedElementIndex(null);
            setDirty(true);
            setError("已删除当前幻灯片");
        });
    };

    //保存修改
    const handleSave = async () => {
        if (!presentation) return;
        await persist(presentation);
        setDirty(false);
        setError("修改已保存");
    };

    const openExitConfirm = (action: () => void) => {
        setExitAction(() => action);
        setShowExitConfirm(true);
        setAnimateExitConfirm(false);
        requestAnimationFrame(() => setAnimateExitConfirm(true));
    };

    const closeExitConfirm = () => {
        setAnimateExitConfirm(false);
        setTimeout(() => setShowExitConfirm(false), 300);
        setExitAction(null);
    };

    const confirmBeforeExit = (action: () => void) => {
        if (dirty) {
            openExitConfirm(action);
        } else {
            action();
        }
    };

    //切换slide
    const sortedSlides = useMemo(() => {
        return presentation?.slides
            ? [...presentation.slides].sort((a, b) => a.index - b.index)
            : [];
    }, [presentation]);

    const gotoIndex = (i: number) => {
        const max = sortedSlides.length - 1;
        const clamped = Math.max(0, Math.min(max, i));
        setCurrentIndex(clamped);
        setSelectedElementIndex(null);
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

    //注销账号
    const handleLogout = async () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    //修改文件信息
    const openInfoModal = () => {
        if (!presentation) return;
        setTempName(presentation.name);
        setTempDescription(presentation.description || "");
        setTempThumbnail(presentation.thumbnail || null);
        setShowInfoModal(true);
        setAnimateInfoModal(false);
        requestAnimationFrame(() => setAnimateInfoModal(true));
    };

    const closeInfoModal = () => {
        setAnimateInfoModal(false);
        setTimeout(() => setShowInfoModal(false), 300);
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

    const handleInfoSave = async () => {
        if (!presentation) return;
        if (!tempName.trim()) {
            setError("文件名称不能为空");
            return;
        }
        const updated: Presentation = {
            ...presentation,
            name: tempName,
            description: tempDescription,
            thumbnail: tempThumbnail,
        };
        setPresentation(updated);
        await persist(updated);
        setError('文件信息修改成功');
        setShowInfoModal(false);
    };

    //修改背景图
    const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file, 800, 450);
            setTempBgValue(compressed);
        } catch (err) {
            setError("压缩背景图失败");
            console.error("压缩背景图失败:", err);
        }
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

    const changeBg = () => {
        if (!presentation) return;
        if (tempBgType === "gradient") {
            if (!isValidGradientDirection(gradientDirection)) {
            setError("错误：请输入合法的渐变方向，例如 '90deg' 或 'to right'");
            setGradientDirection("");
            return;
            }
        }
        if (tempBgType === "image") {
            if (!tempBgValue || !isBase64Image(tempBgValue)) {
                setError("错误：请选择一张有效的背景图片");
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

    const closeBgModal = () => {
        setAnimateBgModal(false);
        setTimeout(() => setShowBgModal(false), 300);
    };

    //删除整个文件
    const deletePresentation = async () => {
        if (!presentation) return;
        openConfirm("确定要删除这个演示文稿吗？", async () => {
            const data = await fetchStore();
            if (!data) return;
            const updated = data.store.presentations.filter(p => p.id !== presIdNum);
            await saveStore(updated);
            navigate("/dashboard");
        });
    };

    //拖拽幻灯片切换顺序
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

    //确认是不是Base64码
    const isBase64Image = (val: string) => {
        return typeof val === "string" && val.startsWith("data:image/");
    };

    //编辑和插入文本框信息
    const openTextModal = () => {
        setShowTextModal(true);
        setAnimateTextModal(false);
        requestAnimationFrame(() => setAnimateTextModal(true));
    };

    const handleAddTextElement = () => {
        if (!presentation || !textContent.trim()) return;
        if (!textContent.trim()) {
            setError("错误：文本内容不能为空");
            return;
        }
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
        setAnimateTextModal(false);
        setTimeout(() => {
            setShowTextModal(false);
            setTextContent("");
            setTextFontSize(16);
            setTextFont("Noto Sans SC");
            setTextColor("#000000");
            setTextWeight("regular");
            setTextStyle("normal");
            setTextDecoration("none");
        }, 300);
    };

    //元素的操作
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
        let modified = false;
        if (draggingIndex !== null && dragStart && elementStart) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const el = currentSlide.content[draggingIndex];
            const newX = elementStart.x + dx;
            const newY = elementStart.y + dy;
            const { x, y } = clampElementPosition(el, newX, newY, 800, 450);
            if (el.position.x !== x || el.position.y !== y) {
                el.position = { x, y };
                modified = true;
            }
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

            if (el.size.width !== newWidth || el.size.height !== newHeight || el.position.x !== newX || el.position.y !== newY) {
                el.size = { width: newWidth, height: newHeight };
                el.position = { x: newX, y: newY };
                modified = true;
            }
        }
        if (modified) {
            const updated: Presentation = { ...presentation, slides: updatedSlides };
            setPresentation(updated);
            setDirty(true);
        }
    };

    const handleMouseUp = () => {
        setDraggingIndex(null);
        setDragStart(null);
        setElementStart(null);
        setResizingIndex(null);
        setResizeDir(null);
        setResizeStartSize(null);
    };

    const deleteSelectedElement = () => {
        if (!presentation || selectedElementIndex === null) return;
        openConfirm("确定要删除当前选中的元素吗？", () => {
            const updatedSlides = [...presentation.slides];
            const currentSlide = updatedSlides[currentIndex];
            const newContent = currentSlide.content.filter((_, idx) => idx !== selectedElementIndex);
            const reLayered = newContent.map((el, idx) => ({ ...el, layer: idx + 1 }));
            updatedSlides[currentIndex] = { ...currentSlide, content: reLayered };
            setPresentation({ ...presentation, slides: updatedSlides });
            setSelectedElementIndex(null);
            setDirty(true);
        });
    };

    const updateElementLayer = (
        action: "up" | "down" | "top" | "bottom",
        idx: number
        ) => {
        if (!presentation) return;
        const updatedSlides = [...presentation.slides];
        const content = [...updatedSlides[currentIndex].content];
        const element = content[idx];
        if (!element) return;

        switch (action) {
            case "up": {
            const higher = content.find((c) => c.layer === element.layer + 1);
            if (higher) higher.layer -= 1;
            element.layer += 1;
            break;
            }
            case "down": {
            const lower = content.find((c) => c.layer === element.layer - 1);
            if (lower) lower.layer += 1;
            element.layer -= 1;
            break;
            }
            case "top": {
            const maxLayer = Math.max(...content.map((c) => c.layer));
            if (element.layer !== maxLayer) {
                content.forEach((c) => {
                if (c.layer > element.layer) c.layer -= 1;
                });
                element.layer = maxLayer;
            }
            break;
            }
            case "bottom": {
            const minLayer = Math.min(...content.map((c) => c.layer));
            if (element.layer !== minLayer) {
                content.forEach((c) => {
                if (c.layer < element.layer) c.layer += 1;
                });
                element.layer = minLayer;
            }
            break;
            }
        }
        setPresentation({ ...presentation, slides: updatedSlides });
        setDirty(true);
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove]);

    //插入和编辑图片元素
    const MAX_IMAGE_SIZE = 500 * 1024;
    const handleAddImageElement = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!presentation) return;
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_IMAGE_SIZE) {
            setError("图片过大，不能超过 500KB");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
            const newElement: SlideElement = {
                type: "image",
                size: { width: img.width, height: img.height },
                position: { x: 5, y: 5 },
                properties: {
                url: reader.result as string,
                rotation: 0, 
                flipH: false,
                flipV: false,
                brightness: 100,
                contrast: 100,
                saturation: 100,
                opacity: 100,
                },
                layer: presentation.slides[currentIndex].content.length + 1,
            };
            const updatedSlides = [...presentation.slides];
            updatedSlides[currentIndex] = {
                ...presentation.slides[currentIndex],
                content: [...presentation.slides[currentIndex].content, newElement],
            };

            setPresentation({ ...presentation, slides: updatedSlides });
            setSelectedElementIndex(presentation.slides[currentIndex].content.length);
            setDirty(true);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    };

    //插入和编辑视频元素
    const openVideoModal = () => {
        setShowVideoModal(true);
        setAnimateVideoModal(false);
        requestAnimationFrame(() => setAnimateVideoModal(true));
    };

    const closeVideoModal = () => {
        setAnimateVideoModal(false);
        setTimeout(() => {
            setShowVideoModal(false);
            setVideoUrl("");
            setVideoAutoPlay(false);
        }, 300);
    };

    const handleAddVideoElement = () => {
        if (!presentation || !videoUrl.trim()) return;
        if (!videoUrl.trim()) {
            setError("错误：视频地址不能为空");
            return;
        }
        const youtubeEmbedRegex = /^https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+/;
        if (!youtubeEmbedRegex.test(videoUrl.trim())) {
            setError("错误：请输入正确的 YouTube 嵌入视频链接，例如：https://www.youtube.com/embed/xxxx");
            return;
        }
        const currentSlide = presentation.slides[currentIndex];
        if (!currentSlide) return;
        const newElement: SlideElement = {
            type: "video",
            size: { width: 320, height: 160 },
            position: { x: 5, y: 5 },
            properties: {
                url: videoUrl,
                autoPlay: videoAutoPlay,
            },
            layer: currentSlide.content.length + 1,
    };

    const updatedSlides = [...presentation.slides];
    updatedSlides[currentIndex] = {
        ...currentSlide,
        content: [...currentSlide.content, newElement],
    };

    setPresentation({ ...presentation, slides: updatedSlides });
    closeVideoModal();
    setSelectedElementIndex(currentSlide.content.length);
    setDirty(true);
    };

    //位移元素层数组件
    function LayerControls({ idx }: { idx: number }) {
        return (
            <>
                <div className={styles.layerControls}>
                    <Button onClick={() => updateElementLayer("up", idx)}>上移一层</Button>
                    <Button onClick={() => updateElementLayer("down", idx)}>下移一层</Button>
                    <Button onClick={() => updateElementLayer("top", idx)}>移至顶层</Button>
                    <Button onClick={() => updateElementLayer("bottom", idx)}>移至底层</Button>
                </div>
                <button onClick={deleteSelectedElement}>删除该元素</button>
            </>
        );
    }

    //更新元素
    const updateTextProperty = (
        idx: number,
        key: keyof Extract<SlideElement, { type: "text" }>["properties"],
        value: any
        ) => {
        if (!presentation) return;
        const updatedSlides = [...presentation.slides];
        const el = updatedSlides[currentIndex].content[idx];
        if (el.type !== "text") return;

        updatedSlides[currentIndex].content[idx] = {
            ...el,
            properties: { ...el.properties, [key]: value },
        };
        setPresentation({ ...presentation, slides: updatedSlides });
        setDirty(true);
    };

    const updateImageProperty = (
        idx: number,
        key: keyof Extract<SlideElement, { type: "image" }>["properties"],
        value: any
        ) => {
        if (!presentation) return;
        const updatedSlides = [...presentation.slides];
        const el = updatedSlides[currentIndex].content[idx];
        if (el.type !== "image") return;
        updatedSlides[currentIndex].content[idx] = {
            ...el,
            properties: {
            ...el.properties,
            [key]: value,
            },
        };
        setPresentation({ ...presentation, slides: updatedSlides });
        setDirty(true);
    };

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
                            <div>
                                <input type="file" accept="image/*" className={styles.imageInput} onChange={handleAddImageElement}/>
                                插入图片
                            </div>
                            <div onClick={openVideoModal}>添加视频</div>
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
                            <div onClick={() => navigate(`/preview/${presentation!.id}`)}>预览文件</div>
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
                    if (el.type === "image") {
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
                            backgroundImage: `url(${el.properties.url})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            filter: `brightness(${el.properties.brightness}%) contrast(${el.properties.contrast}%) saturate(${el.properties.saturation}%)`,
                            opacity: el.properties.opacity / 100,
                            transform: `
                            rotate(${el.properties.rotation}deg)
                            scaleX(${el.properties.flipH ? -1 : 1})
                            scaleY(${el.properties.flipV ? -1 : 1})
                            `,
                            border: selectedElementIndex === idx ? "1px dashed gray" : "none",
                            zIndex: el.layer,
                            cursor: draggingIndex === idx ? "grabbing" : "grab",
                        }}
                        >
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
                    if (el.type === "video") {
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
                            border: selectedElementIndex === idx ? "1px dashed gray" : "none",
                            zIndex: el.layer,
                            cursor: draggingIndex === idx ? "grabbing" : "grab",
                            }}
                        >
                            <iframe
                            width="100%"
                            height="100%"
                            src={`${el.properties.url}${
                                el.properties.url.includes("?") ? "&" : "?"
                            }autoplay=${el.properties.autoPlay ? "1" : "0"}&mute=1`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            />
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
        <div className={styles.elementBox}>
        {selectedElementIndex !== null ? (
            (() => {
            const el = sortedSlides[currentIndex].content[selectedElementIndex];
            if (el.type === "text") {
                return (
                    <div className={styles.elementForm}>
                        <h3>编辑文本元素</h3>
                        <label>文字内容</label>
                        <textarea rows={3} value={el.properties.text} onChange={(e) => updateTextProperty(selectedElementIndex!, "text", e.target.value)} />
                        <label>字号</label>
                        <input type="number" value={el.properties.fontSize} onChange={(e) => updateTextProperty(selectedElementIndex!, "fontSize", Number(e.target.value))} />
                        <label>字体</label>
                        <select value={el.properties.fontFamily} onChange={(e) => updateTextProperty(selectedElementIndex!, "fontFamily", e.target.value as any)} >
                            <option value="Noto Sans SC">Noto Sans SC</option>
                            <option value="Noto Serif SC">Noto Serif SC</option>
                            <option value="LXGW WenKai">LXGW WenKai</option>
                        </select>
                        <label>颜色</label>
                        <input type="color" value={el.properties.color} onChange={(e) => updateTextProperty(selectedElementIndex!, "color", e.target.value)} />
                        <label>字重</label>
                        <select value={el.properties.fontWeight} onChange={(e) => updateTextProperty(selectedElementIndex!, "fontWeight", e.target.value as any)} >
                            <option value="light">Light</option>
                            <option value="regular">Regular</option>
                            <option value="bold">Bold</option>
                        </select>
                        <label>
                            <input type="checkbox" checked={el.properties.fontStyle === "italic"} onChange={(e) => updateTextProperty( selectedElementIndex!, "fontStyle", e.target.checked ? "italic" : "normal")} />斜体
                        </label>
                        <label>
                            <input type="checkbox" checked={el.properties.textDecoration === "underline"} onChange={(e) => updateTextProperty( selectedElementIndex!, "textDecoration", e.target.checked ? "underline" : "none")} />下划线
                        </label>
                        <LayerControls idx={selectedElementIndex!} />
                    </div>
                );
            }
            if (el.type === "image") {
            return (
            <div className={styles.elementForm}>
                <h3>编辑图片元素</h3>
                <label>亮度</label>
                <Slider
                    value={el.properties.brightness}
                    min={0}
                    max={200}
                    step={1}
                    onChange={(_, value) =>
                    updateImageProperty(selectedElementIndex!, "brightness", value as number)
                    }
                />
                <label>对比度</label>
                <Slider
                    value={el.properties.contrast}
                    min={0}
                    max={200}
                    step={1}
                    onChange={(_, value) =>
                    updateImageProperty(selectedElementIndex!, "contrast", value as number)
                    }
                />
                <label>饱和度</label>
                <Slider
                    value={el.properties.saturation}
                    min={0}
                    max={200}
                    step={1}
                    onChange={(_, value) =>
                    updateImageProperty(selectedElementIndex!, "saturation", value as number)
                    }
                />
                <label>透明度</label>
                <Slider
                    value={el.properties.opacity}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(_, value) =>
                    updateImageProperty(selectedElementIndex!, "opacity", value as number)
                    }
                />
                <label>旋转角度</label>
                <Slider
                    value={el.properties.rotation}
                    min={-180}
                    max={180}
                    step={1}
                    onChange={(_, value) =>
                    updateImageProperty(selectedElementIndex!, "rotation", value as number)
                    }
                />
                <FormControlLabel
                    control={
                    <Checkbox
                        checked={el.properties.flipH}
                        onChange={(e) =>
                        updateImageProperty(selectedElementIndex!, "flipH", e.target.checked)
                        }
                    />
                    }
                    label="水平翻转"
                />
                <FormControlLabel
                    control={
                    <Checkbox
                        checked={el.properties.flipV}
                        onChange={(e) =>
                        updateImageProperty(selectedElementIndex!, "flipV", e.target.checked)
                        }
                    />
                    }
                    label="垂直翻转"
                />
                <LayerControls idx={selectedElementIndex!} />
            </div>
            );
            }
            if (el.type === "video") {
            return (
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
                    const updatedSlides = [...presentation!.slides];
                    updatedSlides[currentIndex].content[selectedElementIndex] = {
                    ...el,
                    properties: { ...el.properties, url: value },
                    };
                    setPresentation({ ...presentation!, slides: updatedSlides });
                    setDirty(true);
                }}
                />
                <label>
                    <input
                    type="checkbox"
                    checked={el.properties.autoPlay}
                    onChange={(e) => {
                        const updatedSlides = [...presentation!.slides];
                        updatedSlides[currentIndex].content[selectedElementIndex] = {
                        ...el,
                        properties: { ...el.properties, autoPlay: e.target.checked },
                        };
                        setPresentation({ ...presentation!, slides: updatedSlides });
                        setDirty(true);
                    }}
                    />自动播放
                </label>
                <LayerControls idx={selectedElementIndex!} />
            </div>
            );
            }
            return <div>该类型元素暂不支持编辑</div>;
            })()
        ) : (
            <div className="gray">当前无选中可编辑元素</div>
        )}
        </div>
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
            <label>字号</label>
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
        {showVideoModal && (
        <div className="overlay modal-overlay visible" onClick={closeVideoModal}>
            <div className={`addform ${animateVideoModal ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
            <div className="presentationTitle">插入视频</div>
            <label>视频 URL（YouTube 嵌入链接）</label>
            <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="例如：https://www.youtube.com/embed/xxxx"
            />
            <label>
                <input
                type="checkbox"
                checked={videoAutoPlay}
                onChange={(e) => setVideoAutoPlay(e.target.checked)}
                />
                自动播放
            </label>
            <div className="buttons">
                <button onClick={handleAddVideoElement}>确认</button>
                <button className="cancelBtn" onClick={closeVideoModal}>取消</button>
            </div>
            </div>
        </div>
        )}
        {showError && (
        <div className="overlay error-overlay visible" onClick={() => setError('')}>
            <div className={`error-message ${animateError ? 'show' : 'hide'}`}>
            {error}
            </div>
        </div>
        )}
        {showConfirm && (
        <div className="overlay modal-overlay visible" onClick={closeConfirm}>
            <div className={`confirm ${animateConfirm ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()} >
            <div>{confirmMessage}</div>
            <div className="buttons">
                <button onClick={() => { if (onConfirm) onConfirm(); closeConfirm();}}>确认</button>
                <button className="cancelBtn" onClick={closeConfirm}>取消</button>
            </div>
            </div>
        </div>
        )}
        {showExitConfirm && (
        <div className="overlay modal-overlay visible" onClick={closeExitConfirm}>
            <div className={`confirm  ${animateExitConfirm ? "show" : "hide"}`} onClick={(e) => e.stopPropagation()}>
            <div>您有未保存的更改，是否保存后退出？</div>
            <div className="buttons">
                <button
                onClick={async () => {
                    await handleSave();
                    if (exitAction) exitAction();
                    closeExitConfirm();
                }} >保存</button>
                <button
                onClick={() => {
                    if (exitAction) exitAction();
                    closeExitConfirm();
                }} >不保存</button>
                <button className="cancelBtn" onClick={closeExitConfirm}>取消</button>
            </div>
            </div>
        </div>
        )}
    </div>
    );
};

export default PresentationPage;