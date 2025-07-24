// Flow Blockchain API Service for kollects.io
// Handles communication with the Flow blockchain using QuickNode as primary and public Flow nodes as fallback

const QUICKNODE_FLOW_ENDPOINT = 'https://radial-maximum-snowflake.flow-mainnet.quiknode.pro/54979bcefb63d671f5f5d1be5e5311c967e799c2/v1/scripts';
const PUBLIC_FLOW_ENDPOINT = 'https://rest-mainnet.onflow.org/v1/scripts';

// Mock data detection patterns
const MOCK_DATA_PATTERNS = [
  // Removed all specific test moment IDs for nuclear cleanup
  'NBA Player', 'NFL Player', // Mock player names
  'NBA Team', 'NFL Team', // Mock team names
  'Highlight Play', // Mock play descriptions
  '2021-01-01', // Mock dates
  '2020-21 NBA Top Shot', // Mock set names
  'NFL All Day' // Mock set names
];

// Enhanced mock data detection function
function validateRealData(data, source = 'unknown') {
  const dataString = JSON.stringify(data);
  for (const pattern of MOCK_DATA_PATTERNS) {
    if (dataString.includes(pattern)) {
      console.error(`🚨 MOCK DATA DETECTED in ${source}:`, pattern);
      throw new Error(`🚨 MOCK DATA FORBIDDEN: ${pattern} found in ${source}`);
    }
  }
  return data;
}

// Environment enforcement
const STRICT_REAL_DATA_ONLY = process.env.NODE_ENV === 'production' || process.env.FORCE_REAL_DATA;

// Smart contract addresses
const SMART_CONTRACTS = {
  NBA_TOP_SHOT: '0x0b2a3299cc857e29',
  NFL_ALL_DAY: '0xe4cf4bdc1751c65d',
  NON_FUNGIBLE_TOKEN: '0x1d7e57aa55817448',
  METADATA_VIEWS: '0x1d7e57aa55817448',
  HYBRID_CUSTODY: '0xd8a7e05a7ac670c0',
  TOP_SHOT_MARKET: '0x3b6ef1a5c8e20b01', // TopShot Market contract
  ALL_DAY_MARKET: '0x4c1d0650f5e4f0c8', // AllDay Market contract
};

