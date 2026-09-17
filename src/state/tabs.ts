/**
 * Every page the site routes to, and what each is called.
 *
 * Kept apart from the state bucket so the router can name a page without
 * pulling the signals in with it.
 */

/**
 * The pages the header lists, in its own order: one molecule first, then a
 * whole set, then the prose saying where the numbers come from.
 */
export const NAV_TAB_IDS = ['explorer', 'compare', 'method'] as const;

/**
 * Every routed page: the three of the bar, and the About.
 *
 * The About is a page like any other — a real address, indexed and printable —
 * but it is about the site rather than a place in the tool, so it sits with the
 * utilities at the right of the bar and never among {@link NAV_TAB_IDS}.
 */
export const TAB_IDS = [...NAV_TAB_IDS, 'about'] as const;

/** One of {@link TAB_IDS}. */
export type TabId = (typeof TAB_IDS)[number];

/** What the bar, the share dialog and the crawl path call each page. */
export const TAB_LABELS: Record<TabId, string> = {
  explorer: 'Explorer',
  compare: 'Compare',
  method: 'Method',
  about: 'About',
};

/**
 * The page shown when the address is empty or unknown: the explorer, which is
 * what a course links to and what `/` renders.
 */
export const DEFAULT_TAB: TabId = 'explorer';

/**
 * Narrow an arbitrary string — a path segment — to a page.
 * @param value - Candidate page name.
 * @returns True when it is one of {@link TAB_IDS}.
 */
export function isTabId(value: string): value is TabId {
  for (const tab of TAB_IDS) {
    if (tab === value) return true;
  }
  return false;
}
