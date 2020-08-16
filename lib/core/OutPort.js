const Port = require('./Port');
const { ProcessStatus } = require('./constants');

class OutPort extends Port {
  async send(ip) {
    if (ip.owner !== this.runtime.currProc) {
      console.log(`IP being sent not owned by current process.
      Current process ${this.runtime.currProc.name}. IP owner ${ip.owner.name}`);
      return;
    }
    
    if (!this.connection) {
      console.log(`Process "${this.runtime.currProc.name}" is trying to send ip to the port "${this.name}", but it was not connected to any processes`);
      return;
    }

    const addIpResult = this.connection.addIp(ip);
    
    if (addIpResult === -1) {
      this.runtime.currProc.status = ProcessStatus.WaitingToSend;
      await this.runtime.yieldCurrentProc(this);

      this.connection.addIp(ip);
    }

    const downProc = this.connection.downProcess;
    const downProcStatus = downProc.status;

    if (
      ProcessStatus.NotInitialized === downProcStatus ||
      ProcessStatus.Suspended === downProcStatus ||
      ProcessStatus.WaitingToReceive === downProcStatus
    ) {
      const downInPort = downProc.inports.find(port => port.connection === this.connection);

      this.runtime.enqueue(downProc, downInPort);
      downProc.status = ProcessStatus.ReadyToExecute;
    }

    this.runtime.currProc.ownedIps--;
  }
}

module.exports = OutPort;