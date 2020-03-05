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

  parse_activity(activity){
    /**
    This passes the whole activity object through for further processing 
    by the activity augmentation pipe, making it into an array if it wasn't one.
    **/
    let activities = [];
    if (activity ==  null){
      // Because we should end up with *some* tags here after the activity augmentation pipe,
      // so set it as an array in preparation
      activities = [];
    }else if (!Array.isArray(activity)){
      activities = [activity];
    }else{
      activities = activity;
    }
    return activities;
  }

  parse_location(location){
    /**
    This passes the whole location object through for further processing 
    by the geo augmentation pipe.
    **/
    return location;
  }

  log(msg) {
    Utils.log(msg, this.constructor.name);
  }

  parse_organization(organization){
    /**
    This passes the whole organization object through for further processing 
    by the organization augmentation pipe.
    **/
    return organization;
  }

}

export default Pipe