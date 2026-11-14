import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp4':'video/mp4', '.json':'application/json' };
http.createServer(async(req,res)=>{
  try {
    let file=path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(file!==root && !file.startsWith(root+path.sep)) { res.writeHead(403);res.end();return; }
    if((await stat(file)).isDirectory()) file=path.join(file,'index.html');
    const data=await readFile(file); res.writeHead(200, {'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
  } catch {res.writeHead(404);res.end('Página não encontrada');}
}).listen(port,'0.0.0.0',()=>console.log(`Mãos de Ouro em http://localhost:${port}`));
