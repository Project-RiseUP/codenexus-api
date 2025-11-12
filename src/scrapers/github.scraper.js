const axios = require("axios");
require("dotenv").config();

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// ------------------ GraphQL Query ------------------
const generateGraphQLQuery = (username) => `
query {
  user(login: "${username}") {
    name
    login
    avatarUrl
    bio
    location
    company
    email
    websiteUrl
    followers { totalCount }
    following { totalCount }
    repositories(
      first: 50,
      ownerAffiliations: OWNER,
      isFork: false,
      orderBy: {field: PUSHED_AT, direction: DESC}
    ) {
      totalCount
      nodes {
        name
        description
        stargazerCount
        forkCount
        url
        primaryLanguage { name }
        languages(first: 5) { nodes { name } }
        pushedAt
        createdAt
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoryContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
    # New Achievements API
    achievements {
      nodes {
        title
        description
      }
    }
  }
}`;

// ------------------ Badges Generator ------------------
function getBadges(user, repos, stars) {
  const badges = [];

  if (stars >= 100) badges.push({ title: "100+ Stars", type: "stars" });
  if (user.followers.totalCount >= 100)
    badges.push({ title: "100+ Followers", type: "social" });
  if (repos >= 50) badges.push({ title: "50+ Repositories", type: "repo" });
  if (user.contributionsCollection.contributionCalendar.totalContributions >= 365)
    badges.push({ title: "365+ Contributions in a Year", type: "activity" });

  return badges;
}

// ------------------ Main Function ------------------
async function fetchGitHubData(username) {
  if (!username) return { error: "GitHub username is required" };

  try {
    const graphQLResponse = await axios.post(
      GITHUB_GRAPHQL_API,
      { query: generateGraphQLQuery(username) },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const user = graphQLResponse.data?.data?.user;
    if (!user) return { error: "GitHub user not found" };

    // -------- Language Stats --------
    const langStats = {};
    user.repositories.nodes.forEach((repo) => {
      repo.languages.nodes.forEach((lang) => {
        langStats[lang.name] = (langStats[lang.name] || 0) + 1;
      });
    });

    // -------- Contributions by Day --------
    const contributionsByDay = {};
    user.contributionsCollection.contributionCalendar.weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        if (day.contributionCount > 0) {
          contributionsByDay[day.date] = day.contributionCount;
        }
      });
    });

    // -------- Repo Activity --------
    const repoActivityByDate = {};
    user.repositories.nodes.forEach((repo) => {
      const date = repo.pushedAt.split("T")[0];
      if (!repoActivityByDate[date]) repoActivityByDate[date] = [];
      repoActivityByDate[date].push(repo.name);
    });

    // -------- Stats Summary --------
    const totalRepos = user.repositories.totalCount;
    const totalStars = user.repositories.nodes.reduce(
      (sum, repo) => sum + repo.stargazerCount,
      0
    );

    // -------- Achievements --------
    const achievements = (user.achievements?.nodes || []).map((a) => ({
      title: a.title,
      description: a.description,
    }));

    // -------- Final Schema --------
    return {
      platform: "github",
      username: user.login,
      profile: {
        name: user.name,
        avatar: user.avatarUrl,
        bio: user.bio,
        location: user.location,
        company: user.company,
        email: user.email,
        website: user.websiteUrl,
        followers: user.followers.totalCount,
        following: user.following.totalCount,
      },
      stats: {
        repositories: totalRepos,
        stars: totalStars,
        contributions: {
          total: user.contributionsCollection.contributionCalendar.totalContributions,
          commits: user.contributionsCollection.totalCommitContributions,
          pullRequests: user.contributionsCollection.totalPullRequestContributions,
          issues: user.contributionsCollection.totalIssueContributions,
          repoContributions: user.contributionsCollection.totalRepositoryContributions,
        },
        activity: {
          contributionsByDay,
          repoActivityByDate,
        },
        languages: langStats,
      },
      badges: getBadges(user, totalRepos, totalStars),
      achievements,
      repositories: user.repositories.nodes.map((repo) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        url: repo.url,
        primaryLanguage: repo.primaryLanguage?.name || null,
        createdAt: repo.createdAt,
        pushedAt: repo.pushedAt,
      })),
    };
  } catch (err) {
    return { error: "Internal server error", detail: err.message };
  }
}

module.exports = { fetchGitHubData };