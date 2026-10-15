// @ts-check
// 显密文库博客（xianmi.co/blog/* 与 /zh-tw/blog/*，独立 Worker 挂载）。
// 简繁双 build 单仓（方案 b）：XIANMI_BLOG_TW=1 → 繁体（base=/zh-tw）；默认简体（base=/）。
// 路由结构由 starlight-blog 的 prefix='blog' 承担（base+prefix ⇒ /blog/* 与 /zh-tw/blog/*）；
// 资产收进 blog/_astro（简体 base='/' 时避免 /_astro 与主站根路径资产冲突）。
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightBlog from 'starlight-blog';
import starlightThemeLargePrint from 'starlight-theme-large-print';

const SITE = 'https://www.xianmi.co';
const IS_TW = process.env.XIANMI_BLOG_TW === '1';
// base 只在繁体【构建】时设 /zh-tw；dev 恒为 '/'——与正式站 XIANMI_TW_BASE 先例完全同构
// （dev 下 Starlight 对多段 base 的 rest 路由匹配有坑：/zh-tw/blog/* 全 404 实测 2026-10-12；
// 产物构建无此问题）。简体 build/dev 都是 '/'。
const BASE = process.env.XIANMI_BLOG_BASE ?? '/';

export default defineConfig({
	site: SITE,
	base: BASE,
	// 截图/验收干净（Astro dev toolbar 仅 dev 可见，但会进 fullPage 截图）
	devToolbar: { enabled: false },
	build: {
		// 简体（base='/'）下必须收拢：blog worker 只挂 /blog/*，资产须在 /blog/_astro。
		// 繁体（base='/zh-tw'）自动引用 /zh-tw/blog/_astro，postbuild 包裹后同形。
		assets: 'blog/_astro',
	},
	integrations: [
		starlight({
			title: IS_TW ? '顯密文庫博客' : '显密文库博客',
			locales: {
				root: { label: IS_TW ? '繁體中文' : '简体中文', lang: IS_TW ? 'zh-TW' : 'zh-CN' },
			},
			// 与主站一致：无站内搜索
			pagefind: false,
			customCss: ['./src/styles/custom.css'],
			// 简繁 hreflang head 注入（src/routeData.ts）
			routeMiddleware: ['./src/routeData.ts'],
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
				// /blog/ 路由关原生分页（防与 starlight-blog NextLinks 双渲染）
				Pagination: './src/components/Pagination.astro',
				// BlogPosting author Person→Organization（starlight-blog 硬编码无配置口）
				Head: './src/components/Head.astro',
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/xianmi-lib/xianmi-blog' }],
			head: [
				// 与主站同一张 og 图（品牌一致）
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://www.xianmi.co/og.png' } },
				{ tag: 'meta', attrs: { property: 'og:image:alt', content: '显密文库' } },
			],
			plugins: [
				starlightBlog({
					title: IS_TW ? '部落格' : '博客',
					// 全站即博客，无需插件再向 header 挂导航链接（navigation 默认 header-end
					// 会覆盖 ThemeSelect 位；本站 Header 自渲染主题控件，故显式 'none'）
					navigation: 'none',
					postCount: 10,
					authors: {
						xianmi: { name: IS_TW ? '顯密文庫' : '显密文库', url: 'https://www.xianmi.co/' },
					},
				}),
				starlightThemeLargePrint({ font: IS_TW ? 'noto-serif-tc' : 'noto-serif-sc' }),
			],
		}),
		// sitemap 产物落 dist 根（@astrojs/sitemap 按 base 生成 URL，文件位置不按 base），
		// postbuild 收进 blog/ 前缀目录（worker 只挂 /blog/* 与 /zh-tw/blog/*）。
		sitemap({
			serialize(item) {
				const path = new URL(item.url).pathname;
				// 同 routeData.ts：标签/作者索引页不做简繁配对（slug=标签原文，简繁 URL 天然不对称）
				if (!/\/(tags|authors)\//.test(path)) {
					const isTwPath = path.startsWith('/zh-tw/');
					const cnPath = isTwPath ? path.replace(/^\/zh-tw/, '') : path;
					const twPath = `/zh-tw${cnPath}`;
					item.links = [
						{ lang: 'zh-Hans', url: `${SITE}${cnPath}` },
						{ lang: 'zh-Hant', url: `${SITE}${twPath}` },
						// x-default 指繁体版（与主站 2026-09-28 裁决一致）
						{ lang: 'x-default', url: `${SITE}${twPath}` },
					];
				}
				return item;
			},
		}),
	],
});
