const submit = require('./dpt-admin');
const {createHash} = require('crypto');
const faker = require('faker');
const async = require('async');
let total = process.argv[2] || 10
console.log('Populate to ' + total);

var i = 0;
async.until(function(){
  return i >= total
},
function(cb){
  let name = faker.name.findName();
  let nik = createHash('sha256').update((new Date()).valueOf().toString() + name).digest('hex');
  let uid = nik.substr(0,16) + '_' + name.replace(/\'/g, '').replace(/\./g, '').replace(/ /g, '_');
  let payload = {voterId : uid, verb : 'registered', node : process.argv[3] || 'localhost:11334'}
  //console.log(payload);
  submit(payload)
  .then((result)=>{
    console.log(result);
    console.log(i + ' submitted');
    i++
    cb();
  })
  .catch((err)=>{
    console.log(err);
    process.exit();
  });
},
function(){
  console.log('done');
});


