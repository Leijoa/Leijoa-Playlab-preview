// Original fictional concepts, fixed local fixtures; never telemetry or player data.
export const FICTION_LABEL='展示用虛構作品';
export const DISCUSSION_LABEL='展示討論 · 模擬帳號 · 非真實玩家';
export const FICTION_GAMES=[
 ['moon-post','月台郵差','敘事冒險','indigo','沿著月光鐵道送信，從旅客的隻字片語拼出小鎮故事。','閱讀信件、選擇對話，想像一段慢步調的旅程。'],
 ['coral-kitchen','珊瑚小食堂','經營模擬','coral','在潮間帶開一間小食堂，安排菜單與海邊客人的座位。','規劃備料順序與座位配置，讓忙碌的一天多一點餘裕。'],
 ['moss-puzzle','苔光拼圖','益智解謎','moss','轉動發光石板，把一束微光送到沉睡的森林深處。','觀察光線方向，逐步排列石板；這裡只展示玩法構想。'],
 ['amber-courier','琥珀快遞','動作跑酷','amber','穿越層層屋頂，把溫熱的包裹送到山城另一端。','想像跳躍與滑行的節奏，在屋頂之間尋找順暢路線。'],
 ['violet-orbit','紫羅蘭軌道','策略防守','violet','為漂浮花園安排守護站，抵擋迷路星塵的衝撞。','以有限的站位組合防線，留出支援與調整的空間。'],
 ['mist-notes','霧港手記','視覺小說','teal','帶著一本空白筆記走進霧港，記下每段未完的對話。','閱讀片段並選擇追問方向，理解不同人物的心情。'],
 ['crimson-rhythm','赤紅節拍','音樂節奏','crimson','跟著城市的光點敲出節奏，把夜色串成一首歌。','以節拍提示構想單鍵與雙鍵段落；本展示不播放音訊。'],
 ['sky-seeds','天空種子','休閒養成','sky','在小小浮島種下種子，搭配風向與日照照顧花草。','觀察植物需求並安排花盆，構想每天短暫回訪的樂趣。']
].map(([game,title,category,palette,summary,instructions])=>Object.freeze({game:'demo-'+game,build:'demo-'+game+'-showcase',title,category,palette,summary,instructions,demo:true,fictional:true,fixture:true,playable:false,label:FICTION_LABEL}));
export const DISCUSSION_GROUPS=[['impressions','遊戲心得'],['bugs','Bug'],['ideas','功能建議'],['creation','創作交流']].map(([id,title])=>({id:'demo-'+id,title,body:'展示討論分類，依編排順序呈現，不代表熱門度。',fixture:true,status:'published',visibility:'public'}));
const rows=[
 ['月台郵差：想把支線的信也讀完','看到送信的設定，就會想慢慢走完每一站。如果每封信都能帶出一點小鎮日常，我應該會捨不得直接跳到結局。',0,0],
 ['珊瑚小食堂的忙碌感，想留一點喘息空間','經營遊戲最吸引我的是把混亂整理好。這個概念若有收店後的小片刻，坐著看海應該很舒服。',0,1],
 ['苔光拼圖：卡關時先換個方向看','光線解謎很適合讓人停下來觀察。我喜歡答案就在眼前、但轉一下思路才懂的感覺，希望提示也保留這種驚喜。',0,2],
 ['屋頂快遞讓我想到一口氣跑到底的爽快感','琥珀快遞的山城構想很有畫面。比起一直追秒數，我更想找到一條能連續跳躍、節奏很順的路線。',0,3],
 ['霧港手記適合配一杯熱茶慢慢讀','很喜歡霧港和筆記的組合。如果人物不急著把心事說完，而是藏在日常對話裡，我會願意多聊幾次。',0,5],
 ['模擬 Bug：窄畫面時菜單文字擠在一起','這是一則展示用問題回報範例：假設小食堂的菜名較長，在窄畫面可能與價格重疊。期待文字能換行，價格仍保持清楚。未實際執行遊戲。',1,1],
 ['模擬 Bug：光線提示可能被石板遮住','假設苔光拼圖的石板疊在光束上，方向就不容易判讀。可以讓提示永遠位於上層，或補一個不只靠顏色的箭頭。這不是實測缺陷。',1,2],
 ['模擬 Bug：重開關卡後音量顯示不同步','以赤紅節拍為例的假想回報：若重開關卡後滑桿與實際音量不一致，會讓人疑惑設定是否保留。這裡只是回報格式展示，沒有播放音訊。',1,6],
 ['模擬 Bug：對話返回時捲動位置跳掉','假設在霧港手記讀到長對話中段，查看人物介紹後返回卻跳到頂端，會不太好接續。希望保留閱讀位置；此項為虛構情境。',1,5],
 ['模擬 Bug：浮島花盆名稱在縮放後截斷','天空種子的假想問題：放大介面後，長名字可能只剩前幾個字。若能換行或提供完整文字，應該會更容易辨識。這不是正式 Bug 紀錄。',1,7],
 ['希望月台郵差能有已讀信件收藏夾','故事讀到後面，常會想回頭找前面的線索。若能依車站整理已讀信件，再附上簡短摘要，就不用一直翻全部紀錄。',2,0],
 ['防守路線能不能先預覽，再決定放站？','紫羅蘭軌道如果能在擺放前看到預計路線，初次接觸的人比較容易理解。預覽不用太複雜，幾個方向箭頭就很有幫助。',2,4],
 ['想要節奏提示有形狀差異','赤紅節拍若只用顏色分辨按鍵，可能不夠直覺。圓形與菱形搭配顏色，應該也能保有乾淨的畫面。',2,6],
 ['天空種子能有不催促人的照顧模式嗎？','想像自己幾天沒開遊戲，回來花草仍然好好的，只是長得慢一些。這樣養成會比較像陪伴，不會變成打卡壓力。',2,7],
 ['跑酷練習想加一個分段重來','琥珀快遞若有較長的路線，可以把難的那段單獨練習嗎？熟悉後再挑戰整段，會讓失誤時更願意繼續嘗試。',2,3],
 ['做小食堂場景時，大家會先畫什麼？','如果要發展珊瑚小食堂的概念，我會先安排出餐口和座位，再決定裝飾。好奇從氛圍開始與從動線開始，最後會有什麼不同。',3,1],
 ['試著用三種形狀表現森林的光','苔光拼圖的概念讓我想挑戰只用圓、方與線條做封面。細節少一點，也許更能把視線留在光線方向上。',3,2],
 ['花園防守的色彩，要如何兼顧美感與辨識？','紫羅蘭軌道可以用柔和背景襯托明亮的守護站。但如果所有效果都發光，重點反而會消失，想先從限制亮色數量試起。',3,4],
 ['短篇對話怎麼寫出角色差異？','以霧港手記為練習題，我想讓每個人物有不同的句子長度和停頓習慣。比起直接介紹個性，從說話方式慢慢認識應該更自然。',3,5],
 ['浮島封面留白多一點，會不會更有呼吸感？','天空種子的構想很適合把島縮小，讓天空占大部分畫面。先用簡單幾何測試構圖，再考慮植物細節，感覺能少走一些彎路。',3,7]
];
export const SHOWCASE_DISCUSSIONS=rows.map(([title,body,group,game],i)=>Object.freeze({id:`demo-chat-${String(i+1).padStart(2,'0')}`,title,body,topic_id:DISCUSSION_GROUPS[group].id,game:FICTION_GAMES[game].game,build:FICTION_GAMES[game].build,publicAuthor:`模擬帳號 · 小島訪客 ${String(i+1).padStart(2,'0')}`,fixture:true,status:'published',visibility:'public'}));
export function getShowcaseDiscussion(routeId,params={}){
 if(routeId==='community'&&Object.keys(params).every(k=>['game','build'].includes(k)))return {items:SHOWCASE_DISCUSSIONS.filter(r=>(!params.game||r.game===params.game)&&(!params.build||r.build===params.build))};
 if(routeId==='topics'&&!Object.keys(params).length)return {items:DISCUSSION_GROUPS};
 if(routeId==='topic'&&Object.keys(params).every(k=>k==='topic_id'))return {record:DISCUSSION_GROUPS.find(r=>r.id===params.topic_id),items:SHOWCASE_DISCUSSIONS.filter(r=>r.topic_id===params.topic_id)};
 if(routeId==='discussion'&&Object.keys(params).every(k=>['discussion_id','reply'].includes(k)))return {record:SHOWCASE_DISCUSSIONS.find(r=>r.id===params.discussion_id),items:[]};
 return {record:null,items:[]};
}
