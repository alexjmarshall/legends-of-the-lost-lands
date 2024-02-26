import { BinaryHeap } from './binary-heap.js';
import * as Util from './utils.js';

class TimeQueue {
  constructor() {
    if (TimeQueue._instance) {
      return TimeQueue._instance;
    }
    TimeQueue._instance = this;
    this._newHeap = () => new BinaryHeap((x) => x['timestamp']);
    this._heap = this._newHeap();
  }

  init() {
    const storedHeapString = game.settings.get('brigandine', 'timeQ');
    let storedHeap = JSON.parse(storedHeapString);
    if (!Array.isArray(storedHeap)) storedHeap = [];
    this._heap.content = storedHeap;
    console.log(`TimeQ initialized with ${this._heap.size()} pending events`);
  }

  next() {
    return this._heap.peek();
  }

  async save() {
    const heapString = JSON.stringify(this._heap.content);
    while (!game?.ready) {
      await Util.wait(50);
    }
    return game.settings.set('brigandine', 'timeQ', heapString);
  }

  async clear() {
    this._heap = this._newHeap();
    console.log('TimeQ cleared');
    return this.save();
  }

  find(id) {
    return this._heap.find(id, (e) => e.id);
  }

  async cancel(id) {
    const result = this._heap.remove(id, (e) => e.id);
    if (result) {
      console.log('TimeQ event cancelled by id', id);
      return this.save();
    }
  }

  async doAt(timestamp, macroId, scope = {}, id = Util.uniqueId()) {
    //TODO param for deleting the macro on execution?
    if (!macroId) return;

    // add timestamp to macro scope
    scope.execTime = timestamp;
    const event = { timestamp, macroId, scope, id };

    this._heap.push(event);
    console.log(`TimeQ event scheduled at ${event.timestamp}`);
    await this.save();

    return event.id;
  }

  async doIn(interval = { day: 0, hour: 0, minute: 0, second: 0 }, macroId, scope = {}) {
    const now = Util.now();
    const timestamp = SimpleCalendar.api.timestampPlusInterval(now, interval);
    return this.doAt(timestamp, macroId, scope);
  }

  async doEvery(
    interval = { day: 0, hour: 0, minute: 0, second: 0 },
    start,
    macroId,
    scope = {},
    id = Util.uniqueId()
  ) {
    // create new macro that combines the given macro with a statement to reschedule itself
    const givenMacro = game.macros.get(macroId);
    const givenMacroCommand = givenMacro.data.command.replace(/return\s+/, '');
    const newMacroName = `TimeQ | doEvery ${givenMacro.name}`;
    const newMacroCommand = `const result = await ${givenMacroCommand};
                            if (result === false) return;
                            return game.brigandine.TimeQ._scheduleDoEvery(interval, start, newTime, macroId, scope, id);`;
    const newMacro = await Util.getMacroByCommand(newMacroName, newMacroCommand);

    return this._scheduleDoEvery(interval, start, start, newMacro._id, scope, id);
  }

  async _scheduleDoEvery(interval, start, newTime, macroId, scope, id = Util.uniqueId()) {
    // if actorId in scope, ensure actor still exists in game
    if (scope.actorId && !game.actors.get(String(scope.actorId))) return;
    const nextTime = Util.nextTime(interval, start, newTime);
    scope = {
      ...scope,
      interval,
      start: nextTime,
      macroId,
      scope: { ...scope },
      id,
    };

    return this.doAt(nextTime, macroId, scope, id);
  }

  async *eventsBefore(timestamp) {
    let nextEventTs = this.next()?.timestamp;
    let doSave = false;
    while (nextEventTs <= timestamp) {
      const event = this._heap.pop();
      console.log(`TimeQ handling event id ${event.id}`);
      yield event;
      doSave = true;
      nextEventTs = this.next()?.timestamp;
    }
    doSave && this.save();
  }
}

export const TimeQ = new TimeQueue();
