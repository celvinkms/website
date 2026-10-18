const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createHarness() {
  const routes = new Map();
  const state = { config: { username: 'celvin', bio: 'Gaming, design & late night ideas.', password: 'hash:old-password' }, fail: false, writes: 0 };
  const app = { use() {}, get(url, ...handlers) { routes.set('GET '+url, handlers); }, post(url, ...handlers) { routes.set('POST '+url, handlers); } };
  const express = Object.assign(() => app, Object.fromEntries(['static','json','urlencoded','raw'].map(key => [key, () => () => {}])));
  class Pool {
    async query(sql, values) {
      if (state.fail) throw Object.assign(new Error('Simulated database failure'), { code: 'TEST' });
      if (sql.startsWith('SELECT data FROM bio_config')) return { rows: [{ data: structuredClone(state.config) }] };
      if (sql.startsWith('UPDATE bio_config SET data = jsonb_set')) { state.config.password=JSON.parse(values[0]); state.writes++; }
      else if (sql.startsWith('UPDATE bio_config SET data = data ||')) { Object.assign(state.config, JSON.parse(values[0])); state.writes++; }
      else if (sql.startsWith('UPDATE bio_config SET data = $1')) { state.config=structuredClone(values[0]); state.writes++; }
      return { rows: [] };
    }
  }
  const source = fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
  const context = vm.createContext({
    require(name) {
      if(name==='express')return express;
      if(name==='express-session')return () => () => {};
      if(name==='pg')return { Pool };
      if(name==='bcrypt')return { hash: async value => 'hash:'+value, compare: async (value,hash) => hash==='hash:'+value };
      return require(name);
    },
    __dirname:path.join(__dirname,'..'), console:{ ...console, error(){} }, process, Buffer, URL, setTimeout, clearTimeout
  });
  vm.runInContext(source.slice(0,source.lastIndexOf('initDB().then')),context);
  async function request(method,url,body={},authenticated=true) {
    const req={body,session:{authenticated},headers:{},query:{},protocol:'http',get:()=> 'localhost'};
    const result={status:200,body:null};
    const res={set(){return this;},status(code){result.status=code;return this;},json(body){result.body=body;},send(body){result.body=body;},redirect(url){result.status=302;result.body=url;}};
    const handlers=routes.get(method+' '+url); if(!handlers)throw new Error('No route: '+url);
    async function run(index){if(index<handlers.length)await handlers[index](req,res,()=>run(index+1));}
    await run(0);return result;
  }
  return { state, request };
}
module.exports = { createHarness };
