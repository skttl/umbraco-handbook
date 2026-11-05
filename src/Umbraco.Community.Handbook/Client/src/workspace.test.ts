// @vitest-environment jsdom
import { beforeEach,expect,it,vi } from 'vitest';
import { HandbookWorkspace } from './workspace';
import { HandbookPageElement } from './page.element';
import { getHandbookTree } from './api/sdk.gen';
import { documentId } from './paths';

const { sidebar } = vi.hoisted(()=>({sidebar:{expansion:{expandItems:vi.fn()}}}));
vi.mock('@umbraco-cms/backoffice/class-api',()=>({UmbContextBase:class {
  consumeContext(_token:unknown,callback:(context:unknown)=>void) { callback(sidebar); }
  destroy() {}
}}));
vi.mock('@umbraco-cms/backoffice/repository',()=>({UmbRepositoryBase:class {}}));
vi.mock('@umbraco-cms/backoffice/workspace',()=>({UmbWorkspaceRouteManager:class {
  routes:unknown[] = [];
  setRoutes(routes:unknown[]) { this.routes = routes; }
}}));
vi.mock('@umbraco-cms/backoffice/menu',()=>({UMB_SECTION_SIDEBAR_MENU_SECTION_CONTEXT:{}}));
vi.mock('@umbraco-cms/backoffice/utils',()=>import('../node_modules/@umbraco-cms/backoffice/dist-cms/packages/core/utils/expansion/utils/link-entity-expansion-entries.js'));
vi.mock('./page.element',()=>({HandbookPageElement:class {path = '';}}));
vi.mock('./api/sdk.gen',()=>({getHandbookTree:vi.fn()}));

beforeEach(()=>{
  vi.clearAllMocks();
  vi.mocked(getHandbookTree).mockResolvedValue({data:[
    {path:'guide',parent:'',title:'Guide',isFolder:true,hasChildren:true},
    {path:'guide/nested',parent:'guide',title:'Nested',isFolder:true,hasChildren:true},
  ]} as never);
});

function workspace() {
  const workspace = new HandbookWorkspace({} as never);
  const route = (workspace.routes as unknown as {routes:{setup:(page:HandbookPageElement,info:unknown)=>void}[]}).routes[0];
  const navigate = (path:string) => {
    const page = new HandbookPageElement();
    route.setup(page,{match:{params:{unique:documentId(path)}}});
    expect(page.path).toBe(path);
    return page;
  };
  return {workspace,navigate};
}

it('reveals the current article through its parent folders when navigating by route',async()=>{
  const {navigate} = workspace();
  const article = navigate('guide/nested/article.md');
  await vi.waitFor(()=>expect(sidebar.expansion.expandItems).toHaveBeenLastCalledWith([
    {unique:null,entityType:'handbook-root',menuItemAlias:'Handbook.MenuItem',target:{unique:documentId('guide'),entityType:'handbook-page'}},
    {unique:documentId('guide'),entityType:'handbook-page',menuItemAlias:'Handbook.MenuItem',target:{unique:documentId('guide/nested'),entityType:'handbook-page'}},
    {unique:documentId('guide/nested'),entityType:'handbook-page',menuItemAlias:'Handbook.MenuItem',target:{unique:documentId('guide/nested/article.md'),entityType:'handbook-page'}},
  ]));
  expect(article.ancestors.map(item=>item.name)).toEqual(['Guide','Nested']);
});

it('does not expand an old article after navigating to a different article',async()=>{
  const {navigate} = workspace();
  navigate('guide/nested/article.md');
  navigate('other.md');
  await vi.waitFor(()=>expect(sidebar.expansion.expandItems).toHaveBeenCalled());
  expect(sidebar.expansion.expandItems.mock.calls).toEqual([[[
    {unique:null,entityType:'handbook-root',menuItemAlias:'Handbook.MenuItem',target:{unique:documentId('other.md'),entityType:'handbook-page'}},
  ]]]);
});
