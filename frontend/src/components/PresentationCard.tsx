import React from "react";
import styles from "../styles/Dashboard.module.css";

interface PresentationCardProps {
  id: number;
  name: string;
  description?: string;
  slidesCount: number;
  thumbnail?: string;
  isSelected: boolean;
  selectMode: boolean;
  onSelect: (id: number) => void;
  onOpen: (id: number) => void;
}

const PresentationCard: React.FC<PresentationCardProps> = ({
  id,
  name,
  description,
  slidesCount,
  thumbnail,
  isSelected,
  selectMode,
  onSelect,
  onOpen,
}) => {
  return (
    <div
      className={styles.presentationCard}
      style={{
        backgroundImage: thumbnail ? `url(${thumbnail})` : "none",
      }}
      onClick={() => {
        if (selectMode) {
          onSelect(id);
        } else {
          onOpen(id);
        }
      }}
    >
      {selectMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(id)}
          className={styles.checkbox}
          onClick={(e) => e.stopPropagation()} // 防止点击checkbox触发父div点击事件
        />
      )}
      <div className={styles.presentationInfo}>
        <div className={styles.presentationTitle}>{name}</div>
        <div>幻灯片数量：{slidesCount}</div>
        <p>{description?.trim() ? description : "无特定描述"}</p>
      </div>
    </div>
  );
};

export default PresentationCard;