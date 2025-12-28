import type { IProductData, IReview } from '@shared/types/index';
import { ProductSource, Currency } from '@shared/types/index';
import { BaseExtractor } from './base-extractor';

class AllegroExtractor extends BaseExtractor {
  source = ProductSource.Allegro;

  canHandle(url: string): boolean {
    return /allegro\.pl/.test(url);
  }

  isProductPage(): boolean {
    return /\/oferta\//.test(window.location.pathname);
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
      console.error('[NoHype] Allegro extraction error:', error);
      return null;
    }
  }

  private extractName(): string {
    const selectors = [
      'h1[data-box-name="allegro.offer.title"]',
      'h1.mgn2_14',
      '[data-box-name="Title"] h1',
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
    const currency: Currency = Currency.PLN;

    const jsonLdPrice = this.extractPriceFromJsonLd();
    if (jsonLdPrice !== null) {
      price = jsonLdPrice;
    } else {
      const priceSelectors = [
        '[data-box-name="allegro.offer.price"] [aria-label^="cena"]',
        '[data-box-name="allegro.offer.price"] [aria-label*="cena"] span',
        '[data-cy="buy-box-price-value"]',
        '[data-price]',
        'meta[itemprop="price"]',
      ];

      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (!element) continue;
        
        const metaContent = element.getAttribute('content');
        const dataPrice = element.getAttribute('data-price');
        const ariaLabel = element.getAttribute('aria-label');
        const textContent = element.textContent || '';
        
        const priceText = metaContent || dataPrice || ariaLabel || textContent;
        
        if (priceText) {
          const parsed = this.parsePrice(priceText);
          if (parsed !== null && parsed > 1) {
            price = parsed;
            break;
          }
        }
      }
    }

    const originalSelectors = [
      '[data-box-name="allegro.offer.price"] del',
      '[data-role="original-price"]',
      '.m7er_k4 del',
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

  private extractPriceFromJsonLd(): number | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'Product' && data.offers) {
          const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          if (offers.price) {
            return parseFloat(offers.price);
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private extractDescription(): string {
    const parts: string[] = [];

    const params = this.getAll('[data-box-name="Parameters"] li, [data-box-name="allegro.offer.parameters"] li');
    params.forEach(li => {
      const text = li.textContent?.trim();
      if (text) parts.push(text);
    });

    const descSelectors = [
      '[data-box-name="Description"]',
      '[data-box-name="allegro.offer.description"]',
      '.mgn2_14[data-box-name="Description"]',
    ];

    for (const selector of descSelectors) {
      const text = this.getText(selector);
      if (text && text.length > 50) {
        parts.push(this.cleanText(text));
        break;
      }
    }

    return parts.join('\n\n');
  }

  private extractReviews(): IReview[] {
    const reviews: IReview[] = [];

    const reviewElements = this.getAll('[data-box-name="allegro.offer.reviews"] > div, [data-box-name="Reviews"] li');
    
    reviewElements.slice(0, 10).forEach(element => {
      const text = this.getText('p, .review-content', element);
      const author = this.getText('.author, [data-role="reviewer-name"]', element);
      const ratingElement = element.querySelector('[aria-label*="gwiazdek"], [aria-label*="stars"]');
      const ratingText = ratingElement?.getAttribute('aria-label') || '';
      
      let rating = 0;
      const ratingMatch = ratingText.match(/(\d)/);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1], 10);
      }

      if (text) {
        reviews.push({
          text: this.cleanText(text),
          rating,
          author,
          verified: true,
        });
      }
    });

    return reviews;
  }

  private extractRating(): number | undefined {
    const ratingElement = document.querySelector('[data-box-name="allegro.offer.rating"] [aria-label*="gwiazdek"]');
    const ratingText = ratingElement?.getAttribute('aria-label') || '';
    
    const match = ratingText.match(/([\d.,]+)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return undefined;
  }

  private extractReviewCount(): number | undefined {
    const countText = this.getText('[data-box-name="allegro.offer.rating"] a') ||
                      this.getText('[data-role="reviews-count"]');
    
    const match = countText.match(/([\d\s]+)/);
    if (match) {
      return parseInt(match[1].replace(/\s/g, ''), 10);
    }
    return undefined;
  }

  private extractSeller(): string | undefined {
    const sellerSelectors = [
      '[data-box-name="allegro.offer.seller"] a',
      '[data-role="seller-name"]',
      '.seller-info a',
    ];

    for (const selector of sellerSelectors) {
      const seller = this.getText(selector);
      if (seller) return seller;
    }
    return undefined;
  }

  private extractImage(): string | undefined {
    const imgSelectors = [
      '[data-box-name="allegro.offer.gallery"] img',
      '[data-role="gallery-image"]',
      '.gallery img',
    ];

    for (const selector of imgSelectors) {
      const src = this.getAttribute(selector, 'src');
      if (src && src.startsWith('http')) return src;
    }
    return undefined;
  }
}

export { AllegroExtractor };
