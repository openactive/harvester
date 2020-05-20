import RPDEItem from './rpde-data.js';

class RPDEItemUpdate extends RPDEItem {
  constructor(activityItem, publisherKey, feedKey) {
    super(activityItem, publisherKey, feedKey)
    this.data = activityItem.data;  // capturing entire data object
    this.kind = activityItem.kind;
    this.data_id = ('id' in activityItem.data ? activityItem.data.id : activityItem.data['@id']);
    this.data_type = ('type' in activityItem.data ? activityItem.data.type : activityItem.data['@type']);
    this.deleted = false;
  }
}

export default RPDEItemUpdate;
