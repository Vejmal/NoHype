import type { 
  IApiResponse, 
  IProductData, 
  IAnalysisResult,
  IHypeFlag,
  IBuzzwordMatch,
} from './types/index';
import { RiskLevel, HypeFlagType, FlagSeverity, BuzzwordCategory } from './types/index';
import { API_BASE_URL, API_TIMEOUT } from './constants';

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async analyzeProduct(product: IProductData): Promise<IAnalysisResult> {
    const requestBody = {
      productData: product,
      options: {
        includeAlternatives: true,
        includePriceHistory: true,
      },
    };

    try {
      const response = await this.fetchWithTimeout<IApiResponse>(
        `${this.baseUrl}/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Unknown API error');
      }

      return response.data;
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      return this.getMockAnalysis(product);
    }
  }

  private async fetchWithTimeout<T>(
    url: string, 
    options: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getMockAnalysis(product: IProductData): IAnalysisResult {
    const descLower = product.description.toLowerCase();
    const nameLower = product.name.toLowerCase();
    const combinedText = `${nameLower} ${descLower}`;
    
    const buzzwordsFound: IBuzzwordMatch[] = [];
    const marketingWords = ['revolutionary', 'best', 'innovative', 'premium', 'hit', 'bestseller', 'amazing', 'incredible'];
    const urgencyWords = ['last items', 'today only', 'sale', 'limited offer', 'hurry', 'act now'];
    const exaggerationWords = ['unbelievable', 'ideal', 'perfect', 'miraculous', 'fantastic'];

    marketingWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        buzzwordsFound.push({ word, count: matches.length, category: BuzzwordCategory.Marketing });
      }
    });

    urgencyWords.forEach(word => {
      if (combinedText.includes(word)) {
        buzzwordsFound.push({ word, count: 1, category: BuzzwordCategory.FakeUrgency });
      }
    });

    exaggerationWords.forEach(word => {
      if (combinedText.includes(word)) {
        buzzwordsFound.push({ word, count: 1, category: BuzzwordCategory.Exaggeration });
      }
    });

    let hypeScore = 20;
    hypeScore += buzzwordsFound.length * 10;
    
    if (product.originalPrice && product.price) {
      const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
      if (discount > 70) hypeScore += 25;
      else if (discount > 50) hypeScore += 15;
    }

    hypeScore = Math.min(100, hypeScore);

    let riskLevel: RiskLevel;
    if (hypeScore <= 40) riskLevel = RiskLevel.Low;
    else if (hypeScore <= 60) riskLevel = RiskLevel.Medium;
    else if (hypeScore <= 80) riskLevel = RiskLevel.High;
    else riskLevel = RiskLevel.Critical;

    const flags: IHypeFlag[] = [];
    
    if (buzzwordsFound.length > 3) {
      flags.push({
        type: HypeFlagType.ExaggeratedClaims,
        message: `Found ${buzzwordsFound.length} marketing buzzwords`,
        severity: FlagSeverity.Warning,
      });
    }

    if (product.originalPrice && product.price) {
      const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
      if (discount > 50) {
        flags.push({
          type: HypeFlagType.FakeDiscount,
          message: `${discount.toFixed(0)}% discount may be inflated`,
          severity: discount > 70 ? FlagSeverity.Danger : FlagSeverity.Warning,
        });
      }
    }

    return {
      id: crypto.randomUUID(),
      hypeScore,
      riskLevel,
      summary: this.generateSummary(hypeScore, buzzwordsFound.length),
      flags,
      buzzwords: buzzwordsFound,
      reviewAnalysis: {
        suspiciousPercentage: Math.random() * 30,
        averageSentiment: 0.6 + Math.random() * 0.3,
        fakePatternDetected: Math.random() > 0.7,
        details: 'Review analysis based on mock data',
      },
      alternatives: [],
      analyzedAt: Date.now(),
    };
  }

  private generateSummary(score: number, buzzwordCount: number): string {
    if (score < 30) {
      return 'This product appears authentic. The description is factual and contains no exaggerated claims.';
    } else if (score < 50) {
      return 'Product contains some marketing elements, but overall looks OK. Exercise caution.';
    } else if (score < 75) {
      return `Warning! Found ${buzzwordCount} buzzwords. The description may be exaggerated. Compare with other offers.`;
    } else {
      return '🚨 High hype level! This product uses aggressive marketing. Consider alternatives.';
    }
  }
}

const apiClient = new ApiClient();

export { ApiClient, apiClient };
