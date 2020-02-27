

class RPDEItemUpdate {
  constructor(item, publisher) {
    this.data = item.data;
    this.api_id = item.id;
    this.kind = item.kind;
    this.publisher = publisher;
  }
}

export default RPDEItemUpdate