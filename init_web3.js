require('dotenv').config(); //Import .env 
const { PRIVATE_KEY, CONTRACT_ADDRESS, CONNECTION_STRING_SEPOLIA_ALCHEMY_HTTPS } = process.env;

const { ethers } = require("ethers");
const contract_json = require("./abi/standardNFT_DB.json");

try{
    //Instanciate a provider, a server that receives and handles calls/txs to the blockchain
    const provider = new ethers.providers.JsonRpcProvider(CONNECTION_STRING_SEPOLIA_ALCHEMY_HTTPS);

    //Instanciate a signer, a tuple key-provider
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    //Contract istancing, takes the implementation address (can be a proxy), the contract ABI and the signer object
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contract_json.abi, signer);

    module.exports = {
        provider,
        signer,
        contract
    };
}catch(err){
    throw err;
}

/**
 * DEV REFERENCE
 */

//const provider = new ethers.providers.AlchemyProvider(network="SEPOLIA", API_KEY_SEPOLIA_ALCHEMY);

//var tx2 = await contract.tokenURI();
//var tx2 = await contract.grantRole("0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775",signer.getAddress())
//tx2.wait();

// if(tx2){
//     console.log(tx2);
// }
// else{
//     console.log("Empty String");
// }