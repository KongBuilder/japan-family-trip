/* Japan Family Trip OS feature pack 7.0: additive, backwards compatible */
'use strict';
(function(){
const extra=()=>{if(!state.extra||typeof state.extra!=='object')state.extra={};return state.extra};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keys=['护照及签证','机票及登机资料','酒店确认单','交通票券','旅行保险','充电器及转换插头','药品及个人用品','雨具及保暖衣物','儿童随身用品','现金及付款卡'];
const el=(tag,attrs={},txt)=>{let x=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,v));if(txt!==undefined)x.textContent=txt;return x};
const section=(title,desc)=>{let c=el('div',{class:'card'});c.append(el('h2',{},title),el('p',{class:'muted'},desc));return c};
function refreshExtras(){
 const home=document.getElementById('home'),settings=document.getElementById('settings');if(!home||!settings)return;
 const e=extra();const panel=section('旅行控制中心 7.0','十项旅行工具。所有输入保存在当前浏览器，并包含在 JSON 备份中。');
 const grid=el('div',{class:'grid'});
 const items=[
 ['行李清单',()=>showPacking()],['今日计划',()=>showToday()],['行程负荷',()=>showPace()],['转场提醒',()=>showTransfers()],
 ['支出分析',()=>showCosts()],['重复景点',()=>showDuplicates()],['每日备注',()=>showNotes()],['紧急信息',()=>showEmergency()],
 ['天气入口',()=>showWeather()],['分享当日',()=>shareDay()]
 ];
 items.forEach(([name,fn])=>{let b=el('button',{},name);b.addEventListener('click',fn);grid.append(b)});panel.append(grid);
 const area=el('div',{id:'featureOutput'});panel.append(area);home.append(panel);
 const backup=section('资料安全提示','新增清单、备注及紧急信息随 JSON 备份保存。备份可能含私人资料，请勿公开分享。');settings.append(backup);
}
function output(title){let p=document.getElementById('featureOutput');if(!p){tab='home';render();p=document.getElementById('featureOutput')}p.replaceChildren(el('h3',{},title));p.scrollIntoView({behavior:'smooth',block:'nearest'});return p}
function persist(){if(!save())alert('未能保存，请先导出 JSON 备份')}
function showPacking(){let p=output('行李清单');let e=extra();e.packing=e.packing||{};keys.forEach(k=>{let row=el('label');let ck=el('input',{type:'checkbox',style:'width:auto;margin-right:8px'});ck.checked=!!e.packing[k];ck.onchange=()=>{e.packing[k]=ck.checked;persist()};row.append(ck,document.createTextNode(k));p.append(row)});let add=el('input',{placeholder:'自定义行李项目'}),btn=el('button',{},'添加');btn.onclick=()=>{let k=add.value.trim();if(!k)return;e.customPacking=e.customPacking||[];if(!e.customPacking.includes(k))e.customPacking.push(k);persist();showPacking()};p.append(add,btn);(e.customPacking||[]).forEach(k=>{let row=el('label'),ck=el('input',{type:'checkbox',style:'width:auto;margin-right:8px'});ck.checked=!!e.packing[k];ck.onchange=()=>{e.packing[k]=ck.checked;persist()};row.append(ck,document.createTextNode(k));p.append(row)})}
function showToday(){let p=output('按日期查看');let input=el('input',{type:'date'});input.value=state.start||'';let results=el('div');const go=()=>{results.replaceChildren();let idx=state.days.findIndex(d=>dateISO(state.start,d.offset)===input.value);if(idx<0){results.textContent='此日期没有已排定行程，先在设置填写出发日期。';return}let d=state.days[idx];results.append(el('p',{},d.city+' 第'+d.index+'天 · '+d.activities.length+'项活动'));let b=el('button',{},'打开当日行程');b.onclick=()=>navDay(idx);results.append(b)};input.onchange=go;p.append(input,results);go()}
function showPace(){let p=output('行程负荷分析');state.days.forEach((d,i)=>{let minutes=d.activities.reduce((n,a)=>n+(Number(a.duration)||0),0);let status=minutes>360?'偏满':minutes>240?'中等':'轻松';let b=el('button',{style:'display:block;width:100%;text-align:left;margin:5px 0'},d.city+' D'+d.index+' · '+Math.round(minutes/60*10)/10+'小时 · '+status);b.onclick=()=>navDay(i);p.append(b)})}
function showTransfers(){let p=output('跨城转场清单');const a=[['京都 → 富士山','交通班次、行李、入住时间'],['富士山 → 东京','交通票、行李及天气'],['东京 → 大阪','新干线或其他交通、酒店入住']];a.forEach(([name,note])=>p.append(el('p',{},name+'：'+note+'，均待确认')))}
function showCosts(){let p=output('预算与支出');let spent=state.expenses.reduce((n,x)=>n+(Number(x.amount)||0)*(x.currency==='JPY'?state.fx:1),0);let planned=state.days.reduce((n,d)=>n+d.activities.reduce((m,a)=>m+(Number(a.cost)||0),0),0);p.append(el('p',{},'已记录支出：RM '+spent.toFixed(2)),el('p',{},'活动计划费用：RM '+planned.toFixed(2)),el('p',{},'预算余额：'+(state.budget>0?'RM '+(state.budget-spent).toFixed(2):'总预算待设置')))}
function showDuplicates(){let p=output('重复景点检查');let m=new Map();state.days.forEach((d,i)=>d.activities.forEach(a=>{let k=a.title.trim().toLocaleLowerCase();if(k){let arr=m.get(k)||[];arr.push(d.city+' D'+d.index);m.set(k,arr)}}));let dup=[...m.entries()].filter(([k,v])=>v.length>1);p.append(el('p',{},dup.length?'找到 '+dup.length+' 组重复名称':'未发现完全同名活动'));dup.forEach(([k,v])=>p.append(el('p',{},k+'：'+v.join('、'))))}
function showNotes(){let p=output('每日私人备注');let e=extra();e.dayNotes=e.dayNotes||{};let select=el('select');state.days.forEach((d,i)=>{let o=el('option',{value:String(i)},d.city+' D'+d.index);select.append(o)});select.value=String(selected);let area=el('textarea',{rows:'5',placeholder:'餐饮、集合地点、注意事项'});area.value=e.dayNotes[selected]||'';select.onchange=()=>{area.value=e.dayNotes[select.value]||''};let btn=el('button',{},'保存备注');btn.onclick=()=>{e.dayNotes[select.value]=area.value;persist();alert('已尝试保存备注')};p.append(select,area,btn)}
function showEmergency(){let p=output('紧急联系信息');p.append(el('p',{},'日本紧急电话：警察 110，消防及救护 119。'));let e=extra();let area=el('textarea',{rows:'4',placeholder:'保险公司、酒店电话、紧急联系人。请勿填写护照号码或银行卡资料。'});area.value=e.emergency||'';let btn=el('button',{},'保存紧急资料');btn.onclick=()=>{e.emergency=area.value;persist()};p.append(area,btn)}
function showWeather(){let p=output('天气预报入口');p.append(el('p',{},'打开外部天气网站查看实时预报，本应用不伪造天气数据。'));['京都','富士山','东京','大阪'].forEach(city=>{let b=el('button',{},city+' 天气');b.onclick=()=>window.open('https://www.google.com/search?q='+encodeURIComponent(city+' 日本 天气预报'),'_blank','noopener,noreferrer');p.append(b)})}
async function shareDay(){let d=state.days[selected],msg=d.city+' 第'+d.index+'天\n'+d.activities.map(a=>a.time+' '+a.title).join('\n');try{if(navigator.share)await navigator.share({text:msg});else if(navigator.clipboard){await navigator.clipboard.writeText(msg);alert('已复制当日行程')}else prompt('复制行程',msg)}catch(err){if(err.name!=='AbortError')alert('分享失败：'+err.message)}}
const original=render;render=function(){original();refreshExtras()};render();
})();
