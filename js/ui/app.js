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
        //Task Finished, let's remove the spinning wheel
        console.log("Blockchain Task " + data.id + " finished! Socket ID: " + socket.id);
        var status_link_obj = $('#operation-status-content').find('#' + data.id).find('i');
        status_link_obj.removeClass('fa-spinner fa-spin').addClass('fa-check');

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

    $('#main-frame').on('submit', '#mintform', async function (e) {
        $('#spin').show(0);
        e.preventDefault();
        
        const media_input = document.getElementById("file-upload").files[0];
        var file_properties = "";
        var file_contents = "";

        if (media_input) {
            const reader = new FileReader();
            reader.onload = function(e) { 
                file_properties = { //does not assign variable to right place
                    name: media_input.name,
                    type: media_input.type,
                    size: media_input.size
                }
                file_contents = e.target.result;
            };
            reader.readAsDataURL(media_input);
        }else
        {
            openModal("Error!","No file specified!");
        }
        console.log("File properties: " + file_properties);

        //TO DO : HTTP POST to /uploadNftImage

        $.ajax({
            url: "/uploadNftImage",//API to check Users
            type: "POST",
            data: {
                post_file_properties: file_properties,
                post_file_contents: file_contents
            },
            success: function (data, textStatus, xhr) {
                const image_url = data.file_properties;
                console.log("Image url: " + image_url);

                var parameters = {
                    id: NFT_ID_COUNT,
                    nftImageUrl: image_url,
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
            },
            error: function () {
                $('#spin').hide(0);
                openModal("Error!", "Some general error has occured, please refresh the page!");
            }
        });
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
        //TO DO
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

