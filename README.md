# [Elph Bridge SDK](https://elph.com)

## How does it work?

Elph Bridge acts as a standard [web3](https://github.com/ethereum/web3.js/) provider, just like MetaMask or Mist, however doesn't require any additional downloads or installations.

The SDK talks to the Elph backend to handle user authentication and identity, and then bundles a client-side provider to give the most seamless experience possible for your users.

<hr>

## Security
Security is the number one priority, and no sacrifices have been made for usability.  The Elph SDK is currently undergoing a third-party audit and is also open sourcing all the code to ensure no vulnerabilities are found.

Once a user registers on Elph, their seed is generated client-side and immediately AES encrypted with a user's password.  The encrypted seed and a _hashed_ copy of the password are then stored on our backend.  Hashing the password before sending it to the Elph servers ensures that even if something were to happen to our backend the seeds would be safe and secure.

Every time the user connects their Elph account to a dApp, the encrypted seed is loaded into an iframe protected by the browser's same-origin policy.  No dApp has access to the memory of the SDK and the seed is never written to disk.

All transactions are signed client side and then broadcasted through cloud servers, preventing Elph or the dApp from modifying any of the contents.

<hr>

## Installation

To use Elph in your dApp, the SDK must be loaded in one of the following ways:

### npm

The recommended method of installation is through the `elph` npm package:

```js
$ npm install elph
```

### CDN
You can also include the bundled Elph.js file hosted on jsdelivr's CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/elph/index.iife.js"></script>
```

<hr>

## Import

Elph should be imported into the same part of the code where you initialize `web3`

### CommonJS
```js
var ElphProvider = require('elph').ElphProvider;
```

### Typescript / ES2015 (ES6)
```js
import { ElphProvider } from 'elph';
```

### CDN
```js
var ElphProvider = window.Elph.ElphProvider;
```

<hr>

## Usage

Once Elph has been included, you can simply initialize web3 as you would with Mist or Metamask
```js
web3 = new Web3(new ElphProvider());
```

This will check if a previous session was available, and automatically connect with that.  If no previous session was found, you will need to connect and prompt the user to login/register with their Elph account.  A typical flow would look like this:
```js
web3 = new Web3(new ElphProvider());

if (!web3.currentProvider.isConnected()) {
    // Here we know no session was found, and we want to explicitly open the registration window.
    web3.currentProvider.connect();
}
```

Other potentially helpful lifecycle methods include
```js
web3.currentProvider.isConnected() // True or False if a user is currently connected to the network via Elph.

web3.currentProvider.disconnect() // Allows a user the option of 'logging-out' from Elph on your website

web3.currentProvider.isElph // True if ElphProvider is your current provider, otherwise 'undefined'
```

<hr>

## Configuration Options

A configuration options object can be passed along when initializing the Elph provider:

```js
web3 = new Web3(new Elph.ElphProvider({
 network: 'ropsten'
}));
```

### ```network```
**Type:** `String`

**Default Value:**  `mainnet`

**Required**: ```false```

Sets the Ethereum network all web3 methods will talk to.  Following networks are supported:
1. mainnet
2. ropsten
3. kovan
4. rinkeby

<hr>

## Contributing

* If you're interested in contributing to our repository, feel free to reach out, we can help set up a development environment as well.

<hr>

## Questions

* [Telegram](http://t.me/elphnetwork)
