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
        throw new Error(response.error || 'Nieznany błąd API');
      }

      return response.data;
    } catch (error) {
      console.warn('API niedostępne, używam danych testowych:', error);
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
    const marketingWords = ['rewolucyjny', 'najlepszy', 'innowacyjny', 'premium', 'hit', 'bestseller'];
    const urgencyWords = ['ostatnie sztuki', 'tylko dziś', 'promocja', 'okazja'];
    const exaggerationWords = ['niesamowity', 'idealny', 'perfekcyjny', 'cudowny'];

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
        message: `Znaleziono ${buzzwordsFound.length} buzzwordów marketingowych`,
        severity: FlagSeverity.Warning,
      });
    }

    if (product.originalPrice && product.price) {
      const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
      if (discount > 50) {
        flags.push({
          type: HypeFlagType.FakeDiscount,
          message: `Rabat ${discount.toFixed(0)}% może być zawyżony`,
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
        details: 'Analiza recenzji oparta na danych testowych',
      },
      alternatives: [],
      analyzedAt: Date.now(),
    };
  }

  private generateSummary(score: number, buzzwordCount: number): string {
    if (score < 30) {
      return 'Ten produkt wygląda na autentyczny. Opis jest rzeczowy i nie zawiera przesadzonych twierdzeń.';
    } else if (score < 50) {
      return 'Produkt zawiera pewne elementy marketingowe, ale ogólnie wygląda OK. Zachowaj ostrożność.';
    } else if (score < 75) {
      return `Uwaga! Znaleziono ${buzzwordCount} buzzwordów. Opis może być przesadzony. Porównaj z innymi ofertami.`;
    } else {
      return '🚨 Wysoki poziom hype! Ten produkt używa agresywnego marketingu. Rozważ alternatywy.';
    }
  }
}

const apiClient = new ApiClient();

export { ApiClient, apiClient };
