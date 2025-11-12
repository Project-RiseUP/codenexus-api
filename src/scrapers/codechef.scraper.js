// codechefFetcher-internal.js
// Purpose: attempt to fetch CodeChef profile data using internal JSON endpoints the page may call.
// Dependencies: axios, cheerio

const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  Accept: 'application/json, text/javascript, application/javascript, text/html, */*;q=0.1',
};

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch (_) { return null; }
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

/**
 * options:
 *   cookie: optional cookie string to send (useful if endpoints need session)
 *   timeout: ms
 */
async function fetchCodeChefData(username, options = {}) {
  const user = String(username || '').trim();
  if (!user) return { error: 'Username is required' };

  const cookie = options.cookie || '';
  const timeout = options.timeout || 15000;

  const http = axios.create({
    timeout,
    headers: Object.assign({}, DEFAULT_HEADERS, cookie ? { Cookie: cookie } : {}),
    validateStatus: s => s >= 200 && s < 500,
  });

  const baseProfileUrl = `https://www.codechef.com/users/${encodeURIComponent(user)}`;

  const out = {
    username: user,
    problemsSolved: {},
    dailyProblemsSolved: {},
    recentProblemsByDay: {},
    topicWiseStats: {},
    extras: {},
    _internal: { triedUrls: [], jsonResponses: {} }, // debug help
  };

  try {
    // 1) fetch profile HTML
    const profileRes = await http.get(baseProfileUrl);
    if (profileRes.status >= 400) {
      return { error: `Failed to fetch profile page (status ${profileRes.status})` };
    }
    const html = profileRes.data || '';
    const $ = cheerio.load(html);

    // Heuristic: collect candidate URLs from:
    //  - absolute URLs to codechef.com,
    //  - any relative endpoints starting with / (likely XHR),
    //  - inline <script> text that contains endpoint paths or JSON blobs.
    const candidates = [];

    // A) look for <script src="..."> that points to codechef assets (these may contain endpoints or bootstrapped JSON)
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (!src) return;
      if (src.startsWith('//')) src = 'https:' + src;
      if (src.startsWith('http') && src.includes('codechef.com')) {
        candidates.push(src);
      }
    });

    // B) search inline scripts for quoted paths that look like endpoints:
    $('script:not([src])').each((i, el) => {
      const text = $(el).html() || '';
      if (!text) return;
      // find absolute codechef endpoints
      const absMatches = [...text.matchAll(/https?:\/\/[^'"\s]+codechef\.com[^'"\s)]+/ig)].map(m => m[0]);
      // find relative endpoints like "/api/..." or "/users/.../stats" or "/some/xhr/path"
      const relMatches = [...text.matchAll(/["'`]((?:\/[a-zA-Z0-9_\-\.~\/]+))(?:["'`])/g)].map(m => m[1])
        .filter(p => /\/(api|users|contest|problems|submissions|ratings?)/i.test(p));
      candidates.push(...absMatches, ...relMatches);

      // also, include any JSON-looking blobs (we'll try parse)
      const jsonLike = text.match(/\{[\s\S]{20,2000}\}/);
      if (jsonLike) {
        const parsed = safeParseJSON(jsonLike[0]);
        if (parsed) {
          out._internal.jsonResponses['inline-script-json'] = parsed;
        }
      }
    });

    // C) search HTML attributes (data-*, hrefs) for endpoints
    $('*[data-src], a[href]').each((i, el) => {
      const ds = $(el).attr('data-src') || '';
      const href = $(el).attr('href') || '';
      if (ds && ds.startsWith('/')) candidates.push(ds);
      if (href && href.startsWith('/')) {
        if (/\/users\/|\/api\/|\/problems\/|\/contests\//i.test(href)) candidates.push(href);
      }
    });

    // D) also try obvious endpoints that some sites use (best-effort)
    candidates.push(`/users/${encodeURIComponent(user)}/profile`);
    candidates.push(`/users/${encodeURIComponent(user)}/submissions`);
    candidates.push(`/users/${encodeURIComponent(user)}/contests`);
    candidates.push(`/users/${encodeURIComponent(user)}/stats`);
    candidates.push(`/api/users/${encodeURIComponent(user)}`);
    candidates.push(`/api/user/${encodeURIComponent(user)}/profile`);
    candidates.push(`/api/contest/user/${encodeURIComponent(user)}`);
    candidates.push(`/api/users/${encodeURIComponent(user)}/submissions`);

    // normalize and dedupe
    const normalized = uniq(candidates)
      .map(u => {
        if (!u) return null;
        // absolute already
        if (/^https?:\/\//i.test(u)) return u;
        // protocol-relative
        if (u.startsWith('//')) return 'https:' + u;
        // relative -> make absolute
        if (u.startsWith('/')) return `https://www.codechef.com${u}`;
        // other relative forms (like ../) skip
        return null;
      })
      .filter(Boolean);

    // record tried URLs
    out._internal.triedUrls = normalized.slice(0, 100);

    // 2) Attempt to GET each candidate and collect JSON responses
    const jsonResponses = {};
    for (const url of normalized) {
      // be conservative: only try JSON endpoints (heuristic)
      if (!/\/(api|users|contest|submissions|profile|ratings?|contests?)/i.test(url)) continue;
      try {
        const r = await http.get(url, { headers: Object.assign({}, http.defaults.headers, { Accept: 'application/json, */*' }) });
        // if response looks like JSON, capture it
        if (typeof r.data === 'object') {
          jsonResponses[url] = r.data;
        } else if (typeof r.data === 'string') {
          const j = safeParseJSON(r.data);
          if (j) jsonResponses[url] = j;
        }
      } catch (e) {
        // ignore fetch errors but record brief info
        out._internal.jsonResponses[`err:${url}`] = { status: e.response?.status || 'err', message: e.message };
      }
    }

    out._internal.jsonResponses = Object.assign(out._internal.jsonResponses || {}, jsonResponses);

    // 3) Heuristically merge important fields from JSON responses into schema
    // We'll look for common keys: solved, solved_count, problem_count, problem_buckets, submissions, contests, ratings, ranks, languages
    const merge = (obj) => {
      // problemsSolved
      const pkeys = ['problemsSolved', 'problems_solved', 'solved', 'solved_count', 'total_solved'];
      for (const k of pkeys) {
        if (obj[k] !== undefined) {
          // obj[k] may be integer or object
          if (typeof obj[k] === 'number') out.problemsSolved.total = obj[k];
          else if (typeof obj[k] === 'object') {
            // merge possible fields Easy/Medium/Hard or bucket names
            for (const [bk, val] of Object.entries(obj[k])) {
              if (!isNaN(Number(val))) {
                const mapped = mapBucketName(bk);
                out.problemsSolved[mapped] = (out.problemsSolved[mapped] || 0) + Number(val);
                out.problemsSolved.total = (out.problemsSolved.total || 0) + Number(val);
              }
            }
          }
        }
      }

      // submissions summary
      const submissionKeys = ['submissions', 'submission_stats', 'submissionSummary', 'submission_count'];
      for (const k of submissionKeys) {
        if (obj[k]) out.extras.submissions = Object.assign(out.extras.submissions || {}, obj[k]);
      }

      // contests
      const contestKeys = ['contests', 'contest_history', 'contest_list'];
      for (const k of contestKeys) {
        if (Array.isArray(obj[k]) && obj[k].length) {
          out.extras.contests = (out.extras.contests || []).concat(obj[k]);
        }
      }

      // ranks/ratings
      const ratingKeys = ['rating', 'ratings', 'rank', 'ranks', 'user_rating'];
      for (const k of ratingKeys) {
        if (obj[k]) out.extras.rating = Object.assign(out.extras.rating || {}, { [k]: obj[k] });
      }

      // languages
      if (Array.isArray(obj.languages) && obj.languages.length) {
        out.extras.languages = uniq([...(out.extras.languages||[]), ...obj.languages]);
      }

      // daily problems/calendar if present
      if (obj.calendar || obj.activity_calendar || obj.submission_calendar) {
        const calendar = obj.calendar || obj.activity_calendar || obj.submission_calendar;
        if (typeof calendar === 'object') {
          for (const [k, v] of Object.entries(calendar)) {
            out.dailyProblemsSolved[k] = Number(v) || 0;
          }
        }
      }

      // topicWiseStats
      if (obj.topic_stats || obj.tag_stats) {
        const tstats = obj.topic_stats || obj.tag_stats;
        out.topicWiseStats = Object.assign(out.topicWiseStats || {}, tstats);
      }

      // recent submissions problems/titles
      if (Array.isArray(obj.recent) || Array.isArray(obj.recent_submissions) || Array.isArray(obj.submissions)) {
        const arr = obj.recent || obj.recent_submissions || obj.submissions;
        for (const it of arr) {
          // try to find title and timestamp fields
          const title = it.title || it.problem_name || it.name || it.problem || it.problem_name;
          const ts = it.timestamp || it.submitted_at || it.time || it.date;
          const when = (ts && (new Date(Number(ts) * (String(ts).length<=10?1000:1)).toISOString().split('T')[0])) || 'unknown';
          if (title) {
            out.recentProblemsByDay[when] = out.recentProblemsByDay[when] || [];
            out.recentProblemsByDay[when].push(typeof title === 'string' ? title : JSON.stringify(title));
          }
        }
      }
    };

    // apply merge to each json response
    for (const [url, j] of Object.entries(jsonResponses)) {
      if (!j) continue;
      if (typeof j === 'object') merge(j);
    }

    // 4) If we didn't get a full total from JSON, fallback to parsing HTML (conservative)
    if (!out.problemsSolved.total || out.problemsSolved.total < 1) {
      // reuse earlier simple HTML extraction from static page
      const bucketMap = { Beginner: 'Easy', School: 'Easy', Easy: 'Easy', Medium: 'Medium', Hard: 'Hard', Challenge: 'Hard', Peer: 'Easy', Unknown: 'Easy' };
      let total = 0;
      $("*:contains('Problems Solved'):not(script):not(style)").each((i, el) => {
        const text = $(el).text();
        const regex = /([A-Za-z]+)\s*\(\s*(\d+)\s*\)/g;
        let m;
        while ((m = regex.exec(text)) !== null) {
          const bucket = m[1], count = Number(m[2]);
          const mapped = bucketMap[bucket] || bucket;
          out.problemsSolved[mapped] = (out.problemsSolved[mapped] || 0) + count;
          total += count;
        }
      });
      if (total) out.problemsSolved.total = total;
    }

    // 5) normalize mapped bucket keys to Easy/Medium/Hard (touch up)
    const normalizedBuckets = {};
    ['Easy','Medium','Hard'].forEach(k => { if (out.problemsSolved[k]) normalizedBuckets[k] = out.problemsSolved[k]; });
    if (out.problemsSolved.total) normalizedBuckets.total = out.problemsSolved.total;
    out.problemsSolved = normalizedBuckets;

    return out;

  } catch (err) {
    return { error: 'Internal server error', detail: err.message, _internal: out._internal };
  }
}

// helper: map arbitrary bucket names to canonical Easy/Medium/Hard where possible
function mapBucketName(b) {
  if (!b) return b;
  const lower = String(b).toLowerCase();
  if (/beginner|school|easy|peer/.test(lower)) return 'Easy';
  if (/medium/.test(lower)) return 'Medium';
  if (/hard|challenge/.test(lower)) return 'Hard';
  if (/total|all/.test(lower)) return 'total';
  return b;
}

module.exports = { fetchCodeChefData };
