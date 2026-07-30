import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Fetches the footer fragment, preferring the local /content path (aem up) and
 * falling back to the block-metadata footer path (DA / EDS production).
 * @returns {Promise<HTMLElement|null>} the fragment root
 */
async function loadFooterFragment() {
  const local = await loadFragment('/content/footer');
  if (local) return local;
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  return loadFragment(footerPath);
}

/**
 * Tags each direct content column of the fragment so CSS can lay out the two
 * visual bands (upper: brand + links, lower: social + legal) without relying
 * on any class/id authored in the fragment itself.
 * @param {Element} footer the footer content wrapper
 */
function classifyColumns(footer) {
  const columns = [...footer.children];
  columns.forEach((col) => {
    const hasList = col.querySelector('ul');
    // A link that wraps an image AND has visible text is a labelled (social) link;
    // a link whose only content is an image is the brand logo.
    const linksWithImg = [...col.querySelectorAll('a')].filter((a) => a.querySelector('img'));
    const hasLabelledIconLinks = linksWithImg.some((a) => a.textContent.trim().length > 0);
    const hasImageOnlyLink = linksWithImg.some((a) => a.textContent.trim().length === 0);
    const hasParagraphs = col.querySelector('p');

    if (hasList) {
      col.classList.add('footer-links');
    } else if (hasLabelledIconLinks) {
      col.classList.add('footer-social');
    } else if (hasImageOnlyLink) {
      col.classList.add('footer-brand');
    } else if (hasParagraphs) {
      col.classList.add('footer-legal');
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await loadFooterFragment();

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-content';
  if (fragment) {
    while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  }

  classifyColumns(footer);

  // Group the brand + links columns into the upper band, social + legal into the lower band.
  const brand = footer.querySelector('.footer-brand');
  const links = footer.querySelector('.footer-links');
  const social = footer.querySelector('.footer-social');
  const legal = footer.querySelector('.footer-legal');

  const upper = document.createElement('div');
  upper.className = 'footer-band footer-band-upper';
  if (brand) upper.append(brand);
  if (links) upper.append(links);

  const lower = document.createElement('div');
  lower.className = 'footer-band footer-band-lower';
  if (social) lower.append(social);
  if (legal) lower.append(legal);

  footer.textContent = '';
  footer.append(upper, lower);

  block.append(footer);
}
