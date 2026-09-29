# WatchedList: exemplos

## ProductPhotoList

```ts
// domain/enterprise/product-photo-list.ts
import { WatchedList } from '@metri/core/entities';
import { ProductPhoto } from './product-photo.entity';

export class ProductPhotoList extends WatchedList<ProductPhoto> {
  compareItems(a: ProductPhoto, b: ProductPhoto): boolean {
    return a.equals(b);
  }
}
```

## Product

```ts
// domain/enterprise/product.entity.ts
import { AggregateRoot, UniqueEntityID } from '@metri/core/entities';
import { type Either, failure, success } from '@metri/core/types';
import { ProductPhoto } from './product-photo.entity';
import { ProductPhotoList } from './product-photo-list';
import { TooManyProductPhotosError } from './errors/product.errors';

const MAX_PHOTOS = 10;

export interface ProductProps {
  name: string;
  photos: ProductPhotoList;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class Product extends AggregateRoot<ProductProps> {
  private constructor(props: ProductProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /** BR8 — a product starts with no photo. */
  public static create(
    props: Optional<ProductProps, 'photos' | 'createdAt'>,
  ): Either<never, Product> {
    const product = new Product({
      ...props,
      photos: props.photos ?? new ProductPhotoList(),
      createdAt: props.createdAt ?? new Date(),
    });

    return success(product);
  }

  public static reconstitute(props: ProductProps, id: UniqueEntityID): Product {
    return new Product(props, id);
  }

  public get name(): string {
    return this.props.name;
  }

  public get photos(): ProductPhotoList {
    return this.props.photos;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date | null | undefined {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /** BR9 — the gallery is replaced as a whole and never goes over the limit. */
  public replacePhotos(
    photos: ProductPhoto[],
  ): Either<TooManyProductPhotosError, void> {
    if (photos.length > MAX_PHOTOS) {
      return failure(new TooManyProductPhotosError(MAX_PHOTOS));
    }

    this.props.photos.update(photos);
    this.touch();

    return success(undefined);
  }
}
```

## ReplaceProductPhotosUseCase

```ts
// domain/application/use-cases/product/replace-product-photos.use-case.ts
import { Injectable } from '@nestjs/common';
import { type Either, failure, success } from '@metri/core/types';
import { ProductPhoto } from '../../../enterprise/product-photo.entity';
import {
  ProductNotFoundError,
  ProductPhotoNotFoundError,
  TooManyProductPhotosError,
} from '../../../enterprise/errors/product.errors';
import { UploadNotFoundError } from '../../../enterprise/errors/upload.errors';
import { ProductRepository } from '../../repositories/product-repository.contract';
import { UploadRepository } from '../../repositories/upload-repository.contract';

interface ReplaceProductPhotosInput {
  productId: string;
  photos: Array<{ photoId: string } | { uploadId: string }>;
}

type ReplaceProductPhotosOutput = Either<
  | ProductNotFoundError
  | ProductPhotoNotFoundError
  | TooManyProductPhotosError
  | UploadNotFoundError,
  { product: Product }
>;

/** BR9 — the submitted gallery fully replaces the current one. */
@Injectable()
export class ReplaceProductPhotosUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly uploadRepository: UploadRepository,
  ) {}

  async execute({
    productId,
    photos,
  }: ReplaceProductPhotosInput): Promise<ReplaceProductPhotosOutput> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      return failure(new ProductNotFoundError(productId));
    }

    const currentById = new Map(
      product.photos.getItems().map((photo) => [photo.id.toValue(), photo]),
    );

    const nextPhotos: ProductPhoto[] = [];

    for (const photo of photos) {
      if ('photoId' in photo) {
        const current = currentById.get(photo.photoId);

        if (!current) {
          return failure(new ProductPhotoNotFoundError(photo.photoId));
        }

        nextPhotos.push(current);
        continue;
      }

      // new item: the key comes from the upload record, never from the client
      // (stat and consumption: infrastructure/storage.md, "O upload direto e o registro pendente")
      const upload = await this.uploadRepository.findById(photo.uploadId);

      if (!upload || upload.consumed || upload.assetType !== 'product-photo') {
        return failure(new UploadNotFoundError());
      }

      const created = ProductPhoto.create({ key: upload.key });
      nextPhotos.push(created.value);
    }

    const replaced = product.replacePhotos(nextPhotos);

    if (replaced.isFailure()) {
      return failure(replaced.value);
    }

    await this.productRepository.save(product);

    return success({ product });
  }
}
```
