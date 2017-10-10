pragma solidity ^0.4.11;

contract Archangel {
  address owner;
  mapping (string => string) registry;
  mapping (address => bool) permissions;

  modifier ownerOnly {
    require (msg.sender == owner);
    _;
  }

  modifier permittedOnly {
    if (!permissions[msg.sender]) {
      NoWritePermission(msg.sender);
      return;
    }
    _;
  }

  event Registration(string _key, string _payload);
  event NoWritePermission(address _addr);
  event DuplicateKey(string _key);

  function Archangel() {
    owner = msg.sender;
    permissions[msg.sender] = true;
  } // Archangel

  function hasPermission(address addr) constant returns(bool) {
    return permissions[addr];
  } // hasPermissions

  function grantPermission(address addr) ownerOnly {
    permissions[addr] = true;
  } // grantPermission

  function removePermission(address addr) ownerOnly {
    permissions[addr] = false;
  } // removePermission

  function store(string key, string payload) permittedOnly {
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