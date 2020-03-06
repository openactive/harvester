import Pipe from './pipe.js';
import { cache } from '../utils.js';
import ActivityStore from '../activity-store.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

/** 
The NormaliseScheduledSession Pipe turns OpenActive ScheduledSession objects into a
normalised form. It also operates over SessionSeries data to augment the
ScheduledSessions, but no NormalisedEvents are created from a SessionSeries alone.
**/
class NormaliseScheduledSessionPipe extends Pipe {
  run(){
    return new Promise(async resolve => {
      let data = this.rawData.data

      // The top level event is a ScheduledSession
      if (data.type == 'ScheduledSession'){

        let parsed = await this.parseScheduledSession(data);

      // Or the top level event is anything (but probably a SessionSeries)
      // with ScheduledSession subEvents
      }else if (data.subEvent !== undefined){

        if (!Array.isArray(data.subEvent)){
          let subEvents = [data.subEvent];
        }else{
          let subEvents = data.subEvent;
        }

        for (const subEvent in subEvents){
          if(subEvent.type == 'ScheduledSession'){
            // Get data from parent
            let sessionSeries = await this.parseSessionSeries(this.rawData.id, data);
            let parsed = await this.parseScheduledSession(subEvent, sessionSeries);
          }
        }

      }else{
        this.log(`Not processing ${this.rawData.data['type']} data here`);
      }

      resolve(this.normalisedEvents);
    });
      
  }

  /**
  ScheduledSession can be found at the top level, or in an array
  of subEvents, so this parses one from raw data into a Normalised Event
  once it has been extracted if necessary.
  **/
  parseScheduledSession(data, sessionSeries){
    return new Promise(async resolve => {
      let activities = this.parse_activity(data.activity);
      let location = this.parse_location(data.location);
      let organizer = this.parse_organization(data.organizer);

      let normalisedEvent = new NormalisedEvent({
        "data_id": data.id,
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

      let superEvent = {};
      // If this ScheduledSession came from a subEvent, its parent's data
      // got passed in and we can use it.
      if (sessionSeries !== undefined){
        superEvent = sessionSeries;
      }

      // If this ScheduledSession has a superEvent property we can use this
      // to get parent data
      if (data.superEvent !== undefined){

        if (typeof(data.superEvent) === 'string'){
          superEvent = await this.getSuperEvent(data);
          
        }else{
          // Get superEvent if it is nested rather than linked by id
          // Note: not tested well as haven't seen any data like this yet.
          superEvent = parseSessionSeries(this.rawData.id, data.superEvent);
        }
      }

      // Copy these properties from the superEvent to the NormalisedEvent made from the
      // ScheduledSession only if they don't already exist there.
      let propertiesToCopy = this.propertiesToCopy();
      const pipe = this;
      propertiesToCopy.forEach(function(property){
        normalisedEvent = pipe.copyPropertyFromSuper(normalisedEvent, superEvent, property);
      });

      normalisedEvent.body.derived_from_parent_type = superEvent.body.derived_from_type;
      normalisedEvent.body.derived_from_parent_id = superEvent.body.derived_from_id;

      this.normalisedEvents.push(normalisedEvent);

      resolve(this.normalisedEvents);
    });
  }

  /**
  SessionSeries may be found at the top level or in a superEvent, so this
  parses it from raw data into a NormalisedEvent once it's been extracted,
  if necessary.
  **/
  parseSessionSeries(local_id, superEventData){
    let location = this.parse_location(superEventData.location);
    let activities = this.parse_activity(superEventData.activity);
    let organizer = this.parse_organization(superEventData.organizer);

    let superEvent = new NormalisedEvent({
      "name": superEventData.name,
      "data_id": superEventData.id,
      "description": superEventData.description,
      "location": location,
      "activity": activities,
      "organizer": organizer,
      "derived_from_type": superEventData.type,
      "derived_from_id": local_id,
    }, superEventData);

    return superEvent;
  }

  /**
  If an Event has a superEvent property which is a URI, this gets it from
  the raw data index by data_id and returns it as a NormalisedEvent.
  **/
  getSuperEvent(rawData){
    return new Promise(async resolve => {
      const activityStore = new ActivityStore();
      let superEventId = rawData.superEvent;

      const results = await activityStore.getRawByKeyword("data_id", superEventId);
      for (const x in results['body']['hits']['hits']) {
        const data = results['body']['hits']['hits'][x];
        
        let superEventData = data['_source']['data'];
        let superEvent = this.parseSessionSeries(data['_id'], superEventData);
        // Assume there's one and return the first hit
        resolve(superEvent);
      }
    });
  }

  /**
  Properties that should be copies from a SessionSeries to a ScheduledSession
  (if they don't already exist).
  **/
  propertiesToCopy(){
    return ['name', 'event_status', 'description', 'location', 'organizer'];
  }


}

export default NormaliseScheduledSessionPipe;