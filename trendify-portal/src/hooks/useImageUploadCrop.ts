import { getCroppedImg } from "@/utils/common.util";
import { Area } from "node_modules/react-easy-crop/types";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadCropProps {
  aspect: number;
  uploadAction: (blob: Blob) => Promise<void>;
  reloadAction?: () => Promise<void>;
}

export const useImageUploadCrop = (props: UseImageUploadCropProps) => {
  const { aspect, uploadAction, reloadAction } = props;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsCropOpen(true);
    };

    e.target.value = "";
  };

  const handleCrop = useCallback(
    async (croppedArea: Area) => {
      if (!imageSrc) return;

      const blob = await getCroppedImg(imageSrc, croppedArea);
      const previewUrl = URL.createObjectURL(blob);
      setLocalPreview(previewUrl);
      setIsCropOpen(false);

      try {
        await uploadAction(blob);

        if (reloadAction) {
          await reloadAction();
        }
      } catch (error) {
        console.error("Upload image error:", error);
        setLocalPreview(null);
      }
    },
    [imageSrc, uploadAction, reloadAction],
  );

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  return {
    aspect,
    inputRef,
    imageSrc,
    isCropOpen,
    localPreview,
    openFilePicker,
    handleFileChange,
    handleCrop,
    closeCrop: () => setIsCropOpen(false),
  };
};
