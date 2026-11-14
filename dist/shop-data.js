// Illustrative catalogue. Replace products, prices and details before taking real orders.
export const categories = Object.freeze([
  { id: 'all', name: 'Todos os produtos' },
  { id: 'modeladores', name: 'Pomadas & géis' },
  { id: 'cuidados', name: 'Cuidados' },
  { id: 'ferramentas', name: 'Ferramentas' },
]);

export const MAX_CART_QUANTITY = 20;

export const products = Object.freeze([
  { id: 'pomada-matte', name: 'Pomada matte', category: 'modeladores', categoryLabel: 'Modeladores', priceCents: 4990, unit: '100 g', image: 'assets/shop/pomada-matte.svg', description: 'Textura e um visual de acabamento fosco.', details: ['Referência de pomada para modelar o cabelo.', 'Embalagem ilustrativa de 100 g.', 'Confirme composição, fixação e modo de uso com a barbearia.'] },
  { id: 'pomada-brilho', name: 'Pomada brilho', category: 'modeladores', categoryLabel: 'Modeladores', priceCents: 4990, unit: '100 g', image: 'assets/shop/pomada-brilho.svg', description: 'Um toque de brilho para o seu penteado.', details: ['Referência de pomada com acabamento brilhante.', 'Embalagem ilustrativa de 100 g.', 'A indicação depende do seu cabelo e do resultado desejado.'] },
  { id: 'gel', name: 'Gel de cabelo', category: 'modeladores', categoryLabel: 'Modeladores', priceCents: 3490, unit: '250 g', image: 'assets/shop/gel.svg', description: 'Definição para colocar suas ideias em forma.', details: ['Referência de gel para modelar o cabelo.', 'Embalagem ilustrativa de 250 g.', 'Consulte composição, tipo de fixação e disponibilidade.'] },
  { id: 'oleo-barba', name: 'Óleo para barba', category: 'cuidados', categoryLabel: 'Cuidados', priceCents: 3990, unit: '30 ml', image: 'assets/shop/oleo-barba.svg', description: 'Mais um cuidado para o ritual da barba.', details: ['Referência de óleo de cuidado para barba.', 'Embalagem ilustrativa de 30 ml.', 'Consulte ingredientes e orientação de uso antes da compra.'] },
  { id: 'escova', name: 'Escova de madeira', category: 'ferramentas', categoryLabel: 'Ferramentas', priceCents: 2990, unit: '1 unidade', image: 'assets/shop/escova.svg', description: 'O detalhe que acompanha o seu cuidado diário.', details: ['Referência de escova com corpo de madeira.', 'Uma unidade; dimensões e cerdas a confirmar.', 'Converse com a barbearia sobre o modelo adequado ao seu uso.'] },
  { id: 'tesoura', name: 'Tesoura de corte', category: 'ferramentas', categoryLabel: 'Ferramentas', priceCents: 8990, unit: '1 unidade', image: 'assets/shop/tesoura.svg', description: 'Uma ferramenta para dar forma a novos estilos.', details: ['Referência de tesoura para corte de cabelo.', 'Uma unidade; tamanho e material a confirmar.', 'Consulte especificações e conservação com a barbearia.'] },
  { id: 'maquina', name: 'Máquina de corte', category: 'ferramentas', categoryLabel: 'Ferramentas', priceCents: 18990, unit: '1 unidade', image: 'assets/shop/maquina.svg', description: 'Linhas, contornos e possibilidades para criar.', details: ['Referência de máquina para corte de cabelo.', 'Uma unidade; modelo, acessórios e alimentação a confirmar.', 'Verifique as especificações e condições de garantia antes da compra.'] },
  { id: 'navalha', name: 'Navalha retrátil', category: 'ferramentas', categoryLabel: 'Ferramentas', priceCents: 4490, unit: '1 unidade', image: 'assets/shop/navalha.svg', description: 'Acabamento e atenção em cada contorno.', details: ['Referência de navalha de barbeiro com cabo retrátil.', 'Uma unidade; lâminas e compatibilidade a confirmar.', 'Consulte o modelo e as orientações de manuseio com a barbearia.'] },
].map((product) => Object.freeze({ ...product, details: Object.freeze(product.details) })));
