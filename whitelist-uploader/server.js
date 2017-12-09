let firebase = require('firebase-admin');
let Web3 = require('web3');
let fs = require('fs');

let account = require("./accountKey.json");

let abiFile = fs.readFileSync("abi.json");
let abi = JSON.parse(abiFile);
const actualRate = 500;
const contractAddress = "0x2342423423";
const callerAddress = "0x2342423423";
const callerPass = "********";

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
let contract = web3.eth.contract(abi).at(contractAddress);

firebase.initializeApp({
    credential: firebase.credential.cert(account),
    databaseURL: "https://remme-ico.firebaseio.com"
});

web3.personal.unlockAccount(callerAddress, callerPass, 1000);

firebase.firestore().collection('users').get().then((snapshot) => {
    snapshot.forEach((doc) => {
        let hash = doc.data().hash;
        console.log(hash);
        console.log(await contract.performAirdrop(hash, actualRate));
    });
})