
(function(){
  'use strict';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const lang=()=>document.body.classList.contains('lang-en')?'en':'ar';

  function applyLocalizedAttributes(){
    const l=lang();
    const body=document.body;
    const title=body.getAttribute('data-page-title-'+l);
    const desc=body.getAttribute('data-page-description-'+l);
    if(title) document.title=title;
    const meta=qs('meta[name="description"]');
    if(meta && desc) meta.setAttribute('content',desc);
    qsa('[data-alt-ar][data-alt-en]').forEach(el=>el.setAttribute('alt',el.getAttribute('data-alt-'+l)||''));
    qsa('[data-aria-label-ar][data-aria-label-en]').forEach(el=>el.setAttribute('aria-label',el.getAttribute('data-aria-label-'+l)||''));
    qsa('[data-title-ar][data-title-en]').forEach(el=>el.setAttribute('title',el.getAttribute('data-title-'+l)||''));
    qsa('[data-theme-toggle]').forEach(btn=>{
      const dark=document.documentElement.getAttribute('data-theme')==='dark';
      const label=l==='ar'?(dark?'التبديل إلى المظهر الفاتح':'التبديل إلى المظهر الداكن'):(dark?'Switch to light mode':'Switch to dark mode');
      btn.setAttribute('aria-label',label);
      const sr=btn.querySelector('.sr-only'); if(sr) sr.textContent=label;
    });
    updateMailLinks();
  }

  function updateMailLinks(){
    const l=lang();
    const fields=l==='ar'
      ? ['اسم المنشأة:','القطاع أو مجال العمل:','الاحتياج الحالي:','النتيجة المطلوبة:','الإطار الزمني:','الاسم ووسيلة التواصل:']
      : ['Organization:','Sector or field:','Current need:','Desired outcome:','Timeframe:','Name and contact details:'];
    qsa('a[href^="mailto:info@Rabet.sa"]').forEach(a=>{
      const subject=a.getAttribute('data-mail-subject-'+l)||(l==='ar'?'طلب استشارة':'Consultation Request');
      const context=a.getAttribute('data-mail-context-'+l)||'';
      const intro=l==='ar'?'مرحبًا فريق رابط،\n\nأرغب في مناقشة الاحتياج التالي:':'Hello Rabet team,\n\nI would like to discuss the following need:';
      const body=[intro, context?`\n${context}`:'', '\n', ...fields.map(x=>x+'\n'), l==='ar'?'\nشكرًا.':'\nThank you.'].join('\n');
      a.href='mailto:info@Rabet.sa?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    });
  }

  function setYear(){ qsa('.current-year').forEach(el=>el.textContent=String(new Date().getFullYear())); }
  function run(){ applyLocalizedAttributes(); setYear(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  document.addEventListener('rabet:language',()=>requestAnimationFrame(applyLocalizedAttributes));
  document.addEventListener('rabet:theme',()=>requestAnimationFrame(applyLocalizedAttributes));
})();
