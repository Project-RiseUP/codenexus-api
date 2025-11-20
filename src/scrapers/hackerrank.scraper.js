/**
 * HackerRank Scraper
 * 
 * Fetches HackerRank profile data including problems solved, submissions, and statistics
 */
const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const { chromium } = require('playwright');
const fs = require('fs');
const { logger } = require('../utils/logger');

const HACKERRANK_BASE = 'https://www.hackerrank.com';

/**
 * Simple concurrency limiter
 * Limits the number of concurrent async operations
 * @param {number} concurrency - Maximum number of concurrent operations
 * @returns {Function} A function that wraps async operations
 */
function createLimiter(concurrency) {
  let running = 0;
  const queue = [];

  const run = async (fn) => {
    if (running >= concurrency) {
      await new Promise(resolve => queue.push(resolve));
    }
    running++;
    try {
      return await fn();
    } finally {
      running--;
      if (queue.length > 0) {
        const next = queue.shift();
        next();
      }
    }
  };

  return run;
}

function toDateStr(input) {
  if (!input) return null;
  if (typeof input === 'number') {
    const ms = input > 1e12 ? input : input * 1000;
    return dayjs(ms).toISOString().split('T')[0];
  }
  const d = dayjs(input);
  return d.isValid() ? d.toISOString().split('T')[0] : null;
}

function loadJar(cookieJarPath) {
  const jar = new tough.CookieJar();
  if (cookieJarPath && fs.existsSync(cookieJarPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(cookieJarPath, 'utf8'));
      return tough.CookieJar.deserializeSync(raw);
    } catch {}
  }
  return jar;
}
function saveJar(jar, cookieJarPath) {
  if (!cookieJarPath) return;
  try {
    const serialized = jar.serializeSync();
    fs.writeFileSync(cookieJarPath, JSON.stringify(serialized, null, 2));
  } catch {}
}

async function safeGet(instance, url, opts = {}) {
  try {
    return await instance.get(url, opts);
  } catch (err) {
    return { __error: err, status: err?.response?.status };
  }
}
const isAuthFail = (res) => res && !res.__error && (res.status === 401 || res.status === 403);

async function loginAndRefreshCookies({ email, password, cookieJarPath, headless = true }) {
  // Headless login via Playwright; writes cookies to cookieJarPath
  const browser = await chromium.launch({ headless });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto('https://www.hackerrank.com/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ url: /hackerrank\.com\/(dashboard|profile|home)/, timeout: 60000 }).catch(()=>{}),
    page.click('button[type="submit"]'),
  ]);

  // If you use 2FA, add steps here (enter OTP etc.)

  const cookies = await ctx.cookies();
  const jar = new tough.CookieJar();
  for (const c of cookies) {
    const dom = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
    const str = `${c.name}=${c.value}; Domain=${dom}; Path=${c.path}; ${c.secure ? 'Secure;' : ''} ${c.httpOnly ? 'HttpOnly;' : ''}`;
    try { jar.setCookieSync(str, `https://${dom}`); } catch {}
  }
  saveJar(jar, cookieJarPath);
  await browser.close();
  return true;
}

async function buildAxiosWithJar(jar, { timeoutMs, authToken }) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    Accept: 'application/json,text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return wrapper(axios.create({
    baseURL: HACKERRANK_BASE,
    timeout: timeoutMs,
    withCredentials: true,
    jar,
    headers,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  }));
}

