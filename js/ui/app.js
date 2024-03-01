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
        console.log("Blockchain Task " + NFT_ID_SESSION_COUNT + " finished - socket recovered! Socket ID: " + socket.id);
    } else {
        
    }
});
socket.on('error_handler', function(data){
    console.log(data);
});

/*
    End Websocket Methods
*/


/**
 * JQuery Page Logic
 */

$(function (e) {

    //First time page loading
    ajaxOpenPage("main", { doSetup, wallet });

    /*
        Navbar
    */
    $('#navbar-expander').on('click', function (e) {
        if (window.innerWidth > 768) {
            if ($('#sidenav').css('width') == '0px') {
                $('#sidenav').css('width', '250');
                document.getElementById("main").style.marginLeft = "250px";
            } else if ($('#sidenav').css('width') >= '250px') {
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
            //$('#notification-NFT_ID_SESSION_COUNT').html("10"); //SETS NOTIFICATION COUNT
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

    $('#main-frame').on('click', '#complete_setup', async function (e) {
        //Launch AJAX POST CALL to ../walletSetup
        $('#spin').show(0);

        var regularExpression = /^0x[a-fA-F0-9]{40}$/gm; //ETH address regex check: /^0x[a-fA-F0-9]{40}$/gm


        if(!regularExpression.test(document.getElementById('input_wallet').value)){
            $('#spin').hide(0);
            openModal("Error!", "ERC20 Wallet form not correct!");
            return; //let's block the form submit
        }
        console.log("Wallet address correct!");

        $.ajax({
            url: "/walletSetup",//API to check Users
            type: "POST",
            data: {
                wallet: document.getElementById('input_wallet').value
            },
            success: function (data, textStatus, xhr) {
                if (xhr.getResponseHeader("INFT_STATUS_MESSAGE") == "STATUS_WALLET_SETUP_DONE") { //wallet setup is complete! setting doSetup = false server-side
                    $('#spin').hide(0);
                    openModal("Wallet Setup Done!", "Wallet setup has been done!");

                    //Updating GUI to reflect the setup status!
                    $("#setup_status_text").empty();

                    $("#setup_status_text").append(`
                        <h5>Setup has been done! Happy Web3 browsing!</h5>
                    `);

                    return; //let's block the form submit
                }else{
                    $('#spin').hide(0);
                    openModal("Error!", "Some general error has occured, please refresh the page!");
                }
                $('#spin').hide(0);
            },
            error: function () {
                $('#spin').hide(0);
                openModal("Error!", "Some general error has occured, please refresh the page!");
            }
        });
    });

    /*
        End Main Tab 
    */

    /*
        Mint Tab 
    */

    $('#mint').on('click', function (e) {
        if(doSetup != true){
            console.log($('#sidenav').css('width'));
            if ($('#sidenav').css('width') >= '250px') {
                $('#sidenav').css('width', '0'); 
                document.getElementById("main").style.marginLeft = "0px";
            }
            ajaxOpenPage("mint");
        }else
        {
            openModal("Error!","You must first complete your setup!");
        }
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
                    console.log("ERROR: " + data.error + " for ID " + NFT_ID_SESSION_COUNT + ", message: " + data.message.toString());
                    var status_link_obj = $('#operation-status-content').find('#' + NFT_ID_SESSION_COUNT).find('i');
                    status_link_obj.removeClass('fa-spinner fa-spin').addClass('fa-triangle-exclamation');
                }else{
                    //Task Finished, let's update status bar
                    console.log("Blockchain Task " + NFT_ID_SESSION_COUNT + " finished! Socket ID: " + socket.id);
                    console.log("Transaction details: " + JSON.stringify(data.transaction));
                    var status_link_obj = $('#operation-status-content').find('#' + NFT_ID_SESSION_COUNT);
                    status_link_obj.find('i').removeClass('fa-spinner fa-spin').addClass('fa-check');
                }

                //Current Job Counter Decreasing
                CURRENT_JOBS--;
                $('#notification-count').text(CURRENT_JOBS);
                if (CURRENT_JOBS == 0) {
                    $('#notification-count').text("");
                }

                //attach handler for tile removal
                status_link_obj.on('click', 'i', function () {
                    status_link_obj.remove();
                    if ($('#operation-status-content').children().length == 1) {
                        $('#operation-status-nocontent').show();
                    }
                });   
                
                //Increment session counter
                NFT_ID_SESSION_COUNT++;
            });

            //adjust operation status GUI view
            $('#operation-status-nocontent').hide();
            $('#operation-status-nocontent').after(`
                <div class="tile-margin-top-bottom" id="${NFT_ID_SESSION_COUNT}">                    
                    <a href="#"><i class="fa-solid fa-spinner fa-spin"></i></a> Minting NFT ${$('#main-frame').find('#nftname').val()}                    
                </div>
            `);

            //increment jobs counters and set view
            CURRENT_JOBS++;
            $('#notification-count').text(CURRENT_JOBS);
        }
        else{
            openModal("Error!","Image file larger than 5MB!");
        }

        openModal(`NFT minting in progress!`, "Check the status bar for info!");
        $('#spin').hide(0);
    });

    /*
        End Mint Tab 
    */

    /*
        Profile Tab 
    */

    $('#profile').on('click', function (e) {
        if(doSetup != true){
            if ($('#sidenav').css('width') >= '250px') {
                $('#sidenav').css('width', '0');
                document.getElementById("main").style.marginLeft = "0px";
            }
            ajaxOpenPage("profile");
        }
        else{
            openModal("Error!","You must first complete your setup!");
        }
    });

    /*
        End Profiles Tab 
    */

    /*
        NFTs Tab 
    */

    $('#nfts').on('click', function (e) {
        if(doSetup != true){
            if ($('#sidenav').css('width') >= '250px') {
                $('#sidenav').css('width', '0');
                document.getElementById("main").style.marginLeft = "0px";
            }
            ajaxOpenPage("nfts");
        }
        else{
            openModal("Error!","You must first complete your setup!");
        }

    });

    /*
        End NFTs Tab 
    */

    /*
        Marketplace Tab 
    */

    $('#marketplace').on('click', function (e) {
        if(doSetup != true){
            if ($('#sidenav').css('width') >= '250px') {
                $('#sidenav').css('width', '0');
                document.getElementById("main").style.marginLeft = "0px";
            }
            ajaxOpenPage("marketplace");
        }
        else{
            openModal("Error!","You must first complete your setup!");
        }

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

