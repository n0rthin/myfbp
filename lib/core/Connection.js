const { ProcessStatus } = require('./constants');

class Connection {
  upProcesses = [];
  downProcess = null;
  ips = [];
  queue = [];
  capacity = 10;
  closed = false;

  constructor({ capacity, runtime } = {}) {
    this.capacity = typeof capacity === 'number' ? capacity : this.capacity;
    this.runtime = runtime;
  }

  connectUpProcess(upProcess) {
    this.upProcesses.push(upProcess);
  }

  connectDownProcess(downProcess) {
    if (this.downProcess) {
      throw new Error('Connection cannot have more than 1 down process');
    }

    this.downProcess = downProcess;
  }

  isFull() {
    return this.ips.length === this.capacity;
  }

  isUpStreamClosed() {
    return this.upProcesses.every(process => process.status === ProcessStatus.Closed);
  }

  addIp(ip) {
    return new Promise(resolve => {
      if (this.ips.length === this.capacity) {
        console.log(`[${this.runtime.currProc.name}] Trying to send IP to a full connection. Maybe you forgot to place 'yield' before calling send method.`)
        this.queue.unshift({
          resolve,
          ip
        });
      } else {
        this.ips.unshift(ip);
        resolve();
      }
    });
  }

  getNextIp() {
    const nextIp = this.ips.pop() || null;
    this._processQueue();

    if (nextIp) {
      nextIp.owner = this.downProcess;
    }
    
    return nextIp;
  }

  _processQueue() {
    const queuedIp = this.queue.pop();

    if (!queuedIp) return;

    this.ips.unshift(queuedIp.ip);

    queuedIp.resolve();
  }
}

module.exports = Connection;