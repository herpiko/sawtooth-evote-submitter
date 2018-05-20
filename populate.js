const submit = require('./dpt-admin');
const {createHash} = require('crypto');
const faker = require('faker');

for (var i = 1; i < 1000;i++) {
  let name = faker.name.findName();
  let nik = createHash('sha256').update((new Date()).valueOf().toString() + name).digest('hex');
  let uid = nik.substr(0,16) + '_' + name.replace(/\'/g, '').replace(/\./g, '').replace(/ /g, '_');
  submit({voterId : uid, verb : 'registered', node : process.argv[2]});
}


