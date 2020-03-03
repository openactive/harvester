import RPDEItem from './rpde-data.js';

class RPDEItemDelete extends RPDEItem {
  constructor(activityItem, publisherKey, feedKey) {
    super(activityItem, publisherKey, feedKey)
    this.deleted = true;
  }
}

export default RPDEItemDelete;
