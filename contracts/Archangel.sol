pragma solidity ^0.4.11;

contract Archangel {
  address owner;

  struct Payload {
    string payload;
    bytes32 previous_key;
  }

  mapping (string => Payload) private registry;
  mapping (bytes32 => Payload) private previous_versions;
  mapping (address => string) private permissions;

  modifier ownerOnly {
    require (msg.sender == owner);
    _;
  }

  modifier permittedOnly {
    if (bytes(permissions[msg.sender]).length == 0) {
      emit NoWritePermission(msg.sender);
      return;
    }
    _;
  }

  event Registration(address _addr, string _key, string _payload);
  event Update(address _addr, string _key, string _payload);
  event NoWritePermission(address _addr);
  event PermissionGranted(address _addr, string _name);
  event PermissionRemoved(address _addr, string _name);

  constructor() public {
    owner = msg.sender;
    permissions[msg.sender] = 'contract';
  } // Archangel

  function hasPermission(address addr) external constant returns(bool) {
    return bytes(permissions[addr]).length != 0;
  } // hasPermissions

  function grantPermission(address addr, string name) external ownerOnly {
    if (this.hasPermission(addr))
      return;
    permissions[addr] = name;
    emit PermissionGranted(addr, name);
  } // grantPermission

  function removePermission(address addr) external ownerOnly {
    if (!this.hasPermission(addr))
      return;
    string memory revoked = permissions[addr];
    delete permissions[addr];
    emit PermissionRemoved(addr, revoked);
  } // removePermission

  function store(string key, string payload) external permittedOnly {
    bytes32 previous_key = moveExisting(key);
    bytes32 null_key;

    Payload storage newPayload = registry[key];
    newPayload.payload = payload;
    newPayload.previous_key = previous_key;

    if (previous_key == null_key)
      emit Registration(msg.sender, key, payload);
    else
      emit Update(msg.sender, key, payload);
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
    bytes32 hashed_key = keccak256(abi.encodePacked(key));

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
    bytes32 version_key = keccak256(abi.encodePacked(key, prior.payload, prior.previous_key));
    previous_versions[version_key].payload = prior.payload;
    previous_versions[version_key].previous_key = prior.previous_key;
    return version_key;
  } // moveBack
} // contract Archangel
