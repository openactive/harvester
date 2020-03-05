import GeoPipe from './geo-pipe.js';
// import TestPipe from './test-pipe.js';
import NormaliseEventPipe from './normalise-event-pipe.js';

export default [
  // Comment this out to see some test normalised events in the systew
  // TestPipe
  NormaliseEventPipe,
  GeoPipe
];
