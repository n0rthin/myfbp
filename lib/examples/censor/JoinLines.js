const { IPType } = require("../../core/constants");

module.exports = {
  name: 'JoinLines',
  inports: [{ name: 'IN' }],
  outports: [{ name: 'OUT' }],
  * execute() {
    const inPort = this.getPort('IN');
    const outPort = this.getPort('OUT');
    
    if (!this.lines) this.lines = [];

    let ip = inPort.receiveIp();

    while (ip) {
      if (ip.type === IPType.OpenBracket) {
        this.lines = ['========================='];
      }

      if (ip.type === IPType.Normal) {
        this.lines.push(ip.content);
      }

      if (ip.type === IPType.ClosedBracket) {
        this.lines.push('=========================');
        outPort.send(this.createIp(this.lines.join('\n')));
        this.lines = [];
      }     
      
      this.dropIp(ip);
      ip = inPort.receiveIp();
    }
  }
}