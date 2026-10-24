// Native ES modules are shipped without a bundler. Validate imports and syntax,
// then package the exact assets served by the existing FastAPI application.
import {readFile,readdir,mkdir,copyFile,writeFile,rm} from 'node:fs/promises';
import {resolve,relative,dirname,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),output=resolve(root,'dist/site');
const files=[];
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await scan(path);else if(!/\.test\.mjs$|v4-personas\.mjs$/.test(path)&&['.js','.json','.css','.html','.png'].includes(extname(path)))files.push(path);}}
await scan(resolve(root,'prototype'));files.push(resolve(root,'data/knowledge/current.json'),resolve(root,'data/regional/current.json'));
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
const hashes={};
for(const path of files){const body=await readFile(path);if(extname(path)==='.js'){execFileSync(process.execPath,['--check',path]);for(const match of body.toString().matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)){if(match[1].startsWith('.'))await readFile(resolve(dirname(path),match[1]));}}else if(extname(path)==='.json')JSON.parse(body);
const target=relative(resolve(root,'prototype'),path).startsWith('..')?relative(root,path):relative(resolve(root,'prototype'),path);await mkdir(dirname(resolve(output,target)),{recursive:true});await copyFile(path,resolve(output,target));hashes[target]=createHash('sha256').update(body).digest('hex');}
await writeFile(resolve(root,'dist/frontend-manifest.json'),JSON.stringify({nativeModules:true,assets:hashes},null,2)+'\n');console.log(`Validated and packaged ${files.length} production assets.`);
