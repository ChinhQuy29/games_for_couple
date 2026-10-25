/// <reference types="vite/client" />
// Kenney's CC0 "New Platformer Pack" images (see assets/CREDITS.md), loaded once.

const urls = import.meta.glob('./assets/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const images = new Map<string, HTMLImageElement>();

/** The image for e.g. 'tiles/spikes', or null until it has loaded. */
export function sprite(name: string): HTMLImageElement | null {
  let img = images.get(name);
  if (!img) {
    const url = urls[`./assets/${name}.png`];
    if (!url) return null;
    img = new Image();
    img.src = url;
    images.set(name, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Start loading everything up front, so the first frames aren't missing tiles. */
export function preloadSprites() {
  for (const path of Object.keys(urls)) sprite(path.slice('./assets/'.length, -'.png'.length));
}
