import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
const pages = [
  ['index', 'Seu estilo. Nossa assinatura.', 'Cortes com personalidade, barba e um momento para cuidar de você. Conheça a Mãos de Ouro.', 'home'],
  ['cortes', 'Encontre seu próximo corte', 'Explore referências de cortes, degradês e estilos na tesoura da Mãos de Ouro.', 'cuts'],
  ['loja', 'Seu ritual, além da cadeira', 'Explore pomadas, gel, escovas e ferramentas de barbearia. Monte seu pedido demonstrativo e consulte a Mãos de Ouro pelo WhatsApp.', 'shop'],
  ['sobre', 'A arte está no cuidado', 'Conheça a filosofia da Mãos de Ouro: escuta, técnica e atenção aos detalhes.', 'about'],
  ['agendar', 'Reserve um tempo para você', 'Experimente o agendamento demonstrativo e envie sua solicitação à Mãos de Ouro pelo WhatsApp.', 'booking'],
  ['cadastro', 'Seu próximo ritual começa aqui', 'Crie seu perfil local de demonstração para facilitar o agendamento na Mãos de Ouro.', 'profile'],
];
const scissors = '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="12" cy="35" r="7"/><circle cx="34" cy="35" r="7"/><path d="m17 30 21-25-9 27M29 30 9 5l9 27"/><circle cx="23" cy="24" r="2"/></svg>';
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
const insta = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>';
const wa = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.8 7.4L3 20l1.2-4.5A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8 7.5c.8 4 3 6.3 7.2 7.7l1.3-2.2-2.7-1-1 1c-1.5-.7-2.7-1.8-3.3-3.2l1-1L9.3 6.5Z"/></svg>';
const logo = `<a class="brand" href="index.html" aria-label="Mãos de Ouro, início"><span class="brand-icon">${scissors}</span><span>MÃOS DE OURO<small>BARBEARIA & ESTILO</small></span></a>`;
await mkdir(dist, { recursive: true });
for (const [file, title, description, page] of pages) {
  const body = await readFile(path.join(src, 'pages', file + '.html'), 'utf8');
  const links = [['index','Início'],['cortes','Nossos cortes'],['loja','Loja'],['sobre','A barbearia'],['cadastro','Meu perfil']].map(([id,label])=>`<a href="${id}.html" ${id===file?'aria-current="page"':''}>${label}</a>`).join('');
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#121311"><meta name="description" content="${description}"><title>${title} | Mãos de Ouro</title><meta property="og:title" content="${title} | Mãos de Ouro"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="preload" href="assets/archivo-black.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="styles.css">${page==='shop'?'<link rel="stylesheet" href="shop.css">':''}<script type="module" src="app.js"></script></head>
<body data-page="${page}"><a class="skip-link" href="#conteudo">Pular para o conteúdo</a><header class="site-header"><div class="header-inner">${logo}<nav class="desktop-nav" aria-label="Navegação principal">${links}</nav><a class="button button-gold header-book" href="agendar.html">Agendar horário ${arrow}</a><button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Navegação móvel" hidden>${links}<a href="agendar.html">Agendar horário ↗</a></nav></header>
<main id="conteudo">${body}</main>
<footer class="site-footer"><div class="container footer-top">${logo}<p>O seu estilo.<br>Em boas mãos.</p><div class="footer-social"><a data-instagram target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/jonathan_k310/">${insta} Instagram ↗</a><a data-whatsapp target="_blank" rel="noopener noreferrer" href="https://wa.me/5511927260440">${wa} WhatsApp ↗</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Mãos de Ouro</span><span>Site demonstrativo · fotos de referência · valores ilustrativos</span><a href="cadastro.html#profile-privacy">Seus dados</a></div></footer>
<a class="whatsapp-float" data-whatsapp href="https://wa.me/5511927260440" target="_blank" rel="noopener noreferrer" aria-label="Conversar com a Mãos de Ouro pelo WhatsApp">${wa}</a>
<dialog class="video-dialog" id="motion-dialog" aria-labelledby="video-title"><div class="dialog-top"><span id="video-title">O ritual em movimento</span><button class="icon-button" data-close-video aria-label="Fechar vídeo">×</button></div><video controls loop muted playsinline preload="none" poster="assets/motion-poster.webp"><source src="assets/ritual-motion.mp4" type="video/mp4">Seu navegador não suporta vídeo.</video><p>Motion art original · Mãos de Ouro</p></dialog>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div></body></html>`;
  await writeFile(path.join(dist, file + '.html'), html);
}
await cp(path.join(root, 'public'), dist, { recursive: true });
for (const name of await readdir(src)) if (/\.(js|css)$/.test(name)) await cp(path.join(src,name),path.join(dist,name));
await writeFile(path.join(dist, '.nojekyll'), '');
await writeFile(path.join(dist, '404.html'), await readFile(path.join(dist,'index.html')));
console.log(`Build concluído: ${pages.length} páginas e assets em dist/.`);
