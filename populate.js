const submit = require('./dpt-admin');
const {createHash} = require('crypto');
const faker = require('faker');
let total = process.argv[2] || 10
console.log('Populate to ' + total);

for (var i = 0; i < total;i++) {
  let name = faker.name.findName();
  let nik = createHash('sha256').update((new Date()).valueOf().toString() + name).digest('hex');
  let uid = nik.substr(0,16) + '_' + name.replace(/\'/g, '').replace(/\./g, '').replace(/ /g, '_');
  let payload = {voterId : uid, verb : 'registered', node : process.argv[3] || 'localhost:3001'}
  console.log(payload);
  submit(payload);
}


