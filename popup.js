// init
var paused = null;
var toggleButton = null;
getDropbotPaused();

setTimeout( () => {
    toggleButton = document.getElementById('toggle-button');
    toggleButton.onclick = function() {
        for (let i = 0; i < 2; i++) {
            toggleDropbotIsPaused();
            setTimeout(updateButton, 250);
        }
    };
    updateButton();
}, 500);


function updateButton() {
    console.log("button says paused:", paused);
    toggleButton.innerHTML = paused ? "Resume Dropbot" : "Pause Dropbot";
}

function getDropbotPaused() {
    chrome.storage.sync.get(['paused'], function(dropbotStorage) {
        paused = dropbotStorage['paused'];
        console.log(dropbotStorage);
    });
}

function toggleDropbotIsPaused() {
    getDropbotPaused();
    var value = !paused;
    chrome.storage.sync.set({'paused': value}, function () {
        console.log("paused is set to:", value);
    });
   
}    


