import GeoPipe from './geo-pipe.js';
// import TestPipe from './test-pipe.js';
import NormaliseEventPipe from './normalise-event-pipe.js';
import NormaliseScheduledSessionPipe from './normalise-scheduledsession-pipe.js';

export default [
  // Comment this out to see some test normalised events in the systew
  // TestPipe
  // NormaliseEventPipe,
  NormaliseScheduledSessionPipe,
  // GeoPipe
];
