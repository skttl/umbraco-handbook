// @vitest-environment jsdom
import { beforeEach,expect,it,vi } from 'vitest';
import { LitElement } from 'lit';
import { getHandbookPage } from './api/sdk.gen';
import './page.element';
import type { HandbookPageElement } from './page.element';

vi.mock('@umbraco-cms/backoffice/lit-element',()=>({UmbLitElement:class extends LitElement {
  localize = {term:(key:string)=>key};
  consumeContext() {}
}}));
vi.mock('@umbraco-cms/backoffice/external/lit',async()=>({...await import('lit'),...await import('lit/decorators.js')}));
vi.mock('@umbraco-cms/backoffice/server',()=>({UMB_SERVER_CONTEXT:{}}));
vi.mock('./api/sdk.gen',()=>({getHandbookPage:vi.fn(),getHandbookAsset:vi.fn()}));

beforeEach(()=>{ document.body.replaceChildren(); vi.mocked(getHandbookPage).mockReset(); });
const deferred = () => { let resolve!: (value:unknown)=>void; const promise = new Promise<unknown>(r=>resolve=r); return {promise,resolve}; };
const page = (name:string) => ({data:{path:name,sourcePath:name,title:name,body:`# ${name}`,description:null,children:[],invalidMetadata:false,isOverview:false},response:{status:200}});
const tick = () => new Promise(resolve=>setTimeout(resolve,0));

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
});

it('does not render a pending response after the page disconnects',async()=>{
  const pending = deferred();
  vi.mocked(getHandbookPage).mockReturnValueOnce(pending.promise as never);
  const element = document.createElement('handbook-page') as HandbookPageElement;
  document.body.append(element); await element.updateComplete; element.remove();
  pending.resolve(page('disconnected content')); await tick();
  expect(element.shadowRoot?.textContent).not.toContain('disconnected content');
});
