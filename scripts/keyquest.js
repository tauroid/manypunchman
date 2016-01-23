define(["matter.min", "pixi.min", "app/pixiwindow",
        "app/matter-pixi-binder", "app/animation", "app/controller"],
        function (Matter, PIXI, PIXIWindow, MatterPIXIBinder, Animation, Controller) {
    KeyQuest = function (game) {
        this.name = "keyquest";
        this.game = game;
    };

    KeyQuest.prototype.load = function () {
        var stage = new PIXI.Container();

        var images = this.game.assets.images;

        var keyguy = Animation.fromSpritesheet
            ( images.keyguy, 24, 12, false, undefined, [1600, 1000] ); 

        console.log("Found "+keyguy.frames.length+" frames in spritesheet");

        keyguy.play(this.game);
        var sprite = keyguy.sprite;
        stage.addChild(sprite);
        stage.scale.x = 16; stage.scale.y = 16;

        var gamewindow = new PIXIWindow(null, null, stage);

        this.game.gamewindows[this.name] = [];
        this.game.gamewindows[this.name].push(gamewindow);

        var binder = new MatterPIXIBinder(1);

        var engine = Matter.Engine.create();
        var world = engine.world;
        world.gravity.y = 0.5;

        var spritebody = Matter.Bodies.rectangle(0, 0, 24, 12);
        Matter.World.add(world, [ spritebody,
            Matter.Bodies.rectangle(0, 50, 40, 12, { isStatic: true }) ]);

        binder.bindState(spritebody, sprite);

        var physsyncname = this.name + "-physsync";
        this.game.logicgroups[physsyncname] = [];
        //this.game.logicgroups[physsyncname].push({
        //    update: (delta, time) => binder.syncAll2to1()
        //});

        var physname = this.name + "-phys";
        this.game.logicgroups[physname] = [];
        this.game.logicgroups[physname].push({
            update: function (delta, time) {
                Matter.Engine.update(engine, Math.min(delta, 50));
                console.log(delta);
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

        var controller = new Controller();
        controller.attach(this.game);
        controller.noise = this.game.assets.audio.bap;
    };

    KeyQuest.prototype.unload = function () {
        this.game.deleteGroup(this.name);
    };

    return KeyQuest;
});
