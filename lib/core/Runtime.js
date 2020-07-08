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
  _pendingCallbacks = new Map();
  _callbacksData = new Map();

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

    const runTick = async () => {
      await this._tick();

      if (this._isAllProcessesAreClosed()) return;

      setTimeout(runTick, 50);
    }

    await runTick();
  }

  enqueue(proc) {
    this.queue.push(proc);
  }

  yieldCurrentProc() {
    return new Promise(resolve => {
      this._pendingCallbacks.set(this._currProc, resolve);
    });
  }

  enqueueAsyncCb(promise) {
    const proc = this._currProc;

    (async () => {
      try {
        const data = await promise;
        this._callbacksData.set(proc, [null, data]);
      } catch (err) {
        this._callbacksData.set(proc, [data, null]);
      } finally {
        this.enqueue(proc);
      }
    })();

    proc.status = ProcessStatus.PendingCallback;

    return new Promise((resolve, reject) => {
      const callback = (err, data) => {
        if (err) reject(err);
        else resolve(data);
      };

      this._pendingCallbacks.set(proc, callback);
    });
  }

  async _tick() {
    // trace('[Queue] ' + this.queue.map(proc => proc.name).join(', '));
    let currProc = this._currProc = this.queue.shift();
    
    while (currProc) {
      
      if (currProc.status !== ProcessStatus.Closed) {
        currProc.status = ProcessStatus.Active;
        
        if (this._pendingCallbacks.has(currProc)) {
          const cbData = this._callbacksData.get(currProc) || [];

          this._pendingCallbacks.get(currProc).call(null, ...cbData);

          this._callbacksData.delete(currProc);
          this._pendingCallbacks.delete(currProc);
        } else {
          currProc.execute();
        }

        await new Promise(resolve => {
          (function checkProcess() {
            if (!(
              currProc.status === ProcessStatus.WaitingToSend ||
              currProc.status === ProcessStatus.WaitingToReceive ||
              currProc.status === ProcessStatus.PendingCallback ||
              currProc.status === ProcessStatus.Suspended
            )) {
              setTimeout(checkProcess, 0);
            } else {
              resolve();
            }
          })();
        });
        
        const procState = this._getProcState(currProc);
        const isProcessNotForClosingOrQueue = [
          ProcessStatus.WaitingToSend,
          ProcessStatus.PendingCallback
        ].includes(currProc.status);

        if (procState === ProcState.UpStreamClosed && !isProcessNotForClosingOrQueue) {
          this._closeProc(currProc);
        } else if (procState === ProcState.HasData && !isProcessNotForClosingOrQueue) {
          this.enqueue(currProc);
        }
      }
      
      // trace('[Queue] ' + this.queue.map(proc => proc.name).join(', '));
      currProc = this._currProc = this.queue.shift();
    }
  }
  
  _closeProc(proc) {
    proc.status = ProcessStatus.Closed;

    proc.outports.forEach(outPort => {
      if (!outPort.connection) return;
      
      const downProc = outPort.connection.downProcess;
      const downProcStatus = downProc.status;

      if ([ProcessStatus.NotInitialized, ProcessStatus.Suspended].includes(downProcStatus)) {
        this.enqueue(outPort.connection.downProcess);
      }

      if (downProcStatus === ProcessStatus.WaitingToReceive && this._isProcUpstreamClosed(downProc)) {
        this._closeProc(downProc);
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
    const hasData = proc.inports.some(port => {
      if (port.connection instanceof IIPConnection) return false;
      
      return port.connection && port.connection.ips.length > 0;
    });

    if (!hasData && this._isProcUpstreamClosed(proc)) return ProcState.UpStreamClosed;

    return hasData ? ProcState.HasData : ProcState.NoData;
  }
}

module.exports = Runtime;