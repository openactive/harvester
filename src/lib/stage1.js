import PipeLine from './pipeline.js';
import OpenActiveRpde from './oa-rpde.js';
import ActivityStore from './activity-store.js';
import RPDEItemUpdate from './rpde-data-update.js';
import RPDEItemDelete from './rpde-data-delete.js';
import Settings from './settings.js';
import fetch from 'node-fetch';
import Utils from './utils.js';


async function processStage1() {
  const activityStore = new ActivityStore();
  const activityStoreOK = await activityStore.setupIndex();

  if (activityStoreOK !== true){
    log("failed to setup elastic index");
    process.exit(1);
  }

  let res = await fetch(Settings.registryURL);
  let registryJson = await res.json();

  /* We may want to split the registry up into groups of "Threads" */
  for (const publisherKey in registryJson.data) {

    const publisher = registryJson.data[publisherKey];

    /* Skip publishers which aren't available or don't use the paging spec */
    if (!publisher.available || !publisher['uses-paging-spec']){
      continue;
    }

    /*
    Build list of end points.
    This works with both https://status.openactive.io/datasets.json and our own custom JSON format with the new 'data-urls' key
    In the end we want feeds to be a dict of key: url eg
    feeds = { "sessions": "http://feed.opendata/sessions", "facility-uses": "http://feed.opendata/facility-uses" }
    */
    let feeds = {};
    if ('data-urls' in publisher) {
      feeds = publisher['data-urls'];
    } else if ('data-url' in publisher) {
      feeds['all'] = publisher['data-url'];
    }

    /* Process each end point! */
    for (const feedKey in feeds) {

      log(`=== Start ${publisherKey}  ===`);

      await (async (publisher) => {
        let activitiesFeed = new OpenActiveRpde(publisherKey, feedKey, feeds[feedKey], activityStore, async (activityItems) => {

          /* OpenActive RPDE Page callback */
          for (const activityItem of activityItems) {
              if (activityItem.state == 'updated'){
                await activityStore.update(new RPDEItemUpdate(activityItem, publisherKey, feedKey));
              } else if (activityItem.state == 'deleted') {
                await activityStore.delete(new RPDEItemDelete(activityItem, publisherKey, feedKey));
              } else {
                log(`Skipping unknown activity state: ${activityItem.state}`);
              }
          }

        });

        await activitiesFeed.getUpdates();
        log(`=== Finished ${publisherKey} ===`);

      })(publisher);

    }
  }

}

function log(msg) {
  Utils.log(msg, "harvester-stage1");
}

export default processStage1;