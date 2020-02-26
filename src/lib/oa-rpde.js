import fetch from 'node-fetch';
import { URL } from 'url';
import Utils from './utils.js';

class OpenActiveRpde {
  constructor(activityStore, publisher, publisherKey, activityCb) {
    this.activityStore = activityStore;
    this.publisher = publisher;
    this.publisherKey = publisherKey;
    this.afterTimestamp;
    this.afterId;
    this.activityCb = activityCb;
  }


  getUpdates() {
    return new Promise(async resolve => {
      let stateData = await this.activityStore.harvester_state_get_information(this.publisherKey);

      /* Starting position url for this publisher */
      let dataUrl = new URL(this.publisher['data-url']);
      dataUrl.searchParams.set('afterTimestamp', stateData.last_timestamp);
      dataUrl.searchParams.set('afterId', stateData.last_id);

      let activityItems = [];
      let activitiesJson = {};

      /* Traverse all the pages available since our last run */
      while (true) {
        /* Sleep - avoid hitting publisher's api too hard */
        await Utils.sleep("oa-rpde-page-iter", 1);
        try {
          let res;

          /* We're at the starting position page and haven't added any results yet */
          if (activityItems.length === 0) {
            console.log(`Fetching ${dataUrl.href}`);
            res = await fetch(dataUrl);
          } else {
            console.log(`Fetching next page ${activitiesJson.next}`);
            res = await fetch(activitiesJson.next);
          }

          activitiesJson = await res.json();

          if (activitiesJson.items.length == 0) {
            break;
          }

          /* This could initially be quite a large number to have in mem ... */
          activityItems = activityItems.concat(activitiesJson.items);
          this.activityCb(activitiesJson.items);

          console.log(activityItems.length);
        } catch (er) {
          console.log(`Issue with ${this.publisherKey} - ${er}`);
          break;
        }

      }

      if (activityItems.length > 0) {
        const now = new Date().getTime();
        const lastId = activityItems[activityItems.length - 1].id;
        await this.activityStore.harvester_state_put_information(this.publisherKey, now, lastId);
      }

      resolve(activityItems);
    });
  }

}

export default OpenActiveRpde;