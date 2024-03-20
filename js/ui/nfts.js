import { openModal, disableScroll, enableScroll, validFileType } from '../library.js';

export async function loadNFTImages(imageArray)
{
    //HTTPS Gateway: https://nftstorage.link/ipfs/bafyreihf55gmi2opdeyjx3ulayaas77up3d5q2wwspogsbfhxbmri4wusy/metadata.json
    //IPFS Link: ipfs://bafyreihf55gmi2opdeyjx3ulayaas77up3d5q2wwspogsbfhxbmri4wusy/metadata.json

    if(imageArray.length == 0){
        $('#spin').hide(0);
    }

    for(var i = 0; i < imageArray.length; i++){ //how to pass i to callbacks?
        var cid = imageArray[i].replaceAll("ipfs://","https://nftstorage.link/ipfs/"); //string normalization
        fetch(cid).then((response) => { //fetching JSON from Dweb.link IPFS Gateway

            //Loading mode on!
            $('#spin').show(0);
            
            response.json().then((responseData) => { //building JSON over promise
                var image_url = responseData.image.replaceAll("ipfs://","https://nftstorage.link/ipfs/"); //string normalization

                fetch(image_url).then((response) => { //fetching NFT image
                    response.blob().then((blob) => {
                        const imageUrl = URL.createObjectURL(blob);

                        //Updating GUI
                        $("#tile").append(` 
                            <div class="col-md-4">
                                <div class="tile">
                                    <img src="${imageUrl}" class="tile-icon">
                                    <h5 class="tile-description">${responseData.name}</h5>
                                    <p class="tile-description">${responseData.description}</p>
                                    <a href="${responseData.external_url}" class="read-more-nft">Browse URL</a>
                                </div>
                            </div> 
                        `);

                        //Removing spin after loading
                        $('#spin').hide(0);
                    })
                })
            }).catch((error) => {
                console.log("ERROR: " + error);
            })
        })
    }
}