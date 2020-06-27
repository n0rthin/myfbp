const { IPType } = require("../../core/constants");

module.exports = {
  name: 'Censor',
  inports: [{ name: 'BlackList' }, { name: 'IN' }],
  outports: [{ name: 'OUT' }, { name: 'Censored' }],
  * execute() {
    const inPort = this.getPort('IN');
    const blackListPort = this.getPort('BlackList');
    const outPort = this.getPort('OUT');
    const censoredPort = this.getPort('Censored');
    
    const blackListIp = blackListPort.receiveIp();
    const blackList = blackListIp.content.split(',');
    this.dropIp(blackListIp)
    
    const regexp = new RegExp(`\\b(${blackList.join('|')})\\b`, 'ig');

    let ip = inPort.receiveIp();

    while (ip) {
      if ([IPType.OpenBracket, IPType.ClosedBracket].includes(ip.type)) {
        outPort.send(ip);
        ip = inPort.receiveIp();

        continue;
      }

      const censoredWords = [];
      const censoredText = ip.content.replace(regexp, match => {
        censoredWords.push(match);

        return new Array(match.length).fill('*').join('');
      });

      yield outPort.send(this.createIp(censoredText));

      for (const censoredWord of censoredWords) {
        yield censoredPort.send(this.createIp(censoredWord));
      }

      this.dropIp(ip);
      ip = inPort.receiveIp();
    }
  }
}