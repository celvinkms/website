const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const serverRequire = require('node:module').createRequire(path.join(__dirname,'../server.js'));

function createHarness() {
  const routes = new Map();
  const state = { config: { username: 'celvin', bio: 'Gaming, design & late night ideas.', password: 'hash:old-password' }, fail: false, writes: 0 };
  const app = { use() {}, get(url, ...handlers) { routes.set('GET '+url, handlers); }, post(url, ...handlers) { routes.set('POST '+url, handlers); } };
  const express = Object.assign(() => app, Object.fromEntries(['static','json','urlencoded','raw'].map(key => [key, () => () => {}])));
  express.raw=()=> (req,res,next)=>next();
  state.assets=new Map();
  class Pool extends require("node:events").EventEmitter {
    constructor(){super();state.pool=this;}
    async query(sql, values) {
      if (sql.includes("jsonb_set(data, '{views}'")) {
        if(state.failViews)throw new Error('Simulated counter connection loss');
        state.config.views=(Number(state.config.views)||0)+1;state.writes++;return {rows:[]};
      }
      if (state.fail) throw Object.assign(new Error('Simulated database failure'), { code: 'TEST' });
      if(sql.startsWith('INSERT INTO bio_assets')&&values[0].startsWith('entry_bg_')){state.assets.set(values[0],{content_type:values[2],data:Buffer.from(values[3]),size_bytes:values[4]});return {rows:[]};}
      if(sql.startsWith('SELECT content_type,data,size_bytes FROM bio_assets'))return {rows:state.assets.has(values[0])?[state.assets.get(values[0])]:[]};
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
      if(name==='./discord-presence'){
        const presence=serverRequire(name);
        return {...presence,createPresenceService:()=>presence.createPresenceService({fetchImpl:async()=>{state.presenceRequests=(state.presenceRequests||0)+1;return state.presenceUnavailable?{ok:false,status:404}:{ok:true,status:200,json:async()=>state.presencePayload||{success:false}};}})};
      }
      if(name==='bcrypt')return { hash: async value => 'hash:'+value, compare: async (value,hash) => hash==='hash:'+value };
      return serverRequire(name);
    },
    __dirname:path.join(__dirname,'..'), console:{ ...console, error(){} }, process, Buffer, URL, setTimeout, clearTimeout
  });
  vm.runInContext(source.slice(0,source.lastIndexOf('initDB().then')),context);
  async function request(method,url,body={},authenticated=true,options={}) {
    const req={body,session:{authenticated},headers:options.headers||{},params:options.params||{},query:{},protocol:'http',get:()=> 'localhost'};
    const result={status:200,body:null,headers:{}};
    const res={set(key,value){if(typeof key==='object')Object.assign(result.headers,key);else result.headers[key]=value;return this;},status(code){result.status=code;return this;},json(body){result.body=body;},send(body){result.body=body;},redirect(url){result.status=302;result.body=url;}};
    const handlers=routes.get(method+' '+url); if(!handlers)throw new Error('No route: '+url);
    async function run(index){if(index<handlers.length)await handlers[index](req,res,()=>run(index+1));}
    await run(0);return result;
  }
  return { state, request };
}
module.exports = { createHarness };
