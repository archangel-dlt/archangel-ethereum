pragma solidity ^0.4.4;

contract Archangel {
  mapping (string => string) registry;
  mapping (address => bool) public permissions;

  event Registration(string _key, string _payload);

  function Archangel() {
    permissions[tx.origin] = true;
  }

  function hasPermission(address addr) constant returns(bool) {
    return permissions[addr];
  }
}