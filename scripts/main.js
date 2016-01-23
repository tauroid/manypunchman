requirejs.config({
    baseUrl: "/scripts/common",
    paths: {
        app: "/games/keyquest/scripts",
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

require(['jquery','app/game','app/keyquest'], function ($, Game, Config) {
    $(document).ready(function () { start(Game, Config); });
});
