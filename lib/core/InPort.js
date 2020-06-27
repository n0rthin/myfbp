const Port = require('./Port');
const { ProcessStatus } = require('./constants');
const IIPConnection = require('./IIPConnection');

class InPort extends Port {
  receiveIp() {
    if (!this.connection) return null
    
    if (this.connection instanceof IIPConnection) {
      if (this.connection.closed) {
        return null;
      }

      this.connection.closed = true;

      return this.proc.createIp(this.connection.iipContent);
    }

    this.connection.upProcesses.forEach(upProcess => {
      if (upProcess.status === ProcessStatus.WaitingToSend) {
        upProcess.status = ProcessStatus.ReadyToExecute;
        this.runtime.enqueue(upProcess);
      }
    });

    return this.connection.getNextIp();
  }
}

module.exports = InPort;