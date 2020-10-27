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

  await Utils.loadActivitiesJSONIntoCache();

  let res = await fetch(Settings.registryURL);
  let registryJson = await res.json();

  for (const publisherKey in registryJson.data) {

    /* Dev - uncomment to get data from certain publishers only */
    /*let includePublishers = ['britishtriathlon/openactive'];
    if (!includePublishers.includes(publisherKey)){
      console.log(`[Dev] Skipping ${publisherKey}`);
      continue;
    }*/

    const publisher = registryJson.data[publisherKey];

    /* Skip publishers which aren't available or don't use the paging spec */
    if (!publisher.available || !publisher['uses-paging-spec']){
      continue;
    }

    // Not await - we want the event loop of Node to run all publishers at once
    processStage2ForPublisher(publisherKey, publisher, activityStore);

  }


}


async function processStage2ForPublisher(publisherKey, publisher, activityStore) {

  let start = 0;
  const count = 100;
  const maxstart = 9800;

  // updatedLastSeenAtStartOfLoop & updatedLastSeen - we keep updatedLastSeenAtStartOfLoop constant and pass this to query
  // We use elastics paging to get a fresh set of results each time because that way we don't repeat data items
  // Alternative is pass updatedLastSeen to activityStore.get instead off updatedLastSeenAtStartOfLoop and have no paging.
  // But this would repeat 1 data item every loop iteration because of our use of gte in activityStore.get
  // See activityStore.get for more
  // HOWEVER
  // Elastic can't go above a certain paging limit
  // So every time we get close to that limit we start again
 /* let updatedLastSeenAtStartOfLoop = await activityStore.stage2StateGet(publisherKey);
  let updatedLastSeen = updatedLastSeenAtStartOfLoop;

  while(true) {

    log(`Listing raw data publisher ${publisherKey} start ${start} - updatedLastSeen ${updatedLastSeenAtStartOfLoop}`);
    const results = await activityStore.get(publisherKey, start, count, updatedLastSeenAtStartOfLoop);
    for (const x in results['body']['hits']['hits']) {

      const data = results['body']['hits']['hits'][x];

      const rawData = new RawData(data);
      updatedLastSeen = rawData.meta.updated;

      if (!data['_source']['deleted']) {

        const pipeLine = new PipeLine(rawData, async (normalisedEventList) => {

          for (let idx in normalisedEventList) {
            await activityStore.updateNormalised(normalisedEventList[idx])
          }

        });

        await pipeLine.run();

      }

    }

    if (updatedLastSeen != updatedLastSeenAtStartOfLoop) {
      await activityStore.stage2StateUpdate(publisherKey, updatedLastSeen);
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

    if (start > maxstart) {
      start = 0;
      updatedLastSeenAtStartOfLoop = updatedLastSeen;
    }

  }

  */

  let test_entities = {
      "busted" : "parkwood/opendata-session-series-752055",
      "working" : "parkwood/opendata-session-series-752049"
  }

  for (const[stat, val] of Object.entries(test_entities)){
    log(stat + "  " + val + "\n==================\n");

    const results = await activityStore.getRawById(val);
    for (const x in results['body']['hits']['hits']) {

      const data = results['body']['hits']['hits'][x];

      log("data first grab:" + JSON.stringify(data) + "\n");

      const rawData = new RawData(data);

      const pipeLine = new PipeLine(rawData, async (normalisedEventList) => {

          for (let idx in normalisedEventList) {
            await activityStore.updateNormalised(normalisedEventList[idx]);
          }

        await pipeLine.run();

      }); 

    }

  }

}


function log(msg) {
  Utils.log(msg, "harvester-stage2");
}

export {
  processStage2,
  processStage2ForPublisher,
};

export default processStage2;
