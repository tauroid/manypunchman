define(["common/matter.min", "animation"], function (Matter, Animation) {
    Player = function (game, stage, matterworld, binder, controlbus, groupname) {
        this.name = groupname ? groupname : "player";
        this.game = game;
        this.stage = stage;
        this.matterworld = matterworld;
        this.binder = binder;
        this.controlbus = controlbus;
        this.punchables = [];
        this.targetPunchable = null;

        this.workreadystates = {
            clean: false,
            clothed: false,
            cat_fed: false
        };
    };

    Player.prototype.load = function () {
        var images = this.game.assets.images;

        this.walkleft = Animation.fromSpritesheet(images.wpnman_walkleft, 9, 13, true); 
        this.walkright = Animation.fromSpritesheet(images.wpnman_walkright, 9, 13, true);
        this.punchleft = Animation.fromSpritesheet(images.wpnman_punchleft, 9, 13, true);
        this.punchright = Animation.fromSpritesheet(images.wpnman_punchright, 9, 13, true);
        this.idlesprite = new PIXI.Sprite(images.wpnman_idle);

        this.nakedwalkleft = Animation.fromSpritesheet(images.wpnman_nakedwalkleft, 9, 13, true); 
        this.nakedwalkright = Animation.fromSpritesheet(images.wpnman_nakedwalkright, 9, 13, true);
        this.nakedpunchleft = Animation.fromSpritesheet(images.wpnman_nakedpunchleft, 9, 13, true);
        this.nakedpunchright = Animation.fromSpritesheet(images.wpnman_nakedpunchright, 9, 13, true);
        this.nakedidlesprite = new PIXI.Sprite(images.wpnman_nakedidle);

        this.nopantswalkleft = Animation.fromSpritesheet(images.wpnman_nopantswalkleft, 9, 13, true); 
        this.nopantswalkright = Animation.fromSpritesheet(images.wpnman_nopantswalkright, 9, 13, true);
        this.nopantspunchleft = Animation.fromSpritesheet(images.wpnman_nopantspunchleft, 9, 13, true);
        this.nopantspunchright = Animation.fromSpritesheet(images.wpnman_nopantspunchright, 9, 13, true);
        this.nopantsidlesprite = new PIXI.Sprite(images.wpnman_nopantsidle);

        this.noshirtwalkleft = Animation.fromSpritesheet(images.wpnman_noshirtwalkleft, 9, 13, true); 
        this.noshirtwalkright = Animation.fromSpritesheet(images.wpnman_noshirtwalkright, 9, 13, true);
        this.noshirtpunchleft = Animation.fromSpritesheet(images.wpnman_noshirtpunchleft, 9, 13, true);
        this.noshirtpunchright = Animation.fromSpritesheet(images.wpnman_noshirtpunchright, 9, 13, true);
        this.noshirtidlesprite = new PIXI.Sprite(images.wpnman_noshirtidle);

        var punchms = 50;
        this.punchleft.frame_delayms = punchms;
        this.punchright.frame_delayms = punchms;
        this.nakedpunchleft.frame_delayms = punchms;
        this.nakedpunchright.frame_delayms = punchms;
        this.nopantspunchleft.frame_delayms = punchms;
        this.nopantspunchright.frame_delayms = punchms;
        this.noshirtpunchleft.frame_delayms = punchms;
        this.noshirtpunchright.frame_delayms = punchms;

        this.nakedwalkleft.play(this.game);
        this.nakedwalkright.play(this.game);

        this.spritemap = {
            walkleft: this.nakedwalkleft,
            walkright: this.nakedwalkright,
            punchleft: this.nakedpunchleft,
            punchright: this.nakedpunchright,
            idlesprite: this.nakedidlesprite
        };

        this.sprite = this.spritemap.idlesprite;
        this.spritecontainer = new PIXI.Container();
        this.spritecontainer.pivot = new PIXI.Point
            (this.sprite.width / 2, this.sprite.height / 2);
        this.spritecontainer.addChild(this.sprite);
        this.stage.addChild(this.spritecontainer);

        this.spritebody = Matter.Bodies.rectangle
            (21.5, 15, this.sprite.width-2, this.sprite.height,
             { sleepThreshold: 10, density: 1000, inertia: Infinity, 
               inverseInertia: 0, friction: 0.5,
               collisionFilter: { category: 2 } });

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

    Player.prototype.startWalkAnimation = function () {
        this.spritemap.walkleft.play(this.game);
        this.spritemap.walkright.play(this.game);
    };

    Player.prototype.stopWalkAnimation = function () {
        this.spritemap.walkleft.stop();
        this.spritemap.walkright.stop();
    };

    Player.prototype.putPantsOn = function () {
        if (this.spritemap.idlesprite == this.nakedidlesprite) {
            this.stopWalkAnimation();

            this.spritemap.walkleft = this.noshirtwalkleft;
            this.spritemap.walkright = this.noshirtwalkright;
            this.spritemap.punchleft = this.noshirtpunchleft;
            this.spritemap.punchright = this.noshirtpunchright;
            this.spritemap.idlesprite = this.noshirtidlesprite;

            this.startWalkAnimation();
        } else if (this.spritemap.idlesprite == this.nopantsidlesprite) {
            this.putClothesOn();
        }
    };

    Player.prototype.putShirtOn = function () {
        if (this.spritemap.idlesprite == this.nakedidlesprite) {
            this.stopWalkAnimation();

            this.spritemap.walkleft = this.nopantswalkleft;
            this.spritemap.walkright = this.nopantswalkright;
            this.spritemap.punchleft = this.nopantspunchleft;
            this.spritemap.punchright = this.nopantspunchright;
            this.spritemap.idlesprite = this.nopantsidlesprite;

            this.startWalkAnimation();
        } else if (this.spritemap.idlesprite == this.noshirtidlesprite) {
            this.putClothesOn();
        }
    };

    Player.prototype.putClothesOn = function () {
        this.stopWalkAnimation();

        this.spritemap.walkleft = this.walkleft;
        this.spritemap.walkright = this.walkright;
        this.spritemap.punchleft = this.punchleft;
        this.spritemap.punchright = this.punchright;
        this.spritemap.idlesprite = this.idlesprite;

        this.startWalkAnimation();

        this.workreadystates.clothed = true;
    };

    Player.prototype.addPunchable = function (region, callback) {
        if (region) this.punchables.push([region, callback]);

        /*if (region.x) {
            var rectgraphics = new PIXI.Graphics();
            rectgraphics.beginFill(0x00FF00, 1)
                        .drawRect(region.x, region.y, region.width, region.height)
                        .endFill();
            this.stage.addChild(rectgraphics);
        }*/
    };

    Player.prototype.getPunchable = function (pos) {
        for (var i = this.punchables.length - 1; i >= 0; --i) {
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
        switch (Math.floor(Math.random()*3)) {
            case 0:
                this.game.assets.audio.punch.play();
                break;
            case 1:
                this.game.assets.audio.punch2.play();
                break;
            case 2:
                this.game.assets.audio.punch3.play();
                break;
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
            punchDistance: 8,
            punching: false,
            player: player,
            punchTarget: null,
            stallTime: 0,
            stallThreshold: 0.3,
            stallStopTime: 60,
            lastx: player.spritebody.position.x,
            update: function (delta, time) {
                var p = this.player;
                //Matter.Body.setAngle(player.spritebody, 0);
                if (this.punching) return;

                if (this.target) {
                    if (Math.abs(p.spritebody.position.x - this.lastx) / delta * 1000 < this.stallThreshold) this.stallTime += delta;
                    else this.stallTime = 0;
                    this.lastx = p.spritebody.position.x;

                    var xdist = this.target.x - p.spritebody.position.x;
                    var dist = Math.max(Math.abs(xdist), Math.abs(this.target.y - p.spritebody.position.y));

                    // Made it!
                    if (dist < this.threshold || this.stallTime > Math.max(this.stallStopTime, delta * 2) ||
                        Math.abs(xdist) < this.threshold && dist < this.punchDistance) {
                        this.target = null;
                        if (p.targetPunchable != null && Math.abs(dist) < this.punchDistance) {
                            Matter.Body.setVelocity(p.spritebody, V.create(0, p.spritebody.velocity.y));
                            this.punching = true;
                            this.punchTarget = p.targetPunchable;
                            if (this.dir > 0) {
                                p.changeSprite(p.spritemap.punchright.sprite);
                                p.spritemap.punchright.play
                                    (p.game, false, undefined, (function () {
                                        p.punch(this.punchTarget);
                                        p.changeSprite(p.spritemap.idlesprite);
                                        this.punching = false;
                                    }).bind(this));
                            } else if (this.dir < 0) {
                                p.changeSprite(p.spritemap.punchleft.sprite);
                                p.spritemap.punchleft.play
                                    (p.game, false, undefined, (function () {
                                        p.punch(this.punchTarget);
                                        p.changeSprite(p.spritemap.idlesprite);
                                        this.punching = false;
                                    }).bind(this));
                            }
                        } else {
                            p.changeSprite(p.spritemap.idlesprite);
                        }
                        this.stallTime = 0;
                    // Not there yet
                    } else if (Math.abs(xdist) > this.threshold) {
                        this.dir = xdist > 0 ? 1 : -1;
                        Matter.Body.setVelocity(p.spritebody,
                            V.create(this.dir*this.speed, p.spritebody.velocity.y));
                        if (this.dir == 1 && p.sprite != p.walkright.sprite) {
                            p.changeSprite(p.spritemap.walkright.sprite);
                            p.walkleft.pause();
                            p.walkright.resume();
                        } else if (this.dir == -1 && p.sprite != p.spritemap.walkleft.sprite) {
                            p.changeSprite(p.spritemap.walkleft.sprite);
                            p.walkright.pause();
                            p.walkleft.resume();
                        }
                    // Never gonna
                    } else {
                        p.changeSprite(p.spritemap.idlesprite);
                        this.target = null;
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
            } else {
                this.targetPunchable = null;
            }
        }
    };

    return Player;
});
