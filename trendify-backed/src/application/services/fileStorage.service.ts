export interface IPresignedUrlResult {
  url: string;
  key: string;
}

export interface IHeadObjectResult {
  contentLength: number;
  contentType: string;
}

export interface IFileStorageService {
  /** Upload a buffer directly to storage with a specific key */
  uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string>;

  /** Delete a single file by key */
  deleteFile(key: string): Promise<void>;

  /** Delete multiple files by keys (batch) */
  deleteFiles(keys: string[]): Promise<void>;

  /** Generate a presigned URL for client-side direct upload */
  generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<IPresignedUrlResult>;

  /** Get the public URL (or CDN URL) for an object */
  getPublicUrl(key: string): string;

  /** Download an object from storage and return its contents as a Buffer */
  downloadBuffer(key: string): Promise<Buffer>;

  /** Check if an object exists and return its metadata */
  headObject(key: string): Promise<IHeadObjectResult | null>;
}
