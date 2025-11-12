/**
 * Aggregate Profile Routes
 * 
 * RESTful endpoints for fetching user profiles from multiple platforms simultaneously
 * Route: /api/v1/profiles/*
 */

const express = require('express');
const router = express.Router();
const { fetchAllPlatforms, getSupportedPlatforms } = require('../controllers/platformController');

/**
 * Fetch user profiles from all supported platforms
 * POST /api/v1/profiles/aggregate
 * 
 * Aggregates data from all supported platforms in parallel
 * 
 * @body {string} username - User's username (will be used across all platforms)
 * @body {Object} [platformUsernames] - Optional: different usernames per platform
 * 
 * @returns {Object} Aggregated profile data from all platforms
 */
router.post('/api/v1/profiles/aggregate', async (req, res) => {
  const { username, platformUsernames } = req.body;

  if (!username && !platformUsernames) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter',
      message: 'Either username or platformUsernames is required',
      examples: {
        sameUsername: {
          username: 'john_doe',
        },
        differentUsernames: {
          platformUsernames: {
            leetcode: 'john_leetcode',
            github: 'john_github',
            codeforces: 'john_cf',
          },
        },
      },
      supportedPlatforms: getSupportedPlatforms(),
    });
  }

  try {
    // Use single username or fetch with different usernames per platform
    const data = await fetchAllPlatforms(username || platformUsernames);
    
    // Calculate summary statistics
    const summary = calculateSummary(data);
    
    res.json({
      success: true,
      username: username || 'multiple',
      platforms: data,
      summary,
      fetchedAt: new Date().toISOString(),
      metadata: {
        totalPlatforms: Object.keys(data).length,
        successfulFetches: Object.values(data).filter(p => !p.error).length,
        failedFetches: Object.values(data).filter(p => p.error).length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aggregate profiles',
      message: error.message,
      username,
    });
  }
});

/**
 * Calculate summary statistics from aggregated data
 */
function calculateSummary(platformsData) {
  const summary = {
    totalProblems: 0,
    platformsWithData: 0,
    platforms: {},
  };

  for (const [platform, data] of Object.entries(platformsData)) {
    if (data.error) {
      summary.platforms[platform] = { status: 'failed', error: data.error };
      continue;
    }

    summary.platformsWithData++;
    
    // Count problems from different platforms
    if (data.problemsSolved) {
      const total = Object.values(data.problemsSolved).reduce((sum, val) => {
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
      
      summary.totalProblems += total;
      summary.platforms[platform] = {
        status: 'success',
        problemsSolved: total,
      };
    } else {
      summary.platforms[platform] = { status: 'success', problemsSolved: 0 };
    }
  }

  return summary;
}

module.exports = router;
