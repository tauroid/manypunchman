define(["matter.min", "pixi.min", "app/pixiwindow", "app/matter-pixi-binder",
        "app/player", "app/animation", "app/controller"],
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
        bgmusic.loop = true;
        //bgmusic.play();

        this.stage = new PIXI.Container();
        this.stage.scale.x = this.stagescale; this.stage.scale.y = this.stagescale;
        this.housestage = new PIXI.Container();

        this.stage.addChild(this.housestage);

        var gamewindow = new PIXIWindow(null, null, this.stage);

        this.game.gamewindows[this.name] = [];
        this.game.gamewindows[this.name].push(gamewindow);

        this.binder = new MatterPIXIBinder(1);

        var engine = Matter.Engine.create(undefined, { enableSleeping: true, positionIterations: 8 });
        this.world = engine.world;
        this.world.gravity.y = 0.5;

        var controller = new Controller();
        controller.attach(this.game);
        controller.noise = this.game.assets.audio.bap;

        this.player = new Player(this.game, this.stage, this.world, this.binder,
                                controller.messagebus, this.name);

        this.player.load();

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
                delta = Math.min(delta, 50);
                if (this.lastDelta) var correction = delta / this.lastDelta;
                Matter.Engine.update(engine, delta, correction);
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
                var pos = new PIXI.Point(player.sprite.worldTransform.tx,
                                         player.sprite.worldTransform.ty);
                pos.x += player.sprite.width / 2 * mpm.stagescale;
                pos.y += player.sprite.height / 2 * mpm.stagescale;

                var leftedge = window.innerWidth * 1/3;
                var rightedge = window.innerWidth * 2/3;
                var topedge = window.innerHeight * 1/3;
                var bottomedge = window.innerHeight * 2/3;

                if (pos.x < leftedge)
                    mpm.stage.position.x += -(pos.x - leftedge);
                else if (pos.x > rightedge)
                    mpm.stage.position.x += -(pos.x - rightedge);

                if (pos.y < topedge)
                    mpm.stage.position.y += -(pos.y - topedge);
                else if (pos.y > bottomedge)
                    mpm.stage.position.y += -(pos.y - bottomedge);
            }
        });

        this.game.activateGroup(cameragroupname);
    };

    ManyPunchMan.prototype.loadHouse = function () {
        var mpm = this;
        var images = this.game.assets.images;

        var bg = new PIXI.Sprite(images.jamhouse1);
        this.housestage.addChild(bg);

        Matter.World.add(this.world,
            [ Matter.Bodies.rectangle(50, 26, 100, 12, { isStatic: true }) ]);

        { // Wardrobe
        var wardrobecont = new PIXI.Container();
        var wardrobe = new PIXI.Sprite(images.jamwardrobe);
        var wardrobebroke = new PIXI.Sprite(images.jamwardrobe_broke);
        wardrobecont.addChild(wardrobe);
        this.housestage.addChild(wardrobecont);

        Matter.World.add(this.world, 
            [ Matter.Bodies.rectangle(3, 14.5, 6, 13, { isStatic: true }) ]);

        var wardroberect = new PIXI.Rectangle(2, 8, 4, 13);
        var wardrobepunchable = this.makeStaticPunchable
            (wardrobecont, wardroberect, undefined, wardrobe, wardrobebroke);
        this.player.addPunchable(wardrobepunchable.region, wardrobepunchable.callback);
        }

        { // Bedroom door
        var doorcont = new PIXI.Container();
        var door = new PIXI.Sprite(images.jamdoor1);
        var doorbroke = new PIXI.Sprite(images.jamdoor1_broke);
        doorcont.addChild(door);
        this.housestage.addChild(doorcont);

        var doorbody = Matter.Bodies.rectangle(45, 13, 2, 14, { isStatic: true });
        Matter.World.add(this.world, doorbody);

        var doorpunchable = this.makeStaticPunchable
            (doorcont, new PIXI.Rectangle(43, 6, 4, 14), 
             () => Matter.World.remove(this.world, doorbody), door, doorbroke);
        this.player.addPunchable(doorpunchable.region, doorpunchable.callback);
        }

        { // Sink
        var sinkcont = new PIXI.Container();
        var sink = new PIXI.Sprite(images.jamsink);
        var sinkbroke = new PIXI.Sprite(images.jamsink_broke);
        sinkcont.addChild(sink);
        this.housestage.addChild(sinkcont);

        var sinkpunchable = this.makeStaticPunchable
            (sinkcont, new PIXI.Rectangle(52, 12, 5, 6), undefined, sink, sinkbroke);
        this.player.addPunchable(sinkpunchable.region, sinkpunchable.callback);
        };

        { // Shower
        var showercont = new PIXI.Container();
        var shower = new PIXI.Sprite(images.jamshower);
        var showeron = Animation.fromSpritesheet(images.jamshower_on1, 107, 41, true, 3);
        showeron.play(this.game);
        var showerbroke = new PIXI.Sprite(images.jamshower_broke);
        showercont.addChild(shower);
        this.housestage.addChild(showercont);

        var showerrect = new PIXI.Rectangle(61, 4, 9, 15);
        var showercallback = function () {
            if (!this.on) {
                showercont.removeChild(shower);
                showercont.addChild(showeron.sprite);
                this.on = true;

                return true;
            } else {
                showercont.removeChild(showeron.sprite);
                showeron.stop();
                showercont.addChild(showerbroke);

                return false;
            }
        };
        this.player.addPunchable(showerrect, showercallback);
        }

        { // Alarm clock
        var clockcont = new PIXI.Container();
        var clock = new PIXI.Sprite(images.jamclock);
        var clockbroke = new PIXI.Sprite(images.jamclock_broke);
        clockcont.pivot = new PIXI.Point(35, 12);
        clockcont.position = clockcont.pivot.clone();
        clockcont.addChild(clock);
        this.housestage.addChild(clockcont);

        var clockrect = new PIXI.Rectangle(-3, -2.5, 6, 4);
        var clockpunchable = this.makeDynamicPunchable
            (clockcont, clockrect.width, clockrect.height,
             { sprite: clock, brokesprite: clockbroke });
        this.player.addPunchable(clockpunchable.region, clockpunchable.callback);
        }
    };

    ManyPunchMan.prototype.makeStaticPunchable = function (container, rect, action, sprite, brokesprite) {
        return {
            region: rect,
            callback: function () {
                if (sprite && brokesprite) {
                    container.removeChild(sprite);
                    container.addChild(brokesprite);
                }

                if (action) action();
            }
        };
    };

    ManyPunchMan.prototype.makeDynamicPunchable = function (container, width, height, options) {
        var mpm = this;
        return {
            region: {
                contains: function (x, y) {
                    var wt = container.worldTransform.clone();

                    wt.tx -= mpm.stage.position.x; wt.ty -= mpm.stage.position.y;

                    wt.a /= mpm.stagescale; wt.b /= mpm.stagescale;
                    wt.c /= mpm.stagescale; wt.d /= mpm.stagescale;
                    wt.tx /= mpm.stagescale; wt.ty /= mpm.stagescale;

                    console.log("x: "+x+" y: "+y);
                    var targetPoint = wt.applyInverse(new PIXI.Point(x, y));
                    console.log("maps to x: "+targetPoint.x+" y: "+targetPoint.y);
                    targetPoint.x = targetPoint.x - container.pivot.x;
                    targetPoint.y = targetPoint.y - container.pivot.y;
                    var rect = new PIXI.Rectangle(-width/2, -height/2, width, height);
                    if (rect.contains(targetPoint.x, targetPoint.y)) return true;
                
                    return false;
                }
            },
            callback: function () {
                if (!this.broken) {
                    if (options.sprite) container.removeChild(options.sprite);
                    if (options.brokesprite) container.addChild(options.brokesprite);
    
                    if (!options.category) options.category = 4;
                    if (!options.mask) options.mask = 5;

                    this.body = Matter.Bodies.rectangle
                        (container.pivot.x, container.pivot.y, width, height,
                            { collisionFilter: { category: options.category,
                                                 mask: options.mask }});
                    Matter.World.add(mpm.world, [ this.body ]);
                    mpm.binder.bindState(this.body, container);
                    if (!options.velocity) this.velocity = Matter.Vector.create(1, 2);
                    else this.velocity = options.velocity;
                    this.broken = true;
                }
    
                var xdist = this.body.position.x - mpm.player.spritebody.position.x;
                var xdir = Math.sign(xdist);
                Matter.Body.setVelocity
                    (this.body, Matter.Vector.create(this.velocity.x * xdir, -this.velocity.y));
                return true;
            }
        };
    };

    return ManyPunchMan;
});
