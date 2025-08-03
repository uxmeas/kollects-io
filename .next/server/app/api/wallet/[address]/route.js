(()=>{var e={};e.id=652,e.ids=[652],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},14300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},95687:e=>{"use strict";e.exports=require("https")},98188:e=>{"use strict";e.exports=require("module")},41808:e=>{"use strict";e.exports=require("net")},6005:e=>{"use strict";e.exports=require("node:crypto")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},85477:e=>{"use strict";e.exports=require("punycode")},12781:e=>{"use strict";e.exports=require("stream")},24404:e=>{"use strict";e.exports=require("tls")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},71267:e=>{"use strict";e.exports=require("worker_threads")},59796:e=>{"use strict";e.exports=require("zlib")},6607:()=>{},47398:()=>{},58359:()=>{},93739:()=>{},78207:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>T,patchFetch:()=>k,requestAsyncStorage:()=>I,routeModule:()=>P,serverHooks:()=>v,staticGenerationAsyncStorage:()=>N});var a={};r.r(a),r.d(a,{GET:()=>b});var i=r(49303),s=r(88716),o=r(60670),n=r(87070),l=r(68231);let c={AllDay:"0xe4cf4bdc1751c65d"};l.vc({"accessNode.api":"https://rest-mainnet.onflow.org","flow.network":"mainnet","discovery.wallet":"https://fcl-discovery.onflow.org/api/authn","discovery.authn.endpoint":"https://fcl-discovery.onflow.org/api/authn"});let p=`
import AllDay from ${c.AllDay}

pub fun main(address: Address): [UInt64] {
    let account = getAccount(address)
    
    // Try to borrow the public collection capability
    let collectionRef = account
        .getCapability(/public/AllDayNFTCollection)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
    
    // Return empty array if collection doesn't exist
    if collectionRef == nil {
        return []
    }
    
    // Get all moment IDs
    return collectionRef!.getIDs()
}
`,d=`
import AllDay from ${c.AllDay}

pub fun main(address: Address, momentID: UInt64): AllDay.MomentData? {
    let account = getAccount(address)
    
    let collectionRef = account
        .getCapability(/public/AllDayNFTCollection)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
    
    if collectionRef == nil {
        return nil
    }
    
    // Borrow the moment NFT
    let nft = collectionRef!.borrowMomentNFT(id: momentID)
    if nft == nil {
        return nil
    }
    
    // Get the moment data
    return AllDay.getMomentData(id: nft!.id)
}
`,u=`
import AllDay from ${c.AllDay}

pub fun main(address: Address): Bool {
    let account = getAccount(address)
    
    let collectionRef = account
        .getCapability(/public/AllDayNFTCollection)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
    
    return collectionRef != nil
}
`;async function m(e){try{if(!await l.IO({cadence:u,args:(t,r)=>[t(e,r.Address)]}))return console.log("NFL All Day collection not initialized for address:",e),[];let t=await l.IO({cadence:p,args:(t,r)=>[t(e,r.Address)]});if(!t||0===t.length)return[];let r=[];for(let a of t)try{let t=await l.IO({cadence:d,args:(t,r)=>[t(e,r.Address),t(a,r.UInt64)]});t&&r.push({id:a.toString(),...t})}catch(e){console.error(`Error fetching moment ${a}:`,e)}return r}catch(e){return console.error("Error fetching NFL All Day moments:",e),[]}}async function y(e){try{let t=await fetch(`/api/prices/${e}`);return(await t.json()).price}catch(e){return console.error("Error fetching marketplace price:",e),null}}let h={AllDay:"0xe4cf4bdc1751c65d"};async function f(e,t=h.AllDay){let r=process.env.BITQUERY_API_KEY;if(!r)return console.warn("Bitquery API key not set. Set BITQUERY_API_KEY in .env"),[];let a=`
    query GetNFTTransfers($address: String!, $contract: String!) {
      flow {
        transfers(
          currency: {is: $contract}
          receiver: {is: $address}
          options: {desc: "block.timestamp.time", limit: 1000}
        ) {
          transaction {
            hash
          }
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
            height
          }
          sender {
            address
          }
          receiver {
            address
          }
          tokenId
          amount
          value
        }
      }
    }
  `;try{let i=await fetch("https://graphql.bitquery.io/",{method:"POST",headers:{"Content-Type":"application/json","X-API-KEY":r},body:JSON.stringify({query:a,variables:{address:e,contract:t}})}),s=await i.json();if(s.data?.flow?.transfers)return s.data.flow.transfers.map(e=>({momentId:e.tokenId,purchasePrice:parseFloat(e.value||"0"),purchaseDate:e.block.timestamp.time,seller:e.sender.address,buyer:e.receiver.address,transactionId:e.transaction.hash,source:"bitquery"}))}catch(e){console.error("Bitquery API error:",e)}return[]}l.vc({"accessNode.api":"https://rest-mainnet.onflow.org","flow.network":"mainnet"});class _{constructor(e){this.baseUrl="https://api.flipsidecrypto.com/api/v2",this.apiKey=e}async executeQuery(e){try{let t=await fetch(`${this.baseUrl}/queries`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":this.apiKey},body:JSON.stringify({sql:e,ttl_minutes:60})});if(!t.ok)throw Error(`Flipside API error: ${t.status}`);let{query_id:r}=await t.json(),a=0;for(;a<30;){let e=await fetch(`${this.baseUrl}/queries/${r}/results`,{headers:{"x-api-key":this.apiKey}});if(e.ok)return(await e.json()).rows||[];await new Promise(e=>setTimeout(e,2e3)),a++}throw Error("Query timeout")}catch(e){return console.error("Flipside Crypto error:",e),[]}}async getNFLAllDayTransactions(e){let t=`
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
        AND (buyer = LOWER('${e}') OR seller = LOWER('${e}'))
      ORDER BY block_timestamp DESC
      LIMIT 1000
    `;return this.executeQuery(t)}async getMomentHistory(e){let t=`
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
        AND nft_id = '${e}'
      ORDER BY block_timestamp DESC
    `;return this.executeQuery(t)}async getPackOpenings(e){let t=`
      SELECT 
        block_timestamp,
        tx_hash,
        event_data
      FROM flow.core.fact_events
      WHERE event_contract = '0xe4cf4bdc1751c65d'
        AND event_name = 'PackOpened'
        AND event_data:opener = '${e}'
      ORDER BY block_timestamp DESC
      LIMIT 100
    `;return this.executeQuery(t)}async getPortfolioSummary(e){let t=`
      WITH purchases AS (
        SELECT 
          nft_id,
          MAX(price) as purchase_price,
          MAX(block_timestamp) as purchase_date
        FROM flow.core.ez_nft_sales
        WHERE project_name = 'nfl_allday'
          AND buyer = LOWER('${e}')
        GROUP BY nft_id
      ),
      current_holdings AS (
        SELECT DISTINCT nft_id
        FROM flow.core.ez_nft_transfers
        WHERE project_name = 'nfl_allday'
          AND to_address = LOWER('${e}')
          AND nft_id NOT IN (
            SELECT DISTINCT nft_id
            FROM flow.core.ez_nft_transfers
            WHERE project_name = 'nfl_allday'
              AND from_address = LOWER('${e}')
              AND block_timestamp > (
                SELECT MAX(block_timestamp)
                FROM flow.core.ez_nft_transfers t2
                WHERE t2.project_name = 'nfl_allday'
                  AND t2.to_address = LOWER('${e}')
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
    `;return(await this.executeQuery(t))[0]||{total_moments:0,total_spent:0}}async getMarketTrends(e=30){let t=`
      SELECT 
        DATE_TRUNC('day', block_timestamp) as date,
        COUNT(*) as sales_count,
        SUM(price) as total_volume,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM flow.core.ez_nft_sales
      WHERE project_name = 'nfl_allday'
        AND block_timestamp > CURRENT_DATE - ${e}
      GROUP BY date
      ORDER BY date DESC
    `;return this.executeQuery(t)}}var D=r(82361);class w extends D.EventEmitter{constructor(e){super(),this.reconnectInterval=5e3,this.maxReconnectAttempts=5,this.reconnectAttempts=0,this.endpoint=e}async subscribeToNFLAllDayEvents(e,t){let r={network:"flow-mainnet",filters:[{contractAddress:"0xe4cf4bdc1751c65d",eventTypes:["Deposit","Withdraw","MomentMinted","PackOpened"]},{contractAddress:"0x8ebcbfd516b1da27",eventTypes:["MomentPurchased","MomentListed","MomentWithdrawn"]}].map(t=>({type:"event",contractAddress:t.contractAddress,eventTypes:t.eventTypes,dataFilters:[{field:"to",value:e},{field:"from",value:e},{field:"buyer",value:e},{field:"seller",value:e}]}))};this.connect(r,t)}connect(e,t){try{console.warn("WebSocket not available, using polling fallback"),this.startPolling(e,t)}catch(e){console.error("Connection error:",e),this.emit("error",e)}}handleReconnect(e,t){this.reconnectAttempts<this.maxReconnectAttempts?(this.reconnectAttempts++,console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`),setTimeout(()=>{this.connect(e,t)},this.reconnectInterval)):(console.error("Max reconnection attempts reached"),this.emit("error",Error("Connection failed")))}async startPolling(e,t){console.log("Polling mode activated");let r=setInterval(async()=>{try{let r=await fetch(this.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"flow_getEvents",params:[e.filters[0].contractAddress,e.filters[0].eventTypes[0]],id:1})}),a=await r.json();a.result&&a.result.forEach(e=>{let r=this.parseFlowEvent(e);t(r),this.emit("event",r)})}catch(e){console.error("Polling error:",e)}},1e4);this.on("disconnect",()=>{clearInterval(r)})}parseFlowEvent(e){let{contractAddress:t,eventType:r,data:a,blockHeight:i,blockTimestamp:s,transactionId:o}=e;return"MomentPurchased"===r?{type:"purchase",momentId:a.id||a.nftID,price:this.ducToUSD(a.price),seller:a.seller,buyer:a.buyer,blockHeight:i,blockTimestamp:s,transactionId:o}:"Deposit"===r?{type:"deposit",momentId:a.id,to:a.to,blockHeight:i,blockTimestamp:s,transactionId:o}:"PackOpened"===r?{type:"pack_opened",packId:a.packID,moments:a.momentIDs,opener:a.opener,blockHeight:i,blockTimestamp:s,transactionId:o}:{type:r.toLowerCase(),data:a,blockHeight:i,blockTimestamp:s,transactionId:o}}ducToUSD(e){return("string"==typeof e?parseFloat(e):e)/1e8}disconnect(){this.websocket&&(this.websocket.close(),this.websocket=void 0),this.emit("disconnect")}}class g{constructor(e){e?.flipsideApiKey&&(this.flipside=new _(e.flipsideApiKey)),e?.quicknodeEndpoint&&(this.quicknode=new w(e.quicknodeEndpoint))}async getCollectionWithHistory(e){try{let t=await m(e);if(!t||0===t.length)return[];let r=t.map(e=>{let t={id:e.id,playID:e.play?.id,editionID:e.editionID,serialNumber:e.serialNumber,mintingDate:e.mintingDate,player:{name:e.play?.metadata?.playerName||"Unknown Player",position:e.play?.metadata?.playerPosition,team:e.play?.metadata?.teamName},playType:e.play?.metadata?.playType,description:e.play?.description,series:e.series?.name,imageUrl:`https://media.nflallday.com/editions/${e.editionID}/play_${e.play?.id}_capture_Hero_Black_2880_2880_Animated.mp4`};return{...t,videoUrl:`https://media.nflallday.com/editions/${t.editionID}/play_${t.playID}_capture_Hero_Black_2880_2880_Animated.mp4`}});if(this.flipside){let t=await this.flipside.getNFLAllDayTransactions(e);this.mergeFlipsideData(r,t)}let a=await f(e);return this.mergeBitqueryData(r,a),await this.fetchCurrentPrices(r),this.mergeLocalStorageData(r,e),r}catch(e){throw console.error("Error getting NFL All Day collection:",e),e}}async getMomentTransactionHistory(e){let t=[];if(this.flipside){let r=await this.flipside.getMomentHistory(e);t.push(...r)}return t}async subscribeToEvents(e,t){this.quicknode?await this.quicknode.subscribeToNFLAllDayEvents(e,t):console.warn("QuickNode not configured for real-time events")}mergeFlipsideData(e,t){t.forEach(t=>{let r=e.find(e=>e.id===t.nft_id);r&&"purchase"===t.event_type&&(r.purchasePrice=t.price,r.purchaseDate=t.block_timestamp,r.transactionHistory||(r.transactionHistory=[]),r.transactionHistory.push({type:"purchase",date:t.block_timestamp,price:t.price,from:t.seller,to:t.buyer,transactionId:t.tx_hash}))})}mergeBitqueryData(e,t){t.forEach(t=>{let r=e.find(e=>e.id===t.momentId);r&&!r.purchasePrice&&(r.purchasePrice=t.purchasePrice,r.purchaseDate=t.purchaseDate)})}async fetchCurrentPrices(e){await Promise.all(e.map(async e=>{try{let t=await y(e.id);null!==t&&(e.currentPrice=t)}catch(t){console.error(`Error fetching price for moment ${e.id}:`,t)}}))}mergeLocalStorageData(e,t){}exportToCSV(e){return[["Moment ID","Player","Play","Series","Serial Number","Purchase Date","Purchase Price","Current Price","Profit/Loss","ROI %"],...e.map(e=>{let t=e.purchasePrice||0,r=e.currentPrice||0,a=r-t,i=t>0?(a/t*100).toFixed(2):"0";return[e.id,e.player.name,e.description,e.series,e.serialNumber,e.purchaseDate||"",t.toFixed(2),r.toFixed(2),a.toFixed(2),i]})].map(e=>e.map(e=>`"${e}"`).join(",")).join("\n")}}let A=null;async function E(e){try{let t=await fetch(`/api/prices/${e}`);if(t.ok){let e=await t.json();return{price:e.price||null,source:e.source||"none"}}}catch(e){console.error("Price fetch error:",e)}return{price:null,source:"none"}}async function b(e,{params:t}){let r=new URL(e.url).searchParams.get("userData"),a=r?JSON.parse(r):{};try{var i;let{address:e}=t;if(!e.match(/^0x[a-fA-F0-9]+$/))return n.NextResponse.json({error:"Invalid Flow address format"},{status:400});console.log("Fetching NFL All Day collection for address:",e);let r=(i={bitqueryApiKey:process.env.BITQUERY_API_KEY,flipsideApiKey:process.env.FLIPSIDE_API_KEY,quicknodeEndpoint:process.env.QUICKNODE_ENDPOINT},A||(A=new g(i)),A);try{let t=await r.getCollectionWithHistory(e);if(t&&t.length>0){t.forEach(e=>{let t=a[e.id];t&&!e.purchasePrice&&(e.purchasePrice=t.purchasePrice,e.purchaseDate=t.purchaseDate)});let r=t.reduce((e,t)=>e+(t.purchasePrice||0),0),i=t.reduce((e,t)=>e+(t.currentPrice||0),0);return n.NextResponse.json({address:e,moments:t,totalCount:t.length,detailedCount:t.length,totalPurchasePrice:r,totalMarketValue:i,profitLoss:i-r,timestamp:new Date().toISOString(),dataSource:"flow-blockchain"})}}catch(e){console.error("Service error, falling back to direct blockchain query:",e)}let s=await m(e);if(!s||0===s.length)return n.NextResponse.json({address:e,moments:[],totalCount:0,detailedCount:0,totalPurchasePrice:0,totalMarketValue:0,profitLoss:0,timestamp:new Date().toISOString(),error:"No NFL All Day moments found. Make sure the wallet has NFL All Day collection initialized.",helpText:"If you own NFL All Day moments, try visiting nflallday.com to ensure your collection is properly initialized."});let o=await Promise.all(s.slice(0,20).map(async e=>{let t=a[e.id],r=null,i=null;try{let t=await E(e.id);t.price&&(r=t.price,i=t.source)}catch(t){console.log("Could not fetch price for moment",e.id)}return{id:e.id,playID:e.play?.id||e.playID,editionID:e.editionID,serialNumber:e.serialNumber,mintingDate:e.mintingDate,player:{name:e.play?.metadata?.playerName||"Unknown Player",position:e.play?.metadata?.playerPosition,team:e.play?.metadata?.teamName},playType:e.play?.metadata?.playType,description:e.play?.description,series:e.series?.name,imageUrl:`https://media.nflallday.com/editions/${e.editionID}/play_${e.play?.id}_capture_Hero_Black_2880_2880.png`,videoUrl:`https://media.nflallday.com/editions/${e.editionID}/play_${e.play?.id}_capture_Hero_Black_2880_2880_Animated.mp4`,alldayUrl:`https://nflallday.com/listing/moment/${e.id}`,purchasePrice:t?.purchasePrice||null,marketPrice:r,currentPrice:r,purchaseDate:t?.purchaseDate||null,notes:t?.notes||(i?`Price from ${i}`:null),transactionId:t?.transactionId||null,isUserData:!!t}})),l=s.slice(20).map(e=>({id:e.id,serialNumber:e.serialNumber,player:{name:e.play?.metadata?.playerName||"Unknown Player"}})),c=o.filter(e=>null!==e.purchasePrice).reduce((e,t)=>e+(t.purchasePrice||0),0),p=o.filter(e=>null!==e.purchasePrice).reduce((e,t)=>e+(t.marketPrice||0),0);return n.NextResponse.json({address:e,moments:[...o,...l],totalCount:s.length,detailedCount:o.length,totalPurchasePrice:c,totalMarketValue:p,profitLoss:p-c,timestamp:new Date().toISOString(),dataSource:"flow-direct",note:"Purchase history requires API keys for Flipside or Bitquery. Add manual purchase data via the UI."})}catch(e){return console.error("API Error:",e),n.NextResponse.json({error:"Failed to fetch wallet data",details:e.message},{status:500})}}let P=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/wallet/[address]/route",pathname:"/api/wallet/[address]",filename:"route",bundlePath:"app/api/wallet/[address]/route"},resolvedPagePath:"/Users/pheakmeas/Documents/Development/Personal-Projects/kollects-io/app/api/wallet/[address]/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:I,staticGenerationAsyncStorage:N,serverHooks:v}=P,T="/api/wallet/[address]/route";function k(){return(0,o.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:N})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948,972,231],()=>r(78207));module.exports=a})();