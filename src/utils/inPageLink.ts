/**
 * Whether a click on a link is ours to answer, or the browser's.
 *
 * Every address this site writes is a real one, so a link that loads something
 * into the open page is still an `href` a reader can middle-click, ⌘-click or
 * copy. What decides between the two is the click, not the link: a plain left
 * click is the page's to handle, and anything else — a new tab, a window, a
 * download, a click a handler has already answered — is left alone.
 */

import type { MouseEvent } from 'react';
import { isModifiedClick } from 'react-cheminfo/ui';

/**
 * Whether a click asked for something other than following the link in place.
 * @param event - The click on the link.
 * @returns True when the browser is to be left to it.
 */
export function opensElsewhere(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.defaultPrevented || event.button !== 0 || isModifiedClick(event);
}
