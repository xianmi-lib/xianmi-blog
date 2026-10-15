// Blog Worker 入口（2026-10-15，两段式发布配套）：默认全部走静态资产（env.ASSETS，not_found_handling
// 由 wrangler.jsonc  assets 配置承接）；*.workers.dev Host（版本预览 URL / workers.dev 子域）一律注入
// X-Robots-Tag: noindex——防预览 URL 被收录成重复内容。线上 xianmi.co/blog* 路由响应不受影响
// （条件只匹配 workers.dev；本站是生产内容，必须保持可收录）。
export default {
	async fetch(request, env) {
		const res = await env.ASSETS.fetch(request);
		if (new URL(request.url).hostname.endsWith('.workers.dev')) {
			const wrapped = new Response(res.body, res);
			wrapped.headers.set('X-Robots-Tag', 'noindex');
			return wrapped;
		}
		return res;
	},
};
