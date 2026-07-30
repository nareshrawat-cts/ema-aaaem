/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero-video
 * Base block: hero
 * Source: https://www.allerganaesthetics.es/
 * Generated: 2026-07-30
 *
 * Block library structure (hero): 1 column, 3 rows.
 *   Row 1: block name
 *   Row 2: Background media (optional) — image / video
 *   Row 3: Title (heading), Subheading, Call-to-Action
 *
 * Source is a full-bleed teaser with a background image, an autoplay
 * background <video>, a title (h1), a multi-line description (h2s), and a
 * single CTA link.
 */
export default function parse(element, { document }) {
  // --- Background media (Row 2) ---
  // Desktop background image
  const bgImage = element.querySelector(
    '.cmp-teaser__image img, .emu-teaser__image img, img[class*="image"]',
  );
  // Background video — reference the mp4 source as a link so it survives import
  const videoSource = element.querySelector(
    '.cmp-teaser__video video source, .emu-teaser__video video source, video source',
  );
  let videoLink = null;
  const videoUrl = videoSource
    ? (videoSource.getAttribute('src') || videoSource.getAttribute('data-src'))
    : null;
  if (videoUrl) {
    videoLink = document.createElement('a');
    videoLink.href = videoUrl;
    videoLink.textContent = videoUrl;
  }

  // --- Content (Row 3) ---
  const title = element.querySelector(
    'h1.cmp-teaser__title, .cmp-teaser__title, .title-lockup h1, h1',
  );
  const description = element.querySelector(
    '.cmp-teaser__description, .aaaem-teaser__description, [class*="description"]',
  );
  const ctaLinks = Array.from(
    element.querySelectorAll(
      '.cmp-teaser__action-link, .aaaem-teaser__action-link, .cmp-teaser__action-container a',
    ),
  );

  // Empty-block guard: bail gracefully if no essential content
  if (!title && !description && !bgImage && !videoLink) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background media cell (image and/or video link)
  const mediaCell = [];
  if (bgImage) mediaCell.push(bgImage);
  if (videoLink) mediaCell.push(videoLink);
  cells.push([mediaCell]);

  // Row 3: content cell (title, subheading, CTA)
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  contentCell.push(...ctaLinks);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
