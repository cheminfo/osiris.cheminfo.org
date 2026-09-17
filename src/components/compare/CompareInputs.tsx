/**
 * The two ways a molecule gets into the set: drawn, or given as a list — which
 * is one box whether the list is pasted, dropped or opened from a file.
 *
 * Both are offered at once rather than behind a chooser. A chemist with a
 * structure in mind draws it; one with a list already written pastes it or
 * drops the file it is in, and those are the same intention, so they are the
 * same card.
 *
 * Nothing here is heavy in the page's own chunk: the canvas sits behind
 * `React.lazy` inside `react-cheminfo/structure`, and the reader behind a
 * dynamic import in {@link useCompareSet}.
 */

import { Button, Card, H5, TextArea } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { StructureEditorChange } from 'react-cheminfo/structure';
import { StructureEditor } from 'react-cheminfo/structure';
import { PagePart, useIsHidden } from 'react-cheminfo/ui';
import { DropZone, DropZoneContainer } from 'react-science/ui';

import { ACCEPTED_FILES } from '../../input/acceptedFiles.ts';

import { CompareDemoLinks } from './CompareDemoLinks.tsx';
import type { CompareSet } from './useCompareSet.ts';

/** What the file picker puts in its own `accept`, from the one list. */
const ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_FILES).flat().join(',');

/** What {@link CompareInputs} needs. */
export interface CompareInputsProps {
  /** The set to add to. */
  set: CompareSet;
}

/**
 * The editor and the list box, side by side.
 * @param props - See {@link CompareInputsProps}.
 * @returns The two input panels.
 */
export function CompareInputs(props: CompareInputsProps): ReactElement {
  const { set } = props;

  return (
    <div className="pane-grid">
      <PagePart part="editor">
        <EditorCard set={set} />
      </PagePart>
      <ListCard set={set} />
    </div>
  );
}

function EditorCard(props: CompareInputsProps): ReactElement {
  const { set } = props;
  const [drawn, setDrawn] = useState('');
  const [revision, setRevision] = useState(0);

  const handleChange = useCallback((change: StructureEditorChange) => {
    setDrawn(change.idCode);
  }, []);

  return (
    <Card className="panel">
      <H5>Draw a structure</H5>
      <StructureEditor
        className="compare-editor"
        value=""
        revision={revision}
        minHeight={260}
        onChange={handleChange}
      />
      <Button
        icon="add"
        text="Add this structure"
        disabled={drawn === ''}
        onClick={() => {
          set.addStructure(drawn);
          setDrawn('');
          // The canvas has been added to the set, so it is cleared: the next
          // structure starts from a blank sheet rather than from the last one.
          setRevision((previous) => previous + 1);
        }}
      />
    </Card>
  );
}

/**
 * One box for a list, however it arrives: typed into, dropped on, or filled
 * from the file picker under it.
 *
 * The two halves stay separate parts of the share vocabulary, so a link that
 * has always said `hide=fileInput` still means what it said — the box remains,
 * without the ways of opening a file.
 */
function ListCard(props: CompareInputsProps): ReactElement | null {
  const { set } = props;
  const isHidden = useIsHidden();
  const [text, setText] = useState('');
  const picker = useRef<HTMLInputElement>(null);

  const takeFile = useCallback(
    (file: File | undefined) => {
      if (file !== undefined) set.addFile(file);
    },
    [set],
  );

  const pasting = !isHidden('smilesInput');
  const opening = !isHidden('fileInput');
  if (!pasting && !opening) return null;

  return (
    <Card className="panel">
      <H5>
        {pasting
          ? opening
            ? 'Paste or open a list'
            : 'Paste a list'
          : 'Open a file'}
      </H5>
      {pasting ? (
        <div className="compare-list-drop">
          <DropZoneContainer
            accept={ACCEPTED_FILES}
            multiple={false}
            disabled={!opening}
            onDrop={(files) => {
              takeFile(files[0]);
            }}
          >
            <TextArea
              className="compare-paste"
              value={text}
              rows={9}
              fill
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              placeholder={
                'CCO\nc1ccccc1 benzene\nCC(=O)Oc1ccccc1C(=O)O aspirin'
              }
              onChange={(event) => {
                setText(event.target.value);
              }}
            />
          </DropZoneContainer>
        </div>
      ) : (
        <div className="compare-dropzone">
          <DropZone
            accept={ACCEPTED_FILES}
            multiple={false}
            onDrop={(files) => {
              takeFile(files[0]);
            }}
            emptyIcon="import"
            emptyTitle="Drop an SD file or a list"
            emptyDescription="Read in the page, never uploaded"
            emptyButtonText="Choose a file"
            emptyButtonIcon="folder-open"
          />
        </div>
      )}
      {pasting ? (
        <p className="panel-note">
          One structure per line, or separated by a comma, a semicolon or a
          space. A name after the structure becomes the row&apos;s label.
        </p>
      ) : null}
      {opening ? (
        <p className="panel-note">
          Drop a .sdf, .sd, .mol, .smi, .txt or .csv file here, or open one. It
          is read in the page, never uploaded, and an SD file keeps the name
          each record carries.
        </p>
      ) : null}
      {opening ? <CompareDemoLinks set={set} /> : null}
      <div className="compare-add">
        {pasting ? (
          <Button
            icon="add"
            text="Add"
            disabled={text.trim() === ''}
            onClick={() => {
              set.addText(text, 'the pasted list');
              setText('');
            }}
          />
        ) : null}
        {/* The empty drop zone carries a picker of its own, so this button is
            the one the box does not have. */}
        {opening && pasting ? (
          <>
            <Button
              icon="folder-open"
              variant="outlined"
              text="Open a file"
              onClick={() => picker.current?.click()}
            />
            <input
              ref={picker}
              hidden
              className="compare-file-input"
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={(event) => {
                takeFile(event.target.files?.[0]);
                // Cleared, so opening the same file twice is two reads rather
                // than one and then silence.
                event.target.value = '';
              }}
            />
          </>
        ) : null}
      </div>
    </Card>
  );
}
