const PROVIDER_VERSION = 'v1.0.3';
const IS_DEV = false; // Currently just used for local development of the SDK itself.
const ELPH_ORIGIN = (IS_DEV ? 'http://localhost:8000' : 'https://elph.com');
const SDK_ELPH_ORIGIN = (IS_DEV ? 'http://localhost:9000' : 'https://sdk.elph.com');

function getIframeVersion() {
    // Note: we set <AllowedHeader>*</AllowedHeader> in the <CORSRule> of
    // the S3 bucket for this GET to work (w.r.t. cross-origin policy).
    return new Promise((resolve, reject) => {
        fetch(SDK_ELPH_ORIGIN + '/iframes/version.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            if (PROVIDER_VERSION in json) {
                let iframeVersionsList = json[PROVIDER_VERSION];
                if (iframeVersionsList.length === 0) {
                    reject('The iframe version list corresponding ' +
                           'to PROVIDER_VERSION: ' +
                           PROVIDER_VERSION + ' is empty.');
                    return;
                }
                resolve(iframeVersionsList[iframeVersionsList.length - 1]);
            } else {
                reject("Invalid PROVIDER_VERSION specified: " + PROVIDER_VERSION);
                return;
            }
        })
        .catch(function(error) {
            reject('Unable to fetch IFRAME_VERSION from S3: ' + error);
        })
    });
}

class ElphProvider {
    constructor(options={'network' : 'mainnet'}) {
        this.options = options;
        this.options['elphAuthenticated'] = localStorage.getItem('elphAuthenticated')

        this.authenticated = false;
        this.requests = {};
        this.subscriptions = [];
        this.account = undefined;
        this.net_version = undefined;
        this.isElph = true;

        this.initializeListener();
        this.handleRegistration();


        getIframeVersion().then(iframeVersion => {
            this.initializeIframe(iframeVersion);
            this.initializeModalFrame(iframeVersion);
        })
        .catch(err => {
            console.error(err);
        });
    }

    handleRegistration() {
        if (!localStorage.getItem('elphAuthenticated')) {
            window.open(ELPH_ORIGIN + '/register','register','resizable,height=650,width=850,left=400,top=200');
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

    initializeListener() {
        var that = this;
        window.addEventListener('message', function(e) {
            // TODO: add event origin check here.
            if (e.origin === SDK_ELPH_ORIGIN) {
                if (e.data.type === "GET_OPTIONS") {
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
        if (document.getElementById('modalIframe')) {  
            return true;   
        }  
       
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
        if (document.getElementById('web3Iframe')) {
            return true;
        }

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

    sendAsync(payload, callback) {
        this.requests[payload.id] = { payload: payload, callback: callback };
        this.sendMessage({ type: "REQUEST", payload: payload });
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

    sendMessage(payload) {
        var that = this;
        if (!this.authenticated) {
            window.setTimeout(function () {
                that.sendMessage(payload)
            }, 1000);
        } else {
            this.iframe.contentWindow.postMessage(payload, SDK_ELPH_ORIGIN);
        }
    }
}

export default ElphProvider;