/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Allergan Aesthetics (allerganaesthetics.es) site-wide cleanup.
 *
 * Removes non-authorable site chrome and overlays so the import contains only
 * page-level authorable content. Every selector below was verified against the
 * captured DOM in migration-work/cleaned.html — none are guessed.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / cookie consent / decorative sprites — remove before block
    // parsing so their inner text/video is never picked up by parsers.
    WebImporter.DOMUtils.remove(element, [
      // OneTrust cookie consent (cleaned.html: #onetrust-consent-sdk line 637,
      // nested #onetrust-pc-sdk line 640, #onetrust-banner-sdk line 891)
      '#onetrust-consent-sdk',
      '#onetrust-pc-sdk',
      '#onetrust-banner-sdk',
      // Interstitial / language / video / vimeo / prm-leave modal overlays
      // (cleaned.html: .modal.aem-GridColumn at lines 380, 408, 436, 449, 509)
      '.modal.aem-GridColumn',
      // Plyr SVG icon sprite dumped at top of body (cleaned.html line 2)
      '#sprite-plyr',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome an author would never create when authoring a page.
    WebImporter.DOMUtils.remove(element, [
      // Experience-fragment header + its nav (cleaned.html line 10)
      'header.experiencefragment',
      '.cmp-experiencefragment--header',
      // Header spacer left behind by the sticky header (cleaned.html line 165)
      '.header-spacer',
      // Experience-fragment footer + link lists (cleaned.html line 538)
      'footer.experiencefragment',
      '.cmp-experiencefragment--footer',
      // Non-authorable leftover elements
      'iframe',
      'link',
      'noscript',
    ]);
  }
}
