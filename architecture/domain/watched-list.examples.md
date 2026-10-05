# WatchedList: exemplos

## WatchedList

A classe base, que o projeto copia para `packages/core/src/entities/watched-list.ts` e exporta em `packages/core/src/entities/index.ts` quando ativa a capacidade.

```ts
/** SOURCE OF TRUTH: WatchedList.
 * WHAT: a child collection that tracks its delta: `getNewItems()` and `getRemovedItems()` against the initial items.
 * WHY: the repository saves only what changed in the collection, without rewriting it on every `save()` (domain/watched-list).
 * WHERE: extended by the aggregate's collection, which implements `compareItems` (identity by id or structural).
 * An operation uses `update()` or `add()`/`remove()`, never both.
 */
export abstract class WatchedList<T> {
	private currentItems: T[];
	private readonly initial: T[];
	private newItems: T[];
	private removedItems: T[];

	constructor(initialItems: T[] = []) {
		// copies: `add()` pushes into the current items, and neither the initial set nor the caller's array may change
		this.currentItems = [...initialItems];
		this.initial = [...initialItems];
		this.newItems = [];
		this.removedItems = [];
	}

	abstract compareItems(a: T, b: T): boolean;

	getItems(): T[] {
		return this.currentItems;
	}

	getNewItems(): T[] {
		return this.newItems;
	}

	getRemovedItems(): T[] {
		return this.removedItems;
	}

	exists(item: T): boolean {
		return this.isCurrentItem(item);
	}

	add(item: T): void {
		if (this.isRemovedItem(item)) {
			this.removeFromRemoved(item);
		}

		if (!this.isNewItem(item) && !this.wasInitialItem(item)) {
			this.newItems.push(item);
		}

		if (!this.isCurrentItem(item)) {
			this.currentItems.push(item);
		}
	}

	remove(item: T): void {
		this.removeFromCurrent(item);

		if (this.isNewItem(item)) {
			this.removeFromNew(item);
			return;
		}

		if (!this.isRemovedItem(item)) {
			this.removedItems.push(item);
		}
	}

	// Full replacement: receives the whole final set, never only the additions; a current item missing from
	// the argument becomes a removal (domain/watched-list).
	update(items: T[]): void {
		const newItems = items.filter(
			(item) =>
				!this.currentItems.some((current) => this.compareItems(item, current)),
		);
		const removedItems = this.currentItems.filter(
			(current) => !items.some((item) => this.compareItems(current, item)),
		);

		this.currentItems = items;
		this.newItems = newItems;
		this.removedItems = removedItems;
	}

	private isCurrentItem(item: T): boolean {
		return this.currentItems.some((current) =>
			this.compareItems(item, current),
		);
	}

	private isNewItem(item: T): boolean {
		return this.newItems.some((current) => this.compareItems(item, current));
	}

	private isRemovedItem(item: T): boolean {
		return this.removedItems.some((current) =>
			this.compareItems(item, current),
		);
	}

	private wasInitialItem(item: T): boolean {
		return this.initial.some((current) => this.compareItems(item, current));
	}

	private removeFromNew(item: T): void {
		this.newItems = this.newItems.filter(
			(current) => !this.compareItems(current, item),
		);
	}

	private removeFromCurrent(item: T): void {
		this.currentItems = this.currentItems.filter(
			(current) => !this.compareItems(current, item),
		);
	}

	private removeFromRemoved(item: T): void {
		this.removedItems = this.removedItems.filter(
			(current) => !this.compareItems(current, item),
		);
	}
}
```

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
