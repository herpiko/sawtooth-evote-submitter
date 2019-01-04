const submit = require('./national-submitter');
const request = require('request');
const {createHash} = require('crypto')

let totalTx = process.argv[2] || 100
totalTx = parseInt(totalTx, 10)

let id = createHash('sha512').update((new Date()).valueOf().toString() + Math.random()).digest('hex').substr(0, 20)
console.log(id);
let txs = [];
for (let i = 1; i <= totalTx;i++) {
  txs.push({
    id: createHash('sha512').update((new Date()).valueOf().toString() + Math.random()).digest('hex').substr(0, 20),
    state: createHash('sha512').update((new Date()).valueOf().toString() + Math.random()).digest('hex'),
  });
}
console.log('Sending ' + totalTx + ' transactions');
submit('localhost:8008', 'provinceVote', txs)
.then((result) => {
  console.log(result);
  let checking = setInterval(() => {
    request.get(JSON.parse(result).link, (err, res) => {
      if (err) {
        console.log(err);
        return;
        process.exit();
      }
      let body = JSON.parse(res.body)
      if (body && body.data[0] && body.data[0].invalid_transactions && body.data[0].invalid_transactions.length > 0) {
        console.log(body.data[0].invalid_transactions[0]);
      }
      if (body && body.data[0] && body.data[0].status === 'COMMITTED') {
        clearInterval(checking);
      }
    });
  } ,500)
});
