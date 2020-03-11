#!/usr/bin/env node
import processBothStages from '../lib/stage-both.js';
import Utils from '../lib/utils.js';

processBothStages();

// This is intended to run on Heroku.
// When a Heroku worker ends, Heroku starts a new one.
// When there is no work to be done, we don't want the worker to be constantly checking as the worker starts, ends, starts, ends, etc in a loop
// So sleep, so that when there is no work to do we at least only check every 24 hours
Utils.sleep("Heroku", 60*60*24);
