define(["pixi.min"], function (PIXI) {
    Animation = function () {
        this.frames = [];
        this.sprite = undefined;

        this.frame_delayms = 50;
        this.independent_frame_times = false;
        this.frame_times = [];
        this.frame_prefix_sum = [];

        this.start_time = 0;
        this.pause_run_time = 0;

        this.playing = false;
        this.repeat = true;
    };

    Animation.groupname = "animation";

    Animation.fromSpritesheet = function (texture, texwidth, texheight,
                                          rowMajor, sheetframe, frame_times) {
        var anim = new Animation();

        if (!sheetframe) {
            sheetframe = new PIXI.Rectangle(0, 0, texture.width, texture.height);
        }

        var sf = sheetframe;

        console.log("Sheet width: "+sf.width+", Sheet height: "+sf.height);
        var nx = Math.floor(sf.width / texwidth);
        var ny = Math.floor(sf.height / texheight);

        for (var i = 0; i < nx; ++i) {
            for (var j = 0; j < ny; ++j) {
                var rect;
                if (rowMajor) rect =
                    new PIXI.Rectangle(sf.x + j*texwidth, sf.y + i*texheight,
                                       texwidth, texheight);
                else rect = new PIXI.Rectangle(sf.x + i*texwidth, sf.y + j*texheight,
                                               texwidth, texheight);
                
                var frame = new PIXI.Texture(texture.baseTexture, rect);

                anim.frames.push(frame);
            }
        }

        if (frame_times) {
            anim.independent_frame_times = true;
            anim.frame_times = frame_times;
            anim.doFramePrefixSum();
        }
        if (anim.frames.length > 0) anim.sprite = new PIXI.Sprite(anim.frames[0]);

        return anim;
    };

    Animation.fromSequence = function (textures, frame_times) {
        var anim = new Animation();

        anim.frames = textures;
        
        if (frame_times) {
            anim.independent_frame_times = true;
            anim.frame_times = frame_times;
            anim.doFramePrefixSum();
        }
        if (anim.frames.length > 0) anim.sprite = new PIXI.Sprite(anim.frames[0]);

        return anim;
    };

    Animation.prototype.doFramePrefixSum = function () {
        var time = 0;
        for (var i = 0; i < this.frames.length; ++i) {
            if (i < this.frame_times.length) time += this.frame_times[i];
            else time += this.frame_delayms;

            this.frame_prefix_sum[i] = time;
        }
    };

    Animation.prototype.play = function (game, repeat, groupname) {
        if (repeat != undefined) this.repeat = repeat;
        if (!groupname) groupname = Animation.groupname;

        this.start_time = (new Date).getTime();
        if (!game.logicgroups.hasOwnProperty(groupname)) {
            game.logicgroups[groupname] = [];
        }
        game.logicgroups[groupname].push(this);
        game.activateGroup(groupname);

        this.playing = true;
    };

    Animation.prototype.pause = function () {
        this.playing = false;

        this.pause_run_time = (new Date()).getTime() - this.start_time;
    };

    Animation.prototype.resume = function () {
        this.start_time = (new Date()).getTime() - this.pause_run_time;

        this.playing = true;
    };

    Animation.prototype.stop = function () {
        this.finished = true;
    };

    Animation.prototype.update = function (delta, time) {
        if (!this.playing) return;

        var runtime = time - this.start_time;
        this.sprite.texture = this.frames[this.getFrame(runtime)];
    };

    Animation.prototype.getFrame = function (runtime) {
        if (this.independent_frame_times) {
            var cycletime = runtime % this.frame_prefix_sum[this.frames.length-1];
            for (var i = 0; cycletime > this.frame_prefix_sum[i]; ++i);
            return i;
        } else {
            return Math.floor(runtime / this.frame_delayms) % this.frames.length;
        }
    };

    return Animation;
});
