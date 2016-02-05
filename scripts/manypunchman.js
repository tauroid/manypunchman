define(["common/matter.min", "common/pixi.min", "pixiwindow",
        "matter-pixi-binder", "player", "animation", "controller"],
        function (Matter, PIXI, PIXIWindow, MatterPIXIBinder,
                  Player, Animation, Controller) {
    ManyPunchMan = function (game) {
        this.name = "manypunchman";
        this.game = game;

        this.stagescale = 16;
    };

    ManyPunchMan.prototype.load = function () {
        var mpm = this;
        var bgmusic = this.game.assets.audio.MANYPUNCH1;
        bgmusic._loop = true;
        bgmusic._volume = 1.0;
        bgmusic.play();

        this.stage = new PIXI.Container();
        this.levelstage = new PIXI.Container();
        this.levelstage.scale.x = this.stagescale; this.levelstage.scale.y = this.stagescale;
        this.housestage = new PIXI.Container();

        this.levelstage.addChild(this.housestage);
        this.stage.addChild(this.levelstage);

        var gamewindow = new PIXIWindow(null, null, this.stage);

        this.game.gamewindows[this.name] = [];
        this.game.gamewindows[this.name].push(gamewindow);

        this.binder = new MatterPIXIBinder(1);

        var engine = Matter.Engine.create(undefined, { enableSleeping: true, positionIterations: 8 });
        this.world = engine.world;
        this.world.gravity.y = 0.2;

        var controller = new Controller();
        controller.attach(this.game);
        controller.noise = this.game.assets.audio.bap;

        this.game.logicgroups[this.name] = [];

        this.player = new Player(this.game, this.levelstage, this.world, this.binder,
                                controller.messagebus, this.name);

        this.player.load();

        this.frontstage = new PIXI.Container();
        this.levelstage.addChild(this.frontstage);

        this.loadCamera(this.player);

        this.loadHouse();

        var physsyncname = this.name + "-physsync";
        this.game.logicgroups[physsyncname] = [];
        //this.game.logicgroups[physsyncname].push({
        //    update: (delta, time) => binder.syncAll2to1()
        //});

        var physname = this.name + "-phys";
        this.game.logicgroups[physname] = [];
        this.game.logicgroups[physname].push({
            update: function (delta, time) {
                delta = Math.max(Math.min(delta, 50), 10);
                if (!this.deltahistory) this.deltahistory = [];
                this.deltahistory.push(delta);
                if (this.deltahistory.length > 5) this.deltahistory.splice(0, 1);
                if (this.lastDelta) var correction = delta / this.lastDelta;
                delta = this.deltahistory.reduce((prev, curr) => prev + curr)/this.deltahistory.length;
                Matter.Engine.update(engine, delta);
                this.lastDelta = delta;
            }
        });

        var pixisyncname = this.name + "-pixisync";
        this.game.logicgroups[pixisyncname] = [];
        this.game.logicgroups[pixisyncname].push({
            update: function (delta, time) {
                mpm.binder.syncAll1to2();
            }
        });


        this.game.activateGroup(this.name);
        this.game.activateGroup(physsyncname);
        this.game.activateGroup(physname);
        this.game.activateGroup(pixisyncname);
    };

    ManyPunchMan.prototype.unload = function () {
        this.game.deleteGroup(this.name);
    };

    ManyPunchMan.prototype.loadCamera = function (player) {
        var mpm = this;
        var cameragroupname = this.name + "-camera";

        this.game.logicgroups[cameragroupname] = [];
        this.game.logicgroups[cameragroupname].push({
            update: function (delta, time) {
                var pos = new PIXI.Point(player.spritecontainer.worldTransform.tx,
                                         player.spritecontainer.worldTransform.ty);
                pos.x += player.sprite.width / 2 * mpm.stagescale;
                pos.y += player.sprite.height / 2 * mpm.stagescale;

                var leftedge = window.innerWidth * 1/3;
                var rightedge = window.innerWidth * 2/3;
                var topedge = window.innerHeight * 1/3;
                var bottomedge = window.innerHeight * 2/3;

                if (pos.x < leftedge)
                    mpm.levelstage.position.x += -(pos.x - leftedge);
                else if (pos.x > rightedge)
                    mpm.levelstage.position.x += -(pos.x - rightedge);

                if (pos.y < topedge)
                    mpm.levelstage.position.y += -(pos.y - topedge);
                else if (pos.y > bottomedge)
                    mpm.levelstage.position.y += -(pos.y - bottomedge);
            }
        });

        this.game.activateGroup(cameragroupname);
    };

    ManyPunchMan.prototype.loadHouse = function () {
        var mpm = this;
        var images = this.game.assets.images;
        var audio = this.game.assets.audio;

        var bg = new PIXI.Sprite(images.jamhouse1);
        this.housestage.addChild(bg);

        this.addStaticPhysicsRect(0, 20, 92, 2);
        this.addStaticPhysicsRect(102, 20, 4, 2);
        this.addStaticPhysicsRect(0, 2, 2, 18);
        this.addStaticPhysicsRect(-20, 38, 126, 4);
        this.addStaticPhysicsRect(105, 2, 2, 38);

        // Bedroom door
        this.addDoor(images.jamdoor1, images.jamdoor1_broke, new PIXI.Rectangle(44, 6, 2, 14));

        // Bathroom door
        this.addDoor(images.jamdoor2, images.jamdoor2_broke, new PIXI.Rectangle(87, 6, 2, 14));
        
        // Downstairs door
        this.addDoor(images.jamdoor3, images.jamdoor3_broke, new PIXI.Rectangle(87, 24, 2, 14));

        // Kitchen door
        this.addDoor(images.jamdoor4, images.jamdoor4_broke, new PIXI.Rectangle(44, 24, 2, 14));

        { // Sink
        var sinkcont = new PIXI.Container();
        var sink = new PIXI.Sprite(images.jamsink);
        var sinkbroke = new PIXI.Sprite(images.jamsink_broke);
        sinkcont.addChild(sink);
        this.housestage.addChild(sinkcont);

        var sinkpunchable = this.makeStaticPunchable
            (sinkcont, new PIXI.Rectangle(52, 12, 5, 6), undefined, sink, sinkbroke);
        this.player.addPunchable(sinkpunchable.region, sinkpunchable.callback);
        }

        { // Shower
        var showercont = new PIXI.Container();
        var shower = new PIXI.Sprite(images.jamshower);
        var showeron = Animation.fromSpritesheet(images.jamshower_on1, 107, 41, true, 3);
        showeron.play(this.game);
        var showerbroke = new PIXI.Sprite(images.jamshower_broke);
        showercont.addChild(shower);
        this.housestage.addChild(showercont);

        audio.shower._loop = true;

        var showerrect = new PIXI.Rectangle(61, 4, 9, 15);
        var showercallback = function () {
            if (!this.on) {
                showercont.removeChild(shower);
                showercont.addChild(showeron.sprite);
                this.on = true;
                audio.shower.play();
                audio.putonclothes.play();

                mpm.player.workreadystates.clean = true;
                return true;
            } else {
                showercont.removeChild(showeron.sprite);
                showeron.stop();
                showercont.addChild(showerbroke);
                audio.shower.stop();
                audio.break1.play();

                return false;
            }
        };
        this.player.addPunchable(showerrect, showercallback);
        }

        { // Toilet
        var toiletcont = new PIXI.Container();
        var toilet = new PIXI.Sprite(images.jamtoilet);
        var toiletbroke = new PIXI.Sprite(images.jamtoilet_broke);
        toiletcont.addChild(toilet);
        this.housestage.addChild(toiletcont);

        var toiletpunchable = this.makeStaticPunchable
            (toiletcont, new PIXI.Rectangle(73, 13, 7, 7), undefined, toilet, toiletbroke);
        this.player.addPunchable(toiletpunchable.region, toiletpunchable.callback);
        }

        { // Alarm clock
        var clockcont = new PIXI.Container();
        var clock = new PIXI.Sprite(images.jamclock);
        var clockbroke = new PIXI.Sprite(images.jamclock_broke);
        clockcont.pivot = new PIXI.Point(35, 12);
        clockcont.position = clockcont.pivot.clone();
        clockcont.addChild(clock);
        this.housestage.addChild(clockcont);

        var alarmnoise = audio.alarm;
        alarmnoise._loop = true;
        alarmnoise.play();

        var clockrect = new PIXI.Rectangle(-3, -2.5, 6, 4);
        var clockpunchable = this.makeDynamicPunchable
            (clockcont, clockrect.width, clockrect.height,
             { sprite: clock, brokesprite: clockbroke,
               action: function () { alarmnoise.stop(); audio.break1.play(); } });
        this.player.addPunchable(clockpunchable.region, clockpunchable.callback);
        }
        
        { // Wardrobe
        var wardrobecont = new PIXI.Container();
        var wardrobe = new PIXI.Sprite(images.jamwardrobe);
        var wardrobebroke = new PIXI.Sprite(images.jamwardrobe_broke);
        wardrobecont.addChild(wardrobe);

        var clothescont = new PIXI.Container();
        clothescont.visible = false;

        this.housestage.addChild(clothescont);
        this.housestage.addChild(wardrobecont);

        var tshirt = new PIXI.Sprite(images.jamtshirt);
        var pants = new PIXI.Sprite(images.jampants);

        tshirt.position = new PIXI.Point(5, 12);
        pants.position = new PIXI.Point(5, 12);

        tshirt.pivot = new PIXI.Point(tshirt.width/2, tshirt.height/2);
        pants.pivot = new PIXI.Point(pants.width/2, pants.height/2);

        clothescont.addChild(tshirt);
        clothescont.addChild(pants);

        this.addStaticPhysicsRect(2, 8, 4, 13, 2);

        var tshirtlogicgen = (punchable) => ({
            update: function(delta, time) {
                var pcont = mpm.player.spritecontainer;
                var dist = Math.sqrt(Math.pow(tshirt.position.x - pcont.position.x, 2) +
                                     Math.pow(tshirt.position.y - pcont.position.y + 3, 2));
                if (dist < 2) {
                    if (!mpm.player.workreadystates.clean) {
                        mpm.error("TOO DIRTY FOR CLOTHES!!");

                        return;
                    }

                    mpm.player.putShirtOn();

                    clothescont.removeChild(tshirt);

                    Matter.World.remove(mpm.world, punchable.body);

                    mpm.binder.unbindState(punchable.binding);

                    audio.putonclothes.play();

                    this.finished = true;
                }
            }
        });

        var pantslogicgen = (punchable) => ({
            update: function (delta, time) {
                var pcont = mpm.player.spritecontainer;
                var dist = Math.sqrt(Math.pow(pants.position.x - pcont.position.x, 2) +
                                     Math.pow(pants.position.y - pcont.position.y - 3, 2));
                if (dist < 2) {
                    if (!mpm.player.workreadystates.clean) {
                        mpm.error("TOO DIRTY FOR CLOTHES!!");

                        return;
                    }

                    mpm.player.putPantsOn();

                    clothescont.removeChild(pants);

                    Matter.World.remove(mpm.world, punchable.body);

                    mpm.binder.unbindState(punchable.binding);

                    audio.putonclothes.play();

                    this.finished = true;
                }
            }
        });

        var wardroberect = new PIXI.Rectangle(2, 7, 4, 13);
        var wardrobecallback = (function () {
            audio.break2.play();

            var velocity = Matter.Vector.create(0.4,2);

            var tshirtpunchable = this.makeDynamicPunchable(tshirt, tshirt.width, tshirt.height,
                                                            { velocity: velocity, preactivate: true });
            var pantspunchable = this.makeDynamicPunchable(pants, pants.width, pants.height,
                                                           { velocity: velocity, preactivate: true });

            var vel = Matter.Vector.create(2, 0);
            Matter.Body.setVelocity(tshirtpunchable.body, vel);
            Matter.Body.setVelocity(pantspunchable.body, vel);

            this.player.addPunchable(tshirtpunchable.region, tshirtpunchable.callback);
            this.player.addPunchable(pantspunchable.region, pantspunchable.callback);

            this.game.logicgroups[this.name].push(tshirtlogicgen(tshirtpunchable));
            this.game.logicgroups[this.name].push(pantslogicgen(pantspunchable));

            clothescont.visible = true;
        }).bind(this);
        var wardrobepunchable = this.makeStaticPunchable
            (wardrobecont, wardroberect, wardrobecallback, wardrobe, wardrobebroke);
        this.player.addPunchable(wardrobepunchable.region, wardrobepunchable.callback);
        }

        { // Stairs
        var stairsfloor = this.addStaticPhysicsRect(92, 20, 10, 2, 2, 2);
        var stairwallleft = this.addStaticPhysicsRect(90, 10, 2, 30, 2, 2);
        var stairwallright = this.addStaticPhysicsRect(102, 10, 2, 30, 2, 2);
        Matter.World.remove(this.world, stairwallleft);
        Matter.World.remove(this.world, stairwallright);

        var staircover = new PIXI.Sprite(images.jamstaircover);
        this.frontstage.addChild(staircover);

        var getsetbodypos = (body) => (x, y) => Matter.Body.setPosition(body, Matter.Vector.create(x, y));
        var setfloorpos = getsetbodypos(stairsfloor);
        var setwallleftpos = getsetbodypos(stairwallleft);
        var setwallrightpos = getsetbodypos(stairwallright);

        var mm = this.game.movements;
        var s = this.player.spritecontainer;
        var p = s.position;
        var lift = (movecallback) => () => {
            var leftposx = p.x - s.width / 2;
            var rightposx = p.x + s.width / 2;
            var posy = stairwallleft.position.y;

            setwallleftpos(leftposx, posy);
            setwallrightpos(rightposx, posy);

            Matter.World.add(this.world, stairwallleft);
            Matter.World.add(this.world, stairwallright);

            mm.move(setwallleftpos, leftposx, posy, 97 - s.width / 2, posy, 200, undefined, () => {
                movecallback(() => {
                    Matter.World.remove(this.world, stairwallleft);
                    Matter.World.remove(this.world, stairwallright);
                });
            });

            mm.move(setwallrightpos, rightposx, posy, 97 + s.width / 2, posy, 200);
        };

        var upstairpunchregion = new PIXI.Rectangle(94, 8, 6, 11);
        var upstaircallback = () => {
            if (!this.player.workreadystates.clean || !this.player.workreadystates.clothed) {
                this.error("GOING DOWNSTAIRS WITHOUT CLOTHES ON??");

                return true;
            }

            ( lift((fn) => mm.move(setfloorpos, stairsfloor.position.x, 21, stairsfloor.position.x, 39, 1500, undefined, fn)) )();

            return true;
        };

        this.player.addPunchable(upstairpunchregion, upstaircallback);

        var downstairpunchregion = new PIXI.Rectangle(94, 26, 6, 11);
        var downstaircallback = () => {
            ( lift((fn) => mm.move(setfloorpos, stairsfloor.position.x, 39, stairsfloor.position.x, 21, 1500, undefined, fn)) )();

            return true;
        };

        this.player.addPunchable(downstairpunchregion, downstaircallback);
        }

        { // TV
        var tvcont = new PIXI.Container();
        var tv = new PIXI.Sprite(images.jamtv);
        var tvbroke = new PIXI.Sprite(images.jamtv_broke);
        var chair = new PIXI.Sprite(images.jamchair);
        tvcont.addChild(tv);
        this.housestage.addChild(tvcont);
        this.housestage.addChild(chair);

        var tvpunchable = this.makeStaticPunchable
            (tvcont, new PIXI.Rectangle(14, 28, 7, 9), undefined, tv, tvbroke);
        this.player.addPunchable(tvpunchable.region, tvpunchable.callback);
        }

        { // Kitchen
            var catbowl = new PIXI.Sprite(images.jamcatbowl);
            var catfood = new PIXI.Sprite(images.jamcatfood);
            catfood.pivot = new PIXI.Point(62, 29.5);
            catfood.position = catfood.pivot.clone();

            this.addStaticPhysicsRect(73, 37, 6, 2, 1, 4);
            this.addStaticPhysicsRect(73, 36, 1, 3, 1, 4);
            this.addStaticPhysicsRect(78, 36, 1, 3, 1, 4);

            this.bowlrect = new PIXI.Rectangle(73, 35, 6, 3);

            this.pellets = [];
            var pelletbodies = [];
            var pelletpunchables = [];
            var pelletpivot = new PIXI.Point(0.5, 0.5);

            for (var i = 0; i < 4; ++i) {
                var pellet = new PIXI.Sprite(images.jamcatfoodpellet);
                pellet.pivot = pelletpivot;
                pellet.position = new PIXI.Point(catfood.position.x - 0.5 + i % 2,
                                                 catfood.position.y - 0.5 - Math.floor(i/2));
                var pelletpunchable = this.makeDynamicPunchable(pellet, 1, 1);

                this.pellets.push(pellet);
                this.housestage.addChild(pellet);
                pelletpunchables.push(pelletpunchable);
            }

            this.housestage.addChild(catbowl);
            this.housestage.addChild(catfood);

            var foodrect = new PIXI.Rectangle(-2, -2.5, 4, 5);
            var foodpunchable = this.makeDynamicPunchable
                (catfood, 4, 5, { action: () => {
                    for (var i = 0; i < pelletpunchables.length; ++i) {
                        pelletpunchables[i].callback();
                    }
                } });
            for (var i = 0; i < pelletpunchables.length; ++i) {
                this.player.addPunchable(pelletpunchables[i].region, pelletpunchables[i].callback);
            }
            this.player.addPunchable(foodpunchable.region, foodpunchable.callback);
        }

        // Front door
        this.addDoor(images.jamdoor5, images.jamdoor5_broke, new PIXI.Rectangle(1, 24, 2, 14), () => {
            for (var i = 0; i < this.pellets.length; ++i) {
                if (!this.bowlrect.contains(this.pellets[i].position.x, this.pellets[i].position.y)) {
                    this.error("CAT HAS TO EAT, MAN!!");

                    return false;
                }
            }
            
            this.error("YOU MADE IT, WELL DONE!");
            audio.putonclothes.play();

            return true;
        });
    };

    ManyPunchMan.prototype.addDoor = function (doortex, doorbroketex, doorrect, gatefn) {
        var audio = this.game.assets.audio;

        var doorcont = new PIXI.Container();
        var door = new PIXI.Sprite(doortex);
        var doorbroke = new PIXI.Sprite(doorbroketex);
        doorcont.addChild(door);
        this.housestage.addChild(doorcont);

        var doorbody = this.addStaticPhysicsRect(doorrect.x, doorrect.y, doorrect.width, doorrect.height);
        var punchrect = new PIXI.Rectangle(doorrect.x - 1, doorrect.y, doorrect.width + 2, doorrect.height);

        var doorpunchable = this.makeStaticPunchable
            (doorcont, punchrect, (function () {
                Matter.World.remove(this.world, doorbody);
                audio.break2.play();
            }).bind(this), door, doorbroke, gatefn);
        this.player.addPunchable(doorpunchable.region, doorpunchable.callback);
    };

    ManyPunchMan.prototype.addStaticPhysicsRect = function (x, y, width, height, category, mask) {
        var collisionFilter = {};
        if (category) collisionFilter.category = category;
        if (mask) collisionFilter.mask = mask;

        var body = Matter.Bodies.rectangle(x + width / 2, y + height / 2, width, height,
            { isStatic: true, collisionFilter: collisionFilter });
        Matter.World.add(this.world, [ body ]);

        /*var physgraphics = (new PIXI.Graphics())
            .beginFill(0xFF0000, 1)
            .drawRect(x, y, width, height)
            .endFill();

        this.levelstage.addChild(physgraphics);*/

        return body;
    };

    ManyPunchMan.prototype.error = function (text) {
        if (this.erroring) return;

        var mpm = this;
        var audio = this.game.assets.audio;

        var errortext = new PIXI.Text(text,
                { font: "120px EightBitOperator", fill: "red", align: "center",
                  wordWrap: true, wordWrapWidth: window.innerWidth * 3/5 });
        errortext.position.x = window.innerWidth / 2 - errortext.width / 2;
        errortext.position.y = window.innerHeight / 2 - errortext.height / 2;

        this.stage.addChild(errortext);

        audio.error.play();

        this.game.logicgroups[this.name].push({
            startTime: (new Date()).getTime(),
            update: function (delta, time) {
                var runtime = (new Date()).getTime() - this.startTime;
                var flashms = 800;

                if (runtime > 2400) {
                    mpm.stage.removeChild(errortext);
                    mpm.erroring = false;
                    this.finished = true;

                    return;
                }

                if (runtime % flashms < flashms / 2 && !errortext.visible) {
                    errortext.visible = true;
                    audio.error.play();
                } else if (runtime % flashms > flashms / 2 && errortext.visible)
                    errortext.visible = false;
            }
        });

        this.erroring = true;
    };

    ManyPunchMan.prototype.makeStaticPunchable = function (container, rect, action, sprite, brokesprite, preaction) {
        return {
            region: rect,
            callback: function () {
                if (preaction && !preaction()) return true;

                if (sprite && brokesprite) {
                    container.removeChild(sprite);
                    container.addChild(brokesprite);
                }

                if (action) return action();
            }
        };
    };

    ManyPunchMan.prototype.makeDynamicPunchable = function (container, width, height, options) {
        var mpm = this;
        if (!options) options = {};
        var punchable = {};

        var activatePhysics = function () {
            if (!options.category) options.category = 4;
            if (!options.mask) options.mask = 1;

            punchable.body = Matter.Bodies.rectangle
                (container.position.x, container.position.y, width, height,
                    { collisionFilter: { category: options.category,
                                         mask: options.mask }});
            Matter.World.add(mpm.world, [ punchable.body ]);
            punchable.binding = mpm.binder.bindState(punchable.body, container);
        };

        if (options.preactivate) activatePhysics();

        punchable.region = {
            contains: function (x, y) {
                var wt = container.worldTransform.clone();

                wt.tx -= mpm.levelstage.position.x; wt.ty -= mpm.levelstage.position.y;

                wt.a /= mpm.stagescale; wt.b /= mpm.stagescale;
                wt.c /= mpm.stagescale; wt.d /= mpm.stagescale;
                wt.tx /= mpm.stagescale; wt.ty /= mpm.stagescale;

                var targetPoint = wt.applyInverse(new PIXI.Point(x, y));
                targetPoint.x = targetPoint.x - container.pivot.x;
                targetPoint.y = targetPoint.y - container.pivot.y;
                var rect = new PIXI.Rectangle(-width/2, -height/2, width, height);
                if (rect.contains(targetPoint.x, targetPoint.y)) return true;
                
                return false;
            }
        };
        punchable.callback = function () {
            if (!punchable.broken) {
                if (options.sprite) container.removeChild(options.sprite);
                if (options.brokesprite) container.addChild(options.brokesprite);
    
                if (!options.preactivate) activatePhysics();
                if (!options.velocity) punchable.velocity = Matter.Vector.create(1, 1.5);
                else punchable.velocity = options.velocity;
                punchable.broken = true;

                if (options.action) options.action();
            }
    
            var xdist = punchable.body.position.x - mpm.player.spritebody.position.x;
            var xdir = Math.sign(xdist);
            Matter.Body.setVelocity
                (punchable.body, Matter.Vector.create(punchable.velocity.x * xdir, -punchable.velocity.y));
            Matter.Body.setAngularVelocity(punchable.body, 0.3 * xdir);

            if (options.repeatAction) return options.repeatAction(punchable);
            else return true;
        };

        return punchable;
    };

    return ManyPunchMan;
});
