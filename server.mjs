import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname} from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const port=Number(process.env.PORT)||5173;
const publicFiles=new Set(['/index.html','/app.js','/domain.js','/styles.css']);
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);if(!publicFiles.has(pathname)){res.writeHead(404).end();return;} const path=resolve(root,'.'+pathname); const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)],'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}).end(data);}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`SparkPilot: http://127.0.0.1:${port}`));
