import hash from 'object-hash';

/** This is used in stage 2, and holds information on a normalised event.
Pipelines can create any number of these as they process data.
**/
class NormalisedEvent {
  constructor(refinedData, rawData) {
    this.body = refinedData;
    this.data = rawData;
  }

  id(){
    return hash(this.data)
  }

}

export default NormalisedEvent;
