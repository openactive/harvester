#!/usr/bin/env node
import ActivityStore from '../lib/activity-store.js';
import { esIndex, esHarvesterStateIndex } from './harvester.js';
import Utils from '../lib/utils.js';

const activityStore = new ActivityStore(esIndex, esHarvesterStateIndex);

const client = activityStore.client;

function log(message){
  Utils.log(message, process.argv[2]);
}

async function main(){
  let res;

  switch(process.argv[2]){
    case 'list_indexes':
      res = await client.cat.indices();
      log(res.body);
      break;

    case 'list_harvester_states':
      res = await client.search({
        index: esHarvesterStateIndex,
        body: {
          query: {
            match_all: {},
          }
        }
      });
      log(res.body.hits.hits);
      break;

    case 'setup_indexes':
      res = await activityStore.setupIndex();
      log(res);
      break;

    default:
      Utils.log("Usage: harvester-dev-tool.js [ list_indexes | list_harvester_states | setup_indexes ]");
  }
}

main();