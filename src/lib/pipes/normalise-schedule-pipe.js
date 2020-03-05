import Pipe from './pipe.js';
import { cache } from '../utils.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

/** 
The NormaliseSchedule Pipe turns OpenActive Schedule objects into a
normalised form.

Calculate the datetimes for each individual event from the available fields in the Schedule: startTime, endTime, repeatFrequency, byDay, byMonth, byMonthDay, repeatCount, exceptDate
Foreach set of datetimes:
Create Event with type that matches scheduledEventType
Use the datetimes to generate individual event ids according to the idTemplate
Populate name, description, eventStatus from the parent Schedule
Add derived_from_type and part_of_type = Schedule and derived_from_id and part_of_id (original Schedule id)

Some schedules don't have an end date, just +1 month

**/
class NormaliseSchedulePipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      let data = this.rawData.data
      if (data.type == 'Event'){

        let activities = this.parse_activity(data.activity);
        let location = this.parse_location(data.location);

        let normalisedEvent = new NormalisedEvent({
          "origin_id": data.id,
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