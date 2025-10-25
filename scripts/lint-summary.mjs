import { ESLint } from 'eslint';

const targets = ['src/**/*.js', 'scripts/**/*.js', 'vite.config.js'];

function aggregate(results) {
  const summary = {
    files: results.length,
    errors: 0,
    warnings: 0,
    byFile: [],
    byRule: new Map(),
  };

  for (const r of results) {
    summary.errors += r.errorCount;
    summary.warnings += r.warningCount;
    const count = r.errorCount + r.warningCount;
    if (count > 0)
      summary.byFile.push({ file: r.filePath, errors: r.errorCount, warnings: r.warningCount });

    for (const m of r.messages) {
      const key = m.ruleId || 'internal';
      summary.byRule.set(key, (summary.byRule.get(key) || 0) + 1);
    }
  }

  summary.byFile.sort((a, b) => b.errors + b.warnings - (a.errors + a.warnings));
  const byRuleArr = Array.from(summary.byRule.entries()).sort((a, b) => b[1] - a[1]);

  return { summary, topFiles: summary.byFile.slice(0, 8), topRules: byRuleArr.slice(0, 10) };
}

(async () => {
  const eslint = new ESLint({});
  const results = await eslint.lintFiles(targets);
  const { summary, topFiles, topRules } = aggregate(results);

  console.log('ESLint Summary');
  console.log('Files:', summary.files);
  console.log('Errors:', summary.errors, 'Warnings:', summary.warnings);
  console.log('\nTop Rules:');
  for (const [rule, count] of topRules) {
    console.log('-', rule, count);
  }
  console.log('\nTop Files:');
  for (const f of topFiles) {
    console.log('-', f.file, `E${f.errors}/W${f.warnings}`);
  }
})();
