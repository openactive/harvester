import Pipe from './pipe.js';
import { cache } from '../utils.js';
import ActivityStore from '../activity-store.js';
import NormalisedEvent from '../normalised-event.js';
import fetch from 'node-fetch';

/** 
The NormaliseSlot Pipe turns OpenActive Slot objects into a
normalised form.

A Slot is part of FacilityUse or IndividualFacilityUse.
Slots only contain start/end information by themselves, and additional
info comes from FacilityUse or IndividualFacilityUse.
FacilityUse and IndividualFacilityUse are not 'bookable' and should
not be indexed by themselves.

**/
class NormaliseSlotPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      let data = this.rawData.data

      // A Slot at the top level
      // We have to look for its facilityUse for more data.
      if (data.type == 'Slot'){

        let facilityUse = new NormalisedEvent({}, {});
        if (data.facilityUse !== undefined){
          facilityUse = await this.getFacilityUse(data);
        }

        let normalisedEvent = this.parseSlot(data, facilityUse);
        this.normalisedEvents.push(normalisedEvent);

      // A FacilityUse at the top level
      // We can look inside it for Slots
      // TODO: FU may contain multiple IFU or IFU may point to a single FU; 
      //       IFU --aggregateFacilityUse--> FU
      //       FU --individualFacilityUse--> [IFU]
      //       not sure if we need to also fetch these for additional data
      //       but if so, need to beware of recursive loop.
      }else if (data.type == 'FacilityUse' || data.type == 'IndividualFacilityUse'){

        if (data.event !== undefined){
          // FU and IFU embed an array of Slots with `event` property..
          let facilityUse = this.parseFacilityUse(this.rawData.id, data);

          let slots = [];
          if (!Array.isArray(data.event)){
            slots = [data.event];
          }else{
            slots = data.event;
          }

          for (const slotData in slots){
            if(slotData.type == 'Slot'){
              let normalisedEvent = this.parseSlot(slotData, facilityUse);
              this.normalisedEvents.push(normalisedEvent);
            }
          }

        }else{
          // ..or sometimes they don't.
          // (The related Slots are top-level and link to FU/IFU instead)
          this.log(`Found ${this.rawData.data.type} [${this.rawData.id}] but no embedded Slots to process.`);
        }

      }else{
        this.log(`Pass: ${this.rawData.data['type']}`);
      }

      resolve(this.normalisedEvents);
    });
  }

  /**
  Parse a Slot into a Normalised Event.
  **/
  parseSlot(slotData, facilityUse){
    try{

      let normalisedEvent = new NormalisedEvent({
        "data_id": slotData.id,
        "start_date": slotData.startDate,
        "end_date": slotData.endDate,
        "derived_from_type": slotData.type,
        "derived_from_id": this.rawData.id,
      }, slotData);

      if (facilityUse !== undefined){
        // Copy these properties from the related FacilityUse to the NormalisedEvent made from the
        // Slot only if they don't already exist there.
        let propertiesToCopy = this.propertiesToCopy();
        const pipe = this;
        propertiesToCopy.forEach(function(property){
          normalisedEvent = pipe.copyPropertyFromSuper(normalisedEvent, facilityUse, property);
        });

        normalisedEvent.body.derived_from_parent_type = facilityUse.body.derived_from_type;
        normalisedEvent.body.derived_from_parent_id = facilityUse.body.derived_from_id;
      }

      return normalisedEvent;
    }catch(e){
      console.log(`Error parsing event ${this.rawData.id} :${e}`);
    }
  }

  /**
  Parses FacilityUse or IndividualFacilityUse into a NormalisedEvent
  so data can be used for related Slots.
  **/
  parseFacilityUse(raw_id, facilityUseData){
    try{

      let location = this.parseLocation(facilityUseData.location);
      let activities = this.parseActivity(facilityUseData.activity);
      let provider = this.parseOrganization(facilityUseData.provider);

      let normalisedEvent = new NormalisedEvent({
        "data_id": facilityUseData.id,
        "name": facilityUseData.name,
        "description": facilityUseData.description,
        "provider": provider,
        "activity": activities,
        "location": location,
        "derived_from_type": facilityUseData.type,
        "derived_from_id": raw_id,
      }, facilityUseData);

      return normalisedEvent;
    }catch(e){
      console.log(`Error parsing event ${this.rawData.id} :${e}`);
    }
  }

  /**
  If a Slot has a facilityUse property, the value is a URI; this gets it from
  the raw data index by data_id and returns it as a NormalisedEvent.
  **/
  getFacilityUse(rawData){
    return new Promise(async resolve => {
      const activityStore = new ActivityStore();
      let facilityUseId = rawData.facilityUse;

      const results = await activityStore.getRawByKeyword("data_id", facilityUseId);
      for (const x in results['body']['hits']['hits']) {
        const data = results['body']['hits']['hits'][x];
        
        let facilityUseData = data['_source']['data'];
        let facilityUse = this.parseFacilityUse(data['_id'], facilityUseData);
        // Assume there's one and return the first hit
        resolve(facilityUse);
      }
    });
  }

  /**
  Properties that should be copied from a FacilityUse to a Slot
  (if they don't already exist).
  **/
  propertiesToCopy(){
    return ['name', 'description', 'activity', 'location', 'provider'];
  }

}

export default NormaliseSlotPipe;