const fs = require("fs");
const eddsa = require("../circomlib/src/eddsa.js");
const mimcjs = require("../circomlib/src/mimc7.js");

const alicePrvKey = Buffer.from('1'.toString().padStart(64,'0'), "hex");
const alicePubKey = eddsa.prv2pub(alicePrvKey);
const bobPrvKey = Buffer.from('2'.toString().padStart(64,'0'), "hex");
const bobPubKey = eddsa.prv2pub(bobPrvKey);

// accounts (1 = Yes, 0 = No)
const Alice = {
    pubkey: alicePubKey,
    detail: 1 
}
const aliceHash = mimcjs.multiHash(
    [Alice.pubkey[0], Alice.pubkey[1], Alice.detail]
);

const Bob = {
    pubkey: bobPubKey,
    detail: 0
}
const bobHash = mimcjs.multiHash(
    [Bob.pubkey[0], Bob.pubkey[1], Bob.detail]
);

const tree_root = mimcjs.multiHash([aliceHash, bobHash])

// transactions
const txA = {
    from: Alice.pubkey,
    detail: 0,
    updated_pubkey: Alice.pubkey
}

const txB = {
    from: Bob.pubkey,
    detail: 1,
    updated_pubkey: Bob.pubkey
}

// Alice sign tx
const txAHash = mimcjs.multiHash(
    [txA.from[0], txA.from[1], txA.detail, txA.updated_pubkey[0], txA.updated_pubkey[1]]
);
const signatureA = eddsa.signMiMC(alicePrvKey, txAHash)

// Bob sign tx
const txBHash = mimcjs.multiHash(
    [txB.from[0], txB.from[1], txB.detail, txB.updated_pubkey[0], txB.updated_pubkey[1]]
);
const signatureB = eddsa.signMiMC(bobPrvKey, txBHash)


// update Alice account
const newAlice = {
    pubkey: txA.updated_pubkey,
    detail: txA.detail 
}
const newAliceHash = mimcjs.multiHash(
    [newAlice.pubkey[0], newAlice.pubkey[1], newAlice.detail]
);

// update root
const intermediate_root = mimcjs.multiHash([newAliceHash, bobHash])

// update Bob account
const newBob = {
    pubkey: txB.updated_pubkey,
    detail: txB.detail 
}
const newBobHash = mimcjs.multiHash(
    [newBob.pubkey[0], newBob.pubkey[1], newBob.detail]
);


// update root
const final_root = mimcjs.multiHash([newAliceHash, newBobHash])

console.log("tree_root: " + tree_root.toString());
console.log("intermediate_root: " + intermediate_root.toString());
console.log("final_root: " + final_root.toString());
console.log("accounts_pubkeys Alice.pubkey[0]: " + Alice.pubkey[0].toString());
console.log("accounts_pubkeys Alice.pubkey[1]: " + Alice.pubkey[1].toString());
console.log("accounts_pubkeys Bob.pubkey[0]: " + Bob.pubkey[0].toString());
console.log("accounts_pubkeys Bob.pubkey[1]: " + Bob.pubkey[1].toString());
console.log("Alice sender_detail: " + Alice.detail.toString());
console.log("Bob sender_detail: " + Bob.detail.toString());
console.log("Alice sender_updated_pubkey[0]: " + newAlice.pubkey[0].toString());
console.log("Alice sender_updated_pubkey[1]: " + newAlice.pubkey[1].toString());
console.log("Bob sender_updated_pubkey[0]: " + newBob.pubkey[0].toString());
console.log("Bob sender_updated_pubkey[1]: " + newBob.pubkey[1].toString());
console.log("Alice sender_updated_detail: " + newAlice.detail.toString());
console.log("Bob sender_updated_detail: " + newBob.detail.toString());
console.log("Alice signature['R8'][0]: " + signatureA['R8'][0].toString());
console.log("Alice signature['R8'][1]: " + signatureA['R8'][1].toString());
console.log("Alice signature['S']: " + signatureA['S'].toString());
console.log("Bob signature['R8'][0]: " + signatureB['R8'][0].toString());
console.log("Bob signature['R8'][1]: " + signatureB['R8'][1].toString());
console.log("Bob signature['S']: " + signatureB['S'].toString());
console.log("aliceHash: " + aliceHash.toString());
console.log("bobHash: " + bobHash.toString());
console.log("newAliceHash: " + newAliceHash.toString());
console.log("txAHash: " + txAHash.toString());
console.log("newBobHash: " + newBobHash.toString());
console.log("txBHash: " + txBHash.toString());


const inputs = {
    "tree_root": [tree_root.toString(),intermediate_root.toString(),final_root.toString()],
    "accounts_pubkeys": [
        [Alice.pubkey[0].toString(), Alice.pubkey[1].toString()], 
        [Bob.pubkey[0].toString(), Bob.pubkey[1].toString()]
    ],
    "accounts_detail": [Alice.detail, Bob.detail],
    "sender_pubkey": [[Alice.pubkey[0].toString(), Alice.pubkey[1].toString()],[Bob.pubkey[0].toString(), Bob.pubkey[1].toString()]],
    "sender_detail": [Alice.detail,Bob.detail],
    "sender_updated_pubkey": [[newAlice.pubkey[0].toString(), newAlice.pubkey[1].toString()],[newBob.pubkey[0].toString(), newBob.pubkey[1].toString()]],
    "sender_updated_detail": [newAlice.detail,newBob.detail],
    "signature_R8x": [signatureA['R8'][0].toString(),signatureB['R8'][0].toString()],
    "signature_R8y": [signatureA['R8'][1].toString(),signatureB['R8'][1].toString()],
    "signature_S": [signatureA['S'].toString(),signatureB['S'].toString()],
    "sender_proof": [[bobHash.toString()],[newAliceHash.toString()]], 
    "sender_proof_pos": [[1],[0]],
    "final_tree_proof": [[newBobHash.toString()],[newAliceHash.toString()]], 
    "final_tree_proof_pos": [[1],[0]]
}

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);


