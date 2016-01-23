define(function () {
    function Movements (game) {
        this.game = game;
        this.game.logicgroups.movements = [];
        this.game.groupnames.push("movements");
        this._m = this.game.logicgroups.movements;
    }

    Movements.prototype.move = function (obj, x1, y1, x2, y2, duration, interp, fn) {
        if (!interp) interp = "linear";
        if (typeof(interp) == "string") {
           if (interp == "linear") {
               interp = function (time) {
                   return time/duration;
               };
           } else if (interp == "sinsquared") {
               interp = function (time) {
                   return 0.5*(1 - Math.cos(time/duration*Math.PI));
               };
           }
        } else if (typeof(interp) != "function") return;

        this._m.push({
            finished: false,
            startTime: new Date().getTime(),
            update: function (delta, time) {
                if (time - this.startTime > duration) {
                    obj.x = x2; obj.y = y2;
                    this.finished = true;
                    if(fn) fn();
                    return;
                }

                var pos = interp(time - this.startTime);
                obj.x = x1 + (x2-x1)*pos;
                obj.y = y1 + (y2-y1)*pos;
            }
        });
    };

    return Movements;
});
