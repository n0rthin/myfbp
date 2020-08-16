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

    
    while (!this.connection.hasIp()) {
      if (this.connection.closed) return null;

      this.runtime.currProc.status = ProcessStatus.WaitingToReceive;
      await this.runtime.yieldCurrentProc(this);
    }

    let ip = this.connection.getNextIp();
    
    if (ip) {
      ip.owner = this.runtime.currProc;
      this.runtime.currProc.ownedIps++;

      this.connection.upProcesses
        .filter(upProcess => upProcess.status === ProcessStatus.WaitingToSend)
        .forEach(upProcess => {
          upProcess.status = ProcessStatus.ReadyToExecute;
          upProcess.outports
            .filter(port => port.connection === this.connection)
            .forEach(port => {
              this.runtime.enqueue(upProcess, port);
            });
        });
    }

    return ip;
  }
}

module.exports = InPort;