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

    

});