// Enhanced Cadence script templates for comprehensive data collection
const CADENCE_SCRIPTS = {
  // Test connection to Flow blockchain
  testConnection: `
    access(all) fun main(): String {
        return "Flow connection test successful!"
    }`,

  // Check if a wallet exists
  checkWallet: `
    access(all) fun main(account: Address): Bool {
        return getAccount(account) != nil
    }`,

  // Enumerate public capabilities
  enumerateCapabilities: `
    import NonFungibleToken from 0x1d7e57aa55817448
    
    access(all) fun main(account: Address): [String] {
        let acct = getAccount(account)
        let paths: [String] = []
        
        // Try to enumerate actual public capabilities
        if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/topshotCollection) {
            paths.append("/public/topshotCollection")
        }
        if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/allDayCollection) {
            paths.append("/public/allDayCollection")
        }
        if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/MomentCollection) {
            paths.append("/public/MomentCollection")
        }
        if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/Collection) {
            paths.append("/public/Collection")
        }
        
        return paths
    }`,

  // Enhanced TopShot moment data collection with comprehensive metadata
  getTopShotMomentDetails: `
    import TopShot from ${SMART_CONTRACTS.NBA_TOP_SHOT}
    import MetadataViews from ${SMART_CONTRACTS.METADATA_VIEWS}
    import TopShotMarket from ${SMART_CONTRACTS.TOP_SHOT_MARKET}
    
    access(all) struct MomentDetails {
        access(all) let id: UInt64
        access(all) let playID: UInt32
        access(all) let play: {String: AnyStruct}
        access(all) let setID: UInt32
        access(all) let setName: String
        access(all) let serialNumber: UInt32
        access(all) let mintingDate: UFix64
        access(all) let player: String
        access(all) let team: String
        access(all) let playDescription: String
        access(all) let gameDate: String
        access(all) let rarity: String
        access(all) let circulationCount: UInt32
        access(all) let lastSalePrice: UFix64?
        access(all) let currentListingPrice: UFix64?
        
        init(id: UInt64, playID: UInt32, play: {String: AnyStruct}, setID: UInt32, setName: String, 
             serialNumber: UInt32, mintingDate: UFix64, player: String, team: String, 
             playDescription: String, gameDate: String, rarity: String, circulationCount: UInt32,
             lastSalePrice: UFix64?, currentListingPrice: UFix64?) {
            self.id = id
            self.playID = playID
            self.play = play
            self.setID = setID
            self.setName = setName
            self.serialNumber = serialNumber
            self.mintingDate = mintingDate
            self.player = player
            self.team = team
            self.playDescription = playDescription
            self.gameDate = gameDate
            self.rarity = rarity
            self.circulationCount = circulationCount
            self.lastSalePrice = lastSalePrice
            self.currentListingPrice = currentListingPrice
        }
    }
    
    access(all) fun main(account: Address, momentID: UInt64): MomentDetails? {
        let acct = getAccount(account)
        
        // Try common TopShot collection paths
        let paths = [
            "/public/topshotCollection",
            "/public/MomentCollection",
            "/public/Collection",
            "/public/topshot",
            "/public/topshotMoments"
        ]
        
        for path in paths {
            if let capability = acct.capabilities.borrow<&{TopShot.MomentCollectionPublic}>(path) {
                if let collection = capability.borrow() {
                    if let moment = collection.borrowMoment(id: momentID) {
                        // Get play data
                        let play = TopShot.getPlayMetaData(playID: moment.data.playID)
                        
                        // Get set data
                        let setData = TopShot.getSetMetaData(setID: moment.data.setID)
                        
                        // Determine rarity based on serial number and circulation
                        let rarity = getRarity(moment.data.serialNumber, setData.circulationCount)
                        
                        // Try to get market data
                        var lastSalePrice: UFix64? = nil
                        var currentListingPrice: UFix64? = nil
                        
                        // This would require additional market contract calls
                        // For now, we'll use placeholder values
                        
                        return MomentDetails(
                            id: momentID,
                            playID: moment.data.playID,
                            play: play,
                            setID: moment.data.setID,
                            setName: setData.name,
                            serialNumber: moment.data.serialNumber,
                            mintingDate: moment.data.mintingDate,
                            player: play["Player"] as? String ?? "Unknown Player",
                            team: play["Team"] as? String ?? "Unknown Team",
                            playDescription: play["PlayDescription"] as? String ?? "Unknown Play",
                            gameDate: play["GameDate"] as? String ?? "Unknown Date",
                            rarity: rarity,
                            circulationCount: setData.circulationCount,
                            lastSalePrice: lastSalePrice,
                            currentListingPrice: currentListingPrice
                        )
                    }
                }
            }
        }
        
        return nil
    }
    
    access(all) fun getRarity(serialNumber: UInt32, circulationCount: UInt32): String {
        if serialNumber <= 10 { return "Legendary" }
        if serialNumber <= 100 { return "Epic" }
        if serialNumber <= 1000 { return "Rare" }
        if serialNumber <= 10000 { return "Uncommon" }
        return "Common"
    }`,

  // Enhanced AllDay moment data collection
  getAllDayMomentDetails: `
    import AllDay from ${SMART_CONTRACTS.NFL_ALL_DAY}
    import MetadataViews from ${SMART_CONTRACTS.METADATA_VIEWS}
    
    access(all) struct AllDayMomentDetails {
        access(all) let id: UInt64
        access(all) let playID: UInt32
        access(all) let play: {String: AnyStruct}
        access(all) let setID: UInt32
        access(all) let setName: String
        access(all) let serialNumber: UInt32
        access(all) let mintingDate: UFix64
        access(all) let player: String
        access(all) let team: String
        access(all) let playDescription: String
        access(all) let gameDate: String
        access(all) let rarity: String
        access(all) let circulationCount: UInt32
        
        init(id: UInt64, playID: UInt32, play: {String: AnyStruct}, setID: UInt32, setName: String,
             serialNumber: UInt32, mintingDate: UFix64, player: String, team: String,
             playDescription: String, gameDate: String, rarity: String, circulationCount: UInt32) {
            self.id = id
            self.playID = playID
            self.play = play
            self.setID = setID
            self.setName = setName
            self.serialNumber = serialNumber
            self.mintingDate = mintingDate
            self.player = player
            self.team = team
            self.playDescription = playDescription
            self.gameDate = gameDate
            self.rarity = rarity
            self.circulationCount = circulationCount
        }
    }
    
    access(all) fun main(account: Address, momentID: UInt64): AllDayMomentDetails? {
        let acct = getAccount(account)
        
        // Try common AllDay collection paths
        let paths = [
            "/public/allDayCollection",
            "/public/AllDayCollection",
            "/public/nflCollection",
            "/public/collection"
        ]
        
        for path in paths {
            if let capability = acct.capabilities.borrow<&{AllDay.MomentCollectionPublic}>(path) {
                if let collection = capability.borrow() {
                    if let moment = collection.borrowMoment(id: momentID) {
                        // Get play data
                        let play = AllDay.getPlayMetaData(playID: moment.data.playID)
                        
                        // Get set data
                        let setData = AllDay.getSetMetaData(setID: moment.data.setID)
                        
                        // Determine rarity
                        let rarity = getRarity(moment.data.serialNumber, setData.circulationCount)
                        
                        return AllDayMomentDetails(
                            id: momentID,
                            playID: moment.data.playID,
                            play: play,
                            setID: moment.data.setID,
                            setName: setData.name,
                            serialNumber: moment.data.serialNumber,
                            mintingDate: moment.data.mintingDate,
                            player: play["Player"] as? String ?? "Unknown Player",
                            team: play["Team"] as? String ?? "Unknown Team",
                            playDescription: play["PlayDescription"] as? String ?? "Unknown Play",
                            gameDate: play["GameDate"] as? String ?? "Unknown Date",
                            rarity: rarity,
                            circulationCount: setData.circulationCount
                        )
                    }
                }
            }
        }
        
        return nil
    }
    
    access(all) fun getRarity(serialNumber: UInt32, circulationCount: UInt32): String {
        if serialNumber <= 10 { return "Legendary" }
        if serialNumber <= 100 { return "Epic" }
        if serialNumber <= 1000 { return "Rare" }
        if serialNumber <= 10000 { return "Uncommon" }
        return "Common"
    }`,

  // Get TopShot collection IDs with comprehensive path testing
  getTopShotCollectionIds: `
import TopShot from 0x0b2a3299cc857e29
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    
    // Try the MOST LIKELY TopShot collection paths based on current documentation
    let likelyPaths = [
        "topShotCollection",
        "TopShotCollection", 
        "momentCollection",
        "topshotCollection",
        "TopShotMomentCollection",
        "collection",
        "nftCollection",
        "moments",
        "topshot",
        "TopShotMoments",
        "NonFungibleToken.Collection",
        "NonFungibleToken.CollectionPublic",
        "NonFungibleToken.CollectionPublicPath"
    ]
    
    for pathId in likelyPaths {
        if let path = PublicPath(identifier: pathId) {
            if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(path) {
                return collectionRef.getIDs()
            }
        }
    }
    
    // Try direct path access without PublicPath constructor
    if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/topShotCollection) {
        return collectionRef.getIDs()
    }
    
    if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/TopShotCollection) {
        return collectionRef.getIDs()
    }
    
    if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/momentCollection) {
        return collectionRef.getIDs()
    }
    
    return []
}`,
  getTopShotMomentData: `
import TopShot from 0x0b2a3299cc857e29
import MetadataViews from 0x1d7e57aa55817448

access(all) struct MomentData {
    access(all) let id: UInt64
    access(all) let playID: UInt32
    access(all) let play: {String: AnyStruct}
    access(all) let setID: UInt32
    access(all) let setName: String
    access(all) let serialNumber: UInt32
    access(all) let mintingDate: UFix64

    init(id: UInt64, playID: UInt32, play: {String: AnyStruct}, setID: UInt32, setName: String, serialNumber: UInt32, mintingDate: UFix64) {
        self.id = id
        self.playID = playID
        self.play = play
        self.setID = setID
        self.setName = setName
        self.serialNumber = serialNumber
        self.mintingDate = mintingDate
    }
}

access(all) fun main(account: Address, momentID: UInt64): MomentData? {
    let acct = getAccount(account)
    
    // Try the MOST LIKELY TopShot collection paths
    let likelyPaths = [
        "topShotCollection",
        "TopShotCollection", 
        "momentCollection",
        "topshotCollection"
    ]
    
    for pathId in likelyPaths {
        if let path = PublicPath(identifier: pathId) {
            if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(path) {
                if let moment = collectionRef.borrowNFT(id: momentID) {
                    // Basic moment data for alternative paths
                    return MomentData(
                        id: momentID,
                        playID: 0,
                        play: {},
                        setID: 0,
                        setName: "Unknown Set",
                        serialNumber: 0,
                        mintingDate: 0.0
                    )
                }
            }
        }
    }
    
    // Try direct path access
    if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/topShotCollection) {
        if let moment = collectionRef.borrowNFT(id: momentID) {
            return MomentData(
                id: momentID,
                playID: 0,
                play: {},
                setID: 0,
                setName: "Unknown Set",
                serialNumber: 0,
                mintingDate: 0.0
            )
        }
    }
    
    return nil
}`,
  getAllDayCollectionIds: `
import AllDay from 0xe4cf4bdc1751c65d
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    
    // Try the MOST LIKELY AllDay collection paths
    let likelyPaths = [
        "allDayCollection",
        "AllDayCollection", 
        "nflCollection",
        "alldayCollection",
        "NFLAllDayCollection",
        "collection",
        "nftCollection"
    ]
    
    for pathId in likelyPaths {
        if let path = PublicPath(identifier: pathId) {
            if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(path) {
                return collectionRef.getIDs()
            }
        }
    }
    
    // Try direct path access
    if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/allDayCollection) {
        return collectionRef.getIDs()
    }
    
    if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/AllDayCollection) {
        return collectionRef.getIDs()
    }
    
    return []
}`,

  // Get comprehensive portfolio analytics
  getPortfolioAnalytics: `
    import TopShot from ${SMART_CONTRACTS.NBA_TOP_SHOT}
    import AllDay from ${SMART_CONTRACTS.NFL_ALL_DAY}
    import NonFungibleToken from ${SMART_CONTRACTS.NON_FUNGIBLE_TOKEN}
    
    access(all) struct PortfolioAnalytics {
        access(all) let totalMoments: UInt32
        access(all) let topShotCount: UInt32
        access(all) let allDayCount: UInt32
        access(all) let uniqueSets: UInt32
        access(all) let totalCirculation: UInt32
        access(all) let averageSerialNumber: UFix64
        access(all) let rarityBreakdown: {String: UInt32}
        access(all) let teamBreakdown: {String: UInt32}
        access(all) let playerBreakdown: {String: UInt32}
        access(all) let acquisitionTimeline: {String: UInt32}
        
        init(totalMoments: UInt32, topShotCount: UInt32, allDayCount: UInt32, uniqueSets: UInt32,
             totalCirculation: UInt32, averageSerialNumber: UFix64, rarityBreakdown: {String: UInt32},
             teamBreakdown: {String: UInt32}, playerBreakdown: {String: UInt32}, acquisitionTimeline: {String: UInt32}) {
            self.totalMoments = totalMoments
            self.topShotCount = topShotCount
            self.allDayCount = allDayCount
            self.uniqueSets = uniqueSets
            self.totalCirculation = totalCirculation
            self.averageSerialNumber = averageSerialNumber
            self.rarityBreakdown = rarityBreakdown
            self.teamBreakdown = teamBreakdown
            self.playerBreakdown = playerBreakdown
            self.acquisitionTimeline = acquisitionTimeline
        }
    }
    
    access(all) fun main(account: Address): PortfolioAnalytics {
        let acct = getAccount(account)
        
        // This would be a comprehensive analysis of the portfolio
        // For now, return basic analytics structure
        return PortfolioAnalytics(
            totalMoments: 0,
            topShotCount: 0,
            allDayCount: 0,
            uniqueSets: 0,
            totalCirculation: 0,
            averageSerialNumber: 0.0,
            rarityBreakdown: {},
            teamBreakdown: {},
            playerBreakdown: {},
            acquisitionTimeline: {}
        )
    }`
};

