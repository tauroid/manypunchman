define(["pixi.min"], function (PIXI) {
    PIXIWindow = function (width, height, stage, renderer) {
        if (!width && !height) {
            width = window.innerWidth;
            height = window.innerHeight;
        }

        if (renderer) {
            this.renderer = new PIXI.RenderTexture(renderer, width, height);
        } else {
            this.renderer = PIXI.autoDetectRenderer(width, height);

            this.renderer.view.style.display = "block";
            document.body.style.margin = "0";

            document.body.appendChild(this.renderer.view);
        }

        this.stage = stage;
        this.matrix = PIXI.Matrix.IDENTITY;
    };

    PIXIWindow.prototype.render = function () {
        this.renderer.render(this.stage, this.matrix);
    };

    PIXIWindow.prototype.resize = function (width, height) {
        this.renderer.resize(width, height, true);
    };

    return PIXIWindow;
});
