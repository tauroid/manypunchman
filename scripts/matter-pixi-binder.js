// Body to PIXI thing with position & angle

define(["matter.min", "app/statebinder"], function (Matter, StateBinder) {
    MatterPIXIBinder = function (scaling1to2) {
        StateBinder.call(this, scaling1to2);
    };

    for (var key in StateBinder.prototype) console.log(key);
    MatterPIXIBinder.prototype = Object.create(StateBinder.prototype);
    MatterPIXIBinder.prototype.constructor = MatterPIXIBinder;

    MatterPIXIBinder.prototype.sync1to2 = function (state1, state2) {
        state2.position.x = state1.position.x * this.scaling1to2;
        state2.position.y = state1.position.y * this.scaling1to2;
        state2.rotation = state1.angle;
    };

    MatterPIXIBinder.prototype.sync2to1 = function (state2, state1) {
        var pos = { x: state2.position.x / this.scaling1to2,
                    y: state2.position.y / this.scaling1to2 };
        Matter.Body.setPosition(state1, pos);
        Matter.Body.setAngle(state1, state2.rotation);
    };

    return MatterPIXIBinder;
});
