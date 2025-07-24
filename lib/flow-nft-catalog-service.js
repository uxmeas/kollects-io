// Flow NFT Catalog Service for kollects.io
// Uses the official @onflow/fcl library for NBA TopShot and NFL All Day NFT integration

const fcl = require('@onflow/fcl');
const t = require('@onflow/types');

// Configure FCL to use the mainnet access node
fcl.config()
  .put('accessNode.api', 'https://rest-mainnet.onflow.org')
  .put('app.detail.title', 'Kollects.io')
  .put('flow.network', 'mainnet');

// Contract addresses for Flow mainnet
const CONTRACTS = {
  // Main contracts
  TOP_SHOT: '0x0b2a3299cc857e29',      // NBA TopShot
  ALL_DAY: '0xe4cf4bdc1751c65d',     // NFL All Day
  
  // Standard contracts
  NON_FUNGIBLE_TOKEN: '0x1d7e57aa55817448',
  METADATA_VIEWS: '0x1d7e57aa55817448',
  
  // Hybrid Custody (Account Linking)
  HYBRID_CUSTODY: '0xd8a7e05a7ac670c0',
  
  // Dapper contracts
  DAPPER_WALLET: '0x8d0e87b65159ae63',
  DAPPER_UTILITY: '0xead892083b3cb2a3'
};

// Standard NFT collection paths and interfaces
const PATHS = {
  // TopShot
  TOP_SHOT_COLLECTION: '/public/MomentCollection',
  TOP_SHOT_INTERFACE: 'TopShot.MomentCollectionPublic',
  
  // NFL All Day
  ALL_DAY_COLLECTION: '/public/AllDayCollection',
  ALL_DAY_INTERFACE: 'AllDay.MomentCollectionPublic',
  
  // Standard paths
  NFT_COLLECTION: '/public/collection',
  NFT_INTERFACE: 'NonFungibleToken.CollectionPublic',
  
  // Hybrid Custody
  HYBRID_CUSTODY_MANAGER: '/public/HybridCustodyManager'
};

// Known accounts for testing
const KNOWN_ACCOUNTS = [
  // NBA TopShot
  '0x0b2a3299cc857e29', // NBA TopShot contract
  '0x2d9feb3ab062d289', // Known user with TopShot moments
  '0x2c1162386b0a245f', // Another known user with TopShot moments
  
  // NFL All Day
  '0xe4cf4bdc1751c65d', // NFL All Day contract
  
  // Dapper
  '0x8d0e87b65159ae63'  // Dapper Wallet
];

