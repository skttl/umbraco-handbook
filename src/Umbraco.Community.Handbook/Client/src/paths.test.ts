import { describe, expect, it } from 'vitest';
import { documentId, documentPath, localTarget, pageUrl } from './paths';
describe('documentation routes', () => {
  it('round trips unicode paths without putting slashes in entity IDs', () => {
    const id = documentId('vejledning/Æble & pære.md');
    expect(id).not.toContain('/');
    expect(documentPath(id)).toBe('vejledning/Æble & pære.md');
    expect(pageUrl('')).toContain('/edit/root');
  });
  it('resolves links relative to README files and blocks escapes', () => {
    expect(localTarget('news/README.md', '../images/photo.png')).toEqual({path:'images/photo.png',hash:''});
    expect(localTarget('news/README.md', '#a-heading')).toEqual({path:'news/README.md',hash:'a-heading'});
    expect(localTarget('README.md', '../private.md')).toBeUndefined();
    expect(localTarget('README.md', '%2e%2e/private.md')).toBeUndefined();
    expect(localTarget('README.md', 'javascript:alert(1)')).toBeUndefined();
  });
  it('uses the configured backoffice path for document links', () => {
    expect(pageUrl('guide.md','intro','/cms-admin/')).toBe('/cms-admin/section/handbook/workspace/handbook-page/edit/Z3VpZGUubWQ#intro');
  });
});
