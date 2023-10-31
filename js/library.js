export function openModal(title, text, scrollTop, scrollLeft) {
    $('#dialog-title').text(title);
    $('#dialog-text').text(text);
    disableScroll();   
    window.dialog.showModal();
}

export function disableScroll() {
    // Get the current page scroll position
    scrollTop = window.scrollY || document.documentElement.scrollTop;
    scrollLeft = window.scrollX || document.documentElement.scrollLeft,

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