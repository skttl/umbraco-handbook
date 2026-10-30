export const documentId = (path: string) => path ? btoa(String.fromCharCode(...new TextEncoder().encode(path))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','') : 'root';
export const documentPath = (id: string) => id === 'root' ? '' : new TextDecoder('utf-8', {fatal:true}).decode(Uint8Array.from(atob(id.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0)));
export const pageUrl = (path: string, hash = '', backofficePath = '/umbraco') => `${backofficePath.replace(/\/$/,'')}/section/handbook/workspace/handbook-page/edit/${documentId(path)}${hash ? '#' + encodeURIComponent(hash) : ''}`;
export function localTarget(source: string, href: string): { path: string; hash: string } | undefined {
  try {
    if (/^[a-z][\w+.-]*:|^\/\//i.test(href)) return;
    const hashIndex = href.indexOf('#');
    const hash = hashIndex < 0 ? '' : decodeURIComponent(href.slice(hashIndex + 1));
    const raw = decodeURIComponent((hashIndex < 0 ? href : href.slice(0, hashIndex)).split('?')[0]);
    if (/[\\\x00-\x1f:]/.test(raw)) return;
    if (!raw) return {path:source,hash};
    const parts = raw.startsWith('/') ? [] : source.split('/').slice(0,-1);
    for (const part of raw.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') { if (!parts.length) return; parts.pop(); }
      else parts.push(part);
    }
    return {path:parts.join('/'),hash};
  } catch { return; }
}
