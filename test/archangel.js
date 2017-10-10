const Archangel = artifacts.require('./Archangel.sol');

contract('Archangel', (accounts) => {
  it('contract owner has write permission', () => {
    return Archangel.deployed().then(instance => {
      //console.log(instance.abi)
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

  it('owner stores a payload and then retrieves it', async () => {
    const instance = await Archangel.deployed();

    const tx = await instance.store('fruit', 'melon');

    const payload = await instance.fetch('fruit');

    assert.equal(payload, 'melon')
  });

  it('non-owner cannot write', async() => {
    const instance = await Archangel.deployed();

    const tx = await instance.store('pet', 'lovely black dog', { from: accounts[2] });

    const payload = await instance.fetch('pet', { from: accounts[2] });

    assert.equal(payload, '')
  });

  it('non-owner can read', async() => {
    const instance = await Archangel.deployed();

    const tx = await instance.store('insect', 'housefly');

    const payload = await instance.fetch('insect', { from: accounts[2] });

    assert.equal(payload, 'housefly')
  });
});
