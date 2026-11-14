import { contact, cuts } from './config.js';
import { initBooking } from './booking.js';
import { initProfile } from './profile.js';

document.documentElement.classList.add('js');
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

// Centralized contact configuration for every page.
$$('[data-whatsapp]').forEach(a => { a.href = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site da Mãos de Ouro e gostaria de saber mais.')}`; });
$$('[data-instagram]').forEach(a => { a.href = contact.instagram; });

const menu = $('.menu-toggle');
const nav = $('#mobile-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');nav.hidden=true;}
menu.addEventListener('click',()=>{
  const expanded = menu.getAttribute('aria-expanded')==='true';
  menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Abrir menu':'Fechar menu');nav.hidden=expanded;
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!nav.hidden){closeMenu();menu.focus();}});
document.addEventListener('click',e=>{if(!nav.hidden&&!e.target.closest('.site-header'))closeMenu();});
window.matchMedia('(min-width: 851px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

const revealItems=$$('.reveal');
if('IntersectionObserver' in window){const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});revealItems.forEach(item=>observer.observe(item));} else revealItems.forEach(item=>item.classList.add('visible'));

// One requestAnimationFrame per scroll; motion stays inside its own section.
const stage=$('.motion-stage');
let motionPaused=false, scheduled=false;
function updateMotion(){
  scheduled=false;if(!stage||motionPaused||reduced.matches)return;
  const rect=stage.getBoundingClientRect();
  if(rect.bottom<0||rect.top>innerHeight)return;
  const progress=Math.min(1,Math.max(0,(innerHeight-rect.top)/(innerHeight+rect.height)));
  stage.style.setProperty('--scroll',progress.toFixed(4));
}
if(stage){
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateMotion);}},{passive:true});
  window.addEventListener('resize',updateMotion);updateMotion();
  $('[data-toggle-motion]').addEventListener('click',e=>{
    motionPaused=!motionPaused;document.body.classList.toggle('motion-paused',motionPaused);
    const button=e.currentTarget;button.setAttribute('aria-pressed',String(motionPaused));button.textContent=motionPaused?'Retomar movimento ▷':'Pausar movimento Ⅱ';if(!motionPaused)updateMotion();
  });
}

const videoDialog=$('#motion-dialog');
const video=$('video',videoDialog);
$$('[data-open-video]').forEach(button=>button.addEventListener('click',()=>{videoDialog.showModal();video.play().catch(()=>{});}));
$('[data-close-video]').addEventListener('click',()=>videoDialog.close());
videoDialog.addEventListener('close',()=>video.pause());
videoDialog.addEventListener('click',e=>{if(e.target===videoDialog){const rect=videoDialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)videoDialog.close();}});

function initCuts(){
  const grid=$('#cuts-grid');if(!grid)return;
  const dialog=$('#cut-dialog');
  function openCut(cut){
    $('#cut-detail-title').textContent=cut.name;$('#cut-detail-category').textContent=cut.label;
    $('#cut-detail-description').textContent=cut.description;
    const image=$('#cut-detail-image');image.src=`assets/${cut.image}`;image.alt=`Referência de estilo: ${cut.name}`;
    $('#cut-detail-book').href=`agendar.html?servico=corte&corte=${encodeURIComponent(cut.name)}`;
    dialog.showModal();
  }
  cuts.forEach((cut,index)=>{
    const card=document.createElement('article');card.className='cut-card';card.dataset.category=cut.category;card.id=cut.id;
    const imageButton=document.createElement('button');imageButton.className='cut-image';imageButton.type='button';imageButton.setAttribute('aria-label',`Ver detalhes: ${cut.name}`);
    const image=document.createElement('img');image.src=`assets/${cut.image}`;image.alt=`Referência de estilo: ${cut.name}`;image.loading='lazy';image.width=800;image.height=1000;
    const pill=document.createElement('span');pill.className='image-pill';pill.textContent=cut.label.toUpperCase();
    const arrow=document.createElement('span');arrow.className='card-open';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    imageButton.append(image,pill,arrow);imageButton.addEventListener('click',()=>openCut(cut));
    const caption=document.createElement('div');caption.className='cut-caption';const h3=document.createElement('h3');h3.textContent=cut.name;
    const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');caption.append(h3,number);
    const description=document.createElement('p');description.textContent=cut.description;
    const link=document.createElement('a');link.href=`agendar.html?servico=corte&corte=${encodeURIComponent(cut.name)}`;link.className='text-link';link.textContent='Agendar esse estilo ↗';
    card.append(imageButton,caption,description,link);grid.append(card);
  });
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    const category=button.dataset.filter;
    $$('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    let count=0;$$('.cut-card',grid).forEach(card=>{card.hidden=category!=='all'&&card.dataset.category!==category;if(!card.hidden)count++;});
    $('#filter-status').textContent=`${count} ${count===1?'estilo disponível':'estilos disponíveis'}.`;
  }));
  $('[data-close-cut]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  if(location.hash){const id=decodeURIComponent(location.hash.slice(1));const cut=cuts.find(c=>c.id===id);if(cut)requestAnimationFrame(()=>document.getElementById(id).scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'}));}
}

if(document.body.dataset.page==='cuts')initCuts();
if(document.body.dataset.page==='booking')initBooking();
if(document.body.dataset.page==='profile')initProfile();
