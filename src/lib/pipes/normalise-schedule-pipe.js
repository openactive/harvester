import Pipe from './pipe.js';
import { cache } from '../utils.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';
import { RRule, RRuleSet, rrulestr } from 'rrule';

/** 
The NormaliseSchedule Pipe turns OpenActive Schedule objects into a
normalised form.

Calculate the datetimes for each individual event from the available fields in the Schedule: startTime, endTime, repeatFrequency, byDay, byMonth, byMonthDay, repeatCount, exceptDate
Foreach set of datetimes:
Create Event with type that matches scheduledEventType
Use the datetimes to generate individual event ids according to the idTemplate
Populate name, description, eventStatus from the parent Schedule
Add derived_from_type = Schedule and derived_from_id (original Schedule id)

Publisher notes:
* The value of eventSchedule should always be an array, but often isn't.
* The modelling spec uses `repeatFrequency` but some publishers use `frequency`
* urlTemplate, idTemplate and scheduledEventType should be present but aren't

Some schedules don't have an end date, just +1 month

**/
class NormaliseSchedulePipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      let pipe = this;
      let data = this.rawData.data;
      console.log(this.rawData.id);
      // Find all the places Schedules can hide.
      if (data.type == 'Schedule'){
        console.log('top level.....');
        console.log(data);

      }else if (data.eventSchedule !== undefined){
        // anything.eventSchedule covers:
        // Event, HeadlineEvent, CourseInstance, EventSeries, SessionSeries.
        // SessionSeries must have eventSchedule OR subEvent, so we do not
        //  need to check subEvents for schedules
        console.log(`eventSchedule.....`);
        console.log(data.eventSchedule);
        // make parent NormalisedEvent
          // (if bookable, push)
          // foreach eventSchedule
            // pipe.parseSchedule(scheduleData, parent);

      }else if (data.subEvent !== undefined){
        // Check in nested subEvents
        data.subEvent.forEach(function(event){
          if (event.eventSchedule !== undefined){
            console.log(`subEvent eventSchedule.....`);
            console.log(event.eventSchedule);
            // make parent NormalisedEvent
            // (if bookable, push)
            // what about parent parent?
            // foreach eventSchedule
              // pipe.parseSchedule(scheduleData, parent);
          }
        });

      }else{
        // nb. Slots and FacilityUse do not use eventSchedule.
        this.log(`Pass: ${this.rawData.data['type']}`);
      }

      resolve(this.normalisedEvents);
    });
  }

  parseSchedule(scheduleData, parentEvent){
    let normalisedEventData = {};
    //   "data_id": scheduleData.id,
    //   "start_date": scheduleData.startDate,
    //   "end_date": scheduleData.endDate,
    
    // Get data from parent
    // name, description, eventStatus, organizer, location, activity
    //   "derived_from_type": scheduleData.type (Schedule),
    //   "derived_from_id": this.rawData.id,
    //   "derived_from_parent_type": parentEvent.derived_from_type,
    //   "derived_from_parent_id": parentEvent.derived_from_id
    //   "part_of_id": parentEvent.id() only if isBookable

    let allDates = this.generateDatesFromSchedule(scheduleData);
    allDates.forEach(function(dates){
      // Update start_date and end_date from dates
      // normalisedEventData['start_date'] =
      // normalisedEventData['end_date'] =
      let normalisedEvent = new NormalisedEvent(normalisedEventData, this.rawData.data);
      this.normalisedEvents.push(normalisedEvent);
    });

    // Should be able to get useful info from the following if anyone used them..
    // urlTemplate
    // idTemplate
    // scheduledEventType

  }

  generateDatesFromSchedule(scheduleData){
    let startDate = new Date(scheduleData.startDate);
    let endDate = new Date(scheduleData.endDate);
    let startTime = new Date(scheduleData.startTime);
    let endTime = new Date(scheduleData.endTime);

    // Make datetimes from above by gluing dates and times together

    if (endDate === undefined && count === undefined){
      // endDate = start date + 1 month
    }
    let rule = new RRule({
      dtstart: startDate,
      until: endDate
    });

    if (scheduleData.repeatFrequency !== undefined){
      let freq = scheduleData.repeatFrequency;
    }else if (scheduleData.frequency !== undefined){
      let freq = scheduleData.frequency;
    }
    if(freq !== undefined){
      let frequency = parseFrequency(freq);
      rule['freq'] = frequency;
    }

    if (scheduleData.interval !== undefined){
      rule['interval'] = scheduleData.interval;
    }

    if (scheduleData.byDay !== undefined){
      let byDay = parseByWeekday(scheduleData.byDay);
      rule['byweekday'] = byDay;
    }

    if (scheduleData.byMonth !== undefined){
      rule['bymonth'] = scheduleData.byMonth;
    }

    if (scheduleData.byMonthDay !== undefined){
      rule['bymonthday'] = scheduleData.byMonthDay;
    }

    if (scheduleData.repeatCount !== undefined){
      rule['count'] = scheduleData.repeatCount;
    }
     
    let allDates = [];
    // Get all occurrence dates (Date instances):
    // allDates = rule.all();

    // Remove dates that are explicitly excluded.
    if (scheduleData.exceptDate !== undefined){
      scheduleData.exceptDate.forEach(function(exclude){
        if (allDates.includes(exclude)){
          allDates.splice (allDates.indexOf(exclude), 1);
        }
      });
    }
    
    return allDates;

  }

  /**
  Take the input from repeatFrequency property of Schedule and
  return one of:

    RRule.YEARLY
    RRule.MONTHLY
    RRule.WEEKLY
    RRule.DAILY
    RRule.HOURLY
    RRule.MINUTELY
    RRule.SECONDLY

  **/
  parseFrequency(frequency){
    return;

  }

  /**
  Take input (array) from byDay property of Scheduule and return one of
  the weekday constants (RRule.MO, RRule.TU, etc)
  **/
  parseByWeekday(days){
    return;
  }

}

export default NormaliseSchedulePipe;