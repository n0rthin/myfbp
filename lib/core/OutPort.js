const Port = require('./Port');
const SendIPResult = require('./SendIPResult');
const { ProcessStatus } = require('./constants');

class OutPort extends Port {
  send(ip) {
    if (
      [ProcessStatus.NotInitialized, ProcessStatus.Suspended].includes(this.connection.downProcess.status)
    ) {
      this.runtime.enqueue(this.connection.downProcess);
      this.connection.downProcess.status = ProcessStatus.ReadyToExecute;
    }

    this.connection.addIp(ip);

    return new SendIPResult({
      isConnectionFull: this.connection.isFull()
    });
  }
}

module.exports = OutPort;