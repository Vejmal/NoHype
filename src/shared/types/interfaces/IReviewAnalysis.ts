interface IReviewAnalysis {
  suspiciousPercentage: number;
  averageSentiment: number;
  fakePatternDetected: boolean;
  details: string;
}

export type { IReviewAnalysis };
