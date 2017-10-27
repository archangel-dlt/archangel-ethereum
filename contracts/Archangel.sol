pragma solidity ^0.4.11;

contract Archangel {
  address owner;

  struct Payload {
    string payload;
    bytes32 previous_key;
  }

  mapping (string => Payload) private registry;
  mapping (bytes32 => Payload) private previous_versions;
  mapping (address => bool) private permissions;

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
    bytes32 previous_key = moveExisting(key);

    var newPayload = registry[key];
    newPayload.payload = payload;
    newPayload.previous_key = previous_key;
    Registration(key, payload);
  } // store

  function fetch(string key) constant returns(string, bytes32) {
    var payload = registry[key];
    return (payload.payload, payload.previous_key);
  } // fetch

  function fetchPrevious(bytes32 key) constant returns(string, bytes32) {
    var payload = previous_versions[key];
    return (payload.payload, payload.previous_key);
  } // fetchPrevious

  //////////////////////////////////
  function moveExisting(string key) private returns (bytes32) {
    bytes32 previous_key;
    var existing = registry[key];

    if (bytes(existing.payload).length == 0)
       return previous_key;

    // move existing payload into previous_versions
    var hashed_key = sha3(key);

    var prior_key = moveBack(hashed_key);

    previous_versions[hashed_key].payload = existing.payload;
    previous_versions[hashed_key].previous_key = prior_key;

    return hashed_key;
  } // hasExisting

  function moveBack(bytes32 key) private returns(bytes32) {
    bytes32 previous_key;
    var prior = previous_versions[key];

    if (bytes(prior.payload).length == 0)
      return previous_key;

    // new version key
    var version_key = sha3(key, prior.payload, prior.previous_key);
    previous_versions[version_key].payload = prior.payload;
    previous_versions[version_key].previous_key = prior.previous_key;
    return version_key;
  } // moveBack
} // contract Archangel