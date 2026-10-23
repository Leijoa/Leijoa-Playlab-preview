const DATA={
  "game": "bibi-dice",
  "build": "bibi-dice-c400bcbd5580",
  "rows": {
    "public_review": {
      "routeId": "public_review",
      "status": "ready",
      "notice": "",
      "record": {
        "text": "設計示意：這段修訂文字展示已編輯狀態；星等與推薦也是示意，不列入平台統計。",
        "stars": {
          "playfulness": 4,
          "art": 3,
          "controls": 4,
          "creativity": 3,
          "completeness": 4
        },
        "recommendation": true,
        "saved_at": 1792717200000,
        "rating_schema_version": "review-five/2.1-candidate",
        "edited": true
      },
      "items": [],
      "links": [
        {
          "routeId": "review_history",
          "params": {
            "game_id": "bibi-dice",
            "review_id": "demo-interface-review",
            "tab": "history"
          },
          "href": "/games/bibi-dice/reviews/demo-interface-review?tab=history",
          "label": "已編輯"
        }
      ],
      "retryAvailable": false,
      "fixtureLabel": "設計示意，非真實玩家／作者；示意分數不計入統計",
      "returnTo": {
        "routeId": "game_reviews",
        "params": {
          "game_id": "bibi-dice",
          "build": "bibi-dice-c400bcbd5580"
        },
        "href": "/games/bibi-dice?build=bibi-dice-c400bcbd5580&tab=reviews"
      }
    },
    "review_history": {
      "routeId": "review_history",
      "status": "ready",
      "notice": "",
      "record": {
        "text": "設計示意：這段修訂文字展示已編輯狀態；星等與推薦也是示意，不列入平台統計。",
        "stars": {
          "playfulness": 4,
          "art": 3,
          "controls": 4,
          "creativity": 3,
          "completeness": 4
        },
        "recommendation": true,
        "saved_at": 1792717200000,
        "rating_schema_version": "review-five/2.1-candidate",
        "edited": true
      },
      "items": [
        {
          "text": "設計示意：這段原始文字只展示評測版面，不是真實玩家心得。",
          "saved_at": 1792713600000
        }
      ],
      "links": [],
      "retryAvailable": false,
      "fixtureLabel": "設計示意，非真實玩家／作者；示意分數不計入統計",
      "returnTo": {
        "routeId": "public_review",
        "params": {
          "game_id": "bibi-dice",
          "review_id": "demo-interface-review"
        },
        "href": "/games/bibi-dice/reviews/demo-interface-review"
      }
    },
    "creator_public": {
      "routeId": "creator_public",
      "status": "empty",
      "notice": "尚無公開作品",
      "record": {
        "displayName": "設計示意創作者",
        "bio": "此為介面設計示意，不代表 BIBI DICE 作者；沒有綁定任何作品。"
      },
      "items": [],
      "links": [],
      "retryAvailable": false,
      "fixtureLabel": "設計示意，非真實玩家／作者；示意分數不計入統計",
      "returnTo": {
        "routeId": "explore",
        "params": {},
        "href": "/explore"
      }
    }
  }
};
const clone=x=>structuredClone(x);
const unavailable=()=>({status:'unavailable',notice:'內容目前無法使用',record:null,items:[],links:[],retryAvailable:false,fixtureLabel:'',returnTo:{routeId:'explore',params:{},href:'/explore'}});
export function getPublicDetailDemo(routeId,params={}){
 if(!params||typeof params!=='object'||Array.isArray(params))return unavailable();
 const keys=Object.keys(params);
 if(routeId==='creator_public'&&keys.length===1&&params.creator_id==='demo-interface-creator')return clone(DATA.rows.creator_public);
 if(!['public_review','review_history'].includes(routeId)||params.game_id!==DATA.game||params.review_id!=='demo-interface-review')return unavailable();
 if(routeId==='public_review'&&(keys.length!==2||keys.some(k=>!['game_id','review_id'].includes(k))))return unavailable();
 if(routeId==='review_history'&&(keys.length!==3||params.tab!=='history'||keys.some(k=>!['game_id','review_id','tab'].includes(k))))return unavailable();
 return clone(DATA.rows[routeId]);
}
