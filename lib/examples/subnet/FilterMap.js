const MapComp = require('./Map');
const Filter = require('./Filter');

module.exports = {
  name: 'FilterMap',
  inports: [{ name: 'Cond' }, { name: 'Prefix' }, { name: 'IN' }],
  outports: [{ name: 'OUT' }, { name: 'Filtered' }],
  buildSubnet: subnet => {
    const filterProc = subnet.addProcess(Filter, 'Filter');
    const mapProc = subnet.addProcess(MapComp, 'Map');
    
    subnet.connect(filterProc, 'OUT', mapProc, 'IN');

    subnet.connectMother(filterProc, 'Cond');
    subnet.connectMother(mapProc, 'Prefix');
    subnet.connectMother(filterProc, 'IN');
    
    subnet.connectMother(filterProc, 'Filtered');
    subnet.connectMother(mapProc, 'OUT');
  }
}