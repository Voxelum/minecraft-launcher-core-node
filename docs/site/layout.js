import { getLatestTagName } from "./github";

let demoPromise = import("./demo").then(({ setupAll }) => setupAll());

$(document).ready(function () {
    $('body').pagepiling({
        onLeave: function (index, nextIndex, direction) {
            if (nextIndex === 3) {
                demoPromise.then(({ play, stop }) => {
                    play();
                });
            } else if (index === 3) {
                demoPromise.then(({ play, stop }) => {
                    stop();
                });
            }
        },
    });
});
$('.menu .item').tab();
$('.dropdown').dropdown();

getLatestTagName().then(t => {
    $('#version').text(t);
})
