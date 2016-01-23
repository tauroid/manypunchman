define(["jquery", "pixi.min", "howler.min"], function ($, PIXI, H) {
    Assets = function(callback) {
        $.ajax("assets.php").done((function (assetstring) {
            var assetarray = eval(assetstring);
            for (var i = 0; i < assetarray.length; ++i) {
                PIXI.loader.add(assetarray[i]);
            }

            PIXI.loader.load((function () {
                for (var i = 0; i < assetarray.length; ++i) {
                    this.addAsset(this.getIDFromRelativeURL(assetarray[i]),
                                                            assetarray[i]);
                }

                callback();
            }).bind(this));
        }).bind(this));
    };

    Assets.prototype.addAsset = function (id, url) {
        var idarray = id.split(".");
        var asset = undefined;

        switch (idarray[0]) {
            case "images":
                asset = PIXI.Texture.fromImage(url);
                asset.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                break;
            case "audio":
                console.log(url);
                asset = new H.Howl({ urls: [url], sprite: { buh: [1600, 2500] } });
                asset.play('buh');
                console.log(asset);
                break;
            default:
                break;
        }

        var node = asset;

        var parent = this;

        for (var p = 0; p < idarray.length && parent.hasOwnProperty(idarray[p]); ++p) {
            parent = parent[idarray[p]];
        }

        for (var i = idarray.length-1; i > p; --i) {
            var parentnode = {};
            parentnode[idarray[i]] = node;
            node = parentnode;
        }

        parent[idarray[p]] = node;
    };

    Assets.prototype.getIDFromRelativeURL = function (url) {
        var id = url.substr(7);
        var patharray = id.split("/");
        patharray[patharray.length-1] = patharray[patharray.length-1].split(".", 1);
        id = patharray.join(".");
        return id;
    };

    return Assets;
});
