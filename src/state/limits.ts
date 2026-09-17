/**
 * How much the tool promises to serve, written once.
 *
 * A prediction costs 210 to 380 ms of one thread per molecule, and a shared
 * link is untrusted input, so both the reader and the share codec need the same
 * numbers: a set that grows past them is truncated with a message rather than
 * freezing the tab, and a link that would not fit says what it left out.
 */

/**
 * The most molecules the tool will hold at once. Past it the reader stops and
 * says so; it never starts a run it cannot finish.
 */
export const MAX_MOLECULES = 2000;

/**
 * Where the reader warns before predicting: above this, the run is worth a
 * sentence saying roughly how long it will take and offering to cancel.
 */
export const WARN_MOLECULE_COUNT = 200;

/**
 * The most structures a shared link carries. Measured over 500 real
 * structures, 8000 encoded characters hold about 157 SMILES; past this the
 * link carries what fits and the page says the rest was not shareable.
 */
export const SHARED_SMILES_LIMIT = 150;

/** The longest query string the tool writes, in characters. */
export const SHARED_QUERY_LENGTH = 8000;

/** The longest single structure an address may name, in characters. */
export const MAX_STRUCTURE_LENGTH = 512;

/** The longest label a molecule may carry on screen, in characters. */
export const MAX_LABEL_LENGTH = 120;
