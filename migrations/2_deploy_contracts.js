const StarNotary = artifacts.require("StarNotary");

module.exports = function(deployer) {
  console.log('DEPLOYING!');
  deployer.deploy(StarNotary, 'Super star token', 'STT');
};
