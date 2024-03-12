import { openModal } from "../library.js";

$(function (e) {

    $('form#signin_form').on('submit', function (e) { //Form submit custom handler
        $('#spin').show(0);
        var form = this;
        e.preventDefault();

        if (document.activeElement.id == "login" || 
            document.activeElement.id == "username" || 
            document.activeElement.id == "password") {
            
            $.ajax({
                url: "/checkUser",//API to check Users
                type: "POST",
                data: {
                    username: document.getElementById('username').value
                },
                success: function (data, textStatus, xhr) {
                    if (xhr.getResponseHeader("INFT_STATUS_MESSAGE") == "STATUS_USER_NOT_EXISTENT") { //IF status message shows the user does not exist..
                        $('#spin').hide(0);
                        openModal("Error!", "User not existent! Please register first.");
                        return; //let's block the form submit
                    }
                    $.ajax({
                        url: "/signin/legacy",
                        type: "POST",
                        data: {
                            username: document.getElementById('username').value,
                            password: document.getElementById('password').value
                        },
                        success: function (data, textStatus, xhr) {
                            if (xhr.getResponseHeader("INFT_ERROR_MESSAGE") == "ERR_WRONG_PASSWORD") {
                                $('#spin').hide(0);
                                openModal("Error!", "Wrong password for user " + username);
                                return; //let's block the form submit
                            }
                            $('#spin').hide(0);
                        },
                        error: function () {
                            $('#spin').hide(0);
                            openModal("Error!", "Some general error has occured, please refresh the page!");
                        }
                    });
                    $('#spin').hide(0);
                    $('#signin_form').attr('action', '/signin/legacy');//setting /signin/legacy as Express.js route server-side
                    form.submit();
                },
                error: function () {
                    $('#spin').hide(0);
                    openModal("Error!", "Some general error has occured, please refresh the page!");
                }
            });
        } else if (document.activeElement.id == "register") { //If register button was pressed

            //check for password lenght over REGEX
            var regularExpression = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
            var password = document.getElementById('password').value;
            if (!regularExpression.test(document.getElementById('password').value)) {
                $('#spin').hide(0);
                openModal("Error!", "Password should contain at least 1 number and 1 special character, and must be over 8 chars!");
                return; //let's block the form submit
            }

            $.ajax({
                url: "/checkUser",//API to check Users
                type: "POST",
                data: {
                    username: document.getElementById('username').value
                },
                success: function (data, textStatus, xhr) {
                    if (xhr.getResponseHeader("INFT_STATUS_MESSAGE") == "STATUS_USER_ALREADY_REGISTERED") { //IF status message shows the user already registered..
                        $('#spin').hide(0);
                        openModal("Error!", "User is already registered, please try to login!");
                        return; //let's block the form submit
                    }
                    $('#spin').hide(0);
                    $('#signin_form').attr('action', '/register');//setting /register as Express.js route server-side
                    form.submit();
                },
                error: function () {
                    $('#spin').hide(0);
                    openModal("Error!", "Some general error has occured, please refresh the page!");
                }
            });
        } else {
            $('#spin').hide(0);
            openModal("Error!", "Some general error has occured, please refresh the page!");
        }
    });
});