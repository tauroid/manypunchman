// Receive user input, output actions

define(function () {
    Controller = function () {
        this.channels = ["click", "mousemove", "keydown", "keyup"];
    };

    Controller.prototype.attach = function (game) {
        var mb = game.messagebus;

        for (var i = 0; i < this.channels.length; ++i) {
            mb.registerOnChannel(this.channels[i], this);
        }
    };

    Controller.prototype.receiveMessage = function (channel, message) {
        var process = this [ "process" + channel[0].toUpperCase() +
                             channel.substr(1)].bind(this);

        if (process != undefined) {
            process(message);
        }
    };

    Controller.prototype.processClick = function (mouseevent) {
        console.log("click");
    };

    Controller.prototype.processMousemove = function (message) {
        console.log("mousemove");
    };

    Controller.prototype.processKeydown = function (message) {
        console.log("keydown");
        this.noise.play('buh');
    };

    Controller.prototype.processKeyup = function (message) {
        console.log("keyup");
    };

    return Controller;
});
