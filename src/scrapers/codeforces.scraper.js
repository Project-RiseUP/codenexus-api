const axios = require('axios');

function getBadges(userInfo) {
  const badges = [];

  if (userInfo.rank) {
    badges.push({ title: `Rank: ${userInfo.rank}`, type: 'rank' });
  }

  if (userInfo.maxRating >= 2000) {
    badges.push({ title: 'Reached 2000+ Rating', type: 'milestone' });
  }
  if (userInfo.maxRating >= 2500) {
    badges.push({ title: 'Reached 2500+ Rating', type: 'milestone' });
  }
  if (userInfo.maxRating >= 3000) {
    badges.push({ title: 'Reached 3000+ Rating', type: 'milestone' });
  }

  if (userInfo.friendOfCount >= 1000) {
    badges.push({ title: '1000+ Friends', type: 'community' });
  }

  if (userInfo.contribution > 0) {
    badges.push({ title: `Positive Contributor (+${userInfo.contribution})`, type: 'community' });
  }

  return badges;
}

async function fetchCodeforcesData(username) {
  if (!username) return { error: 'Username is required' };

  try {
    // Fetch submissions + profile info
    const [submissionsRes, userInfoRes] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.status?handle=${username}`),
      axios.get(`https://codeforces.com/api/user.info?handles=${username}`)
    ]);

    const submissions = submissionsRes.data.result;
    const userInfo = userInfoRes.data.result[0];

    const solvedSet = new Set();
    const problemsSolved = {};
    const topicWiseStats = {};
    const problemDetails = new Map();

    const problemsSolvedByDay = {};
    const recentProblemsByDay = {};

    for (const sub of submissions) {
      if (sub.verdict !== 'OK') continue;

      const problem = sub.problem || {};
      const name = problem.name;
      const tags = problem.tags || [];
      const contestId = problem.contestId;
      const index = problem.index;
      const rating = problem.rating;

      const problemId = `${contestId}-${index}`;
      if (solvedSet.has(problemId)) continue;

      solvedSet.add(problemId);
      problemDetails.set(problemId, {
        name,
        rating,
        tags,
        contestId,
        index
      });

      // Group by difficulty rating
      let difficultyBucket = 'Unrated';
      if (rating) {
        if (rating <= 1200) difficultyBucket = 'Easy (<=1200)';
        else if (rating <= 2000) difficultyBucket = 'Medium (1300-2000)';
        else difficultyBucket = 'Hard (>2000)';
      }
      problemsSolved[difficultyBucket] = (problemsSolved[difficultyBucket] || 0) + 1;

      // Daily solved problems
      const ts = sub.creationTimeSeconds;
      const date = new Date(ts * 1000).toISOString().slice(0, 10);
      problemsSolvedByDay[date] = (problemsSolvedByDay[date] || 0) + 1;

      if (!recentProblemsByDay[date]) recentProblemsByDay[date] = [];
      recentProblemsByDay[date].push(name);

      // Tag stats
      for (const tag of tags) {
        topicWiseStats[tag] = (topicWiseStats[tag] || 0) + 1;
      }
    }

    problemsSolved['Total'] = solvedSet.size;

    return {
      username,
      problemsSolved,
      activity: {
        problemsSolvedByDay,
        recentProblemsByDay
      },
      topicWiseStats,
      badges: getBadges(userInfo),
      additionalInfo: {
        rating: userInfo.rating,
        maxRating: userInfo.maxRating,
        rank: userInfo.rank,
        maxRank: userInfo.maxRank,
        contribution: userInfo.contribution,
        friendOfCount: userInfo.friendOfCount,
        lastOnline: new Date(userInfo.lastOnlineTimeSeconds * 1000).toISOString(),
        registrationDate: new Date(userInfo.registrationTimeSeconds * 1000).toISOString(),
        problems: Array.from(problemDetails.values())
      }
    };
  } catch (err) {
    return { error: 'Failed to fetch Codeforces data', detail: err.message };
  }
}

module.exports = { fetchCodeforcesData };
