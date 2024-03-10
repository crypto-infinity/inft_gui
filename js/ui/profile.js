import { openModal, disableScroll, enableScroll, validFileType } from '../library.js';

$(function (e) {
    console.log();

    socket.emit('profile_update', {}, function(data){
        var image_blob = data;
        $('#userprofilepic').attr('src',image_blob);
    });

    $('#spin').hide(0);
});

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