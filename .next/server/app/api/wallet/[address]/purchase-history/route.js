(()=>{var e={};e.id=754,e.ids=[754],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},14300:e=>{"use strict";e.exports=require("buffer")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},95687:e=>{"use strict";e.exports=require("https")},98188:e=>{"use strict";e.exports=require("module")},41808:e=>{"use strict";e.exports=require("net")},6005:e=>{"use strict";e.exports=require("node:crypto")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},85477:e=>{"use strict";e.exports=require("punycode")},12781:e=>{"use strict";e.exports=require("stream")},24404:e=>{"use strict";e.exports=require("tls")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},71267:e=>{"use strict";e.exports=require("worker_threads")},59796:e=>{"use strict";e.exports=require("zlib")},6607:()=>{},47398:()=>{},58359:()=>{},93739:()=>{},74939:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>g,requestAsyncStorage:()=>h,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>y});var a={};r.r(a),r.d(a,{GET:()=>d});var s=r(49303),o=r(88716),i=r(60670),n=r(87070),c=r(68231);c.vc({"accessNode.api":"https://rest-mainnet.onflow.org","flow.network":"mainnet","discovery.wallet":"https://fcl-discovery.onflow.org/testnet/authn"});let u=`
import AllDay from 0xe4cf4bdc1751c65d
import MetadataViews from 0x1d7e57aa55817448

pub fun main(address: Address, momentID: UInt64): {String: AnyStruct}? {
    let account = getAccount(address)
    
    let collectionRef = account.getCapability(AllDay.CollectionPublicPath)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    if let moment = collectionRef.borrowMomentNFT(id: momentID) {
        let metadata: {String: AnyStruct} = {}
        
        // Get basic info
        metadata["id"] = moment.id
        metadata["editionID"] = moment.editionID
        metadata["serialNumber"] = moment.serialNumber
        metadata["mintingDate"] = moment.mintingDate
        
        // Try to get play metadata
        if let play = moment.play() {
            metadata["playID"] = play.id
            metadata["classification"] = play.classification
            metadata["metadata"] = play.metadata
        }
        
        return metadata
    }
    
    return nil
}
`;async function l(e,t){try{return await c.IO({cadence:u,args:(r,a)=>[r(e,a.Address),r(t,a.UInt64)]})}catch(e){return console.error("Error getting moment metadata:",e),null}}async function p(e){try{let t=await fetch(`https://prod-main-net-dashboard-api.azurewebsites.net/api/accounts/${e}/events?eventTypes=AllDay.Deposit,AllDay.Withdraw,AllDay.MomentMinted,Market.MomentPurchased,DapperUtilityCoin.TokensWithdrawn&limit=1000`,{headers:{Accept:"application/json"}});if(!t.ok)throw Error(`Graffle API error: ${t.status}`);return await t.json()}catch(e){return console.error("Error searching events:",e),null}}async function d(e,{params:t}){try{let{address:r}=t,a=new URL(e.url),s=a.searchParams.get("momentIds")?.split(",")||[],o=[];for(let e of s)try{let t=await l(r,e);t&&o.push({momentId:e,mintingDate:t.mintingDate,serialNumber:t.serialNumber,editionID:t.editionID,source:"blockchain"})}catch(t){console.log(`No blockchain data for moment ${e}`)}try{let e=await p(r);if(e&&e.length>0)for(let t of e)t.type?.includes("Deposit")&&s.includes(t.data?.id)&&o.push({momentId:t.data.id,timestamp:t.timestamp,transactionId:t.transactionId,source:"graffle"})}catch(e){console.log("Graffle API not available")}return o.length,n.NextResponse.json({address:r,purchaseHistory:o,dataSource:o.length>0?o[0].source:"none",message:0===o.length?"No purchase history found. Manual entry or blockchain indexer required.":"Purchase history retrieved"})}catch(e){return console.error("Purchase history API error:",e),n.NextResponse.json({error:"Failed to fetch purchase history",details:e.message},{status:500})}}let m=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/wallet/[address]/purchase-history/route",pathname:"/api/wallet/[address]/purchase-history",filename:"route",bundlePath:"app/api/wallet/[address]/purchase-history/route"},resolvedPagePath:"/Users/pheakmeas/Documents/Development/Personal-Projects/kollects-io/app/api/wallet/[address]/purchase-history/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:h,staticGenerationAsyncStorage:y,serverHooks:f}=m,x="/api/wallet/[address]/purchase-history/route";function g(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:y})}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948,972,231],()=>r(74939));module.exports=a})();