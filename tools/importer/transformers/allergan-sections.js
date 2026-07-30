/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Allergan Aesthetics (allerganaesthetics.es) section breaks.
 *
 * Adds a section break (<hr>) before every section after the first, and a
 * Section Metadata block for any section that carries a `style`. Section
 * selectors come from payload.template.sections (populated during page
 * analysis and verified against migration-work/cleaned.html). Runs in
 * afterTransform only. Modifies the DOM in place.
 *
 * For the homepage template: 3 sections, all with style === null, so this
 * produces 2 <hr> breaks and 0 Section Metadata blocks.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) {
    return;
  }

  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!Array.isArray(sections) || sections.length < 2) {
    return;
  }

  const doc = (payload && payload.document) || element.ownerDocument || document;

  // Process sections in reverse so DOM insertions do not shift the position of
  // sections we have not handled yet.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) {
      continue;
    }

    const sectionEl = element.querySelector(section.selector);
    if (!sectionEl) {
      continue;
    }

    // Section Metadata block (only when the section defines a style).
    if (section.style) {
      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.parentNode.insertBefore(metadataBlock, sectionEl.nextSibling);
    }

    // Section break before every section except the first, when there is
    // authorable content preceding it.
    if (i > 0 && sectionEl.previousElementSibling) {
      const hr = doc.createElement('hr');
      sectionEl.parentNode.insertBefore(hr, sectionEl);
    }
  }
}
