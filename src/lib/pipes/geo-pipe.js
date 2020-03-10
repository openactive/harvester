import Pipe from './pipe.js';
import { cache } from '../utils.js';
import fetch from 'node-fetch';
import Utils from '../utils.js';
import Settings from '../settings.js';


class GeoPipe extends Pipe {
  run(){
    return new Promise(async resolve => {

      for(let idx in this.normalisedEvents) {

        if ('postcode' in this.normalisedEvents[idx].body['location'] && this.normalisedEvents[idx].body['location']['postcode']) {

          const postCode = this.normalisedEvents[idx].body['location']['postcode'];

          // If not in Cache, try and get it
          if (!cache.postcodes[postCode]){

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

              }

            } catch (e) {
              Utils.log(`Geopipe could not get postcode ${postCode} Error \n ${e}`);
            }
          }

          // If in Cache now, assign it to data
          if (cache.postcodes[postCode]){

            Utils.log(`Geopipe cache hit ${postCode}`);

            this.normalisedEvents[idx].body['location']['locality'] = cache.postcodes[postCode]['locality'];
            this.normalisedEvents[idx].body['location']['region'] = cache.postcodes[postCode]['region'];
            this.normalisedEvents[idx].body['location']['country'] = cache.postcodes[postCode]['country'];
            // If data already has coordinates, assume that's better than what postcode look up will return
            if (!this.normalisedEvents[idx].body['location']['coordinates']) {
              this.normalisedEvents[idx].body['location']['coordinates'] = cache.postcodes[postCode]['coordinates'];
            }

          }

        }

      }
      resolve(this.normalisedEvents);
    });
  }
}

export default GeoPipe;