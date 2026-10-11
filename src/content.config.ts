import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';

export const collections = {
	// 博文 = docs/blog/ 下的条目（starlight-blog 约定），frontmatter 由 blogSchema 扩展
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({ extend: (context) => blogSchema(context) }),
	}),
	// Starlight UI 文案覆盖：src/content/i18n/{zh-CN,zh-TW}.json（starlightBlog.* 插件键）
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
