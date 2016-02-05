requirejs.config({
    baseUrl: "scripts",
    paths: {
        common: "/scripts/common",
        jquery: "/scripts/common/jquery"
    },
    shim: {
        "sylvester": {
            exports: "SylvesterWrap"
        },
        "three.min": {
            exports: "THREE"
        }
    },
    urlArgs: "bust=" + (new Date()).getTime(),
    waitSeconds: 0
});

function start(Game, Config) {
    document.body.innerHTML = "";
    var game = new Game();
    var config = new Config(game);
    game.ready(function () { game.load(config); });
}

require(['jquery','game','manypunchman'], function ($, Game, Config) {
    $(document).ready(function () { start(Game, Config); });
});
