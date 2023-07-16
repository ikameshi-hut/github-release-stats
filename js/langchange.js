let elements = document.getElementsByName('lang');
let len = elements.length;
let lang;

// --- ブラウザのデフォルト言語を取得して初回の表示 ----- 
langSet((navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0,2));

// If another lang was selected, change variable, too
// Called when radio button clicked
function langSet(argLang){
    lang = argLang;

    //Update radio button
    if (lang == "ja") elements[0].checked = true;
    else if (lang == "en") elements[1].checked = true;
}