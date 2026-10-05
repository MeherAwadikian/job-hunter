// Rule-based scoring (keyword/overlap match against candidate_profile.json).
// This is the Level-1 scorer that runs for free on every discovered job.
// Claude-based semantic scoring (brief §14) should be layered on top for
// jobs that clear a threshold here — wire that in once Tier-1 connectors
// are validated end-to-end, to avoid burning LLM calls on obvious non-matches.

function textBlob(job) {
  return [job.title, job.description, (job.skills || []).join(' ')].join(' ').toLowerCase();
}

export function scoreJob(job, profile) {
  const blob = textBlob(job);
  let skillHits = 0;
  let skillTotal = 0;
  for (const angle of profile.skill_angles) {
    for (const skill of angle.skills) {
      skillTotal += angle.weight;
      if (blob.includes(skill.toLowerCase())) skillHits += angle.weight;
    }
  }
  const skill_match = skillTotal > 0 ? Math.round((skillHits / skillTotal) * 100) : 0;

  const roleHit = profile.preferred_roles.some((r) => blob.includes(r.toLowerCase().split(' ')[0]));
  const experience_match = roleHit ? 70 : 40;

  const remote_match = job.remote ? 100 : (profile.remote_preferences.open_to_local ? 60 : 10);

  const location_match = job.location && /lebanon|beirut|remote/i.test(job.location) ? 100 : 70;

  const salary_match = job.salary_min || job.salary_max ? 70 : 50; // neutral when unknown

  const industry_match = skill_match; // proxy until Claude semantic pass is wired in

  const application_effort = job.application_url ? 80 : 50;

  const overall_score = Math.round(
    skill_match * 0.35 +
    experience_match * 0.15 +
    remote_match * 0.15 +
    location_match * 0.1 +
    salary_match * 0.1 +
    industry_match * 0.1 +
    application_effort * 0.05
  );

  let grade = 'D';
  if (overall_score >= 85) grade = 'A+';
  else if (overall_score >= 70) grade = 'A';
  else if (overall_score >= 55) grade = 'B';
  else if (overall_score >= 40) grade = 'C';

  return {
    overall_score,
    skill_match,
    experience_match,
    industry_match,
    location_match,
    salary_match,
    remote_match,
    application_effort,
    grade,
    rationale: `Rule-based match: ${skillHits.toFixed(1)}/${skillTotal.toFixed(1)} weighted skill hits.`,
  };
}
