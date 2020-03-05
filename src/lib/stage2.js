#!/usr/bin/env node
import PipeLine from './pipeline.js';
import OpenActiveRpde from './oa-rpde.js';
import ActivityStore from './activity-store.js';
import RawData from './raw-data.js';
import Settings from './settings.js';

import fetch from 'node-fetch';
import Utils from './utils.js';

async function processStage2() {
  const activityStore = new ActivityStore();
  const activityStoreOK = await activityStore.setupIndex();

  if (activityStoreOK !== true){
    log("failed to setup elastic index");
    process.exit(1);
  }


  let start = 0;
  const count = 100;
  // updatedLastSeenAtStartOfLoop & updatedLastSeen - we keep updatedLastSeenAtStartOfLoop constant and pass this to query
  // We use elastics paging to get a fresh set of results each time because that way we don't repeat data items
  // Alternative is pass updatedLastSeen to activityStore.get instead off updatedLastSeenAtStartOfLoop and have no paging.
  // But this would repeat 1 data item every loop iteration because of our use of gte in activityStore.get
  // See activityStore.get for more
  const updatedLastSeenAtStartOfLoop = await activityStore.stage2StateGet();
  let updatedLastSeen = updatedLastSeenAtStartOfLoop;

  while(true) {

    log(`Listing raw data start ${start} - updatedLastSeen ${updatedLastSeenAtStartOfLoop}`);
    const results = await activityStore.get(start, count, updatedLastSeenAtStartOfLoop);

    for (const x in results['body']['hits']['hits']) {
      const data = results['body']['hits']['hits'][x];

      if (!data['_source']['deleted']) {

        const rawData = new RawData(data)
        updatedLastSeen = rawData.meta.updated;
        const pipeLine = new PipeLine(rawData, async (normalisedEventList) => {

          for (let idx in normalisedEventList) {
            await activityStore.updateNormalised(normalisedEventList[idx])
          }

        });

        pipeLine.run();

      }

    }

    if (updatedLastSeen != updatedLastSeenAtStartOfLoop) {
      await activityStore.stage2StateUpdate(updatedLastSeen);
    }

    // ----- If reached end, stop
    if (results['body']['hits']['total']['value'] == 0 && results['body']['hits']['total']['relation'] == "eq") {
      break;
    }
    // Have seen the following response
    // {"took":0,"timed_out":false,"_shards":{"total":1,"successful":1,"skipped":0,"failed":0},"hits":{"total":{"value":1,"relation":"eq"},"max_score":null,"hits":[]}}
    // Thanks Elastic - so let's also .......
    if (results['body']['hits']['hits'].length == 0) {
      break;
    }

    start += count;

  }

}

function log(msg) {
  Utils.log(msg, "harvester-stage2");
}

export default processStage2;
