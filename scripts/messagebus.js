define(function() {
    MessageBus = function () {
        this.channels = {};
        this.subscribers = [];
    }

    MessageBus.prototype.registerOnChannel = function (channel, obj) {
        if (typeof(channel) != "string") return;
        
        if (!this.channels.hasOwnProperty(channel)) this.channels[channel] = [ obj ];
        else this.channels[channel].push(obj);

        if (this.subscribers.indexOf(obj) == -1) this.subscribers.push(obj);
    };

    MessageBus.prototype.unregisterFromChannel = function (channel, obj) {
        if (!this.channels.hasOwnProperty(channel)) return;

        var i = this.channels[channel].indexOf(obj);
        if (i != -1) this.channels[channel].splice(i,1);
    };

    MessageBus.prototype.unsubscribe = function (obj) {
        for (var channel in this.channels) {
            this.unregisterFromChannel(channel, obj);
        }

        var i = this.subscribers.indexOf(obj);
        if (i != -1) this.subscribers.splice(i,1);
    };

    MessageBus.prototype.sendMessage = function (channel, message) {
        var channelsubs = this.channels[channel];
        if (channelsubs == undefined) return;

        for (var i = 0; i < channelsubs.length; ++i) {
            channelsubs[i].receiveMessage(channel, message);
        }
    };

    MessageBus.prototype.broadcastMessage = function(message) {
        for (var i = 0; i < this.subscribers.length; ++i) {
            this.subscribers[i].receiveMessage("",message);
        }
    };
    
    return MessageBus;
});
