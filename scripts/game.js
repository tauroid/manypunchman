// Responsibilities:
//  - Update logic groups
//  - Render game windows

define(['app/assets','app/messagebus','app/movements'],
        function (Assets, MessageBus, Movements) {
    Game = function () {
        this.data = {};
        this.logicgroups = {};
        this.gamewindows = {};
        this.messagebus = new MessageBus();
        this.localmessagebusses = {};
        
        // Keys of active groups
        this.groupnames = [];

        this.configs = {};

        this.movements = new Movements(this);

        this.updateTimestep = 30;

        this.velIterations = 10;
        this.posIterations = 3;

        this.lastUpdateTime = new Date().getTime();

        window.onresize = this.onResize.bind(this);

        window.onclick = this.onClick.bind(this);
        window.onmousemove = this.onMouseMove.bind(this);
        window.onkeydown = this.onKeyDown.bind(this);
        window.onkeyup = this.onKeyUp.bind(this);

        this.assets = new Assets(this._start.bind(this));
    };

    Game.prototype._start = function () {
        if (this._readyCallbacks) {
            for (var i = 0; i < this._readyCallbacks.length; ++i) {
                this._readyCallbacks[i]();
            }
        }


        // ALL ABOARD
        this.render();
        this.update();
    }

    Game.prototype.ready = function (callback) {
        if (!this._readyCallbacks) this._readyCallbacks = [];

        this._readyCallbacks.push(callback);

        return this;
    };

    Game.prototype.render = function () {
        for (var i = 0; i < this.groupnames.length; ++i) {
            var gws = this.gamewindows[this.groupnames[i]];
            if (gws != undefined) {
                for (var gw = 0; gw < gws.length; ++gw) {
                    gws[gw].render();
                }
            }
        }
        
        requestAnimationFrame(this.render.bind(this));
    };

    Game.prototype.update = function () {
        var newtime = new Date().getTime();
        var delta = newtime - this.lastUpdateTime;
        this.lastUpdateTime = newtime;

        for (var i = 0; i < this.groupnames.length; ++i) {
            var logicgroup = this.logicgroups[this.groupnames[i]];
            if (logicgroup !== undefined) {
                for (var l = 0; l < logicgroup.length; ++l) {
                    if (logicgroup[l].finished) {
                        logicgroup.splice(l,1);
                        l -= 1;
                        continue;
                    }
                    logicgroup[l].update(delta, newtime);
                }
            }
        }

        setTimeout(this.update.bind(this), this.updateTimestep);
    };

    Game.prototype.load = function (config) {
        this.configs[config.name] = config;
        config.load();
    };

    Game.prototype.unload = function (name) {
        this.configs[name].unload();
        delete this.configs[name];
    };

    Game.prototype.activateGroup = function (name) {
        if (this.groupnames.indexOf(name) == -1) this.groupnames.push(name);
    };

    Game.prototype.deleteGroup = function (name) {
        var i = this.groupnames.indexOf(name);
        if (i != -1) this.groupnames.splice(i,1);

        delete this.physicsworlds[name];
        delete this.physicsbinders[name];
        delete this.logicgroups[name];
        delete this.gamewindows[name];
        delete this.localmessagebusses[name];
    };

    Game.prototype.onResize = function () {
        for (var i = 0; i < this.groupnames.length; ++i) {
            var gws = this.gamewindows[this.groupnames[i]];
            if (gws != undefined) {
                for (var gw = 0; gw < gws.length; ++gw) {
                    gws[gw].resize(window.innerWidth, window.innerHeight);
                }
            }
        }
    };

    Game.prototype.onClick = function (mouseevent) {
        this.messagebus.sendMessage("click", mouseevent);
    };

    Game.prototype.onMouseMove = function (mouseevent) {
        this.messagebus.sendMessage("mousemove", mouseevent);
    };

    Game.prototype.onKeyDown = function (keyevent) {
        this.messagebus.sendMessage("keydown", keyevent);
    };

    Game.prototype.onKeyUp = function (keyevent) {
        this.messagebus.sendMessage("keyup", keyevent);
    };

    return Game;
});
