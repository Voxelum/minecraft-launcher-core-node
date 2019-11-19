import { getLatestTagName } from "./github";

$(document).ready(function () {
    $('body').pagepiling({
        // onLeave: function (index, nextIndex, direction) {
        // },
    });
});
$('.menu .item').tab();
$('.dropdown').dropdown();

getLatestTagName().then(t => {
    $('#version').text(t);
})
