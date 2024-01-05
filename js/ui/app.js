/*
Global Variables Definition
*/

import { ajaxOpenPage, openModal } from "../library.js";



/*
    End Global Variables Definition
*/


/*
    Websocket Methods
*/
const socket = io();

socket.on('connect', function () {
    console.log("WS Connection connected!");
});

socket.on("connect_error", () => { //automatic connection error error handling
    console.log("WS Connection can't be reestablished");
    setTimeout(() => {
        socket.connect();
    }, 1000);
});
socket.on("disconnect", (reason) => { //handle specific disconnection cases
    //console.log("WS Connection disconnected");
    if (reason === "io server disconnect") {
        socket.connect();
    }
});

socket.on('blockchain_task_finished', function (data) {
    if (socket.recovered) {
        console.log("Blockchain Task " + data.id + " finished - socket recovered! Socket ID: " + socket.id);
    } else {
        
    }
});

/*
    End Websocket Methods
*/


/**
 * JQuery Page Logic
 */

$(function (e) {

    //First time page loading
    ajaxOpenPage("main");

    /*
        Navbar
    */
    $('#navbar-expander').on('click', function (e) {
        if (window.innerWidth > 768) {
            if ($('#sidenav').css('width') == '0px') {
                $('#sidenav').css('width', '250');
                document.getElementById("main").style.marginLeft = "250px";
            } else if ($('#sidenav').css('width') == '250px') {
                $('#sidenav').css('width', '0');
                document.getElementById("main").style.marginLeft = "0px";
            }
        } else {
            if ($('#sidenav').css('width') == '0px') {
                $('#sidenav').css('width', '100vh');
                //document.getElementById("main").style.marginLeft = "100vh";
            } else if ($('#sidenav').css('width') == '100vh') {
                $('#sidenav').css('width', '0');
                //document.getElementById("main").style.marginLeft = "0px";
            }
        }
    });

    $('#nav-closer').on('click', function (e) {
        $('#sidenav').css('width', '0');
        document.getElementById("main").style.marginLeft = "0px";
    });
    /*
        End Navbar
    */

    /*
        Operation Status
    */

    $('#operation-status-expander').on('click', function (e) {
        if ($('#operation-status-popup').css('display') == "none") {
            $('#operation-status-expander').children().addClass('fa-regular').removeClass('fa-solid');
            $('#operation-status-popup').css('display', 'block');
            //$('#notification-NFT_ID_COUNT').html("10"); //SETS NOTIFICATION COUNT
        } else if ($('#operation-status-popup').css('display') == "block") {
            $('#operation-status-popup').css('display', 'none');
            $('#operation-status-expander').children().addClass('fa-solid').removeClass('fa-regular');
        }
    });

    /*
        End Operation Status
    */

    /*
        Main Tab  
    */

    $('#main-link').on('click', function (e) {
        ajaxOpenPage("main");
    });

    /*
        End Main Tab 
    */

    /*
        Mint Tab 
    */

    $('#mint').on('click', function (e) {
        ajaxOpenPage("mint");
    });

    //Mint Events

    $('#main-frame').on('submit', '#mintform', async function (e) { //Websocket mint_nft
        $('#spin').show(0);
        e.preventDefault();
        
        //NFT Metadata Build info
        const image = document.getElementById("file-upload").files[0];

        if( image.size < 5e6 
            && $('#main-frame').find('.card-icon').attr('src') != "../res/user.png"
            ){ //check and troubleshoot
            //upload Image and mint NFT
            console.log(image.type);
            socket.emit('mint_nft', { 

                id: NFT_ID_COUNT,
                nftImage: image,
                nftImageName: image.name,
                nftImageType: image.type,
                nftImageSize: image.size,
                nftName: $('#main-frame').find('#nftname').val(),
                nftAmount: $('#main-frame').find('#nftamount').val(),
                nftDescription: $('#main-frame').find('#nftdescription').val(),
                nftUrl: $('#main-frame').find('#nfturl').val(),
                nftAnimationVideo: $('#main-frame').find('#nftanimationvideourl').val(),
                nftBurnable: $('#main-frame').find('#nftburnable').is(":checked"),
                nftMutable: $('#main-frame').find('#nftmutable').is(":checked")

            }, function(data){ //Emit Callback

                if(data.error != "none"){
                    console.log("ERROR: " + data.error + " for ID " + data.id + ", message: " + data.message.toString());
                    var status_link_obj = $('#operation-status-content').find('#' + data.id).find('i');
                    status_link_obj.removeClass('fa-spinner fa-spin').addClass('fa-triangle-exclamation');
                }else{
                    //Task Finished, let's update status bar
                    console.log("Blockchain Task " + data.id + " finished! Socket ID: " + socket.id);
                    console.log("Transaction details: " + JSON.stringify(data.transaction));
                    var status_link_obj = $('#operation-status-content').find('#' + data.id).find('i');
                    status_link_obj.removeClass('fa-spinner fa-spin').addClass('fa-check');
                }

                //Current Job Counter Decreasing
                CURRENT_JOBS--;
                $('#notification-count').text(CURRENT_JOBS);
                if (CURRENT_JOBS == 0) {
                    $('#notification-count').text("");
                }

                //attach handler for tile removal
                status_link_obj.on('click', function () {
                    $('#operation-status-content').find('#' + data.id).remove();
                    if ($('#operation-status-content').children().length == 1) {
                        $('#operation-status-nocontent').show();
                    }
                });


            });

            //adjust operation status GUI view
            $('#operation-status-nocontent').hide();
            $('#operation-status-nocontent').after(`
                <div class="tile-margin-top-bottom" id="${NFT_ID_COUNT}">                    
                    <a href="#"><i class="fa-solid fa-spinner fa-spin"></i></a> Minting NFT - ID: #${NFT_ID_COUNT}                    
                </div>
            `);

            //increment counters and set view
            CURRENT_JOBS++;
            NFT_ID_COUNT++;
            $('#notification-count').text(CURRENT_JOBS);
        }
        else{
            openModal("Error!","Image file larger than 5MB!");
        }

        openModal(`NFT ID ${NFT_ID_COUNT} minting in progress!`, "Please check the status bar for more information.");
        $('#spin').hide(0);
    });

    /*
        End Mint Tab 
    */

    /*
        Profile Tab 
    */

    $('#profile').on('click', function (e) {
        ajaxOpenPage("profile");
    });

    /*
        End Profiles Tab 
    */

    /*
        NFTs Tab 
    */

    $('#nfts').on('click', function (e) {
        ajaxOpenPage("nfts");
    });

    /*
        End NFTs Tab 
    */

    /*
        Marketplace Tab 
    */

    $('#marketplace').on('click', function (e) {
        //TO DO
    });

    /*
        End Marketplace Tab 
    */

    /*
        Slider JS
    */

    //TO DO

    /*
        End Slider JS
    */

});

/**
 * End JQuery Page Logic
 */

