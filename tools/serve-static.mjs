import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root=resolve(process.cwd());
const port=Number(process.env.PORT||8793);
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};

http.createServer(async(request,response)=>{
  try{
    const relative=decodeURIComponent(new URL(request.url,'http://localhost').pathname.slice(1))||'qu-market.html';
    const target=resolve(root,relative);
    if(target!==root&&!target.startsWith(`${root}${sep}`))throw new Error('outside_root');
    const body=await readFile(target);
    response.writeHead(200,{'content-type':contentTypes[extname(target)]||'application/octet-stream','cache-control':'no-store'});
    response.end(body);
  }catch{
    response.writeHead(404,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});
    response.end('Not found');
  }
}).listen(port,'127.0.0.1',()=>console.log(`SECQUOIA static preview http://127.0.0.1:${port}/`));
