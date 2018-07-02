var ELPH_ORIGIN = 'http://127.0.0.1:9000';

function ElphProvider() {
   this.authenticated = false;
   this.requests = {};
   this.subscriptions = {};
   this.account = undefined;
   this.net_version = undefined;
   this.initializeListener();
   this.initializeIframe();
   this.initializeModalFrame(); 
}
ElphProvider.prototype.on = function(type, callback) { 
    console.log("Prototype ON: ", type, callback);
};
ElphProvider.prototype.initializeListener = function () {
    var that = this;
    window.addEventListener('message', function(e) {
        // TODO: add event origin check here.
        if (e.origin === ELPH_ORIGIN) {
            console.log("Received message: ", e);
            if (e.data.type === "AUTHENTICATED") {
                that.authenticated = true;
                that.account = e.data.account;
                that.net_version = e.data.net_version;
                localStorage.setItem('elphAuthenticated', true);
            } else if (e.data.type === "RESULT") {
                var callback = that.requests[e.data.payload.id].callback;
                if (e.data.error) {
                    callback(e.data.error, null);                    
                } else {
                    callback(null, e.data.result);
                }
            } else if (e.data.type === "SHOW_MODAL_IFRAME") {
                // console.log("Should have opened modal iframe");
                this.modalIframe.style.display = 'block';
            } else if (e.data.type === "HIDE_MODAL_IFRAME") {
                // console.log("Should have closed modal iframe");
                this.modalIframe.style.display = 'none';
            } else {
                console.log("got an unknown response back: ", e.data.type);
            }
        }
    });
};
ElphProvider.prototype.initializeModalFrame = function () {
    if (document.getElementById('modalIframe')) {
        return true;
    }

    this.modalIframe = document.createElement('iframe');
    this.modalIframe.src = ELPH_ORIGIN + "/iframe2.html?" + Date.now().toString()
    this.modalIframe.style.position = "absolute";
    this.modalIframe.style.border = 0;
    this.modalIframe.style.top = 0;
    this.modalIframe.style.left = 0;
    this.modalIframe.style.width = '100%';
    this.modalIframe.style.height = '100%';
    this.modalIframe.style.display = 'none';
    this.modalIframe.style.zIndex = '10000000';
    this.modalIframe.allowTransparency="true";
    this.modalIframe.id = "modalIframe";
    document.body.appendChild(this.modalIframe);
};
ElphProvider.prototype.initializeIframe = function () {
    if (!localStorage.getItem('elphAuthenticated')) {
        window.open(ELPH_ORIGIN + '/register', '_blank');
    }

    if (document.getElementById('web3Iframe')) {
        return true;
    }

    this.iframe = document.createElement('iframe');
    this.iframe.src = ELPH_ORIGIN + "/iframe.html?" + Date.now().toString()
    this.iframe.style.border = 0;
    this.iframe.style.position = "absolute";
    this.iframe.style.height = 0;
    this.iframe.style.width = 0;
    this.iframe.style.zIndex = -100;
    this.iframe.id = "web3Iframe";
    document.body.appendChild(this.iframe);
};
ElphProvider.prototype.sendAsync = function (payload, callback) {
    this.requests[payload.id] = { payload: payload, callback: callback };
    this.sendMessage({ type: "REQUEST", payload: payload });
};
ElphProvider.prototype.send = function (payload) {
    var method = payload.method;
    var result;
    switch(method) {
        case "eth_accounts":
            result = this.account ? [this.account] : []
            break;
        case "eth_coinbase":
            result = this.account ? [this.account] : []
            break;
        case "eth_uninstallFilter":
            // TODO
            result = true;
            break;
        case "net_version":
            result = this.net_version;
            break;
        default:
            console.warn("Received synchronous method that is unsupported: ", payload)
            throw new Error("Unsupported synchronous method");
            break;
    }
    return {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        result: result
    };
};
ElphProvider.prototype.sendMessage = function (payload) {
    var that = this;
    if (!this.authenticated) {
        // console.log("Web3 not authenticated yet...");
        window.setTimeout(function () {
            that.sendMessage(payload)
        }, 1000);
    } else {
        console.log("Sending payload: ", payload);
        this.iframe.contentWindow.postMessage(payload, ELPH_ORIGIN)            
    }
};

ElphProvider.prototype.isElph = true;

export { ElphProvider };
