
class RawData {
  constructor(data) {
    this.data = data._source.data;
    this.meta = data._source;
  }


}

export default RawData;
