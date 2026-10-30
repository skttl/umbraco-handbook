import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbWorkspaceRouteManager } from '@umbraco-cms/backoffice/workspace';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { HandbookPageElement } from './page.element';
import { documentPath } from './paths';

export class HandbookWorkspace extends UmbContextBase {
  readonly workspaceAlias = 'Handbook.Workspace';
  readonly routes = new UmbWorkspaceRouteManager(this);
  #unique = 'root';
  constructor(host: UmbControllerHost) {
    super(host, new UmbContextToken<HandbookWorkspace>('Handbook.Workspace'));
    this.routes.setRoutes([{path:'edit/:unique',component:HandbookPageElement,setup:(component,info) => {
      this.#unique = info.match.params.unique;
      if (!(component instanceof HandbookPageElement)) return;
      try { component.path = documentPath(this.#unique); } catch { component.path = '../invalid'; }
    }}]);
  }
  getUnique() { return this.#unique; }
  getEntityType() { return 'handbook-page'; }
}
export { HandbookWorkspace as api };
