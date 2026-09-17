/** The About page: the family's own, drawn from this site's record. */

import type { ReactElement } from 'react';
import { AboutPage } from 'react-cheminfo/ui';

import { ABOUT } from '../about.ts';

/**
 * The About page.
 * @returns The shared About page, filled with this site's record.
 */
export function About(): ReactElement {
  return <AboutPage content={ABOUT} />;
}
