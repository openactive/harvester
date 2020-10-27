import Pipe from './pipe.js';
import { cache } from '../utils.js';
import fetch from 'node-fetch';
import Settings from '../settings.js';


class ActivityPipe extends Pipe {

  run(){
    return new Promise(async resolve => {

      let augmentedActivities = [];

      let pipe = this;
      this.normalisedEvents.forEach(function(event){
        let eventActivities = event.body.activity;
        
        // Enhance from what was in the activity field of the raw data
        eventActivities.forEach(function(activity){
          let rawActivityId = activity.zid;
          let rawActivityPrefLabel = activity.prefLabel;

          if(rawActivityPrefLabel && !rawActivityId){

            augmentedActivities.push(rawActivityPrefLabel);
            pipe.log("Added " + rawActivityPrefLabel + " and skipping further processing!");

          }
          else{
            let activityId = pipe.normaliseActivityId(activity);

            if (cache.activities[activityId] !== undefined){
              augmentedActivities = augmentedActivities.concat(pipe.getActivityLabels(activityId));
              // Get labels of broader activities too
              augmentedActivities = augmentedActivities.concat(pipe.getBroaderActivities(activityId));
            }else{
              // It's from a publishers own list, just push as is
              augmentedActivities.push(activity);
            }
          }
        });

        // Enhance from other fields
        augmentedActivities = augmentedActivities.concat(pipe.extractActivities(event));

        if (augmentedActivities.length > 0){
          // Dedup activity labels
          let uniqueAugmentedActivities = new Set(augmentedActivities);
          uniqueAugmentedActivities = [...uniqueAugmentedActivities];
          pipe.log(`Adding activities [${uniqueAugmentedActivities}]`);

          // Finally, update the NormalisedEvent
          event.body.activity = uniqueAugmentedActivities;
        }

      });

      resolve(this.normalisedEvents);
    });
  }

  /**
  Most activities in the cache.activities only have a prefLabel but some have
  altLabel so we should get this too. 
  **/
  getActivityLabels(activityKey){

    let pipe = this;
    pipe.log("Called on " + activityKey);
    let labels = [];
      // Get the labels from the cached cache.activities
      labels.push(cache.activities[activityKey]['prefLabel']);
      if (cache.activities[activityKey]['altLabel'] !== undefined){
        cache.activities[activityKey]['altLabel'].forEach(function(altLabel){
          labels.push(altLabel);
        });
      }
    return labels;
  }

  /**
  Recursively checks activities in the cache.activities for broader field
  and returns all labels of broader concepts. The broader field is an
  array of ids that can also be found in the cache.activities.
  **/
  getBroaderActivities(activityKeys, activitiesSoFar = []){
    if (!Array.isArray(activityKeys)){
      activityKeys = [activityKeys];
    }

    let pipe = this;
    activityKeys.forEach(function (activityKey){

      let broaderKeys = cache.activities[activityKey]['broader'];
      if (broaderKeys !== undefined){
        let broaderLabels = [];
        broaderKeys.forEach(function(broaderKey){
          let broaderLabel = pipe.getActivityLabels(pipe.normaliseActivityId(broaderKey));
          broaderLabels = broaderLabels.concat(broaderLabel);
          pipe.log(`Found broader activity: [${broaderLabel}]`);
        });
        activitiesSoFar = activitiesSoFar.concat(broaderLabels);
        return pipe.getBroaderActivities(broaderKeys, activitiesSoFar);
      }

    });

    return activitiesSoFar;
  }

  /**
  Check for labels from the cache.activities in the name and description
  fields of the event, and apply these activities if found.
  TODO: we could do a fuzzy match between the event description
        and the activity definition and look at score to decide whether
        to tag the event with that activity.
  **/
  extractActivities(normalisedEvent){
    let labels = [];
    let searchFields = ['name', 'description'];

    let pipe = this;
    // TODO: this is not efficient, maybe reindex by label in the cache?
    for (const id of Object.keys(cache.activities)) {
      let activity = cache.activities[id];
      searchFields.forEach(function(field){
        if (normalisedEvent.body[field] !== undefined){
          if(pipe.searchTextForActivity(normalisedEvent.body[field].toLowerCase(), activity.prefLabel.toLowerCase())){
            labels.push(activity.prefLabel);
            labels = labels.concat(pipe.getBroaderActivities(id));
          }
          if (activity.altLabel !== undefined){
            for (const i in activity.altLabel){
              if(pipe.searchTextForActivity(normalisedEvent.body[field].toLowerCase(), activity.altLabel[i].toLowerCase())){
                labels.push(activity.altLabel[i]);
                labels = labels.concat(pipe.getBroaderActivities(id));
              }

            }
          }
        }
      });

    };

    return labels;
  }

  /**
  Simple string in string matching, only matches complete words,
  which helps to avoid false positives from substrings.
  **/
  searchTextForActivity(text, activity){
    const regex = new RegExp("\\b"+activity+"\\b");
    let result = text.search(regex) !== -1;
    if (result){
      this.log(`Found [${activity}] in "${text}"`);
    }
    return result;
  }

  /**
  In the cache.activities ids take the form https://openactive.io/activity-list#{id}
  but some data uses http, www, and/or a forward slash before the #{id}. So let's
  strip these out.
  **/
  normaliseActivityId(activityId){
    let normed = activityId.replace("http://", "https://").replace("www.", "").replace("/#", "#");
    return normed;
  }
}

export default ActivityPipe;