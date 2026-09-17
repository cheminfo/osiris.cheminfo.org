/**
 * The set, taken away: a table for a spreadsheet, an SD file for everything
 * else.
 *
 * What is written is what is on screen — the rows the brushes kept, in the
 * order the table shows them — so a reader who filtered the set down to six
 * molecules gets six, and the button says so before they click it.
 *
 * OpenChemLib is loaded only when an SD file is actually asked for: the
 * molecules are rebuilt from their idCodes to be drawn into molfiles, and a
 * reader who only wants the numbers should not pay for that.
 */

import { Button, H5 } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import {
  downloadText,
  errorMessage,
  formatInteger,
  pluralize,
} from 'react-cheminfo/core';

import type { OsirisProperties } from '../../osiris/index.ts';
import type { MoleculeRow } from '../../state/index.ts';

import { downloadName, toSdf, toTsv } from './compareDownload.ts';

/** The media types the two files are handed to the browser as. */
const TSV_TYPE = 'text/tab-separated-values;charset=utf-8';
const SDF_TYPE = 'chemical/x-mdl-sdfile;charset=utf-8';

/** What {@link CompareDownload} needs. */
export interface CompareDownloadProps {
  /** The rows to write, in the order the table shows them. */
  rows: readonly MoleculeRow[];
  /** What has been predicted, by row key. */
  results: ReadonlyMap<string, OsirisProperties>;
  /** What the set was read from, which names the file. */
  sourceName: string;
  /** Called with what went wrong, when writing a file fails. */
  onError: (message: string) => void;
}

/**
 * The two download buttons, and the count they will write.
 * @param props - See {@link CompareDownloadProps}.
 * @returns The panel.
 */
export function CompareDownload(props: CompareDownloadProps): ReactElement {
  const { rows, results, sourceName, onError } = props;
  const count = formatInteger(rows.length);

  return (
    <div className="compare-download">
      <H5>
        Download {count} {pluralize(rows.length, 'molecule')}
      </H5>
      <div className="compare-download__buttons">
        <Button
          icon="th"
          text="TSV"
          disabled={rows.length === 0}
          onClick={() => {
            downloadText(
              toTsv(rows, results),
              downloadName(sourceName, 'tsv'),
              TSV_TYPE,
            );
          }}
        />
        <Button
          icon="document"
          text="SDF"
          disabled={rows.length === 0}
          onClick={() => {
            void writeSdf(rows, results, sourceName).catch((error: unknown) => {
              onError(errorMessage(error));
            });
          }}
        />
      </div>
      <p className="panel-note">
        Both hold every predicted number and the four risks. A number that was
        not predicted is left empty, never written as a zero.
      </p>
    </div>
  );
}

async function writeSdf(
  rows: readonly MoleculeRow[],
  results: ReadonlyMap<string, OsirisProperties>,
  sourceName: string,
): Promise<void> {
  const { moleculeFromIdCode } = await import('../../input/index.ts');
  const text = toSdf(rows, results, (row) => {
    try {
      const molecule = moleculeFromIdCode(
        row.coordinates === ''
          ? row.idCode
          : `${row.idCode} ${row.coordinates}`,
      );
      if (row.coordinates === '') molecule.inventCoordinates();
      molecule.setName(row.label);
      return molecule.toMolfile();
    } catch {
      // A structure that will not rebuild is left out rather than taking the
      // whole file down with it.
      return null;
    }
  });
  downloadText(text, downloadName(sourceName, 'sdf'), SDF_TYPE);
}
