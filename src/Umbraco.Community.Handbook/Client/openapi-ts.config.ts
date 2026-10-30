import { defineConfig } from '@hey-api/openapi-ts';
// shortcut: the YAML override is verified for local JSON schemas; remove it once the upstream parser is patched.
export default defineConfig({input:'http://localhost:5180/umbraco/swagger/handbook/swagger.json',output:'src/api',plugins:['@hey-api/typescript','@hey-api/sdk',{name:'@hey-api/client-fetch',exportFromIndex:true}]});
