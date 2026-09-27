'use strict';
/**
 * backend/modules/kb.js
 *
 * Lightweight knowledge-base helper.
 *
 * Reads `knowledge/common_errors.md` ONCE at startup and parses it into an
 * in-memory array of entries.  At request time, `lookup(logText)` does a
 * simple keyword scan and returns the best-matching entry (or null).
 *
 * ISOLATION GUARANTEE
 * -------------------
 * - All I/O happens synchronously at module load, never during a request.
 * - Every potential failure (missing file, malformed MD, bad regex) is caught
 *   and logged; the module always exports a safe `lookup` function that can
 *   be called unconditionally.
 * - Callers must never `await` this module — it is fully synchronous.
 */

const fs   = require('fs');
const path = require('path');

const KB_PATH = path.join(__dirname, '..', 'knowledge', 'common_errors.md');

/** @type {Array<{title:string, patterns:string[], rootCause:string, fix:string, ref:string}>} */
let entries = [];

// ─── Parse the MD file at startup ────────────────────────────────────────────
try {
  const md = fs.readFileSync(KB_PATH, 'utf8');

  // Split on level-2 headings ("## …"), skip the preamble before the first one.
  const sections = md.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();

    const get = (field) => {
      // Match "**Field:** value" — value may continue on the same line only.
      const re = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`);
      const m  = section.match(re);
      if (!m) return '';
      // Strip surrounding backticks that may wrap inline-code in the MD source.
      return m[1].trim().replace(/^`|`$/g, '');
    };

    const patternRaw = get('Pattern');
    if (!patternRaw) continue;          // malformed entry — skip silently

    // Split comma-separated pattern keywords (each may be backtick-wrapped in MD).
    // Strip backticks from every individual token so substring matching works cleanly.
    const patterns = patternRaw
      .split(',')
      .map(s => s.trim().replace(/^`|`$/g, ''))
      .filter(Boolean);

    // Also include the full raw string (already stripped) as a single pattern.
    if (patterns.length > 1) patterns.unshift(patternRaw.replace(/^`|`$/g, ''));

    // Extract the full Fix block (everything between **Fix:** and the next ** field or end).
    const fixMatch = section.match(/\*\*Fix:\*\*\s*([\s\S]*?)(?=\*\*\w|$)/);
    const fix = fixMatch ? fixMatch[1].trim() : '';

    entries.push({
      title,
      patterns,
      rootCause: get('Root Cause'),
      fix,
      ref: get('Ref'),
    });
  }

  console.log(`[kb] loaded ${entries.length} entries from ${KB_PATH}`);
} catch (err) {
  // Non-fatal: if the file is missing or unreadable, the array stays empty.
  console.warn(`[kb] knowledge base unavailable (${err.message}) — continuing without it`);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Scan `logText` against every entry's pattern list.
 * Returns the first matching entry, or `null` if nothing matches.
 *
 * Matching is case-insensitive substring search — no regexes from untrusted
 * input, so there is no ReDoS risk.
 *
 * @param {string} logText
 * @returns {{ title:string, rootCause:string, fix:string, ref:string } | null}
 */
function lookup(logText) {
  if (!logText || entries.length === 0) return null;

  const haystack = logText.toLowerCase();

  for (const entry of entries) {
    for (const pat of entry.patterns) {
      if (haystack.includes(pat.toLowerCase())) {
        return {
          title:     entry.title,
          rootCause: entry.rootCause,
          fix:       entry.fix,
          ref:       entry.ref,
        };
      }
    }
  }

  return null;
}

module.exports = { lookup };
