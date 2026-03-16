import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  IFileStorageService,
  IPresignedUrlResult,
  IHeadObjectResult,
} from "@/application/services/fileStorage.service";
import s3Config, { s3Client } from "@/infrastructure/configs/s3.config";

class S3Service implements IFileStorageService {
  private readonly bucket = s3Config.bucket;
  private readonly cdnDomain = s3Config.cdnDomain;
  private readonly defaultExpiry = s3Config.presignedUrlExpiry;

  // =========================================================================
  // UPLOAD
  // =========================================================================

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return this.getPublicUrl(key);
  }

  // =========================================================================
  // DELETE
  // =========================================================================

  async deleteFile(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    // S3 batch delete supports max 1000 objects per request
    const chunks = this.chunkArray(keys, 1000);

    for (const chunk of chunks) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: chunk.map((key) => ({ Key: key })),
            Quiet: true,
          },
        }),
      );
    }
  }

  // =========================================================================
  // PRESIGNED URL
  // =========================================================================

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn?: number,
  ): Promise<IPresignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn ?? this.defaultExpiry,
    });

    return { url, key };
  }

  // =========================================================================
  // URL GENERATION
  // =========================================================================

  getPublicUrl(key: string): string {
    if (this.cdnDomain) {
      return `https://${this.cdnDomain}/${key}`;
    }

    // Fallback to S3 URL
    if (s3Config.endpoint) {
      return `${s3Config.endpoint}/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }

  // =========================================================================
  // DOWNLOAD
  // =========================================================================

  async downloadBuffer(key: string): Promise<Buffer> {
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error(`Empty body when downloading S3 object: ${key}`);
    }

    // result.Body is a ReadableStream / SdkStream in AWS SDK v3
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  // =========================================================================
  // HEAD OBJECT (verify file exists)
  // =========================================================================

  async headObject(key: string): Promise<IHeadObjectResult | null> {
    try {
      const result = await s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? "application/octet-stream",
      };
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export default S3Service;
