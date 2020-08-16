const Runtime = require("../../core/Runtime");
const Network = require("../../core/Network");

const A = {
  inports: [{ name: 'IN' }],
  outports: [{ name: 'OUT' }],
  async execute() {
    const inPort = this.getPort('IN');
    const outPort = this.getPort('OUT');
    let ip;

    while (ip = await inPort.receiveIp()) {
      outPort.send(ip);
    }
  }
}

const B = {
  inports: [{ name: 'IN' }],
  outports: [{ name: 'OUT' }],
  async execute() {
    const inPort = this.getPort('IN');
    const outPort = this.getPort('OUT');
    let ip;

    while (ip = await inPort.receiveIp()) {
      if (Math.random() < .5) {
        console.log('send');
        outPort.send(ip);
      } else {
        console.log('drop');
        this.dropIp(ip);
      }
    }
  }
}

const K = {
  inports: [],
  outports: [{ name: 'OUT' }],
  async execute() {
    const outPort = this.getPort('OUT');
    await outPort.send(this.createIp('deadlock'));
  }
}

const runtime = new Runtime();
const network = new Network({ runtime });

const procA = network.addProcess(A, 'ProcA');
const procB = network.addProcess(B, 'ProcB');
const procK = network.addProcess(K, 'ProcK');

network.connect(procA, 'OUT', procB, 'IN');
network.connect(procB, 'OUT', procA, 'IN');
network.connect(procK, 'OUT', procA, 'IN');

network.run({ trace: true });