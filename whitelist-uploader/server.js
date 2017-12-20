let firebase = require('firebase-admin');
let Web3 = require('web3');
let fs = require('fs');

let account = require("./accountKey.json");

let abiFile = fs.readFileSync("Airdrop.json");
let abi = JSON.parse(abiFile);
const actualRate = 500;
const contractAddress = "0x2342423423";

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
let contract = new web3.eth.Contract(abi, contractAddress);

firebase.initializeApp({
    credential: firebase.credential.cert(account),
    databaseURL: "https://remme-ico.firebaseio.com"
});

firebase.firestore().collection('users').get().then((snapshot) => {
    snapshot.forEach((doc) => {
        let hash = doc.data().hash;
        console.log(hash);
        console.log(await contract.methods.performAirdrop(hash, actualRate).send());
    });
});