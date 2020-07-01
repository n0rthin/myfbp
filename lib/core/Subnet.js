class Subnet {
  constructor({ parentNet, subnetName, component }) {
    this.parentNet = parentNet;
    this.component = component;
    this.name = subnetName;
    this.connect = this.parentNet.connect.bind(this.parentNet);
    this.portChildProcessMap = new Map();
  }

  addProcess(component, name) {
    return this.parentNet.addProcess(component, this._getChildName(name));
  }

  connectMother(childProc, portName, motherPortName) {
    const isHasPort = childProc instanceof Subnet ? childProc.portChildProcessMap.has(portName) : childProc.getPort(portName);
    if (!isHasPort) {
      throw new Error(`Process ${childProc.name} does not have port with name ${portName}`);
    }

    if (!motherPortName) motherPortName = portName;

    const isMotherPortExistsInSpecification = [
      ...this.component.inports,
      ...this.component.outports
    ].some(inport => {
      return inport.name === motherPortName;
    });

    if (!isMotherPortExistsInSpecification) {
      throw new Error(`Component ${this.component.name} does not have port with name ${motherPortName}`);
    }

    this.portChildProcessMap.set(motherPortName, { childProc, portName });
  }

  getLinkedToPortProcess(motherPortName) {
    const childProcMap = this.portChildProcessMap.get(motherPortName);

    if (!childProcMap) return null;

    if (childProcMap.childProc instanceof Subnet) {
      return childProcMap.childProc.getLinkedToPortProcess(childProcMap.portName);
    }

    return childProcMap;
  }

  _getProcPortOrThrow(proc, portName) {
    const port = proc.getPort(portName);

    if (!port) {
      throw new Error(`Process ${proc.name} does not have port with name ${portName}`);
    }

    return port;
  }

  _getChildName(procName) {
    return `${this.name}>${procName}`;
  }
}

module.exports = Subnet;