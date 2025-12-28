interface IReview {
  text: string;
  rating: number;
  author?: string;
  date?: string;
  verified?: boolean;
}

export type { IReview };
