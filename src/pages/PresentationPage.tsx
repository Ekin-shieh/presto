import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import '../styles/style.css';
import styles from '../styles/PresentationPage.module.css';

type SlideElement =
| {
    type: "text";
    size: { width: number; height: number };
    position: { x: number; y: number };
    properties: {
        text: string;
        fontSize: number;
        color: string;
        fontFamily: string;
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
        type: "color" | "image";
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
    const [tempBgType, setTempBgType] = useState<"color" | "image">("color");
    const [tempBgValue, setTempBgValue] = useState<string>("#FFFFFF");

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
            if (res.status === 401) {
                navigate("/");
                return null;
            }
            if (!res.ok) throw new Error("Failed to fetch store");
            return (await res.json()) as StoreResponse;
        } catch (e) {
            console.error(e);
            return null;
        }
    }, [navigate]);

    const saveStore = useCallback(
        async (presentations: Presentation[]) => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5005/store", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token ?? ""}`,
                },
                body: JSON.stringify({ store: { presentations } }),
                });
                if (res.status === 401) {
                    navigate("/");
                    return;
                }
                if (!res.ok) throw new Error("Failed to save store");
            } catch (e) {
                console.error(e);
            }
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
            background: {
            type: "color",
            value: "#FFFFFF"
            },
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

        const newIndex =
            currentIndex > 0 ? currentIndex - 1 : 0;

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
    };

    const compressToThumbnail = (file: File, targetWidth: number, targetHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas context not found");

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const handleTempThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedBase64 = await compressToThumbnail(file, 160, 90);
            setTempThumbnail(compressedBase64);
        } catch (err) {
            console.error("压缩缩略图失败:", err);
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
        setTempBgType(currentBg.type as "color" | "image");
        setTempBgValue(currentBg.value);
        setShowBgModal(true);
    };

    const changeBg = () => {
        if (!presentation) return;
        const updatedSlides = [...presentation.slides];
        updatedSlides[currentIndex] = {
        ...updatedSlides[currentIndex],
        background: { type: tempBgType, value: tempBgValue },
        };
        setPresentation({ ...presentation, slides: updatedSlides });
        setDirty(true);
        setShowBgModal(false);
    }

    const isBase64Image = (val: string) => {
        return typeof val === "string" && val.startsWith("data:image/");
    };

    if (loading) return <div className="load">加载中...</div>;
    if (!presentation) return <div className="load">未找到演示文稿</div>;

    return (
    <div className='container'>
        <div className={styles.aside}>
            {sortedSlides.length > 0 ? (
                sortedSlides.map((s, idx) => (
                <button
                    key={s.id}
                    onClick={() => gotoIndex(idx)}
                    className={styles.slides}
                    title={`转到第 ${idx + 1} 张`}
                    style={{
                    border: idx === currentIndex ? "2px solid #4f46e5" : "1px solid #ddd"
                    }}
                >
                    <span style={{ color: idx === currentIndex ? "#4f46e5" : "#666" }}>
                    幻灯片{idx + 1}
                    </span>
                </button>
                ))
            ) : (
                <div className="gray">暂无幻灯片</div>
            )}
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
                            <div>文本内容</div>
                            <div>插入图片</div>
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
                            <div>导出PDF</div>
                        </div>
                    </div>
                    <div className={styles.menuItem}>退出
                        <div className={styles.submenu}>
                            <div onClick={() => navigate('/dashboard')}>返回主页</div>
                            <div onClick={handleLogout}>退出登录</div>
                        </div>
                    </div>
                </div>
            </header>
            <main ref={stageRef} onWheel={onStageWheel} className={styles.slideMain}>
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
                        : { backgroundImage: `url(${sortedSlides[currentIndex].background.value})` }
                    }
                    >
                    {/* 渲染幻灯片内容 */}
                    </div>
                ) : (
                    <button
                    onClick={addSlide}
                    className={styles.addFirstSlide}
                    title="点击添加第一张幻灯片"
                    >
                    点击添加第一张幻灯片
                    </button>
                )}
            </main>
        </div>
        <div className={styles.elementBox}></div>
        {showInfoModal && (
        <div className="overlay" onClick={() => setShowInfoModal(false)}>
            <div className='addform' onClick={(e) => e.stopPropagation()}>
                <div className='presentationTitle'>编辑文件信息</div>

                <label>修改名称：</label>
                <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="输入幻灯片名称"
                />

                <label>修改描述：</label>
                <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder="输入描述"
                    rows={4}
                />

                <label>修改封面:</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleTempThumbnailChange}
                />

                {tempThumbnail && (
                    <div className='thumbPreview'>
                    <img src={tempThumbnail} alt="封面预览" />
                    </div>
                )}

                <div className='buttons'>
                    <button onClick={handleInfoSave}>保存</button>
                    <button className="cancelBtn" onClick={() => setShowInfoModal(false)}>
                    取消
                    </button>
                </div>
            </div>
        </div>
        )}
        {showBgModal && (
        <div className="overlay" onClick={() => setShowBgModal(false)}>
            <div className="addform" onClick={(e) => e.stopPropagation()}>
            <div className="presentationTitle">编辑背景</div>
            <div className="radioGroup">
                <label>
                <input
                    type="radio"
                    checked={tempBgType === "color"}
                    onChange={() => setTempBgType("color")}
                />
                颜色
                </label>
                <label>
                <input
                    type="radio"
                    checked={tempBgType === "image"}
                    onChange={() => setTempBgType("image")}
                />
                图片
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
                <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                        const compressed = await compressToThumbnail(file, 800, 450);
                        setTempBgValue(compressed);
                    } catch (err) {
                        console.error("压缩图片失败", err);
                    }
                    }}
                />
                {isBase64Image(tempBgValue) && tempBgValue && (
                    <div className="thumbPreview">
                    <img src={tempBgValue} alt="背景预览" />
                    </div>
                )}
                </>
            )}
            <div className="buttons">
                <button onClick={changeBg}>保存</button>
                <button className="cancelBtn" onClick={() => setShowBgModal(false)}>取消</button>
            </div>
            </div>
        </div>
        )}
    </div>
    );
};

export default PresentationPage;