module.exports = {
  name: 'Logger',
  inports: [{ name: 'Prefix' }, { name: 'IN' }],
  * execute() {
    const inPort = this.getPort('IN');
    const prefixPort = this.getPort('Prefix');
    const prefix = prefixPort.receiveIp();

    let ip = inPort.receiveIp();

    while (ip) {
      console.log((prefix ? prefix.content : '') + ip.content);
      
      this.dropIp(ip);

      ip = inPort.receiveIp();
    }
  }
}