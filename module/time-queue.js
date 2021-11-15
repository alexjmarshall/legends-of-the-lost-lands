import { PriorityQueue } from './priority-queue.js';

class TimeQueue extends PriorityQueue {

  constructor() {

    super((a, b) => a[0] > b[0]);
  }

  init() {

    try {

      const string = game.settings.get("lostlands", "timeQueue");
      this._heap = JSON.parse(string);
      if (!Array.isArray(this._heap)) {
        throw new Error('Problem parsing saved time queue. Clearing queue.');
      }
      console.log(`Time Queue initialized with: ${timeQueue.size()} pending events`);
    } catch (error) {

      console.error(error);
      this.clear();
      this.save();
      this.init();
    }
  }

  save() {

    const string = JSON.stringify(this._heap);
    game.settings.set("lostlands", "timeQueue", string);
  }

  clear() {

    this._heap = [];
  }
}

export const timeQueue = new TimeQueue();
