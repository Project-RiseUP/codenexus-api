/**
 * Platform Profile Routes
 * 
 * RESTful endpoints for fetching user profiles from individual platforms
 * Route: /api/v1/platforms/:platform/profiles
 */

const express = require('express');
const router = express.Router();
const { fetchPlatformData, getSupportedPlatforms } = require('../controllers/platformController');

/**
 * Get list of supported platforms
 * GET /api/v1/platforms
 * 
 * Returns metadata about all supported competitive programming platforms
 */
router.get('/api/v1/platforms', (req, res) => {
  const platforms = getSupportedPlatforms();
  
  const platformDetails = {
    leetcode: {
      name: 'LeetCode',
      description: 'Leading online programming learning platform',
      website: 'https://leetcode.com',
      dataProvided: ['problemsSolved', 'recentSubmissions', 'contestRating', 'badges'],
    },
    codeforces: {
      name: 'Codeforces',
      description: 'Competitive programming platform with regular contests',
      website: 'https://codeforces.com',
      dataProvided: ['rating', 'rank', 'problemsSolved', 'contestHistory'],
    },
    codechef: {
      name: 'CodeChef',
      description: 'Competitive programming platform hosted by Directi',
      website: 'https://www.codechef.com',
      dataProvided: ['rating', 'stars', 'problemsSolved', 'contestRatings'],
    },
    geeksforgeeks: {
      name: 'GeeksforGeeks',
      description: 'Computer science portal with coding problems and articles',
      website: 'https://www.geeksforgeeks.org',
      dataProvided: ['codingScore', 'problemsSolved', 'articlePublished', 'badges'],
    },
    hackerrank: {
      name: 'HackerRank',
      description: 'Technical assessment and interview preparation platform',
      website: 'https://www.hackerrank.com',
      dataProvided: ['badges', 'skills', 'certifications', 'problemsSolved'],
    },
    github: {
      name: 'GitHub',
      description: 'World\'s leading software development platform',
      website: 'https://github.com',
      dataProvided: ['repositories', 'contributions', 'stars', 'followers', 'languages'],
    },
  };

  res.json({
    success: true,
    count: platforms.length,
    platforms: platforms.map(p => ({
      id: p,
      ...platformDetails[p],
      endpoint: `/api/v1/platforms/${p}/profiles`,
    })),
  });
});

/**
 * Fetch user profile from a specific platform
 * POST /api/v1/platforms/:platform/profiles
 * 
 * @param {string} platform - Platform identifier (leetcode, codeforces, etc.)
 * @body {string} username - User's username on the platform
 * 
 * @returns {Object} User profile data from the specified platform
 */
router.post('/api/v1/platforms/:platform/profiles', async (req, res) => {
  const { platform } = req.params;
  const { username } = req.body;

  // Validate platform
  const supportedPlatforms = getSupportedPlatforms();
  if (!supportedPlatforms.includes(platform.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported platform',
      message: `Platform '${platform}' is not supported`,
      supportedPlatforms,
      hint: `Use GET /api/v1/platforms to see all supported platforms`,
    });
  }

  // Validate username
  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter',
      message: 'Username is required',
      example: {
        username: 'john_doe',
      },
    });
  }

  try {
    const data = await fetchPlatformData(platform.toLowerCase(), username);
    
    res.json({
      success: true,
      platform: platform.toLowerCase(),
      username,
      data,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message,
      platform: platform.toLowerCase(),
      username,
    });
  }
});

module.exports = router;
