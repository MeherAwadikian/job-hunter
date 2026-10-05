#!/usr/bin/env node
import { scanPlatform, scanAll, CONNECTORS, semanticPass } from './engine/discover.js';
import { generateApplication, generateForTopJobs } from './engine/applicationGen.js';
import { getDb, nowIso } from './db/init.js';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function printRunSummary(r) {
  const status = r.errors.length ? 'FAILED' : 'ok';
  console.log(
    `[${r.platform}] ${status} — found ${r.found}, parsed ${r.parsed}, duplicates ${r.duplicates}, rejected ${r.rejected}`
  );
  if (r.errors.length) r.errors.forEach((e) => console.log(`  error: ${e}`));
  for (const j of r.newJobs) {
    console.log(`  [${j.score.grade} ${j.score.overall_score}] ${j.title} — ${j.company || 'n/a'} (${j.application_url})`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (cmd === 'scan') {
    if (args.platform) {
      printRunSummary(await scanPlatform(args.platform));
    } else if (args.all || Object.keys(args).length === 0) {
      for (const r of await scanAll()) printRunSummary(r);
    } else {
      console.log('Usage: job-hunter scan [--platform <id>] [--all]');
    }
    return;
  }

  if (cmd === 'test') {
    const targets = args.platform ? [args.platform] : Object.keys(CONNECTORS);
    for (const id of targets) {
      console.log(`--- testing ${id} ---`);
      try {
        const r = await scanPlatform(id);
        printRunSummary(r);
      } catch (err) {
        console.log(`  FAILED: ${err.message}`);
      }
    }
    return;
  }

  if (cmd === 'score' && args.semantic) {
    const limit = args.limit ? Number(args.limit) : 20;
    console.log(`Running semantic (DeepSeek) pass on up to ${limit} jobs scoring >= rule-based floor...`);
    const results = await semanticPass({ limit });
    for (const r of results) {
      if (r.error) console.log(`  [FAILED] ${r.title}: ${r.error}`);
      else console.log(`  [${r.grade} ${r.overall_score}] ${r.title} — ${r.why}`);
    }
    console.log(`\n${results.filter((r) => !r.error).length}/${results.length} re-scored.`);
    return;
  }

  if (cmd === 'generate') {
    if (args['job-id']) {
      console.log(`Generating application for job ${args['job-id']} via the cv profile (this takes ~60-90s)...`);
      const r = await generateApplication(Number(args['job-id']));
      console.log(JSON.stringify(r, null, 2));
      return;
    }
    const limit = args.limit ? Number(args.limit) : 5;
    const minGrade = args['min-grade'] || 'B';
    console.log(`Generating applications for up to ${limit} ungenerated jobs scoring ${minGrade} or better (this is slow, ~60-90s per job)...`);
    const results = await generateForTopJobs({ limit, minGrade });
    for (const r of results) {
      if (r.error) console.log(`  [FAILED] job ${r.job_id}: ${r.error}`);
      else if (r.skipped) console.log(`  [SKIPPED] job ${r.job_id}: ${r.reason}`);
      else console.log(`  [OK] job ${r.job_id} -> application ${r.application_id}`);
    }
    return;
  }

  if (cmd === 'applications') {
    const db = getDb();
    const sub = args._[0];

    if (sub === 'list' || !sub) {
      const rows = db.prepare(`
        SELECT a.id, a.status, j.title, j.company, j.platform, j.application_url
        FROM applications a JOIN jobs j ON j.id = a.job_id
        ORDER BY a.created_at DESC
      `).all();
      if (rows.length === 0) console.log('No applications drafted yet. Run: node src/cli.js generate --limit <n>');
      for (const r of rows) {
        console.log(`#${r.id} [${r.status}] ${r.title} — ${r.company || 'n/a'} (${r.platform})\n  ${r.application_url}`);
      }
      return;
    }

    if (sub === 'show') {
      const id = Number(args._[1]);
      const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
      if (!row) { console.log(`No application #${id}`); return; }
      const job = db.prepare('SELECT title, company, application_url FROM jobs WHERE id = ?').get(row.job_id);
      console.log(`#${row.id} [${row.status}] ${job.title} — ${job.company || 'n/a'}\n${job.application_url}\n`);
      console.log('--- CV BULLETS ---\n' + row.cv_variant);
      console.log('\n--- COVER LETTER ---\n' + row.cover_letter);
      console.log('\n--- SHORT MESSAGE ---\n' + row.proposal);
      if (row.notes) console.log('\n--- NOTES ---\n' + row.notes);
      return;
    }

    if (sub === 'approve' || sub === 'reject') {
      const id = Number(args._[1]);
      const status = sub === 'approve' ? 'APPROVED' : 'REJECTED';
      db.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), id);
      db.prepare(`INSERT INTO job_events (job_id, event, detail, created_at)
        SELECT job_id, ?, ?, ? FROM applications WHERE id = ?`)
        .run(sub === 'approve' ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED', JSON.stringify({ application_id: id }), nowIso(), id);
      console.log(`Application #${id} marked ${status}.`);
      if (sub === 'approve') {
        console.log('Nothing is submitted automatically — this only records your approval. Submit it yourself via the application_url shown in `applications show`.');
      }
      return;
    }

    console.log(`Usage: node src/cli.js applications list|show <id>|approve <id>|reject <id>`);
    return;
  }

  if (cmd === 'digest') {
    const db = getDb();
    const rows = db.prepare(`
      SELECT j.id, j.title, j.company, j.platform, j.application_url, s.overall_score, s.grade
      FROM jobs j JOIN job_scores s ON s.job_id = j.id
      WHERE j.status != 'CLOSED'
      ORDER BY s.overall_score DESC
      LIMIT 20
    `).all();
    console.log(`JOB HUNTER — DIGEST (${rows.length} qualified jobs)\n`);
    for (const r of rows) {
      console.log(`[${r.grade} ${r.overall_score}] ${r.title} — ${r.company || 'n/a'} (${r.platform})\n  ${r.application_url}`);
    }
    return;
  }

  console.log(`job-hunter — usage:
  node src/cli.js scan [--platform <id>] [--all]
  node src/cli.js test [--platform <id>]
  node src/cli.js score --semantic [--limit <n>]
  node src/cli.js generate [--job-id <id>] [--limit <n>] [--min-grade <A+|A|B|C|D>]
  node src/cli.js applications list|show <id>|approve <id>|reject <id>
  node src/cli.js digest`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
