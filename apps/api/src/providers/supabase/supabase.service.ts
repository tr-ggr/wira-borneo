import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseRuntimeConfig } from '../../config/supabase.config';

export class SupabaseProviderError extends Error {
  override readonly cause?: unknown;

  constructor(
    message: string,
    public readonly operation: string,
    public readonly status?: number,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'SupabaseProviderError';
    this.cause = cause;
  }
}

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly defaultBucket: string;

  constructor() {
    const config = getSupabaseRuntimeConfig();
    this.client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
    this.defaultBucket = config.supabaseBucket;
  }

  /**
   * Uploads a file to a Supabase storage bucket.
   * 
   * @param filePath The destination path within the bucket (e.g., 'avatars/user-1.png').
   * @param fileData The file content (Buffer, ArrayBuffer, Blob, etc.).
   * @param options Optional upload settings.
   * @returns The public URL of the uploaded file.
   */
  async uploadFile(
    filePath: string,
    fileData: Buffer | ArrayBuffer | Blob | string | FormData | ReadableStream<Uint8Array>,
    options: {
      bucket?: string;
      contentType?: string;
      upsert?: boolean;
    } = {},
  ): Promise<string> {
    const bucket = options.bucket || this.defaultBucket;
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType: options.contentType,
        upsert: options.upsert ?? false,
      });

    if (error) {
      this.logger.error(`Upload to bucket "${bucket}" failed: ${error.message}`, error);
      throw new SupabaseProviderError(
        `Failed to upload file to Supabase: ${error.message}`,
        'uploadFile',
        (error as { status?: number }).status,
        error,
      );
    }

    const { data: urlData } = this.client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  /**
   * Deletes a file from a Supabase storage bucket.
   * 
   * @param filePath The path of the file to delete.
   * @param bucket Optional bucket name.
   */
  async deleteFile(filePath: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || this.defaultBucket;
    const { error } = await this.client.storage
      .from(targetBucket)
      .remove([filePath]);

    if (error) {
      this.logger.error(`Deletion from bucket "${targetBucket}" failed: ${error.message}`, error);
      throw new SupabaseProviderError(
        `Failed to delete file from Supabase: ${error.message}`,
        'deleteFile',
        (error as { status?: number }).status,
        error,
      );
    }
  }
}
