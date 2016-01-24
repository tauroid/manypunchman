define(["matter.min", "pixi.min", "app/pixiwindow", "app/matter-pixi-binder",
        "app/player", "app/animation", "app/controller"],
        function (Matter, PIXI, PIXIWindow, MatterPIXIBinder,
                  Player, Animation, Controller) {
    ManyPunchMan = function (game) {
        this.name = "manypunchman";
        this.game = game;
    };

    ManyPunchMan.prototype.load = function () {
        var bgmusic = this.game.assets.audio.MANYPUNCH1;
        bgmusic.loop = true;
        bgmusic.play();

        this.stage = new PIXI.Container();
        this.stage.scale.x = 16; this.stage.scale.y = 16;
        this.playerstage = new PIXI.Container();
        this.housestage = new PIXI.Container();

        this.stage.addChild(this.housestage);
        this.stage.addChild(this.playerstage);

        var gamewindow = new PIXIWindow(null, null, this.stage);

        this.game.gamewindows[this.name] = [];
        this.game.gamewindows[this.name].push(gamewindow);

        var binder = new MatterPIXIBinder(1);

        var engine = Matter.Engine.create(undefined, { enableSleeping: true, positionIterations: 8 });
        this.world = engine.world;
        this.world.gravity.y = 0.5;

        var controller = new Controller();
        controller.attach(this.game);
        controller.noise = this.game.assets.audio.bap;

        this.player = new Player(this.game, this.playerstage, this.world, binder,
                                controller.messagebus, this.name);

        this.player.load();

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
                binder.syncAll1to2();
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

    ManyPunchMan.prototype.loadHouse = function () {
        var images = this.game.assets.images;

        var bg = new PIXI.Sprite(images.jamhouse);
        this.housestage.addChild(bg);

        Matter.World.add(this.world,
            [ Matter.Bodies.rectangle(25, 26, 50, 12, { isStatic: true }),
              Matter.Bodies.rectangle(45, 13, 2, 14, { isStatic: true }) ]);

        var wardrobecont = new PIXI.Container();
        var wardrobe = new PIXI.Sprite(images.jamwardrobe);
        var wardrobebroke = new PIXI.Sprite(images.jamwardrobe_broke);
        wardrobecont.addChild(wardrobe);
        this.housestage.addChild(wardrobecont);

        Matter.World.add(this.world, 
            [ Matter.Bodies.rectangle(3, 14.5, 6, 13, { isStatic: true }) ]);

        var wardroberect = new PIXI.Rectangle(2, 8, 4, 13);
        this.player.addPunchable(wardroberect, function () {
            wardrobecont.removeChild(wardrobe);
            wardrobecont.addChild(wardrobebroke);
        });

        var clockcont = new PIXI.Container();
        var clock = new PIXI.Sprite(images.jamclock);
        var clockbroke = new PIXI.Sprite(images.jamclock_broke);
        clockcont.addChild(clock);
        this.housestage.addChild(clockcont);

        var clockrect = new PIXI.Rectangle(30, 10, 6, 5);
        this.player.addPunchable(clockrect, function () {
            clockcont.removeChild(clock);
            clockcont.addChild(clockbroke);
        });
    };

    return ManyPunchMan;
});
