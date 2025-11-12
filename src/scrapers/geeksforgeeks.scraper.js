const axios = require("axios");
const cheerio = require("cheerio");
const { logger } = require("../utils/logger");

function getBadges(info) {
  const badges = [];

  // Coding Score milestones
  if (info.codingScore >= 1000) {
    badges.push({ title: "1000+ Coding Score", type: "milestone" });
  }
  if (info.codingScore >= 5000) {
    badges.push({ title: "5000+ Coding Score", type: "milestone" });
  }

  // Streaks
  if (parseInt(info.currentStreak) >= 30) {
    badges.push({ title: "30-Day Streak", type: "streak" });
  }
  if (parseInt(info.maxStreak) >= 100) {
    badges.push({ title: "100+ Days Streak", type: "streak" });
  }

  // Institute rank
  if (info.instituteRank && info.instituteRank <= 10) {
    badges.push({ title: "Top 10 Institute Rank", type: "rank" });
  }

  return badges;
}

async function fetchGFGData(username) {
  if (!username) {
    return { error: "GFG username is required" };
  }

  const startTime = Date.now();

  const BASE_URL = `https://auth.geeksforgeeks.org/user/${username}/practice/`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  try {
    const { data } = await axios.get(BASE_URL, { headers });
    const $ = cheerio.load(data);

    const scriptTag = $("script#__NEXT_DATA__");
    if (!scriptTag.length) {
      return { error: "Could not find user data" };
    }

    const jsonData = JSON.parse(scriptTag.html());
    const userInfo = jsonData?.props?.pageProps?.userInfo;
    const userSubmissions = jsonData?.props?.pageProps?.userSubmissionsInfo;

    if (!userInfo || !userSubmissions) {
      return { error: "Failed to parse user data" };
    }

    // Profile info
    const info = {
      userName: username,
      fullName: userInfo.name || "",
      profilePicture: userInfo.profile_image_url || "",
      institute: userInfo.institute_name || "",
      instituteRank: userInfo.institute_rank || "",
      currentStreak: userInfo.pod_solved_longest_streak || "00",
      maxStreak: userInfo.pod_solved_global_longest_streak || "00",
      codingScore: userInfo.score || 0,
      monthlyScore: userInfo.monthly_score || 0,
      totalProblemsSolved: userInfo.total_problems_solved || 0,
    };

    // Difficulty-wise solved problems
    const solvedStats = {};

    for (const [difficulty, problems] of Object.entries(userSubmissions)) {
      const questions = Object.values(problems).map((p) => ({
        id: p.pid,
        question: p.pname,
        slug: p.slug,
        questionUrl: `https://practice.geeksforgeeks.org/problems/${p.slug}`,
      }));

      solvedStats[difficulty.toLowerCase()] = {
        count: questions.length,
        questions,
      };
    }

    // Problems solved summary
    const problemsSolved = {};
    for (const [difficulty, data] of Object.entries(solvedStats)) {
      problemsSolved[difficulty] = data.count;
    }

    // Fetch contests
    const contests = await fetchContests();

    const duration = Date.now() - startTime;
    
    // Log if slow
    if (duration > 5000) {
      logger.warn(`Slow fetch: GFG took ${duration}ms for ${username}`);
    }

    const result = {
      username,
      problemsSolved,
      solvedStats,
      activity: {
        contests,
      },
      topicWiseStats: {}, // not exposed by GFG
      badges: getBadges(info),
      additionalInfo: info,
    };

    return result;
  } catch (err) {
    logger.error(`GFG: Failed to fetch for ${username}: ${err.message}`);
    return { error: "Profile Not Found or Network Error", detail: err.message };
  }
}

// Scrape contests (recent & upcoming)
async function fetchContests() {
  const CONTESTS_URL = "https://www.geeksforgeeks.org/events/";
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  try {
    const { data } = await axios.get(CONTESTS_URL, { headers });
    const $ = cheerio.load(data);

    const contests = [];
    $(".contest-card").each((_, el) => {
      const title = $(el).find(".contest-name").text().trim();
      const date = $(el).find(".contest-date").text().trim();
      const link = $(el).find("a").attr("href");

      if (title && date) {
        contests.push({ title, date, url: link });
      }
    });

    // Split into upcoming & past
    const today = new Date();
    const past = [];
    const upcoming = [];

    contests.forEach((c) => {
      if (c.date.match(/\d{4}/)) {
        const d = new Date(c.date);
        if (d < today) past.push(c);
        else upcoming.push(c);
      } else {
        upcoming.push(c);
      }
    });

    return {
      past: past.slice(-2),
      upcoming: upcoming.slice(0, 3),
    };
  } catch (err) {
    return { error: "Failed to fetch contests", detail: err.message };
  }
}

module.exports = { fetchGFGData };
