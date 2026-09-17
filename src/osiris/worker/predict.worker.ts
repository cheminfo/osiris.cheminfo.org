/**
 * The prediction worker.
 *
 * A module worker, so `import('openchemlib')` inside it is a lazy chunk rather
 * than a megabyte on the page's critical path. It holds no state of its own
 * beyond the registered resource tables and the two predictors, which
 * {@link loadPredictors} keeps and proves once per worker.
 */

import { serveWorkerRequests } from 'react-cheminfo/core';

import { isPredictRequest } from './protocol.ts';
import { runPredictionJob } from './runPredictionJob.ts';

serveWorkerRequests(runPredictionJob, { accepts: isPredictRequest });
