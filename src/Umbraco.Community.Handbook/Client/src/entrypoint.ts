import type { UmbEntryPointOnInit } from '@umbraco-cms/backoffice/extension-api';
import type {} from '@umbraco-cms/backoffice/extension-types';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { client } from './api/client.gen';
import { localeManifests } from './locales/manifests';

const condition = [{alias:'Umb.Condition.SectionAlias',match:'Handbook.Section'}];
const manifests: UmbExtensionManifest[] = [
  {type:'section',alias:'Handbook.Section',name:'Handbook',weight:50,meta:{label:'#handbook_name',pathname:'handbook'},conditions:[{alias:'Umb.Condition.SectionUserPermission',match:'Handbook.Section'}]},
  {type:'sectionSidebarApp',kind:'menu',alias:'Handbook.Sidebar',name:'Handbook sidebar',meta:{label:'#handbook_name',menu:'Handbook.Menu'},conditions:condition},
  {type:'menu',alias:'Handbook.Menu',name:'Handbook menu',meta:{label:'#handbook_name'}},
  {type:'menuItem',kind:'tree',alias:'Handbook.MenuItem',name:'Handbook tree menu',meta:{label:'#handbook_name',icon:'icon-book',entityType:'handbook-root',menus:['Handbook.Menu'],treeAlias:'Handbook.Tree',hideTreeRoot:true}},
  {type:'repository',alias:'Handbook.Repository',name:'Handbook repository',api:()=>import('./repository')},
  {type:'tree',kind:'default',alias:'Handbook.Tree',name:'Handbook tree',meta:{repositoryAlias:'Handbook.Repository'}},
  {type:'treeItem',kind:'default',alias:'Handbook.TreeItem',name:'Handbook tree item',forEntityTypes:['handbook-root','handbook-page']},
  {type:'workspace',kind:'routable',alias:'Handbook.Workspace',name:'Handbook page',api:()=>import('./workspace'),meta:{entityType:'handbook-page'}},
  {type:'dashboard',alias:'Handbook.Dashboard',name:'Handbook overview',element:()=>import('./page.element'),meta:{label:'#handbook_name',pathname:'overview'},conditions:condition},
  ...localeManifests,
];
export const onInit: UmbEntryPointOnInit = async (host, registry) => {
  await new Promise<void>(resolve => host.consumeContext(UMB_AUTH_CONTEXT, auth => {
    if (!auth) return;
    const config = auth.getOpenApiConfiguration();
    client.setConfig({baseUrl:config.base,credentials:config.credentials});
    resolve();
  }));
  registry.registerMany(manifests);
};
