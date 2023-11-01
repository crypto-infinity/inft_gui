import { openModal, disableScroll, enableScroll, validFileType } from '../library.js';

$(function (e) {
    $('.card-icon').on('click', function(e){
        $('#file-upload').trigger("click");
    });

    $('#file-upload').on('change', function(e){
        if(validFileType(document.getElementById("file-upload").files[0])){
            $('.card-icon').attr('src',URL.createObjectURL(document.getElementById("file-upload").files[0]));
        }else{
            openModal('File not valid!',"Test");
        }
    });

    $('#mint_form').on('submit', function (e) {//Currently not working

        console.log('submit clicked');

        $('#spin').show(0);
        var form = this;
        e.preventDefault();
        

        //TO DO : image upload to BLOB
        


        var parameters = {
            id: NFT_ID_COUNT,
            nftImageUrl: "image_uri",
            nftName: $('#main-frame').find('#nftname').val(),
            nftDescription: $('#main-frame').find('#nftdescription').val(),
            nftUrl: $('#main-frame').find('#nfturl').val(),
            nftAnimationVideo: $('#main-frame').find('#nftanimationvideourl').val()
        }

        //Task emitter
        console.log("Blockchain query parameters: " + parameters);
        socket.emit("blockchain_task", parameters);

        //adjust operation status GUI view
        $('#operation-status-nocontent').hide();
        $('#operation-status-nocontent').after(`
            <div class="tile-margin-top-bottom" id="${parameters.id}">                    
                <a href="#"><i class="fa-solid fa-spinner fa-spin"></i></a> Minting NFT - ID: #${parameters.nftName}                    
            </div>
        `);

        //increment counters and set view
        CURRENT_JOBS++;
        NFT_ID_COUNT++;
        $('#notification-count').text(CURRENT_JOBS);

        //give feedback to user!
        $('#spin').hide(0);
        openModal(`Event ID ${parameters.id} sent!`, "Please check the status bar for more info!");
    });

});