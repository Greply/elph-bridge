const IFRAME_VERSION = 'v1.0.0';
const IS_DEV = false; // Currently just used for local development of the SDK itself.
const ELPH_ORIGIN = (IS_DEV ? 'http://localhost:8000' : 'https://elph.com');
const SDK_ELPH_ORIGIN = (IS_DEV ? 'http://localhost:9000' : 'https://sdk.elph.com');

class ElphProvider {
    constructor(options={'network' : 'mainnet'}) {
        this.options = options;
        this.options['elphAuthenticated'] = localStorage.getItem('elphAuthenticated')
        this.options['title'] = document.title;

        this.isElph = true;
        
        this.initializeState();
        this.resetState();
        this.initializeListener();

        this.attemptReconnect();
    }

    isConnected() {
        return this.authenticated;
    }

    hasPreviouslyConnected() {
        return localStorage.getItem('elphAuthenticated') === "true";
    }

    disconnect() {
        this.resetState();
        localStorage.removeItem('elphAuthenticated');
        this.initializeState();
    }

    attemptReconnect() {
        if (this.hasPreviouslyConnected()) {
            this.connect();            
        }
    }

    connect() {
        this.handleRegistration();
        this.initializeIframe(IFRAME_VERSION);
        this.initializeModalFrame(IFRAME_VERSION);
    }

    initializeState() {
        this.registerWindowOpen = true;
        this.authenticated = false;
        this.requests = {};
        this.subscriptions = [];
        this.account = undefined;
        this.net_version = undefined;
        this.requestQueue = [];
    }

    resetState() {
        let oldModalIframe = document.getElementById('modalIframe');
        if (oldModalIframe) {
            oldModalIframe.parentNode.removeChild(oldModalIframe);
        }
        let oldWeb3Iframe = document.getElementById('web3Iframe');
        if (oldWeb3Iframe) {
            oldWeb3Iframe.parentNode.removeChild(oldWeb3Iframe);
        }
    }

    handleRegistration() {
        if (!this.hasPreviouslyConnected()) {
            this.registerWindow = window.open(ELPH_ORIGIN + '/register','register','resizable,height=650,width=850,left=400,top=200');

            var that = this;
            this.registerWindowPoll = setInterval(function() {
                if (that.registerWindow.closed) {
                    that.registerWindowOpen = false;
                    if (!that.authenticated) {
                        that.popRequestFromQueue();
                    }
                    clearInterval(that.registerWindowPoll);
                }
            }, 1000);
        }
    }

    serializeOptions() {
        var that = this;
        return Object.keys(this.options).map(function(arg){
            return arg + '=' + that.options[arg]
        }).join("&")
    }

    on(type, callback) { 
        this.subscriptions.push(callback);
    }

    runCallback(id, error, result) {
        var callback = this.requests[id].callback;
        if (error) {
            callback(error, null);
        } else {
            callback(null, result);
        }
        delete this.requests[id];
    }

    initializeListener() {
        var that = this;
        window.addEventListener('message', function(e) {
            if (!that.iframe.contentWindow) return;
            if (e.origin === SDK_ELPH_ORIGIN) {
                if (e.data.type === "GET_OPTIONS") {
                    that.iframe.contentWindow.postMessage({ type: "SET_OPTIONS", payload: that.options }, SDK_ELPH_ORIGIN);
                } else if (e.data.type === "AUTHENTICATED") {
                    that.authenticated = true;
                    that.account = e.data.account;
                    that.net_version = e.data.net_version;
                    localStorage.setItem('elphAuthenticated', true);
                    that.registerWindowOpen = false;
                    if (that.registerWindow) that.registerWindow.close();
                    that.popRequestFromQueue();
                } else if (e.data.type === "RESULT") {
                    that.runCallback(e.data.payload.id, e.data.error, e.data.result);
                } else if (e.data.type === "SUBSCRIPTION_RESULT") {
                    for (var i = 0; i < that.subscriptions.length; i++) {
                        that.subscriptions[i](e.data.result);
                    }
                } else if (e.data.type === "SHOW_MODAL_IFRAME") {
                    that.modalIframe.style.display = 'block';
                } else if (e.data.type === "HIDE_MODAL_IFRAME") {
                    that.modalIframe.style.display = 'none';
                } else {
                    // console.log("got an unknown response back: ", e.data.type);
                }
            }
        });
    }

    initializeModalFrame(iframeVersion) {
        this.modalIframe = document.createElement('iframe');   
        this.modalIframe.src = SDK_ELPH_ORIGIN + '/iframes/' + iframeVersion + '/modal.html?' + Date.now().toString()
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
    }

    initializeIframe(iframeVersion) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = SDK_ELPH_ORIGIN + '/iframes/' + iframeVersion + '/web3.html?' + Date.now().toString()
        this.iframe.style.border = 0;
        this.iframe.style.position = "absolute";
        this.iframe.style.width = 0;
        this.iframe.style.height = 0;
        this.iframe.style.zIndex = -100;
        this.iframe.id = "web3Iframe";
        document.body.appendChild(this.iframe);
    }

    addRequestToQueue(payload, callback) {
        this.requestQueue.push({ payload: payload, callback: callback });
        this.requests[payload.id] = { payload: payload, callback: callback };
        if (!this.registerWindowOpen) {
            this.popRequestFromQueue();
        }
    }

    popRequestFromQueue() {
        if (this.requestQueue.length === 0) return;
        var request = this.requestQueue.shift();
        if (request) {
            var {payload, callback} = request;

            if (!this.authenticated) {
                this.runCallback(payload.id, 'User cancelled auth.', null);
                return;
            }

            this.iframe.contentWindow.postMessage(
                { type: "REQUEST", payload: payload }, SDK_ELPH_ORIGIN);
            this.popRequestFromQueue();
        }
    }

    sendAsync(payload, callback) {
        this.addRequestToQueue(payload, callback);
    }

    send(payload) {
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
    }
}

export default ElphProvider;
