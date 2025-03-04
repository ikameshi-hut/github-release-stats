var apiRoot = "https://api.github.com/";

// Return a HTTP query variable
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for(var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable) {
            return pair[1];
        }
    }
    return "";
}

// Format numbers
function formatNumber(value) {
    return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')
}

// Validate the user input
function validateInput() {
    if ($("#username").val().length > 0 && $("#repository").val().length > 0) {
        $("#get-stats-button").prop("disabled", false);
    } else {
        $("#get-stats-button").prop("disabled", true);
    }
}

// Move to #repository when hit enter and if it's empty or trigger the button
$("#username").keyup(function (event) {
    if (event.keyCode === 13) {
        if (!$("#repository").val()) {
            $("#repository").focus();
        } else {
            $("#get-stats-button").click();
        }
    }
});

// Callback function for getting user repositories
function getUserRepos() {
    var user = $("#username").val();

    var autoComplete = $('#repository').typeahead({ 
        autoSelect: true,
        afterSelect: function() {
            $("#get-stats-button").click();
        }
     });
    var repoNames = [];

    var url = apiRoot + "users/" + user + "/repos";
    $.getJSON(url, function(data) {
        $.each(data, function(index, item) {
            repoNames.push(item.name);
        });
    });

    autoComplete.data('typeahead').source = repoNames;
}

// Display the stats
function showStats(data) {
    var err = false;
    var errMessage = '';

    if(data.status == 404) {
        err = true;
        errMessage = "<span lang=\"ja\">そのプロジェクトは存在しません！</span><span lang=\"en\">The project does not exist!</span>";
    }

    if(data.status == 403) {
        err = true;
        errMessage = "<span lang=\"ja\">GitHubの利用制限を超えました<br />一時間ほど時間をおいて再試行してください</span><span lang=\"en\">You've exceeded GitHub's rate limiting.<br />Please try again in about an hour.</span>";
    }

    if(data.length == 0) {
        err = true;
        errMessage = getQueryVariable("page") > 1 ? "<span lang=\"ja\">これ以上リリースはありません<br />\"前のページ\"ボタンを押してください</span><span lang=\"en\">No more releases<br />Press \"Newer\"</span>" : "<span lang=\"ja\">このプロジェクトは何もリリースしていません</span><span lang=\"en\">There are no releases for this project</span>";
    }

    var html = "";

    if(err) {
        html += "<div class='col-md-6 col-md-offset-3 alert alert-danger output'>" + errMessage + "</div>";
    } else {
        html += "<div class='col-md-6 col-md-offset-3 output'>";

        var isLatestRelease = getQueryVariable("page") == 1 ? true : false;
        var totalDownloadCount = 0;
        $.each(data, function(index, item) {
            var releaseTag = item.tag_name;
            var releaseBadge = "";
            var releaseClassNames = "release";
            var releaseURL = item.html_url;
            var isPreRelease = item.prerelease;
            var releaseAssets = item.assets;
            var releaseDownloadCount = 0;
            var releaseAuthor = item.author;
            var publishDate = item.published_at.split("T")[0];

            if(isPreRelease) {
                releaseBadge = "&nbsp;&nbsp;<span class='badge'><span lang=\"ja\">プレリリース</span><span lang=\"en\">Pre-release</span></span>";
                releaseClassNames += " pre-release";
            } else if(isLatestRelease) {
                releaseBadge = "&nbsp;&nbsp;<span class='badge'><span lang=\"ja\">最新版</span><span lang=\"en\">Latest release</span></span>";
                releaseClassNames += " latest-release";
                isLatestRelease = false;
            }

            var downloadInfoHTML = "";
            if(releaseAssets.length) {
                downloadInfoHTML += "<h4><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "<span lang=\"ja\">ダウンロード情報</span><span lang=\"en\">Download Info</span></h4>";

                downloadInfoHTML += "<ul>";

                $.each(releaseAssets, function(index, asset) {
                    var assetSize = (asset.size / 1048576.0).toFixed(2);
                    var lastUpdate = asset.updated_at.split("T")[0];

                    downloadInfoHTML += "<li><code>" + asset.name + "</code> (" + assetSize + "&nbsp;MiB) - " +
                        "<span lang=\"ja\">" + formatNumber(asset.download_count) + "回ダウンロードされました。 " +
                        "最終更新日は" + lastUpdate + "です。</span>" +
                        "<span lang=\"en\">downloaded " + formatNumber(asset.download_count) + "&nbsp;times. " +
                        "Last&nbsp;updated&nbsp;on&nbsp;" + lastUpdate + "</span></li>";

                    totalDownloadCount += asset.download_count;
                    releaseDownloadCount += asset.download_count;
                });
            }

            html += "<div class='row " + releaseClassNames + "'>";

            html += "<h3><span class='glyphicon glyphicon-tag'></span>&nbsp;&nbsp;" +
                "<a href='" + releaseURL + "' target='_blank'>" + releaseTag + "</a>" +
                releaseBadge + "</h3>" + "<hr class='release-hr'>";

            html += "<h4><span class='glyphicon glyphicon-info-sign'></span>&nbsp;&nbsp;" +
                "<span lang=\"ja\">リリース情報</span><span lang=\"en\">Release Info</span></h4>";

            html += "<ul>";

            if (releaseAuthor) {
                html += "<li><span class='glyphicon glyphicon-user'></span>&nbsp;&nbsp;" +
                    "<span lang=\"ja\">作者</span><span lang=\"en\">Author</span>: <a href='" + releaseAuthor.html_url + "'>@" + releaseAuthor.login  +"</a></li>";
            }

            html += "<li><span class='glyphicon glyphicon-calendar'></span>&nbsp;&nbsp;" +
                "<span lang=\"ja\">リリース日</span><span lang=\"en\">Published</span>: " + publishDate + "</li>";

            if(releaseDownloadCount) {
                html += "<li><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "<span lang=\"ja\">ダウンロード数</span><span lang=\"en\">Downloads</span>: " + formatNumber(releaseDownloadCount) + "</li>";
            }

            html += "</ul>";

            html += downloadInfoHTML;

            html += "</div>";
        });

        if(totalDownloadCount) {
            var totalHTML = "<div class='row total-downloads'>";
            totalHTML += "<h1><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;<span lang=\"ja\">合計ダウンロード数</span><span lang=\"en\">Total Downloads</span></h1>";
            totalHTML += "<span>" + formatNumber(totalDownloadCount) + "</span>";
            totalHTML += "</div>";

            html = totalHTML + html;
        }

        html += "</div>";
    }

    var resultDiv = $("#stats-result");
    resultDiv.hide();
    resultDiv.html(html);
    $("#loader-gif").hide();
    resultDiv.slideDown();
}

