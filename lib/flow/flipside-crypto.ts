// Flipside Crypto Integration
// Provides indexed Flow blockchain data including NFL All Day transactions

export class FlipsideCrypto {
  private apiKey: string;
  private baseUrl = 'https://api.flipsidecrypto.com/api/v2';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // Execute a SQL query on Flipside's Flow data
  async executeQuery(sql: string): Promise<any[]> {
    try {
      // Create query
      const createResponse = await fetch(`${this.baseUrl}/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          sql,
          ttl_minutes: 60,
        }),
      });
      
      if (!createResponse.ok) {
        throw new Error(`Flipside API error: ${createResponse.status}`);
      }
      
      const { query_id } = await createResponse.json();
      
      // Poll for results
      let attempts = 0;
      while (attempts < 30) {
        const resultResponse = await fetch(
          `${this.baseUrl}/queries/${query_id}/results`,
          {
            headers: {
              'x-api-key': this.apiKey,
            },
          }
        );
        
        if (resultResponse.ok) {
          const data = await resultResponse.json();
          return data.rows || [];
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
      
      throw new Error('Query timeout');
    } catch (error) {
      console.error('Flipside Crypto error:', error);
      return [];
    }
  }
  
  // Get NFL All Day transactions for a wallet
  async getNFLAllDayTransactions(walletAddress: string): Promise<any[]> {
    const sql = `
      SELECT 
        block_timestamp,
        tx_hash,
        event_contract,
        event_name,
        nft_id,
        seller,
        buyer,
        price,
        currency
      FROM flow.core.ez_nft_sales
      WHERE project_name = 'nfl_allday'
        AND (buyer = LOWER('${walletAddress}') OR seller = LOWER('${walletAddress}'))
      ORDER BY block_timestamp DESC
      LIMIT 1000
    `;
    
    return this.executeQuery(sql);
  }
  
  // Get moment transaction history
  async getMomentHistory(momentId: string): Promise<any[]> {
    const sql = `
      SELECT 
        block_timestamp,
        tx_hash,
        event_name,
        seller,
        buyer,
        price,
        currency
      FROM flow.core.ez_nft_sales
      WHERE project_name = 'nfl_allday'
        AND nft_id = '${momentId}'
      ORDER BY block_timestamp DESC
    `;
    
    return this.executeQuery(sql);
  }
  
  // Get pack opening events
  async getPackOpenings(walletAddress: string): Promise<any[]> {
    const sql = `
      SELECT 
        block_timestamp,
        tx_hash,
        event_data
      FROM flow.core.fact_events
      WHERE event_contract = '0xe4cf4bdc1751c65d'
        AND event_name = 'PackOpened'
        AND event_data:opener = '${walletAddress}'
      ORDER BY block_timestamp DESC
      LIMIT 100
    `;
    
    return this.executeQuery(sql);
  }
  
  // Get wallet portfolio summary
  async getPortfolioSummary(walletAddress: string): Promise<any> {
    const sql = `
      WITH purchases AS (
        SELECT 
          nft_id,
          MAX(price) as purchase_price,
          MAX(block_timestamp) as purchase_date
        FROM flow.core.ez_nft_sales
        WHERE project_name = 'nfl_allday'
          AND buyer = LOWER('${walletAddress}')
        GROUP BY nft_id
      ),
      current_holdings AS (
        SELECT DISTINCT nft_id
        FROM flow.core.ez_nft_transfers
        WHERE project_name = 'nfl_allday'
          AND to_address = LOWER('${walletAddress}')
          AND nft_id NOT IN (
            SELECT DISTINCT nft_id
            FROM flow.core.ez_nft_transfers
            WHERE project_name = 'nfl_allday'
              AND from_address = LOWER('${walletAddress}')
              AND block_timestamp > (
                SELECT MAX(block_timestamp)
                FROM flow.core.ez_nft_transfers t2
                WHERE t2.project_name = 'nfl_allday'
                  AND t2.to_address = LOWER('${walletAddress}')
                  AND t2.nft_id = flow.core.ez_nft_transfers.nft_id
              )
          )
      )
      SELECT 
        COUNT(DISTINCT ch.nft_id) as total_moments,
        COALESCE(SUM(p.purchase_price), 0) as total_spent,
        COUNT(DISTINCT p.nft_id) as moments_with_purchase_data
      FROM current_holdings ch
      LEFT JOIN purchases p ON ch.nft_id = p.nft_id
    `;
    
    const results = await this.executeQuery(sql);
    return results[0] || { total_moments: 0, total_spent: 0 };
  }
  
  // Get market trends
  async getMarketTrends(days: number = 30): Promise<any[]> {
    const sql = `
      SELECT 
        DATE_TRUNC('day', block_timestamp) as date,
        COUNT(*) as sales_count,
        SUM(price) as total_volume,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM flow.core.ez_nft_sales
      WHERE project_name = 'nfl_allday'
        AND block_timestamp > CURRENT_DATE - ${days}
      GROUP BY date
      ORDER BY date DESC
    `;
    
    return this.executeQuery(sql);
  }
}

// Example usage:
// const flipside = new FlipsideCrypto(process.env.FLIPSIDE_API_KEY);
// const transactions = await flipside.getNFLAllDayTransactions('0x123...');

export default FlipsideCrypto;