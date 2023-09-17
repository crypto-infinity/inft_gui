require('dotenv').config(); //Import .env 
const { API_KEY_GOERLI_ALCHEMY, PRIVATE_KEY } = process.env;

const { ethers } = require("ethers");
const contract_json = require("./abi/standardNFT_DB.json");

const provider = new ethers.providers.AlchemyProvider(network="goerli", API_KEY_GOERLI_ALCHEMY);
const signer = new ethers.Wallet(PRIVATE_KEY ,provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS , contract_json.abi, signer);

console.log(contract.uri(0));




module.exports = null;