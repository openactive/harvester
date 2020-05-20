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
    return ['Event', 'HeadlineEvent', 'CourseInstance', 'Slot', 'ScheduledSession'].includes(eventType);
  }

  parseActivity(activity){
    /**
    This parses the activity field, which will be an object or an array of
    objects, and gets the URI of each activity, passing back an array of strings.
    These are further processed by the ActivityPipe.
    **/

    let rawActivities = [];
    let activities = [];
    if (!Array.isArray(activity)){
      if (activity !== undefined && activity !== null){
        rawActivities = [activity];
      }
    }else{
      rawActivities = activity;
    }
    rawActivities.forEach(function(rawActivity){
      // On the official Activity List
      // Just use the id so we can get the names and other info from our cache.
      if (rawActivity.inScheme == 'https://www.openactive.io/activity-list/activity-list.jsonld'){
        if (rawActivity.id !== undefined){
          activities.push(rawActivity.id);
        }
      }else{
        // Publisher-owned ActivityList
        // Not all of these have ids, and for the ones that do we probably
        // don't want to go and fetch them to get their names, so let's just
        // use the name in the object.
        if (rawActivity.prefLabel !== undefined){
          activities.push(rawActivity.prefLabel);
        }
        if (rawActivity.altLabel !== undefined){
          activities.push(rawActivity.altLabel);
        }
      }
    });

    return activities;
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
