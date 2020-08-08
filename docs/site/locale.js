import en from "./locales/en";
import zh from "./locales/zh";

i18next.init({
    lng: navigator.language,
    resources: { en, zh, zh_CN: zh, en_US: en },
}, function (err, t) {
    jqueryI18next.init(i18next, $);
    $('.section').localize();
    $('.bar').localize();
});

$(document).ready(function () {
    $('#languages').dropdown({
        onChange: function (src, _, elem) {
            i18next.changeLanguage(elem.attr('value'), (err, r) => {
                $('.section').localize();
                $('.bar').localize();
            })
        }
    });
})
