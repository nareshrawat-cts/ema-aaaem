/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns-editorial
 * Base block: columns
 * Source: https://www.allerganaesthetics.es/
 * Generated: 2026-07-30
 *
 * Block library structure (columns): flexible columns and rows.
 *   Row 1: block name
 *   Row 2: one cell per column, matching the visual grouping.
 *
 * Source is a two-column layout (flex-two-cols wide-left): the left column
 * holds a title + editorial body text, the right column holds an image with
 * a caption. Each `.column` becomes one column cell.
 */
export default function parse(element, { document }) {
  // Each `.column` in the container maps to one column cell
  const columns = Array.from(
    element.querySelectorAll(':scope .aaaem-container > .column, :scope .cmp-container > .column'),
  );

  // Fallback: any direct .column descendants
  const columnEls = columns.length
    ? columns
    : Array.from(element.querySelectorAll('.column'));

  // Empty-block guard
  if (!columnEls.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = columnEls.map((col) => {
    const cellContent = [];

    // Title / heading
    const title = col.querySelector(
      '.cmp-title__text, .emu-title__text, h1, h2, h3, h4',
    );
    if (title) cellContent.push(title);

    // Body text block(s)
    const textBlocks = Array.from(
      col.querySelectorAll('.cmp-text, [data-emu-type="text"]'),
    );
    textBlocks.forEach((t) => cellContent.push(t));

    // Image (with its caption span, which lives inside the image container)
    const imageContainer = col.querySelector('.cmp-image, .emu-image');
    if (imageContainer) {
      cellContent.push(imageContainer);
    } else {
      const img = col.querySelector('img');
      if (img) cellContent.push(img);
    }

    return cellContent.length ? cellContent : '';
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-editorial', cells });
  element.replaceWith(block);
}
