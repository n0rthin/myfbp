module.exports = {
  name: 'Logger',
  inports: [{ name: 'Prefix' }, { name: 'IN' }],
  * execute() {
    const inPort = this.getPort('IN');
    const prefixPort = this.getPort('Prefix');
    const prefixIp = prefixPort.receiveIp();
    const prefix = prefixIp ? prefixIp.content : '';

    if (prefixIp) this.dropIp(prefixIp);
    
    let ip = inPort.receiveIp();

    while (ip) {
      console.log(prefix + ip.content);
      
      this.dropIp(ip);

      ip = inPort.receiveIp();
    }
  }
}