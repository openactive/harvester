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
      if (data.type == 'Event' || data.type == 'OnDemandEvent'){

        let normalisedEvent = this.parseEvent(data);
        this.normalisedEvents.push(normalisedEvent);
        // TODO: in theory regular Events might have subEvent or superEvent

      }else if (data.subEvent !== undefined){

        let subEvents = [];
        if (!Array.isArray(data.subEvent)){
          subEvents = [data.subEvent];
        }else{
          subEvents = data.subEvent;
        }

        const pipe = this;
        subEvents.forEach(function(subEventData){
          if(subEventData.type == 'Event'){

            // Get data from parent
            let parentEvent = pipe.parseEvent(data);
            let normalisedEvent = pipe.parseEvent(subEventData, parentEvent);

            // If parent is an Event, HeadlineEvent or CourseInstance, also create
            // a separate Event for it
            let parentType = parentEvent.body.derived_from_type;
            if (pipe.isBookable(parentType)){
              normalisedEvent.body['part_of_id'] = parentEvent.id();
              pipe.normalisedEvents.push(parentEvent);
            }

            pipe.normalisedEvents.push(normalisedEvent);
          }
        });

      }else{
        this.log(`Pass: ${this.rawData.data['type']}`);
      }

      resolve(this.normalisedEvents);
    });
  }

  parseEvent(eventData, parentEvent){
    try{
      // TODO: TH - this code is replicated across EventSeries, SessionSeries, and HeadlineEvent
      // classes. Refactor to avoid repetition.
      let activities = this.parseActivity(eventData.activity);
      let location = this.parseLocation(eventData.location);
      // TODO fixme
      let organizer = eventData.organizer;
      if (organizer === undefined){
        organizer = '';
      }else{
        organizer = organizer.name;
      }
      let event_attendance_mode = eventData.eventAttendanceMode ? eventData.eventAttendanceMode : "https://schema.org/OfflineEventAttendanceMode";

      let normalisedEvent = new NormalisedEvent({
        "data_id": eventData.id,
        "name": eventData.name,
        "name_label": eventData.name,
        "description": eventData.description,
        "event_status": eventData.eventStatus,
        "location": location,
        "activity": activities,
        "start_date": eventData.startDate,
        "end_date": eventData.endDate,
        "event_attendance_mode": event_attendance_mode,
        "organizer": organizer,
        "organizer_label": organizer,
        "derived_from_type": eventData.type,
        "derived_from_id": this.rawData.id,
      }, eventData);

      if (parentEvent !== undefined){
        // Copy these properties from the parent event to the NormalisedEvent made from the
        // ScheduledSession only if they don't already exist there.
        let propertiesToCopy = this.propertiesToCopy();
        const pipe = this;
        propertiesToCopy.forEach(function(property){
          normalisedEvent = pipe.copyPropertyFromSuper(normalisedEvent, parentEvent, property);
        });

        normalisedEvent.body.derived_from_parent_type = parentEvent.body.derived_from_type;
        normalisedEvent.body.derived_from_parent_id = parentEvent.body.derived_from_id;
      }

      return normalisedEvent;
    }catch(e){
      console.log(`Error parsing event ${this.rawData.id} :${e}`);
    }
  }

  /**
  Properties that should be copied from a HeadlineEvent or CourseInstance to an Event
  (if they don't already exist).
  **/
  propertiesToCopy(){
    return ['name', 'name_label','event_status', 'description', 'location', 'organizer', 'organizer_label', 'event_attendance_mode'];
  }

}

export default NormaliseEventPipe;
