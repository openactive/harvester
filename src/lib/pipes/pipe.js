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

  isBookable(eventType){
    /* 'bookable' events need to be created as NormalisedEvents in their own right. */
    return ['Event', 'HeadlineEvent', 'CourseInstance', 'Slot'].includes(eventType);
  }

  parseActivity(activity){
    /**
    This passes the whole activity object through for further processing 
    by the activity augmentation pipe, making it into an array if it wasn't one.
    **/
    /**
    let activities = [];
    if (activity ==  null){
      // Because we should end up with *some* tags here after the activity augmentation pipe,
      // so set it as an array in preparation
      activities = [];
    }else if (!Array.isArray(activity)){
      activities = [activity];
    }else{
      activities = activity;
    } **/
    // Current mapping type is keyword, return something that matches
    return "";
  }

  parseLocation(location){
    /**
    This passes the whole location object through for further processing 
    by the geo augmentation pipe.
    **/
    if (location !== undefined){
      let r = {};

      if ('geo' in location && 'latitude' in location['geo'] && 'longitude' in location['geo']) {
        r['coordinates'] = [
          parseFloat(location['geo']['longitude']),
          parseFloat(location['geo']['latitude'])
        ];
      }

      if ('address' in location && typeof location['address'] == 'object' && 'postalCode' in location['address']) {
        r['postcode'] = location['address']['postalCode'];
      }

      return r;
    }
  }

  log(msg) {
    Utils.log(msg, this.constructor.name);
  }

  parseOrganization(organization){
    /**
    This passes the whole organization object through for further processing 
    by the organization augmentation pipe.
    **/
    if (organization !== undefined){
      // Current mapping type is text, return something that matches
      return organization.name;
    }
  }

  copyPropertyFromSuper(subEvent, superEvent, property){
    if (subEvent.body[property] === undefined && superEvent.body[property] !== undefined){
      this.log(`Copying ${property} from ${superEvent.body.derived_from_type} to ${subEvent.body.derived_from_type}`);
      subEvent.body[property] = superEvent.body[property];
    }
    return subEvent;
  }

}

export default Pipe