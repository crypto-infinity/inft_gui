$(function (e) {

    if(doSetup == true){ 
        $("#setup_status_text").append(`
            <h5>Please, setup your ERC20 wallet!</h5>
            <input type="text" id="input_wallet" class="form-input" placeholder="Wallet Address" required>
            <button class="about-btn text-uppercase" type="submit" name="send" id="complete_setup">Complete Setup</button>
        `);
    }else{
        $("#setup_status_text").append(`
            <h5>Setup has been done! Happy Web3 browsing!</h5>
        `);
    }

});

