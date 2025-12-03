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

// Fast profile + calendar + recent submissions
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
  }

  recentAcSubmissionList(username: $username) {
    title
    titleSlug
    timestamp
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
    // 1️⃣ FAST GRAPHQL CALL
    const graphQLRes = await timedRequest(
      () =>
        axios.post(GRAPHQL, {
          query: PROFILE_COMBINED_QUERY,
          variables: { username }
        }),
      "POST",
      `${GRAPHQL} (profile+calendar+recent)`
    );

    const data = graphQLRes.data?.data;
    const user = data?.matchedUser;

    if (!user) {
      return { error: "LeetCode user not found", username };
    }

    // Avatar
    const avatar = user.profile?.userAvatar || null;

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

    // Recent submissions
    const recent = data?.recentAcSubmissionList || [];
    const recentProblemsByDay = {};
    const recentSlugs = [];

    for (const sub of recent) {
      const date = new Date(sub.timestamp * 1000)
        .toISOString()
        .split("T")[0];

      if (!recentProblemsByDay[date]) recentProblemsByDay[date] = [];
      recentProblemsByDay[date].push(sub.title);

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

    // additional info
    const additionalInfo = {
      realName: user.profile?.realName || null,
      ranking: user.profile?.ranking || null,
      about: user.profile?.aboutMe || null,
      reputation: user.profile?.reputation || null
    };

    // FINAL RESPONSE
    return {
      username,
      avatar,
      problemsSolved,
      dailyProblemsSolved,
      recentProblemsByDay,
      topicWiseStats,
      additionalInfo
    };
  } catch (err) {
    return {
      error: "Internal server error",
      detail: err.response?.data || err.message
    };
  }
}

module.exports = { fetchLeetCodeData };