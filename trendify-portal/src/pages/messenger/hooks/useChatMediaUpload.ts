import { useState, useCallback } from "react";
import { presigned, confirmUpload } from "@/stores/upload/api";
import { EMediaPurpose } from "@/interfaces/common.interface";
import axios from "axios";

// ============================================================================
// TYPES
// ============================================================================

export interface IUploadingMedia {
  localId: string;
  file: File;
  localUrl: string;
  progress: number;
  status: "uploading" | "confirming" | "done" | "error";
  mediaId?: string;
  mediaUrl?: string;
  error?: string;
}

interface IUploadResult {
  mediaId: string;
  url: string;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to upload media files for chat messages.
 * Uses the presigned URL flow: request presigned → PUT to S3 → confirm upload.
 */
export const useChatMediaUpload = () => {
  const [uploads, setUploads] = useState<IUploadingMedia[]>([]);

  const updateUpload = (localId: string, patch: Partial<IUploadingMedia>) => {
    setUploads((prev) =>
      prev.map((u) => (u.localId === localId ? { ...u, ...patch } : u)),
    );
  };

  /**
   * Upload a single file and return { mediaId, url }.
   */
  const uploadFile = useCallback(async (file: File): Promise<IUploadResult> => {
    // 1. Request presigned URL
    const presignedRes = await presigned({
      purpose: EMediaPurpose.CHAT_MEDIA,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });

    const { uploadUrl, mediaId } = presignedRes.data.data;

    // 2. Upload file directly to S3
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });

    // 3. Confirm upload
    const confirmRes = await confirmUpload({ mediaId });
    const confirmedMedia = confirmRes.data.data;

    return {
      mediaId: confirmedMedia.id,
      url: confirmedMedia.url,
    };
  }, []);

  /**
   * Upload a single file with progress tracking.
   */
  const uploadFileWithProgress = useCallback(
    async (
      localId: string,
      file: File,
      localUrl: string,
    ): Promise<IUploadResult | null> => {
      const entry: IUploadingMedia = {
        localId,
        file,
        localUrl,
        progress: 0,
        status: "uploading",
      };
      setUploads((prev) => [...prev, entry]);

      try {
        // 1. Request presigned URL
        const presignedRes = await presigned({
          purpose: EMediaPurpose.CHAT_MEDIA,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });
        const { uploadUrl, mediaId } = presignedRes.data.data;

        // 2. Upload to S3 with progress
        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              updateUpload(localId, { progress: pct });
            }
          },
        });

        // 3. Confirm upload
        updateUpload(localId, { status: "confirming", progress: 100 });
        const confirmRes = await confirmUpload({ mediaId });
        const confirmedMedia = confirmRes.data.data;

        const result = { mediaId: confirmedMedia.id, url: confirmedMedia.url };
        updateUpload(localId, {
          status: "done",
          mediaId: result.mediaId,
          mediaUrl: result.url,
        });

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        updateUpload(localId, { status: "error", error: errorMsg });
        return null;
      }
    },
    [],
  );

  /**
   * Upload multiple files in parallel and return their mediaIds.
   */
  const uploadMultipleFiles = useCallback(
    async (files: { localId: string; file: File; localUrl: string }[]): Promise<IUploadResult[]> => {
      const results = await Promise.all(
        files.map((f) => uploadFileWithProgress(f.localId, f.file, f.localUrl)),
      );
      return results.filter((r): r is IUploadResult => r !== null);
    },
    [uploadFileWithProgress],
  );

  /**
   * Upload an audio blob (from voice recording).
   */
  const uploadVoice = useCallback(
    async (audioBlob: Blob): Promise<IUploadResult | null> => {
      const file = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: audioBlob.type || "audio/webm",
      });
      const localId = `voice-${Date.now()}`;
      const localUrl = URL.createObjectURL(audioBlob);
      return uploadFileWithProgress(localId, file, localUrl);
    },
    [uploadFileWithProgress],
  );

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const removeUpload = useCallback((localId: string) => {
    setUploads((prev) => prev.filter((u) => u.localId !== localId));
  }, []);

  return {
    uploads,
    uploadFile,
    uploadFileWithProgress,
    uploadMultipleFiles,
    uploadVoice,
    clearUploads,
    removeUpload,
  };
};
