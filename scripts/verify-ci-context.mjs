import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const parents = () => git('rev-list', '--parents', '-n', '1', 'HEAD').split(' ');

if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_EVENT_NAME === 'pull_request') {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const pr = event.pull_request;
  const response = await fetch(
    `${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/pulls/${pr.number}`,
    {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    },
  );
  if (!response.ok) throw new Error(`Cannot verify current PR identity: HTTP ${response.status}`);
  const current = await response.json();
  const [merge, base, head] = parents();
  if (
    current.state !== 'open' ||
    current.head.sha !== pr.head.sha ||
    current.base.sha !== pr.base.sha ||
    base !== current.base.sha ||
    head !== current.head.sha
  ) {
    throw new Error('PR source, target or merge result is stale; rerun against the latest merge result.');
  }
  console.log(`Verified PR #${pr.number}: head=${head} base=${base} merge=${merge}`);
} else if (process.env.GITLAB_CI === 'true' && process.env.CI_PIPELINE_SOURCE === 'merge_request_event') {
  if (process.env.CI_MERGE_REQUEST_EVENT_TYPE !== 'merged_result') {
    throw new Error('Enable GitLab merged results pipelines; source-only MR pipelines cannot satisfy this check.');
  }
  const [merge, target, source] = parents();
  if (
    source !== process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA ||
    target !== process.env.CI_MERGE_REQUEST_TARGET_BRANCH_SHA
  ) {
    throw new Error('GitLab merge result parents do not match source/target identity.');
  }
  console.log(`Verified MR !${process.env.CI_MERGE_REQUEST_IID}: source=${source} target=${target} merge=${merge}`);
} else {
  console.log('No merge-request identity check required for this event.');
}
