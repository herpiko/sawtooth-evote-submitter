const {createContext, CryptoFactory} = require('sawtooth-sdk/signing')

const context = createContext('secp256k1')
const request = require('request')
const privateKey = context.newRandomPrivateKey()
const signer = new CryptoFactory(context).newSigner(privateKey)

const {createHash} = require('crypto')
const {protobuf} = require('sawtooth-sdk')
const cbor = require('cbor')

var defaultFamilyName = 'provinceVote';

var vote = function(node, fn, txs) {
  var familyName = fn || defaultFamilyName
  return new Promise((resolve, reject) => {
    let transactions = [];
    for (let i in txs) {
      const payload = {
          Verb: (familyName === 'provinceVote' || familyName === 'provinceVoter') ? 'set' : 'vote',
          Name: txs[i].id.substr(0,20),
          Value: txs[i].state,
      }
      
      const payloadBytes = cbor.encode(payload)
      
      
      /*
          - Addresses must be a 70 character hexadecimal string
          -The first 6 characters of the address are the first 6 characters of a sha512 hash of the IntegerKey namespace prefix: “intkey”
          - The following 64 characters of the address are the last 64 characters of a sha512 hash of the entry Name
      
      */
      const payloadNameHash = createHash('sha512').update(payload.Name).digest('hex');
      const familyNameHash = createHash('sha512').update(familyName).digest('hex');
      //console.log('StateID : ' + familyNameHash.substr(0,6) + payloadNameHash.substr(-64));
       
      const transactionHeaderBytes = protobuf.TransactionHeader.encode({
          familyName: familyName,
          familyVersion: '1.0',
          inputs: [familyNameHash.substr(0,6) + payloadNameHash.substr(-64)],
          outputs: [familyNameHash.substr(0,6) + payloadNameHash.substr(-64)],
          //inputs: ['1cf1266e282c41be5e4254d8820772c5518a2c5a8c0c7f7eda19594a7eb539453e1ed7'],
          //outputs: ['1cf1266e282c41be5e4254d8820772c5518a2c5a8c0c7f7eda19594a7eb539453e1ed7'],
          signerPublicKey: signer.getPublicKey().asHex(),
          // In this example, we're signing the batch with the same private key,
          // but the batch can be signed by another party, in which case, the
          // public key will need to be associated with that key.
          batcherPublicKey: signer.getPublicKey().asHex(),
          // In this example, there are no dependencies.  This list should include
          // an previous transaction header signatures that must be applied for
          // this transaction to successfully commit.
          // For example,
          // dependencies: ['540a6803971d1880ec73a96cb97815a95d374cbad5d865925e5aa0432fcf1931539afe10310c122c5eaae15df61236079abbf4f258889359c4d175516934484a'],
          dependencies: [],
          payloadSha512: createHash('sha512').update(payloadBytes).digest('hex')
      }).finish()
      
      const signature = signer.sign(transactionHeaderBytes)
      
      const transaction = protobuf.Transaction.create({
          header: transactionHeaderBytes,
          headerSignature: signature,
          payload: payloadBytes
      })
      transactions.push(transaction); 
    }
  
    const batchHeaderBytes = protobuf.BatchHeader.encode({
        signerPublicKey: signer.getPublicKey().asHex(),
        transactionIds: transactions.map((txn) => txn.headerSignature),
    }).finish()
    
    
    const signature2 = signer.sign(batchHeaderBytes)
    
    const batch = protobuf.Batch.create({
        header: batchHeaderBytes,
        headerSignature: signature2,
        transactions: transactions,
    })
    
    const batchListBytes = protobuf.BatchList.encode({
        batches: [batch]
    }).finish()
    
    request.post({
        url: 'http://' + node + '/batches',
        body: batchListBytes,
        headers: {'Content-Type': 'application/octet-stream'}
    }, (err, response) => {
        if (err) return reject(err);
        resolve(response.body);
    })
  });
}


module.exports = vote;
