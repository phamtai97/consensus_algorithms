const Blockchain = require('./models/blockchain.js');
const Transaction = require('./models/transaction.js');

const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf');
const myWalletAddress = myKey.getPublic('hex');

const taiCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'trung', 100);
tx1.signTransaction(myKey);
taiCoin.addTransaction(tx1);

taiCoin.minePendingTransactions(myWalletAddress);

///////////////////////////////////////////////////////////////
const tx2 = new Transaction(myWalletAddress, 'thinh', 50);
tx2.signTransaction(myKey);
taiCoin.addTransaction(tx2);

taiCoin.minePendingTransactions(myWalletAddress);

console.log();
console.log(`Balance of wallet is ${taiCoin.getBalanceOfAddress(myWalletAddress)}`);

console.log('Blockchain TaiCoin:');
console.log(taiCoin.chain);

console.log();
console.log('Blockchain valid?', taiCoin.isChainValid() ? 'Yes' : 'No');
