import Pipe from './pipe.js';
import { cache } from '../utils.js';
import ActivityStore from '../activity-store.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

/** 
The NormaliseScheduledSession Pipe turns OpenActive ScheduledSession objects into a
normalised form.

foreach ScheduledSession:
  Use @id, name, description, eventStatus from ScheduledSession
  If missing, use from parent SessionSeries
  Use startDate and endDate from ScheduledSession
  Augment location, organiser, activity from parent ScheduledSession
  If missing, use from SessionSeries
  Add derived_from_type = ScheduledSession and derived_from_id (original ScheduledSession id)
  Add part_of_type = SessionSeries and part_of_id (original parent SessionSeries id)

**/
class NormaliseScheduledSessionPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      let data = this.rawData.data
      if (data.type == 'ScheduledSession'){

        let activities = this.parse_activity(data.activity);
        let location = this.parse_location(data.location);
        let organizer = this.parse_organization(data.organizer);

        let normalisedEvent = new NormalisedEvent({
          "name": data.name,
          "description": data.description,
          "event_status": data.eventStatus,
          "location": location,
          "activity": activities,
          "start_date": data.startDate,
          "end_date": data.endDate,
          "organizer": organizer,
          "derived_from_type": data.type,
          "derived_from_id": this.rawData.id,
        }, data);

        // If this ScheduledSession has a superEvent property we can use this
        // to get more data
        if (data.superEvent !== undefined){
          const superEvent = await this.getSuperEvent(data);

          // Copy these properties from the superEvent to the NormalisedEvent made from the
          // ScheduledSession only if they don't already exist there.
          let propertiesToCopy = ['name', 'event_status', 'description', 'location', 'organizer'];
          const pipe = this;
          propertiesToCopy.forEach(function(property){
            normalisedEvent = pipe.copyPropertyFromSuper(normalisedEvent, superEvent, property);
          });

          normalisedEvent.body.part_of_type = superEvent.body.derived_from_type;
          normalisedEvent.body.part_of_id = superEvent.body.derived_from_id;
        }
        this.normalisedEvents.push(normalisedEvent);

      }else{
        this.log(`Not processing ${this.rawData.data['type']} data here`);
      }

      resolve(this.normalisedEvents);
    });
  }

  /**
  If an Event has a superEvent property which is a URI, this gets it from
  the raw data index by data_id and returns it as a NormalisedEvent.
  **/
  getSuperEvent(rawData){
    return new Promise(async resolve => {
      const activityStore = new ActivityStore();
      let superEventId = rawData.superEvent;

      const results = await activityStore.getByKeyword("data_id", superEventId);
      for (const x in results['body']['hits']['hits']) {
        const data = results['body']['hits']['hits'][x];
        
        let superEventData = data['_source']['data'];
        
        let location = this.parse_location(superEventData.location);
        let activities = this.parse_activity(superEventData.activity);
        let organizer = this.parse_organization(superEventData.organizer);

        let superEvent = new NormalisedEvent({
          "name": superEventData.name,
          "origin_id": superEventData.id,
          "description": superEventData.description,
          "location": location,
          "activity": activities,
          "organizer": organizer,
          "derived_from_type": superEventData.type,
          "derived_from_id": data['_id'],
        }, superEventData);
        // Assume there's one and return the first hit
        resolve(superEvent);
      }
    });
  }


}

export default NormaliseScheduledSessionPipe;