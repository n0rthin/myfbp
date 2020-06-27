const Process = require('./Process');
const Connection = require('./Connection');
const IIPConnection = require('./IIPConnection');
const IP = require('./IP');

class Network {
  processes = new Map();

  constructor({ runtime }) {
    this.runtime = runtime;
  }

  addProcess(component, name) {
    name = name || component.name;

    if (!name) {
      throw new Error('Process must have a name');
    }

    if (this.processes.has(name)) {
      throw new Error(`Duplicate process name "${name}`);
    }
    
    const process = new Process({ component, runtime: this.runtime, name });
    
    this.processes.set(name, process);

    return process;
  }

  connect(upProcess, upPortName, downProcess, downPortName, capacity) {
    const downPort = downProcess.getPort(downPortName);
    const upPort = upProcess.getPort(upPortName);

    if (!downPort) {
      throw new Error(`Process does not have port "${downPortName}"`);
    }

    if (!upPort) {
      throw new Error(`Process does not have port "${upPortName}"`);
    }

    if (downPort.connection) {
      downPort.connection.connectUpProcess(upProcess);
      upPort.setConnection(downPort.connection);

      return;
    }

    const connection = new Connection({ capacity });

    connection.connectUpProcess(upProcess);
    connection.connectDownProcess(downProcess);

    upPort.setConnection(connection);
    downPort.setConnection(connection);
  }

  initialize(process, portName, iipContent) {
    const iipConnection = new IIPConnection({ iipContent });
    const port = process.getPort(portName);

    if (!port) {
      throw new Error(`Process does not have port "${portName}"`);
    }

    port.setConnection(iipConnection);
    iipConnection.connectDownProcess(process);
  }

  run({ trace } = {}) {
    if (trace) global.fbpTrace = true;
    
    this.runtime.run({
      processes: this.processes
    });
  }
}

module.exports = Network;