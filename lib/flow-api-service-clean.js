// Flow Blockchain API Service for kollects.io
// Handles communication with the Flow blockchain using QuickNode as primary and public Flow nodes as fallback

const QUICKNODE_FLOW_ENDPOINT = 'https://radial-maximum-snowflake.flow-mainnet.quiknode.pro/54979bcefb63d671f5f5d1be5e5311c967e799c2/v1/scripts';
const PUBLIC_FLOW_ENDPOINT = 'https://rest-mainnet.onflow.org/v1/scripts';

// Smart contract addresses
const SMART_CONTRACTS = {
  NBA_TOP_SHOT: '0x0b2a3299cc857e29',
  NFL_ALL_DAY: '0xe4cf4bdc1751c65d',
  NON_FUNGIBLE_TOKEN: '0x1d7e57aa55817448',
  METADATA_VIEWS: '0x1d7e57aa55817448',
};

// Cadence script templates
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

  // Get TopShot moment IDs for an account by checking the standard TopShot collection path
  getTopShotMoments: `
    import TopShot from 0x0b2a3299cc857e29
    import NonFungibleToken from 0x1d7e57aa55817448
    
    access(all) fun main(account: Address): [UInt64] {
        // Get the account object
        let account = getAccount(account)
        
        // Standard TopShot collection path
        let path = /public/topshotCollection
        
        // Log the account address and path being checked
        log("Checking account:".concat(account.address.toString()))
        log("Checking path:".concat(path.toString()))
        
        // Try with TopShot.MomentCollectionPublic
        if let collectionRef = account.capabilities
            .borrow<&{TopShot.MomentCollectionPublic}>(path) {
            log("Successfully borrowed TopShot.MomentCollectionPublic reference")
            let ids = collectionRef.getIDs()
            log("Found ".concat(ids.length.toString()).concat(" moment IDs"))
            return ids
        } else {
            log("Could not borrow TopShot.MomentCollectionPublic reference")
        }
        
        // Try with NonFungibleToken.CollectionPublic as fallback
        if let collectionRef = account.capabilities
            .borrow<&{NonFungibleToken.CollectionPublic}>(path) {
            log("Successfully borrowed NonFungibleToken.CollectionPublic reference")
            let ids = collectionRef.getIDs()
            log("Found ".concat(ids.length.toString()).concat(" NFT IDs"))
            return ids
        } else {
            log("Could not borrow NonFungibleToken.CollectionPublic reference")
        }
        
        // No moments found
        log("No moments found at the standard path")
        return []
    }`,
    
    // Get TopShot moment details for a specific moment ID
    getTopShotMomentDetails: `
    import TopShot from 0x0b2a3299cc857e29
    import MetadataViews from 0x1d7e57aa55817448
    
    access(all) fun main(account: Address, momentID: UInt64): {String: String}? {
        // Get the account object
        let account = getAccount(account)
        
        // Try to get the TopShot collection reference
        if let collectionCap = account.capabilities
            .borrow<&{TopShot.MomentCollectionPublic}>(/public/topshotCollection) {
            
            // Borrow the moment reference
            if let momentRef = collectionCap.borrowMoment(id: momentID) {
                // Get the display view
                if let display = momentRef.resolveView(Type<MetadataViews.Display>()) {
                    if let displayView = display as? MetadataViews.Display {
                        // Extract the display information
                        var details: {String: String} = {}
                        details["name"] = displayView.name
                        details["description"] = displayView.description
                        
                        // Get the media URL if available
                        if let media = displayView.media.views.first as? MetadataViews.HTTPFile {
                            details["media"] = media.url
                        }
                        
                        return details
                    }
                }
            }
        }
        
        return nil
    }`,
    
  // Get details for a specific TopShot moment
  getTopShotMomentDetails: `
    import TopShot from 0x0b2a3299cc857e29
    import MetadataViews from 0x1d7e57aa55817448
    import NonFungibleToken from 0x1d7e57aa55817448
    
    access(all) fun main(account: Address, momentId: UInt64): {String: AnyStruct}? {
        // Get the account object for the target address
        let account = getAccount(account)
        
        // Try to get the TopShot collection using the public path
        if let collectionRef = account.capabilities.borrow<&{TopShot.MomentCollectionPublic}>(/public/topshotCollection) {
            if let moment = collectionRef.borrowMoment(id: momentId) {
                return getMomentDetails(moment)
            }
        }
        
        // Try alternative common paths if the first one fails
        if let collectionRef = account.capabilities.borrow<&{TopShot.MomentCollectionPublic}>(/public/MomentCollection) {
            if let moment = collectionRef.borrowMoment(id: momentId) {
                return getMomentDetails(moment)
            }
        }
        
        // Try the standard NonFungibleToken collection path
        if let collectionRef = account.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/Collection) {
            if let moment = collectionRef.borrowMoment(id: momentId) {
                return getMomentDetails(moment)
            }
        }
        
        // No moment found with the given ID
        return nil
    }
    
    // Helper function to extract moment details
    access(all) fun getMomentDetails(moment: &{NonFungibleToken.NFT}): {String: AnyStruct} {
        var result: {String: AnyStruct} = {}
        
        // Get basic moment data
        result["id"] = moment.id
        
        // Try to get TopShot specific data if available
        if let topshotMoment = moment as? &TopShot.NFT {
            result["playId"] = topshotMoment.data.playID
            result["setId"] = topshotMoment.data.setID
            result["serialNumber"] = topshotMoment.data.serialNumber
            
            // Try to get metadata if available
            if let metadata = topshotMoment.resolveView(Type<MetadataViews.NFTMetadata>()) {
                result["metadata"] = metadata
            }
        }
        
        return result
    }`
};

