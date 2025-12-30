import { ProductSource, Currency } from '../enums';
import { IReview } from './IReview';

interface IProductData {
  url: string;
  name: string;
  price: number;
  currency: Currency;
  originalPrice?: number;
  description: string;
  reviews: IReview[];
  rating?: number;
  reviewCount?: number;
  seller?: string;
  imageUrl?: string;
  source: ProductSource;
  timestamp: number;
}

export type { IProductData };
