# General flow:

Demo includes bundle.js (a wrapper around provider.js.  The provider.js loads up iframe.html (the actual web3 frame and login button), and iframe2.html (the modal confirmation iframe))

- Demo calls new ElphProvider()
- provider creates both iframes, and starts listening to all messages
- "Login with Elph" is clicked on iframe.html
- iframe.html initializes web3 with a seed phrase and password // TODO: ELPH API LOGIN WILL COME HERE
- iframe.html finds iframe2.html
- iframe2.html finds iframe.html
- iframe.html sends an "AUTHENTICATED" back up to provider
- provider is now ready to send web3 calls to iframe.html
- provider sends standard calls to iframe.html with "REQUEST"
- iframe.html forwards these calls to infura
- iframe.html replies back to provider with "RESULT"
- provider calls callback with result

- provider sends conf req'd call to iframe.html with "REQUEST"
- iframe.html realizes conf is needed, sends to iframe2.html with "CONFIRMATION"
- iframe2.html pings provider with "SHOW_MODAL_IFRAME"
- iframe2.html opens up modal with information
- iframe2.html gets the user input to click on a button
- iframe2.html pings provider with "HIDE_MODAL_IFRAME"
- iframe2.html replies to iframe.html with "CONFIRMED" or "CANCELLED"
- iframe.html manually checks "CONFIRMED" comes from same origin
- iframe.html figures out what to do for each message ^
- iframe.html follows same steps as unconf'd call.

---

# Dev Setup (run local sdk-demo):

(1) Terminal Tab 1: SDK-DEMO
> git clone git@github.com:ElphDev/sdk-demo.git

> cd sdk-demo/

> python -m SimpleHTTPServer 8888

> Open http://localhost:8888/ and click on 'demo.html'

(2) Terminal Tab 2:
> cd web/

> foreman start -p 9000

(3) Terminal Tab 3:
> cd sdk/

Install this the first time:
> npm install --global rollup

This compiles provider.js and builds ./dist/bundle.js every two seconds:
> while true; do rollup provider.js --file ./dist/bundle.js --format iife --name "Elph"; sleep 2; done

Start HTTPServer:
> python -m SimpleHTTPServer 8000

---

# Test SDK on a real dApp (talk to Tanooj first):

(1) Load extension unpacked

(2) Go to etherbots.io

(3) See it needs metamask to connect

(4) Click "Inject" extention

(5) See the "Login with Elph" button show up in top right

(6) Click it

(7) Connect to web3

(8) Reattempt to go to etherbots.io

(9) Magic.

---

# Notes:
- The script bundle.js needs to be included on every page because web3 needs to be on every page.
- On page redirects, we need to use some kind of local storage to keep the seed around.
- Login window needs to talk back somehow.

---