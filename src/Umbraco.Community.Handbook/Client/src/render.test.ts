// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { renderDocument } from './render';
it('removes active HTML, preserves GFM and makes unique heading anchors', async () => {
  const fragment = await renderDocument('# Æble\n\n## Æble\n\n| A | B |\n| - | - |\n| x | y |\n\n<script>alert(1)</script><img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))');
  expect(fragment.querySelector('script')).toBeNull();
  expect(fragment.querySelector('[onerror]')).toBeNull();
  expect(fragment.querySelector('a')?.getAttribute('href')).toBeNull();
  expect(fragment.querySelectorAll('table')).toHaveLength(1);
  expect([...fragment.querySelectorAll('h1,h2')].map(h=>h.id)).toEqual(['æble','æble-1']);
});
it('keeps image URLs inert until the authenticated image loader validates them', async () => {
  const fragment = await renderDocument('![Example](https://tracking.invalid/image.png)\n\n<img src="https://tracking.invalid/raw.png">');
  expect(fragment.querySelectorAll('img[src]')).toHaveLength(0);
  expect(fragment.querySelector('img')?.getAttribute('data-handbook-src')).toBe('https://tracking.invalid/image.png');
});
