var PROVIDER_VERSION = 'v1.0.0';
var ELPH_ORIGIN = 'http://127.0.0.1:9000';
// TODO(vamsi): switch this back to https://sdk.elph.com,
// as well as remove all occurences of '/sdk.elph.com' elsewhere
// in the file.
var SDK_ELPH_ORIGIN = 'https://s3.amazonaws.com'

function getIframeVersion() {
    // Note: we set <AllowedHeader>*</AllowedHeader> in the <CORSRule> of
    // the S3 bucket for this GET to work (w.r.t. cross-origin policy).
    return new Promise((resolve, reject) => {
        fetch(SDK_ELPH_ORIGIN + '/sdk.elph.com/iframes/version.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            if (PROVIDER_VERSION in json) {
                let iframeVersionsList = json[PROVIDER_VERSION];
                if (iframeVersionsList.length === 0) {
                    reject('The iframe version list corresponding'
                           'to PROVIDER_VERSION:',
                           PROVIDER_VERSION, 'is empty.');
                    return;
                }
                resolve(iframeVersionsList[iframeVersionsList.length - 1]);
            } else {
                reject("Invalid PROVIDER_VERSION specified:", PROVIDER_VERSION);
                return;
            }
        })
        .catch(function(error) {
            reject('Unable to fetch IFRAME_VERSION from S3:', error);
        })
    });
}

function ElphProvider(options={'network' : 'mainnet'}) {
    this.options = options;

    this.authenticated = false;
    this.requests = {};
    this.subscriptions = [];
    this.account = undefined;
    this.net_version = undefined;
    this.initializeListener();

    getIframeVersion().then(iframeVersion => {
        this.initializeIframe(iframeVersion);
        this.initializeModalFrame(iframeVersion);
    })
    .catch(err => {
        console.error(err);
    });
}
ElphProvider.prototype.serializeOptions = function() {
    var that = this;
    return Object.keys(this.options).map(function(arg){
        return arg + '=' + that.options[arg]
    }).join("&")
};
ElphProvider.prototype.on = function(type, callback) { 
    this.subscriptions.push(callback);
};
ElphProvider.prototype.initializeListener = function () {
    var that = this;
    window.addEventListener('message', function(e) {
        // TODO: add event origin check here.
        if (e.origin === SDK_ELPH_ORIGIN) {
            console.log("Received message: ", e);
            if (e.data.type === "GET_OPTIONS") {
                console.log("GET_OPTIONS", that.iframe);
                that.iframe.contentWindow.postMessage({ type: "SET_OPTIONS", payload: that.options }, SDK_ELPH_ORIGIN);
            } else if (e.data.type === "AUTHENTICATED") {
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
                delete that.requests[e.data.payload.id];
            } else if (e.data.type === "SUBSCRIPTION_RESULT") {
                for (var i = 0; i < that.subscriptions.length; i++) {
                    that.subscriptions[i](e.data.result);
                }
            } else if (e.data.type === "SHOW_MODAL_IFRAME") {
                console.log("Should have opened modal iframe", that.modalIframe);
                that.modalIframe.style.display = 'block';
            } else if (e.data.type === "HIDE_MODAL_IFRAME") {
                console.log("Should have closed modal iframe", that.modalIframe);
                that.modalIframe.style.display = 'none';
            } else {
                console.log("got an unknown response back: ", e.data.type);
            }
        }
    });
};
ElphProvider.prototype.initializeModalFrame = function (iframeVersion) {
    if (document.getElementById('modalIframe')) {  
        return true;   
    }  
   
    this.modalIframe = document.createElement('iframe');   
    this.modalIframe.src = SDK_ELPH_ORIGIN + '/sdk.elph.com' + '/iframes/' + iframeVersion + '/modal.html?' + Date.now().toString()
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
ElphProvider.prototype.initializeIframe = function (iframeVersion) {
    if (!localStorage.getItem('elphAuthenticated')) {
        window.open(ELPH_ORIGIN + '/register','register','resizable,height=650,width=850');
    }

    if (document.getElementById('web3Iframe')) {
        return true;
    }

    this.iframe = document.createElement('iframe');
    this.iframe.src = SDK_ELPH_ORIGIN + '/sdk.elph.com' + '/iframes/' + iframeVersion + '/web3.html?' + Date.now().toString()
    this.iframe.style.border = 0;
    this.iframe.style.position = "absolute";
    this.iframe.style.width = 0;
    this.iframe.style.height = 0;
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
            console.log("eth_accounts sync");
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
        this.iframe.contentWindow.postMessage(payload, SDK_ELPH_ORIGIN);
    }
};

ElphProvider.prototype.isElph = true;

export { ElphProvider };
