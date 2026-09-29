# Storage: exemplos

## R2StorageService

```ts
// infra/services/storage/r2-storage.service.ts
import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvService } from '../../common/env/env.service';

const SIGNED_URL_TTL_SECONDS = 600;

export type ObjectStat = {
  sizeInBytes: number;
  contentType: string;
};

@Injectable()
export class R2StorageService {
  readonly publicBucket: string;
  readonly privateBucket: string;
  readonly publicBaseUrl: string;
  private readonly client: S3Client;

  constructor(env: EnvService) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.getOrThrow('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.getOrThrow('R2_ACCESS_KEY_ID'),
        secretAccessKey: env.getOrThrow('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.publicBucket = env.getOrThrow('R2_PUBLIC_BUCKET');
    this.privateBucket = env.getOrThrow('R2_PRIVATE_BUCKET');
    this.publicBaseUrl = env.getOrThrow('R2_PUBLIC_BASE_URL');
  }

  async save(bucket: string, key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async remove(bucket: string, key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async stat(bucket: string, key: string): Promise<ObjectStat | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      // `?? 0` would let an object of unknown size pass as valid on
      // confirmation, which is what `stat` exists to prevent. A 200 response without
      // these headers is a vendor contract breach, not a missing object.
      if (head.ContentLength === undefined || head.ContentType === undefined) {
        throw new Error(`HEAD de ${key} veio sem tamanho ou tipo`);
      }

      const objectStat = {
        sizeInBytes: head.ContentLength,
        contentType: head.ContentType,
      };
      return objectStat;
    } catch (error) {
      if (error instanceof NotFound) {
        return null;
      }
      throw error;
    }
  }

  getSignedReadUrl(bucket: string, key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
  }

  getSignedUploadUrl(bucket: string, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
  }

  publicUrl(key: string): string {
    const url = `${this.publicBaseUrl}/${key}`;
    return url;
  }
}
```

## ProductPhotoStorageImpl

```ts
// infra/services/storage/product-photo-storage.impl.ts
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  ProductPhotoStorage,
  type ProductPhotoMimeType,
  type RequestProductPhotoUploadInput,
  type RequestProductPhotoUploadOutput,
} from '../../../domain/application/services/storage/product-photo-storage.contract';
import { R2StorageService } from './r2-storage.service';

const EXTENSION_BY_MIME_TYPE: Record<ProductPhotoMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class ProductPhotoStorageImpl implements ProductPhotoStorage {
  constructor(private readonly r2: R2StorageService) {}

  async requestUpload(
    input: RequestProductPhotoUploadInput,
  ): Promise<RequestProductPhotoUploadOutput> {
    const extension = EXTENSION_BY_MIME_TYPE[input.mimeType];
    const key = `product-photo/${randomUUID()}.${extension}`;

    const uploadUrl = await this.r2.getSignedUploadUrl(
      this.r2.publicBucket,
      key,
      input.mimeType,
    );

    const output = { key, uploadUrl };
    return output;
  }

  async stat(key: string) {
    return this.r2.stat(this.r2.publicBucket, key);
  }

  async remove(key: string): Promise<void> {
    await this.r2.remove(this.r2.publicBucket, key);
  }

  publicUrl(key: string): string {
    return this.r2.publicUrl(key);
  }
}
```
