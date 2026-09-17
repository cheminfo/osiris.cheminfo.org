/**
 * The ten predicted numbers, one row each: a name, a bar and a value.
 *
 * The order is the legacy panel's — cLogP, solubility, molweight, TPSA,
 * drug-likeness, the two hydrogen-bond counts, stereocentres, rotatable bonds,
 * drug score — and it is `PROPERTY_KEYS`, which the comparison table's columns
 * and the plot's default axes also read. A reader who learned the panel reads
 * the table without relearning it.
 *
 * A value the predictor could not answer prints the missing marker and draws no
 * bar. It is never zero: `DrugScoreCalculator` consumes every sentinel and
 * hands back a plausible number, so a bar drawn from one would be a wrong
 * answer with nothing saying it is wrong.
 */

import type { ReactElement } from 'react';
import { MISSING_VALUE, formatDecimal } from 'react-cheminfo/core';

import type { OsirisProperties, PropertyKey } from '../../osiris/index.ts';
import {
  PROPERTY_KEYS,
  propertyScale,
  propertyValue,
} from '../../osiris/index.ts';

import { PropertyBar } from './PropertyBar.tsx';
import { barGeometry } from './barGeometry.ts';

/** What {@link PropertyRows} needs. */
export interface PropertyRowsProps {
  /**
   * What was predicted, or `null` while the molecule is still being worked on —
   * in which case every row stands with its name and no value, so nothing moves
   * when the answer arrives.
   * @default null
   */
  properties?: OsirisProperties | null;
}

/**
 * The ten property rows, in the panel's order.
 * @param props - See {@link PropertyRowsProps}.
 * @returns One row per property.
 */
export function PropertyRows(props: PropertyRowsProps): ReactElement {
  const { properties = null } = props;

  return (
    <div className="property-rows">
      {PROPERTY_KEYS.map((key) => (
        <PropertyRow
          key={key}
          propertyKey={key}
          value={properties === null ? null : propertyValue(properties, key)}
        />
      ))}
    </div>
  );
}

interface PropertyRowProps {
  propertyKey: PropertyKey;
  value: number | null;
}

function PropertyRow(props: PropertyRowProps): ReactElement {
  const { propertyKey, value } = props;
  const scale = propertyScale(propertyKey);
  const geometry = barGeometry(propertyKey, value);

  return (
    <div className="property-row">
      <span className="property-row__label">
        {scale.label}
        {scale.unit === '' ? null : (
          <span className="property-row__unit">{scale.unit}</span>
        )}
      </span>
      <span className="property-row__bar">
        {geometry === null ? null : <PropertyBar geometry={geometry} />}
      </span>
      <span className="property-row__value">
        {value === null ? MISSING_VALUE : formatDecimal(value, scale.decimals)}
      </span>
    </div>
  );
}
