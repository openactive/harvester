import Pipe from './pipe.js';
import { cache } from '../utils.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

/** 
The NormaliseEvent Pipe turns OpenActive Event objects into a
normalised form.
**/
class NormaliseEventPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      let data = this.rawData.data
      if (data.type == 'Event'){

        let activities = this.parse_activity(data.activity);
        let location = this.parse_location(data.location);

        let normalisedEvent = new NormalisedEvent({
          "name": data.name,
          "description": data.description,
          "event_status": data.eventStatus,
          "location_raw": location,
          "activity_raw": activities,
          "start_date": data.startDate,
          "end_date": data.endDate,
          "organizer": data.organizer.name,
          "derived_from_type": data.type,
          "derived_from_id": this.rawData.id,
        }, data);

        this.normalisedEvents.push(normalisedEvent);

      }else{
        this.log(`Not processing ${this.rawData.data['type']} data here`);
      }

      resolve(this.normalisedEvents);
    });
  }

  parse_activity(activity){
    let activities = [];
    // TODO
    // Also move this function somewhere else
    // if (activity.isArray){
    //   activity.forEach(an_activity => { 
    //     activities.push(an_activity.prefLabel) 
    //   });
    // }else{
    //   activities.push(activity.prefLabel)
    // }
    return activities;
  }

  parse_location(location){
    // TODO
    // Also move this function somewhere else
    let parsed_location = {};
    return parsed_location;
  }
}

export default NormaliseEventPipe;