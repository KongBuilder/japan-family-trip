/* Japan Family Trip OS 10: decision-first dashboard, no external dependencies */
'use strict';
(function(){
const e=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const style=document.createElement('style');style.textContent=`
:root{--ink:#182b36;--accent:#087e77;--soft:#edf8f5}body{background:#f5f7f8;color:var(--ink)}header{background:linear-gradient(125deg,#0b353b,#087e77);padding:26px 18px 32px}header h1{font-size:clamp(24px,5vw,33px);letter-spacing:-.6px}.wrap{max-width:980px}.card{box-shadow:0 6px 22px #102f3910;border:1px solid #e7edef;padding:18px}.stat{background:#f0f7f5}.stat b{color:#0c6861}button.primary,.tabs .on{background:#087e77;color:#fff}button{min-height:42px}.bottom{box-shadow:0 -5px 24px #102f3920}.bottom button{font-size:13px}.smart-hero{background:linear-gradient(120deg,#123f43,#087e77);color:#fff;border-radius:18px;padding:18px;margin:10px 0 14px}.smart-hero h2{color:#fff;margin:0 0 7px}.smart-hero p{color:#d5f4ed;margin:6px 0}.smart-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.smart-row button{background:#fff;color:#075d57;font-weight:650}.smart-metric{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.smart-metric>div{background:#f1f8f6;padding:10px;border-radius:12px;font-size:12px}.smart-metric strong{display:block;font-size:22px;color:#096f66}.smart-alert{padding:11px 12px;border-radius:10px;background:#fff8e9;border-left:3px solid #d99b26;margin:8px 0}.smart-alert button{margin-top:6px}.smart-day{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #e8eeee}.smart-day:last-child{border-bottom:0}.smart-day button{flex-shrink:0}@media(max-width:390px){.card{padding:13px}.smart-metric{gap:5px}.smart-metric>div{padding:8px}.smart-row{gap:6px}}`;
document.head.append(style);
const safeDate=d=>state.start?dateISO(state.start,d.offset):'日期待确认';
const confirmed=b=>b.status==='已预订';
function openTab(t){tab=t;render();window.scrollTo(0,0)}
function build(){
const home=document.getElementById('home');if(!home)return;
const total=state.days.reduce((n,d)=>n+d.activities.length,0);
const booked=state.bookings.filter(confirmed).length;
const unknownHotels=[...new Set(state.days.filter(d=>!d.hotel||d.hotel==='待确认').map(d=>d.city))];
const transfer=[3,6,11].map(i=>({from:state.days[i],to:state.days[i+1]})).filter(x=>x.to);
const mismatched=state.bookings.filter(b=>b.date&&state.start&&!state.days.some(d=>safeDate(d)===b.date));
const uniqueDates=new Set(state.days.map(d=>d.offset)).size;
const alerts=[];
if(!state.start)alerts.push({text:'出发日期未设置，所有预订日期无法核对',action:'设置日期',fn:()=>openTab('settings')});
if(unknownHotels.length)alerts.push({text:'尚未确认酒店：'+unknownHotels.join('、'),action:'查看酒店',fn:()=>navDay(state.days.findIndex(d=>unknownHotels.includes(d.city)))});
if(uniqueDates!==14)alerts.push({text:'17 条城市日程仍映射到 '+uniqueDates+' 个日历日，跨城日期可能重复计算',action:'修正日期',fn:()=>openTab('settings')});
if(mismatched.length)alerts.push({text:mismatched.length+' 项预订日期不在行程范围内，请检查',action:'查看预订',fn:()=>openTab('bookings')});
if(!state.bookings.length)alerts.push({text:'尚未录入真实机票、酒店及门票确认记录',action:'新增预订',fn:()=>openTab('bookings')});
let hero=e('section','smart-hero');hero.append(e('h2','','今天该处理什么？'),e('p','','Japan Family Trip OS 10 · 家庭旅行决策中心'),e('p','','京都 → 富士山 → 东京 → 大阪 · '+state.people+' 人 · 13 晚'));
let quick=e('div','smart-row');[['查看每日行程',()=>openTab('days')],['处理待确认',()=>{const a=document.getElementById('smartAlerts');a?.scrollIntoView({behavior:'smooth'})}],['管理预订',()=>openTab('bookings')],['备份资料',()=>{openTab('settings');document.getElementById('settings')?.scrollIntoView({behavior:'smooth'})}]].forEach(([label,fn])=>{let b=e('button','',label);b.onclick=fn;quick.append(b)});hero.append(quick);
let metrics=e('section','card');metrics.append(e('h2','','旅行准备概览'));let row=e('div','smart-metric');[[uniqueDates,'已映射日历日'],[booked,'已标记预订'],[total,'行程活动']].forEach(([n,label])=>{let c=e('div');c.append(e('strong','',String(n)),e('span','',label));row.append(c)});metrics.append(row);
let warnings=e('section','card');warnings.id='smartAlerts';warnings.append(e('h2','','需要优先处理'));if(!alerts.length)warnings.append(e('p','','当前未检测到基础资料缺口。实时天气、车次和营业情况仍须外部核实。'));alerts.forEach(a=>{let c=e('div','smart-alert');c.append(e('div','',a.text));let b=e('button','',a.action);b.onclick=a.fn;c.append(b);warnings.append(c)});
let next=e('section','card');next.append(e('h2','','四城转场检查'));transfer.forEach(t=>{let row=e('div','smart-day');let x=e('div');x.append(e('strong','',t.from.city+' → '+t.to.city),e('p','muted',safeDate(t.to)+' · 车票、行李、入住时间待核实'));let b=e('button','','查看');b.onclick=()=>navDay(state.days.indexOf(t.to));row.append(x,b);next.append(row)});
home.prepend(next);home.prepend(warnings);home.prepend(metrics);home.prepend(hero);
}
const previous=render;render=function(){previous();build()};render();
})();
