// 生成 src/content/docs/blog/*.md（starlight-blog 的内容目录，gitignore 不入库）：
//   简体 build ← posts/zh-cn/（直拷）；繁体 build ← posts/zh-tw/（AI 翻译产物，入仓、人工过目）。
// 两份都是【入仓内容文件】，build 期不做任何转换。
// 双语配对校验：简体 build 时，任何简体文缺同名繁体稿 = exit 1（build 红，不许静默缺语言）；
// 繁体 build 时发现繁体孤本只警告（生产流程简体先成文，繁体不应先行）。
// ★繁体 = AI 翻译 + 人工校订，禁用 OpenCC 机械转换（2026-10-12 用户裁决）：
//   OpenCC 是 6 万篇初始语料的规模权宜，blog 每篇几千字，付得起 AI 翻译成本，
//   且翻译可贴合台湾大众文字习惯（用语/语气/句式在地化）。
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';

const TW = process.argv.includes('--tw');
const SRC = new URL(TW ? '../posts/zh-tw/' : '../posts/zh-cn/', import.meta.url);
const OTHER = new URL(TW ? '../posts/zh-cn/' : '../posts/zh-tw/', import.meta.url);
const OUT = new URL('../src/content/docs/blog/', import.meta.url);

const files = (await readdir(SRC)).filter((f) => f.endsWith('.md')).sort();
const others = new Set((await readdir(OTHER)).filter((f) => f.endsWith('.md')));

const missing = files.filter((f) => !others.has(f));
if (!TW && missing.length > 0) {
	console.error(
		`双语配对校验 FAIL：posts/zh-tw/ 缺失 ${missing.length} 篇繁体稿：\n` +
			missing.map((f) => `  - ${f}`).join('\n') +
			'\n繁体 = AI 翻译产物（tools/translate-prompt.md），须入仓并与简体同 commit；禁用 OpenCC 机械转换。',
	);
	process.exit(1);
}
if (TW && missing.length > 0) {
	console.warn(`提示：posts/zh-cn/ 尚无这些繁体稿的简体源文（繁体先行，请补简体）：${missing.join(', ')}`);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const file of files) {
	await writeFile(new URL(file, OUT), await readFile(new URL(file, SRC), 'utf8'));
}

console.log(
	`gen-content: ${TW ? '繁体（posts/zh-tw/ 直拷）' : '简体（posts/zh-cn/ 直拷）'} → src/content/docs/blog/（${files.length} 篇，配对校验通过）`,
);
