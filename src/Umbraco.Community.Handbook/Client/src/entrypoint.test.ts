import { expect,it,vi } from 'vitest';
import { onInit } from './entrypoint';
import { client } from './api/client.gen';
import { getHandbookTree } from './api/sdk.gen';

vi.mock('@umbraco-cms/backoffice/auth',()=>({UMB_AUTH_CONTEXT:{}}));

it('uses the Umbraco server and resolves a fresh bearer token for each request',async()=>{
  let token = 'first-token';
  const requests: Request[] = [];
  client.setConfig({fetch:async input=>{
    requests.push(input as Request);
    return new Response('[]',{headers:{'Content-Type':'application/json'}});
  }});
  const auth = {getOpenApiConfiguration:()=>({base:'https://cms.example.test',credentials:'include',token:async()=>token})};
  const host = {consumeContext:(_context:unknown,callback:(auth:unknown)=>void)=>callback(auth)};
  const registry = {registerMany:vi.fn()};
  await onInit(host as never,registry as never);
  await getHandbookTree();
  token = 'refreshed-token';
  await getHandbookTree();
  expect(requests.map(request=>request.url)).toEqual([
    'https://cms.example.test/umbraco/management/api/v1/handbook/tree',
    'https://cms.example.test/umbraco/management/api/v1/handbook/tree',
  ]);
  expect(requests.map(request=>request.headers.get('Authorization'))).toEqual(['Bearer first-token','Bearer refreshed-token']);
  expect(requests.map(request=>request.credentials)).toEqual(['include','include']);
  expect(registry.registerMany).toHaveBeenCalledOnce();
});
