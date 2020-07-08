const Port = require('./Port');
const { ProcessStatus } = require('./constants');
const IIPConnection = require('./IIPConnection');

class InPort extends Port {
  async receiveIp() {
    if (!this.connection) return null
    
    if (this.connection instanceof IIPConnection) {
      if (this.connection.closed) {
        return null;
      }

      this.connection.closed = true;

      return this.proc.createIp(this.connection.iipContent);
    }

    let ip = this.connection.getNextIp();
    
    if (!ip) {
      this.runtime.currProc.status = ProcessStatus.WaitingToReceive;
      await this.runtime.yieldCurrentProc();
      
      ip = this.connection.getNextIp();
    };

    this.connection.upProcesses.forEach(upProcess => {
      if (upProcess.status === ProcessStatus.WaitingToSend) {
        upProcess.status = ProcessStatus.ReadyToExecute;
        this.runtime.enqueue(upProcess);
      }
    });

    ip.owner = this.runtime.currProc;
    this.runtime.currProc.ownedIps++;

    return ip;
  }
}

module.exports = InPort;