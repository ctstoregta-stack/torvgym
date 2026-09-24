import type { Exercise } from "@/lib/types";

/**
 * Banco de exercícios inicial (pré-carregado).
 * Novos exercícios (inclusive os criados pelo usuário) seguem exatamente
 * o mesmo formato, incluindo `gif_url` para a animação em loop.
 */
export const EXERCISE_DB: Exercise[] = [
  {
    id: "supino-inclinado-halteres",
    name: "Supino Inclinado com Halteres",
    category: "Peito",
    equipment: "Halteres",
    gif_url:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0N3J0Z3k4dWZ0MTk1bTRpYTNpaXN0Mms0Y2hxNWpjdW5yMG9vYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7qE0g9g9gi07X97y/giphy.gif",
    execution:
      "Regule o banco a 30-45 graus. Deite-se e empurre os halteres verticalmente a partir da linha do peito superior até a extensão total dos braços.",
    primary_muscles: ["Peitoral Maior (Superior)"],
    secondary_muscles: ["Deltóide Anterior", "Tríceps Braquial"],
  },
  {
    id: "voador",
    name: "Voador (Pec Deck)",
    category: "Peito",
    equipment: "Máquina",
    gif_url:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZocnVpOTl4NXhnbWR0OHZib2M2ZmlyeGg1b2g4am13cDY2eWZ3biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt8bS2Z3wZ00N2o/giphy.gif",
    execution:
      "Sente-se com as costas totalmente apoiadas. Segure as hastes verticais e feche os braços em frente ao corpo, esmagando o peitoral no ponto máximo.",
    primary_muscles: ["Peitoral Maior"],
    secondary_muscles: ["Deltóide Anterior"],
  },
  {
    id: "crucifixo-polia-baixa",
    name: "Crucifixo na Polia Baixa",
    category: "Peito",
    equipment: "Polia",
    gif_url:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80",
    execution:
      "Posicione as polias embaixo. Puxe os cabos de baixo para cima e para o centro, encontrando as mãos na altura do peito superior.",
    primary_muscles: ["Peitoral Maior (Superior)", "Deltóide Anterior"],
    secondary_muscles: ["Bíceps Braquial (Cabeça Curta)"],
  },
  {
    id: "crucifixo-polia-alta",
    name: "Crucifixo na Polia Alta (Crossover)",
    category: "Peito",
    equipment: "Polia",
    gif_url:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&q=80",
    execution:
      "Ajuste as polias no topo. Traga os cabos de cima para baixo cruzando-os levemente à frente da cintura, focando na porção inferior do peito.",
    primary_muscles: ["Peitoral Maior (Inferior)"],
    secondary_muscles: ["Deltóide Anterior", "Serrátil Anterior"],
  },
  {
    id: "triceps-polia-alta",
    name: "Tríceps na Polia Alta",
    category: "Braços",
    equipment: "Polia",
    gif_url:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=500&q=80",
    execution:
      "Mantenha os cotovelos fixos ao lado do corpo. Estenda completamente os braços empurrando a barra ou corda em direção ao chão.",
    primary_muscles: ["Tríceps Braquial"],
    secondary_muscles: ["Ancôneo"],
  },
  {
    id: "triceps-frances",
    name: "Tríceps Francês",
    category: "Braços",
    equipment: "Halteres",
    gif_url:
      "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=500&q=80",
    execution:
      "Segure o halter acima da cabeça com as duas mãos. Flexione os cotovelos descendo o peso atrás da nuca e estenda de volta para o topo.",
    primary_muscles: ["Tríceps Braquial (Cabeça Longa)"],
    secondary_muscles: ["Ancôneo"],
  },
  {
    id: "triceps-testa",
    name: "Tríceps Testa",
    category: "Braços",
    equipment: "Barras",
    gif_url:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80",
    execution:
      "Deitado no banco, segure a barra com os braços estendidos. Flexione apenas os cotovelos trazendo a barra em direção à testa.",
    primary_muscles: ["Tríceps Braquial"],
    secondary_muscles: ["Ancôneo", "Extensores do Punho"],
  },
  {
    id: "triceps-mergulho",
    name: "Tríceps Mergulho (Banco)",
    category: "Braços",
    equipment: "Corporal",
    gif_url:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=500&q=80",
    execution:
      "Apoie as mãos na borda do banco com as pernas estendidas à frente. Desça o quadril flexionando os cotovelos até 90 graus e empurre.",
    primary_muscles: ["Tríceps Braquial"],
    secondary_muscles: ["Deltóide Anterior", "Peitoral Maior"],
  },
  {
    id: "remada-baixa-pegada-aberta",
    name: "Remada Baixa (Pegada Aberta)",
    category: "Costas",
    equipment: "Polia",
    gif_url:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80",
    execution:
      "Segure a barra longa com pegada aberta na polia baixa. Puxe em direção ao abdômen superior abrindo os cotovelos e retraindo as escápulas.",
    primary_muscles: ["Latíssimo do Dorso", "Deltoide Posterior"],
    secondary_muscles: ["Trapézio Médio", "Rombóides", "Bíceps"],
  },
  {
    id: "remada-baixa-pegada-fechada",
    name: "Remada Baixa (Pegada Fechada)",
    category: "Costas",
    equipment: "Polia",
    gif_url:
      "https://images.unsplash.com/photo-1605296867424-35fc25c9542d?w=500&q=80",
    execution:
      "Use o puxador triângulo. Puxe a carga rente ao corpo trazendo o triângulo em direção ao umbigo mantendo os cotovelos fechados.",
    primary_muscles: ["Latíssimo do Dorso", "Grande Dorsal"],
    secondary_muscles: ["Rombóides", "Trapézio Inferior", "Bíceps Braquial"],
  },
  {
    id: "puxada-maquina",
    name: "Puxada na Máquina",
    category: "Costas",
    equipment: "Máquina",
    gif_url:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80",
    execution:
      "Ajuste o banco e os apoios de coxa. Segure as manoplas superiores e puxe verticalmente para baixo direcionando os cotovelos aos quadris.",
    primary_muscles: ["Latíssimo do Dorso"],
    secondary_muscles: ["Redondo Maior", "Bíceps Braquial", "Trapézio"],
  },
  {
    id: "rosca-scott-barra-w",
    name: "Rosca Scott com Barra W",
    category: "Braços",
    equipment: "Barras",
    gif_url:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&q=80",
    execution:
      "Apoie os braços completamente na almofada do banco Scott. Segure a barra W e faça a flexão dos cotovelos sem tirar os braços do apoio.",
    primary_muscles: ["Bíceps Braquial (Foco Cabeça Longa)"],
    secondary_muscles: ["Braquial", "Braquiorradial"],
  },
  {
    id: "rosca-concentrada",
    name: "Rosca Concentrada",
    category: "Braços",
    equipment: "Halteres",
    gif_url:
      "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=500&q=80",
    execution:
      "Sentado, apoie o cotovelo na parte interna da coxa correspondente. Flexione o braço trazendo o halter em direção ao ombro de forma isolada.",
    primary_muscles: ["Bíceps Braquial"],
    secondary_muscles: ["Braquial"],
  },
  {
    id: "rosca-martelo",
    name: "Rosca Martelo",
    category: "Braços",
    equipment: "Halteres",
    gif_url:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&q=80",
    execution:
      "De pé ou sentado, segure os halteres com a pegada neutra (palmas voltadas para dentro). Flexione os cotovelos mantendo a pegada fixa.",
    primary_muscles: ["Braquiorradial", "Bíceps Braquial"],
    secondary_muscles: ["Braquial"],
  },
  {
    id: "leg-press",
    name: "Leg Press 45°",
    category: "Pernas",
    equipment: "Máquina",
    gif_url:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80",
    execution:
      "Apoie as costas no assento e posicione os pés na plataforma. Destrave o peso, flexione os joelhos até 90 graus e empurre sem estender totalmente.",
    primary_muscles: ["Quadríceps Femoral"],
    secondary_muscles: ["Glúteo Máximo", "Isquiocrurais", "Panturrilhas"],
  },
  {
    id: "cadeira-extensora",
    name: "Cadeira Extensora",
    category: "Pernas",
    equipment: "Máquina",
    gif_url:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=500&q=80",
    execution:
      "Sente-se e ajuste o rolo de espuma sobre o tornozelo. Estenda completamente as pernas para cima, contraindo o quadríceps, e retorne devagar.",
    primary_muscles: ["Quadríceps Femoral"],
    secondary_muscles: ["Nenhum (Isolado)"],
  },
  {
    id: "agachamento-barra",
    name: "Agachamento Livre com Barra",
    category: "Pernas",
    equipment: "Barras",
    gif_url:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80",
    execution:
      "Apoie a barra no trapézio. Afaste os pés na largura dos ombros, agache empurrando o quadril para trás até as coxas ficarem paralelas ao chão e suba.",
    primary_muscles: ["Quadríceps Femoral", "Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Eretores da Espinha", "Core"],
  },
  {
    id: "mesa-flexora",
    name: "Mesa Flexora",
    category: "Pernas",
    equipment: "Máquina",
    gif_url:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80",
    execution:
      "Deite de bruços na mesa e posicione o rolo atrás dos calcanhares. Flexione os joelhos trazendo os calcanhares em direção ao glúteo.",
    primary_muscles: ["Isquiocrurais (Posteriores de Coxa)"],
    secondary_muscles: ["Gastrocnêmio (Panturrilha)"],
  },
  {
    id: "cadeira-adutora",
    name: "Cadeira Adutora",
    category: "Pernas",
    equipment: "Máquina",
    gif_url:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=500&q=80",
    execution:
      "Sente-se com as pernas afastadas apoiadas nas almofadas internas. Faça força para fechar as pernas aproximando os joelhos no centro.",
    primary_muscles: ["Adutores da Coxa"],
    secondary_muscles: ["Pectíneo", "Grácil"],
  },
  {
    id: "rosca-inversa-barra-w",
    name: "Rosca Inversa na Barra W",
    category: "Braços",
    equipment: "Barras",
    gif_url:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80",
    execution:
      "Segure a barra W com pegada pronada (palmas para baixo). Flexione os cotovelos elevando a barra, focando na musculatura do antebraço.",
    primary_muscles: ["Braquiorradial", "Extensores dos Dedos/Punho"],
    secondary_muscles: ["Braquial", "Bíceps Braquial"],
  },
  {
    id: "extensao-punho",
    name: "Extensão de Punho",
    category: "Braços",
    equipment: "Barras",
    gif_url:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&q=80",
    execution:
      "Apoie os antebraços em um banco deixando as mãos livres com as palmas para baixo. Movimente apenas os punhos para cima estendendo-os.",
    primary_muscles: ["Extensores do Punho"],
    secondary_muscles: ["Extensores dos Dedos"],
  },
  {
    id: "flexao-punho-barra",
    name: "Flexão de Punho na Barra",
    category: "Braços",
    equipment: "Barras",
    gif_url:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&q=80",
    execution:
      "Apoie os antebraços no banco com as palmas voltadas para cima. Flexione os punhos trazendo a barra para cima, contraindo a parte interna do antebraço.",
    primary_muscles: ["Flexores do Punho"],
    secondary_muscles: ["Flexor Profundo dos Dedos"],
  },
  {
    id: "elevacao-lateral-halteres",
    name: "Elevação Lateral com Halteres",
    category: "Ombros",
    equipment: "Halteres",
    gif_url:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=500&q=80",
    execution:
      "De pé, eleve os halteres lateralmente com os cotovelos levemente flexionados até que os braços fiquem paralelos ao chão.",
    primary_muscles: ["Deltóide Lateral"],
    secondary_muscles: ["Deltóide Anterior", "Trapézio Superior"],
  },
  {
    id: "desenvolvimento-ombro",
    name: "Desenvolvimento de Ombro",
    category: "Ombros",
    equipment: "Halteres",
    gif_url:
      "https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=500&q=80",
    execution:
      "Sentado com apoio nas costas, inicie com os halteres na altura das orelhas e empurre-os verticalmente até estender os braços completamente.",
    primary_muscles: ["Deltóide Anterior", "Deltóide Lateral"],
    secondary_muscles: ["Tríceps Braquial", "Trapézio", "Serrátil Anterior"],
  },
  {
    id: "elevacao-frontal-corda",
    name: "Elevação Frontal com Corda",
    category: "Ombros",
    equipment: "Polia",
    gif_url:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=500&q=80",
    execution:
      "De costas para a polia baixa, segure a corda por entre as pernas. Eleve os braços esticados à frente até a altura dos olhos.",
    primary_muscles: ["Deltóide Anterior"],
    secondary_muscles: ["Peitoral Maior (Superior)", "Deltóide Lateral"],
  },
  {
    id: "crucifixo-invertido",
    name: "Crucifixo Invertido",
    category: "Ombros",
    equipment: "Halteres",
    gif_url:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80",
    execution:
      "Incline o tronco para a frente mantendo a coluna reta. Abra os braços lateralmente erguendo os halteres e esmagando o deltoide posterior.",
    primary_muscles: ["Deltóide Posterior"],
    secondary_muscles: ["Rombóides", "Trapézio Médio/Inferior"],
  },
];

export const CATEGORIES = Array.from(
  new Set(EXERCISE_DB.map((e) => e.category)),
).sort();