async function fetchOnce(username, axiosInstance, { verbose }) {
  const log = (...a) => verbose && logger.info('[hackerrank]', ...a);

  const problemsSolved = { easy: 0, medium: 0, hard: 0, total: 0 };
  const dailyProblemsSolved = {};
  const recentProblemsByDay = {};
  const topicWiseStats = {};
  const addTopics = (tags) => {
    if (!Array.isArray(tags)) return;
    for (const t of tags) {
      const key = String(t || '').trim().toLowerCase();
      if (key) topicWiseStats[key] = (topicWiseStats[key] || 0) + 1;
    }
  };

  // 1) Profile JSON
  const profileEndpoints = [
    `/rest/contests/master/hackers/${encodeURIComponent(username)}/profile`,
    `/rest/hackers/${encodeURIComponent(username)}/profile`,
    `/rest/contests/all/hackers/${encodeURIComponent(username)}/profile`,
    `/rest/hackers/${encodeURIComponent(username)}`,
  ];
  let profileJson = null, lastProfileRes = null;
  for (const ep of profileEndpoints) {
    const r = await safeGet(axiosInstance, ep, { headers: { Accept: 'application/json' } });
    lastProfileRes = r;
    if (r && !r.__error && r.data) { profileJson = r.data; break; }
  }
  if (lastProfileRes && isAuthFail(lastProfileRes)) return { __authFail: true };

  if (profileJson) {
    const totals = [
      profileJson.total_solved, profileJson.solved_challenges, profileJson.solved,
      profileJson.total_score, profileJson.solved_count, profileJson?.data?.solved,
    ];
    for (const n of totals) { if (typeof n === 'number' && n >= 0) { problemsSolved.total = n; break; } }
    if (profileJson.solved_breakdown) {
      const sb = profileJson.solved_breakdown;
      if (typeof sb.easy === 'number') problemsSolved.easy = sb.easy;
      if (typeof sb.medium === 'number') problemsSolved.medium = sb.medium;
      if (typeof sb.hard === 'number') problemsSolved.hard = sb.hard;
    }
    if (profileJson.submission_calendar && typeof profileJson.submission_calendar === 'object') {
      for (const [k, v] of Object.entries(profileJson.submission_calendar)) {
        let dateKey = k; if (/^\d+$/.test(k)) dateKey = toDateStr(Number(k));
        dailyProblemsSolved[dateKey] = typeof v === 'number' ? v : Number(v) || 0;
      }
    }
  }

  // 2) Recent submissions JSON
  const recentEndpoints = [
    `/rest/contests/master/hackers/${encodeURIComponent(username)}/recent_challenges`,
    `/rest/hackers/${encodeURIComponent(username)}/recent_submissions`,
    `/rest/contests/master/hackers/${encodeURIComponent(username)}/recent_submissions`,
    `/rest/hackers/${encodeURIComponent(username)}/recent_challenges`,
  ];
  let recentRaw = [], lastRecentRes = null;
  for (const ep of recentEndpoints) {
    const r = await safeGet(axiosInstance, ep, { headers: { Accept: 'application/json' } });
    lastRecentRes = r;
    if (r && !r.__error && r.data) {
      if (Array.isArray(r.data)) recentRaw = r.data;
      else if (Array.isArray(r.data.data)) recentRaw = r.data.data;
      else if (Array.isArray(r.data.recent)) recentRaw = r.data.recent;
      if (recentRaw.length) break;
    }
  }
  if (lastRecentRes && isAuthFail(lastRecentRes)) return { __authFail: true };

  // 3) HTML fallback
  if (!recentRaw.length) {
    const pr = await safeGet(axiosInstance, `/profile/${encodeURIComponent(username)}`, { headers: { Accept: 'text/html' } });
    if (pr && !pr.__error && pr.data) {
      const html = pr.data;
      if (/Just a moment|cf-browser-verification|Cloudflare/i.test(html)) return { __authFail: true };
      const $ = cheerio.load(html);
      if (!$('script').length) {
        if (verbose) logger.warn('No scripts found on HackerRank profile page');
      }
      $('script').each((i, s) => {
        const txt = $(s).html() || '';
        const m = txt.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*});?/);
        if (m && m[1] && !recentRaw.length) {
          try {
            const parsed = JSON.parse(m[1]);
            const cands = [parsed.recent_submissions, parsed.activity, parsed.recent, parsed.recent_challenges, parsed?.profile?.recent_submissions];
            for (const c of cands) { if (Array.isArray(c)) { recentRaw = c.slice(); break; } }
          } catch {}
        }
      });
      if (!recentRaw.length) {
        $('a[href*="/challenges/"]').each((_, a) => {
          const $a = $(a);
          const title = $a.text().trim();
          const href = $a.attr('href') || '';
          if (!title) return;
          const slugMatch = href.match(/\/challenges\/([^\/\?]+)/);
          const slug = slugMatch ? slugMatch[1] : undefined;
          const timeEl = $a.closest('li,div').find('time').first();
          const ts = (timeEl && timeEl.attr && timeEl.attr('datetime')) || undefined;
          recentRaw.push({ title, slug, timestamp: ts });
        });
      }
    }
  }

  // Normalize & aggregate
  const normalizedRecent = [];
  for (const it of recentRaw) {
    const title = it.name || it.title || it.challenge_name || it.challenge || it.title_text;
    const slug = it.slug || it.challenge_slug || (it.href ? (it.href.match(/\/challenges\/([^\/\?]+)/) || [])[1] : undefined);
    const ts = it.timestamp || it.submitted_at || it.created_at || it.time || it.datetime;
    const date = toDateStr(ts) || dayjs().toISOString().split('T')[0];
    const tags = Array.isArray(it.tags) ? it.tags : it.tags ? [it.tags] : it.skills || [];
    const difficulty = (it.difficulty || it.level || '').toString().toLowerCase() || null;
    if (title) {
      normalizedRecent.push({ title, slug, date, tags, difficulty });
      recentProblemsByDay[date] = recentProblemsByDay[date] || [];
      if (!recentProblemsByDay[date].includes(title)) recentProblemsByDay[date].push(title);
      addTopics(tags);
    }
  }

  // Enrich via challenge pages
  const uniqueSlugs = Array.from(new Set(normalizedRecent.map(r => r.slug).filter(Boolean)));
  const toFetch = uniqueSlugs.slice(0, 40);
  if (toFetch.length) {
    const limit = createLimiter(5);
    const tasks = toFetch.map(slug => limit(async () => {
      const r = await safeGet(axiosInstance, `/challenges/${encodeURIComponent(slug)}`, { headers: { Accept: 'text/html' } });
      if (!r || r.__error || !r.data) return null;
      const $ = cheerio.load(r.data);
      const tags = [];
      $('.skill, .problem-tags a, .tags a, .challenge-tags a, .challenge-skill').each((_, el) => {
        const t = $(el).text().trim(); if (t) tags.push(t);
      });
      let difficulty = null;
      const diffSelectors = ['.difficulty','.challenge-difficulty','.level','.problem-statement .difficulty','.difficulty-level'];
      for (const sel of diffSelectors) {
        const text = $(sel).first().text() || '';
        const m = text.match(/(easy|medium|hard)/i);
        if (m) { difficulty = m[1].toLowerCase(); break; }
      }
      if (!difficulty) {
        $('script').each((_, s) => {
          const txt = $(s).html() || '';
          const m = txt.match(/"difficulty"\s*:\s*"?([a-zA-Z]+)"?/i);
          if (m) { difficulty = m[1].toLowerCase(); return false; }
        });
      }
      return { slug, tags, difficulty };
    }));
    const infos = await Promise.all(tasks);
    for (const info of infos) {
      if (!info) continue;
      const { slug, tags = [], difficulty } = info;
      normalizedRecent.forEach(nr => {
        if (nr.slug === slug) {
          if ((!nr.tags || !nr.tags.length) && tags.length) nr.tags = tags;
          if (!nr.difficulty && difficulty) nr.difficulty = difficulty;
        }
      });
      for (const t of tags) addTopics([t]);
    }
  }

  // Difficulty counts if not supplied in profile
  const haveBreakdown = (problemsSolved.easy + problemsSolved.medium + problemsSolved.hard) > 0;
  if (!haveBreakdown) {
    for (const nr of normalizedRecent) {
      const d = (nr.difficulty || '').toLowerCase();
      if (d === 'easy') problemsSolved.easy += 1;
      else if (d === 'medium') problemsSolved.medium += 1;
      else if (d === 'hard') problemsSolved.hard += 1;
    }
  }
  if (!problemsSolved.total) problemsSolved.total = new Set(normalizedRecent.map(r => r.title)).size;
  if (!Object.keys(dailyProblemsSolved).length) {
    for (const nr of normalizedRecent) {
      dailyProblemsSolved[nr.date] = (dailyProblemsSolved[nr.date] || 0) + 1;
    }
  }

  return {
    username,
    problemsSolved: {
      easy: problemsSolved.easy || 0,
      medium: problemsSolved.medium || 0,
      hard: problemsSolved.hard || 0,
      total: problemsSolved.total || 0,
    },
    dailyProblemsSolved,
    recentProblemsByDay,
    topicWiseStats,
  };
}

