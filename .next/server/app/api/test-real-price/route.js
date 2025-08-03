"use strict";(()=>{var e={};e.id=339,e.ids=[339],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},79217:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>c,patchFetch:()=>h,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>u,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{GET:()=>i});var s=a(49303),o=a(88716),n=a(60670),p=a(87070);async function i(){try{let e=await fetch("https://api.nba.dapperlabs.com/marketplace/graphql",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:`
            query GetMoment($momentId: ID!) {
              getMintedMoment(momentId: $momentId) {
                data {
                  id
                  play {
                    stats {
                      playerName
                      teamAtMoment
                    }
                  }
                }
                lowestAsk
              }
            }
          `,variables:{momentId:"208914631"}})}),t=await e.json(),a=await Promise.all(["https://api.nflallday.com/marketplace/graphql","https://nflallday.com/api/graphql","https://api.nfl.dapperlabs.com/marketplace/graphql"].map(async e=>{try{let t=await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:"{ __typename }"})});return{endpoint:e,status:t.status}}catch(t){return{endpoint:e,status:"error"}}}));return p.NextResponse.json({nbaTopShotTest:{worked:!!t?.data,lowestAsk:t?.data?.getMintedMoment?.lowestAsk,player:t?.data?.getMintedMoment?.data?.play?.stats?.playerName},nflAllDayEndpoints:a,suggestion:"NBA Top Shot API works. Need to find NFL All Day's specific endpoint."})}catch(e){return p.NextResponse.json({error:"Test failed",details:e.message},{status:500})}}let l=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/test-real-price/route",pathname:"/api/test-real-price",filename:"route",bundlePath:"app/api/test-real-price/route"},resolvedPagePath:"/Users/pheakmeas/Documents/Development/Personal-Projects/kollects-io/app/api/test-real-price/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:d,staticGenerationAsyncStorage:m,serverHooks:u}=l,c="/api/test-real-price/route";function h(){return(0,n.patchFetch)({serverHooks:u,staticGenerationAsyncStorage:m})}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[948,972],()=>a(79217));module.exports=r})();