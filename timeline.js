/* Japan Family Trip OS 12: unified day timeline and safe what-if planning.
   Uses existing trip data, never silently changes confirmed bookings. */
'use strict';
(function(){
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const validTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(t));
const min=t=>validTime(t)?+t.slice(0,2)*60+(+t.slice(3)):null;
const time=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function daysByDate(){const groups=new Map();state.days.forEach((d,i)=>{const key=state.start?dateISO(state.start,d.offset):'Day '+(d.offset+1);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({d,i})});return [...groups.entries()].sort((a,b)=>a[1][0].d.offset-b[1][0].d.offset)}
function conflicts(groups){const problems=[];for(const [date,entries] of groups){const acts=entries.flatMap(({d,i})=>d.activities.map(a=>({a,d,i,start:min(a.time),length:Number(a.duration)||0}))).filter(x=>x.start!==null).sort((a,b)=>a.start-b.start);let end=-1,previous=null;for(const x of acts){if(x.start<end)problems.push({date,first:previous,second:x});if(x.start+x.length>end){end=x.start+x.length;previous=x}}}return problems}
function section(title){let c=node('section');c.className='card';c.append(node('h2',title));return c}
function mount(){let home=document.getElementById('home');if(!home)return;const groups=daysByDate(),problems=conflicts(groups);
let panel=section('按真实日期查看行程 · 12.0');
let desc=node('p','同一日的跨城活动合并展示，帮助发现转场时间冲突。活动时长不包括交通及排队。');desc.className='muted';panel.append(desc);
let bar=node('div');bar.className='row';let select=node('select');select.style.maxWidth='260px';groups.forEach(([date,entries],i)=>{let o=node('option',date+' · '+[...new Set(entries.map(x=>x.d.city))].join(' → '));o.value=i;select.append(o)});bar.append(select);panel.append(bar);
let output=node('div');panel.append(output);
function show(){output.replaceChildren();let group=groups[Number(select.value)];if(!group)return;let [date,entries]=group;let all=entries.flatMap(({d,i})=>d.activities.map(a=>({a,d,i,start:min(a.time)}))).sort((a,b)=>(a.start??9999)-(b.start??9999));output.append(node('p','📅 '+date+' · '+entries.map(x=>x.d.city+' D'+x.d.index).join(' / ')));
all.forEach(x=>{let row=node('div');row.className='smart-day';let details=node('div');details.append(node('strong',(x.a.time||'待排时间')+' · '+x.a.title),node('p',x.d.city+' · '+(x.a.duration||0)+' 分钟 · '+(x.a.transport||'交通待确认')));let b=node('button','编辑');b.onclick=()=>navDay(x.i);row.append(details,b);output.append(row)});
let relevant=problems.filter(x=>x.date===date);if(relevant.length){let warn=node('p','⚠️ 检测到 '+relevant.length+' 项活动时间重叠，跨城当天尤其需要核实。');warn.className='smart-alert';output.prepend(warn)}
let copy=node('button','复制当天行程');copy.onclick=async()=>{const msg=['日本家庭旅行 '+date,...all.map(x=>x.a.time+' '+x.d.city+' '+x.a.title)].join('\n');try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(msg);alert('已复制')}else prompt('复制行程',msg)}catch(e){prompt('复制行程',msg)}};output.append(copy)}
select.onchange=show;show();home.append(panel);
let whatif=section('临时变更模拟 · 不修改原行程');let help=node('p','选择某一天的活动，模拟延误 30、60 或 120 分钟。只计算时间重叠，不冒充实时交通预测。');help.className='muted';whatif.append(help);
let activity=node('select'),delay=node('select');[[30,'延误 30 分钟'],[60,'延误 60 分钟'],[120,'延误 120 分钟']].forEach(([n,label])=>{let o=node('option',label);o.value=n;delay.append(o)});
state.days.forEach((d,i)=>d.activities.forEach((a,j)=>{if(min(a.time)===null)return;let o=node('option',d.city+' D'+d.index+' · '+a.time+' '+a.title);o.value=i+':'+j;activity.append(o)}));whatif.append(activity,delay);let simulate=node('button','模拟影响');whatif.append(simulate);let result=node('div');whatif.append(result);
simulate.onclick=()=>{result.replaceChildren();let [i,j]=(activity.value||'').split(':').map(Number);if(!Number.isInteger(i)||!Number.isInteger(j)||!state.days[i]?.activities[j])return;let d=state.days[i],a=d.activities[j],start=min(a.time),delta=Number(delay.value),end=start+delta+(Number(a.duration)||0),date=state.start?dateISO(state.start,d.offset):d.offset;let affected=state.days.filter(x=>(state.start?dateISO(state.start,x.offset):x.offset)===date).flatMap(x=>x.activities).filter(x=>x!==a&&min(x.time)!==null&&min(x.time)>=start&&min(x.time)<end);result.append(node('p','模拟 '+a.title+' 延后 '+delta+' 分钟，预计结束 '+time(end)+ '。'));if(affected.length){result.append(node('strong','可能影响 '+affected.length+' 项后续活动'));affected.forEach(x=>result.append(node('p','• '+x.time+' '+x.title)))}else result.append(node('p','没有检测到与该时段重叠的其他活动。'));result.append(node('p','此模拟没有更改活动、酒店、票券或预订。'))};
home.append(whatif);
}
window.JapanTripTimeline={daysByDate,conflicts};
const previous=render;render=function(){previous();mount()};render();
})();
