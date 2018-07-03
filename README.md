General flow of things

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

Notes
- demo needs to run on 127.0.0.1:8888
- sdk needs to run on 127.0.0.1:8000
- rails needs to run on 127.0.0.1:9000
- bundle.js needs to be included on every page because web3 needs to be on every page
- on page redirects we need to use some kind of local storage to keep the seed around
- login window needs to talk back somehow

---

To run in demo:
- Load extension unpacked
- Go to etherbots.io
- See it needs metamask to connect
- Click "Injecta" extention
- See the "Login with Elph" button show up in top right
- Click it
- Connect to web3
- Reattempt to go to etherbots.io
- Magic.