import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css,html,customElement,property,state } from '@umbraco-cms/backoffice/external/lit';
import { getHandbookPage,getHandbookAsset } from './api/sdk.gen';
import type { DocumentPage } from './api/types.gen';
import { localTarget,pageUrl } from './paths';
import { renderDocument } from './render';
import { UMB_SERVER_CONTEXT } from '@umbraco-cms/backoffice/server';

let diagramId = 0;
let mermaidQueue = Promise.resolve();

@customElement('handbook-page')
export class HandbookPageElement extends UmbLitElement {
  @property() path = '';
  @state() private _page?: DocumentPage;
  @state() private _error?: string;
  @state() private _loading = true;
  @state() private _backofficePath = '/umbraco';
  #request = 0;
  #urls: string[] = [];
  constructor() {
    super();
    this.consumeContext(UMB_SERVER_CONTEXT,server => { if (server) this._backofficePath = server.getBackofficePath(); });
  }
  protected override updated(changed: Map<PropertyKey, unknown>) {
    super.updated(changed);
    if (changed.has('path')) void this.#load();
  }
  #clearImages() { this.#urls.forEach(url=>URL.revokeObjectURL(url)); this.#urls = []; }
  override disconnectedCallback() { this.#request++; this.#clearImages(); super.disconnectedCallback(); }
  async #load() {
    const request = ++this.#request;
    this.#clearImages();
    this._loading = true; this._error = undefined; this._page = undefined;
    try {
      const result = await getHandbookPage({query:{path:this.path}});
      if (request !== this.#request) return;
      if (!result.data) {
        this._error = result.response?.status === 403 ? 'forbidden' : (result.error as {code?:string})?.code ?? 'readError';
        return;
      }
      this._page = result.data;
      this._loading = false;
      await this.updateComplete;
      const container = this.shadowRoot?.querySelector<HTMLElement>('#body');
      if (!container || request !== this.#request) return;
      const content = await renderDocument(result.data.body);
      if (request !== this.#request) return;
      this.#links(content,result.data.sourcePath);
      const images = this.#images(content,result.data.sourcePath,request);
      container.replaceChildren(content);
      await images;
      if (request !== this.#request) return;
      await this.#diagrams(content,request);
      this.#scrollToHash();
    } catch {
      if (request === this.#request) this._error = 'readError';
    } finally { if (request === this.#request) this._loading = false; }
  }
  #links(content: HTMLElement,source: string) {
    for (const link of content.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      const href = link.getAttribute('href') ?? '';
      if (/^(https?:|mailto:)/i.test(href)) { link.rel = 'noopener noreferrer'; continue; }
      const target = localTarget(source,href);
      if (!target) { link.removeAttribute('href'); continue; }
      let path = target.path;
      if (/(^|\/)readme\.md$/i.test(path)) path = path.includes('/') ? path.slice(0,path.lastIndexOf('/')) : '';
      link.href = pageUrl(path,target.hash,this._backofficePath);
      if (path === this.path) link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); history.pushState(null,'',link.href); this.#scrollToHash();
      });
    }
  }
  async #images(content: HTMLElement,source: string,request: number) {
    await Promise.all([...content.querySelectorAll<HTMLImageElement>('img')].map(async image => {
      const raw = image.getAttribute('data-handbook-src') ?? '';
      image.removeAttribute('data-handbook-src');
      image.removeAttribute('src');
      const target = localTarget(source,raw);
      try {
        if (!target) throw new Error('Unsupported image');
        const response = await getHandbookAsset({query:{path:target.path},parseAs:'blob'});
        const blob = response.data as unknown;
        if (!(blob instanceof Blob)) throw new Error('Image unavailable');
        if (request !== this.#request) return;
        const url = URL.createObjectURL(blob); this.#urls.push(url); image.src = url;
      } catch {
        if (request === this.#request) { const fallback = document.createElement('p'); fallback.textContent = `${this.localize.term('handbook_imageError')} ${image.alt}`; image.replaceWith(fallback); }
      }
    }));
  }
  async #diagrams(content: HTMLElement,request: number) {
    const blocks = [...content.querySelectorAll<HTMLElement>('pre > code.language-mermaid')];
    if (!blocks.length) return;
    const {default:mermaid} = await import('mermaid');
    const {default:purify} = await import('dompurify');
    for (const block of blocks) {
      const render = async () => {
        if (request !== this.#request) return;
        try {
          const theme = getComputedStyle(this);
          const surface = theme.getPropertyValue('--uui-color-surface-alt').trim() || '#f4f4f4';
          mermaid.initialize({startOnLoad:false,securityLevel:'strict',suppressErrorRendering:true,htmlLabels:false,flowchart:{htmlLabels:false},theme:'base',themeVariables:{fontFamily:theme.fontFamily,primaryColor:surface,primaryTextColor:theme.color,lineColor:theme.color,textColor:theme.color,edgeLabelBackground:surface}});
          const {svg} = await mermaid.render(`handbook-diagram-${++diagramId}`,block.textContent ?? '');
          if (request !== this.#request) return;
          const figure = document.createElement('figure');
          figure.append(purify.sanitize(svg,{USE_PROFILES:{svg:true,svgFilters:true},FORBID_TAGS:['foreignObject'],RETURN_DOM_FRAGMENT:true}));
          block.parentElement?.replaceWith(figure);
        } catch {
          if (request !== this.#request) return;
          const notice = document.createElement('p'); notice.textContent = this.localize.term('handbook_diagramError'); block.parentElement?.before(notice);
        }
      };
      mermaidQueue = mermaidQueue.then(render,render); await mermaidQueue;
    }
  }
  #scrollToHash() {
    try { const hash = decodeURIComponent(location.hash.slice(1)); if (hash) this.shadowRoot?.getElementById(hash)?.scrollIntoView(); } catch { /* Malformed fragment has no target. */ }
  }
  override render() {
    const title = this._page?.title || this.localize.term('handbook_name');
    return html`<umb-body-layout .headline=${title}>
      ${this._loading ? html`<p role="status">${this.localize.term('handbook_loading')}</p>` : ''}
      ${this._error ? html`<uui-box><p role="alert">${this.localize.term('handbook_' + this._error)}</p></uui-box>` : ''}
      ${this._page ? html`<uui-box><article>
        ${this._page.description ? html`<p class="description">${this._page.description}</p>` : ''}
        ${this._page.invalidMetadata ? html`<p role="status">${this.localize.term('handbook_invalidMetadata')}</p>` : ''}
        ${this._page.isOverview ? html`<ul class="overview">${this._page.children.map(node=>html`<li><a href=${pageUrl(node.path,'',this._backofficePath)}><uui-icon name=${node.isFolder ? 'icon-folder' : 'icon-document'}></uui-icon> ${node.title}</a>${node.description ? html`<p>${node.description}</p>` : ''}</li>`)}</ul>${!this._page.children.length ? html`<p>${this.localize.term('handbook_empty')}</p>` : ''}` : html`<div id="body"></div>`}
      </article></uui-box>` : ''}
    </umb-body-layout>`;
  }
  static override styles = css`
    :host{display:block;height:100%;min-width:0;color:var(--uui-color-text)}
    article{max-width:80ch;margin-inline:auto;line-height:1.65;overflow-wrap:anywhere}
    a{color:var(--uui-color-interactive)}a:focus-visible{outline:2px solid var(--uui-color-focus);outline-offset:3px}
    img,svg{max-width:100%;height:auto}pre,figure{overflow:auto;margin-inline:0}pre{padding:var(--uui-size-space-4);background:var(--uui-color-surface-alt);border-radius:var(--uui-border-radius)}
    table{display:block;overflow:auto;border-collapse:collapse}th,td{padding:var(--uui-size-space-3);border:1px solid var(--uui-color-border)}
    blockquote{border-inline-start:3px solid var(--uui-color-border);margin-inline:0;padding-inline-start:var(--uui-size-space-5)}
    .description{color:var(--uui-color-text-alt)}.overview{list-style:none;padding:0}.overview li{padding-block:var(--uui-size-space-4);border-bottom:1px solid var(--uui-color-border)}.overview p{margin:0}
    h1,h2,h3,h4,h5,h6{line-height:1.3;scroll-margin-top:var(--uui-size-space-5)}
    svg .flowchart-link{stroke:var(--uui-color-text)!important}svg marker path{fill:var(--uui-color-text)!important;stroke:var(--uui-color-text)!important}
  `;
}
export default HandbookPageElement;