class FlowAPIService {
  constructor() {
    this.baseUrl = QUICKNODE_FLOW_ENDPOINT; // Use direct QuickNode endpoint for now
  }

  /**
   * Encode a value for Flow API
   * @param {*} value - The value to encode
   * @returns {Object} - The encoded value
   */
  encodeValue(value) {
    if (typeof value === 'string') {
      return {
        type: 'String',
        value: value
      };
    } else if (typeof value === 'number') {
      return {
        type: 'UInt64',
        value: value.toString()
      };
    } else if (typeof value === 'boolean') {
      return {
        type: 'Bool',
        value: value.toString()
      };
    } else if (Array.isArray(value)) {
      return {
        type: 'Array',
        value: value.map(item => this.encodeValue(item))
      };
    } else if (value && typeof value === 'object') {
      // If it's already a properly formatted argument, return as is
      if (value.type && value.value !== undefined) {
        return value;
      }
      // Otherwise encode as a dictionary
      const dict = {};
      for (const [key, val] of Object.entries(value)) {
        dict[key] = this.encodeValue(val);
      }
      return {
        type: 'Dictionary',
        value: dict
      };
    }
    return value;
  }

  /**
   * Execute a Cadence script on the Flow blockchain
   * @param {string} script - The Cadence script to execute
   * @param {Array} args - Array of arguments to pass to the script
   * @returns {Promise<Object>} - The result of the script execution
   */
  async executeScript(script, args = []) {
    try {
      console.log('🔗 Executing Flow script...');
      
      // Encode arguments for Flow API
      const encodedArgs = args.map(arg => this.encodeValue(arg));
      
      // Try QuickNode first
      console.log('🔗 Trying QuickNode endpoint...');
      try {
        const response = await fetch(QUICKNODE_FLOW_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: Buffer.from(script).toString('base64'),
            arguments: encodedArgs.map(arg => ({
              type: arg.type,
              value: arg.value
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Flow script executed successfully via QuickNode');
          return data;
        }
        
        // If we get here, QuickNode failed but didn't throw
        console.warn(`⚠️ QuickNode returned status ${response.status}, trying public endpoint...`);
      } catch (quickNodeError) {
        console.warn('⚠️ QuickNode request failed, trying public endpoint...', quickNodeError.message);
      }

      // Fall back to public endpoint
      console.log('🔄 Trying public Flow endpoint...');
      const publicResponse = await fetch(PUBLIC_FLOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: Buffer.from(script).toString('base64'),
          arguments: encodedArgs.map(arg => Buffer.from(JSON.stringify(arg)).toString('base64'))
        })
      });

      if (!publicResponse.ok) {
        const errorText = await publicResponse.text();
        throw new Error(`Public Flow API error: ${publicResponse.status} - ${errorText}`);
      }

      const result = await publicResponse.json();
      console.log('✅ Flow script executed successfully via public endpoint');
      return result;
    } catch (error) {
      console.error('❌ Flow API error:', error.message);
      throw error;
    }
  }

