const Archangel = artifacts.require('./Archangel.sol');

// Doesn't yet check for emitted events

contract('Archangel', (accounts) => {
  const owner = accounts[0];
  const reader = accounts[1];
  const other_actor = accounts[2];

  it('contract owner has write permission', async () => {
    const instance = await Archangel.deployed();

    const permission = await instance.hasPermission(owner)

    assert(typeof permission === 'boolean')
    assert(permission)
  });

  it('non-contract owner doesn\'t have write permission', async () => {
    const instance = await Archangel.deployed();

    const permission = await instance.hasPermission(reader)

    assert(typeof permission === 'boolean')
    assert(!permission)
  });

  it('owner stores a payload and then retrieves it', async () => {
    const instance = await Archangel.deployed();

    await instance.store('fruit', 'melon');

    const payload = await instance.fetch('fruit');

    assert.equal(payload, 'melon');
  });

  it('non-owner cannot write', async() => {
    const instance = await Archangel.deployed();

    await instance.store('pet', 'lovely black dog', { from: other_actor });

    const payload = await instance.fetch('pet', { from: other_actor });

    assert.equal(payload, '')
  });

  it('non-owner has permission once granted', async() => {
    const instance = await Archangel.deployed();

    const initial_permission = await instance.hasPermission(other_actor);
    assert(!initial_permission);

    await instance.grantPermission(other_actor);
    const write_permission_granted = await instance.hasPermission(other_actor);
    assert(write_permission_granted);

    await instance.removePermission(other_actor);
    const write_permission_revoked = await instance.hasPermission(other_actor);
    assert(!write_permission_revoked);
});

  it('non-owner can write when given permission', async() => {
    const instance = await Archangel.deployed();

    await instance.grantPermission(other_actor);

    await instance.store('grain', 'barley', { from: other_actor });

    const payload = await instance.fetch('grain', { from: other_actor });

    assert.equal(payload, 'barley')
  });

  it('non-owner can not write when permission revoked', async() => {
    const instance = await Archangel.deployed();

    await instance.grantPermission(other_actor);
    await instance.store('tea', 'assam', { from: other_actor });
    const tea = await instance.fetch('tea', { from: other_actor });
    assert.equal(tea, 'assam')

    await instance.removePermission(other_actor);
    await instance.store('coffee', 'takengon', { from: other_actor });
    const coffee = await instance.fetch('coffee', { from: other_actor });
    assert.equal(coffee, '')
  });

  it('non-owner can read', async() => {
    const instance = await Archangel.deployed();

    await instance.store('insect', 'housefly');

    const payload = await instance.fetch('insect', { from: reader });

    assert.equal(payload, 'housefly')
  });
});
