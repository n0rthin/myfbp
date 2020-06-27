const fs = require('fs').promises;

module.exports = {
  name: 'Reader',
  inports: [{ name: 'OPT' }],
  outports: [{ name: 'OUT' }, { name: 'ERR' }],
  async * execute() {
    const optPort = this.getPort('OPT');
    const outPort = this.getPort('OUT');
    const errPort = this.getPort('ERR');

    const filePathToRead = optPort.receiveIp().content;

    try {
      const data = await fs.readFile(filePathToRead, 'utf-8');
      const dataString = data.toString();
      const lines = dataString.split('\n');
  
      for (const line of lines) {
        yield outPort.send(this.createIp(line));
      }
    } catch (err) {
      errPort.send(this.createIp(err));
    }
  }
}