class FlowAPIService {
  constructor() {
    this.baseUrl = QUICKNODE_FLOW_ENDPOINT;
  }

  /**
   * Get the Cadence type for a value
   * @param {*} value - The value to get the type for
   * @returns {string} - The Cadence type
   */
  getCadenceType(value) {
    if (typeof value === 'string' && value.startsWith('0x')) {
      return 'Address';
    } else if (typeof value === 'string') {
      return 'String';
    } else if (typeof value === 'number') {
      return Number.isInteger(value) ? 'UInt64' : 'UFix64';
    } else if (typeof value === 'boolean') {
      return 'Bool';
    } else if (Array.isArray(value)) {
      return 'Array';
    } else if (value && typeof value === 'object') {
      return 'Dictionary';
    }
    return 'String';
  }

  /**
   * Encode an argument for the Flow API
   * @param {*} value - The value to encode
   * @returns {string} - Base64 encoded argument
   */
  encodeArg(value) {
    // For addresses, we need to handle them specially - they should be passed as-is
    if (typeof value === 'string' && value.startsWith('0x')) {
      // For addresses, we just return the string as-is (no base64 encoding)
      return value;
    }
    
    // For other types, we'll use the standard JSON encoding
    let encodedValue;
    
    if (typeof value === 'string') {
      // String type - keep as is
      encodedValue = value;
    } else if (typeof value === 'number') {
      // Number type (convert to string)
      encodedValue = value.toString();
    } else if (typeof value === 'boolean') {
      // Boolean type (convert to string)
      encodedValue = value.toString();
    } else if (Array.isArray(value)) {
      // Array type (recursively encode each item)
      return value.map(item => this.encodeArg(item));
    } else if (value && typeof value === 'object') {
      // Object type (convert to key-value pairs)
      const obj = {};
      for (const [key, val] of Object.entries(value)) {
        obj[key] = this.encodeArg(val);
      }
      return obj;
    } else {
      // Default to string representation
      encodedValue = String(value);
    }
    
    // For non-address values, we'll base64 encode the JSON string
    return Buffer.from(JSON.stringify(encodedValue)).toString('base64');
  }

  /**
   * Encode a value for Flow API
   * @param {*} value - The value to encode
   * @returns {Object} - The encoded value with type and value properties
   */
  encodeValue(value) {
    // Handle Flow Address type (hex string with 0x prefix)
    if (typeof value === 'string' && value.startsWith('0x')) {
      return {
        type: 'Address',
        value: value
      };
    } 
    // Handle string values
    else if (typeof value === 'string') {
      return {
        type: 'String',
        value: value
      };
    } 
    // Handle numbers
    else if (typeof value === 'number') {
      // Check if it's an integer
      if (Number.isInteger(value)) {
        return {
          type: 'UInt64',
          value: value.toString()
        };
      }
      // Handle floating point numbers
      return {
        type: 'UFix64',
        value: value.toString()
      };
    } 
    // Handle booleans
    else if (typeof value === 'boolean') {
      return {
        type: 'Bool',
        value: value.toString()
      };
    } 
    // Handle arrays
    else if (Array.isArray(value)) {
      // For empty arrays, we need to specify the type
      if (value.length === 0) {
        return {
          type: 'Array',
          value: []
        };
      }
      // For non-empty arrays, encode each item
      return {
        type: 'Array',
        value: value.map(item => this.encodeValue(item).value)
      };
    } 
    // Handle objects/dictionaries
    else if (value && typeof value === 'object') {
      // If it's already a properly formatted argument, return as is
      if (value.type && value.value !== undefined) {
        return value;
      }
      // Otherwise encode as a dictionary
      const dict = {};
      for (const [key, val] of Object.entries(value)) {
        dict[key] = this.encodeValue(val).value; // Only store the value, not the type
      }
      return {
        type: 'Dictionary',
        value: dict
      };
    }
    
    // For any other type, return as is and let the API handle it
    return {
      type: 'String',
      value: String(value)
    };
  }

