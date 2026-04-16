import { useCallback, useMemo, useRef, useState } from "react";
import { Modal } from "antd";
import useEmblaCarousel from "embla-carousel-react";

import { IPostMedia } from "@/interfaces/post.interface";
import Icon from "@/components/icon/Icon";

interface IProps {
  media: IPostMedia[];
}

/** Pick the best variant URL for display. Prefer MEDIUM > SMALL > original url */
function getDisplayUrl(item: IPostMedia): string {
  if (item.variants?.MEDIUM) return item.variants.MEDIUM;
  if (item.variants?.SMALL) return item.variants.SMALL;
  if (item.variants?.original) return item.variants.original;
  return item.url;
}

/** Pick the highest quality URL for preview */
function getPreviewUrl(item: IPostMedia): string {
  if (item.variants?.original) return item.variants.original;
  if (item.variants?.LARGE) return item.variants.LARGE;
  if (item.variants?.MEDIUM) return item.variants.MEDIUM;
  return item.url;
}

/** Get thumbnail URL for video (SMALL variant is the thumbnail) */
function getThumbnailUrl(item: IPostMedia): string {
  if (item.thumbnail) return item.thumbnail;
  if (item.variants?.SMALL) return item.variants.SMALL;
  return item.url;
}

/** Format duration in seconds to mm:ss */
function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isVideo(item: IPostMedia): boolean {
  return item.type === "video";
}

// ============================================================================
// VIDEO CARD — Thumbnail + play button overlay in the feed
// ============================================================================

interface VideoCardProps {
  item: IPostMedia;
  className?: string;
  style?: React.CSSProperties;
  onClick: () => void;
}

const VideoCard = ({ item, className = "", style, onClick }: VideoCardProps) => {
  const thumbUrl = getThumbnailUrl(item);
  const videoUrl = item.variants?.large || item.variants?.original || item.url;
  const [isMuted, setIsMuted] = useState(true);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className={`post-media-video-card ${className}`} onClick={onClick} style={style}>
      <video
        src={videoUrl}
        poster={thumbUrl !== videoUrl ? thumbUrl : undefined}
        className="post-media-img"
        preload="metadata"
        autoPlay
        loop
        muted={isMuted}
        playsInline
      />
      {item.duration && (
        <div className="post-media-video-duration">{formatDuration(item.duration)}</div>
      )}
      <div 
        className="post-media-video-mute" 
        onClick={handleToggleMute}
      >
        {isMuted ? "🔇" : "🔊"}
      </div>
    </div>
  );
};

// ============================================================================
// VIDEO PLAYER — Full player in the preview modal
// ============================================================================

interface VideoPlayerProps {
  item: IPostMedia;
}

const VideoPlayer = ({ item }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = getPreviewUrl(item);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      poster={getThumbnailUrl(item)}
      controls
      autoPlay
      playsInline
      className="post-media-preview-video"
      controlsList="nodownload"
      preload="metadata"
    />
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PostMedia = ({ media }: IProps) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const sortedMedia = useMemo(() => [...media].sort((a, b) => a.order - b.order), [media]);

  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    loop: false,
  });

  const handleOpenPreview = useCallback((index: number) => {
    setPreviewIndex(index);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setPreviewIndex((prev) => {
      if (prev === null || prev <= 0) return sortedMedia.length - 1;
      return prev - 1;
    });
  }, [sortedMedia.length]);

  const handleNext = useCallback(() => {
    setPreviewIndex((prev) => {
      if (prev === null || prev >= sortedMedia.length - 1) return 0;
      return prev + 1;
    });
  }, [sortedMedia.length]);

  if (sortedMedia.length === 0) return null;

  const previewItem = previewIndex !== null ? sortedMedia[previewIndex] : null;

  const getMediaRatio = (item: IPostMedia) => {
    if (item.width && item.height) return item.width / item.height;
    if (isVideo(item)) return 16 / 9; // Default to landscape 16:9 for videos without dim info
    return 1;
  };

  // ---- Render a media item (image or video) in the card/gallery ----
  const renderMediaCard = (item: IPostMedia, index: number, singleClass = "") => {
    let style: React.CSSProperties = {};

    if (singleClass === "post-media-card--multi") {
      const ratio = getMediaRatio(item);
      const safeRatio = Math.max(0.5, Math.min(ratio, 2.5)); // keep it somewhat sane
      style = { aspectRatio: `${safeRatio}` };
    }

    if (isVideo(item)) {
      return (
        <VideoCard
          key={item.mediaId}
          item={item}
          className={singleClass}
          style={style}
          onClick={() => handleOpenPreview(index)}
        />
      );
    }

    return (
      <div
        key={item.mediaId}
        className={`post-media-card ${singleClass}`}
        onClick={() => handleOpenPreview(index)}
        style={style}
      >
        <img
          src={getDisplayUrl(item)}
          alt={item.altText || "post image"}
          className="post-media-img"
          draggable={false}
          loading="lazy"
        />
      </div>
    );
  };

  // ---- Render preview content (image or video) in the modal ----
  const renderPreviewContent = (item: IPostMedia) => {
    if (isVideo(item)) {
      return <VideoPlayer item={item} />;
    }

    return (
      <img
        src={getPreviewUrl(item)}
        alt={item.altText || "preview"}
        className="post-media-preview-img"
      />
    );
  };

  // Single media — full-width or strictly bounded, no carousel needed
  if (sortedMedia.length === 1) {
    const item = sortedMedia[0];
    const ratio = getMediaRatio(item);
    let cardClass = "post-media-card--single";
    if (ratio >= 1.45) { // Roughly 1.5 threshold
      cardClass += " post-media-card--single-landscape";
    } else {
      cardClass += " post-media-card--single-portrait";
    }

    return (
      <>
        <div className="post-media-gallery post-media-gallery--single">
          {renderMediaCard(item, 0, cardClass)}
        </div>

        <Modal
          open={previewIndex !== null}
          onCancel={handleClosePreview}
          footer={null}
          centered
          width="auto"
          className="post-media-preview-modal"
          destroyOnHidden
          styles={{ mask: { backgroundColor: "#000" } }}
        >
          {previewItem && renderPreviewContent(previewItem)}
        </Modal>
      </>
    );
  }

  // 2+ items — dynamic aspect ratio carousel
  return (
    <>
      <div className="post-media-gallery-wrapper">
        <div className="post-media-gallery post-media-gallery--multi" ref={emblaRef}>
          <div className="post-media-gallery__container">
            {sortedMedia.map((item, index) => renderMediaCard(item, index, "post-media-card--multi"))}
          </div>
        </div>
      </div>

      <Modal
        open={previewIndex !== null}
        onCancel={handleClosePreview}
        footer={null}
        centered
        width="auto"
        className="post-media-preview-modal"
        destroyOnHidden
        styles={{ mask: { backgroundColor: "#000" } }}
      >
        {previewItem && (
          <div className="post-media-preview-body">
            {sortedMedia.length > 1 && (
              <button
                className="post-media-preview-nav post-media-preview-nav--prev"
                onClick={handlePrev}
              >
                <Icon name="ArrowIcon" size={20} />
              </button>
            )}

            {renderPreviewContent(previewItem)}

            {sortedMedia.length > 1 && (
              <button
                className="post-media-preview-nav post-media-preview-nav--next"
                onClick={handleNext}
              >
                <Icon name="ArrowIcon" size={20} />
              </button>
            )}

            <div className="post-media-preview-counter">
              {(previewIndex ?? 0) + 1} / {sortedMedia.length}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PostMedia;
