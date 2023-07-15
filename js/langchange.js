let elements = document.getElementsByName('lang');
let len = elements.length;
let lang;

// --- ブラウザのデフォルト言語を取得して初回の表示 ----- 
lang = (navigator.browserLanguage || navigator.language || navigator.userLanguage).substr(0,2);

for (let i = 0; i < len; i++){
    elements[i].checked = false;
}

// Set browser's lang setting
if (lang == "ja") elements[0].checked = true;
else if (lang == "en") elements[1].checked = true;


// If another lang was selected, change variable, too
function langSet(argLang){
    lang = argLang;

    //Update radio button
    if (lang == "ja") elements[0].checked = true;
    else if (lang == "en") elements[1].checked = true;
}