  // Test Flow connection
  async testConnection() {
    const script = CADENCE_SCRIPTS.testConnection;
    const result = await this.executeScript(script);
    console.log('🔗 Connection test result:', result);
    return result;
  }

  // Test Flow connection
  async testConnection() {
    const script = CADENCE_SCRIPTS.testConnection;
    const result = await this.executeScript(script);
    console.log('🔗 Connection test result:', result);
    return result;
  }

  // Check if wallet exists
  async checkWallet(accountAddress) {
    const script = CADENCE_SCRIPTS.checkWallet;
    const args = [
      {
        type: 'Address',
        value: accountAddress
      }
    ];
    const result = await this.executeScript(script, args);
    console.log('✅ Wallet check result:', result);
    return result;
  }

  // Enumerate public capabilities
  async enumerateCapabilities(accountAddress) {
    const script = CADENCE_SCRIPTS.enumerateCapabilities;
    const args = [
      {
        type: 'Address',
        value: accountAddress
      }
    ];
    const result = await this.executeScript(script, args);
    console.log('🔗 Enumerated public capabilities:', result);
    return result;
  }

  // Get NBA Top Shot collection IDs
  async getTopShotCollectionIds(accountAddress) {
    try {
      console.log('🏀 Attempting to get NBA Top Shot collection IDs...');
      
      // Real script to get TopShot collection IDs from wallet
      const script = `
import TopShot from 0x0b2a3299cc857e29
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    let momentIds: [UInt64] = []
    
    // Try common TopShot collection paths using PublicPath constants
    if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/topshotCollection) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/MomentCollection) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/Collection) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/topshot) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/topshotMoments) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    }
    
    return momentIds
}`;
      
      const args = [
        {
          type: 'Address',
          value: accountAddress
        }
      ];

      const result = await this.executeScript(script, args);
      
      console.log('🔍 Raw result:', JSON.stringify(result, null, 2));
      
      // Parse Flow response format - handle both JSON objects and base64 strings
      let parsedResult = result;
      
      // If result is a string, try to parse it as base64
      if (typeof result === 'string') {
        try {
          const decoded = Buffer.from(result, 'base64').toString('utf-8');
          parsedResult = JSON.parse(decoded);
          console.log('🔍 Decoded result:', JSON.stringify(parsedResult, null, 2));
        } catch (e) {
          console.log('❌ Failed to decode base64 result:', e.message);
        }
      }
      
      if (parsedResult.value && Array.isArray(parsedResult.value)) {
        const momentIds = parsedResult.value.map(item => parseInt(item.value));
        console.log('✅ Real NBA Top Shot moments found:', momentIds.length);
        console.log('✅ Real NBA Top Shot data found:', momentIds);
        
        return momentIds;
      }
      
      console.log('📊 Top Shot collection IDs result:', result);
      console.log('❌ No moment IDs found in response');
      return [];
    } catch (error) {
      console.log('🔍 Error caught in getTopShotCollectionIds:', error.message);
      console.log('❌ NO FALLBACK DATA - Returning empty array for real data only');
      return [];
    }
  }

