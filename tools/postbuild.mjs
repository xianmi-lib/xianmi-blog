// 构建后整形：
// ① sitemap 收进 blog/ 前缀目录——@astrojs/sitemap 产物落 dist 根（文件位置不按 base），
//    而 blog worker 只挂 /blog/* 与 /zh-tw/blog/*，sitemap 必须在前缀内才可 served。
//    sitemap-index 内引用 sitemap-0.xml 为相对文件名，移动后仍互相可达。
// ② 繁体：dist 整体包裹进 dist/zh-tw/（与正式 xianmi-tw postbuild 先例一致；
//    简体无包裹，产物根即 /blog/* 镜像）。
import { readdir, readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';

const TW = process.env.XIANMI_BLOG_TW === '1';
const SITE = 'https://www.xianmi.co';
const DIST = new URL('../dist/', import.meta.url);
// sitemap 的公共前缀路径（繁体产物包裹后由 worker 挂 /zh-tw/blog/*）
const BLOG_PREFIX = TW ? '/zh-tw/blog' : '/blog';

async function sweepSitemapIntoBlog(dir) {
	for (const f of await readdir(dir)) {
		if (/^sitemap(-index)?\.xml$|^sitemap-\d+\.xml$/.test(f)) {
			await rename(new URL(f, dir), new URL(`blog/${f}`, dir));
		}
	}
	// sitemap-index 在 dist 根生成，<loc> 引用的是「站点+base」根绝对 URL；收进 blog/ 后必须改写，
	// 否则索引指向 xianmi.co(/zh-tw)/sitemap-0.xml（=主站的 sitemap，灾难性串台）。
	const indexUrl = new URL('blog/sitemap-index.xml', dir);
	const index = await readFile(indexUrl, 'utf8');
	const stalePrefix = `${SITE}${TW ? '/zh-tw' : ''}/sitemap`;
	await writeFile(indexUrl, index.replaceAll(stalePrefix, `${SITE}${BLOG_PREFIX}/sitemap`));
}

if (TW) {
	const TMP = new URL('../dist-wrapped/', import.meta.url);
	await rm(TMP, { recursive: true, force: true });
	await rename(DIST, TMP);
	await mkdir(DIST, { recursive: true });
	await rename(TMP, new URL('../dist/zh-tw/', import.meta.url));
	await sweepSitemapIntoBlog(new URL('../dist/zh-tw/', import.meta.url));
	console.log('postbuild: dist 已包裹为 dist/zh-tw/，sitemap 收进 dist/zh-tw/blog/');
} else {
	await sweepSitemapIntoBlog(DIST);
	console.log('postbuild: sitemap 收进 dist/blog/');
}
