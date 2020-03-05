import Pipe from './pipe.js';
import { cache } from '../utils.js';
import fetch from 'node-fetch';
import Utils from '../utils.js';
import Settings from '../settings.js';


class GeoPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      for(let idx in this.normalisedEvents) {

        if ('postcode' in this.normalisedEvents[idx].body['location']) {

          const postCode = this.normalisedEvents[idx].body['location']['postcode'];

          if (cache.postcodes[postCode]){

            Utils.log(`Geopipe cache hit ${postCode}`);

            this.normalisedEvents[idx].body['location'] = Object.assign(this.normalisedEvents[idx].body['location'], cache.postcodes[postCode])

          } else {

            Utils.log(`Geopipe looking up ${postCode}`);

            try {
              let url = Settings.mapItURL + '/postcode/' + postCode;
              if (Settings.mapItAPIKey) {
                url += '?api_key=' + Settings.mapItAPIKey;
              }
              const res = await fetch(url);
              // TODO  detect non 200 responses
              const postCodeResult =  await res.json();

              if (postCodeResult.wgs84_lon || postCodeResult.wgs84_lat) {

                Utils.log(`Geopipe looking up ${postCode} GOT RESULT`);

                cache.postcodes[postCode] = {
                  "coordinates": [postCodeResult.wgs84_lon,postCodeResult.wgs84_lat]
                };

                for(let areaIdx in postCodeResult.areas) {
                  if (postCodeResult.areas[areaIdx].type_name == "Unitary Authority") {
                    cache.postcodes[postCode]['unitary_authority'] = postCodeResult.areas[areaIdx].name;
                  }
                }

                this.normalisedEvents[idx].body['location'] = Object.assign(this.normalisedEvents[idx].body['location'], cache.postcodes[postCode])
              }

            } catch (e) {
              Utils.log(`Geopipe could not get postcode ${postCode} Error \n ${e}`);
            }
          }

        }

      }
      resolve(this.normalisedEvents);
    });
  }
}

export default GeoPipe;