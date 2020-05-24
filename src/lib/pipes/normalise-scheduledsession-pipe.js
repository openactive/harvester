import Pipe from './pipe.js';
import { cache } from '../utils.js';
import { Utils } from '../utils.js';
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
      if (data.type == 'ScheduledSession' || data['@type'] == 'ScheduledSession'){
        this.log(`Processing ${this.rawData.id}`);
        // See if it is part of a SessionSeries
        let sessionSeries = undefined;
        if (data.superEvent !== undefined && typeof(data.superEvent) === 'string'){
          // SessionSeries is an ID, need to get the object from the raw data
          this.log(`Awaiting superevent ${data.superEvent}`);
          // sessionSeries = await this.getSuperEvent(data);
          let firstAttempt = this.getSuperEvent(data).catch((err) => { console.log(`Failing on entity (round 1) ${data.superEvent}`)});
          let timeoutPromise = Utils.getTimeoutPromise(data.superEvent); // returns a Promise
          sessionSeries = await Promise.race([timeoutPromise, firstAttempt]).catch((err) => { console.log(`Failing on entity (round 2) ${data.superEvent}`)});
        }else if (data.superEvent !== undefined){
          // SessionSeries is embedded
          sessionSeries = this.parseSessionSeries(this.rawData.id, data.superEvent);
        }
      // Or the top level event is anything (but probably a SessionSeries)
      // with ScheduledSession subEvents
      }else if (data.subEvent !== undefined){
        this.log(`Processing ${this.rawData.id} at lower level`);
        let sessionSeries = this.parseSessionSeries(this.rawData.id, data);
        let subEvents = [];
        if (!Array.isArray(data.subEvent)){
          let subEvents = [data.subEvent];
        }else{
          let subEvents = data.subEvent;
        }

        for (const subEventData in subEvents){
          if(subEventData.type == 'ScheduledSession'){
            let normalisedEvent = this.parseScheduledSession(subEventData, sessionSeries);
            this.normalisedEvents.push(normalisedEvent);
          }
        }

      }else{
        let entity_type = this.rawData.data['type'] ? this.rawData.data['type'] : this.rawData.data['@type'];
        this.log(`Pass: ${entity_type}`);
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
    let activities = this.parseActivity(data.activity);
    let location = this.parseLocation(data.location);
    let organizer = this.parseOrganization(data.organizer);
    let event_attendance_mode = data.eventAttendanceMode ? data.eventAttendanceMode : "https://schema.org/OfflineEventAttendanceMode";

    let normalisedEvent = new NormalisedEvent({
      "data_id": data.id,
      "name": data.name,
      "description": data.description,
      "event_status": data.eventStatus,
      "event_attendance_mode": event_attendance_mode,
      "location": location,
      "activity": activities,
      "start_date": data.startDate,
      "end_date": data.endDate,
      "organizer": organizer,
      "derived_from_type": data.type,
      "derived_from_id": this.rawData.id,
    }, data);

    if (sessionSeries !== undefined){
      // Copy these properties from the superEvent to the NormalisedEvent made from the
      // ScheduledSession only if they don't already exist there.
      let propertiesToCopy = this.propertiesToCopy();
      const pipe = this;
      propertiesToCopy.forEach(function(property){
        normalisedEvent = pipe.copyPropertyFromSuper(normalisedEvent, sessionSeries, property);
      });

      normalisedEvent.body.derived_from_parent_type = sessionSeries.body.derived_from_type;
      normalisedEvent.body.derived_from_parent_id = sessionSeries.body.derived_from_id;
    }

    return normalisedEvent;
  }

  /**
  SessionSeries may be found at the top level or in a superEvent, so this
  parses it from raw data into a NormalisedEvent once it's been extracted,
  if necessary.
  **/
  parseSessionSeries(local_id, superEventData){
    let location = this.parseLocation(superEventData.location);
    let activities = this.parseActivity(superEventData.activity);
    let organizer = this.parseOrganization(superEventData.organizer);
    let event_attendance_mode = superEventData.eventAttendanceMode ? superEventData.eventAttendanceMode : "https://schema.org/OfflineEventAttendanceMode";
    let data_type = superEventData.type ? superEventData.type : superEventData['@type'];

    let superEvent = new NormalisedEvent({
      "name": superEventData.name,
      "data_id": superEventData.id,
      "description": superEventData.description,
      "location": location,
      "activity": activities,
      "organizer": organizer,
      "derived_from_type": superEventData.type,
      "derived_from_id": local_id,
      "event_attendance_mode" : event_attendance_mode
    }, superEventData);

    return superEvent;
  }

  /**
  If an Event has a superEvent property which is a URI, this gets it from
  the raw data index by data_id and returns it as a NormalisedEvent.
  **/
  getSuperEvent(rawData){
    return new Promise(async (resolve, reject) => {
      const activityStore = new ActivityStore();
      let superEventId = rawData.superEvent;

      const results = await activityStore.getRawByKeyword("data_id", superEventId);
      if(!results['body']['hits']['hits'].length){
        reject("No item matching superevent found");
      }
      for (const x in results['body']['hits']['hits']) {
        const data = results['body']['hits']['hits'][x];
        this.log(`Found superevent ${superEventId}`);
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
    return ['name', 'event_status', 'description', 'location', 'organizer', 'event_attendance_mode'];
  }


}

export default NormaliseScheduledSessionPipe;
