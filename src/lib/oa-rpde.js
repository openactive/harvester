import fetch from 'node-fetch';
import { URL } from 'url';
import Utils from './utils.js';

class OpenActiveRpde {
  constructor(publisherKey, feedKey, feedURL, activityStore, activityCb) {
    this.publisherKey = publisherKey;
    this.feedKey = feedKey;
    this.feedURL = feedURL;
    this.activityStore = activityStore;
    this.activityCb = activityCb;
    this.afterTimestamp;
    this.afterId;

  }


  getUpdates() {
    return new Promise(async resolve => {
      let stateData = await this.activityStore.stateGet(this.publisherKey, this.feedKey);

      /* Starting position url for this publisher */
      let nextURL = new URL(stateData.nextURL ?  stateData.nextURL : this.feedURL);

      /* Traverse all the pages available since our last run */
      while (true) {
        /* Sleep - avoid hitting publisher's api too hard */
        await Utils.sleep("oa-rpde-page-iter", 1);
        try {
          log(`Fetching ${nextURL}`);
          let res = await fetch(nextURL);

          let activitiesJson = await res.json();

          if (activitiesJson.items.length == 0) {
            break;
          }

          await this.activityCb(activitiesJson.items);

          nextURL = Utils.makeNextURL(this.feedURL, activitiesJson.next);

          // Save Next URL after every page
          // This is so if process crashes in middle of long feed, we don't start at the start again
          await this.activityStore.stateUpdate(this.publisherKey, this.feedKey, nextURL);

          log(`${this.publisherKey} - ${this.feedKey} - Finished page with ${activitiesJson.items.length} items`);
        } catch (er) {
          log(`Issue with ${this.publisherKey} - ${this.feedKey} - ${er}`);
          break;
        }

      }

      resolve();

    });
  }

}

function log(msg) {
  Utils.log(msg, "oa-rpde");
}

export default OpenActiveRpde;