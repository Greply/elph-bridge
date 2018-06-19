var ElphProvider = (function () {
    function ElphProvider(opts) {
        this.authenticated = false;
        this.initializeRequests();
        this.initializeListener();
        this.initializeIframe();
    }
    ElphProvider.prototype.initializeRequests = function () {
        this.requests = {};
    };
    ElphProvider.prototype.initializeListener = function () {
        var that = this;
        window.addEventListener('message', function(e) {
            console.log("Received message: ", e);
            if (e.data.type === "AUTHENTICATED") {
                that.authenticated = true;
            } else if (e.data.type === "RESULT") {
                var callback = that.requests[e.data.payload.id].callback;
                callback(e.data.error, e.data.result);
            } else {
                console.log("got an unknown response back: ", e.data.type);
            }
        });
    };
    ElphProvider.prototype.initializeIframe = function () {
        var that = this;
        this.iframe = document.createElement('iframe');
        this.iframe.src = "file:///Users/tanooj/dev/sdk/iframe.html"
        // this.frame.style.width = 0;
        // this.frame.style.height = 0;
        this.iframe.style.border = 0;
        // this.iframe.style.border = none;
        document.body.appendChild(this.iframe);
    };
    ElphProvider.prototype.sendAsync = function (payload, callback) {
        this.requests[payload.id] = { payload: payload, callback: callback };
        this.sendMessage({ type: "REQUEST", payload: payload });
    };
    ElphProvider.prototype.sendMessage = function (payload) {
        var that = this;
        if (!this.authenticated) {
            console.log("Web3 not authenticated yet...");
            window.setTimeout(function () {
                that.sendMessage(payload)
            }, 1000);
        } else {
            console.log("Sending payload: ", payload);
            this.iframe.contentWindow.postMessage(payload, '*')            
        }
    };

    return ElphProvider;
}());
export { ElphProvider };
