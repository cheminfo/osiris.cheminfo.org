/**
 * What the drop zone and the file picker accept.
 *
 * Its own module, with nothing imported into it: a page needs this list to
 * render its drop zone, and reaching it through the reader would put
 * OpenChemLib in the chunk that draws the page — 1.2 MB before a visitor has
 * opened a file.
 */

/** The file types the drop zone and the file picker accept. */
export const ACCEPTED_FILES: Readonly<Record<string, readonly string[]>> = {
  'chemical/x-mdl-sdfile': ['.sdf', '.sd'],
  'chemical/x-mdl-molfile': ['.mol'],
  'chemical/x-daylight-smiles': ['.smi', '.smiles'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
};
