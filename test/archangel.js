const Archangel = artifacts.require('./Archangel.sol');

contract('Archangel', (accounts) => {
  it('contract owner has write permission', () => {
    return Archangel.deployed().then(instance => {
      console.log(instance.abi)
      return instance.hasPermission(accounts[0])
    }).then(permission => {
      assert(typeof permission === 'boolean')
      assert(permission)
    });
  });

  it('non-contract owner has write permission', () => {
    return Archangel.deployed().then(instance => {
      return instance.hasPermission(accounts[1])
    }).then(permission => {
      assert(typeof permission === 'boolean')
      assert(!permission)
    });
  });
});
