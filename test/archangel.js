const Archangel = artifacts.require('./Archangel.sol');

// Doesn't yet check for emitted events

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

    await instance.store('fruit', 'melon');

    const payload = await instance.fetch('fruit');

    assert.equal(payload, 'melon')
  });

  it('non-owner cannot write', async() => {
    const instance = await Archangel.deployed();

    await instance.store('pet', 'lovely black dog', { from: accounts[2] });

    const payload = await instance.fetch('pet', { from: accounts[2] });

    assert.equal(payload, '')
  });

  it('non-owner can write when given permission', async() => {
    const instance = await Archangel.deployed();

    await instance.grantPermission(accounts[2]);

    await instance.store('grain', 'barley', { from: accounts[2] });

    const payload = await instance.fetch('grain', { from: accounts[2] });

    assert.equal(payload, 'barley')
  });

  it('non-owner can not write when permission revoked', async() => {
    const instance = await Archangel.deployed();

    await instance.grantPermission(accounts[2]);
    await instance.store('tea', 'assam', { from: accounts[2] });
    const tea = await instance.fetch('tea', { from: accounts[2] });
    assert.equal(tea, 'assam')

    await instance.removePermission(accounts[2]);
    await instance.store('coffee', 'takengon', { from: accounts[2] });
    const coffee = await instance.fetch('coffee', { from: accounts[2] });
    assert.equal(coffee, '')
  });

  it('non-owner can read', async() => {
    const instance = await Archangel.deployed();

    await instance.store('insect', 'housefly');

    const payload = await instance.fetch('insect', { from: accounts[2] });

    assert.equal(payload, 'housefly')
  });
});
