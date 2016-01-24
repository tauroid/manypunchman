// Receive user input, output actions

define(function () {
    Controller = function () {
        this.channels = ["touchstart", "touchend", "click",
                         "mousemove", "keydown", "keyup"];
        this.transmitChannel = "action";
        this.messagebus = new MessageBus();
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

    Controller.prototype.processTouchstart = function (touchevent) {
        if (touchevent.touches.length > 0) {
            this.messagebus.sendMessage("control", { 
                action: "activate",
                x: touchevent.touches.item(0).pageX,
                y: touchevent.touches.item(0).pageY
            });
        };
    };

    Controller.prototype.processTouchend = function (touchevent) {
    };

    Controller.prototype.processClick = function (mouseevent) {
        this.messagebus.sendMessage("control", {
            action: "activate",
            x: mouseevent.pageX,
            y: mouseevent.pageY
        });
    };

    Controller.prototype.processMousemove = function (message) {
        console.log("mousemove");
    };

    Controller.prototype.processKeydown = function (message) {
        console.log("keydown");
    };

    Controller.prototype.processKeyup = function (message) {
        console.log("keyup");
    };

    return Controller;
});
