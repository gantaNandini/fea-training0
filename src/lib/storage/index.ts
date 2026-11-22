import { LocalStorageProvider } from './local'

/** REQ-007: storage interface (local disk now; S3/R2/Bunny later). */
export interface StorageProvider {
  put(key: string, data: Buffer, contentType: string): Promise<{ key: string; url: string }>
  remove(key: string): Promise<void>
  /** Short-lived URL for protected files (REQ-181). */
  getSignedUrl(key: string, ttlSeconds?: number): string
  read(key: string): Promise<Buffer | null>
}

export const storage: StorageProvider = new LocalStorageProvider()