  // Get detailed moment data
  async getTopShotMomentData(accountAddress, momentId) {
    const script = CADENCE_SCRIPTS.getTopShotMomentData;
    const args = [
      {
        type: 'Address',
        value: accountAddress
      },
      {
        type: 'UInt64',
        value: momentId.toString()
      }
    ];

    const result = await this.executeScript(script, args);
    return this.parseMomentData(result);
  }

  // Get comprehensive TopShot moment details with enhanced metadata
  async getTopShotMomentDetails(accountAddress, momentId) {
    try {
      console.log('🏀 Getting detailed TopShot moment data for ID:', momentId);
      
      const script = CADENCE_SCRIPTS.getTopShotMomentDetails;
      const args = [
        {
          type: 'Address',
          value: accountAddress
        },
        {
          type: 'UInt64',
          value: momentId.toString()
        }
      ];

      const result = await this.executeScript(script, args);
      return this.parseEnhancedMomentData(result, 'topshot');
    } catch (error) {
      console.error('❌ Error getting TopShot moment details:', error.message);
      // Throw error instead of returning mock data
      throw new Error(`Failed to get TopShot moment details: ${error.message}`);
    }
  }

  // Get comprehensive AllDay moment details with enhanced metadata
  async getAllDayMomentDetails(accountAddress, momentId) {
    try {
      console.log('🏈 Getting detailed AllDay moment data for ID:', momentId);
      
      const script = CADENCE_SCRIPTS.getAllDayMomentDetails;
      const args = [
        {
          type: 'Address',
          value: accountAddress
        },
        {
          type: 'UInt64',
          value: momentId.toString()
        }
      ];

      const result = await this.executeScript(script, args);
      return this.parseEnhancedMomentData(result, 'allday');
    } catch (error) {
      console.error('❌ Error getting AllDay moment details:', error.message);
      // Throw error instead of returning mock data
      throw new Error(`Failed to get AllDay moment details: ${error.message}`);
    }
  }

