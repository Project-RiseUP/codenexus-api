/**
 * Platform Controller
 * 
 * Business logic for fetching platform data
 * Handles data aggregation and transformation
 */

const { fetchGFGData } = require("../scrapers/geeksforgeeks.scraper");
const { fetchCodeforcesData } = require("../scrapers/codeforces.scraper");
const { fetchLeetCodeData } = require("../scrapers/leetcode.scraper");
const { fetchGitHubData } = require("../scrapers/github.scraper");
const { fetchCodeChefData } = require("../scrapers/codechef.scraper");
const { fetchHackerRankData } = require("../scrapers/hackerrank.scraper");
const { logger } = require("../utils/logger");

// Utility to sanitize username
const sanitizeUsername = (username) => String(username || "").trim();

// CodeChef wrapper with cookie support
async function fetchCodeChefDataWrapped(username) {
  const CODECHEF_COOKIE = process.env.CODECHEF_COOKIE || "";
  return fetchCodeChefData(sanitizeUsername(username), {
    cookie: CODECHEF_COOKIE,
    timeout: 20000,
  });
}

// Platform fetchers mapping
const platformFetchers = {
  github: fetchGitHubData,
  leetcode: fetchLeetCodeData,
  geeksforgeeks: fetchGFGData,
  codeforces: fetchCodeforcesData,
  hackerrank: (u) => fetchHackerRankData(sanitizeUsername(u)),
  codechef: (u) => fetchCodeChefDataWrapped(u),
};

/**
 * Fetch data from a single platform
 * @param {string} platform - Platform name
 * @param {string} username - User's username
 * @returns {Promise<Object>} Platform data
 */
async function fetchPlatformData(platform, username) {
  const fetchFunc = platformFetchers[platform.toLowerCase()];
  
  if (!fetchFunc) {
    const error = new Error(`Unsupported platform: ${platform}`);
    logger.error(`Unsupported platform: ${platform} for user ${username}`);
    throw error;
  }

  const startTime = Date.now();
  
  try {
    const data = await fetchFunc(sanitizeUsername(username));
    const duration = Date.now() - startTime;

    // Log only slow requests
    if (duration > 5000) {
      logger.warn(`Slow fetch: ${platform} took ${duration}ms for ${username}`);
    }

    // Accept either data.additionalInfo or data.extras
    const additionalInfo = data?.additionalInfo || data?.extras || {};

    // Ensure consistent data structure
    const result = {
      platform,
      username: sanitizeUsername(username),

      // ⭐ Added avatar support (for LeetCode, GitHub, CF, etc)
      avatar: data?.avatar || null,

      problemsSolved: data?.problemsSolved || {},
      dailyProblemsSolved: data?.dailyProblemsSolved || {},
      recentProblemsByDay: data?.recentProblemsByDay || {},
      topicWiseStats: data?.topicWiseStats || {},
      additionalInfo,
      error: data?.error,
    };

    return result;
  } catch (error) {
    logger.error(`Failed to fetch ${platform} for ${username}: ${error.message}`);
    throw new Error(`Error fetching ${platform} data: ${error.message}`);
  }
}

/**
 * Fetch data from all platforms
 * @param {string} username - User's username
 * @returns {Promise<Object>} Combined data from all platforms
 */
async function fetchAllPlatforms(username) {
  const cleaned = sanitizeUsername(username);
  
  const platforms = Object.keys(platformFetchers);
  const results = await Promise.allSettled(
    platforms.map(platform => fetchPlatformData(platform, cleaned))
  );

  const response = results.reduce((acc, result, index) => {
    const platform = platforms[index];
    acc[platform] = result.status === 'fulfilled'
      ? result.value
      : { error: result.reason.message };
    return acc;
  }, {});

  return response;
}

/**
 * Get list of supported platforms
 * @returns {Array<string>} Array of platform names
 */
function getSupportedPlatforms() {
  return Object.keys(platformFetchers);
}

module.exports = {
  fetchPlatformData,
  fetchAllPlatforms,
  getSupportedPlatforms,
  sanitizeUsername,
};