import type { IProductData, IReview } from '@shared/types/index';
import { ProductSource, Currency, CurrencySymbol } from '@shared/types/index';

abstract class BaseExtractor {
  abstract source: ProductSource;

  abstract canHandle(url: string): boolean;

  abstract isProductPage(): boolean;

  abstract extract(): IProductData | null;

  protected getText(selector: string, parent: Element | Document = document): string {
    const element = parent.querySelector(selector);
    return element?.textContent?.trim() ?? '';
  }

  protected getAll(selector: string, parent: Element | Document = document): Element[] {
    return Array.from(parent.querySelectorAll(selector));
  }

  protected getAttribute(
    selector: string, 
    attribute: string, 
    parent: Element | Document = document
  ): string {
    const element = parent.querySelector(selector);
    return element?.getAttribute(attribute) ?? '';
  }

  protected parsePrice(text: string): number | null {
    const cleaned = text.replace(/[^\d.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const price = parseFloat(normalized);
    return isNaN(price) ? null : price;
  }

  protected detectCurrency(text: string): Currency {
    switch (true) {
      case text.includes(CurrencySymbol.PLN_SYMBOL):
      case text.includes(CurrencySymbol.PLN_CODE):
        return Currency.PLN;
      case text.includes(CurrencySymbol.USD_SYMBOL):
      case text.includes(CurrencySymbol.USD_CODE):
        return Currency.USD;
      case text.includes(CurrencySymbol.EUR_SYMBOL):
      case text.includes(CurrencySymbol.EUR_CODE):
        return Currency.EUR;
      case text.includes(CurrencySymbol.GBP_SYMBOL):
      case text.includes(CurrencySymbol.GBP_CODE):
        return Currency.GBP;
      case text.includes(CurrencySymbol.CNY_SYMBOL):
      case text.includes(CurrencySymbol.CNY_CODE):
        return Currency.CNY;
      default:
        return Currency.PLN;
    }
  }

  protected createProductData(partial: Partial<IProductData>): IProductData {
    return {
      url: window.location.href,
      name: '',
      price: 0,
      currency: Currency.PLN,
      description: '',
      reviews: [],
      source: this.source,
      timestamp: Date.now(),
      ...partial,
    };
  }

  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }
}

interface ExtractedReview extends IReview {
  element?: Element;
}

export { BaseExtractor };
export type { ExtractedReview };
