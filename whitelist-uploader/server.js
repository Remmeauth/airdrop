let firebase = require('firebase-admin');

let account = require("./accountKey.json");

firebase.initializeApp({
    credential: firebase.credential.cert(account),
    databaseURL: "https://remme-ico.firebaseio.com"
});

firebase.firestore().collection('users').get().then((snapshot) => {
    snapshot.forEach((doc) => {
        let hash = doc.data().hash;
        console.log(hash);
        // TODO: upload each hash to the smart contract
    });
})