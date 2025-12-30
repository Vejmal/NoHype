import { BaseExtractor } from './base-extractor';
import { AmazonExtractor } from './amazon-extractor';
import { AllegroExtractor } from './allegro-extractor';
import { AliExpressExtractor } from './aliexpress-extractor';

const extractors: BaseExtractor[] = [
  new AmazonExtractor(),
  new AllegroExtractor(),
  new AliExpressExtractor(),
];

function getExtractor(url: string): BaseExtractor | null {
  for (const extractor of extractors) {
    if (extractor.canHandle(url)) {
      return extractor;
    }
  }
  return null;
}

function hasExtractor(url: string): boolean {
  return getExtractor(url) !== null;
}

export { 
  getExtractor, 
  hasExtractor, 
  BaseExtractor, 
  AmazonExtractor, 
  AllegroExtractor, 
  AliExpressExtractor,
};
