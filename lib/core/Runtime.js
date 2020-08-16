const IIPConnection = require('./IIPConnection');
const { ProcessStatus } = require('./constants');
const trace = require('./trace');
const Enum = require('./Enum');
const Callbacks = require('./Callbacks');

const ProcState = Enum([
  'UpStreamClosed',
  'HasData',
  'NoData'
]);

class Runtime {
  queue = [];
  _currProc = null;
  _callbacks = new Callbacks();
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

    startupProcesses.map(proc => this.enqueue(proc));

    const runTick = async () => {
      await this._tick();

      if (this._isAllProcessesAreClosed()) return;

      setTimeout(runTick, 50);
    }

    await runTick();
  }

  enqueue(proc, cbId) {
    this.queue.push({ proc, cbId });
  }

  yieldCurrentProc(cbId) {
    return new Promise(resolve => {
      this._callbacks.addCallbackToProc(this._currProc, cbId, resolve);
    });
  }

  enqueueAsyncCb(promise) {
    const proc = this._currProc;

    (async () => {
      try {
        const data = await promise;
        this._callbacks.addCallbackDataOrErr(proc, promise, null, data);
      } catch (err) {
        this._callbacks.addCallbackDataOrErr(proc, promise, err, null);
      } finally {
        this.enqueue(proc, promise);
      }
    })();

    proc.status = ProcessStatus.PendingCallback;

    return new Promise((resolve, reject) => {
      const callback = (err, data) => {
        if (err) reject(err);
        else resolve(data);
      };

      this._callbacks.addCallbackToProc(proc, promise, callback);
    });
  }

  async _tick() {
    // trace('[Queue] ' + this.queue.map(proc => proc.name).join(', '));
    let { proc: currProc, cbId } = this.queue.shift() || {};
    this._currProc = currProc;
    
    while (currProc) {
      
      if (currProc.status !== ProcessStatus.Closed) {
        currProc.status = ProcessStatus.Active;
        
        if (this._callbacks.isProcHasCallbacks(currProc)) {
          this._callbacks.callCallbackByIdOrFirst(currProc, cbId);
          this._callbacks.removeCallback(currProc, cbId);
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
          const port = this._getFirstPortWithData(currProc);
          this.enqueue(currProc, port);
        }
      }
      
      // trace('[Queue] ' + this.queue.map(proc => proc.name).join(', '));
      const nextQueuedProc = this.queue.shift() || {};
      currProc = this._currProc = nextQueuedProc.proc;
      cbId = nextQueuedProc.cbId;
    }
  }
  
  _closeProc(proc) {
    proc.status = ProcessStatus.Closed;

    proc.outports.forEach(outPort => {
      if (!outPort.connection) return;
      
      outPort.connection.closed = true;
      
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

    this._callbacks.removeAllCallbacks(proc);

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
    const hasData = !!this._getFirstPortWithData(proc);

    if (!hasData && this._isProcUpstreamClosed(proc)) return ProcState.UpStreamClosed;

    return hasData ? ProcState.HasData : ProcState.NoData;
  }

  _getFirstPortWithData(proc) {
    const port = proc.inports.find(port => {
      if (port.connection instanceof IIPConnection) return false;
      
      return port.connection && port.connection.ips.length > 0;
    });

    return port || null;
  }
}

module.exports = Runtime;