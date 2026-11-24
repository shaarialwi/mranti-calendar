import { columns } from './columns.js';
const $=id=>document.getElementById(id);
const now=new Date(), month=new Date(now.getFullYear(),now.getMonth(),1);
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const date=n=>iso(new Date(month.getFullYear(),month.getMonth(),n));
const key='mranti-calendar-preview-v1';
let events=JSON.parse(localStorage.getItem(key)||'null')??['Innovation showcase','Park community meetup','Programme briefing'].map((title,i)=>({id:String(i),title,start:date(6+i*9),end:date(6+i*9),division:'Ecosystem',venue:'MRANTI Park',status:'Confirmed',own:false}));
let view='Calendar',editing;
const fields = 'groupMonth title eventStatus category subcategory division coordinator pax start end days monthName week startTime endTime hours booked audienceAccess venue description zoom fbLive attendancePlatform audience assistance speaker organiser remarks registered attended budget utilised pricing fees photo remarks2 dataUrl'.split(' ');
const computed = new Set(['days','monthName','week','hours']);
const groups = {0:'Event overview',8:'Schedule',16:'Venue and coordination',28:'Post Event'};
function buildFields(){
  let group;
  columns.forEach(({label,options},index)=>{
    const key=fields[index];
    if(groups[index]){
      group=document.createElement('fieldset');
      group.append(el('legend',groups[index]));
      $('sheetFields').append(group);
    }
    const wrapper=el('label',label);
    const multiline=['description','remarks','remarks2','assistance'].includes(key);
    const control=document.createElement(options?'select':multiline?'textarea':'input');
    control.name=key;
    if(options){
      for(const value of ['',...options])control.add(new Option(value||'Select…',value));
    }else if(!multiline){
      control.type=({start:'date',end:'date',startTime:'time',endTime:'time',photo:'url',dataUrl:'url',
        pax:'number',registered:'number',attended:'number',budget:'number',utilised:'number'})[key]||'text';
      if(control.type==='number'){control.min='0';control.step=['budget','utilised'].includes(key)?'0.01':'1'}
    }
    control.required=['title','division','start','end','eventStatus'].includes(key);
    wrapper.append(control);group.append(wrapper);
    if(['zoom','fbLive'].includes(key)){
      const timing=el('label','Time needed');const input=document.createElement('input');input.name=key+'Time';input.type='time';timing.append(input);group.append(timing);
    }
  });
}
function updateSchedule(){
  const f=$('form').elements, start=Date.parse(f.start.value),end=Date.parse(f.end.value);
  f.days.value=end>=start?(end-start)/86400000+1:'';
  f.monthName.value=Number.isFinite(start)?new Date(start).toLocaleString('en-GB',{month:'long',timeZone:'UTC'}):'';
  const d=new Date(start);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  f.week.value=Number.isFinite(start)?Math.ceil(((d-Date.UTC(d.getUTCFullYear(),0,1))/86400000+1)/7):'';
  const hours=(Date.parse(f.end.value+'T'+f.endTime.value+'Z')-Date.parse(f.start.value+'T'+f.startTime.value+'Z'))/3600000;
  f.hours.value=Number.isFinite(hours)&&hours>=0?String(Math.round(hours*100)/100):'';
  f.endTime.setCustomValidity(hours<0?'End time must follow the start time.':'');
}
buildFields();
$('form').addEventListener('input',updateSchedule);
function el(tag,text,cls){const x=document.createElement(tag);x.textContent=text;if(cls)x.className=cls;return x}
function button(text,fn,cls){const b=el('button',text,cls);b.onclick=fn;return b}
function save(){localStorage.setItem(key,JSON.stringify(events));render()}
function openForm(e,read=false){editing=e?.id;$('formTitle').textContent=read?'Event details':e?'Edit event':'Add event';[...fields,'zoomTime','fbLiveTime'].forEach(k=>{
  const input=$('form').elements[k];
  const fallback=k==='eventStatus'?(e?.status==='Confirmed'?'Confirmed':'WIP'):['start','end'].includes(k)?iso(now):'';
  const value=e?.[k]??fallback;
  if(input.tagName==='SELECT'&&value&&!Array.from(input.options).some(o=>o.value===value))input.add(new Option(value,value));
  input.value=value;input.readOnly=read||computed.has(k);input.disabled=read&&input.tagName==='SELECT';
});updateSchedule();$('submit').hidden=read;$('modal').showModal()}
function render(){const box=$('content');box.replaceChildren();const cal=view==='Calendar';$('prev').hidden=$('next').hidden=!cal;$('heading').textContent=cal?month.toLocaleDateString('en-MY',{month:'long',year:'numeric'}):view;document.querySelectorAll('[data-view]').forEach(b=>b.className=b.dataset.view===view?'primary':'');
if(cal){const grid=el('div','','grid');box.append(grid);for(const d of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])grid.append(el('div',d,'weekday'));for(let i=0;i<(month.getDay()+6)%7;i++)grid.append(el('div','','day'));for(let n=1;n<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();n++){const cell=el('div',n,'day');grid.append(cell);for(const e of events.filter(e=>e.status==='Confirmed'&&e.start<=date(n)&&e.end>=date(n)))cell.append(button(e.title,()=>openForm(e,true),'event'))}return}
const rows=events.filter(e=>view==='My events'?e.own:e.status==='Pending');if(!rows.length)box.append(el('p',view==='Review'?'No events awaiting confirmation.':'Your submitted programmes will appear here.'));for(const e of rows){const row=el('div','','row');row.append(el('span',e.title+' · '+e.status+'\n'+e.start+' · '+e.division));if(view==='Review')row.append(button('View details',()=>openForm(e,true)),button('Confirm',()=>{e.status='Confirmed';e.eventStatus='Confirmed';save()}));else row.append(button('Edit',()=>openForm(e)));box.append(row)}}
$('form').onsubmit=ev=>{ev.preventDefault();const data=Object.fromEntries(new FormData(ev.target));if(data.end<data.start){alert('End date must be on or after the start date.');return}let e=events.find(x=>x.id===editing);if(!e){e={id:crypto.randomUUID(),own:true};events.push(e)}Object.assign(e,data,{status:'Pending'});$('modal').close();view='My events';save()};
$('close').onclick=()=>$('modal').close();$('add').onclick=()=>openForm();document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});for(const [id,step] of [['prev',-1],['next',1]])$(id).onclick=()=>{month.setMonth(month.getMonth()+step);render()};render()