// Callback function for getting release stats
function getStats(page, perPage) {
    var user = $("#username").val();
    var repository = $("#repository").val();

    var url = apiRoot + "repos/" + user + "/" + repository + "/releases" +
        "?page=" + page + "&per_page=" + perPage;
    $.getJSON(url, showStats).fail(showStats);
}

// Redirection function
function redirect(page, perPage, lang) {
    window.location = "?username=" + $("#username").val() +
        "&repository=" + $("#repository").val() +
        "&page=" + page + "&per_page=" + perPage +
        ((getQueryVariable("search") == "0") ? "&search=0" : "") +
        "&lang=" + lang;
}

// The main function
$(function() {
    $("#loader-gif").hide();

    validateInput();
    $("#username, #repository").keyup(validateInput);

    $("#username").change(getUserRepos);

    $("#get-stats-button").click(function() {
        // When get stats button clicked, return to page 1
        page = 1;
        redirect(page, perPage, lang);
    });

    $("#get-prev-results-button").click(function() {
        redirect(page > 1 ? --page : 1, perPage, lang);
    });

    $("#get-next-results-button").click(function() {
        redirect(++page, perPage, lang);
    });

    $("#per-page select").on('change', function() {
        if(username == "" && repository == "") return;
        redirect(page, this.value, lang);
    });

    var username = getQueryVariable("username");
    var repository = getQueryVariable("repository");
    var showSearch = getQueryVariable("search");
    var page = getQueryVariable("page") || 1;
    var perPage = getQueryVariable("per_page") || 5;
    langSet(getQueryVariable("lang"));  // Set lang from query

    if(username != "" && repository != "") {
        $("#username").val(username);
        $("#title .username").text(username);
        $("#repository").val(repository);
        $("#title .repository").text(repository);
        $("#per-page select").val(perPage);
        validateInput();
        getUserRepos();
        $(".output").hide();
        $("#description").hide();
        $("#loader-gif").show();
        getStats(page, perPage);

        if(showSearch == "0") {
            $("#search").hide();
            $("#description").hide();
            $("#title").show();
        }
    } else {
        $("#username").focus();
    }
});
