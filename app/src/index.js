import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,

  start: async function() {
    const { web3 } = this;

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();

      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address,
      );

      // get accounts
      const accounts = await web3.eth.getAccounts();

      this.account = accounts[0];
    } catch (error) {
      console.log(error);

      console.error("Could not connect to contract or chain.");
    }
  },

  subscribeToEvents: async function() {
    let self = this;

    this.meta.events.Transfer({
      filter: {to: this.account},
      fromBlock: 'latest'
    }, (error, event) => {
      if (event)
        self.setStatus('Star created successfully!');
    })
  },

  setStatus: function(message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },

  createStar: async function() {
    const { createStar } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;

    App.setStatus("Creating star ... ");
    try{
      await createStar(name, id).send({from: this.account});
    } catch(e) {
      App.setStatus("An error occured while creating the star, make sure the star ID is not taken!");
    }

  },

  lookUp: async function (){
    const { lookUptokenIdToStarInfo } = this.meta.methods;
    const id = document.getElementById("lookid").value;
    const result = await lookUptokenIdToStarInfo(id).call({from: this.account});

    if (result) {
      App.setStatus("Star with id: " + id + " has a name of: " + result);
    } else {
      App.setStatus("Star with id: " + id + " Not found");
    }
  }

};

window.App = App;

window.addEventListener("load", async function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    await window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"),);
  }

  await App.start();
  await App.subscribeToEvents();
});