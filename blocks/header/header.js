import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetches the nav fragment, preferring the local /content path (aem up) and
 * falling back to the block-metadata nav path (DA / EDS production).
 * @returns {Promise<HTMLElement|null>} the fragment root
 */
async function loadNavFragment() {
  const local = await loadFragment('/content/nav');
  if (local) return local;
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  return loadFragment(navPath);
}

/**
 * Collapses all open desktop dropdowns.
 * @param {Element} navSections the sections container
 * @param {Element} [except] a section to leave open
 */
function closeAllDropdowns(navSections, except) {
  navSections.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((drop) => {
    if (drop !== except) drop.setAttribute('aria-expanded', 'false');
  });
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav.querySelector('.nav-sections');
  if (!navSections) return;
  const expanded = navSections.querySelector('.nav-drop[aria-expanded="true"]');
  if (expanded && isDesktop.matches) {
    closeAllDropdowns(navSections);
    expanded.focus();
  } else if (!isDesktop.matches) {
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, navSections, false);
    const hb = nav.querySelector('.nav-hamburger button');
    if (hb) hb.focus();
  }
}

/**
 * Toggles the whole mobile menu.
 * @param {Element} nav the nav element
 * @param {Element} navSections the sections container
 * @param {boolean|null} forceExpanded optional forced state
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Abrir navegación' : 'Cerrar navegación');
    // trigger label swaps Menú <-> Cerca to match source
    const labelEl = button.querySelector('.nav-hamburger-label');
    if (labelEl) labelEl.textContent = expanded ? 'Menú' : 'Cerca';
  }
  if (expanded || isDesktop.matches) {
    closeAllDropdowns(navSections);
  }
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Wires hover + click + keyboard behavior on a dropdown section.
 * @param {Element} navSection the top-level <li> that owns a dropdown
 * @param {Element} navSections the sections container
 */
function decorateDropdown(navSection, navSections) {
  navSection.classList.add('nav-drop');
  navSection.setAttribute('aria-expanded', 'false');

  const label = navSection.querySelector(':scope > p');
  if (label) {
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '0');
  }

  // desktop: open on hover, close on leave
  navSection.addEventListener('mouseenter', () => {
    if (!isDesktop.matches) return;
    closeAllDropdowns(navSections, navSection);
    navSection.setAttribute('aria-expanded', 'true');
  });
  navSection.addEventListener('mouseleave', () => {
    if (!isDesktop.matches) return;
    navSection.setAttribute('aria-expanded', 'false');
  });

  // click / keyboard toggle (mobile single-expand accordion + desktop tap + a11y)
  const toggle = () => {
    const open = navSection.getAttribute('aria-expanded') === 'true';
    // single-expand: collapse siblings on both desktop and mobile (matches source)
    closeAllDropdowns(navSections, navSection);
    navSection.setAttribute('aria-expanded', open ? 'false' : 'true');
  };
  if (label) {
    label.addEventListener('click', toggle);
    label.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
    });
  }
}

/**
 * Builds the search control from the tools section content.
 * The nav fragment supplies the destination link (label + href); the icon
 * button markup is created here (form controls do not live in the fragment).
 * @param {Element} navTools the tools container
 */
function decorateSearch(navTools) {
  if (!navTools) return;
  const link = navTools.querySelector('a');
  if (!link) return;
  const href = link.getAttribute('href');
  const label = link.textContent.trim() || 'Buscar';
  const search = document.createElement('a');
  search.className = 'nav-search';
  search.href = href;
  search.setAttribute('aria-label', label);
  search.innerHTML = `<span class="nav-search-icon" aria-hidden="true"></span><span class="nav-search-label">${label}</span>`;
  const container = link.closest('p');
  if (container) container.replaceWith(search);
  else link.replaceWith(search);
}

/**
 * Toggles the scrolled state on the header wrapper (transparent -> solid).
 * @param {Element} navWrapper the wrapper element
 */
function updateScrollState(navWrapper) {
  if (window.scrollY > 10) navWrapper.classList.add('is-scrolled');
  else navWrapper.classList.remove('is-scrolled');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await loadNavFragment();

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  if (fragment) {
    while (fragment.firstElementChild) nav.append(fragment.firstElementChild);
  }

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // brand: strip button styling from the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = 'nav-brand-link';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
  }

  // sections: wire dropdowns
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector(':scope > ul')) {
        decorateDropdown(navSection, navSections);
      }
    });
  }

  // tools: build the search control
  decorateSearch(nav.querySelector('.nav-tools'));

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Abrir navegación">
      <span class="nav-hamburger-label">Menú</span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // transparent -> solid header on scroll
  updateScrollState(navWrapper);
  window.addEventListener('scroll', () => updateScrollState(navWrapper), { passive: true });

  // reset menu/dropdown state when crossing the desktop/mobile breakpoint:
  // always close the mobile drawer (resets aria-expanded + hamburger label to
  // "Menú"), collapse any open dropdowns/accordions, and clear the scroll lock.
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, false);
    if (navSections) closeAllDropdowns(navSections);
    document.body.style.overflowY = '';
  });
}
