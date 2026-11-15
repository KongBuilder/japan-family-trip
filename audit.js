/* Japan Travel OS 11: auditable planning engine, no fake live data */
'use strict';
(function(){
const E=(tag,text)=>{let x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x};
const minutes=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s))?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
const dateAt=n=>{if(!state.start)return null;const d=new Date(state.start+'T00:00:00Z');if(!Number.isFinite(d.getTime()))return null;d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const evaluate=()=>{
let warnings=[],days=state.days||[],known=new Set(days.map(d=>dateAt(d.offset)).filter(Boolean));
const issue=(severity,title,detail,day)=>warnings.push({severity,title,detail,day});
if(!state.start)issue('high','未设置出发日期','无法核实酒店、车票及门票日期');
if(new Set(days.map(d=>d.offset)).size!==14)issue('high','跨城日期尚未合并','17 条城市日程对应 13 晚，通常应有 14 个日历日');
const cities=[...new Set(days.map(d=>d.city))];cities.forEach(city=>{let arr=days.filter(d=>d.city===city);if(arr.some(d=>!d.hotel||d.hotel==='待确认'))issue('high',city+'酒店未确认','住宿名称、入住日期、地址和取消条件须核实',days.indexOf(arr[0]))});
days.forEach((d,i)=>{
let sorted=d.activities.map(a=>({...a,begin:minutes(a.time),length:Number(a.duration)})).filter(a=>a.begin!==null&&Number.isFinite(a.length)&&a.length>=0).sort((a,b)=>a.begin-b.begin);
for(let j=1;j<sorted.length;j++)if(sorted[j].begin<sorted[j-1].begin+sorted[j-1].length)issue('medium','活动时间重叠',d.city+' D'+d.index+'：'+sorted[j-1].title+' 与 '+sorted[j].title,i);
if(d.activities.length>5)issue('medium','当天活动过多',d.city+' D'+d.index+' 有 '+d.activities.length+' 项活动',i);
let total=d.activities.reduce((n,a)=>n+(Number(a.duration)||0),0);if(total>420)issue('medium','活动时长偏长',d.city+' D'+d.index+' 计划活动 '+Math.round(total/60*10)/10+' 小时，不含交通',i);
d.activities.forEach(a=>{if(!a.title?.trim())issue('high','活动名称为空',d.city+' D'+d.index,i);if(a.status==='已预订'&&a.transport==='待确认')issue('low','已预订活动交通待确认',a.title,i)});
});
state.bookings.forEach(b=>{if(b.date&&state.start&&!known.has(b.date))issue('high','预订日期不在行程内',b.name+'：'+b.date);if(b.status==='已预订'&&!b.ref)issue('medium','已预订但无确认编号',b.name)});
let total=state.expenses.reduce((n,x)=>n+(Number(x.amount)||0)*(x.currency==='JPY'?Number(state.fx):1),0);
if(Number(state.budget)>0&&total>Number(state.budget))issue('high','旅行预算超支','已记账 RM '+total.toFixed(2)+'，预算 RM '+Number(state.budget).toFixed(2));
return {warnings,high:warnings.filter(x=>x.severity==='high').length,medium:warnings.filter(x=>x.severity==='medium').length,expense:total};
};
function mount(){
let home=document.getElementById('home');if(!home)return;let r=evaluate(),panel=E('section');panel.className='card';panel.id='tripAudit';
panel.append(E('h2','旅行质量控制中心 11.0'));
let summary=E('p','高风险 '+r.high+' 项 · 中风险 '+r.medium+' 项 · 共 '+r.warnings.length+' 项提醒');summary.className='muted';panel.append(summary);
let controls=E('div');controls.className='row';let select=E('select');select.style.width='auto';['全部','高风险','中风险','低风险'].forEach((t,i)=>{let o=E('option',t);o.value=['all','high','medium','low'][i];select.append(o)});let exportBtn=E('button','导出检查报告');controls.append(select,exportBtn);panel.append(controls);
let list=E('div');panel.append(list);
function show(){list.replaceChildren();let items=r.warnings.filter(x=>select.value==='all'||x.severity===select.value);if(!items.length)list.append(E('p','当前筛选下没有发现问题。实时天气、交通与营业时间仍未自动核实。'));items.slice(0,60).forEach(w=>{let row=E('div');row.className='item';row.append(E('strong',(w.severity==='high'?'🔴 ':w.severity==='medium'?'🟠 ':'⚪ ')+w.title),E('p',w.detail));if(Number.isInteger(w.day)){let b=E('button','查看当日');b.onclick=()=>navDay(w.day);row.append(b)}list.append(row)});if(items.length>60)list.append(E('p','仅显示前 60 项，请导出完整报告。'))}
select.onchange=show;show();
exportBtn.onclick=()=>{let report=['Japan Family Trip OS 11 行程审查', '出发日期：'+(state.start||'待确认'),'人数：'+state.people,'检查时间：'+new Date().toISOString(),'',...r.warnings.map((w,i)=>(i+1)+'. ['+w.severity+'] '+w.title+'：'+w.detail)].join('\n');let a=E('a');let url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='japan-trip-audit.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
home.insertBefore(panel,home.children[4]||null);
}
window.JapanTripAudit={evaluate};
const old=render;render=function(){old();mount()};render();
})();
