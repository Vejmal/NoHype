import type { IProductData, IReview } from '@shared/types/index';
import { ProductSource, Currency } from '@shared/types/index';
import { BaseExtractor } from './base-extractor';

class AliExpressExtractor extends BaseExtractor {
  source = ProductSource.AliExpress;

  canHandle(url: string): boolean {
    return /aliexpress\.com/.test(url);
  }

  isProductPage(): boolean {
    return /\/item\//.test(window.location.pathname);
  }

  extract(): IProductData | null {
    if (!this.isProductPage()) {
      return null;
    }

    try {
      const name = this.extractName();
      const { price, originalPrice, currency } = this.extractPrice();
      const description = this.extractDescription();
      const reviews = this.extractReviews();
      const rating = this.extractRating();
      const reviewCount = this.extractReviewCount();
      const seller = this.extractSeller();
      const imageUrl = this.extractImage();

      return this.createProductData({
        name,
        price,
        originalPrice,
        currency,
        description,
        reviews,
        rating,
        reviewCount,
        seller,
        imageUrl,
      });
    } catch (error) {
      console.error('[NoHype] AliExpress extraction error:', error);
      return null;
    }
  }

  private extractName(): string {
    const selectors = [
      'h1[data-pl="product-title"]',
      '.product-title-text',
      'h1.title',
      '[class*="ProductTitle"]',
      'h1',
    ];

    for (const selector of selectors) {
      const text = this.getText(selector);
      if (text && text.length > 5) return this.cleanText(text);
    }

    return '';
  }

  private extractPrice(): { price: number; originalPrice?: number; currency: Currency } {
    let price = 0;
    let originalPrice: number | undefined;
    let currency: Currency = Currency.USD;

    const priceSelectors = [
      '[class*="Price"] [class*="current"]',
      '.product-price-current',
      '[data-pl="product-price"]',
      '.uniform-banner-box-price',
    ];

    for (const selector of priceSelectors) {
      const priceText = this.getText(selector);
      if (priceText) {
        const parsed = this.parsePrice(priceText);
        if (parsed !== null) {
          price = parsed;
          currency = this.detectCurrency(priceText);
          break;
        }
      }
    }

    const originalSelectors = [
      '[class*="Price"] [class*="origin"]',
      '.product-price-origin',
      '[class*="originalPrice"]',
      'del',
    ];

    for (const selector of originalSelectors) {
      const priceText = this.getText(selector);
      if (priceText) {
        const parsed = this.parsePrice(priceText);
        if (parsed !== null && parsed > price) {
          originalPrice = parsed;
          break;
        }
      }
    }

    return { price, originalPrice, currency };
  }

  private extractDescription(): string {
    const parts: string[] = [];

    const specs = this.getAll('[class*="Specification"] li, .product-property-list li');
    specs.forEach(li => {
      const text = li.textContent?.trim();
      if (text) parts.push(text);
    });

    const descSelectors = [
      '[class*="Description"]',
      '.product-description',
      '#product-description',
    ];

    for (const selector of descSelectors) {
      const text = this.getText(selector);
      if (text && text.length > 50) {
        parts.push(this.cleanText(text));
        break;
      }
    }

    return parts.join('\n\n') || 'Description unavailable (reload the page)';
  }

  private extractReviews(): IReview[] {
    const reviews: IReview[] = [];

    const reviewElements = this.getAll('[class*="Review"] [class*="item"], .feedback-item');
    
    reviewElements.slice(0, 10).forEach(element => {
      const text = this.getText('[class*="content"], .buyer-feedback', element);
      const author = this.getText('[class*="user"], .user-name', element);
      const ratingStars = element.querySelectorAll('[class*="star"][class*="full"], .star-active');
      
      if (text) {
        reviews.push({
          text: this.cleanText(text),
          rating: ratingStars.length || 5,
          author,
          verified: true,
        });
      }
    });

    return reviews;
  }

  private extractRating(): number | undefined {
    const ratingText = this.getText('[class*="Rating"] [class*="value"], .overview-rating-average');
    
    const match = ratingText.match(/([\d.,]+)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return undefined;
  }

  private extractReviewCount(): number | undefined {
    const countText = this.getText('[class*="Review"] [class*="count"], .product-reviewer-reviews');
    
    const match = countText.match(/([\d,.\s]+)/);
    if (match) {
      return parseInt(match[1].replace(/[\s,.]/g, ''), 10);
    }
    return undefined;
  }

  private extractSeller(): string | undefined {
    const sellerSelectors = [
      '[class*="Store"] [class*="name"]',
      '.store-name',
      '[data-pl="store-name"]',
    ];

    for (const selector of sellerSelectors) {
      const seller = this.getText(selector);
      if (seller) return seller;
    }
    return undefined;
  }

  private extractImage(): string | undefined {
    const imgSelectors = [
      '[class*="Gallery"] img',
      '.product-image img',
      '[class*="Image"] img[src*="alicdn"]',
    ];

    for (const selector of imgSelectors) {
      const src = this.getAttribute(selector, 'src');
      if (src && src.startsWith('http')) return src;
    }
    return undefined;
  }
}

export { AliExpressExtractor };
