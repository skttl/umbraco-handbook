import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbWorkspaceRouteManager } from '@umbraco-cms/backoffice/workspace';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { HandbookPageElement } from './page.element';
import { documentPath } from './paths';
import { UMB_SECTION_SIDEBAR_MENU_SECTION_CONTEXT } from '@umbraco-cms/backoffice/menu';
import { linkEntityExpansionEntries } from '@umbraco-cms/backoffice/utils';
import { HandbookRepository } from './repository';

export class HandbookWorkspace extends UmbContextBase {
  readonly workspaceAlias = 'Handbook.Workspace';
  readonly routes = new UmbWorkspaceRouteManager(this);
  #unique = 'root';
  #repository = new HandbookRepository(this);
  #sidebar?: typeof UMB_SECTION_SIDEBAR_MENU_SECTION_CONTEXT.TYPE;
  #navigationRequest = 0;
  #page?: HandbookPageElement;
  constructor(host: UmbControllerHost) {
    super(host, new UmbContextToken<HandbookWorkspace>('Handbook.Workspace'));
    this.consumeContext(UMB_SECTION_SIDEBAR_MENU_SECTION_CONTEXT, sidebar => {
      this.#sidebar = sidebar;
      void this.#expandNavigation();
    });
    this.routes.setRoutes([{path:'edit/:unique',component:HandbookPageElement,setup:(component,info) => {
      this.#unique = info.match.params.unique;
      if (!(component instanceof HandbookPageElement)) return;
      this.#page = component;
      component.ancestors = [];
      try { component.path = documentPath(this.#unique); } catch { component.path = '../invalid'; }
      void this.#expandNavigation();
    }}]);
  }
  async #expandNavigation() {
    const request = ++this.#navigationRequest;
    if (!this.#page) return;
    const entity = {unique:this.#unique,entityType:this.getEntityType()};
    const {data:ancestors} = await this.#repository.requestTreeItemAncestors({treeItem:entity});
    if (!ancestors || request !== this.#navigationRequest) return;
    this.#page.ancestors = ancestors;
    const {data:root} = await this.#repository.requestTreeRoot();
    if (request !== this.#navigationRequest) return;
    const entries = linkEntityExpansionEntries([root,...ancestors,entity]).slice(0,-1);
    this.#sidebar?.expansion.expandItems(entries.map(item=>({...item,menuItemAlias:'Handbook.MenuItem'})));
  }
  override destroy() { this.#navigationRequest++; super.destroy(); }
  getUnique() { return this.#unique; }
  getEntityType() { return 'handbook-page'; }
}
export { HandbookWorkspace as api };
