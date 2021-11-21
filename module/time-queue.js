import { BinaryHeap } from './binary-heap.js';
import * as Util from './utils.js';

class TimeQueue {

  constructor() {
    if (TimeQueue._instance) {
      return TimeQueue._instance
    }
    TimeQueue._instance = this;
    this._newHeap = () => new BinaryHeap(x => x['timestamp']);
    this._heap = this._newHeap();
  }

  async init() {
    try {
      const storedHeapString = game.settings.get("lostlands", "timeQ");
      let storedHeap = JSON.parse(storedHeapString);
      if (!Array.isArray(storedHeap)) storedHeap = [];
      this._heap.content = storedHeap;
      console.log(`TimeQ initialized with ${this._heap.size()} pending events`)
    } catch (error) {
      console.error(error);
      this.clear();
      this.save();
    }
  }

  next() {
    return this._heap.peek();
  }

  async save() {
    const heapString = JSON.stringify(this._heap.content);
    return game.settings.set("lostlands", "timeQ", heapString);
  }

  clear() {
    this._heap = this._newHeap();
    console.log('TimeQ cleared');
  }

  cancel(id) {
    const result = this._heap.remove(id, e => e.id);
    if (result) {
      console.log('TimeQ event cancelled by id', id);
    }
  }

  doAt(timestamp, macroId, scope={}, id=Util.uniqueId()) {
    if (!macroId) return;
    // add timestamp to macro scope
    scope.execTime = timestamp;
    const event = { timestamp, macroId, scope, id };
    this._heap.push(event);
    console.log('TimeQ event scheduled', event);
    return event.id;
  }

  doIn(interval={day:0, hour:0, minute:0, second:0}, macroId, scope={}) {
    const now = Util.now();
    const timestamp = SimpleCalendar.api.timestampPlusInterval(now, interval);
    return this.doAt(timestamp, macroId, scope);
  }

  async doEvery (
    interval = {day:0, hour:0, minute:0, second:0},
    from = Util.now(),
    macroId,
    scope = {},
    id = Util.uniqueId()
  ) {
    const seconds = SimpleCalendar.api.timestampPlusInterval(0, interval);

    // create new macro that combines the given macro with a statement to reschedule itself
    const givenMacro = game.macros.get(macroId);
    const givenMacroCommand = givenMacro.data.command.replace(/return\s+/, '')
    const newMacroName = `TimeQ | doEvery ${givenMacro.name}`,
          newMacroCommand = `await ${givenMacroCommand}; return game.lostlands.TimeQ._scheduleDoEvery(seconds, start, macroId, scope, id);`
    const newMacro = await Util.getMacroByCommand(newMacroName, newMacroCommand);

    return this._scheduleDoEvery(seconds, from, newMacro.id, scope, id);
  }

  async _scheduleDoEvery(seconds, start, macroId, scope, id=Util.uniqueId()) {
    const nextTime = seconds + start;
    scope = {
      ...scope,
      seconds,
      start: nextTime,
      macroId,
      scope: {...scope},
      id
    };

    return this.doAt(nextTime, macroId, scope, id);
  }

  * eventsBefore(timestamp) {
    let nextEventTs = this.next()?.timestamp;
    while (nextEventTs <= timestamp) {
      yield this._heap.pop();
      nextEventTs = this.next()?.timestamp;
    }
  }
}

export const TimeQ = new TimeQueue();