  // Get comprehensive portfolio analytics
  async getPortfolioAnalytics(accountAddress) {
    try {
      console.log('📊 Getting comprehensive portfolio analytics for:', accountAddress);
      
      const script = CADENCE_SCRIPTS.getPortfolioAnalytics;
      const args = [
        {
          type: 'Address',
          value: accountAddress
        }
      ];

      const result = await this.executeScript(script, args);
      return this.parsePortfolioAnalytics(result);
    } catch (error) {
      console.error('❌ Error getting portfolio analytics:', error.message);
      // Return basic analytics structure
      return {
        totalMoments: 0,
        topShotCount: 0,
        allDayCount: 0,
        uniqueSets: 0,
        totalCirculation: 0,
        averageSerialNumber: 0,
        rarityBreakdown: {},
        teamBreakdown: {},
        playerBreakdown: {},
        acquisitionTimeline: {}
      };
    }
  }

  // Get NFL All Day collection IDs
  async getAllDayCollectionIds(accountAddress) {
    try {
      console.log('🏈 Attempting to get NFL All Day collection IDs...');
      
      // Real script to get AllDay collection IDs from wallet
      const script = `
import AllDay from 0xe4cf4bdc1751c65d
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    let momentIds: [UInt64] = []
    
    // Try common AllDay collection paths using PublicPath constants
    if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/allDayCollection) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/MomentCollection) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/Collection) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/allday) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    } else if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/alldayMoments) {
        let ids = capability.getIDs()
        for id in ids {
            momentIds.append(id)
        }
    }
    
    return momentIds
}`;
      const args = [
        {
          type: 'Address',
          value: accountAddress
        }
      ];

      const result = await this.executeScript(script, args);
      
      console.log('🔍 Raw AllDay result:', JSON.stringify(result, null, 2));
      
      // Parse Flow response format - handle both JSON objects and base64 strings
      let parsedResult = result;
      
      // If result is a string, try to parse it as base64
      if (typeof result === 'string') {
        try {
          const decoded = Buffer.from(result, 'base64').toString('utf-8');
          parsedResult = JSON.parse(decoded);
          console.log('🔍 Decoded AllDay result:', JSON.stringify(parsedResult, null, 2));
        } catch (e) {
          console.log('❌ Failed to decode base64 AllDay result:', e.message);
        }
      }
      
      if (parsedResult.value && Array.isArray(parsedResult.value)) {
        const momentIds = parsedResult.value.map(item => parseInt(item.value));
        console.log('✅ Real NFL All Day moments found:', momentIds.length);
        console.log('✅ Real NFL All Day data found:', momentIds);
        
        return momentIds;
      }
      
      console.log('📊 All Day collection IDs result:', result);
      console.log('❌ No AllDay moment IDs found in response');
      return [];
    } catch (error) {
      console.log('🔍 Error caught in getAllDayCollectionIds:', error.message);
      console.log('❌ NO FALLBACK DATA - Returning empty array for real data only');
      return [];
    }
  }

  // Get linked child accounts (Hybrid Custody)
  async getLinkedChildAccounts(parentAddress) {
    console.log('🔗 Getting linked child accounts for:', parentAddress);
    
    // Try different Hybrid Custody API methods based on Flow documentation
    const scripts = [
      // Method 1: Direct contract call
      `
        import HybridCustody from ${SMART_CONTRACTS.HYBRID_CUSTODY}
        
        access(all) fun main(parentAddress: Address): [Address] {
            return HybridCustody.getLinkedAddresses(parentAddress)
        }`,
      
      // Method 2: Using account capabilities
      `
        import HybridCustody from ${SMART_CONTRACTS.HYBRID_CUSTODY}
        
        access(all) fun main(parentAddress: Address): [Address] {
            let account = getAccount(parentAddress)
            if let manager = account.capabilities.borrow<&HybridCustody.Manager>(/storage/hybridCustodyManager) {
                return manager.getLinkedAddresses()
            }
            return []
        }`,
      
      // Method 3: Using public interface
      `
        import HybridCustody from ${SMART_CONTRACTS.HYBRID_CUSTODY}
        
        access(all) fun main(parentAddress: Address): [Address] {
            let account = getAccount(parentAddress)
            if let manager = account.capabilities.borrow<&{HybridCustody.ManagerPublic}>(/public/hybridCustodyManager) {
                return manager.getLinkedAddresses()
            }
            return []
        }`
    ];
    
    for (let i = 0; i < scripts.length; i++) {
      try {
        console.log(`🔍 Trying Hybrid Custody method ${i + 1}...`);
        const result = await this.executeScript(scripts[i], [
          { type: 'Address', value: parentAddress }
        ]);
        
        if (result.value && result.value.value) {
          const childAddresses = result.value.value.map(item => item.value);
          console.log(`✅ Method ${i + 1} successful! Found linked child accounts:`, childAddresses);
          return childAddresses;
        }
      } catch (error) {
        console.log(`❌ Method ${i + 1} failed:`, error.message);
      }
    }
    
    console.log('❌ No linked child accounts found (all methods failed)');
    return [];
  }

