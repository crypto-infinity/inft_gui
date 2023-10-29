/**
* NFT Storage API initialization (https://nft.storage/docs/client/js/)
*/
const { NFTStorage, File, Blob } = require('nft.storage');
require('dotenv').config(); //Import .env
const { NFT_STORAGE_TOKEN } = process.env;

try {
    //NFT Storage Client obj initialization
    const nftClient = new NFTStorage({ token: NFT_STORAGE_TOKEN });
    module.exports = nftClient; //Exports the nftClient instance
} catch (err) {
    throw err;
}

