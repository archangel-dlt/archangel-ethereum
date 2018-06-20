pragma solidity ^0.4.11;

contract Archangel {
  address owner;

  struct Payload {
    string payload;
    bytes32 previous_key;
  }

  mapping (string => Payload) registry;
  mapping (bytes32 => Payload) previous_versions;
  mapping (address => bool) permissions;

  modifier ownerOnly {
    require (msg.sender == owner);
    _;
  }

  modifier permittedOnly {
    if (!permissions[msg.sender]) {
      emit NoWritePermission(msg.sender);
      return;
    }
    _;
  }

  event Registration(address _addr, string _key, string _payload);
  event NoWritePermission(address _addr);
  event PermissionGranted(address _addr, string _name);
  event PermissionRemoved(address _addr, string _name);

  constructor() public {
    owner = msg.sender;
    permissions[msg.sender] = true;
  } // Archangel

  function hasPermission(address addr) external constant returns(bool) {
    return permissions[addr];
  } // hasPermissions

  function grantPermission(address addr) external ownerOnly {
    permissions[addr] = true;
  } // grantPermission

  function removePermission(address addr) external ownerOnly {
    permissions[addr] = false;
  } // removePermission

  function store(string key, string payload) external permittedOnly {
    bytes32 previous_key = moveExisting(key);

    Payload storage newPayload = registry[key];
    newPayload.payload = payload;
    newPayload.previous_key = previous_key;
    emit Registration(msg.sender, key, payload);
  } // store

  function fetch(string key) external constant returns(string, bytes32) {
    Payload storage payload = registry[key];
    return (payload.payload, payload.previous_key);
  } // fetch

  function fetchPrevious(bytes32 key) external constant returns(string, bytes32) {
    Payload storage payload = previous_versions[key];
    return (payload.payload, payload.previous_key);
  } // fetchPrevious

  //////////////////////////////////
  function moveExisting(string key) private returns (bytes32) {
    bytes32 previous_key;
    Payload storage existing = registry[key];

    if (bytes(existing.payload).length == 0)
       return previous_key;

    // move existing payload into previous_versions
    bytes32 hashed_key = sha3(key);

    bytes32 prior_key = moveBack(hashed_key);

    previous_versions[hashed_key].payload = existing.payload;
    previous_versions[hashed_key].previous_key = prior_key;

    return hashed_key;
  } // hasExisting

  function moveBack(bytes32 key) private returns(bytes32) {
    bytes32 previous_key;
    Payload storage prior = previous_versions[key];

    if (bytes(prior.payload).length == 0)
      return previous_key;

    // new version key
    bytes32 version_key = sha3(key, prior.payload, prior.previous_key);
    previous_versions[version_key].payload = prior.payload;
    previous_versions[version_key].previous_key = prior.previous_key;
    return version_key;
  } // moveBack
} // contract Archangel
