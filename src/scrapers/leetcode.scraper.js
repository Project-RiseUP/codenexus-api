const axios = require('axios');

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const PROFILE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar {
      submissionCalendar
      streak
      totalActiveDays
    }
  }
}`;

const BADGES_QUERY = `
query userBadges($username: String!) {
  matchedUser(username: $username) {
    badges {
      id
      name
      shortName
      displayName
      icon
      hoverText
      medal {
        slug
        config {
          iconGif
          iconGifBackground
        }
      }
      creationDate
      category
    }
  }
}
`;

const RECENT_AC_QUERY = `
query recentAcSubmissions($username: String!) {
  recentAcSubmissionList(username: $username) {
    title
    titleSlug
    timestamp
  }
}`;

const QUESTION_TAGS_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    topicTags {
      name
    }
  }
}`;

async function fetchLeetCodeData(username) {
  if (!username) return { error: 'Username is required' };

  const headers = { 'Content-Type': 'application/json' };

  try {
    // Step 1: Profile
    const profilePayload = {
      query: PROFILE_QUERY,
      variables: { username },
    };

    const profileRes = await axios.post(LEETCODE_GRAPHQL, profilePayload, { headers });
    const userData = profileRes.data?.data?.matchedUser;

    if (!userData) return { error: 'LeetCode user not found' };

    const problemsSolved = {};
    for (const item of userData.submitStats.acSubmissionNum) {
      problemsSolved[item.difficulty] = item.count;
    }

    const calendarRaw = JSON.parse(userData.userCalendar.submissionCalendar || '{}');
    const dailyProblemsSolved = {};
    for (const [timestamp, count] of Object.entries(calendarRaw)) {
      const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
      dailyProblemsSolved[date] = count;
    }

    // Step 2: Recent Submissions
    const recentPayload = {
      query: RECENT_AC_QUERY,
      variables: { username },
    };

    const recentRes = await axios.post(LEETCODE_GRAPHQL, recentPayload, { headers });
    const recentSubs = recentRes.data?.data?.recentAcSubmissionList || [];

    const recentProblemsByDay = {};
    const topicWiseStats = {};

    for (const sub of recentSubs) {
      const { title, titleSlug, timestamp } = sub;
      const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];

      if (!recentProblemsByDay[date]) recentProblemsByDay[date] = [];
      recentProblemsByDay[date].push(title);

      // Step 3: Tags for each recent problem
      const tagPayload = {
        query: QUESTION_TAGS_QUERY,
        variables: { titleSlug },
      };

      const tagRes = await axios.post(LEETCODE_GRAPHQL, tagPayload, { headers });
      const tags = tagRes.data?.data?.question?.topicTags || [];

      for (const tag of tags) {
        const tagName = tag.name;
        topicWiseStats[tagName] = (topicWiseStats[tagName] || 0) + 1;
      }
    }

    // Step 4: Badges
    let badges = [];
    
    try {
      const badgesPayload = {
        query: BADGES_QUERY,
        variables: { username },
        operationName: 'userBadges'  // Important!
      };

      const badgesRes = await axios.post(LEETCODE_GRAPHQL, badgesPayload, { headers });
      
      if (badgesRes.data?.errors) {
        console.error('GraphQL Badges Error:', JSON.stringify(badgesRes.data.errors));
      } else {
        const matchedUser = badgesRes.data?.data?.matchedUser;
        
        if (matchedUser) {
          const earnedBadges = (matchedUser.badges || [])
            .filter(badge => badge.creationDate)
            .map(badge => ({
              id: badge.id,
              name: badge.name || badge.displayName || badge.shortName,
              displayName: badge.displayName,
              icon: badge.icon,
              category: badge.category || 'Other',
              creationDate: badge.creationDate,
              hoverText: badge.hoverText
            }));
          
          badges = earnedBadges;
          console.log(`Successfully fetched ${badges.length} badges for ${username}`);
        }
      }
    } catch (badgeError) {
      console.error('Badge fetch error:', badgeError.message);
    }

    return {
      username,
      problemsSolved,
      dailyProblemsSolved,
      recentProblemsByDay,
      topicWiseStats,
      badges,
    };
  } catch (err) {
    console.error('Full error:', err.response?.data || err.message);
    return { error: 'Internal server error', detail: err.message };
  }
}

module.exports = { fetchLeetCodeData };