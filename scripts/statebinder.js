/* Abstract class for syncing two state representations */

define(function () {
    StateBinder = function (scaling1to2) {
        this.scaling1to2 = scaling1to2;

        this.bindings = [];
    };

    StateBinder.prototype.bindState = function (state1, state2) {
        this.bindings.push([state1, state2]);
    };

    StateBinder.prototype.syncAll1to2 = function () {
        for (var i = 0; i < this.bindings.length; ++i) {
            var state1 = this.bindings[i][0];
            var state2 = this.bindings[i][1];

            this.sync1to2(state1, state2);
        }
    };

    StateBinder.prototype.syncAll2to1 = function () {
        for (var i = 0; i < this.bindings.length; ++i) {
            var state1 = this.bindings[i][0];
            var state2 = this.bindings[i][1];

            this.sync2to1(state2, state1);
        }
    };

    StateBinder.prototype.sync1to2 = undefined; /* function (state1, state2) {} */
    StateBinder.prototype.sync2to1 = undefined; /* function (state2, state1) {} */

    return StateBinder;
});
