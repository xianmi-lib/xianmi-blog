// 合并构建：build:cn 产物 + build:tw 产物合成单一 dist（xianmi-blog worker 的 assets 目录）。
// astro build 每次清空 dist，故简体产物先暂存 dist-cn/，繁体构建完把 dist/zh-tw 并入再回置。
// 最终形态：dist/blog/*（简体）+ dist/zh-tw/blog/*（繁体）+ dist/404.html（not_found 落地页）。
import { execFileSync } from 'node:child_process';
import { rename, rm } from 'node:fs/promises';

const run = (script) => execFileSync('npm', ['run', script], { stdio: 'inherit' });

await rm('dist-cn', { recursive: true, force: true });
run('build:cn');
await rename('dist', 'dist-cn');
run('build:tw');
await rename('dist/zh-tw', 'dist-cn/zh-tw');
await rm('dist', { recursive: true });
await rename('dist-cn', 'dist');
console.log('build-all: dist = 简体产物 + dist/zh-tw（繁体）');
