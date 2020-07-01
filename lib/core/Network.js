const Process = require('./Process');
const Connection = require('./Connection');
const Subnet = require('./Subnet');
const IIPConnection = require('./IIPConnection');

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
    
    let process;

    if (typeof component.buildSubnet === 'function') {
      const subnet = new Subnet({ parentNet: this, component, subnetName: name });
      component.buildSubnet(subnet);

      return subnet;
    } else {
      process = new Process({ component, runtime: this.runtime, name });
    }
    
    this.processes.set(name, process);

    return process;
  }

  connect(upProcess, upPortName, downProcess, downPortName, capacity) {
    if (upProcess instanceof Subnet) {
      const { childProc, portName } = upProcess.getLinkedToPortProcess(upPortName);
      if (!childProc) throw new Error(`${upProcess.name} does not have child process linked to ${upPortName} port`);

      upProcess = childProc;
      upPortName = portName;

    }

    if (downProcess instanceof Subnet) {
      const { childProc, portName } = downProcess.getLinkedToPortProcess(downPortName);
      if (!childProc) throw new Error(`${downProcess.name} does not have child process linked to ${downPortName} port`);

      downProcess = childProc;
      downPortName = portName;
    }
    
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

    const connection = new Connection({ capacity, runtime: this.runtime });

    connection.connectUpProcess(upProcess);
    connection.connectDownProcess(downProcess);

    upPort.setConnection(connection);
    downPort.setConnection(connection);
  }

  initialize(process, portName, iipContent) {
    if (process instanceof Subnet) {
      const { childProc, portName: childPortName } = process.getLinkedToPortProcess(portName);
      process = childProc;
      portName = childPortName;
    }
    
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