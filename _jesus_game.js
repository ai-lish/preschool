(function(){
var AUDIO_BASE='/preschool/audio/jesus';
var T={
  zhHK:{welcome:'歡迎來到耶穌降生故事遊戲！跟住7日行程，聽故事、玩互動遊戲。',summaryTitle:'故事完成！',tips:['2-3歲幼兒正在建立信任感，天使報信的故事有助理解上帝的關懷。','懷孕及胎動是幼兒感興趣的話題，可借此機會教導尊重生命。','夢境對幼兒來說是神秘且正常的，這故事有助他們理解內心的平安。','動物及交通工具是幼兒熟悉的元素，有助故事代入感。','新生嬰兒的照顧是幼兒感興趣的主題，可借此機會教導感恩。','聆聽故事並作出回應有助語言發展和專注力培養。','星星及禮物是幼兒感興趣的視覺元素，有助記憶力提升。'],d3Dream:'唔使擔心，馬利亞既BB係從聖靈嚟嘅！'},
  zhCN:{welcome:'歡迎來到耶穌降生故事遊戲！跟隨7日行程，聽故事、玩互動遊戲。',summaryTitle:'故事完成！',tips:['2-3歲幼兒正在建立信任感，天使報信的故事有助理解上帝的關懷。','懷孕及胎動是幼兒感興趣的話題，可借此機會教導尊重生命。','夢境對幼兒來說是神秘且正常的，這故事有助他們理解內心的平安。','動物及交通工具是幼兒熟悉的元素，有助故事代入感。','新生嬰兒的照顧是幼兒感興趣的主題，可借此機會教導感恩。','聆聽故事並作出回應有助語言發展和專注力培養。','星星及禮物是幼兒感興趣的視覺元素，有助記憶力提升。'],d3Dream:'不用擔心，馬利亞的BB是從聖靈來的！'},
  en:{welcome:"Welcome to the Jesus Birth story game! Follow the 7-day journey, listen and play!",summaryTitle:'Story Complete!',tips:["2-3 year olds are building trust; the angel message helps them understand God's care.","Pregnancy and baby movements are topics of interest; use this to teach respect for life.","Dreams are mysterious but normal; this story helps children understand inner peace.","Animals and vehicles are familiar elements that help story engagement.","Baby care is a topic of interest; use this to teach gratitude.","Listening and responding helps language development and concentration.","Stars and gifts are visual elements that help memory retention."],d3Dream:"Do not be afraid! The baby in Mary is from the Holy Spirit!"},
  ja:{welcome:'イエスの降誕物語ゲームへようこそ！7日間の旅について聞いて、あそぼう！',summaryTitle:'物語完了！',tips:['2-3歳児は信頼感を構築中。天使の知らせは神様の配慮を理解するのに役立ちます。','妊娠や胎動は幼児にとって興味深いトピックです。','夢は神秘的で正常です。この物語は心の平安を理解するのに役立ちます。','動物や乗り物は幼児にとって馴染み深い要素です。','新生児のお世話は幼児にとって興味深いトピックです。','物語を聞いて反応することは言語発達と集中力の育成に役立ちます。','星やプレゼントは視覚要素として記憶力向上に役立ちます。'],d3Dream:'大丈夫！マリアの赤ちゃんは聖霊からのものなのです！'}
};
var currentAudio=null;
function ap(lang,key){return AUDIO_BASE+'/'+lang+'/'+key+'.mp3';}
function pk(lang,key){if(currentAudio){currentAudio.pause();currentAudio=null;}var a=new Audio(ap(lang,key));a.play().catch(function(){});currentAudio=a;return a;}
var lang=localStorage.getItem('jesus-lang')||'zhHK';
var day=0;var dayDone=[false,false,false,false,false,false,false];
var LL={zhHK:'粵',zhCN:'普',en:'EN',ja:'日'};
function ss(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});document.getElementById('screen-'+id).classList.add('active');}
function setProgress(n){document.getElementById('progress-fill').style.width=Math.round((n/7)*100)+'%';}
function flash(text){var el=document.createElement('div');el.className='feedback-flash';el.textContent=text;document.body.appendChild(el);setTimeout(function(){el.remove();},1600);}
function setTip(d){var arr=T[lang].tips;var el=document.getElementById('d'+d+'-tip');if(el)el.textContent=arr[(d-1)%7];var pt=document.getElementById('d'+d+'-tip-wrap');if(pt)pt.classList.add('show');}
function goNext(d){if(currentAudio){currentAudio.pause();currentAudio=null;}if(d<7){day=d+1;setProgress(day);ss('d'+day);setTip(day);pk(lang,'j'+day+'Narr');initDay(day);}else{document.getElementById('summary-title').textContent=T[lang].summaryTitle||'故事完成！';document.getElementById('summary-text').textContent='';setProgress(7);ss('summary');pk(lang,'summary');}}
function initDay(d){if(d===1)initDay1();else if(d===2)initDay2();else if(d===3)initDay3();else if(d===4)initDay4();else if(d===5)initDay5();else if(d===6)initDay6();else if(d===7)initDay7();}
document.getElementById('btn-home').addEventListener('click',function(){if(currentAudio){currentAudio.pause();currentAudio=null;}ss('welcome');day=0;setProgress(0);});
document.getElementById('btn-lang').addEventListener('click',function(){document.getElementById('lang-menu').classList.toggle('show');});
document.getElementById('lang-menu').addEventListener('click',function(e){var btn=e.target.closest('.lang-btn');if(!btn)return;lang=btn.dataset.lang;localStorage.setItem('jesus-lang',lang);document.getElementById('lang-menu').classList.remove('show');document.getElementById('btn-lang').textContent='🌐 '+(LL[lang]||lang);document.querySelectorAll('.lang-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');document.getElementById('welcome-narr').textContent=T[lang].welcome;});
document.getElementById('btn-lang').textContent='🌐 '+(LL[lang]||lang);var ib=document.querySelector('.lang-btn[data-lang="'+lang+'"]');if(ib)ib.classList.add('active');
document.getElementById('btn-start').addEventListener('click',function(){day=1;setProgress(1);ss('d'+day);setTip(day);pk(lang,'j'+day+'Narr');initDay(day);});
document.getElementById('success-continue').addEventListener('click',function(){document.getElementById('success-overlay').classList.remove('show');});
// D1
var d1Clicks=0;function initDay1(){d1Clicks=0;var a=document.getElementById('d1-angel');if(a)a.classList.remove('fly');var c=document.getElementById('d1-counter');if(c)c.textContent='0 / 3';}
document.getElementById('d1-scene').addEventListener('click',function(e){var a=document.getElementById('d1-angel');if(!a||e.target.closest('.action-btn')||e.target.closest('#d1-tip-wrap'))return;d1Clicks++;document.getElementById('d1-counter').textContent=d1Clicks+' / 3';if(d1Clicks<3){pk(lang,'j1Hint');}else{a.classList.add('fly');setTimeout(function(){dayDone[0]=true;},1200);}});
document.getElementById('d1-btn-hint').addEventListener('click',function(){pk(lang,'j1Hint');});
document.getElementById('d1-btn-next').addEventListener('click',function(){if(!dayDone[0]){pk(lang,'j1Fail');flash('👼');return;}goNext(1);});
// D2
var d2Done=false;function initDay2(){d2Done=false;var m=document.getElementById('d2-mary'),e=document.getElementById('d2-elizabeth');if(m)m.classList.remove('walk','arrive');if(e)e.classList.remove('show');}
document.getElementById('d2-mary').addEventListener('click',function(){var m=document.getElementById('d2-mary'),e=document.getElementById('d2-elizabeth');if(!d2Done){m.classList.add('walk');setTimeout(function(){d2Done=true;m.classList.add('arrive');e.classList.add('show');dayDone[1]=true;},1600);}});
document.getElementById('d2-btn-hint').addEventListener('click',function(){pk(lang,'j2Hint');});
document.getElementById('d2-btn-next').addEventListener('click',function(){if(!d2Done){pk(lang,'j2Fail');return;}goNext(2);});
// D3
var d3Done=false;function initDay3(){d3Done=false;var d=document.getElementById('d3-dream');if(d)d.classList.remove('show');var dt=document.getElementById('d3-dream-text');if(dt)dt.textContent=T[lang].d3Dream||T.zhHK.d3Dream;}
document.getElementById('d3-bed').addEventListener('click',function(){if(d3Done)return;d3Done=true;document.getElementById('d3-dream').classList.add('show');dayDone[2]=true;});
document.getElementById('d3-btn-hint').addEventListener('click',function(){pk(lang,'j3Hint');});
document.getElementById('d3-btn-next').addEventListener('click',function(){if(!d3Done){pk(lang,'j3Fail');return;}goNext(3);});
// D4
var d4Done=false;function initDay4(){d4Done=false;var d=document.getElementById('d4-donkey');if(d)d.style.left='6%';document.getElementById('d4-progress-fill').style.width='0%';}
(function(){var scene=document.getElementById('d4-scene');if(!scene)return;var dragging=false;function getPct(cx){var r=scene.getBoundingClientRect();return Math.max(0,Math.min(1,(cx-r.left)/r.width));}function onMove(cx){var pct=getPct(cx);var left=6+pct*76;var d=document.getElementById('d4-donkey');if(d)d.style.left=Math.min(82,Math.max(6,left))+'%';var f=Math.max(0,(left-6)/76*100);document.getElementById('d4-progress-fill').style.width=f+'%';if(f>85&&!d4Done)d4Done=true;}scene.addEventListener('touchstart',function(e){dragging=true;},{passive:true});scene.addEventListener('touchmove',function(e){if(dragging)onMove(e.touches[0].clientX);},{passive:true});scene.addEventListener('touchend',function(){dragging=false;},{passive:true});scene.addEventListener('mousedown',function(){dragging=true;});scene.addEventListener('mousemove',function(e){if(dragging)onMove(e.clientX);});scene.addEventListener('mouseup',function(){dragging=false;});})();
document.getElementById('d4-btn-hint').addEventListener('click',function(){pk(lang,'j4Hint');});
document.getElementById('d4-btn-next').addEventListener('click',function(){if(!d4Done){pk(lang,'j4Fail');flash('🫏');return;}goNext(4);});
// D5
var d5Done=false;function initDay5(){d5Done=false;var s=document.getElementById('d5-star'),j=document.getElementById('d5-jesus'),g=document.getElementById('d5-glow');if(s){s.classList.remove('done');s.style.top='4%';}if(j)j.classList.remove('show');if(g)g.classList.remove('show');}
document.getElementById('d5-star').addEventListener('click',function(){if(d5Done)return;d5Done=true;var s=document.getElementById('d5-star'),j=document.getElementById('d5-jesus'),g=document.getElementById('d5-glow');s.classList.add('done');s.style.top='18%';setTimeout(function(){if(g)g.classList.add('show');},400);setTimeout(function(){if(j)j.classList.add('show');dayDone[4]=true;},800);});
document.getElementById('d5-btn-hint').addEventListener('click',function(){pk(lang,'j5Hint');});
document.getElementById('d5-btn-next').addEventListener('click',function(){if(!d5Done){pk(lang,'j5Fail');flash('⭐');return;}goNext(5);});
// D6
var d6Clicks=0;function initDay6(){d6Clicks=0;var sh=document.getElementById('d6-sheep'),sp=document.getElementById('d6-shepherd'),a=document.getElementById('d6-angel');if(sh)sh.style.display='';if(sp)sp.classList.remove('show');if(a)a.classList.remove('show');}
document.getElementById('d6-sheep').addEventListener('click',function(){d6Clicks++;if(d6Clicks===1){document.getElementById('d6-sheep').style.display='none';document.getElementById('d6-shepherd').classList.add('show');}else if(d6Clicks===2){document.getElementById('d6-angel').classList.add('show');dayDone[5]=true;}});
document.getElementById('d6-btn-hint').addEventListener('click',function(){pk(lang,'j6Hint');});
document.getElementById('d6-btn-next').addEventListener('click',function(){if(!dayDone[5]){pk(lang,'j6Fail');return;}goNext(6);});
// D7
var d7Clicks=0;function initDay7(){d7Clicks=0;var s=document.getElementById('d7-star'),m=document.getElementById('d7-magi'),g=document.getElementById('d7-gift');if(s)s.classList.remove('moved');if(m)m.classList.remove('walk');if(g)g.classList.remove('show');}
document.getElementById('d7-star').addEventListener('click',function(){d7Clicks++;var s=document.getElementById('d7-star'),m=document.getElementById('d7-magi'),g=document.getElementById('d7-gift');if(d7Clicks===1){s.classList.add('moved');setTimeout(function(){if(m)m.classList.add('walk');},400);}else if(d7Clicks>=2){if(g)g.classList.add('show');dayDone[6]=true;}});
document.getElementById('d7-btn-hint').addEventListener('click',function(){pk(lang,'j7Hint');});
document.getElementById('d7-btn-next').addEventListener('click',function(){if(!dayDone[6]){pk(lang,'j7Fail');return;}goNext(7);});
// REPLAY
document.getElementById('btn-replay').addEventListener('click',function(){day=0;dayDone=[false,false,false,false,false,false,false];ss('welcome');setProgress(0);document.getElementById('welcome-narr').textContent=T[lang].welcome;});
document.getElementById('welcome-narr').textContent=T[lang].welcome;
})();
