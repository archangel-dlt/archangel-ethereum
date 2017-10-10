pragma solidity ^0.4.4;

contract Archangel {
  mapping (string => string) registry;
  mapping (address => bool) public permissions;

  event Registration(string _key, string _payload);
  event NoWritePermission(address _addr);
  event DuplicateKey(string _key);

  function Archangel() {
    permissions[tx.origin] = true;
  } // Archangel

  function hasPermission(address addr) constant returns(bool) {
    return permissions[addr];
  } // hasPermissions

  function store(string key, string payload) {
    if (!permissions[tx.origin]) {
      NoWritePermission(tx.origin);
      return;
    }
    if (bytes(registry[key]).length != 0) {
      DuplicateKey(key);
      return;
    }

    registry[key] = payload;
    Registration(key, payload);
  } // store

  function fetch(string key) constant returns(string) {
    return registry[key];
  } // fetch
} // contract Archangel