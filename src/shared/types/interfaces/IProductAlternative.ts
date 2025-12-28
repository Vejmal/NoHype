import { ProductSource } from '../enums';

interface IProductAlternative {
  name: string;
  price: number;
  currency: string;
  url: string;
  source: ProductSource;
  reason: string;
  savings?: number;
}

export type { IProductAlternative };
