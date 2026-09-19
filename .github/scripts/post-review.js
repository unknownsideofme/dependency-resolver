// SPDX-License-Identifier: Apache-2.0
/**
 * Helper script to process OpenCodeReview JSON output and post/update GitHub PR review comments.
 */
const fs = require('fs');

module.exports = async ({ github, context, core }) => {
  const resultPath = '/tmp/ocr-result.json';
  if (!fs.existsSync(resultPath)) {
    core.setFailed(`OCR result file not found at ${resultPath}`);
    return;
  }

  let result;
  try {
    const raw = fs.readFileSync(resultPath, 'utf8');
    result = JSON.parse(raw);
  } catch (err) {
    core.setFailed(`Failed to parse OCR JSON output: ${err.message}`);
    return;
  }

  const { owner, repo } = context.repo;
  const prNumber = context.issue.number;
  const headSha = context.payload.pull_request.head.sha;

  const comments = result.comments || [];
  const filesReviewed = result.summary ? result.summary.files_reviewed : 0;

  core.info(`OpenCodeReview found ${comments.length} issues across ${filesReviewed} reviewed files.`);

  const SUMMARY_MARKER = '<!-- reviewer-bot -->';
  const inlineComments = [];

  for (const c of comments) {
    let body = `🤖 **AI Code Review**\n\n`;
    if (c.category || c.severity) {
      const cat = c.category || 'general';
      const sev = c.severity || 'info';
      body += `**[${cat} · ${sev}]**\n\n`;
    }
    body += `${c.content}\n`;
    if (c.suggestion_code) {
      body += `\n**Suggestion**\n\`\`\`\n${c.suggestion_code}\n\`\`\`\n`;
    }

    const startLine = c.start_line;
    const endLine = c.end_line;

    if (endLine && endLine >= 1) {
      const commentObj = {
        path: c.path,
        line: endLine,
        side: 'RIGHT',
        body: body.trim()
      };
      if (startLine && startLine >= 1 && startLine !== endLine) {
        commentObj.start_line = startLine;
        commentObj.start_side = 'RIGHT';
      }
      inlineComments.push({ original: c, commentObj });
    }
  }

  // Fetch existing review comments on this PR to avoid exact duplicate inline comments
  let existingReviewComments = [];
  try {
    const response = await github.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100
    });
    existingReviewComments = response.data;
  } catch (e) {
    core.warning(`Could not fetch existing review comments: ${e.message}`);
  }

  // Filter out inline comments that already exist on the exact path and line with matching content
  const commentsToSubmit = inlineComments.filter(({ commentObj }) => {
    const isDup = existingReviewComments.some(existing => 
      existing.path === commentObj.path &&
      existing.line === commentObj.line &&
      existing.body.includes(commentObj.body.trim())
    );
    return !isDup;
  }).map(({ commentObj }) => commentObj);

  if (commentsToSubmit.length > 0) {
    try {
      await github.rest.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        commit_id: headSha,
        event: 'COMMENT',
        comments: commentsToSubmit
      });
      core.info(`Successfully posted ${commentsToSubmit.length} inline review comments.`);
    } catch (err) {
      core.warning(`Failed to post batch inline review comments: ${err.message}`);
    }
  } else if (inlineComments.length > 0) {
    core.info('All inline review comments are duplicates of existing comments or skipped.');
  }

  // Build PR Summary Comment
  let summaryBody = `${SUMMARY_MARKER}\n## 🤖 AI Code Review\n\n`;
  summaryBody += `Reviewed \`${filesReviewed}\` files.\n\n`;
  summaryBody += `Found \`${comments.length}\` issues.\n\n`;

  if (comments.length > 0) {
    summaryBody += `### Findings\n\n`;
    for (const c of comments) {
      const lineInfo = c.end_line ? `:${c.end_line}` : (c.start_line ? `:${c.start_line}` : '');
      const cat = c.category || 'general';
      const sev = c.severity || 'info';
      summaryBody += `- \`${c.path}${lineInfo}\` — ${cat} / ${sev}\n`;
    }
    summaryBody += `\n`;
  } else {
    summaryBody += `Reviewed the changes and found no issues requiring comments.\n\n`;
  }

  summaryBody += `Commit reviewed:\n\`${headSha}\`\n`;

  // Create or update PR Summary Comment
  try {
    const issueComments = await github.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100
    });

    const existingSummary = issueComments.data.find(ic =>
      ic.body && ic.body.includes(SUMMARY_MARKER)
    );

    if (existingSummary) {
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingSummary.id,
        body: summaryBody
      });
      core.info(`Updated existing PR review summary comment (ID: ${existingSummary.id}).`);
    } else {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: summaryBody
      });
      core.info(`Created new PR review summary comment.`);
    }
  } catch (err) {
    core.setFailed(`Failed to post/update PR summary comment: ${err.message}`);
  }
};
