const axios = require("axios");

const GRAPHQL = "https://leetcode.com/graphql";

// Morgan-style logging
function httpLog(method, url, status, ms) {
  console.log(`${method} ${url} ${status} - ${ms}ms`);
}

async function timedRequest(requestFn, method, url) {
  const start = Date.now();
  try {
    const res = await requestFn();
    httpLog(method, url, res.status, Date.now() - start);
    return res;
  } catch (err) {
    const status = err.response?.status || 500;
    httpLog(method, url, status, Date.now() - start);
    return { data: {}, status };
  }
}

// Combined query: profile + calendar + recent submissions + contest data
const PROFILE_COMBINED_QUERY = `
query userData($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      userAvatar
      realName
      aboutMe
      ranking
      reputation
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    userCalendar {
      submissionCalendar
    }
    badges {
      id
      displayName
      icon
      category
    }
  }

  recentAcSubmissionList(username: $username, limit: 20) {
    title
    titleSlug
    timestamp
    statusDisplay
    lang
    runtime
    memory
    url
    isPending
  }

  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
    badge {
      name
      icon
    }
  }

  userContestRankingHistory(username: $username) {
    attended
    rating
    ranking
    trendDirection
    problemsSolved
    totalProblems
    finishTimeInSeconds
    contest {
      title
      startTime
    }
  }
}
`;

// Direct per-problem tag query (from your base code)
const QUESTION_TAGS_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    topicTags {
      name
    }
  }
}
`;

async function fetchTagsInParallel(slugs) {
  const tagFetchers = slugs.map((slug) =>
    axios
      .post(GRAPHQL, {
        query: QUESTION_TAGS_QUERY,
        variables: { titleSlug: slug }
      })
      .then((res) => ({
        slug,
        tags: res.data?.data?.question?.topicTags || []
      }))
      .catch(() => ({ slug, tags: [] }))
  );

  return Promise.all(tagFetchers);
}

async function fetchLeetCodeData(username) {
  if (!username) return { error: "Username is required" };

  try {
    // 1️⃣ SINGLE COMBINED GRAPHQL CALL (profile + contest data)
    const graphQLRes = await timedRequest(
      () =>
        axios.post(GRAPHQL, {
          query: PROFILE_COMBINED_QUERY,
          variables: { username }
        }),
      "POST",
      `${GRAPHQL} (profile+calendar+recent+contest)`
    );

    // Check for GraphQL errors in response
    if (graphQLRes.data?.errors) {
      console.error("GraphQL Errors:", JSON.stringify(graphQLRes.data.errors, null, 2));
      const errorMessages = graphQLRes.data.errors.map(e => e.message).join(", ");
      return { 
        error: "GraphQL query error", 
        detail: errorMessages,
        errors: graphQLRes.data.errors,
        username 
      };
    }

    const data = graphQLRes.data?.data;
    const user = data?.matchedUser;

    if (!user) {
      return { error: "LeetCode user not found", username };
    }

    // Handle contest data from the same response
    let contestRanking = null;
    let contestHistory = [];
    
    if (data?.userContestRanking) {
      contestRanking = {
        attendedContestsCount: data.userContestRanking.attendedContestsCount || 0,
        rating: data.userContestRanking.rating || 0,
        globalRanking: data.userContestRanking.globalRanking || 0,
        totalParticipants: data.userContestRanking.totalParticipants || 0,
        topPercentage: data.userContestRanking.topPercentage || 0,
        badge: data.userContestRanking.badge?.name || null,
        badgeIcon: data.userContestRanking.badge?.icon || null
      };
    }

    // Filter to only include contests where user participated (attended = true)
    if (data?.userContestRankingHistory) {
      contestHistory = (data.userContestRankingHistory || [])
        .filter(contest => contest.attended === true)
        .map(contest => ({
          rating: contest.rating || 0,
          ranking: contest.ranking || 0,
          trendDirection: contest.trendDirection || null,
          problemsSolved: contest.problemsSolved || 0,
          totalProblems: contest.totalProblems || 0,
          finishTimeInSeconds: contest.finishTimeInSeconds || 0,
          contestTitle: contest.contest?.title || null,
          contestStartTime: contest.contest?.startTime || null
        }));
    }

    // Problems solved
    const problemsSolved = {};
    (user.submitStats?.acSubmissionNum || []).forEach((s) => {
      problemsSolved[s.difficulty] = s.count;
    });

    // Submission calendar
    const calendarRaw = user.userCalendar?.submissionCalendar || "{}";
    let calendar = {};
    try {
      calendar = JSON.parse(calendarRaw);
    } catch {}

    const dailyProblemsSolved = {};
    for (const [ts, count] of Object.entries(calendar)) {
      const date = new Date(ts * 1000).toISOString().split("T")[0];
      dailyProblemsSolved[date] = count;
    }

    // Recent submissions with detailed information
    const recent = data?.recentAcSubmissionList || [];
    const recentProblemsByDay = {};
    const recentSlugs = [];

    for (const sub of recent) {
      const date = new Date(sub.timestamp * 1000)
        .toISOString()
        .split("T")[0];

      if (!recentProblemsByDay[date]) recentProblemsByDay[date] = [];
      
      // Store detailed problem information
      recentProblemsByDay[date].push({
        title: sub.title,
        titleSlug: sub.titleSlug,
        timestamp: sub.timestamp,
        status: sub.statusDisplay || "Unknown",
        language: sub.lang || null,
        runtime: sub.runtime || null,
        memory: sub.memory || null,
        url: sub.url || null,
        isPending: sub.isPending || false
      });

      recentSlugs.push(sub.titleSlug);
    }

    // 2️⃣ Fetch tags in PARALLEL (old working method)
    const tagResults = await fetchTagsInParallel(recentSlugs);

    // topicWiseStats (accurate from old logic)
    const topicWiseStats = {};
    tagResults.forEach(({ tags }) => {
      tags.forEach((tag) => {
        const name = tag.name;
        topicWiseStats[name] = (topicWiseStats[name] || 0) + 1;
      });
    });

    // Profile data
    const profile = {
      avatar: user.profile?.userAvatar || null,
      name: user.profile?.realName || null,
      username: username,
      about: user.profile?.aboutMe || null,
      ranking: user.profile?.ranking || null,
      reputation: user.profile?.reputation || null
    };

    // Additional info (only unique data not in profile)
    const additionalInfo = {};

    // Get badges from API
    const badges = (user.badges || []).map(badge => ({
      title: badge.displayName || badge.id,
      type: badge.category || "achievement",
      icon: badge.icon || null
    }));

    // Contest statistics - all contest data in one object
    const contestStats = {
      currentRating: contestRanking?.rating || 0,
      globalRanking: contestRanking?.globalRanking || 0,
      attendedContestsCount: contestRanking?.attendedContestsCount || 0,
      topPercentage: contestRanking?.topPercentage || 0,
      badge: contestRanking?.badge || null,
      badgeIcon: contestRanking?.badgeIcon || null,
      history: contestHistory,
      totalContests: contestHistory.length
    };

    // FINAL RESPONSE - matching platformController.js format
    return {
      username,
      profile,
      problemsSolved,
      dailyProblemsSolved,
      recentProblemsByDay,
      topicWiseStats,
      additionalInfo,
      badges,
      contestStats
    };
  } catch (err) {
    return {
      error: "Internal server error",
      detail: err.response?.data || err.message
    };
  }
}

module.exports = { fetchLeetCodeData };
