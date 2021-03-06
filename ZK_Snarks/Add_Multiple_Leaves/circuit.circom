include "./leaf_existence.circom";
include "./verify_eddsamimc.circom";
include "./get_merkle_root.circom";
include "../circomlib/circuits/mimc.circom";

template ProcessUpdate(k,n){
    // k is depth of accounts tree
    //n is the number of voters

    // accounts tree info
    signal input tree_root[n+1];
    signal private input accounts_pubkeys[2**k, 2];
    signal private input accounts_detail[2**k];

    // vote update info
    signal private input sender_pubkey[n][2];
    signal private input sender_detail[n];
    signal private input sender_updated_pubkey[n][2];
    signal private input sender_updated_detail[n];
    signal private input signature_R8x[n];
    signal private input signature_R8y[n];
    signal private input signature_S[n];
    signal private input sender_proof[n][k];
    signal private input sender_proof_pos[n][k];
    signal private input final_tree_proof[n][k];
    signal private input final_tree_proof_pos[n][k];

    // output
    signal output new_tree_root;

    // components
    component senderExistence[n];
    component signatureCheck[n];
    component newSenderLeaf[n];
    component computed_root[n];


    for (var j = 0; j < n; j++){
	
		    // (1) verify sender account exists in current tree_root
	    senderExistence[j] = LeafExistence(k, 3);
	    senderExistence[j].preimage[0] <== sender_pubkey[j][0];
	    senderExistence[j].preimage[1] <== sender_pubkey[j][1];
	    senderExistence[j].preimage[2] <== sender_detail[j];
	    senderExistence[j].root <== tree_root[j];
	    for (var i = 0; i < k; i++){
		senderExistence[j].paths2_root_pos[i] <== sender_proof_pos[j][i];
		senderExistence[j].paths2_root[i] <== sender_proof[j][i];
	    }

	    	    // (2) check that vote update was signed by voter
	    signatureCheck[j] = VerifyEdDSAMiMC(5);
	    signatureCheck[j].from_x <== sender_pubkey[j][0];
	    signatureCheck[j].from_y <== sender_pubkey[j][1];
	    signatureCheck[j].R8x <== signature_R8x[j];
	    signatureCheck[j].R8y <== signature_R8y[j];
	    signatureCheck[j].S <== signature_S[j];
	    signatureCheck[j].preimage[0] <== sender_pubkey[j][0];
	    signatureCheck[j].preimage[1] <== sender_pubkey[j][1];
	    signatureCheck[j].preimage[2] <== sender_updated_detail[j];
	    signatureCheck[j].preimage[3] <== sender_updated_pubkey[j][0];
	    signatureCheck[j].preimage[4] <== sender_updated_pubkey[j][1];

	    	     // (3) change voter leaf and hash
	    newSenderLeaf[j] = MultiMiMC7(3,91){
		newSenderLeaf[j].in[0] <== sender_updated_pubkey[j][0];
		newSenderLeaf[j].in[1] <== sender_updated_pubkey[j][1];
		newSenderLeaf[j].in[2] <== sender_updated_detail[j];
	    }

	    	     // (4)update current tree_root
	    computed_root[j] = GetMerkleRoot(k);
	    computed_root[j].leaf <== newSenderLeaf[j].out;
	    for (var i = 0; i < k; i++){
		 computed_root[j].paths2_root_pos[i] <== sender_proof_pos[j][i];
		 computed_root[j].paths2_root[i] <== sender_proof[j][i];
	    }

		    // (5) make sure that computed root equals the given root
	   computed_root[j].out === tree_root[j+1];

    }

	//Now that all updates have occurred, check that every updated vote occurs in the final tree!
    component senderExistence2[n];

    for (var j = 0; j < n; j++){

	    // verify voter leaf has been updated
	    senderExistence2[j] = LeafExistence(k, 3);
	    senderExistence2[j].preimage[0] <== sender_updated_pubkey[j][0];
	    senderExistence2[j].preimage[1] <== sender_updated_pubkey[j][1];
	    senderExistence2[j].preimage[2] <== sender_updated_detail[j];
	    senderExistence2[j].root <== computed_root[n-1].out;
	    for (var i = 0; i < k; i++){
		senderExistence2[j].paths2_root_pos[i] <== final_tree_proof_pos[j][i];
		senderExistence2[j].paths2_root[i] <== final_tree_proof[j][i];
	    }
    }

    // output final tree_root
    new_tree_root <== computed_root[n-1].out;
}

component main = ProcessUpdate(1,2);
