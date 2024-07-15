$(function (e) {

    if(doSetup == true){ 
        $("#setup .tile:first").append(`
            <h5>Please, setup your ERC20 wallet!</h5>
            <input type="text" id="input_wallet" class="form-input" placeholder="Wallet Address" required>
            <button class="about-btn text-uppercase" type="submit" name="send" id="complete_setup">Complete Setup</button>
        `);
    }else{
        $("#setup .tile:first").append(`
            <h5>Your wallet: </h5>
            ${wallet}
            <button class="about-btn text-uppercase" type="submit" name="send" id="change_wallet">Change</button>
        `);
    }

    $('#change_wallet').on('click', function(){
        $("#setup .tile").children().remove();
        $("#setup .tile").text('');
        $("#setup .tile").append(`
            <h5>Change your ERC20 wallet!</h5>
            <input type="text" id="input_wallet" class="form-input" placeholder="Wallet Address" required>
            <button class="about-btn text-uppercase" type="submit" name="send" id="change_wallet_setup">Complete Setup</button>
        `);
    })

});

