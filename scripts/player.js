define(["matter.min", "app/animation"], function (Matter, Animation) {
    Player = function (game, stage, matterworld, binder, controlbus, groupname) {
        this.name = groupname ? groupname : "player";
        this.game = game;
        this.stage = stage;
        this.matterworld = matterworld;
        this.binder = binder;
        this.controlbus = controlbus;
        this.punchables = [];
        this.targetPunchable = null;
    };

    Player.prototype.load = function () {
        var images = this.game.assets.images;

        this.walkleft = Animation.fromSpritesheet(images.wpnman_walkleft, 9, 13, true); 
        this.walkright = Animation.fromSpritesheet(images.wpnman_walkright, 9, 13, true);
        this.punchleft = Animation.fromSpritesheet(images.wpnman_punchleft, 9, 13, true);
        this.punchright = Animation.fromSpritesheet(images.wpnman_punchright, 9, 13, true);
        this.idlesprite = new PIXI.Sprite(images.wpnman_idle);

        this.punchleft.frame_delayms = 80;
        this.punchright.frame_delayms = 80;

        this.walkleft.play(this.game);
        this.walkright.play(this.game);
        this.sprite = this.idlesprite;
        this.spritecontainer = new PIXI.Container();
        this.spritecontainer.pivot = new PIXI.Point
            (this.sprite.width / 2, this.sprite.height / 2);
        this.spritecontainer.addChild(this.sprite);
        this.stage.addChild(this.spritecontainer);

        this.spritebody = Matter.Bodies.rectangle
            (10, 0, this.sprite.width-2, this.sprite.height,
             { sleepThreshold: 10, density: 1000, inertia: Infinity, 
               inverseInertia: 0, friction: 0.5 });

        Matter.World.add(this.matterworld, [ this.spritebody ]);

        this.bodybinding = this.binder.bindState(this.spritebody, this.spritecontainer);

        this.controlbus.registerOnChannel("control", this);

        this.playeractuator = this.createActuator(this.spritebody);

        if (!this.game.logicgroups.hasOwnProperty(this.name)) this.game.logicgroups[this.name] = [];
        this.game.logicgroups[this.name].push(this.playeractuator);
    };

    Player.prototype.changeSprite = function (newsprite) {
        this.spritecontainer.removeChild(this.sprite);
        this.sprite = newsprite;
        this.spritecontainer.addChild(this.sprite);
    };

    Player.prototype.addPunchable = function (rect, callback) {
        if (rect) this.punchables.push([rect, callback]);
    };

    Player.prototype.getPunchable = function (pos) {
        for (var i = 0; i < this.punchables.length; ++i) {
            if (this.punchables[i][0].contains(pos.x, pos.y)) {
                return i;
            }
        }

        return -1;
    };

    Player.prototype.punch = function (i) {
        var callback = this.punchables[i][1];
        if (callback) {
            var keep = callback();
            if (!keep) this.punchables.splice(i,1);
        }
        this.targetPunchable = null;
    };

    Player.prototype.unload = function () {
        this.stage.removeChild(this.spritecontainer);
        Matter.World.remove(this.matterworld, this.spritebody);
        this.binder.unbindState(this.bodybinding);
        this.controlbus.unsubscribe(this);
    };

    Player.prototype.createActuator = function (body) {
        var V = Matter.Vector;
        var player = this;

        return {
            target: null,
            dir: -1,
            speed: 1,
            threshold: 5,
            punching: false,
            player: player,
            update: function (delta, time) {
                var p = this.player;
                //Matter.Body.setAngle(player.spritebody, 0);
                if (this.punching) return;

                if (this.target) {
                    var dist = this.target.x - p.spritebody.position.x;
                    if (Math.abs(dist) < this.threshold) {
                        this.target = null;
                        if (p.targetPunchable != null) {
                            Matter.Body.setVelocity(p.spritebody, V.create(0, p.spritebody.velocity.y));
                            this.punching = true;
                            if (this.dir > 0) {
                                p.changeSprite(p.punchright.sprite);
                                p.punchright.play
                                    (p.game, false, undefined, (function () {
                                        p.punch(p.targetPunchable);
                                        p.changeSprite(p.idlesprite);
                                        this.punching = false;
                                    }).bind(this));
                            } else if (this.dir < 0) {
                                p.changeSprite(p.punchleft.sprite);
                                p.punchleft.play
                                    (p.game, false, undefined, (function () {
                                        p.punch(p.targetPunchable);
                                        p.changeSprite(p.idlesprite);
                                        this.punching = false;
                                    }).bind(this));
                            }
                        } else {
                            p.changeSprite(p.idlesprite);
                        }
                    } else {
                        this.dir = dist > 0 ? 1 : -1;
                        Matter.Body.setVelocity(p.spritebody,
                            V.create(this.dir*this.speed, p.spritebody.velocity.y));
                        if (this.dir == 1 && p.sprite != p.walkright.sprite) {
                            p.changeSprite(p.walkright.sprite);
                            p.walkleft.pause();
                            p.walkright.resume();
                        } else if (this.dir == -1 && p.sprite != p.walkleft.sprite) {
                            p.changeSprite(p.walkleft.sprite);
                            p.walkright.pause();
                            p.walkleft.resume();
                        }
                    }
                } else {
                    Matter.Body.setVelocity(p.spritebody, V.create(0, p.spritebody.velocity.y));
                }
            }
        };
    };

    Player.prototype.receiveMessage = function (channel, message) {
        if (channel != "control") return;

        if (message.action == "activate") {
            var target = new PIXI.Point(message.x, message.y);
            this.stage.worldTransform.applyInverse(target, target);
            this.playeractuator.target = target;
            var p = this.getPunchable(target);
            if (p != -1) {
                this.targetPunchable = p;
            }
        }
    };

    return Player;
});