  /**
   * Execute a Cadence script on the Flow blockchain
   * @param {string} script - The Cadence script to execute
   * @param {Array} args - Array of arguments to pass to the script
   * @returns {Promise<Object>} - The result of the script execution
   */
  async executeScript(script, args = []) {
    // Encode the script as base64
    const scriptBase64 = Buffer.from(script).toString('base64');
    
    // Prepare the arguments in the format expected by the Flow API
    const flowArgs = args.map(arg => {
      // Special handling for Address type
      if (typeof arg === 'string' && arg.startsWith('0x')) {
        return {
          type: 'Address',
          value: arg
        };
      }
      // For numbers, convert to string
      else if (typeof arg === 'number') {
        return {
          type: 'UInt64',
          value: arg.toString()
        };
      }
      // For booleans, convert to string
      else if (typeof arg === 'boolean') {
        return {
          type: 'Bool',
          value: arg.toString()
        };
      }
      // For strings, use as is
      else if (typeof arg === 'string') {
        return {
          type: 'String',
          value: arg
        };
      }
      // For arrays, recursively process each element
      else if (Array.isArray(arg)) {
        return {
          type: 'Array',
          value: arg.map(item => this.encodeArg(item))
        };
      }
      // For objects, convert to key-value pairs
      else if (arg && typeof arg === 'object') {
        const obj = {};
        for (const [key, val] of Object.entries(arg)) {
          obj[key] = this.encodeArg(val);
        }
        return {
          type: 'Dictionary',
          value: obj
        };
      }
      // Default to string representation
      return {
        type: 'String',
        value: String(arg)
      };
    });
    
    // Log the request for debugging
    console.log('Script arguments:', JSON.stringify(flowArgs, null, 2));
    
    // Try QuickNode endpoint first
    console.log('🔍 Executing Flow script...');
    console.log('🔗 Trying QuickNode endpoint...');
    
    try {
      const quicknodeResponse = await fetch(QUICKNODE_FLOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptBase64,
          arguments: flowArgs.map(arg => ({
            type: arg.type,
            value: arg.value
          }))
        })
      });

      if (quicknodeResponse.ok) {
        const data = await quicknodeResponse.json();
        console.log('✅ Flow script executed successfully via QuickNode');
        console.log('QuickNode response:', JSON.stringify(data, null, 2));
        return data;
      }
      
      // If QuickNode fails, log the error and try public endpoint
      const quicknodeError = await quicknodeResponse.text().catch(() => 'No error details');
      console.log(`⚠️ QuickNode returned status ${quicknodeResponse.status}, trying public endpoint...`);
      console.log('QuickNode error details:', quicknodeError);
    } catch (quickNodeError) {
      console.warn('⚠️ QuickNode request failed, trying public endpoint...', quickNodeError.message);
    }

    // Fall back to public endpoint
    console.log('🔄 Trying public Flow endpoint...');
    try {
      const publicResponse = await fetch(PUBLIC_FLOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptBase64,
          arguments: flowArgs.map(arg => ({
            type: arg.type,
            value: arg.value
          }))
        })
      });

      if (!publicResponse.ok) {
        const errorText = await publicResponse.text().catch(() => 'No error details');
        console.error(' Public Flow API error:', publicResponse.status, '-', errorText);
        
        // Try to parse as JSON, but fall back to text if not valid JSON
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch (e) {
          errorDetails = errorText;
        }
        
        // Log the full response for debugging
        console.log('Full public API response:', {
          status: publicResponse.status,
          statusText: publicResponse.statusText,
          headers: Object.fromEntries(publicResponse.headers.entries()),
          body: errorDetails
        });
        
        throw new Error(`Public Flow API error: ${publicResponse.status} - ${JSON.stringify(errorDetails)}`);
      }
      
      const result = await publicResponse.json();
      console.log(' Flow script executed successfully via public endpoint');
      console.log('Public endpoint response:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (publicError) {
      console.error(' Error with public Flow endpoint:', publicError.message);
      if (publicError.response) {
        console.error('Response error details:', {
          status: publicError.response.status,
          statusText: publicError.response.statusText,
          headers: publicError.response.headers,
          data: publicError.response.data
        });
      }
      throw publicError;
    }
  }

  /**
   * Get TopShot moments for an account
   * @param {string} accountAddress - The Flow account address
   * @returns {Promise<Array>} - Array of TopShot moment IDs
   */
  async getTopShotMoments(accountAddress) {
    try {
      console.log(`🔍 Fetching TopShot moments for account: ${accountAddress}`);
      const script = CADENCE_SCRIPTS.getTopShotMoments;
      const result = await this.executeScript(script, [accountAddress]);
      
      if (result && result.value) {
        console.log(`✅ Found ${result.value.length} TopShot moments`);
        return result.value;
      }
      
      console.log('ℹ️ No TopShot moments found for this account');
      return [];
    } catch (error) {
      console.error('❌ Error fetching TopShot moments:', error.message);
      throw error;
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
      console.log(`🔍 Fetching details for TopShot moment ${momentId}`);
      const script = CADENCE_SCRIPTS.getTopShotMomentDetails;
      const result = await this.executeScript(script, [accountAddress, momentId]);
      
      if (result && result.value) {
        console.log('✅ Found TopShot moment details');
        return result.value;
      }
      
      console.log('ℹ️ No details found for this TopShot moment');
      return null;
    } catch (error) {
      console.error('❌ Error fetching TopShot moment details:', error.message);
      throw error;
    }
  }
}

module.exports = new FlowAPIService();
