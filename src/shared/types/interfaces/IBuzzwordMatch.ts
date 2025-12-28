import { BuzzwordCategory } from '../enums';

interface IBuzzwordMatch {
  word: string;
  count: number;
  category: BuzzwordCategory;
}

export type { IBuzzwordMatch };
