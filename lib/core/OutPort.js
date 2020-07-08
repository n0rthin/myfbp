const Port = require('./Port');
const { ProcessStatus } = require('./constants');

class OutPort extends Port {
  async send(ip) {
    if (ip.owner !== this.runtime.currProc) {
      console.log(`IP being sent not owned by current process.
      Current process ${this.runtime.currProc.name}. IP owner ${ip.owner.name}`);
      return;
    }
    
    const addIpResult = this.connection.addIp(ip);
    
    if (addIpResult === -1) {
      this.runtime.currProc.status = ProcessStatus.WaitingToSend;
      await this.runtime.yieldCurrentProc();

      this.connection.addIp(ip);
    }

    const downProcStatus = this.connection.downProcess.status;
    if (
      ProcessStatus.NotInitialized === downProcStatus ||
      ProcessStatus.Suspended === downProcStatus ||
      ProcessStatus.WaitingToReceive === downProcStatus
    ) {
      this.runtime.enqueue(this.connection.downProcess);
      this.connection.downProcess.status = ProcessStatus.ReadyToExecute;
    }

    this.runtime.currProc.ownedIps--;
  }
}

module.exports = OutPort;