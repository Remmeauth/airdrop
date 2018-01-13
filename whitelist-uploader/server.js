let firebase = require('firebase-admin');
let Web3 = require('web3');

const account = require('./accountKey.json');
const abi = require('./Airdrop.json');
const settings = require('./settings.json');

let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
let contract = new web3.eth.Contract(abi, settings.contractAddress);

firebase.initializeApp({
    credential: firebase.credential.cert(account),
    databaseURL: 'https://remme-ico.firebaseio.com'
});

contract.methods.setActualPrice(settings.actualRate).then(() => {
    firebase.firestore().collection('users').get().then(async (snapshot) => {
        await snapshot.forEach(async (doc) => {
            let hash = doc.data().hash;
            console.log(hash);
            console.log(await contract.methods.performAirdrop(hash).send());
        });
    });
});