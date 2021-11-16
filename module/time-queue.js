import { BinaryHeap } from './binary-heap.js';

class TimeQueue {

  constructor() {
    this._heap = new BinaryHeap(x => x[0]);
  }

  init() {
    const storedHeapString = game.settings.get("lostlands", "timeQueue");
    let storedHeap = JSON.parse(storedHeapString);
    if (!Array.isArray(storedHeap)) storedHeap = [];
    this._heap.content = storedHeap;
    console.log(`TimeQueue initialized with ${this._heap.size()} pending events`)
  }

  next() {
     return this._heap.peek() || [];
  }

  save() {
    const heapString = JSON.stringify(this._heap.content);
    game.settings.set("lostlands", "timeQueue", heapString);
    console.log('TimeQueue saved', heapString);
  }

  clear() {
    this._heap = new BinaryHeap(x => x[0]);
    this.save();
    console.log('TimeQueue cleared');
  }

  doAt(timestamp, macroId) {
    const event = [timestamp, macroId];
    this._heap.push(event);
    this.save();
    console.log('TimeQueue event added', event);
    return this._heap.size();
  }

  pastEvents(timestamp) {
    let events = [];
    let doSave = false;
    let nextEventTime = this.next()[0];
    while (nextEventTime <= timestamp) {
      const poppedVal = this._heap.pop();
      doSave = true;
      events.push({
        timestamp: poppedVal[0],
        macroId: poppedVal[1]
      });
      nextEventTime = this.next()[0];
    }
    doSave && this.save();
    return events;
  }
}

export const timeQueue = new TimeQueue();
