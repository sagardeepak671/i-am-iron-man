/**
 * Archive integrity check.
 *
 *   npm run check:archive
 *
 * Exits non-zero if any error is found (duplicate ids, broken relationships,
 * missing citations or sources, out-of-scope films, malformed sources).
 * Warnings (e.g. sources awaiting verification) are printed but do not fail.
 */
import { ARCHIVE } from "@/data/archive";
import { checkArchiveIntegrity, type Issue } from "@/lib/archive-integrity";

const report = checkArchiveIntegrity(ARCHIVE);

const print = (issue: Issue) =>
  console.log(`  ${issue.level === "error" ? "✗" : "!"} [${issue.code}] ${issue.path}\n      ${issue.message}`);

const { counts } = report;
console.log(
  `Archive: ${counts.armors} armors, ${counts.technologies} technologies, ${counts.suitParts} diagram parts, ${counts.films} films, ` +
    `${counts.sources} sources, ${counts.facts} facts, ${counts.citations} citations`,
);

if (report.warnings.length > 0) {
  console.log(`\n${report.warnings.length} warning(s):`);
  report.warnings.forEach(print);
}

if (report.errors.length > 0) {
  console.log(`\n${report.errors.length} error(s):`);
  report.errors.forEach(print);
  console.log("\nArchive integrity: FAILED");
  process.exit(1);
}

console.log("\nArchive integrity: OK");
