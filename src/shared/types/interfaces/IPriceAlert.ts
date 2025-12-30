interface IPriceAlert {
  id: string;
  productUrl: string;
  productName: string;
  currentPrice: number;
  targetPrice: number;
  currency: string;
  createdAt: number;
  source: string;
  isActive: boolean;
}

export type { IPriceAlert };
