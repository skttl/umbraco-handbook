import { expect,it,vi } from 'vitest';
import { onInit } from './entrypoint';
import { client } from './api/client.gen';
import { getHandbookTree, getHandbookPage, getHandbookAsset } from './api/sdk.gen';

vi.mock('@umbraco-cms/backoffice/auth',()=>({UMB_AUTH_CONTEXT:{}}));

it('uses the Umbraco server and session cookie for tree, page and asset requests',async()=>{
  const requests: Request[] = [];
  client.setConfig({fetch:async input=>{
    requests.push(input as Request);
    return new Response('[]',{headers:{'Content-Type':'application/json'}});
  }});
  const auth = {getOpenApiConfiguration:()=>({base:'https://cms.example.test',credentials:'include',get token(){throw new Error('Bearer tokens are unavailable in Umbraco 19');}})};
  const host = {consumeContext:(_context:unknown,callback:(auth:unknown)=>void)=>callback(auth)};
  const registry = {registerMany:vi.fn()};
  await onInit(host as never,registry as never);
  await getHandbookTree();
  await getHandbookPage({query:{path:'guide.md'}});
  await getHandbookAsset({query:{path:'image.png'}});
  expect(requests.map(request=>request.url)).toEqual([
    'https://cms.example.test/umbraco/management/api/v1/handbook/tree',
    'https://cms.example.test/umbraco/management/api/v1/handbook/page?path=guide.md',
    'https://cms.example.test/umbraco/management/api/v1/handbook/asset?path=image.png',
  ]);
  expect(requests.map(request=>request.headers.get('Authorization'))).toEqual([null,null,null]);
  expect(requests.map(request=>request.credentials)).toEqual(['include','include','include']);
  expect(registry.registerMany).toHaveBeenCalledOnce();
});
