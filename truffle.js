module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "3" // Match any network id
    },
    archangel: {
      host: "localhost",
      port: 8545,
      network_id: 3151,
      from: "0x9071fe4e16752193d03e9d0b2a5c0f4db5a3c70f"
    }
  }
}
