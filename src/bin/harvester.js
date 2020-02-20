#!/usr/bin/env node

import PipeLine from '../lib/pipeline.js';
import OpenActiveRpde from '../lib/oa-rpde.js';
import ActivityStore from '../lib/activity-store.js';
import fetch from 'node-fetch';
import sqlite from 'sqlite'

const registryUrl = 'https://status.openactive.io/datasets.json';

const databaseName = 'rpde-states.sqlite';

/* Dev  - See testing/test-service */

//const registryUrl = 'http://localhost:3001';

/* End Dev */

/* get registry, get publisher's urls, fetch activities (items),
 put items through pipeline */

const activityStore = new ActivityStore();

(async () => {
  let res = await fetch(registryUrl);
  let registryJson = await res.json();
  const db = await sqlite.open(databaseName);

  /* We may want to split the registry up into groups of Threads */
  let i = 0;
  for (const publisherKey in registryJson.data) {
      /* DEBUG */
      i++;
      if (i > 20){
        break;
      }
      /* end DEBUG */


    const publisher = registryJson.data[publisherKey];

    /* Skip publishers which aren't available or don't use the paging spec */
    if (!publisher.available || !publisher['uses-paging-spec']){
      continue;
    }

    (async (publisher) => {
      console.log("HI");
      let activitiesFeed = new OpenActiveRpde(db, publisher, publisherKey, (activityItems) => {

        /* OpenActive RPDE Page callback */
        for (const activityItem of activityItems) {

            if (activityItem.state == 'updated'){

              const pipeLine = new PipeLine(activityItem, (augmentedActivity) => {
                /* Pipeline callback */
                activityStore.update(augmentedActivity);
              });

              pipeLine.run();

            } else if (activityItem.state == 'deleted') {
              activityStore.delete(activityItem);
            } else {
              console.log("Err unknown activity state");
            }

        }

      });

      activitiesFeed.getUpdates();



    })(publisher);
  }
})();