import Utils from "../utils.js";

class Pipe {
  constructor(rawData, normalisedEvents) {
    this.rawData = rawData;
    this.normalisedEvents = normalisedEvents;
  }

  /* Override this function */
  run(){
    return new Promise(async resolve => {
      log(`Running ${this.augmentedActivity.id} - ${this.augmentedActivity.data.name} through ${this.constructor.name}`);
      /* Do stuff to the raw data here */
      resolve(this.normalisedEvents);
    });
  }

  log(msg) {
    Utils.log(msg, this.constructor.name);
  }

}

export default Pipe