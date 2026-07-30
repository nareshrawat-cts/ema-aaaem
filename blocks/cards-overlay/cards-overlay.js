import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Overlay cards: full-bleed image with a title overlaid at the bottom-left.
 * The entire card is a single link.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Classify the authored cells: image cell vs. body (title/link) cell.
    let imageCell = null;
    let bodyCell = null;
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture')) imageCell = cell;
      else bodyCell = cell;
    });

    // Determine the destination: use the link inside the body cell if present.
    const bodyLink = bodyCell ? bodyCell.querySelector('a') : null;
    const href = bodyLink ? bodyLink.getAttribute('href') : '#';

    // Build the single card-wide anchor.
    const link = document.createElement('a');
    link.className = 'cards-overlay-card-link';
    link.href = href;

    // Image
    if (imageCell) {
      imageCell.className = 'cards-overlay-card-image';
      link.append(imageCell);
    }

    // Body: keep the title heading, drop the redundant duplicate link.
    const body = document.createElement('div');
    body.className = 'cards-overlay-card-body';
    if (bodyCell) {
      const heading = bodyCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading) {
        body.append(heading);
      } else if (bodyLink) {
        // fallback: use the link text as the title
        const span = document.createElement('span');
        span.textContent = bodyLink.textContent;
        body.append(span);
      }
    }
    link.append(body);

    li.append(link);
    ul.append(li);
  });

  // Optimize images.
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
