#!/usr/bin/env node
import PipeLine from '../lib/pipeline.js';
import OpenActiveRpde from '../lib/oa-rpde.js';
import ActivityStore from '../lib/activity-store.js';
import RawData from '../lib/raw-data.js';
import Settings from '../lib/settings.js';

import fetch from 'node-fetch';
import Utils from '../lib/utils.js';

async function main() {
  const activityStore = new ActivityStore();
  const activityStoreOK = await activityStore.setupIndex();

  if (activityStoreOK !== true){
    log("failed to setup elastic index");
    process.exit(1);
  }


  let start = 0;
  const count = 100;

  while(true) {


    log(`Listing raw data ${start}`);
    const results = await activityStore.get(start, count);

    for (const x in results['body']['hits']['hits']) {
      const data = results['body']['hits']['hits'][x];

      if (!data['_source']['deleted']) {

        const rawData = new RawData(data)
        const pipeLine = new PipeLine(rawData, async (normalisedEventList) => {

          for (let idx in normalisedEventList) {
            await activityStore.updateNormalised(normalisedEventList[idx])
          }

        });

        pipeLine.run();

      }

    }

    if (results['body']['hits']['total']['value'] == 0) {
      break;
    }

    start += count;

  }

}

function log(msg) {
  Utils.log(msg, "harvester-main");
}

/* Check if we're being called as a script rather than module */
if (process.argv[1].indexOf("harvester-stage2.js") > 0){
  main();
}
