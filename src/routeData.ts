// 简繁 hreflang head 注入（slug 双语一致，URL = 前缀互换；x-default 指繁体版，
// 与主站 2026-09-28 裁决一致）。本工程无 goodweb 那套 pXX/lastmod/dupmap 逻辑，
// 只做双语配对一件事——将来如需扩展（canonical/JSON-LD）在此叠加。
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

const SITE = 'https://www.xianmi.co';

export const onRequest = defineRouteMiddleware((context) => {
	const { starlightRoute } = context.locals;
	const path = context.url.pathname;
	const isTw = path.startsWith('/zh-tw/');
	const cnPath = isTw ? path.replace(/^\/zh-tw/, '') : path;
	const twPath = `/zh-tw${cnPath}`;

	for (const [hreflang, href] of [
		['zh-Hans', `${SITE}${cnPath}`],
		['zh-Hant', `${SITE}${twPath}`],
		['x-default', `${SITE}${twPath}`],
	]) {
		starlightRoute.head.push({
			tag: 'link',
			attrs: { rel: 'alternate', hreflang, href },
		});
	}
});
