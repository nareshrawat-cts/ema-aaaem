// Origin that hosts the DAM video asset. Authored hrefs are root-relative
// (/content/dam/...), which only resolve on the source origin, so we rebase
// them there when the href is not already absolute.
const DAM_ORIGIN = 'https://www.allerganaesthetics.es';

/**
 * Resolve an authored video href to a loadable URL.
 * Absolute (http/https) hrefs are used as-is; root-relative DAM paths are
 * rebased onto the DAM origin so the real video plays in preview and prod.
 */
function resolveVideoSrc(href) {
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('/content/dam/')) return `${DAM_ORIGIN}${href}`;
  return href;
}

/**
 * Build the bottom-center play/stop control pill (matches the source site).
 * @param {HTMLVideoElement} video
 * @returns {HTMLElement}
 */
function buildControls(video) {
  const controls = document.createElement('div');
  controls.className = 'hero-video-controls';

  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'hero-video-play';
  play.setAttribute('aria-label', 'Reproducir vídeo');
  play.innerHTML = '<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z"/></svg>';

  const stop = document.createElement('button');
  stop.type = 'button';
  stop.className = 'hero-video-stop';
  stop.setAttribute('aria-label', 'Detener vídeo');
  stop.innerHTML = '<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M384 128v255.1c0 35.35-28.65 64-64 64H64c-35.35 0-64-28.65-64-64V128c0-35.35 28.65-64 64-64H320C355.3 64 384 92.65 384 128z"/></svg>';

  const sync = () => {
    const playing = !video.paused && !video.ended;
    controls.classList.toggle('is-playing', playing);
  };

  play.addEventListener('click', () => { video.play(); });
  stop.addEventListener('click', () => { video.pause(); });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);

  controls.append(play, stop);
  sync();
  return controls;
}

/**
 * Hero Video block
 * Row 1: media cell (picture fallback image + link to an .mp4 video)
 * Row 2: content cell (title, subheading lines, CTA)
 *
 * The picture is used as the poster/fallback and the .mp4 link is upgraded
 * to an autoplaying, muted, looping background <video> with play/stop controls.
 * @param {Element} block
 */
export default function decorate(block) {
  const [mediaRow, contentRow] = [...block.children];

  if (mediaRow) mediaRow.classList.add('hero-video-media');
  if (contentRow) contentRow.classList.add('hero-video-content');

  const picture = mediaRow?.querySelector('picture');
  const videoLink = mediaRow?.querySelector('a[href*=".mp4"]');

  if (videoLink) {
    const src = resolveVideoSrc(videoLink.getAttribute('href'));
    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.muted = true;
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;

    const img = picture?.querySelector('img');
    if (img) video.setAttribute('poster', img.getAttribute('src'));

    const source = document.createElement('source');
    source.setAttribute('src', src);
    source.setAttribute('type', 'video/mp4');
    video.append(source);

    // Replace the bare link (and its wrapping <p>, if EDS added one).
    const target = videoLink.closest('p') && videoLink.closest('p').children.length === 1
      ? videoLink.closest('p')
      : videoLink;
    target.replaceWith(video);

    // Bottom-center play/stop controls (matches source). Appended to the
    // block (not the media row) so the media child rules don't size it.
    block.append(buildControls(video));
  }

  if (!picture && !videoLink) block.classList.add('no-image');
}
