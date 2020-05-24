import fetch from 'node-fetch';
import Settings from './settings.js';

class Utils {

  static async sleep(tag, timeSeconds){
    for (let i=0; i != timeSeconds; i++){
      if (process.env.DEBUG){
        Utils.log(`${tag} sleeping ${i}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  static log(message, tag){
    /*
    if (!process.env.DEBUG) {
      return;
    }*/

    if (!tag){
      tag = "";
    }

    switch(typeof(message)){
      case 'object':
        console.log(`${tag}\n ${JSON.stringify(message, null, 2)}`);
        break;
      case 'string':
        console.log(`${tag} ${message}`);
        break;
    }
  }

  static makeNextURL(startURL, nextURL) {
    if (nextURL.substring(0,1) == 'h') {
      // An absolute URL
      return nextURL;
    }

    if (nextURL.substring(0,1) == '/') {
      // An relative URL
      return (new URL(nextURL, startURL)).href;
    }

    throw new Error(`makeNextURL is stuck. ${startURL} ${nextURL}`);

  }

  static async loadActivitiesJSONIntoCache() {


    const res = await fetch(Settings.activityListJSONLD);
    // TODO  detect non 200 responses
    const activitiesData =  await res.json();


    cache.activities = {};

    for(let idx in activitiesData.concept) {
      cache.activities[activitiesData.concept[idx].id] = activitiesData.concept[idx];
    }

  }

  static getTimeoutPromise(loginfo){

      return new Promise((resolve, reject) => {

        let timeout = 1;
        let wait = setTimeout(() => {

          console.log(`Processing entity ${loginfo}`);
          reject("Operation timed out")},
          timeout);

      });

  }

}

var cache = { postcodes: {}, activities: {} };

export {
  cache,
  Utils,
};

export default Utils;