// Cadence scripts for NFT interaction
const CADENCE_SCRIPTS = {
  // Get all NFT collections for an account (TopShot and NFL All Day)
  getAccountCollections: `
    import TopShot from ${CONTRACTS.TOP_SHOT}
    import AllDay from ${CONTRACTS.ALL_DAY}
    import NonFungibleToken from ${CONTRACTS.NON_FUNGIBLE_TOKEN}
    import MetadataViews from ${CONTRACTS.METADATA_VIEWS}
    import HybridCustody from ${CONTRACTS.HYBRID_CUSTODY}
    
    // Helper function to convert UInt64 to hex string
    access(all) fun uint64ToHexString(_ value: UInt64): String {
      let bytes = value.toBigEndianBytes()
      let hexChars = "0123456789abcdef"
      var result = "0x"
      for byte in bytes {
          let highNibble = hexChars[Int(byte) / 16].toString()
          let lowNibble = hexChars[Int(byte) % 16].toString()
          result = result.concat(highNibble).concat(lowNibble)
      }
      return result
    }
    
    // Helper function to get TopShot moments for an account
    access(all) fun getTopShotMoments(account: Address): [UInt64] {
      let account = getAccount(account)
      
      // Try getting the collection using the standard path
      if let collection = account.getCapability(/public/MomentCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>() {
          return collection.getIDs()
      }
      
      // Try alternative paths if the standard path fails
      if let collection = account.getCapability(/public/topshotCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>() {
          return collection.getIDs()
      }
      
      // Try with the full contract address
      if let collection = account.getCapability(/public/topshotCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>() {
          return collection.getIDs()
      }
      
      return []
    }
    
    // Main function to get all TopShot moments including from linked accounts
    access(all) fun main(account: Address): [UInt64] {
      let account = getAccount(account)
      var allMoments: [UInt64] = []
      var seen: {UInt64: Bool} = {}
      
      // Get moments from main account
      let moments = getTopShotMoments(account.address)
      for id in moments {
          if seen[id] == nil {
              allMoments.append(id)
              seen[id] = true
          }
      }
      
      // Check for Hybrid Custody linked accounts
      if let manager = account.getCapability(/public/HybridCustodyManager)
          .borrow<&{HybridCustody.ManagerPublic}>() {
          
          for childAddress in manager.getLinkedAddresses() {
              let childMoments = getTopShotMoments(childAddress)
              for id in childMoments {
                  if seen[id] == nil {
                      allMoments.append(id)
                      seen[id] = true
                  }
              }
          }
      }
      
      return allMoments
    }
    
    // Main function to get all collections for an account
    access(all) fun main(account: Address): {String: [String]} {
      let account = getAccount(account)
      var result: {String: [String]} = {}
      
      // Check for TopShot collection
      let topShotIds = getCollectionNFTs(
        account, 
        "MomentCollection", 
        Type<&{TopShot.MomentCollectionPublic}>()
      )
      if topShotIds.length > 0 {
        let hexIds: [String] = []
        for id in topShotIds {
          hexIds.append(uint64ToHexString(id))
        }
        result["topshot"] = hexIds
      }
      
      // Check for NFL All Day collection
      let allDayIds = getCollectionNFTs(
        account,
        "MomentCollection",
        Type<&{AllDay.MomentCollectionPublic}>()
      )
      if allDayIds.length > 0 {
        var hexIds: [String] = []
        for id in allDayIds {
          hexIds.append(uint64ToHexString(id))
        }
        result["allday"] = hexIds
      }
      
      // Check for any other NFT collections
      if let collection = account.getCapability(/public/collection)
          .borrow<&{NonFungibleToken.CollectionPublic}>() {
          let ids = collection.getIDs()
          if ids.length > 0 {
              let hexIds: [String] = []
              for id in ids {
                  hexIds.append(uint64ToHexString(id))
              }
              result["nft"] = hexIds
          }
      }
      
      // Check for Hybrid Custody linked accounts
      if let manager = account.getCapability(/public/HybridCustodyManager)
          .borrow<&{HybridCustody.ManagerPublic}>() {
          
          // For each linked account, check for collections
          for childAddress in manager.getLinkedAddresses() {
              let childAccount = getAccount(childAddress)
              
              // Check TopShot in child account
              let childTopShotIds = getCollectionNFTs(
                childAccount,
                "MomentCollection",
                Type<&{TopShot.MomentCollectionPublic}>()
              )
              if childTopShotIds.length > 0 {
                  if result["topshot"] == nil { result["topshot"] = [] }
                  for id in childTopShotIds {
                      result["topshot"]!.append(uint64ToHexString(id))
                  }
              }
              
              // Check NFL All Day in child account
              let childAllDayIds = getCollectionNFTs(
                childAccount,
                "MomentCollection",
                Type<&{AllDay.MomentCollectionPublic}>()
              )
              if childAllDayIds.length > 0 {
                  if result["allday"] == nil { result["allday"] = [] }
                  for id in childAllDayIds {
                      result["allday"]!.append(uint64ToHexString(id))
                  }
              }
          }
      }
      
      return result
    }
  `,
  
  // Get TopShot moments for an account (including linked accounts)
  getTopShotMoments: `
    import TopShot from ${CONTRACTS.TOP_SHOT}
    import NonFungibleToken from ${CONTRACTS.NON_FUNGIBLE_TOKEN}
    import HybridCustody from ${CONTRACTS.HYBRID_CUSTODY}
    
    // Helper function to get TopShot moments from an account
    access(all) fun getTopShotMoments(account: &Account): [UInt64] {
      if let collection = account.getCapability(/public/MomentCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>() {
          return collection.getIDs()
      }
      return []
    }
    
    access(all) fun main(account: Address): [String] {
      let account = getAccount(account)
      var result: [String] = []
      var seen: {UInt64: Bool} = {}
      
      // Get moments from main account
      let moments = getTopShotMoments(account)
      for id in moments {
          if seen[id] == nil {
              result.append(id.toString())
              seen[id] = true
          }
      }
      
      // Check for Hybrid Custody linked accounts
      if let manager = account.getCapability(/public/HybridCustodyManager)
          .borrow<&{HybridCustody.ManagerPublic}>() {
          
          for childAddress in manager.getLinkedAddresses() {
              let childAccount = getAccount(childAddress)
              let childMoments = getTopShotMoments(childAccount)
              
              for id in childMoments {
                  if seen[id] == nil {
                      result.append(id.toString())
                      seen[id] = true
                  }
              }
          }
      }
      
      return result
    }
  `,
  
  // Get details for a specific TopShot moment (with full metadata)
  getTopShotMomentDetails: `
    import TopShot from ${CONTRACTS.TOP_SHOT}
    import NonFungibleToken from ${CONTRACTS.NON_FUNGIBLE_TOKEN}
    import MetadataViews from ${CONTRACTS.METADATA_VIEWS}
    import HybridCustody from ${CONTRACTS.HYBRID_CUSTODY}
    
    // Helper function to get moment details from a collection
    access(all) fun getMomentDetails(
      collection: &{TopShot.MomentCollectionPublic}, 
      momentID: UInt64
    ): {String: AnyStruct}? {
      if let moment = collection.borrowMoment(id: momentID) {
          var result: {String: AnyStruct} = {
              "id": momentID,
              "type": "topshot"
          }
          
          // Get standard metadata
          if let resolver = moment as? &{MetadataViews.Resolver} {
              // Basic display info
              if let display = MetadataViews.getDisplay(resolver) {
                  result["name"] = display.name ?? ""
                  result["description"] = display.description ?? ""
                  
                  // Get thumbnail
                  if !display.media.views.isEmpty {
                      if let media = display.media.views[0] as? MetadataViews.HTTPFile {
                          result["thumbnail_url"] = media.url
                      }
                  }
              }
              
              // Get TopShot-specific metadata
              if let topShotView = resolver.resolveView(Type<TopShot.MomentData>()) {
                  if let momentData = topShotView as? TopShot.MomentData {
                      result["play_id"] = momentData.playID
                      result["set_id"] = momentData.setID
                      result["serial_number"] = momentData.serialNumber
                      
                      // Get play details
                      let play = TopShot.getPlay(momentData.playID)
                      result["player_ids"] = play.playerIDs
                      result["play_type"] = play.playType
                      
                      // Get set details
                      let set = TopShot.getSet(momentData.setID)
                      result["set_name"] = set.name
                      result["set_series"] = set.series
                      
                      // Get play stats if available
                      if let stats = play.stats {
                          result["stats"] = stats
                      }
                  }
              }
              
              // Get edition info if available
              if let editions = MetadataViews.getEditions(resolver) {
                  if !editions.isEmpty {
                      let edition = editions[0]
                      result["edition_name"] = edition.name
                      result["edition_number"] = edition.number
                      result["edition_max"] = edition.max
                  }
              }
          }
          
          return result
      }
      return nil
    }
    
    // Main function to get moment details from any account (including linked)
    access(all) fun main(account: Address, momentID: UInt64): {String: AnyStruct}? {
      let account = getAccount(account)
      
      // Try to get the TopShot collection from the main account
      if let collection = account.getCapability(/public/MomentCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>() {
          if let details = getMomentDetails(collection, momentID) {
              return details
          }
      }
      
      // Check for Hybrid Custody linked accounts
      if let manager = account.getCapability(/public/HybridCustodyManager)
          .borrow<&{HybridCustody.ManagerPublic}>() {
          
          for childAddress in manager.getLinkedAddresses() {
              let childAccount = getAccount(childAddress)
              if let collection = childAccount.getCapability(/public/MomentCollection)
                  .borrow<&{TopShot.MomentCollectionPublic}>() {
                  if let details = getMomentDetails(collection, momentID) {
                      // Add source account info
                      details["source_account"] = childAddress.toString()
                      details["is_linked_account"] = true
                      return details
                  }
              }
          }
      }
      
      return nil
    }

/**
 * Flow NFT Catalog Service
 * Handles interactions with Flow blockchain for NBA TopShot and NFL All Day NFTs
 */
class FlowNFTCatalogService {
  constructor() {
    // Initialize any required properties
  }

  /**
   * Execute a Cadence script
   * @param {string} script - The Cadence script to execute
   * @param {Array} args - The arguments to pass to the script
   * @returns {Promise<*>} The result of the script execution
   */
  async executeScript(script, args = []) {
    try {
      // Convert arguments to FCL format
      const fclArgs = args.map(arg => {
        if (arg.type === 'Address') {
          return fcl.arg(arg.value, t.Address);
        } else if (arg.type === 'UInt64') {
          return fcl.arg(arg.value, t.UInt64);
        } else if (arg.type === 'String') {
          return fcl.arg(arg.value, t.String);
        } else if (arg.type === 'Bool') {
          return fcl.arg(arg.value, t.Bool);
        } else if (arg.type === 'Array' && arg.elementType) {
          return fcl.arg(arg.value, t.Array(t[arg.elementType]));
        } else if (arg.type === 'Dictionary' && arg.keyType && arg.valueType) {
          return fcl.arg(arg.value, t.Dictionary(t[arg.keyType], t[arg.valueType]));
        }
        return fcl.arg(arg.value, t.String); // Default to String type
      });

      // Execute the script with the provided arguments
      const result = await fcl.send([
        fcl.script(script)
      ].concat(fclArgs));

      // Decode and return the result
      return await fcl.decode(result);
    } catch (error) {
      console.error('Error executing script:', error);
      throw error;
    }
  }

  /**
   * Get all NFT collections for an account using the NFT Catalog
   * @param {string} accountAddress - The Flow account address
   * @returns {Promise<Object>} - Object mapping collection IDs to their NFT IDs
   */
  async getAccountCollections(accountAddress) {
    try {
      console.log('Fetching NFT collections for account: ' + accountAddress);
      const result = await this.executeScript(CADENCE_SCRIPTS.getAccountCollections, [
        { type: 'Address', value: accountAddress }
      ]);
      
      console.log('Found NFT collections:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Error fetching NFT collections:', error.message);
      return {};
    }
  }

  /**
   * Get TopShot moments for an account
   * @param {string} accountAddress - Flow account address
   * @returns {Promise<Array<string>>} - Array of moment IDs
   */
  async getTopShotMoments(accountAddress) {
    try {
      console.log(`Fetching TopShot moments for account: ${accountAddress}`);
      
      // Use the pre-defined script from CADENCE_SCRIPTS
      const result = await this.executeScript(CADENCE_SCRIPTS.getTopShotMoments, [
        { type: 'Address', value: accountAddress }
      ]);
      
      console.log(`Found ${result ? result.length : 0} TopShot moments`);
      return result || [];
    } catch (error) {
      console.error('Error fetching TopShot moments:', error.message);
      return [];
    }
  }
        type: 'Address',
        value: accountAddress
      }]);
      
      if (result && Array.isArray(result)) {
        return result.map(id => id.toString());
      }
      return [];
    } catch (error) {
      console.error('Error fetching TopShot moments:', error);
      return [];
    }
  }

  /**
   * Get NFL AllDay moments for an account
   * @param {string} accountAddress - The Flow account address
   * @returns {Promise<Array>} - Array of NFL AllDay moment IDs
   */
  async getAllDayMoments(accountAddress) {
    try {
      console.log(`Fetching NFL AllDay moments for account: ${accountAddress}`);
      
      // Use the pre-defined script from CADENCE_SCRIPTS
      const result = await this.executeScript(CADENCE_SCRIPTS.getAllDayMoments, [
        { type: 'Address', value: accountAddress }
      ]);
      
      if (result && Array.isArray(result)) {
        return result.map(id => id.toString());
      }
      return [];
    } catch (error) {
      console.error('Error fetching NFL AllDay moments:', error);
      return [];
    }
  }

  /**
   * Get details for a specific TopShot moment
   * @param {string} accountAddress - The Flow account address
   * @param {number} momentId - The moment ID
   * @returns {Promise<Object|null>} - Moment details or null if not found
   */
  async getTopShotMomentDetails(accountAddress, momentId) {
    try {
      console.log(`Fetching details for TopShot moment ${momentId}`);
      
      // Use the pre-defined script from CADENCE_SCRIPTS with proper argument format
      const result = await this.executeScript(CADENCE_SCRIPTS.getTopShotMomentDetails, [
        { type: 'Address', value: accountAddress },
        { type: 'UInt64', value: momentId.toString() }
      ]);
      
      if (result) {
        console.log('Successfully retrieved moment details');
        return result;
      }
      
      console.log('No details found for this moment');
      return null;
    } catch (error) {
      console.error('Error fetching moment details:', error.message);
      throw error;
    }
  }
}

// Export the service
module.exports = FlowNFTCatalogService;
