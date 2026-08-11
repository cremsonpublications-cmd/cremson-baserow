/**
 * Smart URL navigation helper that handles full website URLs (internal & external) as well as relative paths.
 * @param {string} url - Target URL or path
 * @param {object} router - Next.js router instance
 * @param {boolean} openExternalInNewTab - Whether external domain links should open in a new tab (default: true)
 */
export function navigateToUrl(url, router, openExternalInNewTab = true) {
  if (!url) return;
  const trimmed = url.trim();
  if (!trimmed) return;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsedUrl = new URL(trimmed);
      if (typeof window !== "undefined" && parsedUrl.origin === window.location.origin) {
        // Same domain full URL -> navigate internally with Next.js router
        router.push(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash);
      } else if (openExternalInNewTab) {
        window.open(trimmed, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = trimmed;
      }
      return;
    } catch (e) {
      window.location.href = trimmed;
      return;
    }
  }

  // Handle relative paths
  router.push(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}
