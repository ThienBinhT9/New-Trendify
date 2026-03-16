import { message, Upload } from "antd";

import moment from "moment";
import { Area } from "react-easy-crop";

const toCamelCase = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
};

const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToCamelCase = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertToCamelCase(v)) as unknown as T;
  } else if (obj !== null && obj !== undefined && typeof obj === "object") {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      return {
        ...result,
        [camelKey]: convertToCamelCase(obj[key]),
      };
    }, {}) as T;
  }
  return obj as T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToSnakeCase = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertToSnakeCase(v)) as unknown as T;
  } else if (obj !== null && obj !== undefined && typeof obj === "object") {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = toSnakeCase(key);
      return {
        ...result,
        [snakeKey]: convertToSnakeCase(obj[key]),
      };
    }, {}) as T;
  }
  return obj as T;
};

export const toTitleCase = (input: string): string => {
  return input
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const getProfileTab = (path: string) => {
  const pathnameArr = path.split("/");

  return pathnameArr[pathnameArr.length - 1];
};

export const getSettingTab = (path: string) => {
  const pathnameArr = path.split("/");

  return pathnameArr[pathnameArr.length - 1];
};

export const formatDate = (date: string, format: string = "DD/MMM/YYYY") => {
  return moment(date).format(format);
};

export const handleBeforeUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");

  if (isImage) {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(`Image ${file.name} is larger than 2MB.`);
      return Upload.LIST_IGNORE;
    }
  }

  return false;
};

export function formatTimeFromNow(dateInput: string | number | Date): string {
  const now = moment();
  const date = moment(dateInput);
  const diffInSeconds = now.diff(date, "seconds");
  const diffInMinutes = now.diff(date, "minutes");
  const diffInHours = now.diff(date, "hours");
  const diffInDays = now.diff(date, "days");

  if (diffInSeconds < 60) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const isSameYear = now.year() === date.year();
  const formatString = isSameYear ? "MMMM D [at] HH:mm" : "MMMM D, YYYY [at] HH:mm";

  return date.format(formatString);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });
}

export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(blob);
    }, "image/jpeg");
  });
}

export const formatNumberCount = (count: number): string => {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(count % 1_000_000 === 0 ? 0 : 1) + "M";
  }

  if (count >= 1_000) {
    return (count / 1_000).toFixed(count % 1_000 === 0 ? 0 : 1) + "K";
  }

  return count.toString();
};
