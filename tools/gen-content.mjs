// 生成 src/content/docs/blog/*.md（starlight-blog 的内容目录，gitignore 不入库）：
//   简体（默认）= 直拷 posts/zh-cn/；繁体（--tw）= OpenCC s2tw 全文件转换。
// 简体为唯一信源——我们是作者，不受 goodweb「原文逐字未动」纪律约束；单源防简繁漂移。
// slug 双语一致（同一文件名），hreflang 按前缀互换即可配对。
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { Converter } from 'opencc-js';

const TW = process.argv.includes('--tw');
const SRC = new URL('../posts/zh-cn/', import.meta.url);
const OUT = new URL('../src/content/docs/blog/', import.meta.url);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const convert = TW ? Converter({ from: 'cn', to: 'tw' }) : null;

for (const file of (await readdir(SRC)).filter((f) => f.endsWith('.md')).sort()) {
	const text = await readFile(new URL(file, SRC), 'utf8');
	await writeFile(new URL(file, OUT), convert ? convert(text) : text);
}

console.log(`gen-content: ${TW ? '繁体（OpenCC s2tw）' : '简体（直拷）'} posts/zh-cn/ → src/content/docs/blog/`);
