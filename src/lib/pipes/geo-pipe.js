import Pipe from './pipe.js';
import { cache } from '../utils.js';
import fetch from 'node-fetch';

class GeoPipe extends Pipe {
  run(){
    return new Promise(async resolve => {
      console.log(`Running ${this.rpdeItemUpdate.api_id} - ${this.rpdeItemUpdate.data.name} through ${this.constructor.name}`);
      let data = this.rpdeItemUpdate.data;

      if (data.location && data.location.geo && data.location.geo.latitude){
        console.log("Location data already exists!");
        this.rpdeItemUpdate["location-geo"] = {
          "latitude": data.location.geo.latitude,
          "longitude": data.location.geo.longitude
        }

      } else if (data.location && data.location.address && data.location.address.postalCode) {
        console.log("Looking up postcode data");
        const postCode = data.location.address.postalCode;

        if (cache.postcodes[postCode]){
          console.log("Post code CACHE HIT!");
          this.rpdeItemUpdate['location-geo'] = cache.postcodes[postCode];
        } else {
          console.log("Going to postcode API for data");
          /* DEV TODO api key
          const res = await fetch("https://mapit.mysociety.org/postcode/"+postCode);
          see npm run test-service
          */
          const res = await fetch("https://localhost:3001/postcode/"+postCode);
          const postCodeResult =  await res.json();

          this.rpdeItemUpdate['location-geo'] = {
            "latitude": postCodeResult.wgs84_lat,
            "longitude": postCodeResult.wgs84_lon
          }

          cache.postcodes[postCode] = this.rpdeItemUpdate['location-geo'];
        }
      } else {
        console.log("Can't get postcode insufficient data");
      }
      resolve(this.rpdeItemUpdate);
    });
  }
}

export default GeoPipe;