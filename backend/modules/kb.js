'use strict';

const fs = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'knowledge', 'common_errors.md');
const entries = [];

try {
  const markdown = fs.readFileSync(KB_PATH, 'utf8');
  const sections = markdown.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split(/\r?\n/);
    const title = lines[0].trim();
    const getField = (field) => {
      const match = section.match(new RegExp(`^\\*\\*${field}:\\*\\*\\s*(.*)$`, 'm'));
      return match ? match[1].trim().replace(/^`|`$/g, '') : '';
    };

    const patterns = getField('Pattern')
      .split(',')
      .map((pattern) => pattern.trim().replace(/^`|`$/g, ''))
      .filter(Boolean);
    const rootCause = getField('Root Cause');
    const ref = getField('Ref');
    const fixStart = lines.findIndex((line) => /^\*\*Fix:\*\*/.test(line));
    const fixLines = [];

    if (fixStart !== -1) {
      for (const line of lines.slice(fixStart + 1)) {
        if (/^\*\*\w+:\*\*/.test(line)) break;
        fixLines.push(line);
      }
    }

    if (!title || patterns.length === 0 || !rootCause) {
      console.warn(`[kb] skipping incomplete entry in ${KB_PATH}`);
      continue;
    }

    entries.push({
      title,
      patterns,
      rootCause,
      fix: fixLines.join('\n').trim(),
      ref,
    });
  }

  console.log(`[kb] loaded ${entries.length} entries from ${KB_PATH}`);
} catch (err) {
  console.warn(`[kb] knowledge base unavailable (${err.message})`);
}

function countOccurrences(text, keyword) {
  let count = 0;
  let offset = 0;

  while ((offset = text.indexOf(keyword, offset)) !== -1) {
    count += 1;
    offset += keyword.length;
  }

  return count;
}

/**
 * Return the most frequently matched documentation entries, ranked by the
 * number of keyword occurrences in the submitted log.
 */
function lookupAll(logText, limit = 5) {
  if (typeof logText !== 'string' || !logText.trim() || entries.length === 0) {
    return [];
  }

  const haystack = logText.toLowerCase();

  return entries
    .map((entry, index) => {
      const matches = entry.patterns
        .map((keyword) => ({
          keyword,
          count: countOccurrences(haystack, keyword.toLowerCase()),
        }))
        .filter((match) => match.count > 0);

      return {
        entry,
        index,
        matchCount: matches.reduce((total, match) => total + match.count, 0),
        matchedKeywords: matches.map((match) => match.keyword),
      };
    })
    .filter((match) => match.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || b.matchedKeywords.length - a.matchedKeywords.length || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map(({ entry, matchCount, matchedKeywords }) => ({
      title: entry.title,
      rootCause: entry.rootCause,
      fix: entry.fix,
      ref: entry.ref,
      matchCount,
      matchedKeywords,
    }));
}

module.exports = { lookupAll };
