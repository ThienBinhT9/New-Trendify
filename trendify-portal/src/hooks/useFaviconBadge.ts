import { useEffect } from "react";
import { useAppSelector } from "@/stores";

/**
 * useFaviconBadge - Dynamic browser favicon badge for unread notifications.
 * Draws a small red dot on the top-right of the favicon if unreadCount > 0.
 */
const useFaviconBadge = () => {
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);

  useEffect(() => {
    const originalIconHref = "/public/favicon.ico";
    const faviconElement = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!faviconElement) return;

    if (unreadCount <= 0) {
      faviconElement.href = originalIconHref;
      return;
    }

    const img = new Image();
    img.src = originalIconHref;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 64, 64);

      const radius = 10;
      const centerX = 56;
      const centerY = 14;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#ff4d4f";
      ctx.fill();

      faviconElement.href = canvas.toDataURL("image/png");
    };

    img.onerror = () => {
      console.error("[useFaviconBadge] Failed to load favicon image");
    };
  }, [unreadCount]);
};

export default useFaviconBadge;
