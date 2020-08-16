const HttpServer = require('./HTTPServer');
const Runtime = require('../../core/Runtime');
const Network = require('../../core/Network');

const runtime = new Runtime();
const network = new Network({ runtime });

const Logger = {
  inports: [{ name: 'IN' }],
  async execute() {
    const inPort = this.getPort('IN');

    let ip;
    while (true) {
      ip = await inPort.receiveIp();
      this.dropIp(ip);
      ip = await inPort.receiveIp();
      console.log(`Request from url: ${ip.content.url}\n`);
      this.dropIp(ip);
      ip = await inPort.receiveIp();
      ip.content.writeHead(200);
      ip.content.end('Hello, World');
      this.dropIp(ip);
      ip = await inPort.receiveIp();
      this.dropIp(ip);
    }
  }
}

const httpServerProc = network.addProcess(HttpServer, 'HttpServer');
const loggerProc = network.addProcess(Logger, 'Logger');

network.initialize(httpServerProc, 'PORT', 8080);
network.connect(httpServerProc, 'OUT', loggerProc, 'IN');

network.run();