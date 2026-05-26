export type PostBlock =
  | { type: "paragraph"; text: string }
  | { type: "h2"; text: string };

export type Post = {
  slug: string;
  title: string;
  image: string;
  date: string;       // YYYY-MM-DD
  excerpt: string;
  body: PostBlock[];
};

export const posts: Post[] = [
  {
    slug: "tipos-de-yoga",
    title: "Os diferentes tipos de yoga e como escolher o seu",
    image: "/images/blog/tipos-de-yoga.jpg",
    date: "2022-08-08",
    excerpt: "O yoga é uma prática antiga que tem ganhado popularidade nos últimos anos. Existem muitos tipos diferentes, cada um com suas próprias técnicas e benefícios. Veja como escolher o seu.",
    body: [
      { type: "paragraph", text: "O yoga é uma prática antiga que tem ganhado popularidade nos últimos anos. Existem muitos tipos diferentes de yoga, cada um com suas próprias técnicas e benefícios. Se você está começando a praticar yoga, pode ser difícil saber por onde começar e qual tipo de yoga escolher. Neste post, vamos apresentar os diferentes tipos de yoga e dar dicas sobre como escolher o tipo que melhor se adapta às suas necessidades e objetivos." },
      { type: "h2", text: "Hatha Yoga" },
      { type: "paragraph", text: "O Hatha Yoga é um dos tipos mais populares de yoga e é frequentemente utilizado para iniciantes. É uma prática mais lenta e focada na respiração, com ênfase em posturas básicas, como a postura do cachorro olhando para baixo e a postura da árvore. Este tipo de yoga é ótimo para relaxar a mente e o corpo, melhorar a flexibilidade e aliviar o estresse." },
      { type: "h2", text: "Vinyasa Yoga" },
      { type: "paragraph", text: "O Vinyasa Yoga é uma prática mais dinâmica, que combina movimento e respiração em uma sequência fluida. É um tipo de yoga mais desafiador que o Hatha Yoga, pois requer mais força e resistência. O Vinyasa Yoga é ótimo para aumentar a resistência física, melhorar a circulação sanguínea e aumentar a energia." },
      { type: "h2", text: "Ashtanga Yoga" },
      { type: "paragraph", text: "O Ashtanga Yoga é uma prática mais avançada, com uma sequência fixa de posturas que são realizadas em um ritmo rápido. É um tipo de yoga muito físico e desafiador, que requer muita força, resistência e flexibilidade. O Ashtanga Yoga é ótimo para desenvolver maior força e flexibilidade, aumentar a consciência corporal e melhorar a respiração." },
      { type: "h2", text: "Bikram Yoga" },
      { type: "paragraph", text: "O Bikram Yoga, também conhecido como “yoga quente”, é realizado em uma sala aquecida a uma temperatura de cerca de 40 graus Celsius. A prática envolve uma sequência fixa de 26 posturas e duas técnicas de respiração. O Bikram Yoga é ótimo para aumentar a flexibilidade, melhorar a circulação sanguínea e reduzir o estresse." },
      { type: "h2", text: "Iyengar Yoga" },
      { type: "paragraph", text: "O Iyengar Yoga é uma prática mais precisa e focada na técnica, que enfatiza a correção postural e o uso de acessórios, como blocos e cintos. Este tipo de yoga é ótimo para desenvolver maior consciência corporal, melhorar a postura e reduzir o risco de lesões." },
      { type: "h2", text: "Como escolher o tipo de yoga certo para você" },
      { type: "paragraph", text: "Ao escolher o tipo de yoga que melhor se adapta às suas necessidades e objetivos, é importante considerar seu nível de experiência, condicionamento físico e saúde. Se você é iniciante, pode ser melhor começar com o Hatha Yoga antes de tentar praticar o Vinyasa ou Ashtanga Yoga. Se você tem problemas de saúde, como dores nas costas ou articulações, pode ser melhor escolher o Iyengar Yoga, que enfatiza a correção postural e o uso de acessórios. Se você está procurando um tipo de yoga mais desafiador, pode ser melhor escolher o Vinyasa ou Ashtanga Yoga." },
    ],
  },
  {
    slug: "yoga-saude-mental",
    title: "5 benefícios do yoga para a saúde mental",
    image: "/images/blog/yoga-saude-mental.png",
    date: "2022-08-08",
    excerpt: "O yoga é uma prática antiga que pode oferecer muitos benefícios para a saúde mental — reduzir o estresse, a ansiedade e a depressão, além da força física e da flexibilidade.",
    body: [
      { type: "paragraph", text: "O yoga é uma prática antiga que pode oferecer muitos benefícios para a saúde mental. Além de melhorar a flexibilidade e a força física, o yoga também pode ajudar a reduzir o estresse, a ansiedade e a depressão. Neste post, vamos explorar cinco benefícios do yoga para a saúde mental." },
      { type: "h2", text: "Redução do estresse" },
      { type: "paragraph", text: "O yoga pode ajudar a reduzir o estresse, que é uma das principais causas de problemas de saúde mental. A prática de yoga envolve técnicas de respiração e meditação que podem ajudar a acalmar a mente e o corpo. Além disso, a realização de posturas de yoga pode ajudar a liberar a tensão muscular e melhorar a circulação sanguínea." },
      { type: "h2", text: "Alívio da ansiedade" },
      { type: "paragraph", text: "A ansiedade é uma condição de saúde mental comum que pode ser tratada com yoga. A prática pode ajudar a acalmar a mente e o corpo, reduzir a frequência cardíaca e a pressão arterial e melhorar a sensação geral de bem-estar. Algumas posturas de yoga, como a postura do cachorro olhando para baixo e a postura da árvore, podem ajudar a melhorar a autoconfiança e a autoestima." },
      { type: "h2", text: "Melhoria da qualidade do sono" },
      { type: "paragraph", text: "A prática de yoga pode melhorar a qualidade do sono, que é crucial para a saúde mental. A realização de posturas pode ajudar a relaxar o corpo e a mente antes de dormir. Algumas técnicas de respiração, como a respiração diafragmática, podem ajudar a acalmar o sistema nervoso e melhorar a qualidade do sono." },
      { type: "h2", text: "Redução da depressão" },
      { type: "paragraph", text: "A depressão é uma condição de saúde mental grave que pode ser tratada com yoga. A prática pode ajudar a reduzir os sintomas da depressão, como a fadiga, a apatia e a tristeza. A meditação e as posturas de yoga podem ajudar a aumentar a produção de endorfinas, neurotransmissores responsáveis pela sensação de prazer e felicidade." },
      { type: "h2", text: "Aumento da sensação geral de bem-estar" },
      { type: "paragraph", text: "A prática de yoga pode melhorar a sensação geral de bem-estar mental. O yoga pode ajudar a melhorar a autoestima e a autoconfiança, reduzir o estresse e a ansiedade, e melhorar a qualidade do sono. A prática regular pode ajudar a desenvolver uma maior consciência corporal e uma maior conexão com a mente e o corpo." },
    ],
  },
  {
    slug: "oleos-essenciais-rotina",
    title: "Como usar óleos essenciais na rotina de cuidados pessoais",
    image: "/images/blog/oleos-essenciais-rotina.png",
    date: "2022-08-08",
    excerpt: "Óleos essenciais são extraídos de plantas e podem ser usados de diversas formas para melhorar a saúde e o bem-estar. Veja como incorporá-los na sua rotina diária.",
    body: [
      { type: "paragraph", text: "Óleos essenciais são extraídos de plantas e podem ser usados de diversas formas para melhorar a saúde e o bem-estar. Neste post, vamos explorar como incorporar óleos essenciais na rotina de cuidados pessoais para que você possa aproveitar seus benefícios." },
      { type: "h2", text: "Aromaterapia" },
      { type: "paragraph", text: "Uma das formas mais comuns de usar óleos essenciais é através da aromaterapia, que é a inalação dos aromas dos óleos para obter seus benefícios. Isso pode ser feito através de difusores de aromas, que espalham o aroma no ambiente, ou através de inalação direta." },
      { type: "paragraph", text: "Alguns óleos essenciais que são adequados para a aromaterapia incluem: Lavanda — ajuda a acalmar e relaxar a mente e o corpo. Hortelã-pimenta — estimula a mente e ajuda a aliviar a dor. Limão — refrescante e revigorante, ótimo para a limpeza do ambiente. Eucalipto — ajuda a aliviar a congestão nasal e a promover a respiração." },
      { type: "h2", text: "Massagens" },
      { type: "paragraph", text: "Outra forma popular de usar óleos essenciais é através de massagens. Adicionando algumas gotas de óleo essencial a um óleo carreador, como óleo de coco ou amêndoas, você pode criar uma mistura personalizada para ajudar a relaxar, aliviar a tensão muscular ou melhorar a circulação sanguínea." },
      { type: "paragraph", text: "Alguns óleos essenciais populares para massagens incluem: Camomila — ajuda a acalmar a mente e reduzir a ansiedade. Ylang-ylang — ajuda a aliviar a tensão muscular e promover o relaxamento. Bergamota — ajuda a equilibrar o humor e reduzir o estresse. Sândalo — ajuda a promover a calma e a sensação de bem-estar." },
      { type: "h2", text: "Banho de imersão" },
      { type: "paragraph", text: "Outra maneira de usar óleos essenciais é através de um banho de imersão. Adicione algumas gotas de óleo essencial na banheira e misture bem para criar um ambiente de spa em casa." },
      { type: "paragraph", text: "Alguns óleos essenciais populares para banhos de imersão incluem: Rosa — ajuda a acalmar a mente e promover a sensação de amor próprio. Patchouli — ajuda a promover a sensação de relaxamento e aliviar a tensão muscular. Laranja — refrescante e revigorante, é ótimo para estimular a mente e o corpo. Alecrim — ajuda a melhorar a circulação sanguínea e promover a sensação de bem-estar geral." },
      { type: "paragraph", text: "Se você está em busca de óleos essenciais de qualidade para incorporar na sua rotina de cuidados pessoais, confira a seleção de produtos da Elisa Hoeppers. Com uma variedade de óleos essenciais 100% puros e naturais, você pode criar suas próprias misturas personalizadas para ajudar a melhorar a saúde e o bem-estar." },
    ],
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
