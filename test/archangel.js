const Archangel = artifacts.require('./Archangel.sol');

const no_previous_key = '0x0000000000000000000000000000000000000000000000000000000000000000';

contract('Archangel', (accounts) => {
  const owner = accounts[0];
  const reader = accounts[1];
  const other_actor = accounts[2];

  describe('permissions check', () => {
    it('contract owner has write permission', async () => {
      const instance = await Archangel.deployed();

      const permission = await instance.hasPermission(owner)

      assert(typeof permission === 'boolean')
      assert(permission)
    })

    it('non-contract owner doesn\'t have write permission', async () => {
      const instance = await Archangel.deployed();

      const permission = await instance.hasPermission(reader)

      assert(typeof permission === 'boolean')
      assert(!permission)
    })
  })

  describe('writing a payload', () => {
    it('owner stores a payload and then retrieves it', async () => {
      const instance = await Archangel.deployed();

      await instance.store('fruit', 'melon');

      await expectRegistration(instance, 'fruit', 'melon', owner);

      const payload = await instance.fetch('fruit');

      assert.equal(payload[0], 'melon');
    })

    it('non-owner cannot write', async() => {
      const instance = await Archangel.deployed();

      await instance.store('pet', 'lovely black dog', { from: other_actor });

      await expectNoWritePermission(instance, other_actor);

      const payload = await instance.fetch('pet', { from: other_actor });

      assert.equal(payload[0], '')
    })

    it('accounts without write permission can read', async() => {
      const instance = await Archangel.deployed();

      const payload = await instance.fetch('fruit', { from: reader });

      assert.equal(payload[0], 'melon')
    })
  })

  describe('can write once permission granted', () => {
    it('non-owner has permission once granted', async() => {
      const instance = await Archangel.deployed();

      const initial_permission = await instance.hasPermission(other_actor);
      assert(!initial_permission);

      await instance.grantPermission(other_actor, 'other');
      await expectPermissionGranted(instance, other_actor, 'other')
      const write_permission_granted = await instance.hasPermission(other_actor);
      assert(write_permission_granted);

      await instance.removePermission(other_actor);
      await expectPermissionRemoved(instance, other_actor, 'other')
      const write_permission_revoked = await instance.hasPermission(other_actor);
      assert(!write_permission_revoked);
    })

    it('non-owner can write when given permission', async() => {
      const instance = await Archangel.deployed();

      await instance.grantPermission(other_actor, 'other');
      await expectPermissionGranted(instance, other_actor, 'other')

      await instance.store('grain', 'barley', { from: other_actor });
      await expectRegistration(instance, 'grain', 'barley', other_actor);

      const payload = await instance.fetch('grain', { from: other_actor });

      assert.equal(payload[0], 'barley')
    })

    it('non-owner can not write when permission revoked', async() => {
      const instance = await Archangel.deployed();

      await instance.grantPermission(other_actor, 'other');
      await instance.store('tea', 'assam', { from: other_actor });
      await expectRegistration(instance, 'tea', 'assam', other_actor);
      const tea = await instance.fetch('tea', { from: other_actor });
      assert.equal(tea[0], 'assam')

      await instance.removePermission(other_actor);
      await instance.store('coffee', 'takengon', { from: other_actor });
      await expectNoWritePermission(instance, other_actor);
      const coffee = await instance.fetch('coffee', { from: other_actor });
      assert.equal(coffee[0], '')
    })
  })
})


contract('can store multiple identical payloads per key', () => {
  it('store the same item multiple times', async() => {
    const instance = await Archangel.deployed();
    const key = '2000AD';
    const value = 'Featuring Judge Dredd';

    const repeat = 7;
    for (let i = 0; i != repeat; ++i)
      await instance.store(key, value);

    const head = await instance.fetch(key);
    assert.equal(head[0], value);
    assert.notEqual(head[1], no_previous_key);

    let past_key = head[1];
    for (let i = 1; i != (repeat-1); ++i) {
      const next = await instance.fetchPrevious(past_key);
      assert.equal(next[0], value);
      assert.notEqual(next[1], no_previous_key);
      past_key = next[1];
    } // for ...

    const last = await instance.fetchPrevious(past_key);
    assert.equal(last[0], value);
    assert.equal(last[1], no_previous_key);
  });
});

contract('can store multiple payloads per key', () => {
  let instance;
  const mountain_goats = 'The Mountain Goats';
  const death_metal_band_in_denton = 'The Best Ever Death Metal Band in Denton';
  const foreign_object = 'Foreign Object';
  const wear_black = 'Wear Black';

  it('store an item and read it back', async() => {
    instance = await Archangel.deployed();
    await instance.store(mountain_goats, death_metal_band_in_denton);

    const payload = await instance.fetch(mountain_goats);
    assert.equal(payload[0], death_metal_band_in_denton);
    assert.equal(payload[1], no_previous_key);
    assert.deepEqual(payload, [death_metal_band_in_denton, no_previous_key])
  });

  it('store second item, read it back, follow link to get first object', async() => {
    await instance.store(mountain_goats, foreign_object);

    const payload = await instance.fetch(mountain_goats);
    assert.equal(payload[0], foreign_object);
    assert.notEqual(payload[1], no_previous_key);

    const prev_payload = await instance.fetchPrevious(payload[1]);
    assert.deepEqual(prev_payload, [death_metal_band_in_denton, no_previous_key]);
  });

  it('store a third item, and walk all the way back to the first', async() => {
    await instance.store(mountain_goats, wear_black);

    const payload = await instance.fetch(mountain_goats);
    assert.equal(payload[0], wear_black);
    assert.notEqual(payload[1], no_previous_key);

    const prev_payload = await instance.fetchPrevious(payload[1]);
    assert.equal(prev_payload[0], foreign_object);
    assert.notEqual(prev_payload[1], no_previous_key);

    const prev_prev_payload = await instance.fetchPrevious(prev_payload[1]);
    assert.deepEqual(prev_prev_payload, [death_metal_band_in_denton, no_previous_key]);
  });
});

///////////////////////
function expectRegistration(instance, key, payload, addr) {
  return assertEvent(instance, {
    event: 'Registration',
    args: { _key: key, _payload: payload, _addr: addr }
  });
} // expectRegistration

function expectNoWritePermission(instance, addr) {
  return assertEvent(instance, {
    event: 'NoWritePermission',
    args: { _addr: addr }
  });
} // expectNoWritePermission

function expectPermissionGranted(instance, addr, name) {
  return assertEvent(instance, {
    event: 'PermissionGranted',
    args: { _addr: addr,  _name: name }
  });
} // expectPermissionGranted

function expectPermissionRemoved(instance, addr, name) {
  return assertEvent(instance, {
    event: 'PermissionRemoved',
    args: { _addr: addr,  _name: name }
  });
} // expectPermissionRemoved

function argsMatch(expected, actual) {
  for (const k of Object.keys(expected))
    if (expected[k] !== actual[k])
      return false;
  return true;
} // argsMatch

function assertEvent(contract, filter) {
  return new Promise((resolve, reject) => {
    const event = contract[filter.event]();
    event.watch();
    event.get((error, logs) => {
      for (const evt of logs)
        if (argsMatch(filter.args, evt.args))
          return resolve();
      reject(new Error(`Failed to find ${filter.event} event for ${JSON.stringify(filter.args)}`));
    });
    event.stopWatching();
  });
} // assertEvent

