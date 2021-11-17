import { BinaryHeap } from './binary-heap.js';
import * as Util from './utils.js';

class TimeQ {

  constructor() {
    this._newHeap = () => new BinaryHeap(x => x['timestamp']);
    this._heap = this._newHeap();
  }

  init() {
    const storedHeapString = game.settings.get("lostlands", "timeQ");
    let storedHeap = JSON.parse(storedHeapString);
    if (!Array.isArray(storedHeap)) storedHeap = [];
    this._heap.content = storedHeap;
    console.log(`TimeQ initialized with ${this._heap.size()} pending events`)
  }

  next() {
    return this._heap.peek();
  }

  async save() {
    const heapString = JSON.stringify(this._heap.content);
    await game.settings.set("lostlands", "timeQ", heapString);
    console.log('TimeQ saved', game.settings.get("lostlands", "timeQ"));
  }

  clear() {
    this._heap = this._newHeap();
    this.save();
    console.log('TimeQ cleared');
  }

  cancel(id) {
    this._heap.remove(id, e => e.id);
    console.log('TimeQ event cancelled by id', id);
  }

  doAt( timestamp, macro={ id:'', scope:{} }, id=Util.uniqueId() ) {
    if (!macro.id) return;
    const event = { timestamp, macro, id };
    this._heap.push(event);
    this.save();
    console.log('TimeQ event scheduled', event);
    return event.id;
  }

  doIn( interval={ day:0, hour:0, minute:0, second:0 }, macro={ id:'', scope:{} } ) {
    const currentTime = game.time.worldTime;
    const timestamp = SimpleCalendar.api.timestampPlusInterval(currentTime, interval);
    return this.doAt(timestamp, macro);
  }

  async doEvery( interval={day:0, hour:0, minute:0, second:0}, macro={ id:'', scope:{} } ) {
    const seconds = SimpleCalendar.api.timestampPlusInterval(0, interval);
    const currentTime = game.time.worldTime;
    return this.doFrom(seconds, currentTime, macro);
  }

  async doFrom( seconds, start, macro={ id:'', scope:{} }, id=Util.uniqueId() ) {
    const nextTime = seconds + start;
    // schedule given macro
    this.doAt(nextTime, macro);
    // create and schedule new macro to reschedule given macro
    const macroData = {
      name: `TimeQ | doFrom`,
      type: 'script',
      command: `return game.lostlands.TimeQ.doFrom(seconds, start, macro, id);`,
      flags: { "lostlands.attrMacro": true }
    };
    let doFromMacro = game.macros.find(m => (m.name === macroData.name && m.data.command === macroData.command));
    if (!doFromMacro) {
      doFromMacro = await Macro.create(macroData);
    }
    const doFromMacroData = {
      id: doFromMacro.id, 
      scope: {
        seconds, 
        start: nextTime, 
        macro, 
        id
      }
    };
    return this.doAt(nextTime, doFromMacroData, id);
  }

  * eventsBefore(timestamp) {
    let doSave = false;
    let nextEventTs = this.next()?.timestamp;
    while (nextEventTs <= timestamp) {
      yield this._heap.pop();
      doSave = true;
      nextEventTs = this.next()?.timestamp;
    }
    doSave && this.save();
  }
}

export const instance = new TimeQ();
