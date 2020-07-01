const IIPConnection = require('./IIPConnection');
const { ProcessStatus } = require('./constants');
const trace = require('./trace');
const Enum = require('./Enum');

const ProcState = Enum([
  'UpStreamClosed',
  'HasData',
  'NoData'
]);

class Runtime {
  queue = [];
  _currProc = null;

  get currProc() {
    return this._currProc
  }

  async run({ processes }) {
    this.processes = processes;
    trace('Start runtime');

    const startupProcesses = [...this.processes.values()].filter(process => {
      const allConnections = process.inports
        .filter(inport => inport.connection)
        .map(inport => inport.connection);

      return (
        allConnections.length === 0 ||
        allConnections.every(connection => connection instanceof IIPConnection)
      );
    });

    trace(`${startupProcesses.length} startup processes: ${startupProcesses.map(proc => proc.component.name).join(', ')}`);

    if (startupProcesses.length === 0) return;

    this.queue.push(...startupProcesses);

    while(!this._isAllProcessesAreClosed()) {
      await this.tick();
    }
  }

  enqueue(proc) {
    this.queue.push(proc);
  }

  async tick() {
    // trace('[Queue] ' + this.queue.map(proc => proc.name).join(', '));
    let currProc = this._currProc = this.queue.shift();
    
    while (currProc) {
      
      if (currProc.status !== ProcessStatus.Closed) {
        currProc.status = ProcessStatus.Active;
        
        await currProc.execute();
        
        const procState = this._getProcState(currProc);
        
        if (procState === ProcState.UpStreamClosed && (currProc.status !== ProcessStatus.WaitingToSend)) {
          this._closeProc(currProc);
        } else if (procState === ProcState.HasData) {
          this.enqueue(currProc);
        }
      }
      
      // trace('[Queue] ' + this.queue.map(proc => proc.name).join(', '));
      currProc = this._currProc = this.queue.shift();
    }
  }
  
  _closeProc(proc) {
    proc.outports.forEach(outPort => {
      if (!outPort.connection) return;

      if ([ProcessStatus.NotInitialized, ProcessStatus.Suspended].includes(outPort.connection.downProcess.status)) {
        this.enqueue(outPort.connection.downProcess);
      }
    });

    proc.inports.forEach(inPort => {
      if (!inPort.connection || inPort.connection instanceof IIPConnection) return;

      inPort.connection.upProcesses.forEach(upProc => {
        if (upProc.status === ProcessStatus.WaitingToSend) {
          this.enqueue(upProc);
        }
      });
    });

    proc.status = ProcessStatus.Closed;

    if (proc.ownedIps > 0) {
      console.log(`Process "${proc.name}" has been closed without disposing of all IPs`);
    }
  }

  _isAllProcessesAreClosed() {
    return [...this.processes.values()].every(proc => proc.status === ProcessStatus.Closed);
  }

  _isProcUpstreamClosed(proc) {
    return proc.inports.every(inport => {
      return (
        !inport.connection ||
        inport.connection instanceof IIPConnection ||
        inport.connection.isUpStreamClosed()
      );
    });
  }

  _getProcState(proc) {
    if (this._isProcUpstreamClosed(proc)) return ProcState.UpStreamClosed;

    const hasData = proc.inports.some(port => {
      if (port.connection instanceof IIPConnection) return false;
      
      return port.connection && port.connection.ips.length > 0;
    });

    return hasData ? ProcState.HasData : ProcState.NoData;
  }
}

module.exports = Runtime;