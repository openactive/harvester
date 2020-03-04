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

      let activityItems = [];
      let activitiesJson = {};

      /* Traverse all the pages available since our last run */
      while (true) {
        /* Sleep - avoid hitting publisher's api too hard */
        await Utils.sleep("oa-rpde-page-iter", 1);
        try {
          log(`Fetching ${nextURL}`);
          let res = await fetch(nextURL);

          activitiesJson = await res.json();

          if (activitiesJson.items.length == 0) {
            break;
          }

          /* This could initially be quite a large number to have in mem ... */
          activityItems = activityItems.concat(activitiesJson.items);
          this.activityCb(activitiesJson.items);

          nextURL = Utils.makeNextURL(this.feedURL, activitiesJson.next);

          log(`Total activities fetched ${activityItems.length}`);
        } catch (er) {
          log(`Issue with ${this.publisherKey} - ${er}`);
          break;
        }

      }

      if (activityItems.length > 0) {
        await this.activityStore.stateUpdate(this.publisherKey, this.feedKey, nextURL);
      }

      resolve(activityItems);
    });
  }

}

function log(msg) {
  Utils.log(msg, "oa-rpde");
}

export default OpenActiveRpde;