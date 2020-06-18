import { processStage1ForPublisher } from './stage1.js';
import { processStage2ForPublisher } from './stage2.js';
import ActivityStore from './activity-store.js';
import Settings from './settings.js';
import fetch from 'node-fetch';
import Utils from './utils.js';


async function processBothStages() {

//  const activityStore = new ActivityStore();
//  const activityStoreOK = await activityStore.setupIndex();

//  if (activityStoreOK !== true){
//    log("failed to setup elastic index");
//    process.exit(1);
//  }

  await Utils.loadActivitiesJSONIntoCache();

  let res = await fetch(Settings.registryURL);
  let registryJson = await res.json();

  for (const publisherKey in registryJson.data) {

    /* Dev - uncomment to get data from certain publishers only */
  let includePublishers = ['playwaze/opendata'];
    if (!includePublishers.includes(publisherKey)){
      console.log(`[Dev] Skipping ${publisherKey}`);
      continue;
    }

    const publisher = registryJson.data[publisherKey];

    /* Skip publishers which aren't available or don't use the paging spec */
    if (!publisher.available || !publisher['uses-paging-spec']){
      continue;
    }

    // Not await - we want the event loop of Node to run all publishers at once
    processBothStagesForPublisher(publisherKey, publisher, activityStore);

  }

}

async function processBothStagesForPublisher(publisherKey, publisher, activityStore) {
  await processStage1ForPublisher(publisherKey, publisher, activityStore);
  await processStage2ForPublisher(publisherKey, publisher, activityStore);
}

export default processBothStages;
