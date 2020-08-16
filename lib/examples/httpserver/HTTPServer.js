const http = require('http');

module.exports = {
  inports: [{ name: 'PORT' }],
  outports: [{ name: 'OUT' }],
  async execute() {
    const outPort = this.getPort('OUT');
    const serverPort = (await this.getPort('PORT').receiveIp()).content;
    let callback = null;
    let promise = null;
    let pendingRequests = [];

    const resetPromise = () => {
      if (pendingRequests.length > 0) {
        promise = Promise.resolve();
      }

      promise = new Promise(resolve => {
        callback = () => {
          resolve();
          callback = null;
        };
      });
    }

    const listener = (req, res) => {
      pendingRequests.push([req, res]);

      if (callback) {
        callback();
      }
    };

    resetPromise();

    http
      .createServer(listener)
      .listen(serverPort, () => console.log(`Server is listening ${serverPort} PORT`));
    
    await this.runtime.enqueueAsyncCb(promise);

    while (true) {
      let request;
      while (request = pendingRequests.shift()) {
        await outPort.send(this.createOpenBracketIp());
        await outPort.send(this.createIp(request[0]));
        await outPort.send(this.createIp(request[1]));
        await outPort.send(this.createClosedBracketIp());
      }

      resetPromise();
      await this.runtime.enqueueAsyncCb(promise);
    }
  }
}