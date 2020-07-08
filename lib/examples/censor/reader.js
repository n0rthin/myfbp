const fs = require('fs').promises;

module.exports = {
  name: 'Reader',
  inports: [{ name: 'OPT' }],
  outports: [{ name: 'OUT' }, { name: 'ERR' }],
  async execute() {
    const optPort = this.getPort('OPT');
    const outPort = this.getPort('OUT');
    const errPort = this.getPort('ERR');
    const optIp = await optPort.receiveIp();
    const filePathToRead = optIp.content;

    this.dropIp(optIp);

    try {
      const data = await fs.readFile(filePathToRead, 'utf-8');
      const dataString = data.toString();
      const lines = dataString.split('\n');
      
      await outPort.send(this.createOpenBracketIp());

      for (const line of lines) {
        await outPort.send(this.createIp(line));
      }

      await outPort.send(this.createClosedBracketIp());
    } catch (err) {
      await errPort.send(this.createIp(err));
    }
  }
}