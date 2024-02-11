/**
 * Dialog Methods
 */

export function openModal(title, text) {
    $('#dialog-title').text(title);
    $('#dialog-text').text(text);
    disableScroll();
    window.dialog.showModal();
}


export function disableScroll() {
    // Get the current page scroll position
    var scrollTop = window.scrollY || document.documentElement.scrollTop;

    var scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    // if any scroll is attempted,
    // set this to the previous value
    window.onscroll = function () {
        window.scrollTo(scrollLeft, scrollTop);
    };
}

export function enableScroll() {
    window.onscroll = function () { };
}

$('#dialog-close').on('click', function (e) {
    $('#dialog-title').text('');
    $('#dialog-text').text('');
    enableScroll();
    dialog.close();
});

/**
 * End Dialog Methods
 */

/**
 * Image file type check
 */

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const fileTypes = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/svg+xml",
    "image/tiff",
    "image/webp",
    "image/x-icon",
];

export function validFileType(file) {
    return fileTypes.includes(file.type);
}

/**
 * End Image file type check
 */

/**
 * AJAX Page Load with Arguments
 */

export function ajaxOpenPage(page,options) {
    if (opened_tab != page) {
        $.get(`views/${page}.ejs`, function (template) {
            console.log(options);
            // Compile the EJS template.
            if(options != null || options != undefined){
                var base_template = ejs.compile(template, { doSetup: options.doSetup});
            }else{
                var base_template = ejs.compile(template);
            }
            
            $.get(`/${page}`, function (data,textStatus,request) {
                // Generate the html from the given data.
                if(request.getResponseHeader("INFT_ERROR_MESSAGE") == "ERR_WALLET_NOT_SET"){
                    openModal("Error!","You must first complete your setup!");
                    return;
                }
                var html = base_template(data);
                opened_tab = page;
                $('#main-frame').animate({ 'opacity': 0 }, 300, function () {
                    $('#main-frame').html(html).animate({ 'opacity': 1 }, 400);
                });
            }).fail(function (e) {
                console.log("Ajax Query failed");
                openModal("Error!", "Request has not been fullfilled!");
            });
        }).fail(function () {
            console.log("Ajax Query failed");
            openModal("Error!", "Please reload the page");
        });
    }
}
/**
 * End AJAX Page Load
 */

/**
 * Base64 Image Conversion
 */

export function b64(e) { 
    var t = ""; 
    var n = new Uint8Array(e); 
    var r = n.byteLength; 
    for (var i = 0; i < r; i++){ 
        t += String.fromCharCode(n[i]) 
    } 
    return window.btoa(t) 
}

/**
 * End Base64 Image Conversion
 */