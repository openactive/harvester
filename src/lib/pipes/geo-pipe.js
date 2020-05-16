import Pipe from './pipe.js';
import { cache } from '../utils.js';
import fetch from 'node-fetch';
import Utils from '../utils.js';
import Settings from '../settings.js';


class GeoPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      for(let idx in this.normalisedEvents) {

        let loc = this.normalisedEvents[idx].body['location'] ? this.normalisedEvents[idx].body['location'] : this.normalisedEvents[idx].body['beta:affiliatedLocation'];

        if ('postcode' in loc) {

          const postCode = loc['postcode'];

          if (cache.postcodes[postCode]){

            Utils.log(`Geopipe cache hit ${postCode}`);

            this.normalisedEvents[idx].body['location'] = Object.assign(this.normalisedEvents[idx].body['location'], cache.postcodes[postCode]);

          } else {

            Utils.log(`Geopipe looking up ${postCode}`);

            try {
              let url = 'https://postcodes.io/postcodes/' + postCode;
              const res = await fetch(url);
              const postCodeResult =  await res.json();

              if (postCodeResult.status == 200) {

                Utils.log(`Geopipe looking up ${postCode} GOT RESULT`);

                cache.postcodes[postCode] = {
                  "coordinates": [postCodeResult.result.longitude,postCodeResult.result.latitude],
                  "locality": postCodeResult.result.admin_district,
                  "region": postCodeResult.result.region,
                  "country": postCodeResult.result.country
                };

                this.normalisedEvents[idx].body['location'] = Object.assign(this.normalisedEvents[idx].body['location'], cache.postcodes[postCode]);

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
