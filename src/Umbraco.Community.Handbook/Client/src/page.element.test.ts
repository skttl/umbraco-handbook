// @vitest-environment jsdom
import { beforeEach,expect,it,vi } from 'vitest';
import { LitElement } from 'lit';
import { getHandbookPage } from './api/sdk.gen';
import './page.element';
import type { HandbookPageElement } from './page.element';

const { setTitle } = vi.hoisted(()=>({setTitle:vi.fn()}));
vi.mock('@umbraco-cms/backoffice/view',()=>({UmbViewContext:class {setTitle = setTitle;}}));
vi.mock('@umbraco-cms/backoffice/lit-element',()=>({UmbLitElement:class extends LitElement {
  localize = {term:(key:string)=>key};
  consumeContext() {}
}}));
vi.mock('@umbraco-cms/backoffice/external/lit',async()=>({...await import('lit'),...await import('lit/decorators.js')}));
vi.mock('@umbraco-cms/backoffice/server',()=>({UMB_SERVER_CONTEXT:{}}));
vi.mock('./api/sdk.gen',()=>({getHandbookPage:vi.fn(),getHandbookAsset:vi.fn()}));

beforeEach(()=>{ document.body.replaceChildren(); vi.mocked(getHandbookPage).mockReset(); setTitle.mockClear(); });
const deferred = () => { let resolve!: (value:unknown)=>void; const promise = new Promise<unknown>(r=>resolve=r); return {promise,resolve}; };
const page = (name:string) => ({data:{path:name,sourcePath:name,title:name,body:`# ${name}`,description:null,children:[],invalidMetadata:false,isOverview:false},response:{status:200}});
const tick = () => new Promise(resolve=>setTimeout(resolve,0));

it('sets the article title for the Umbraco browser view',async()=>{
  vi.mocked(getHandbookPage).mockResolvedValueOnce(page('Kom godt i gang') as never);
  const element = document.createElement('handbook-page') as HandbookPageElement;
  document.body.append(element);
  await vi.waitFor(()=>expect(setTitle).toHaveBeenLastCalledWith('Kom godt i gang | Handbook'));
});

it('renders linked ancestors and the current article in the footer breadcrumbs',async()=>{
  vi.mocked(getHandbookPage).mockResolvedValueOnce(page('Installation') as never);
  const element = document.createElement('handbook-page') as HandbookPageElement;
  element.path = 'guide/install.md';
  element.ancestors = [{unique:'Z3VpZGU',entityType:'handbook-page',name:'Kom godt i gang'}] as never;
  document.body.append(element);
  await vi.waitFor(()=>expect(element.shadowRoot?.querySelectorAll('uui-breadcrumb-item')).toHaveLength(3));
  const footer = element.shadowRoot!.querySelector('umb-footer-layout[slot="footer"]')!;
  const items = [...footer.querySelectorAll('uui-breadcrumb-item')];
  expect(items.map(item=>item.textContent?.trim())).toEqual(['Handbook','Kom godt i gang','Installation']);
  expect(items[0].getAttribute('href')).toBe('/umbraco/section/handbook/workspace/handbook-page/edit/root');
  expect(items[1].getAttribute('href')).toBe('/umbraco/section/handbook/workspace/handbook-page/edit/Z3VpZGU');
  expect(items[2].hasAttribute('last-item')).toBe(true);
  expect(items[2].hasAttribute('href')).toBe(false);
});

it('renders the handbook overview as a single breadcrumb',async()=>{
  vi.mocked(getHandbookPage).mockResolvedValueOnce(page('Handbook') as never);
  const element = document.createElement('handbook-page') as HandbookPageElement;
  document.body.append(element);
  await vi.waitFor(()=>expect(element.shadowRoot?.querySelectorAll('uui-breadcrumb-item')).toHaveLength(1));
  expect(element.shadowRoot?.querySelector('uui-breadcrumb-item[last-item]')?.textContent).toBe('Handbook');
});

it('ignores a slow previous response after navigating to another document',async()=>{
  const old = deferred(); const current = deferred();
  vi.mocked(getHandbookPage).mockReturnValueOnce(old.promise as never).mockReturnValueOnce(current.promise as never);
  const element = document.createElement('handbook-page') as HandbookPageElement;
  element.path = 'old'; document.body.append(element); await element.updateComplete;
  element.path = 'current'; await element.updateComplete;
  current.resolve(page('current'));
  await vi.waitFor(()=>expect(element.shadowRoot?.textContent).toContain('current'));
  old.resolve(page('old')); await tick(); await element.updateComplete;
  expect(element.shadowRoot?.querySelector('h1')?.textContent).toBe('current');
  expect(element.shadowRoot?.textContent).not.toContain('old');
  expect(setTitle).toHaveBeenLastCalledWith('current | Handbook');
});

it('does not render a pending response after the page disconnects',async()=>{
  const pending = deferred();
  vi.mocked(getHandbookPage).mockReturnValueOnce(pending.promise as never);
  const element = document.createElement('handbook-page') as HandbookPageElement;
  document.body.append(element); await element.updateComplete; element.remove();
  pending.resolve(page('disconnected content')); await tick();
  expect(element.shadowRoot?.textContent).not.toContain('disconnected content');
  expect(setTitle).not.toHaveBeenCalledWith('disconnected content | Handbook');
});
