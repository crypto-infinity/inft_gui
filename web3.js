require('dotenv').config(); //Import .env 
const { API_KEY_GOERLI_ALCHEMY, PRIVATE_KEY, CONTRACT_ADDRESS, CONNECTION_STRING_GOERLI_ALCHEMY_HTTPS } = process.env;

const { ethers } = require("ethers");
const contract_json = require("./abi/standardNFT_DB.json");

const provider = new ethers.providers.AlchemyProvider(network="goerli", API_KEY_GOERLI_ALCHEMY);

//const provider = new ethers.providers.JsonRpcProvider(CONNECTION_STRING_GOERLI_ALCHEMY_HTTPS);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contract_json.abi, signer);

async function test() {
    signer.getAddress().then((res) => {
        console.log(res);
    });

    //var tx2 = await contract.tokenURI();
    var tx2 = await contract.grantRole("0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775",signer.getAddress())
    tx2.wait();
    //var tx = contract.mintToken(signer.getAddress(),0,50,"",true,true);
    if(tx2){
        console.log(tx2);
    }
    else{
        console.log("Empty String");
    }
}

test();

module.exports = null;