# Udacity BND Project 5: Decentralized Star Notary

> Solidity version of the star notary project.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Setup

Truffle version: `5.0`  
Openzeppelin version: `2.1`  

First install dependencies:  

```
npm install  
```

To run the frontend server:  

```
cd app/  
npm run dev  
```

## Testing

___
Using the local truffle package:  
```
npx truffle test  
```

Using the global truffle package:  
```
truffle test  
```

## Usage  

### Development  

- Run the ganache client.  
- Save mnemonic in `.secret`.  
- Make sure the networks `development` entry in `truffle.js` has the right port.  
- `truffle compile`  
- `truffle migrate`  

### Rinkeby network  

- Make sure you have a funded rinkeby address.  
- Save your wallet seed in `.secret`.  
- Set `infuraURL` in `truffle.js` to your infura endpoint URL.  
- `truffle migrate --reset --network rinkeby`  


## Contract info

Address: `0xcfe158aae0e8f8279315d369ffb32ecb631060a1`  
Token Name: `Super Star Token`  
Token Symbol: `STT` (typo)  
