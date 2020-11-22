import en from "./locales/en";
import zh from "./locales/zh";

i18next.init({
    lng: navigator.language,
    resources: { en, zh, zh_CN: zh, en_US: en },
}, function (err, t) {
    jqueryI18next.init(i18next, $);
    $('.section').localize();
    $('.bar').localize();
    if (i18next.language === "zh-CN" || i18next === "zh") {
        $('#languages .text').text("简体中文")
    } else {
        $('#languages .text').text("English")
    }
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
