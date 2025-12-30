import { IProductData } from './IProductData';

interface IApiRequest {
  productData: IProductData;
  options?: {
    includeAlternatives?: boolean;
    includePriceHistory?: boolean;
  };
}

export type { IApiRequest };
