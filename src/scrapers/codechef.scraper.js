const axios = require("axios");
const cheerio = require("cheerio");

/**
 * 🛠️ Ultimate CodeChef Scraper
 * * Fixes:
 * 1. Avatar: Fetches high-res profile image.
 * 2. Additional Info: Captures Badges, Institution, User Type.
 * 3. TopicStats: Uses an expanded keyword dictionary to infer topics from problem titles.
 * 4. Heatmap: correctly parses the /recent/user API.
 */
async function fetchCodeChefData(username) {
  if (!username) return { error: "Username is required" };
  username = username.trim();

  // 1. Setup Headers (Mimic Browser to avoid 403)
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest"
  };

  const profileUrl = `https://www.codechef.com/users/${username}`;
  const recentApiUrl = `https://www.codechef.com/recent/user?user_handle=${username}&page=1`;

  const output = {
    success: false,
    username,
    name: null,
    avatar: "https://cdn.codechef.com/sites/all/themes/abessive/images/user_default_thumb.jpg", // Default fallback
    location: { state: null, country: null, city: null, raw: null },
    rating: {},
    problemsSolved: { all: 0, easy: 0, medium: 0, hard: 0 },
    dailyProblemsSolved: {},
    recentProblemsByDay: {},
    topicWiseStats: {}, 
    additionalInfo: {
        badges: [],
        institution: null,
        userType: null
    }
  };

  try {
    // --- STEP 1: Parallel Requests for Speed ---
    const [profileRes, recentRes] = await Promise.allSettled([
        axios.get(profileUrl, { headers }),
        axios.get(recentApiUrl, { headers })
    ]);

    // --- STEP 2: Process Main Profile (HTML) ---
    if (profileRes.status === "fulfilled") {
        const $ = cheerio.load(profileRes.value.data);

        // 1. Basic Info
        output.name = $("header h1.h2-style").text().trim() || $(".user-details-container h1").text().trim();
        
        // 2. Avatar (Fix)
        // CodeChef avatars are inside .user-details-container or header
        let avatarSrc = $(".user-details-container img").attr("src") || $(".user-profile-image img").attr("src");
        if (avatarSrc) {
            // Handle relative URLs
            if (avatarSrc.startsWith("/")) {
                avatarSrc = `https://www.codechef.com${avatarSrc}`;
            }
            output.avatar = avatarSrc;
        }

        // 3. Ratings & Ranks
        const ratingVal = $(".rating-number").first().text().trim();
        output.rating.current = ratingVal ? parseInt(ratingVal, 10) : 0;
        output.rating.stars = $(".rating-star").length;
        output.rating.globalRank = parseInt($(".rating-ranks ul li:first-child a strong").text().trim() || "0", 10);
        output.rating.countryRank = parseInt($(".rating-ranks ul li:last-child a strong").text().trim() || "0", 10);
        
        const highestMatch = $(".rating-header small").text().match(/\d+/);
        output.rating.highest = highestMatch ? parseInt(highestMatch[0], 10) : output.rating.current;

        // 4. Problems Solved (Buckets)
        $(".rating-data-section.problems-solved h5").each((i, el) => {
            const text = $(el).text();
            const match = text.match(/\((\d+)\)$/);
            if (match) {
                const count = parseInt(match[1], 10);
                if (text.toLowerCase().includes("easy")) output.problemsSolved.easy += count;
                else if (text.toLowerCase().includes("medium")) output.problemsSolved.medium += count;
                else if (text.toLowerCase().includes("hard")) output.problemsSolved.hard += count;
            }
        });
        output.problemsSolved.all = output.problemsSolved.easy + output.problemsSolved.medium + output.problemsSolved.hard;

        // 5. Additional Info (Badges, Institution)
        // Badges often in .widget-badge or custom layout
        $(".badge-info, .badge-title").each((i, el) => {
            const badge = $(el).text().trim();
            if (badge) output.additionalInfo.badges.push(badge);
        });

        // Institution/Organization
        const institution = $("li:contains('Institution:') span").text().trim();
        if (institution) output.additionalInfo.institution = institution;

        // Student/Professional
        const userType = $("li:contains('Student/Professional:') span").text().trim();
        if (userType) output.additionalInfo.userType = userType;

        // 6. Location & State Extraction
        let rawLocation = "";
        const mapParent = $(".fa-map-marker").parent();
        if (mapParent.length) rawLocation = mapParent.text().trim();
        else rawLocation = $(".user-country-name").text().trim();

        output.location.raw = rawLocation.replace(/City:|State:|Country:/gi, "").trim();

        // Parse State
        if (output.location.raw) {
            const parts = output.location.raw.split(",").map(s => s.trim());
            if (parts.length >= 3) {
                output.location.city = parts[0];
                output.location.state = parts[1];
                output.location.country = parts[parts.length - 1];
            } else if (parts.length === 2) {
                output.location.city = parts[0];
                output.location.country = parts[1];
            } else {
                output.location.country = parts[0];
            }
        }
    }

    // --- STEP 3: Process Recent Activity (API) ---
    // This fills: topicWiseStats, dailyProblemsSolved, recentProblemsByDay
    if (recentRes.status === "fulfilled" && recentRes.value.data) {
        const content = recentRes.value.data.content; // HTML Table string
        const $$ = cheerio.load(content || "");

        // Expanded Keyword Dictionary for Topic Inference
        const topicKeywords = {
            "array": "Arrays", "vector": "Arrays", "matrix": "Arrays",
            "string": "Strings", "substring": "Strings", "palindrome": "Strings", "char": "Strings",
            "sort": "Sorting", "swap": "Sorting",
            "search": "Searching", "binary": "Binary Search",
            "tree": "Trees", "root": "Trees", "leaf": "Trees",
            "graph": "Graphs", "node": "Graphs", "edge": "Graphs", "path": "Graphs", "cycle": "Graphs",
            "dp": "Dynamic Programming", "dynamic": "Dynamic Programming", "knapsack": "Dynamic Programming",
            "math": "Math", "number": "Math", "prime": "Number Theory", "gcd": "Number Theory", "divis": "Number Theory",
            "bit": "Bit Manipulation", "xor": "Bit Manipulation", "and": "Bit Manipulation",
            "game": "Game Theory", "turn": "Game Theory", "win": "Game Theory",
            "chef": "Ad-Hoc", "query": "Data Structures", "stack": "Data Structures", "queue": "Data Structures"
        };

        $$("tr").each((i, row) => {
            const tds = $$(row).find("td");
            if (tds.length < 3) return;

            // Check if solved (green tick image or score 100)
            const statusHtml = $$(tds[2]).html() || "";
            const isSolved = statusHtml.includes("tick-icon") || statusHtml.includes("100") || statusHtml.includes("AC");

            if (isSolved) {
                // 1. Extract Details
                const problemName = $$(tds[1]).text().trim(); // Name
                const problemLink = $$(tds[1]).find("a").attr("href"); // Link
                const dateStr = $$(tds[0]).find(".tooltiptext").text().trim(); // Timestamp

                // 2. Parse Date
                // Format usually: "12:30 PM 25/11/23"
                // We create a Date object
                const dateObj = new Date(dateStr);
                let dateKey = null;
                if (!isNaN(dateObj)) {
                    dateKey = dateObj.toISOString().split("T")[0];
                }

                if (dateKey) {
                    // Heatmap Data
                    output.dailyProblemsSolved[dateKey] = (output.dailyProblemsSolved[dateKey] || 0) + 1;

                    // Recent Problems List
                    if (!output.recentProblemsByDay[dateKey]) {
                        output.recentProblemsByDay[dateKey] = [];
                    }
                    output.recentProblemsByDay[dateKey].push({
                        name: problemName,
                        link: problemLink ? `https://www.codechef.com${problemLink}` : null
                    });
                }

                // 3. Topic Inference
                const lowerTitle = problemName.toLowerCase();
                let matched = false;
                for (const [key, topic] of Object.entries(topicKeywords)) {
                    if (lowerTitle.includes(key)) {
                        output.topicWiseStats[topic] = (output.topicWiseStats[topic] || 0) + 1;
                        matched = true;
                    }
                }
                // Fallback for generic problems
                if (!matched) {
                    output.topicWiseStats["Implementation"] = (output.topicWiseStats["Implementation"] || 0) + 1;
                }
            }
        });
    }

    output.success = true;
    return output;

  } catch (err) {
    return {
      success: false,
      error: "Failed to fetch CodeChef data",
      details: err.message
    };
  }
}

// --- Test Block ---
if (require.main === module) {
    (async () => {
        console.log("Fetching full profile...");
        // 'tourist' often has complex problems, try 'akash_pro' or 'suman_18' for better standard tag matches
        const data = await fetchCodeChefData("tourist"); 
        console.log(JSON.stringify(data, null, 2));
    })();
}

module.exports = { fetchCodeChefData };