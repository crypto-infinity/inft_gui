import { openModal, disableScroll, enableScroll, validFileType } from '../library.js';

export async function loadNFTImages(imageArray)
{
    //HTTPS Gateway: https://bafyreihf55gmi2opdeyjx3ulayaas77up3d5q2wwspogsbfhxbmri4wusy.ipfs.dweb.link/metadata.json
    //IPFS Link: ipfs://bafyreihf55gmi2opdeyjx3ulayaas77up3d5q2wwspogsbfhxbmri4wusy/metadata.json
    var token_ids = imageArray.split(",");

    //Building list of HTTP Gateways
    var http_gateways = [];
    for(var i = 0; i < token_ids.length; i++){
        var cid = token_ids[i].replaceAll("ipfs://","https://").replaceAll("/metadata.json",".ipfs.dweb.link/metadata.json");
        http_gateways[i] = cid;
    }

    //Fetching images from HTTP Gateways
    var nfts = [];
    for(var i = 0; i < http_gateways.length; i++){
        var json = await fetch(http_gateways[i], {
            mode: "no-cors"
        });
        nfts[i] = json; 
        console.log(nfts[i]);
    }

    return nfts;
}