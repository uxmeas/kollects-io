// Flow Blockchain API Service for kollects.io
// Uses the official @onflow/fcl library for Flow blockchain interactions

const fcl = require('@onflow/fcl');
const t = require('@onflow/types');

// Configure FCL to use the mainnet access node
fcl.config()
  .put('accessNode.api', 'https://rest-mainnet.onflow.org') // Public Flow mainnet access node
  .put('app.detail.title', 'Kollects.io');

// Cadence scripts
const CADENCE_SCRIPTS = {
  // Get TopShot moments for an account
  getTopShotMoments: `
    import TopShot from 0x0b2a3299cc857e29
    import NonFungibleToken from 0x1d7e57aa55817448
    
    access(all) fun main(account: Address): [UInt64] {
        // Get the account's public account object
        let account = getAuthAccount(account)
        
        // Standard TopShot collection path
        let path = /public/topshotCollection
        
        // Try to get the public capability
        if let capability = account.capabilities.get<&{TopShot.MomentCollectionPublic}>(path) {
            if let collectionRef = capability.borrow() {
                return collectionRef.getIDs()
            }
        }
        
        // Try with NonFungibleToken.CollectionPublic as fallback
        if let capability = account.capabilities.get<&{NonFungibleToken.CollectionPublic}>(path) {
            if let collectionRef = capability.borrow() {
                return collectionRef.getIDs()
            }
        }
        
        // No moments found
        return []
    }`,
    
  // Get TopShot moment details for a specific moment ID
  getTopShotMomentDetails: `
    import TopShot from 0x0b2a3299cc857e29
    import MetadataViews from 0x1d7e57aa55817448
    
    access(all) fun main(account: Address, momentID: UInt64): {String: String}? {
        // Get the account's public account object
        let account = getAuthAccount(account)
        
        // Try to get the TopShot collection reference
        if let capability = account.capabilities.get<&{TopShot.MomentCollectionPublic}>(/public/topshotCollection) {
            if let collectionRef = capability.borrow() {
                // Borrow the moment reference
                if let momentRef = collectionRef.borrowMoment(id: momentID) {
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
        }
        
        // No details found
        return nil
    }`
};

class FlowAPIServiceFCL {
  /**
   * Execute a Cadence script on the Flow blockchain
   * @param {string} script - The Cadence script to execute
   * @param {Array} args - Array of arguments to pass to the script
   * @returns {Promise<Object>} - The result of the script execution
   */
  async executeScript(script, args = []) {
    try {
      console.log('Executing Flow script with FCL...');
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => args
      });
      
      console.log('✅ Flow script executed successfully via FCL');
      return result;
    } catch (error) {
      console.error('❌ Error executing Flow script with FCL:', error);
      throw error;
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
      const result = await this.executeScript(
        CADENCE_SCRIPTS.getTopShotMoments,
        [fcl.arg(accountAddress, t.Address)]
      );
      
      if (result && Array.isArray(result)) {
        console.log(`✅ Found ${result.length} TopShot moments`);
        return result;
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
      const result = await this.executeScript(
        CADENCE_SCRIPTS.getTopShotMomentDetails,
        [
          fcl.arg(accountAddress, t.Address),
          fcl.arg(momentId.toString(), t.UInt64)
        ]
      );
      
      if (result) {
        console.log('✅ Successfully retrieved moment details');
        return result;
      }
      
      console.log('ℹ️ No details found for this moment');
      return null;
    } catch (error) {
      console.error('❌ Error fetching moment details:', error.message);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new FlowAPIServiceFCL();
