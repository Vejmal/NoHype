import { ProductSource } from '@shared/types/index';
import { SOURCE_DOMAINS } from '@shared/constants';

function detectSource(url: string): ProductSource {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    for (const [source, domains] of Object.entries(SOURCE_DOMAINS)) {
      if (domains.some(domain => hostname.includes(domain))) {
        return source as ProductSource;
      }
    }
    
    return ProductSource.Unknown;
  } catch {
    return ProductSource.Unknown;
  }
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

function parsePrice(priceText: string): { price: number; currency: string } | null {
  const cleaned = priceText.replace(/\s/g, '').replace(/&nbsp;/g, '');
  
  const patterns = [
    { regex: /([\d\s,.]+)\s*(?:zł|PLN)/i, currency: 'PLN' },
    { regex: /\$\s*([\d,.]+)|(\d[\d,.]+)\s*(?:USD|\$)/i, currency: 'USD' },
    { regex: /€\s*([\d,.]+)|([\d,.]+)\s*(?:EUR|€)/i, currency: 'EUR' },
    { regex: /£\s*([\d,.]+)|([\d,.]+)\s*(?:GBP|£)/i, currency: 'GBP' },
  ];

  for (const { regex, currency } of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      const priceStr = match[1] || match[2];
      if (priceStr) {
        const normalized = priceStr
          .replace(/\s/g, '')
          .replace(',', '.');
        
        const price = parseFloat(normalized);
        if (!isNaN(price)) {
          return { price, currency };
        }
      }
    }
  }

  return null;
}

function generateId(): string {
  return crypto.randomUUID();
}

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

function isProductPage(url: string, source: ProductSource): boolean {
  const patterns: Record<ProductSource, RegExp> = {
    amazon: /\/dp\/|\/gp\/product\//,
    allegro: /\/oferta\//,
    aliexpress: /\/item\//,
    ceneo: /\/;/,
    sephora: /\/p\//,
    zalando: /\/.*\.html/,
    unknown: /.*/,
  };

  return patterns[source]?.test(url) ?? false;
}

export {
  detectSource,
  formatPrice,
  truncateText,
  cleanText,
  parsePrice,
  generateId,
  debounce,
  isProductPage,
};
