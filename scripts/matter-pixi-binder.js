// Body to PIXI thing with position & angle

define(["common/matter.min", "statebinder"], function (Matter, StateBinder) {
    MatterPIXIBinder = function (scaling1to2) {
        StateBinder.call(this, scaling1to2);
    };

    MatterPIXIBinder.prototype = Object.create(StateBinder.prototype);
    MatterPIXIBinder.prototype.constructor = MatterPIXIBinder;

    MatterPIXIBinder.prototype.sync1to2 = function (body, container) {
        container.position.x = body.position.x * this.scaling1to2;
        container.position.y = body.position.y * this.scaling1to2;
        container.rotation = body.angle;
    };

    MatterPIXIBinder.prototype.sync2to1 = function (container, body) {
        var pos = { x: container.position.x / this.scaling1to2,
                    y: container.position.y / this.scaling1to2 };
        Matter.Body.setPosition(body, pos);
        Matter.Body.setAngle(body, container.rotation);
    };

    return MatterPIXIBinder;
});
