const Archangel = artifacts.require("./Archangel.sol");

module.exports = function(deployer) {
  deployer.deploy(Archangel);
};
