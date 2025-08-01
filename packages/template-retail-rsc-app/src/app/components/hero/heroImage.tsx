interface HeroImageProps {
    src: string
    alt: string
    className?: string
    style?: React.CSSProperties
}

export default function HeroImage({src, alt, className = '', style = {}}: HeroImageProps) {
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            style={style}
            loading="eager"
            fetchPriority="high"
            decoding="async"
        />
    )
}
