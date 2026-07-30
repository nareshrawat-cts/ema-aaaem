/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVideoParser from './parsers/hero-video.js';
import cardsOverlayParser from './parsers/cards-overlay.js';
import columnsEditorialParser from './parsers/columns-editorial.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/allergan-cleanup.js';
import sectionsTransformer from './transformers/allergan-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Allergan Aesthetics Spain homepage: header, full-bleed hero teaser with video, three-column treatment-area cards, editorial text section with image, and footer.',
  urls: [
    'https://www.allerganaesthetics.es/',
  ],
  blocks: [
    {
      name: 'hero-video',
      instances: ['#maincontent .teaser .emu-teaser.hero-teaser'],
    },
    {
      name: 'cards-overlay',
      instances: ['#maincontent .container.module.flex-three-cols.equal'],
    },
    {
      name: 'columns-editorial',
      instances: ['#maincontent .container.module.flex-two-cols.wide-left'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero',
      selector: '#maincontent .teaser .emu-teaser.hero-teaser',
      style: null,
      blocks: ['hero-video'],
      defaultContent: [],
    },
    {
      id: 'section-2-treatment-cards',
      name: 'Treatment Cards',
      selector: '#maincontent .container.module.flex-three-cols.equal',
      style: null,
      blocks: ['cards-overlay'],
      defaultContent: [],
    },
    {
      id: 'section-3-editorial',
      name: 'Editorial',
      selector: '#maincontent .container.module.wide-left:nth-of-type(3)',
      style: null,
      blocks: ['columns-editorial'],
      defaultContent: [
        '#maincontent .container.module.wide-left:nth-of-type(3)',
        '#maincontent .container.module.wide-left:nth-of-type(6)',
      ],
    },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-video': heroVideoParser,
  'cards-overlay': cardsOverlayParser,
  'columns-editorial': columnsEditorialParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