async function fetchHackerRankData(username, opts = {}) {
  const {
    cookie = null,                // optional one-time seed
    cookieJarPath = './hackerrank_cookies.json',
    authToken = null,
    timeoutMs = 12000,
    verbose = false,
    autoLoginOnAuthFail = true,
    // If autoLogin is enabled, we read creds from env unless overridden here
    loginEmail = process.env.HR_EMAIL,
    loginPassword = process.env.HR_PASSWORD,
    headlessLogin = true,
  } = opts;

  // Load/seed jar
  const jar = loadJar(cookieJarPath);
  if (cookie) {
    const cookieStr = cookie.includes('=') ? cookie : `hr_session=${cookie}`;
    try { jar.setCookieSync(cookieStr, HACKERRANK_BASE); } catch {}
  }
  let axiosInstance = await buildAxiosWithJar(jar, { timeoutMs, authToken });

  // First attempt
  let result = await fetchOnce(username, axiosInstance, { verbose });
  if (result && result.__authFail && autoLoginOnAuthFail) {
    if (!loginEmail || !loginPassword) {
      return { error: 'Authentication required: set HR_EMAIL and HR_PASSWORD env vars (or pass loginEmail/loginPassword) to auto-refresh cookies.' };
    }
    // Perform login, rebuild axios with updated jar, retry once
    await loginAndRefreshCookies({ email: loginEmail, password: loginPassword, cookieJarPath, headless: headlessLogin });
    const newJar = loadJar(cookieJarPath);
    saveJar(newJar, cookieJarPath);
    axiosInstance = await buildAxiosWithJar(newJar, { timeoutMs, authToken });
    result = await fetchOnce(username, axiosInstance, { verbose });
    if (result && result.__authFail) {
      return { error: 'Authentication failed even after auto-login. Check credentials or 2FA.' };
    }
    return result;
  }
  return result;
}

module.exports = { fetchHackerRankData };
