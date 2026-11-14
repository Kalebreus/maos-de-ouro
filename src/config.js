export const contact = Object.freeze({
  name: 'Mãos de Ouro',
  whatsapp: '5511927260440',
  phoneLabel: '(11) 92726-0440',
  instagram: 'https://www.instagram.com/jonathan_k310/',
});

export const services = Object.freeze([
  { id: 'corte', name: 'Corte de cabelo', price: 60, duration: 45, description: 'Seu estilo, com consulta e acabamento preciso.' },
  { id: 'barba', name: 'Barba & acabamento', price: 40, duration: 30, description: 'Contornos definidos, cuidado em cada detalhe.' },
  { id: 'combo', name: 'Corte + barba', price: 90, duration: 75, description: 'O ritual completo para renovar o visual.' },
]);
export const formatPrice = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

export const cuts = Object.freeze([
  { id: 'degrade', name: 'Degradê clássico', category: 'degrades', label: 'Degradê', image: 'cut-fade.webp', description: 'Laterais em transição e topo com presença. Um equilíbrio entre linhas limpas e personalidade.' },
  { id: 'tesoura', name: 'Clássico na tesoura', category: 'tesoura', label: 'Na tesoura', image: 'extra.webp', description: 'Proporção, leveza e movimento. Um corte pensado para acompanhar a sua rotina.' },
  { id: 'texturizado', name: 'Curto texturizado', category: 'curtos', label: 'Curto', image: 'cut-texture.webp', description: 'Textura no topo e acabamento preciso para um visual fácil de usar, cheio de atitude.' },
  { id: 'fade-baixo', name: 'Degradê baixo', category: 'degrades', label: 'Degradê', image: 'cut-classic.webp', description: 'Uma transição discreta junto à nuca e às têmporas. Versátil nos pequenos detalhes.' },
  { id: 'cachos', name: 'Cachos com identidade', category: 'tesoura', label: 'Textura natural', image: 'cut-curls.webp', description: 'Volume e desenho que valorizam a textura natural. A referência é você.' },
]);
