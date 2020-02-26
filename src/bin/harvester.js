#!/usr/bin/env node

import PipeLine from '../lib/pipeline.js';
import OpenActiveRpde from '../lib/oa-rpde.js';
import ActivityStore from '../lib/activity-store.js';
import fetch from 'node-fetch';

const registryUrl = 'https://status.openactive.io/datasets.json';
const esIndex = 'open-active';
const esHarvesterStateIndex = 'open-active-harvester-state';
const databaseName = 'rpde-states.sqlite';

/* Dev  - See testing/test-service */

//const registryUrl = 'http://localhost:3001';

/* End Dev */

const activityStore = new ActivityStore(esIndex, esHarvesterStateIndex);

(async () => {
  const activityStoreOK = await activityStore.setupIndex();

  if (activityStoreOK !== true){
    console.log("failed to setup elastic index");
    process.exit(1);
  }

  let res = await fetch(registryUrl);
  let registryJson = await res.json();

  /* We may want to split the registry up into groups of "Threads" */
  for (const publisherKey in registryJson.data) {

    const publisher = registryJson.data[publisherKey];

    /* Skip publishers which aren't available or don't use the paging spec */
    if (!publisher.available || !publisher['uses-paging-spec']){
      continue;
    }

    console.log(`=== Start ${publisherKey}  ===`);

    await (async (publisher) => {
      let activitiesFeed = new OpenActiveRpde(activityStore, publisher, publisherKey, async (activityItems) => {

        /* OpenActive RPDE Page callback */
        for (const activityItem of activityItems) {
          console.log("Activity item pipe and store");

            if (activityItem.state == 'updated'){

              const pipeLine = new PipeLine(activityItem, async (augmentedActivity) => {
                /* Pipeline callback */
                await activityStore.update(augmentedActivity);
              });

              pipeLine.run();

            } else if (activityItem.state == 'deleted') {
              await activityStore.delete(activityItem);
            } else {
              console.log("Err unknown activity state");
            }

        }

      });

      /* We don't currently use the output as we're using the CB to get each page at a time instead */
      let activitiesProcessed = await activitiesFeed.getUpdates();
      console.log(`=== Finished ${publisherKey} processed ${activitiesProcessed.length} ===`);

    })(publisher);
  }

})();