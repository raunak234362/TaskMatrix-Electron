/**
 * Truncates an HTML content by stripping HTML tags and limited by word count.
 * @param {string} html - Raw HTML or text to truncate
 * @param {number} limit - Word limit
 * @returns {string} Truncated text
 */
export const truncateWords = (html, limit = 25) => {
    if (!html) return "";
    const text = html.replace(/<[^>]*>/g, " ").trim();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(" ") + "...";
};
