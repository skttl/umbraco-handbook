import { UmbRepositoryBase } from '@umbraco-cms/backoffice/repository';
import type { UmbTreeRepository, UmbTreeItemModel, UmbTreeRootModel, UmbTreeChildrenOfRequestArgs, UmbTreeAncestorsOfRequestArgs, UmbTreeRootItemsRequestArgs } from '@umbraco-cms/backoffice/tree';
import { getHandbookTree } from './api/sdk.gen';
import type { DocumentNode } from './api/types.gen';
import { documentId, documentPath } from './paths';

export class HandbookRepository extends UmbRepositoryBase implements UmbTreeRepository {
  #nodes?: Promise<DocumentNode[]>;
  async #all() { return this.#nodes ??= getHandbookTree({throwOnError:true}).then(r => r.data); }
  #item(n: DocumentNode): UmbTreeItemModel {
    return { unique:documentId(n.path), entityType:'handbook-page', name:n.title,
      parent:{unique:n.parent ? documentId(n.parent) : null,entityType:n.parent ? 'handbook-page' : 'handbook-root'},
      hasChildren:n.hasChildren,isFolder:n.isFolder,icon:n.isFolder ? 'icon-folder' : 'icon-document' };
  }
  async requestTreeRoot() {
    const data: UmbTreeRootModel = {unique:null,entityType:'handbook-root',name:'Handbook',hasChildren:true,isFolder:true,icon:'icon-book'};
    return {data};
  }
  async #children(parent: string, args: UmbTreeRootItemsRequestArgs) {
    try {
      const all = (await this.#all()).filter(n => n.parent === parent && (!args.foldersOnly || n.isFolder));
      const skip = args.paging && 'skip' in args.paging ? args.paging.skip ?? 0 : 0;
      const take = args.paging && 'take' in args.paging ? args.paging.take ?? 100 : all.length;
      const items = all.slice(skip,skip+take).map(n => this.#item(n));
      return {data:{items,total:all.length,totalBefore:skip,totalAfter:Math.max(0,all.length-skip-items.length)},asObservable:()=>undefined};
    } catch (error) { return {error:error instanceof Error ? error : new Error('Handbook tree unavailable'),asObservable:()=>undefined}; }
  }
  requestTreeRootItems(args: UmbTreeRootItemsRequestArgs) { return this.#children('', args); }
  requestTreeItemsOf(args: UmbTreeChildrenOfRequestArgs) { return this.#children(args.parent.unique ? documentPath(args.parent.unique) : '', args); }
  async requestTreeItemAncestors(args: UmbTreeAncestorsOfRequestArgs) {
    try {
      const path = documentPath(args.treeItem.unique);
      const nodes = await this.#all();
      const parts = path.split('/');
      const data: UmbTreeItemModel[] = [];
      for (let i=1;i<parts.length;i++) {
        const node = nodes.find(n => n.path === parts.slice(0,i).join('/'));
        if (node) data.push(this.#item(node));
      }
      return {data};
    } catch (error) { return {error:error instanceof Error ? error : new Error('Handbook tree unavailable')}; }
  }
}
export { HandbookRepository as api };