  // Get complete portfolio data
  async getPortfolioData(accountAddress) {
    try {
      console.log('🏀 Getting portfolio data for wallet:', accountAddress);
      
      // Step 1: Test connection
      console.log('🔗 Step 1: Testing Flow connection...');
      const connectionTest = await this.testConnection();
      console.log('✅ Connection test result:', connectionTest);

      // Step 2: Check wallet exists
      console.log('👤 Step 2: Checking wallet exists...');
      const walletCheck = await this.checkWallet(accountAddress);
      console.log('✅ Wallet check result:', walletCheck);

      // Step 3: Check for linked child accounts (Hybrid Custody)
      console.log('🔗 Step 3: Checking for linked child accounts...');
      const linkedChildAccounts = await this.getLinkedChildAccounts(accountAddress);
      console.log('📊 Linked child accounts:', linkedChildAccounts);

      // Step 4: Enumerate public capabilities
      console.log('🔗 Step 4: Enumerating public capabilities...');
      const capabilities = await this.enumerateCapabilities(accountAddress);
      console.log('📊 Public capabilities:', capabilities);

      // Step 5: Get Top Shot collection IDs (direct + linked)
      console.log('🏀 Step 5: Getting Top Shot collection IDs...');
      let topShotIds = await this.getTopShotCollectionIds(accountAddress);
      
      // Also check linked accounts for TopShot moments
      for (const childAddress of linkedChildAccounts) {
        try {
          const childTopShotIds = await this.getTopShotCollectionIds(childAddress);
          if (childTopShotIds && childTopShotIds.length > 0) {
            console.log(`✅ Found ${childTopShotIds.length} TopShot moments in linked account ${childAddress}`);
            topShotIds = [...topShotIds, ...childTopShotIds];
          }
        } catch (error) {
          console.log(`❌ Error checking TopShot in linked account ${childAddress}:`, error.message);
        }
      }
      console.log('📊 Total Top Shot collection IDs:', topShotIds);

      // Step 6: Get All Day collection IDs (direct + linked)
      console.log('🏈 Step 6: Getting All Day collection IDs...');
      let allDayIds = await this.getAllDayCollectionIds(accountAddress);
      
      // Also check linked accounts for AllDay moments
      for (const childAddress of linkedChildAccounts) {
        try {
          const childAllDayIds = await this.getAllDayCollectionIds(childAddress);
          if (childAllDayIds && childAllDayIds.length > 0) {
            console.log(`✅ Found ${childAllDayIds.length} AllDay moments in linked account ${childAddress}`);
            allDayIds = [...allDayIds, ...childAllDayIds];
          }
        } catch (error) {
          console.log(`❌ Error checking AllDay in linked account ${childAddress}:`, error.message);
        }
      }
      console.log('📊 Total All Day collection IDs:', allDayIds);

      // Step 7: Get comprehensive moment data for Top Shot
      console.log('📊 Step 7: Getting comprehensive TopShot moment data...');
      const topShotMoments = [];
      for (const id of topShotIds) {
        try {
          const momentDetails = await this.getTopShotMomentDetails(accountAddress, id);
          if (momentDetails) {
            topShotMoments.push(momentDetails);
          } else {
            // Skip this moment if we can't get real data
            console.log(`⚠️ Skipping TopShot moment ${id} due to error`);
          }
        } catch (error) {
          console.log(`❌ Error getting details for TopShot moment ${id}:`, error.message);
          // Skip this moment if we can't get real data
          console.log(`⚠️ Skipping TopShot moment ${id} due to error`);
        }
      }

      // Step 8: Get comprehensive moment data for All Day
      console.log('📊 Step 8: Getting comprehensive AllDay moment data...');
      const allDayMoments = [];
      for (const id of allDayIds) {
        try {
          const momentDetails = await this.getAllDayMomentDetails(accountAddress, id);
          if (momentDetails) {
            allDayMoments.push(momentDetails);
          } else {
            // Skip this moment if we can't get real data
            console.log(`⚠️ Skipping AllDay moment ${id} due to error`);
          }
        } catch (error) {
          console.log(`❌ Error getting details for AllDay moment ${id}:`, error.message);
          // Skip this moment if we can't get real data
          console.log(`⚠️ Skipping AllDay moment ${id} due to error`);
        }
      }

      // Step 9: Calculate portfolio statistics
      const portfolio = {
        totalMoments: topShotIds.length + allDayIds.length,
        topShotMoments: topShotIds.length,
        allDayMoments: allDayIds.length,
        totalValue: this.calculateTotalValue([...topShotMoments, ...allDayMoments]),
        uniqueSets: this.countUniqueSets([...topShotMoments, ...allDayMoments]),
        linkedAccounts: linkedChildAccounts.length
      };

      const result = {
        portfolio,
        topShotCollection: topShotMoments,
        allDayCollection: allDayMoments,
        capabilities: capabilities,
        linkedChildAccounts: linkedChildAccounts
      };

      // Validate no mock data in production
      if (STRICT_REAL_DATA_ONLY) {
        validateRealData(result, 'portfolio data');
      }

      return result;

    } catch (error) {
      console.error('❌ Portfolio data fetch failed:', error);
      throw error;
    }
  }

