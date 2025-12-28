import type { IProductData, IReview } from '@shared/types/index';
import { ProductSource, Currency } from '@shared/types/index';
import { BaseExtractor } from './base-extractor';

class AmazonExtractor extends BaseExtractor {
  source = ProductSource.Amazon;

  canHandle(url: string): boolean {
    return /amazon\.(com|pl|de|co\.uk|es|fr|it)/.test(url);
  }

  isProductPage(): boolean {
    return /\/dp\/|\/gp\/product\//.test(window.location.pathname);
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
      console.error('[NoHype] Amazon extraction error:', error);
      return null;
    }
  }

  private extractName(): string {
    const selectors = [
      '#productTitle',
      '#title',
      'h1.product-title-word-break',
      '[data-feature-name="title"] h1',
    ];

    for (const selector of selectors) {
      const text = this.getText(selector);
      if (text) return this.cleanText(text);
    }

    return '';
  }

  private extractPrice(): { price: number; originalPrice?: number; currency: Currency } {
    let price = 0;
    let originalPrice: number | undefined;
    let currency: Currency = Currency.USD;

    const priceSelectors = [
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.a-price-whole',
      '[data-a-color="price"] .a-offscreen',
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
      '.a-price[data-a-strike="true"] .a-offscreen',
      '.a-text-strike',
      '#priceblock_listprice',
      '.basisPrice .a-offscreen',
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

    const bullets = this.getAll('#feature-bullets li, #productFactsDesktop_feature_div li');
    bullets.forEach(li => {
      const text = li.textContent?.trim();
      if (text) parts.push(text);
    });

    const descSelectors = [
      '#productDescription p',
      '#productDescription',
      '#aplus_feature_div',
      '.a-expander-content',
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

    const reviewElements = this.getAll('[data-hook="review"]');
    
    reviewElements.slice(0, 10).forEach(element => {
      const text = this.getText('[data-hook="review-body"]', element);
      const ratingText = this.getAttribute('[data-hook="review-star-rating"] span', 'class', element);
      const author = this.getText('.a-profile-name', element);
      const date = this.getText('[data-hook="review-date"]', element);
      const verified = element.querySelector('[data-hook="avp-badge"]') !== null;

      let rating = 0;
      const ratingMatch = ratingText.match(/a-star-(\d)/);
      if (ratingMatch) {
        rating = parseInt(ratingMatch[1], 10);
      }

      if (text) {
        reviews.push({
          text: this.cleanText(text),
          rating,
          author,
          date,
          verified,
        });
      }
    });

    return reviews;
  }

  private extractRating(): number | undefined {
    const ratingText = this.getText('[data-hook="rating-out-of-text"]') ||
                       this.getText('#acrPopover') ||
                       this.getText('.a-icon-star span');
    
    const match = ratingText.match(/([\d.,]+)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return undefined;
  }

  private extractReviewCount(): number | undefined {
    const countText = this.getText('#acrCustomerReviewText') ||
                      this.getText('[data-hook="total-review-count"]');
    
    const match = countText.match(/([\d,.\s]+)/);
    if (match) {
      return parseInt(match[1].replace(/[\s,.]/g, ''), 10);
    }
    return undefined;
  }

  private extractSeller(): string | undefined {
    const sellerSelectors = [
      '#sellerProfileTriggerId',
      '#merchant-info a',
      '#tabular-buybox .tabular-buybox-text a',
    ];

    for (const selector of sellerSelectors) {
      const seller = this.getText(selector);
      if (seller) return seller;
    }
    return undefined;
  }

  private extractImage(): string | undefined {
    const imgSelectors = [
      '#landingImage',
      '#imgBlkFront',
      '#main-image',
      '.a-dynamic-image',
    ];

    for (const selector of imgSelectors) {
      const src = this.getAttribute(selector, 'src');
      if (src && src.startsWith('http')) return src;
      
      const dataSrc = this.getAttribute(selector, 'data-a-dynamic-image');
      if (dataSrc) {
        try {
          const images = JSON.parse(dataSrc);
          const firstImage = Object.keys(images)[0];
          if (firstImage) return firstImage;
        } catch {
        }
      }
    }
    return undefined;
  }
}

export { AmazonExtractor };
