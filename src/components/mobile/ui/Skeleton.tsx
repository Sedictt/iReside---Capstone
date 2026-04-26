import styles from "./Skeleton.module.css";

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

export default function Skeleton({
    width = "100%",
    height = "100%",
    borderRadius = "8px",
    className = "",
    style = {},
}: SkeletonProps) {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style,
            }}
        />
    );
}
