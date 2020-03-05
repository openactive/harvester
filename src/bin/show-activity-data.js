#!/usr/bin/env node
import Utils from '../lib/utils.js';
import { cache } from '../lib/utils.js';


async function main() {

  await Utils.loadActivitiesJSONIntoCache();

  console.log(JSON.stringify(cache.activities, null, 4));

}

main();

