import axios from "axios";

const cleanToken = (val) => {
  if (!val) return null;
  return val.trim().replace(/^["']|["']$/g, "").trim();
};

const TOKEN_WBTIT = cleanToken(import.meta.env.VITE_GITHUB_TOKEN_WBTIT);
const TOKEN_RAUNAK = cleanToken(import.meta.env.VITE_GITHUB_TOKEN_RAUNAK);

const getTokenForOwner = (owner) => {
  if (!owner) return null;
  const lowerOwner = owner.toLowerCase();
  if (lowerOwner === "wbtit") {
    return TOKEN_WBTIT;
  }
  if (lowerOwner === "raunak234362" || lowerOwner === "raunak23462") {
    return TOKEN_RAUNAK;
  }
  return null;
};

const githubClient = axios.create({
  baseURL: "https://api.github.com",
});

// Request interceptor to dynamically inject the correct token
githubClient.interceptors.request.use((config) => {
  // Try to extract owner from URL: /repos/{owner}/{repo}/commits
  const match = config.url.match(/\/repos\/([^/]+)\//);
  const token = match ? getTokenForOwner(match[1]) : null;

  config.headers = {
    ...config.headers,
    Accept: "application/vnd.github.v3+json",
  };

  if (token) {
    config.headers.Authorization = `token ${token}`;
  }

  return config;
});

/**
 * Fetch commits for a specific repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} author - GitHub username of the author
 * @param {string} since - ISO date string for start date
 * @param {string} until - ISO date string for end date
 * @returns {Promise<Array>} List of commits
 */
export const fetchGitHubCommits = async (owner, repo, author, since, until) => {
  try {
    const params = {
      per_page: 100,
    };
    if (author) params.author = author;
    if (since) params.since = since;
    if (until) params.until = until;

    const response = await githubClient.get(`/repos/${owner}/${repo}/commits`, {
      params,
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching commits for ${owner}/${repo}:`, error);
    return [];
  }
};

/**
 * Fetch detailed stats for a single commit (lines added, deleted, files changed)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} ref - Commit SHA
 * @returns {Promise<Object|null>} Detailed commit object
 */
export const fetchCommitDetails = async (owner, repo, ref) => {
  try {
    const response = await githubClient.get(`/repos/${owner}/${repo}/commits/${ref}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching commit details for ${owner}/${repo}@${ref}:`, error);
    return null;
  }
};
