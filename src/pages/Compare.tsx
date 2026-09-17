/**
 * `/compare` — a whole set at once: a table, and a parallel-coordinates plot
 * over it.
 *
 * The page is built around one number: a molecule costs between 210 and 380 ms
 * to predict. So nothing here waits for the set. A row appears the moment its
 * structure is read, with its numbers still empty; the pool answers on as many
 * workers as the machine has; the rows on screen are answered first; and the
 * run can be stopped. The plot draws a line only through the axes a molecule
 * already has a value on, so a set filling in is a picture getting denser
 * rather than a blank panel and a spinner.
 *
 * One mask decides what is kept — the brushes, and the repeated-structure
 * switch — and the plot, the table, the stated count and the download all read
 * it. Two definitions of "kept" is how a figure and the list under it come to
 * disagree.
 *
 * The page itself is layout. What the set is and where it came from is
 * `useCompareSet`; what is drawn from it is `useCompareView`.
 */

import { Card, Checkbox, H5 } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { PagePart } from 'react-cheminfo/ui';

import {
  CompareEmpty,
  CompareFocus,
  CompareInputs,
  ComparePlot,
  CompareStatus,
  CompareTable,
  useCompareSet,
  useCompareView,
} from '../components/compare/index.ts';
import {
  failReading,
  setColorBy,
  setColorScale,
  setPlotAxes,
  setShowDuplicates,
  state,
} from '../state/index.ts';

/**
 * The comparison page.
 * @returns The two inputs, the plot, the table, and the focused molecule.
 */
export function Compare(): ReactElement {
  useSignals();
  const set = useCompareSet();
  const view = useCompareView(set);
  const { rows, remove } = set;
  const { prediction, axes, axisKeys, colorKey, colorValues, scale } = view;
  const { ranges, setRange, clearRanges, included, kept, brushed } = view;
  const { hovered, setHovered, selected, select, indices, showMore } = view;
  const showDuplicates = state.preferences.showDuplicates.value;

  return (
    <div className="stack">
      <CompareInputs set={set} />
      <CompareStatus
        set={set}
        progress={prediction.progress}
        error={prediction.error}
        onCancel={prediction.cancel}
      />

      <div className="compare-body">
        <section className="pane">
          <PagePart part="plot">
            <Card className="panel">
              <H5>Parallel coordinates</H5>
              <ComparePlot
                rows={rows}
                results={prediction.results}
                axes={axes}
                axisKeys={axisKeys}
                onAxisKeys={setPlotAxes}
                colorKey={colorKey}
                onColorKey={setColorBy}
                colorValues={colorValues}
                scale={scale}
                scaleId={state.preferences.colorScaleId.value}
                onScaleId={setColorScale}
                ranges={ranges}
                onRangeChange={setRange}
                onClearRanges={clearRanges}
                included={included}
                kept={kept}
                brushed={brushed}
                hovered={hovered}
                onHover={setHovered}
                selected={selected}
                onRowClick={select}
              />
            </Card>
          </PagePart>

          <PagePart part="table">
            <Card className="panel">
              <div className="compare-table-head">
                <H5>The set</H5>
                <Checkbox
                  checked={showDuplicates}
                  label="Show repeated structures"
                  onChange={(event) => {
                    setShowDuplicates(event.currentTarget.checked);
                  }}
                />
              </div>
              <CompareTable
                rows={rows}
                indices={indices}
                kept={kept}
                results={prediction.results}
                failures={prediction.failures}
                selected={selected}
                hovered={hovered}
                onSelect={select}
                onHover={setHovered}
                onRemove={remove}
                onShowMore={showMore}
                empty={<CompareEmpty />}
              />
            </Card>
          </PagePart>
        </section>

        <CompareFocus
          view={view}
          sourceName={state.data.source.name.value}
          empty={rows.length === 0}
          onError={failReading}
        />
      </div>
    </div>
  );
}
