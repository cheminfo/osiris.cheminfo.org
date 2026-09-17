/**
 * The header button that turns what is on screen into a link or an iframe.
 *
 * The address is kept in step with the state by the shell's route sync, so the
 * shared dialog reads the page, its molecule and its configuration straight off
 * the location.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  ShareButton as FamilyShareButton,
  ShareDialog,
} from 'react-cheminfo/ui';

import { TAB_LABELS, state } from '../state/index.ts';

import { shareVocabularyOf } from './vocabulary.ts';

/** Enough for the editor, the property panel and a plot under them. */
const FRAME_HEIGHT = 680;

/**
 * Open the share dialog.
 * @returns The button, and the dialog while it is open.
 */
export function ShareButton(): ReactElement {
  useSignals();
  const [isOpen, setIsOpen] = useState(false);
  const tab = state.view.activeTab.value;
  const title = TAB_LABELS[tab];

  return (
    <>
      <FamilyShareButton
        onClick={() => {
          setIsOpen(true);
        }}
      />
      <ShareDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        vocabulary={shareVocabularyOf(tab)}
        title={title}
        frameTitle={`osiris.cheminfo.org — ${title}`}
        frameHeight={FRAME_HEIGHT}
      />
    </>
  );
}
