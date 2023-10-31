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