  // Parse moment data from Flow response
  parseMomentData(result) {
    if (!result.value) return null;

    try {
      const data = result.value;
      return {
        id: parseInt(data.id?.value || 0),
        name: data.play?.name?.value || 'Unknown Moment',
        set: data.setName?.value || 'Unknown Set',
        rarity: this.determineRarity(data.serialNumber?.value || 0),
        serialNumber: parseInt(data.serialNumber?.value || 0),
        value: this.estimateMomentValue(data)
      };
    } catch (error) {
      console.error('❌ Error parsing moment data:', error);
      return null;
    }
  }

  // Parse enhanced moment data with comprehensive metadata
  parseEnhancedMomentData(result, type) {
    if (!result.value) return null;

    try {
      const data = result.value;
      const baseData = {
        id: parseInt(data.id?.value || 0),
        name: `${type === 'topshot' ? 'NBA Top Shot' : 'NFL All Day'} Moment #${data.id?.value || 0}`,
        player: data.player?.value || 'Unknown Player',
        team: data.team?.value || 'Unknown Team',
        playDescription: data.playDescription?.value || 'Unknown Play',
        gameDate: data.gameDate?.value || 'Unknown Date',
        set: data.setName?.value || 'Unknown Set',
        rarity: data.rarity?.value || this.determineRarity(data.serialNumber?.value || 0),
        serialNumber: parseInt(data.serialNumber?.value || 0),
        circulationCount: parseInt(data.circulationCount?.value || 0),
        mintingDate: data.mintingDate?.value || 'Unknown Date',
        estimatedValue: this.estimateMomentValue(data)
      };

      // Add type-specific data
      if (type === 'topshot') {
        baseData.lastSalePrice = data.lastSalePrice?.value || null;
        baseData.currentListingPrice = data.currentListingPrice?.value || null;
      }

      return baseData;
    } catch (error) {
      console.error('❌ Error parsing enhanced moment data:', error);
      return null;
    }
  }

  // Parse portfolio analytics data
  parsePortfolioAnalytics(result) {
    if (!result.value) return null;

    try {
      const data = result.value;
      return {
        totalMoments: parseInt(data.totalMoments?.value || 0),
        topShotCount: parseInt(data.topShotCount?.value || 0),
        allDayCount: parseInt(data.allDayCount?.value || 0),
        uniqueSets: parseInt(data.uniqueSets?.value || 0),
        totalCirculation: parseInt(data.totalCirculation?.value || 0),
        averageSerialNumber: parseFloat(data.averageSerialNumber?.value || 0),
        rarityBreakdown: data.rarityBreakdown?.value || {},
        teamBreakdown: data.teamBreakdown?.value || {},
        playerBreakdown: data.playerBreakdown?.value || {},
        acquisitionTimeline: data.acquisitionTimeline?.value || {}
      };
    } catch (error) {
      console.error('❌ Error parsing portfolio analytics:', error);
      return null;
    }
  }

  // Determine moment rarity based on serial number
  determineRarity(serialNumber) {
    if (serialNumber <= 10) return 'Legendary';
    if (serialNumber <= 100) return 'Epic';
    if (serialNumber <= 1000) return 'Rare';
    return 'Common';
  }

  // Count unique sets in collection
  countUniqueSets(moments) {
    const sets = new Set(moments.map(moment => moment.set));
    return sets.size;
  }

  // Calculate total portfolio value
  calculateTotalValue(moments) {
    return moments.reduce((total, moment) => total + (moment.value || 0), 0);
  }

  // Estimate moment value based on rarity and other factors
  estimateMomentValue(momentData) {
    const baseValue = 10;
    const rarityMultiplier = {
      'Common': 1,
      'Rare': 2,
      'Epic': 5,
      'Legendary': 10
    };
    
    const rarity = this.determineRarity(momentData.serialNumber?.value || 0);
    return baseValue * (rarityMultiplier[rarity] || 1);
  }
}

module.exports = FlowAPIService; 