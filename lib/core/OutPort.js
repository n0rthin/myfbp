const Port = require('./Port');
const { ProcessStatus } = require('./constants');

class OutPort extends Port {
  send(ip) {
    if (ip.owner !== this.runtime.currProc) {
      console.log(`IP being sent not owned by current process.
      Current process ${this.runtime.currProc.name}. IP owner ${ip.owner.name}`);
      return;
    }

    const procStatus = this.connection.downProcess.status;
    if (
      ProcessStatus.NotInitialized === procStatus ||
      ProcessStatus.Suspended === procStatus ||
      ProcessStatus.WaitingToReceive === procStatus
    ) {
      this.runtime.enqueue(this.connection.downProcess);
      this.connection.downProcess.status = ProcessStatus.ReadyToExecute;
    }

    if (this.connection.isFull()) {
      this.runtime.currProc.status = ProcessStatus.WaitingToSend;
    } else {
      this.connection.addIp(ip);
      this.runtime.currProc.ownedIps--;
    }
  }
}

module.exports = OutPort;