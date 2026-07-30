/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-overlay
 * Base block: cards
 * Source: https://www.allerganaesthetics.es/
 * Generated: 2026-07-30
 *
 * Block library structure (cards): 2 columns, multiple rows.
 *   Row 1: block name
 *   Each subsequent row = one card:
 *     Cell 1: Image or Icon (mandatory)
 *     Cell 2: Text content — Title (heading), Description, Call-to-Action
 *
 * Source is a three-column grid of teasers. Each teaser has a full-bleed
 * image and a linked content-container overlay holding the card title.
 * The overlay <a> href becomes the card's call-to-action target.
 */
export default function parse(element, { document }) {
  // Each teaser is a card
  const cards = Array.from(
    element.querySelectorAll('.teaser .emu-teaser, .emu-teaser'),
  );

  // Empty-block guard
  if (!cards.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    // Cell 1: image
    const image = card.querySelector(
      '.cmp-teaser__image img, .emu-teaser__image img, img',
    );

    // Cell 2: text content (title + CTA)
    const title = card.querySelector(
      '.cmp-teaser__title, .aaaem-teaser__title, .title-lockup h1, .title-lockup h2, .title-lockup h3, h1, h2, h3',
    );
    // The linked overlay wraps the card; use its href as the CTA target
    const overlayLink = card.querySelector(
      'a.content-container, .content-container[href], a[data-emu-title]',
    );
    const href = overlayLink ? overlayLink.getAttribute('href') : null;

    const contentCell = [];
    if (title) contentCell.push(title);
    if (href) {
      const cta = document.createElement('a');
      cta.href = href;
      cta.textContent = title ? title.textContent.trim() : 'Saber Más';
      contentCell.push(cta);
    }

    // Only emit a card row when it has essential content
    if (image || contentCell.length) {
      cells.push([image || '', contentCell.length ? contentCell : '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-overlay', cells });
  element.replaceWith(block);
}
