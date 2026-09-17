/**
 * `/` — one molecule: draw it, read its risks and its properties.
 *
 * The canvas is on the left and what OSIRIS makes of it on the right, which is
 * the layout the original had and the one a chemist already knows. The panel on
 * the right is `<PropertyPanel>`, the same component the comparison page shows
 * for the row it focuses.
 *
 * The address is the molecule: `?smiles=` names one a reader can recognise,
 * `?idcode=` names the exact structure and wins over it. Both arrive as state —
 * the shell owns that plumbing — and what the page does with them is
 * {@link explorerRequest}: predict this structure, or read that SMILES into one
 * first. The editor is mounted only once there is an idCode, so its input
 * format never changes under it; react-ocl re-reads its frozen value whenever
 * the format does, which would hand `Molecule.fromIDCode` a SMILES.
 *
 * Nothing heavy is in the chunk that draws this page. The canvas and every
 * depiction sit behind `React.lazy` inside `react-cheminfo/structure`, the
 * predictions run in a pool of module workers, and the reader that turns a
 * linked SMILES into a structure is imported when a link actually carries one.
 */

import { Button, Callout, Card, H5, Spinner } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import type { StructureEditorChange } from 'react-cheminfo/structure';
import { StructureEditor } from 'react-cheminfo/structure';
import { PagePart } from 'react-cheminfo/ui';

import type { ExplorerRequest } from '../components/explorer/index.ts';
import {
  ExampleStructures,
  MethodLeadIn,
  asRiskType,
  explorerRequest,
  structureValue,
  useExplorerMolecule,
} from '../components/explorer/index.ts';
import { PropertyPanel } from '../components/properties/index.ts';
import type { RiskType } from '../osiris/index.ts';
import {
  openRiskDetail,
  setActiveTab,
  setCompareSmiles,
  setDrawnStructure,
  state,
} from '../state/index.ts';

/**
 * The explorer page.
 * @returns The editor beside the risk and property panels.
 */
export function Explorer(): ReactElement {
  useSignals();
  const { explorer } = state.view;
  const editorValue = explorer.idCode.value;
  const linkedSmiles = explorer.smiles.value;
  const revision = explorer.revision.value;
  const openRisk = asRiskType(explorer.openRisk.value);
  const embedded = state.view.embedded.value;

  const request = useMemo(
    () => explorerRequest(editorValue, linkedSmiles),
    [editorValue, linkedSmiles],
  );
  const molecule = useExplorerMolecule(request, linkedSmiles);

  return (
    <div className="pane-grid">
      <section className="pane">
        <PagePart part="editor">
          <EditorPane request={request} revision={revision} />
        </PagePart>
        {embedded ? null : <MethodLeadIn />}
      </section>

      <section className="pane">
        {molecule.error === null ? null : (
          <Callout intent="danger">{molecule.error}</Callout>
        )}
        <Card className="panel">
          <PropertyPanel
            properties={molecule.properties}
            coordinates={molecule.coordinates}
            pending={molecule.pending}
            problem={molecule.problem}
            emptyMessage="Draw a molecule, or open one from a link."
            openRisk={openRisk}
            onOpenRisk={handleOpenRisk}
            loadDetail={molecule.loadDetail}
          />
        </Card>
        {embedded ? null : <CompareButton smiles={molecule.smiles} />}
      </section>
    </div>
  );
}

/**
 * Open one risk's explanation, or close the one that is open.
 * @param risk - The risk to explain, or `null` to close what is open.
 */
function handleOpenRisk(risk: RiskType | null): void {
  openRiskDetail(risk);
}

/**
 * The canvas, and what stands in its place while a linked SMILES is still being
 * read.
 *
 * The editor is mounted only once there is an idCode to mount it with, so its
 * input format is `idcode` for its whole life. react-ocl re-reads the value it
 * was mounted with whenever the format changes, and that value is frozen, so a
 * format that moved from `smiles` to `idcode` would hand a SMILES to
 * `Molecule.fromIDCode`.
 */
function EditorPane(props: {
  request: ExplorerRequest;
  revision: number;
}): ReactElement {
  const { request, revision } = props;
  const handleChange = useCallback((change: StructureEditorChange) => {
    setDrawnStructure({ idCode: change.idCode, smiles: change.smiles });
  }, []);

  return (
    <Card className="panel">
      <H5>Structure</H5>
      {request.kind === 'resolve' ? (
        <div className="explorer-loading">
          <Spinner size={20} /> Reading the structure…
        </div>
      ) : (
        <StructureEditor
          className="explorer-editor"
          value={
            request.kind === 'ready' ? structureValue(request.structure) : ''
          }
          revision={revision}
          minHeight={340}
          onChange={handleChange}
        />
      )}
      <ExampleStructures />
    </Card>
  );
}

/** Take the molecule on the canvas to the comparison page. */
function CompareButton(props: { smiles: string }): ReactElement {
  const { smiles } = props;
  return (
    <div className="explorer-actions">
      <Button
        icon="comparison"
        text="Compare with others"
        disabled={smiles === ''}
        onClick={() => {
          setCompareSmiles(smiles);
          setActiveTab('compare');
        }}
      />
    </div>
  );
}
