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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pec-Deck-Fly.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Low-Cable-Crossover.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crossover.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/06/Rope-Pushdown.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Triceps-Extension.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2022/02/Barbell-Lying-Close-grip-Triceps-Extension.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bench-Dips.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Z-Bar-Preacher-Curl.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Concentration-Curl.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2015/11/Leg-Press.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2022/05/Lying-leg-curl.gif",
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
      "https://online.ironcult.ru/upragneniy/HIP-ADDUCTION-MACHINE.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Reverse-Curl.gif",
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
      "https://media.giphy.com/media/ssVByClVV45ikx1N1M/giphy.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/06/Dumbbell-Wrist-Curl.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
    execution:
      "De pé, eleve os halteres lateralmente com os cotovelos levemente flexionados até que os braços fiquem paralelos ao chão.",
    primary_muscles: ["Deltóide Lateral"],
    secondary_muscles: ["Deltóide Anterior", "Trapézio Superior"],
  },
  {
    id: "desenvolvimento-ombro",
    name: "Desenvolvimento com Halteres",
    category: "Ombros",
    equipment: "Halteres",
    gif_url:
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Front-Raise.gif",
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
      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Reverse-Fly.gif",
    execution:
      "Incline o tronco para a frente mantendo a coluna reta. Abra os braços lateralmente erguendo os halteres e esmagando o deltoide posterior.",
    primary_muscles: ["Deltóide Posterior"],
    secondary_muscles: ["Rombóides", "Trapézio Médio/Inferior"],
  },
  {
    id: "mobilidade-tornozelo",
    name: "Mobilidade de Tornozelo em Dorsiflexão",
    category: "Mobilidade",
    equipment: "Peso corporal",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Standing-Dorsiflexion.gif",
    execution: "Em pé, avance um pé e leve o joelho à frente sobre os dedos sem retirar o calcanhar do chão. Retorne de forma controlada.",
    primary_muscles: ["Sóleo", "Gastrocnêmio"],
    secondary_muscles: ["Tibial Anterior"],
  },
  {
    id: "agachamento-em-pe",
    name: "Agachamento Livre",
    category: "Pernas",
    equipment: "Peso corporal",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/05/bodyweight-squat-full-version.gif",
    execution: "Em pé, pés na largura dos ombros. Flexione quadris e joelhos mantendo o tronco estável e retorne à posição inicial.",
    primary_muscles: ["Quadríceps Femoral", "Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Adutores", "Core"],
  },
  {
    id: "avanco-alternado",
    name: "Afundo Alternado",
    category: "Pernas",
    equipment: "Peso corporal",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif",
    execution: "Dê um passo à frente alternando as pernas, flexione ambos os joelhos de forma controlada e retorne à posição em pé.",
    primary_muscles: ["Quadríceps Femoral", "Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Adutores"],
  },
  {
    id: "abdominal-flutter-kick",
    name: "Abdominal Flutter Kick",
    category: "Abdômen",
    equipment: "Peso corporal",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Flutter-Kicks.gif",
    execution: "Deitado, mantenha as pernas estendidas e faça movimentos alternados de pequena amplitude para cima e para baixo, mantendo o abdômen contraído.",
    primary_muscles: ["Reto Abdominal"],
    secondary_muscles: ["Flexores do Quadril"],
  },
  {
    id: "simulador-de-escada",
    name: "Simulador de Escada",
    category: "Cardio",
    equipment: "Máquina",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/10/Walking-on-Stepmill.gif",
    execution: "Suba os degraus de forma contínua, mantendo postura ereta e ritmo controlado. Evite apoiar excessivamente o peso nos braços.",
    primary_muscles: ["Quadríceps Femoral", "Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Panturrilhas"],
  },
  {
    id: "puxada-frontal-polia",
    name: "Puxada Frontal na Polia",
    category: "Costas",
    equipment: "Polia",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
    execution: "Segure a barra com pegada pronada e puxe-a em direção à parte superior do peito, conduzindo os cotovelos para baixo.",
    primary_muscles: ["Latíssimo do Dorso"],
    secondary_muscles: ["Bíceps Braquial", "Redondo Maior", "Trapézio Inferior"],
  },
  {
    id: "remada-curvada-crossover",
    name: "Remada Curvada na Polia",
    category: "Costas",
    equipment: "Polia",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/09/Cable-Bent-Over-Row.gif",
    execution: "Incline o tronco mantendo a coluna neutra. Puxe o cabo em direção ao abdômen, aproximando as escápulas e controlando a volta.",
    primary_muscles: ["Latíssimo do Dorso", "Rombóides"],
    secondary_muscles: ["Trapézio Médio", "Bíceps Braquial", "Deltoide Posterior"],
  },
  {
    id: "rosca-direta-barra-w",
    name: "Rosca Direta com Barra W",
    category: "Braços",
    equipment: "Barra W",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Z-Bar-Curl.gif",
    execution: "Em pé, segure a barra W com pegada supinada. Flexione os cotovelos mantendo-os próximos ao corpo e retorne lentamente.",
    primary_muscles: ["Bíceps Braquial"],
    secondary_muscles: ["Braquial", "Braquiorradial"],
  },
  {
    id: "supino-vertical-maquina",
    name: "Supino Vertical na Máquina",
    category: "Peito",
    equipment: "Máquina",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Chest-Press-Machine.gif",
    execution: "Ajuste o assento para que as alças fiquem na altura do meio do peito. Empurre as manoplas à frente e retorne de forma controlada.",
    primary_muscles: ["Peitoral Maior"],
    secondary_muscles: ["Deltóide Anterior", "Tríceps Braquial"],
  },
  {
    id: "desenvolvimento-halteres",
    name: "Desenvolvimento com Halteres",
    category: "Ombros",
    equipment: "Halteres",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
    execution: "Sentado, inicie com os halteres na altura dos ombros e empurre verticalmente até quase estender os cotovelos. Retorne controlando a carga.",
    primary_muscles: ["Deltóide Anterior", "Deltóide Lateral"],
    secondary_muscles: ["Tríceps Braquial", "Trapézio Superior"],
  },
  {
    id: "triceps-crossover",
    name: "Tríceps na Polia Cruzada",
    category: "Braços",
    equipment: "Polia",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Cable-Crossover-Triceps-Extension.gif",
    execution: "Posicione-se entre as polias, mantenha os cotovelos próximos ao corpo e estenda os braços para baixo e para trás de forma controlada.",
    primary_muscles: ["Tríceps Braquial"],
    secondary_muscles: ["Ancôneo"],
  },
  {
    id: "abdominal-rolo",
    name: "Abdominal com Rolo",
    category: "Abdômen",
    equipment: "Rolo Abdominal",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Ab-Wheel-Rollout.gif",
    execution: "Ajoelhe-se segurando o rolo. Deslize para frente mantendo o tronco firme e retorne usando a musculatura abdominal.",
    primary_muscles: ["Reto Abdominal"],
    secondary_muscles: ["Oblíquos", "Eretores da Espinha", "Latíssimo do Dorso"],
  },
  {
    id: "esteira",
    name: "Esteira",
    category: "Cardio",
    equipment: "Esteira",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/06/Treadmill-.gif",
    execution: "Caminhe ou corra na esteira com postura ereta, mantendo velocidade e inclinação adequadas ao objetivo do treino.",
    primary_muscles: ["Quadríceps Femoral", "Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Panturrilhas"],
  },
  {
    id: "agachamento-bulgaro",
    name: "Agachamento Búlgaro",
    category: "Pernas",
    equipment: "Banco e Halteres",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/05/Dumbbell-Bulgarian-Split-Squat.gif",
    execution: "Apoie o peito do pé traseiro em um banco. Flexione o joelho da perna da frente mantendo o tronco estável e retorne.",
    primary_muscles: ["Quadríceps Femoral", "Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Adutores"],
  },
  {
    id: "levantamento-terra-sumo",
    name: "Levantamento Terra Sumô",
    category: "Pernas",
    equipment: "Barra",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2021/04/Barbell-Sumo-Deadlift.gif",
    execution: "Adote base ampla e pontas dos pés levemente para fora. Flexione quadris e joelhos, mantenha a coluna neutra e eleve a barra estendendo quadris e joelhos.",
    primary_muscles: ["Glúteo Máximo", "Adutores", "Isquiocrurais"],
    secondary_muscles: ["Quadríceps Femoral", "Eretores da Espinha", "Trapézio"],
  },
  {
    id: "elevacao-pelvica-aparelho",
    name: "Elevação Pélvica na Máquina",
    category: "Glúteos",
    equipment: "Máquina",
    gif_url: "https://fitnessprogramer.com/wp-content/uploads/2022/02/Hip-Thrust-Machine.gif",
    execution: "Apoie as costas e ajuste a máquina. Empurre o quadril para cima até alinhar tronco e coxas, contraindo os glúteos no topo.",
    primary_muscles: ["Glúteo Máximo"],
    secondary_muscles: ["Isquiocrurais", "Adutor Magno"],
  },
  {
    id: "abducao-deitado-caneleira",
    name: "Abdução de Quadril Deitado com Caneleira",
    category: "Glúteos",
    equipment: "Caneleira",
    gif_url: "https://pub-7c14918da31d450e8d6787a3c225c277.r2.dev/gifs/720/4051.webp",
    execution: "Deite-se de lado, mantenha a perna de cima estendida e eleve-a lateralmente contra a resistência da caneleira. Retorne lentamente.",
    primary_muscles: ["Glúteo Médio"],
    secondary_muscles: ["Glúteo Mínimo", "Tensor da Fáscia Lata"],
  },
  {
    id: "abdominal-supra-halteres",
    name: "Abdominal Supra com Halter",
    category: "Abdômen",
    equipment: "Halter",
    gif_url: "https://exercises.loadmuscle.com/gifs/720/4734.webp",
    execution: "Deitado, segure o halter junto ao peito. Flexione o tronco elevando as escápulas do banco/chão e retorne de forma controlada.",
    primary_muscles: ["Reto Abdominal"],
    secondary_muscles: ["Oblíquos", "Flexores do Quadril"],
  },
  {
    id: "bike-spinning",
    name: "Bicicleta de Spinning",
    category: "Cardio",
    equipment: "Bicicleta de Spinning",
    gif_url: "https://gifdb.com/images/branded/high/spinning-stationary-bike-1gqvmeucgjr1y2qr.gif",
    execution: "Ajuste banco e guidão. Pedale mantendo cadência estável e resistência compatível com a intensidade planejada.",
    primary_muscles: ["Quadríceps Femoral"],
    secondary_muscles: ["Glúteo Máximo", "Isquiocrurais", "Panturrilhas"],
  },
];

export const CATEGORIES = Array.from(
  new Set(EXERCISE_DB.map((e) => e.category)),
).sort();
