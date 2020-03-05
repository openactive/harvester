import Pipe from './pipe.js';
import { cache } from '../utils.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

/** 
The NormaliseEventSeriesPipe turns OpenActive HeadlineEvent
or CourseInstsance objects into a normalised form.

For each in subEvent
Follow ruleset depending on event type (they could all be different)

**/
class NormaliseEventSeriesPipe extends Pipe {
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
          "location": location,
          "activity": activities,
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

}

export default NormaliseEventPipe;