/**
 * PH3A — gerador de textos (templates locais ou Gemini).
 * Gemini: abra via http://localhost:8080 se file:// bloquear API.
 */

const CUBO_PH = `CUBO-PH é um cubo robô fofo ~1:1:1, cantos arredondados. Corpo charcoal/preto fosco com bordas e detalhes laranja PH3A #E94E1B (glow suave). Face = tela no cubo com dois olhos grandes kawaii/Pixar 2D, boca simples. Antena preta + esfera laranja no topo. Braços e pernas curtos flutuantes com anéis laranja nas juntas. Flutua sobre nuvem cream #F5F1EA ou sombra suave.

Estilo: ilustração 2D flat editorial tech-cute (NÃO 3D metálico).
Fundo: charcoal #1a1a1a + blobs orgânicos laranja nos cantos.
Textos: cream #F5F1EA, destaques laranja. Sans bold arredondada. 16:9.`;

const RULES = `Regras:
• Poder do cubo: pulso/onda circular SUAVE laranja. SEM raio, lightning, arco elétrico.
• IDIOMA: português do Brasil (pt-BR). Proibido inglês (nunca "by PH3A").
• ORTOGRAFIA: renderizar textos EXATAMENTE entre aspas, sem typos.
• SEM CPF, CNPJ, nomes, e-mails, telefones reais. SEM pessoas fotorealistas.`;

const DEFAULT_TAGLINES = {
  datatag: "Você não precisa de mais leads. Precisa dos certos.",
  datafraud: "Executa sua política de risco.",
  databusca: "Dados completos. Decisões certas.",
  datadossie: "Inteligência de risco, reputação e compliance.",
  datacob: "Cobrança e crédito com dados que recuperam receita.",
  datarc6: "Conformidade RC6 com trilha e governança.",
  generic: "Inteligência de dados que gera resultado.",
};

/** @type {{ id: string, label: string, scenes: object, narration: string }[]} */
let narratives = [];
let selectedIndex = -1;
/** @type {{ name: string, content: string }[]} */
let outputFiles = [];
let activeTab = 0;
const $ = (id) => document.getElementById(id);

function detectProfile(text) {
  const t = text.toLowerCase();
  if (/\bdatarc6\b|\brc6\b|resolução conjunta/i.test(t)) return "datarc6";
  if (/\bdatacob\b|cobrança|recuperação de crédito|inadimplência/i.test(t)) return "datacob";
  if (/\bdatadossi[eê]\b|dossiê|screening|reputação.*compliance|due diligence/i.test(t))
    return "datadossie";
  if (/\bdatatag\b|visitantes anônimos|lead scoring|cac\b.*cpl/i.test(t)) return "datatag";
  if (/\bdatafraud\b|antifraude|política de risco|workflow.*decisão/i.test(t)) return "datafraud";
  if (/\bdatabusca\b|enriquecimento|localize pf|big data.*pf/i.test(t)) return "databusca";
  return "generic";
}

function extractTagline(text) {
  const patterns = [
    /SLOGAN[^:]*:\s*["“]([^"”]+)["”]/i,
    /tagline[^:]*:\s*["“]([^"”]+)["”]/i,
    /["“]([^"”]{12,90})["”]\s*(?:VALORES|SEÇÃO|$)/i,
    /Precisa dos leads certos/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const s = (m[1] || m[0]).trim();
      if (s.length > 10 && s.length < 120) return s.replace(/^["“]|["”]$/g, "");
    }
  }
  if (/precisa dos certos/i.test(text)) return DEFAULT_TAGLINES.datatag;
  if (/política de risco/i.test(text) && !/datadossi/i.test(text)) return DEFAULT_TAGLINES.datafraud;
  if (/decisões certas/i.test(text)) return DEFAULT_TAGLINES.databusca;
  if (/reputação e compliance/i.test(text)) return DEFAULT_TAGLINES.datadossie;
  if (/recuperam receita/i.test(text)) return DEFAULT_TAGLINES.datacob;
  if (/conformidade rc6/i.test(text)) return DEFAULT_TAGLINES.datarc6;
  return "";
}

function extractProductName(text, filename) {
  const fromFile = filename && filename.match(/([a-z]+)-base\.txt/i);
  if (fromFile) return displayName(fromFile[1]);
  const m = text.match(/^(DATATAG|DATAFRAUD|DATABUSCA|DATADOSSI[EÊ]|DATACOB|DATARC6)/im);
  if (m) return displayName(m[1]);
  const m2 = text.match(/BASE DE CONHECIMENTO\s*-\s*(\w+)/i);
  if (m2) return displayName(m2[1]);
  return "PRODUTO";
}

function displayName(raw) {
  const map = {
    datatag: "DATATAG",
    datafraud: "DATAFRAUD",
    databusca: "DATABUSCA",
    datadossie: "DATADOSSIÊ",
    datadossiê: "DATADOSSIÊ",
    datacob: "DATACOB",
    datarc6: "DATARC6",
  };
  const key = raw.toLowerCase().normalize("NFD").replace(/\u0307/g, "").replace(/ê/g, "e");
  if (map[key]) return map[key];
  const norm = raw.toUpperCase().replace(/\s/g, "");
  if (norm === "DATADOSSIE") return "DATADOSSIÊ";
  return norm;
}

function buildNarratives(profile, productDisplay, tagline) {
  const banks = {
    datatag: [
      {
        label: "Volume sem valor",
        scenes: {
          c1t: "VOLUME SEM VALOR",
          c1s: "Muitos leads. Pouca conversão.",
          c2t: "INTELIGÊNCIA NO SEU TRÁFEGO",
          c2f: ["Visitante", "Identidade", "Score", "Prioridade"],
          c3a: "LEADS CERTOS, PRIMEIRO",
          c3b: "FOCO EM CAC, NÃO EM CPL",
        },
        narration:
          "Volume de leads não é resultado. O DataTag identifica visitantes, pontua oportunidades e coloca os leads certos na frente.",
      },
      {
        label: "CPL ilusório",
        scenes: {
          c1t: "CPL BAIXO, CAC ALTO",
          c1s: "Métrica de vaidade, não de lucro.",
          c2t: "TAG + SCORE NO SITE",
          c2f: ["Tráfego", "Identidade", "Score", "Prioridade"],
          c3a: "OPORTUNIDADE REAL",
          c3b: "MENOS DESPERDÍCIO DE MÍDIA",
        },
        narration:
          "CPL baixo engana. O DataTag revela quem realmente pode comprar e prioriza o que importa para o CAC.",
      },
      {
        label: "Visitantes invisíveis",
        scenes: {
          c1t: "TRÁFEGO ANÔNIMO",
          c1s: "Mais de 90% saem sem deixar dados.",
          c2t: "IDENTIFIQUE EM TEMPO REAL",
          c2f: ["Visitante", "Identidade", "Score", "Prioridade"],
          c3a: "VISITANTE vira LEAD",
          c3b: "ATÉ 50% IDENTIFICADOS",
        },
        narration:
          "A maior parte do seu tráfego some sem rastro. O DataTag identifica visitantes e transforma anônimos em oportunidade.",
      },
      {
        label: "Marketing vs vendas",
        scenes: {
          c1t: "VOLUME NÃO CONVERSA",
          c1s: "Marketing mede lead. Vendas mede venda.",
          c2t: "UM FUNIL INTELIGENTE",
          c2f: ["Visitante", "Persona", "Score", "Prioridade"],
          c3a: "ALINHAMENTO REAL",
          c3b: "LEAD CERTO, CANAL CERTO",
        },
        narration:
          "Quando marketing e vendas falam línguas diferentes, o funil trinca. O DataTag alinha qualificação e prioridade em tempo real.",
      },
      {
        label: "Leads errados",
        scenes: {
          c1t: "LEADS QUE NÃO COMPRAM",
          c1s: "Curiosos, perfis frios, cadastros vazios.",
          c2t: "QUALIFICAÇÃO AUTOMÁTICA",
          c2f: ["Visitante", "Identidade", "Score", "Prioridade"],
          c3a: "ALTO POTENCIAL PRIMEIRO",
          c3b: "SDR NO LEAD CERTO",
        },
        narration:
          "Não faltam leads — faltam leads certos. O DataTag pontua fit, intenção e capacidade de pagamento.",
      },
      {
        label: "Campanha ampla demais",
        scenes: {
          c1t: "ALCANCE SEM QUALIDADE",
          c1s: "Cliques sem intenção de compra.",
          c2t: "PERSONAS NO COMANDO",
          c2f: ["Tráfego", "Persona", "Score", "Prioridade"],
          c3a: "MÍDIA MAIS EFICIENTE",
          c3b: "MENOS DESPERDÍCIO",
        },
        narration:
          "Alcance sem qualidade queima verba. O DataTag foca em quem realmente parece seu comprador ideal.",
      },
      {
        label: "SDR sobrecarregado",
        scenes: {
          c1t: "FILA CHEIA DE LEADS",
          c1s: "Time apagando incêndio.",
          c2t: "PRIORIDADE AUTOMÁTICA",
          c2f: ["Visitante", "Score", "Prioridade", "Ação"],
          c3a: "MELHOR LEAD PRIMEIRO",
          c3b: "MAIS FECHAMENTO",
        },
        narration:
          "SDR não precisa de mais volume — precisa da fila certa. O DataTag prioriza quem converte.",
      },
      {
        label: "Dado da plataforma só",
        scenes: {
          c1t: "ALGORITMO DA PLATAFORMA",
          c1s: "Você não controla o público.",
          c2t: "SEU BIG DATA, SEU FUNIL",
          c2f: ["Visitante", "Identidade", "Score", "Prioridade"],
          c3a: "AUDIÊNCIA PRÓPRIA",
          c3b: "MENOS DEPENDÊNCIA",
        },
        narration:
          "Depender só do algoritmo da mídia é aposta. O DataTag usa o Big Data PH3A no seu funil.",
      },
    ],
    datafraud: [
      {
        label: "Fraude em todo lugar",
        scenes: {
          c1t: "A FRAUDE ESTÁ EM TODO LUGAR",
          c1s: "Cadastros. Transações. Apps.",
          c2t: "SUA POLÍTICA DE RISCO",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "DECISÃO RASTREÁVEL",
          c3b: "MENOS FALSOS POSITIVOS",
        },
        narration:
          "A fraude está em todo lugar na internet. Com o DataFraud, sua política de risco vira um fluxo claro e rastreável.",
      },
      {
        label: "Decisão fragmentada",
        scenes: {
          c1t: "RISCO DESCENTRALIZADO",
          c1s: "Planilhas, sistemas, regras soltas.",
          c2t: "WORKFLOW UNIFICADO",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "CONTROLE DO CLIENTE",
          c3b: "SEM CAIXA-PRETA",
        },
        narration:
          "Política de risco espalhada gera brecha. O DataFraud orquestra cada decisão no fluxo que você define.",
      },
      {
        label: "Falsos positivos",
        scenes: {
          c1t: "BLOQUEIO NO LUGAR ERRADO",
          c1s: "Cliente bom travado. Fraude passa.",
          c2t: "SUA POLÍTICA DE RISCO",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "APROVAR · BLOQUEAR · QUARENTENA",
          c3b: "MENOS FRICÇÃO",
        },
        narration:
          "Antifraude genérico erra para os dois lados. O DataFraud executa a sua política — com transparência.",
      },
      {
        label: "Fraude evolui rápido",
        scenes: {
          c1t: "FRAUDE MUDA TODO DIA",
          c1s: "Regras fixas não acompanham.",
          c2t: "POLÍTICA AJUSTÁVEL",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "DEPLOY RÁPIDO",
          c3b: "VERSÃO RASTREÁVEL",
        },
        narration:
          "O padrão de fraude muda rápido. O DataFraud versiona e ajusta o fluxo sem depender só do fornecedor.",
      },
      {
        label: "Score de caixa-preta",
        scenes: {
          c1t: "VOCÊ NÃO VÊ A LÓGICA",
          c1s: "Só um score. Sem controle.",
          c2t: "SUA POLÍTICA DE RISCO",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "TRILHA AUDITÁVEL",
          c3b: "DECISÃO EXPLICÁVEL",
        },
        narration:
          "Consumir score sem dominar a lógica é arriscado. O DataFraud executa a política que você desenha.",
      },
      {
        label: "Transação suspeita",
        scenes: {
          c1t: "ALERTA SEM CONTEXTO",
          c1s: "Bloqueio ou liberação no escuro.",
          c2t: "CONTEXTO NO FLUXO",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "DECISÃO COM DADOS",
          c3b: "MENOS CHUTE",
        },
        narration:
          "Alerta sem contexto vira chute. O DataFraud enriquece o evento antes da decisão.",
      },
      {
        label: "Onboarding digital",
        scenes: {
          c1t: "CADASTRO FALSO",
          c1s: "Conta aberta em segundos.",
          c2t: "RISCO NO CADASTRO",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "BLOQUEIO PRECISO",
          c3b: "CLIENTE BOM PASSA",
        },
        narration:
          "Cadastro falso entra rápido. O DataFraud aplica sua política já no primeiro evento.",
      },
      {
        label: "Crédito e fraude",
        scenes: {
          c1t: "CRÉDITO COM RISCO",
          c1s: "Uma decisão, dois impactos.",
          c2t: "UM MOTOR, VÁRIOS FLUXOS",
          c2f: ["Evento", "Validação", "Dados", "Decisão"],
          c3a: "CRÉDITO E FRAUDE",
          c3b: "MESMA ORQUESTRAÇÃO",
        },
        narration:
          "Crédito e fraude no mesmo cadastro pedem orquestração. O DataFraud executa os dois no seu fluxo.",
      },
    ],
    databusca: [
      {
        label: "Dados incompletos",
        scenes: {
          c1t: "DADOS INCOMPLETOS",
          c1s: "Cadastro raso. Decisão travada.",
          c2t: "LOCALIZE PF E PJ",
          c2f: ["Consulta", "Busca", "Match", "Enriquecer"],
          c3a: "PERFIL ENRIQUECIDO",
          c3b: "300+ ATRIBUTOS",
        },
        narration:
          "Dados incompletos travam crédito e vendas. O DataBusca localiza e enriquece cadastros no Big Data PH3A.",
      },
      {
        label: "Cadastro desatualizado",
        scenes: {
          c1t: "DADOS DESATUALIZADOS",
          c1s: "Risco e oportunidade no escuro.",
          c2t: "BUSCA EM TEMPO REAL",
          c2f: ["Consulta", "Busca", "Match", "Enriquecer"],
          c3a: "CADASTRO COMPLETO",
          c3b: "DECISÃO SEGURA",
        },
        narration:
          "Cadastro velho custa caro. O DataBusca atualiza e completa o perfil antes da decisão.",
      },
      {
        label: "Múltiplas fontes",
        scenes: {
          c1t: "FONTES FRAGMENTADAS",
          c1s: "Cada time com um dado.",
          c2t: "UMA BUSCA, UM PERFIL",
          c2f: ["Consulta", "Busca", "Match", "Enriquecer"],
          c3a: "VISÃO ÚNICA",
          c3b: "CRÉDITO E VENDAS",
        },
        narration:
          "Informação espalhada atrasa tudo. O DataBusca unifica localização e enriquecimento em um fluxo.",
      },
      {
        label: "Compliance",
        scenes: {
          c1t: "DECISÃO SEM BASE",
          c1s: "Falta lastro de dados.",
          c2t: "LOCALIZE E COMPROVE",
          c2f: ["Consulta", "Busca", "Match", "Enriquecer"],
          c3a: "DADOS CONFIÁVEIS",
          c3b: "AUDITORIA FACILITADA",
        },
        narration:
          "Decidir sem dados confiáveis é exposição. O DataBusca entrega perfil completo para compliance e negócio.",
      },
      {
        label: "Prospecção lenta",
        scenes: {
          c1t: "PROSPECÇÃO MANUAL",
          c1s: "Horas até achar o contato.",
          c2t: "LOCALIZE EM SEGUNDOS",
          c2f: ["Consulta", "Busca", "Match", "Enriquecer"],
          c3a: "PERFIL PRONTO",
          c3b: "MAIS AGILIDADE",
        },
        narration:
          "Prospecção manual não escala. O DataBusca acelera localização e enriquecimento de PF e PJ.",
      },
      {
        label: "Duplicidade de cadastro",
        scenes: {
          c1t: "CADASTRO DUPLICADO",
          c1s: "Mesma pessoa, dados diferentes.",
          c2t: "MATCH E UNIFICA",
          c2f: ["Consulta", "Match", "Merge", "Enriquecer"],
          c3a: "BASE LIMPA",
          c3b: "MENOS ERRO",
        },
        narration:
          "Cadastro duplicado distorce tudo. O DataBusca localiza e unifica antes de decidir.",
      },
      {
        label: "Crédito na mesa",
        scenes: {
          c1t: "CRÉDITO SEM PERFIL",
          c1s: "Risco mal calculado.",
          c2t: "DADOS PARA CRÉDITO",
          c2f: ["Consulta", "Busca", "Enriquecer", "Decisão"],
          c3a: "PERFIL COMPLETO",
          c3b: "ANÁLISE SEGURA",
        },
        narration:
          "Crédito sem perfil completo é risco. O DataBusca entrega o cadastro que a análise precisa.",
      },
      {
        label: "Vendas B2B",
        scenes: {
          c1t: "CONTATO ERRADO",
          c1s: "PJ sem decisor certo.",
          c2t: "LOCALIZE A EMPRESA",
          c2f: ["Consulta", "PJ", "Vínculos", "Contato"],
          c3a: "DECISOR CERTO",
          c3b: "CICLO MAIS CURTO",
        },
        narration:
          "Vender para a empresa errada alonga o ciclo. O DataBusca acha PJ e vínculos que importam.",
      },
    ],
    datadossie: [
      {
        label: "Screening manual",
        scenes: {
          c1t: "SCREENING MANUAL",
          c1s: "Consultas fragmentadas. Semanas.",
          c2t: "DOSSIÊ UNIFICADO",
          c2f: ["Consulta", "Risco", "Reputação", "Decisão"],
          c3a: "VISÃO COMPLETA",
          c3b: "MENOS RETRABALHO",
        },
        narration:
          "Screening manual não escala. O DataDossiê consolida risco, reputação e compliance em um dossiê.",
      },
      {
        label: "Due diligence lenta",
        scenes: {
          c1t: "DUE DILIGENCE LENTA",
          c1s: "Contrato parado na mesa.",
          c2t: "ANÁLISE EM PROFUNDIDADE",
          c2f: ["PF/PJ", "Vínculos", "Alertas", "Parecer"],
          c3a: "DECISÃO MAIS RÁPIDA",
          c3b: "SEM PERDER PROFUNDIDADE",
        },
        narration:
          "Processo lento perde negócio; superficial aumenta risco. O DataDossiê equilibra velocidade e profundidade.",
      },
      {
        label: "Risco reputacional",
        scenes: {
          c1t: "RISCO REPUTACIONAL",
          c1s: "Descoberto tarde demais.",
          c2t: "SINAIS NO DOSSIÊ",
          c2f: ["Consulta", "Mídia", "Sanções", "Score"],
          c3a: "ALERTA ANTECIPADO",
          c3b: "COMPLIANCE ATIVO",
        },
        narration:
          "Dano reputacional e sanções custam mais que a operação. O DataDossiê antecipa sinais no cadastro.",
      },
      {
        label: "Onboarding arriscado",
        scenes: {
          c1t: "ONBOARDING NO ESCURO",
          c1s: "Parceiro sem lastro.",
          c2t: "KYC COM BIG DATA",
          c2f: ["Cadastro", "Vínculos", "Risco", "Aprovar"],
          c3a: "ENTRADA SEGURA",
          c3b: "AUDITORIA PRONTA",
        },
        narration:
          "Aprovar parceiro sem visão completa é exposição. O DataDossiê apoia KYC e onboarding com dados PH3A.",
      },
      {
        label: "Fontes em silos",
        scenes: {
          c1t: "DADO EM SILOS",
          c1s: "Crédito, fraude e compliance separados.",
          c2t: "UM DOSSIÊ SÓ",
          c2f: ["PF/PJ", "Risco", "Reputação", "Compliance"],
          c3a: "VISÃO ÚNICA",
          c3b: "DECISÃO ALINHADA",
        },
        narration:
          "Cada time com um pedaço da verdade. O DataDossiê une risco, reputação e compliance para decidir.",
      },
      {
        label: "Compliance pressionado",
        scenes: {
          c1t: "PRESSÃO REGULATÓRIA",
          c1s: "PLD, KYC, ESG sem processo.",
          c2t: "TRILHA NO DOSSIÊ",
          c2f: ["Consulta", "Listas", "Alertas", "Evidência"],
          c3a: "CONFORMIDADE",
          c3b: "EVIDÊNCIA DOCUMENTAL",
        },
        narration:
          "Regulação exige processo, não planilha. O DataDossiê documenta análise para auditoria e compliance.",
      },
      {
        label: "M&A e parcerias",
        scenes: {
          c1t: "PARCERIA SEM DOSSIÊ",
          c1s: "Due diligence superficial.",
          c2t: "INTELIGÊNCIA CADASTRAL",
          c2f: ["Empresa", "Sócios", "Vínculos", "Risco"],
          c3a: "NEGÓCIO SEGURO",
          c3b: "MENOS SURPRESA",
        },
        narration:
          "Comprar ou integrar sem dossiê é aposta. O DataDossiê entrega inteligência cadastral para M&A e B2B.",
      },
      {
        label: "Velocidade vs profundidade",
        scenes: {
          c1t: "RÁPIDO OU PROFUNDO",
          c1s: "Nunca os dois juntos.",
          c2t: "DOSSIÊ NA VELOCIDADE",
          c2f: ["Consulta", "Enriquecer", "Score", "Parecer"],
          c3a: "DECISÃO SEGURA",
          c3b: "MENOS GARGALO",
        },
        narration:
          "O dilema entre velocidade e profundidade acaba aqui. O DataDossiê acelera sem sacrificar análise.",
      },
    ],
    datacob: [
      {
        label: "Liga para todos",
        scenes: {
          c1t: "LIGA PARA TODOS",
          c1s: "Carteira enorme. Pouco retorno.",
          c2t: "PRIORIZE QUEM PAGA",
          c2f: ["Carteira", "Score", "Segmento", "Contato"],
          c3a: "MAIS RECUPERAÇÃO",
          c3b: "MENOS CUSTO POR LIGAÇÃO",
        },
        narration:
          "Cobrar todo mundo igual queima o time. O DataCob prioriza quem tem maior chance de acordo.",
      },
      {
        label: "Contato desatualizado",
        scenes: {
          c1t: "CONTATO ERRADO",
          c1s: "Telefone morto. Endereço antigo.",
          c2t: "ENRIQUEÇA E LIGUE",
          c2f: ["Inadimplente", "Enriquecer", "Canal", "Acordo"],
          c3a: "CADASTRO ATUAL",
          c3b: "MAIS CONTATO EFETIVO",
        },
        narration:
          "Sem dado certo, a cobrança não chega. O DataCob enriquece cadastro e escolhe o melhor canal.",
      },
      {
        label: "Recuperação baixa",
        scenes: {
          c1t: "RECUPERAÇÃO BAIXA",
          c1s: "Muito esforço, pouco caixa.",
          c2t: "SCORE DE RECUPERAÇÃO",
          c2f: ["Título", "Propensão", "Capacidade", "Ação"],
          c3a: "RECEITA DE VOLTA",
          c3b: "RÉGUA INTELIGENTE",
        },
        narration:
          "Recuperação não melhora com mais ligações — melhora com prioridade certa. O DataCob segmenta a carteira.",
      },
      {
        label: "Renegociação sem dado",
        scenes: {
          c1t: "RENEGOCIAÇÃO NO ESCURO",
          c1s: "Desconto sem critério.",
          c2t: "CRÉDITO ATUALIZADO",
          c2f: ["Dívida", "Perfil", "Capacidade", "Proposta"],
          c3a: "ACORDO JUSTO",
          c3b: "MENOS PREJUÍZO",
        },
        narration:
          "Renegociar sem perfil de crédito é chute. O DataCob cruza inadimplência com análise de capacidade.",
      },
      {
        label: "Carteira gigante",
        scenes: {
          c1t: "CARTEIRA IMPOSSÍVEL",
          c1s: "Headcount não acompanha.",
          c2t: "FILA AUTOMÁTICA",
          c2f: ["Entrada", "Score", "Prioridade", "Ação"],
          c3a: "FOCO NO QUE IMPORTA",
          c3b: "ESCALA SEM EQUIPE EXTRA",
        },
        narration:
          "Carteira que cresce mais que o time precisa de fila inteligente. O DataCob automatiza priorização.",
      },
      {
        label: "Estratégia única",
        scenes: {
          c1t: "MESMA RÉGUA PARA TODOS",
          c1s: "Perfil diferente, abordagem igual.",
          c2t: "SEGMENTAÇÃO REAL",
          c2f: ["Alta", "Média", "Baixa", "Canal"],
          c3a: "ABORDAGEM CERTA",
          c3b: "MAIS PROMESSA PAGA",
        },
        narration:
          "Uma régua só não recupera carteira diversa. O DataCob segmenta por propensão e capacidade.",
      },
      {
        label: "Custo por contato",
        scenes: {
          c1t: "CUSTO POR LIGAÇÃO",
          c1s: "Muito gasto, pouco acordo.",
          c2t: "CONTATO QUE CONVERTE",
          c2f: ["Score", "Canal", "Prioridade", "Resultado"],
          c3a: "ROI DA COBRANÇA",
          c3b: "MENOS DESPERDÍCIO",
        },
        narration:
          "Cada tentativa custa. O DataCob direciona esforço para quem realmente pode pagar.",
      },
      {
        label: "Crédito e cobrança",
        scenes: {
          c1t: "CRÉDITO E COBRANÇA SEPARADOS",
          c1s: "Mesmo cliente, dados diferentes.",
          c2t: "BIG DATA UNIFICADO",
          c2f: ["Análise", "Score", "Cobrança", "Acordo"],
          c3a: "VISÃO ÚNICA",
          c3b: "RECUPERAÇÃO INTELIGENTE",
        },
        narration:
          "Crédito e cobrança no mesmo Big Data PH3A. O DataCob une análise e recuperação na mesma base.",
      },
    ],
    datarc6: [
      {
        label: "Obrigação RC6",
        scenes: {
          c1t: "OBRIGAÇÃO RC6",
          c1s: "Regulatório não espera.",
          c2t: "REGISTRO E CONSULTA",
          c2f: ["Registro", "Consulta", "Trilha", "Evidência"],
          c3a: "CONFORMIDADE",
          c3b: "PROCESSO PADRONIZADO",
        },
        narration:
          "A RC6 é obrigação — não projeto opcional. O DataRC6 padroniza registro, consulta e evidência.",
      },
      {
        label: "Multa regulatória",
        scenes: {
          c1t: "RISCO DE MULTA",
          c1s: "Falha que vira sanção.",
          c2t: "RC6 SOB CONTROLE",
          c2f: ["Registro", "Consulta", "Log", "Relatório"],
          c3a: "MENOS EXPOSIÇÃO",
          c3b: "RESPOSTA AUDITÁVEL",
        },
        narration:
          "Falhar na RC6 custa multa e reputação. O DataRC6 mantém conformidade com trilha formal.",
      },
      {
        label: "Planilha sem trilha",
        scenes: {
          c1t: "PLANILHA SEM TRILHA",
          c1s: "Fiscalização pede prova.",
          c2t: "EVIDÊNCIA AUTOMÁTICA",
          c2f: ["Evento", "Registro", "Consulta", "Log"],
          c3a: "AUDITORIA PRONTA",
          c3b: "GOVERNANÇA REAL",
        },
        narration:
          "Planilha não prova conformidade. O DataRC6 gera evidência e logs para auditoria e compliance.",
      },
      {
        label: "Resposta lenta",
        scenes: {
          c1t: "CONSULTA DEMORADA",
          c1s: "Operação esperando RC6.",
          c2t: "RESPOSTA OPERACIONAL",
          c2f: ["Solicitação", "Consulta", "Retorno", "Registro"],
          c3a: "AGILIDADE COM CONTROLE",
          c3b: "SLA REGULATÓRIO",
        },
        narration:
          "Consulta RC6 lenta trava a operação. O DataRC6 entrega resposta padronizada e rastreável.",
      },
      {
        label: "Processo manual",
        scenes: {
          c1t: "RC6 MANUAL",
          c1s: "Retrabalho entre áreas.",
          c2t: "FLUXO PADRONIZADO",
          c2f: ["Compliance", "TI", "Operação", "RC6"],
          c3a: "UM PROCESSO SÓ",
          c3b: "MENOS ERRO HUMANO",
        },
        narration:
          "RC6 manual entre compliance e TI não escala. O DataRC6 unifica o fluxo regulatório.",
      },
      {
        label: "Evidência formal",
        scenes: {
          c1t: "SEM EVIDÊNCIA",
          c1s: "Difícil provar conformidade.",
          c2t: "TRILHA RC6",
          c2f: ["Registro", "Consulta", "Log", "Relatório"],
          c3a: "PROVA DOCUMENTAL",
          c3b: "FISCALIZAÇÃO TRANQUILA",
        },
        narration:
          "Conformidade exige evidência, não boa intenção. O DataRC6 documenta cada registro e consulta.",
      },
      {
        label: "Produto atômico",
        scenes: {
          c1t: "RC6 É OBRIGATÓRIO",
          c1s: "Escopo claro. Sem rodeio.",
          c2t: "INFRAESTRUTURA RC6",
          c2f: ["Registro", "Consulta", "Governança", "ISO"],
          c3a: "IMPLEMENTAÇÃO CLARA",
          c3b: "FOCO REGULATÓRIO",
        },
        narration:
          "O DataRC6 é produto atômico: infraestrutura regulatória RC6, com escopo e governança definidos.",
      },
      {
        label: "Integração ecossistema",
        scenes: {
          c1t: "SISTEMAS DESCONECTADOS",
          c1s: "RC6 fora do fluxo.",
          c2t: "RC6 NO ECOSSISTEMA",
          c2f: ["Registro", "Consulta", "PH3A", "Governança"],
          c3a: "PADRÃO PH3A",
          c3b: "SEGURANÇA E LGPD",
        },
        narration:
          "RC6 integrado ao ecossistema PH3A, com segurança e governança — sem confundir com antifraude comercial.",
      },
    ],
    generic: [
      {
        label: "Problema claro",
        scenes: {
          c1t: "O PROBLEMA É REAL",
          c1s: "Processo lento e caro.",
          c2t: "SOLUÇÃO PH3A",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "RESULTADO MENSURÁVEL",
          c3b: "MAIS EFICIÊNCIA",
        },
        narration: "O problema custa caro todos os dias. A PH3A entrega inteligência de dados com resultado real.",
      },
      {
        label: "Dados sem ação",
        scenes: {
          c1t: "DADO SEM DECISÃO",
          c1s: "Relatório que ninguém usa.",
          c2t: "INTELIGÊNCIA ATIVA",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "DECISÃO RÁPIDA",
          c3b: "MENOS ATRITO",
        },
        narration: "Ter dado não basta — precisa virar decisão. Nossa solução conecta informação e ação.",
      },
      {
        label: "Custo oculto",
        scenes: {
          c1t: "CUSTO ESCONDIDO",
          c1s: "Ineficiência que não aparece no BI.",
          c2t: "AUTOMAÇÃO INTELIGENTE",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "ROI VISÍVEL",
          c3b: "OPERAÇÃO ENXUTA",
        },
        narration: "O custo invisível corrói margem. Automatize com dados brasileiros de verdade.",
      },
      {
        label: "Escala",
        scenes: {
          c1t: "NÃO ESCALA ASSIM",
          c1s: "Planilha e retrabalho.",
          c2t: "FLUXO AUTOMATIZADO",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "CRESCIMENTO SEGURO",
          c3b: "MENOS RETRABALHO",
        },
        narration: "O que funciona em dez casos quebra em mil. Escale com fluxo e dados integrados.",
      },
      {
        label: "Confiança",
        scenes: {
          c1t: "INCERTEZA NA DECISÃO",
          c1s: "Risco que poderia ser evitado.",
          c2t: "DADOS QUE ORIENTAM",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "MAIS PREVISIBILIDADE",
          c3b: "DECISÃO CERTA",
        },
        narration: "Decidir no escuro é aposta. Dados PH3A trazem clareza do início ao fim.",
      },
      {
        label: "Tempo perdido",
        scenes: {
          c1t: "TEMPO PERDIDO",
          c1s: "Retrabalho todo dia.",
          c2t: "FLUXO ÚNICO",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "GANHO DE TEMPO",
          c3b: "MENOS RETRABALHO",
        },
        narration: "Retrabalho come come margem. Automatize com dados que fazem sentido.",
      },
      {
        label: "Decisão lenta",
        scenes: {
          c1t: "DECISÃO LENTA",
          c1s: "Oportunidade esfria.",
          c2t: "DADO NA HORA",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "RESPOSTA RÁPIDA",
          c3b: "VANTAGEM REAL",
        },
        narration: "Oportunidade esfria enquanto o dado demora. Resposta na velocidade do negócio.",
      },
      {
        label: "Crescimento",
        scenes: {
          c1t: "CRESCER COM RISCO",
          c1s: "Escalar sem controle.",
          c2t: "DADOS NO ESCALAR",
          c2f: ["Entrada", "Dados", "Análise", "Resultado"],
          c3a: "ESCALA SEGURA",
          c3b: "CRESCIMENTO SÓLIDO",
        },
        narration: "Crescer sem dado é escalar no escuro. PH3A dá lastro para crescer.",
      },
    ],
  };

  const pool = banks[profile] || banks.generic;
  const shuffled = shuffleArray(pool);
  const picked = shuffled.slice(0, Math.min(5, shuffled.length));
  return picked.map((item, i) => ({
    id: `local-${Date.now()}-${i}`,
    label: item.label,
    scenes: item.scenes,
    narration: item.narration,
    productDisplay,
    tagline,
    profile,
  }));
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let narrativeBatchCount = 0;

function updateNarrativesButton() {
  const btn = $("btnNarratives");
  if (!btn) return;
  if (narrativeBatchCount === 0) {
    btn.textContent = "Gerar 5 narrativas";
  } else {
    btn.textContent = "Gerar outras 5 narrativas";
  }
}

function sceneVisualHints(profile, scenes) {
  if (profile === "datatag") {
    return {
      k1: "Pilha de cards cinza de leads; poucos laranja; silhuetas saindo do site.",
      k2: `Funil: ${scenes.c2f.join(" → ")}. Janela com TAG. Card "Visitante identificado".`,
      k3: `Badges "Alto potencial", "Prioridade". Textos: "${scenes.c3a}" / "${scenes.c3b}".`,
      k4: "Mini-funil atrás. Assinatura centralizada.",
    };
  }
  if (profile === "datafraud") {
    return {
      k1: "Ícones digitais com alerta (!). Card \"Tentativa suspeita\". Sem sistemas legados.",
      k2: `Workflow: ${scenes.c2f.join(" → ")}. Pulso laranja. Card "Transação".`,
      k3: `Badges Aprovado/Bloqueado. "Trilha auditável".`,
      k4: "Mini-workflow. Assinatura.",
    };
  }
  if (profile === "databusca") {
    return {
      k1: "Fichas PF/PJ incompletas. Callouts cadastro/desatualizado.",
      k2: `Painel busca PF/PJ. Pulso laranja. ${scenes.c2f.join(" → ")}.`,
      k3: "Ficha enriquecida: Contato, Perfil, Crédito, Vínculos.",
      k4: "Ficha simplificada atrás. Assinatura.",
    };
  }
  if (profile === "datadossie") {
    return {
      k1: "Dossiê/documento com lacunas; lupa; alertas discretos. Sem funil marketing.",
      k2: `Fluxo: ${scenes.c2f.join(" → ")}. Escudo compliance. Pulso laranja.`,
      k3: `Badges risco/reputação. "${scenes.c3a}" / "${scenes.c3b}".`,
      k4: "Mini-dossiê atrás. Assinatura.",
    };
  }
  if (profile === "datacob") {
    return {
      k1: "Carteira de títulos; fila longa; telefone sem resposta. Sem funil leads.",
      k2: `Esteira cobrança: ${scenes.c2f.join(" → ")}. Gráfico recuperação.`,
      k3: `Badge "Alta chance de acordo". "${scenes.c3a}" / "${scenes.c3b}".`,
      k4: "Mini-fila priorizada. Assinatura.",
    };
  }
  if (profile === "datarc6") {
    return {
      k1: "Documento regulatório; selo RC6; checklist pendente. Sem marketing.",
      k2: `Timeline: ${scenes.c2f.join(" → ")}. Trilha auditoria. Pulso suave.`,
      k3: `Selo conformidade. "${scenes.c3a}" / "${scenes.c3b}".`,
      k4: "Mini-timeline RC6. Assinatura.",
    };
  }
  return {
    k1: "Metáfora visual simples do problema.",
    k2: `Esteira: ${scenes.c2f.join(" → ")}.`,
    k3: "Benefício com glow laranja.",
    k4: "Assinatura PH3A.",
  };
}

function buildBriefingBlock(n) {
  const { productDisplay, tagline, scenes } = n;
  return `Projeto: série PH3A · produto ${productDisplay}.
Entrega: KEYFRAMES estáticos 16:9 (1920×1080) para vídeo PH3A.
Narrativa escolhida: ${n.label}

${CUBO_PH}

Arco (4 cenas):
• Cena 1 — Problema: "${scenes.c1t}" — ${scenes.c1s}
• Cena 2 — Ação: "${scenes.c2t}" — ${scenes.c2f.join(" → ")}
• Cena 3 — Benefício: "${scenes.c3a}" / "${scenes.c3b}"
• Cena 4 — Marca: ${productDisplay} + PH3A + "${tagline}"

${RULES}

Aguarde meus pedidos KEYFRAME 1, 2, 3 e 4. Gere UMA imagem por vez.`;
}

function buildKeyframeBlock(n, num) {
  const { productDisplay, scenes } = n;
  const v = sceneVisualHints(n.profile, scenes);

  if (num === 1) {
    return `KEYFRAME 1 — ${productDisplay} · ${n.label}

16:9 ilustração 2D flat PH3A. CUBO-PH idêntico ao mascote anexado: à esquerda, nuvem cream, expressão PREOCUPADA/Triste.
${v.k1}

Fundo charcoal + blobs laranja nos cantos.
Textos on-screen (ortografia EXATA, pt-BR):
Título grande cream bold: "${scenes.c1t}"
Subtítulo menor: "${scenes.c1s}"

Sem lightning. Sem inglês. 1920×1080.`;
  }
  if (num === 2) {
    return `KEYFRAME 2 — ${productDisplay}

16:9 ilustração 2D flat. Mesmo CUBO-PH idêntico ao keyframe 1. Expressão FOCADA. Braço aponta para fluxo horizontal com 4 nós:
${scenes.c2f.map((s, i) => `${i + 1}. "${s}"`).join("\n")}
Pulso circular SUAVE laranja #E94E1B (NÃO lightning).
${v.k2}

Texto topo bold: "${scenes.c2t}"
1920×1080.`;
  }
  if (num === 3) {
    return `KEYFRAME 3 — ${productDisplay}

16:9 ilustração 2D flat. Mesmo CUBO-PH, expressão FELIZ, hover-bounce leve.
${v.k3}

Textos topo esquerdo (duas linhas cream bold):
"${scenes.c3a}"
"${scenes.c3b}"

1920×1080.`;
  }
  return `KEYFRAME 4 — ${productDisplay} · Assinatura PH3A

16:9 ilustração 2D flat. CUBO-PH centralizado, feliz, antena com glow laranja.
${v.k4}

Texto centralizado inferior (EXATOS):
"${productDisplay}"
"PH3A"
linha laranja fina
"${n.tagline}"

1920×1080.`;
}

function buildPromptsFile(n) {
  const { productDisplay } = n;
  const briefing = buildBriefingBlock(n);
  const kf1 = buildKeyframeBlock(n, 1);
  const kf2 = buildKeyframeBlock(n, 2);
  const kf3 = buildKeyframeBlock(n, 3);
  const kf4 = buildKeyframeBlock(n, 4);

  return `================================================================================
${productDisplay} — PROMPTS PARA CHATGPT (gerar keyframes)
Gerado por: ferramenta-textos · ${new Date().toISOString().slice(0, 10)}
Salvar: keyframe_1.png … keyframe_4.png na pasta do produto.
================================================================================

FERRAMENTA: ChatGPT (geração de imagem)
ANEXAR EM TODOS OS PEDIDOS: ../mascot/WhatsApp Image 2026-05-27 at 09.51.45.jpeg
A partir do KEYFRAME 2: anexar também o keyframe anterior gerado.

────────────────────────────────────────
PARTE 1 — COLE PRIMEIRO (BRIEFING MESTRE)
────────────────────────────────────────

${briefing}

────────────────────────────────────────
KEYFRAME 1 — Problema (0–2,5s)
────────────────────────────────────────

${kf1}

────────────────────────────────────────
KEYFRAME 2 — Ação (2,5–5s)
────────────────────────────────────────

${kf2}

────────────────────────────────────────
KEYFRAME 3 — Benefício (5–8s)
────────────────────────────────────────

${kf3}

────────────────────────────────────────
KEYFRAME 4 — Assinatura (8–10s)
────────────────────────────────────────

${kf4}

================================================================================`;
}

const CUBO_PH_VIDEO = `O personagem CUBO-PH deve ser o MESMO em todo o vídeo: cubo robô 2D fofo, corpo charcoal/preto, bordas e juntas laranja #E94E1B com glow, antena com esfera laranja, face em tela com olhos kawaii grandes, braços e pernas curtos flutuantes. Fundo charcoal #1a1a1a com blobs orgânicos laranja nos cantos. Estilo ilustração 2D flat PH3A — não converter para 3D metálico no meio do vídeo.`;

const CUBO_PH_VIDEO_SHORT = `CUBO-PH (idêntico nos keyframes):
Cubo robô 2D fofo, charcoal/preto, bordas laranja #E94E1B, olhos kawaii na tela, antena com esfera laranja, membros flutuantes. Fundo charcoal #1a1a1a + blobs laranja nos cantos. Estilo flat PH3A — não virar 3D metálico.`;

function productFolder(profile) {
  const folders = {
    datatag: "datatag",
    datafraud: "datafraud",
    databusca: "databusca",
    datadossie: "datadossie",
    datacob: "datacob",
    datarc6: "datarc6",
  };
  return folders[profile] || "produto";
}

function productMeta(profile, productDisplay) {
  const map = {
    datatag: {
      desc: `${productDisplay} — inteligência comercial, identificação de visitantes, lead scoring, foco em CAC (não CPL).`,
      not: "NÃO é DataFraud (antifraude/workflow de risco), NÃO é DataBusca (busca/enriquecimento PF/PJ).",
      tone: "frustração com volume → foco → confiança → marca. Marketing B2B claro.",
      kf1: "problema — volume / leads sem valor",
      kf2: "ação — inteligência no tráfego / funil",
      kf3: "benefício — leads certos / prioridade",
      flow: "funil",
      scene2Extra: `Janela de site com ícone TAG; card "Visitante identificado" (mock, sem PII).`,
      scene3Extra: `Badges "Alto potencial" e "Prioridade" no funil.`,
      scene4Mini: "Mini-funil simplificado (4 nós) ao lado do mascote.",
      split1End: "funil completo visível com pulso em andamento",
      split2Start: "funil com 4 passos visíveis; CUBO-PH apresentando",
    },
    datafraud: {
      desc: `${productDisplay} — motor de orquestração de decisões de risco (antifraude). Executa a política de risco do cliente em workflows.`,
      not: "NÃO é DataTag (tráfego/visitantes anônimos), NÃO é DataBusca (fichas de cadastro/enriquecimento PF/PJ), NÃO é funil de marketing.",
      tone: "alerta universal (fraude) → foco (solução) → confiança → marca. Marketing B2B claro, sem jargão técnico na abertura.",
      kf1: "problema — fraude na internet / risco fragmentado",
      kf2: "ação — workflow em execução",
      kf3: "benefício — decisão rastreável",
      flow: "workflow",
      scene2Extra: `Card pequeno "Transação" entrando no primeiro nó (mock, sem PII).`,
      scene3Extra: `Saídas visíveis: badge "Aprovado" (check verde) e badge "Bloqueado" (contraste claro). Faixa ou label "Trilha auditável" com ícone de log/lista.`,
      scene4Mini: "Mini-workflow simplificado (4 caixinhas em linha), discreto.",
      split1End: 'workflow completo visível, título da cena 2, card "Transação" presente',
      split2Start: 'workflow com 4 passos; CUBO-PH à esquerda; título da cena 2 ainda legível',
    },
    databusca: {
      desc: `${productDisplay} — busca, localização e enriquecimento de PF/PJ no Big Data PH3A.`,
      not: "NÃO é vídeo de tráfego de site, visitantes anônimos, funil de marketing nem DataTag.",
      tone: "frustração com dado incompleto → foco na busca → confiança no perfil → marca.",
      kf1: "problema — cadastro incompleto / desatualizado",
      kf2: "ação — localização e busca PF/PJ",
      kf3: "benefício — perfil enriquecido",
      flow: "fluxo de busca",
      scene2Extra: `Painel de busca com campos mock Consulta / Buscar / PF / PJ; card "Registro localizado" (sem PII).`,
      scene3Extra: `Ficha grande com blocos: Contato, Perfil, Crédito, Vínculos (labels, sem dados reais).`,
      scene4Mini: "Ficha simplificada ou ícones PF/PJ discretos atrás do mascote.",
      split1End: "painel de busca e ficha localizada visíveis",
      split2Start: "painel de busca; CUBO-PH apontando para fluxo de enriquecimento",
    },
    datadossie: {
      desc: `${productDisplay} — dossiês de risco, reputação e compliance (due diligence, KYC, screening).`,
      not: "NÃO é DataTag (funil de visitantes), NÃO é DataFraud comercial como protagonista, NÃO é só enriquecimento de cadastro (DataBusca).",
      tone: "tensão regulatória → análise profunda → confiança na decisão → marca.",
      kf1: "problema — screening manual / risco oculto",
      kf2: "ação — dossiê e camadas de análise",
      kf3: "benefício — decisão segura / compliance",
      flow: "fluxo analítico",
      scene2Extra: `Ícone de dossiê/documento; escudo de compliance discreto.`,
      scene3Extra: `Badges de risco/reputação; alertas discretos (sem listas reais).`,
      scene4Mini: "Mini-dossiê ou ícone de documento ao lado do mascote.",
      split1End: "fluxo analítico e dossiê parcial visíveis",
      split2Start: "dossiê em análise; CUBO-PH apontando para fluxo",
    },
    datacob: {
      desc: `${productDisplay} — cobrança inteligente e análise de crédito para recuperação de receita.`,
      not: "NÃO é DataTag (marketing/leads), NÃO é DataFraud (antifraude), NÃO é funil de visitantes.",
      tone: "pressão da inadimplência → priorização → recuperação → marca.",
      kf1: "problema — carteira / contatos ineficientes",
      kf2: "ação — score e segmentação de cobrança",
      kf3: "benefício — recuperação / acordo",
      flow: "esteira de cobrança",
      scene2Extra: `Gráfico discreto de recuperação ou fila priorizada (mock).`,
      scene3Extra: `Badge "Alta chance de acordo" ou fila com destaque laranja.`,
      scene4Mini: "Mini-fila ou ícones de títulos priorizados, discreto.",
      split1End: "esteira de cobrança e priorização visíveis",
      split2Start: "esteira com nós visíveis; CUBO-PH apresentando prioridade",
    },
    datarc6: {
      desc: `${productDisplay} — infraestrutura regulatória RC6 (registro e consulta padronizados, evidência de conformidade).`,
      not: "NÃO é marketing digital, NÃO é antifraude comercial como discurso principal, NÃO é funil de leads.",
      tone: "obrigação regulatória → processo controlado → conformidade → marca institucional.",
      kf1: "problema — RC6 manual / sem trilha",
      kf2: "ação — registro e consulta RC6",
      kf3: "benefício — conformidade auditável",
      flow: "timeline RC6",
      scene2Extra: `Selo ou label "RC6"; ícones de registro e consulta (mock).`,
      scene3Extra: `Selo de conformidade; trilha de auditoria com pontos na linha do tempo.`,
      scene4Mini: "Mini-timeline RC6 (4 etapas) discreta.",
      split1End: "timeline RC6 e registro/consulta visíveis",
      split2Start: "timeline com etapas; CUBO-PH em postura institucional",
    },
  };
  return (
    map[profile] || {
      desc: `${productDisplay} — solução PH3A de inteligência de dados.`,
      not: "Não misturar visual de outros produtos do portfólio PH3A.",
      tone: "problema → solução → benefício → marca. Tom B2B consultivo.",
      kf1: "problema",
      kf2: "ação",
      kf3: "benefício",
      flow: "fluxo",
      scene2Extra: "Elementos de UI alinhados ao keyframe_2.png.",
      scene3Extra: "Badges ou cards de resultado alinhados ao keyframe_3.png.",
      scene4Mini: "Mini-fluxo simplificado (4 nós), discreto.",
      split1End: "composição final alinhada ao keyframe_2.png",
      split2Start: "estado visual contínuo com o fim do clip 1 (keyframe_2)",
    }
  );
}

function flowArrow(nodes) {
  return nodes.map((s) => `"${s}"`).join(" → ");
}

function flowNumbered(nodes) {
  return nodes.map((s, i) => `${i + 1}. "${s}"`).join("\n  ");
}

function buildOmniScene1(n) {
  const { scenes, profile } = n;
  const v = sceneVisualHints(profile, scenes);
  let right = `- À direita: ${v.k1}`;
  if (profile === "datafraud") {
    right = `- À direita: ícones de canais digitais (site, pagamento, app, cadastro) com alertas (!) laranja — fraude em todos os canais. Sem diagrama de sistemas legados genéricos se o PNG não tiver.
- Card cream com alerta: "Tentativa suspeita", ícone ! laranja (sem PII).`;
  } else if (profile === "datatag") {
    right = `- Muitos cards cinza de leads genéricos; poucos cards laranja destacados. Silhuetas de visitantes saindo do site (tráfego desperdiçado). Opcional: rótulos mock CPL/CAC (sem números reais).`;
  } else if (profile === "databusca") {
    right = `- Fichas PF/PJ incompletas; callouts "Cadastro incompleto" / "Dados desatualizados" (se no PNG).`;
  }

  return `────────────────────────────────────────
SEGUNDO 0,0 – 2,5 → REPRODUZIR keyframe_1.png

Composição igual ao arquivo keyframe_1.png:
- Texto superior cream bold: "${scenes.c1t}" (manter legível).
- Subtítulo cream menor: "${scenes.c1s}"
- CUBO-PH à esquerda na nuvem cream, expressão PREOCUPADA/alerta (olhos tensos).
${right}

Movimento: elementos do problema animam levemente (flutuar/pulsar discreto); CUBO-PH olha para o lado direito.`;
}

function buildOmniScene2(n) {
  const { scenes, profile } = n;
  const meta = productMeta(profile, n.productDisplay);
  const nodes = flowArrow(scenes.c2f);
  const numbered = flowNumbered(scenes.c2f);

  return `────────────────────────────────────────
SEGUNDO 2,5 – 5,0 → REPRODUZIR keyframe_2.png

Transição suave a partir do keyframe_1. Composição igual ao keyframe_2.png:
- Texto topo bold: "${scenes.c2t}"
- CUBO-PH focado; braço aponta para ${meta.flow} horizontal de 4 nós conectados por setas:
  ${numbered}
- ${meta.scene2Extra}
- Pulso circular SUAVE laranja #E94E1B percorrendo os nós da esquerda para direita (onda, NÃO lightning, NÃO raio elétrico).

Movimento: pulso avança etapa por etapa; nós acendem em sequência (${nodes}).`;
}

function buildOmniScene3(n) {
  const { scenes, profile } = n;
  const meta = productMeta(profile, n.productDisplay);

  return `────────────────────────────────────────
SEGUNDO 5,0 – 8,0 → REPRODUZIR keyframe_3.png

Transição suave a partir do keyframe_2. Composição igual ao keyframe_3.png:
- Texto canto superior esquerdo, duas linhas cream bold:
  "${scenes.c3a}"
  "${scenes.c3b}"
- CUBO-PH feliz, hover-bounce leve.
- ${meta.flow} completo com glow laranja suave.
- ${meta.scene3Extra}

Movimento: resultado/badges aparecem no fim do fluxo; cubo faz bounce suave.`;
}

function buildOmniScene4(n) {
  const { productDisplay, tagline, profile } = n;
  const meta = productMeta(profile, productDisplay);

  return `────────────────────────────────────────
SEGUNDO 8,0 – 10,0 → REPRODUZIR keyframe_4.png

Transição suave para fechamento. Composição igual ao keyframe_4.png:
- Fundo escurece levemente.
- CUBO-PH centralizado, confiante; antena com esfera laranja em um pulso suave de glow.
- ${meta.scene4Mini}
- Texto centralizado inferior cream:
  "${productDisplay}"
  "PH3A" (somente PH3A — sem "by")
  linha laranja fina
  "${tagline}"
- Fade-in suave do bloco de texto (scale ~0,95 → 1).

Últimos 0,3s: quase estático no layout do keyframe_4.`;
}

function buildNegativePrompt(profile) {
  const common =
    "vertical video, English text, \"by PH3A\", misspelled Portuguese, lightning bolt, electric arc, energy beam on face, real human faces, real personal data, distorted logo, watermark, 3D metallic mascot redesign, fast chaotic cuts, shaky camera";
  const byProfile = {
    datatag:
      "website visitor silhouettes misused for DataBusca, incomplete registration fichas DataBusca, DataFraud workflow antifraude, fragmented legacy systems diagram",
    datafraud:
      "website visitor silhouettes, marketing funnel, incomplete registration fichas DataBusca, DataTag branding, fragmented legacy systems unless in PNG",
    databusca:
      "DataTag visitors funnel, marketing CPL/CAC funnel, DataFraud workflow, website traffic silhouettes",
    datadossie: "marketing funnel, DataTag visitors, DataFraud transaction workflow as hero",
    datacob: "marketing funnel, DataTag leads, DataFraud antifraude UI",
    datarc6: "marketing funnel, DataTag, commercial antifraude hero, lead scoring UI",
  };
  return [common, byProfile[profile] || "other PH3A product UI mixed in"].filter(Boolean).join(", ");
}

function buildRoteiroOmni(n) {
  const { productDisplay, tagline, scenes, narration, profile } = n;
  const folder = productFolder(profile);
  const meta = productMeta(profile, productDisplay);
  const trilha =
    profile === "datarc6"
      ? "Trilha institucional minimalista B2B. Whoosh leve no percurso da timeline (cena 2). Batida positiva na cena 3."
      : "Trilha: eletrônica minimalista B2B. Whoosh leve quando o pulso percorre o fluxo (cena 2). Batida positiva na cena 3.";

  return `================================================================================
${productDisplay} — Roteiro Google Flow / Veo (Omni)
Vídeo: 10s · 16:9 · 30 fps
Keyframes anexados (ordem): keyframe_1.png → keyframe_2.png → keyframe_3.png → keyframe_4.png
Pasta: video-novo/${folder}/
Narrativa: ${n.label}
================================================================================

PROJETO: Vídeo ${productDisplay} · PH3A · 10 segundos · 16:9 · 30 fps.

ARQUIVOS DE REFERÊNCIA ANEXADOS (ORDEM OBRIGATÓRIA):
- keyframe_1.png → estado visual do segundo 0 a 2,5 (${meta.kf1})
- keyframe_2.png → estado visual do segundo 2,5 a 5 (${meta.kf2})
- keyframe_3.png → estado visual do segundo 5 a 8 (${meta.kf3})
- keyframe_4.png → estado visual do segundo 8 a 10 (assinatura final)

INSTRUÇÃO PRINCIPAL:
Gere um vídeo que INTERPOLE suavemente entre os 4 keyframes anexados, nesta ordem exata. Cada trecho deve se aproximar fielmente do keyframe correspondente no momento indicado. Não redesenhe do zero: preserve composição, cores, textos on-screen, UI, ${meta.flow} e o mascote como nas imagens.

${CUBO_PH_VIDEO}

PRODUTO: ${meta.desc} ${meta.not}

TOM: ${meta.tone}
${trilha}

CÂMERA: estática ou push-in muito lento. Sem cortes rápidos. Transições suaves entre os 4 estados.

${buildOmniScene1(n)}

${buildOmniScene2(n)}

${buildOmniScene3(n)}

${buildOmniScene4(n)}

────────────────────────────────────────
NARRAÇÃO EM PORTUGUÊS BRASILEIRO (VOZ OFF, OPCIONAL — 10s):

"${narration}"

Pronunciar "${productDisplay}" de forma natural. Tom consultivo, humano. Música abaixo da voz.

────────────────────────────────────────
REGRAS DE CONFORMIDADE (OBRIGATÓRIO):

- Textos on-screen somente em português. Zero inglês.
- Zero CPF, CNPJ, nomes, e-mails ou telefones reais.
- Zero pessoas fotorealistas.
- CUBO-PH idêntico aos keyframes anexos.
- Pulso = onda laranja SUAVE no fluxo (cena 2); proibido lightning/raio/arco elétrico.
- ${meta.not}

NEGATIVE PROMPT:
${buildNegativePrompt(profile)}

────────────────────────────────────────
MOVIMENTO (campo curto separado, se o Flow pedir):

Animate 10s 16:9 through keyframe_1.png → keyframe_2.png → keyframe_3.png → keyframe_4.png in order. Match each PNG composition and on-screen text exactly. Same 2D flat CUBO-PH throughout. Smooth transitions. Orange soft pulse travels through ${meta.flow} in scene 2. No lightning.`;
}

/** Roteiro Omni v2 — prioriza copiar os PNGs; não reinventar mascote/layout. */
function buildRoteiroOmniV2(n) {
  const { productDisplay, tagline, scenes, narration, profile } = n;
  const folder = productFolder(profile);
  const meta = productMeta(profile, productDisplay);
  const nodes = flowArrow(scenes.c2f);

  return `================================================================================
${productDisplay} — Roteiro Google Flow / Veo (Omni) · V2 · FIDELIDADE AOS KEYFRAMES
Vídeo: 10s · 16:9 · 30 fps
Keyframes anexados (ORDEM E AUTORIDADE VISUAL): keyframe_1.png → keyframe_2.png → keyframe_3.png → keyframe_4.png
Pasta: video-novo/${folder}/
Narrativa: ${n.label}
================================================================================

⚠️ VERSÃO V2 — USE ESTE PROMPT QUANDO O OMNI INVENTAR UM MASCOTE/LAYOUT NOVO.
O roteiro-flow.txt (v1) descreve cenas com mais liberdade criativa. Este v2 exige COPIAR os PNGs.

PROJETO: Vídeo ${productDisplay} · PH3A · 10s · 16:9 · 30 fps.

ARQUIVOS ANEXADOS (OBRIGATÓRIO — 4 IMAGENS):
Anexe os 4 PNGs keyframe_1 … keyframe_4 nesta ordem. Eles são a ÚNICA fonte de verdade para:
- desenho do CUBO-PH (formato do cubo, antena, olhos na tela, braços/pernas, nuvem cream)
- posição e tamanho de cada elemento na tela
- textos on-screen (ortografia exata)
- ícones, cards, ${meta.flow}, cores e composição

PRIORIDADE MÁXIMA — NÃO REINVENTAR:
1. NÃO crie um robô/cubo “melhor” ou diferente do que está nos keyframes.
2. NÃO substitua o layout dos PNGs por um layout genérico de “vídeo tech”.
3. O vídeo deve parecer os 4 keyframes em sequência, com transição suave — não uma nova ilustração inspirada no briefing.
4. Se houver conflito entre este texto e o PNG, OBEDEÇA O PNG.

INSTRUÇÃO PRINCIPAL:
Interpole suavemente entre keyframe_1 → keyframe_2 → keyframe_3 → keyframe_4.
Em cada janela de tempo, o frame do vídeo deve ser visualmente o MAIS PRÓXIMO POSSÍVEL do PNG correspondente (como morph / hold com micro-animação).

PRODUTO (contexto apenas): ${meta.desc} ${meta.not}

TOM: ${meta.tone}
CÂMERA: estática ou push-in imperceptível. Sem cortes. Sem zoom dramático que mude enquadramento dos PNGs.

────────────────────────────────────────
SEGUNDO 0,0 – 2,5 → = keyframe_1.png (COPIAR COMPOSIÇÃO)

Reproduzir o PNG keyframe_1.png o mais fielmente possível:
- Título on-screen: "${scenes.c1t}" · subtítulo: "${scenes.c1s}" (se estiverem no PNG, letra por letra).
- CUBO-PH: MESMO desenho do PNG (proporções, cantos, antena, expressão da tela, nuvem, posição à esquerda).
- Demais elementos: exatamente como no PNG (ícones, cards, diagramas à direita) — não trocar por outro metaphor layout.

Movimento permitido APENAS: flutuar leve, pulsar alertas discretos — SEM redesenhar personagem ou UI.

────────────────────────────────────────
SEGUNDO 2,5 – 5,0 → = keyframe_2.png (COPIAR COMPOSIÇÃO)

Transição morph de keyframe_1 → keyframe_2. No pico deste trecho, igualar keyframe_2.png:
- Título: "${scenes.c2t}"
- ${meta.flow} com nós: ${nodes} — mesma disposição, cores e ícones do PNG.
- CUBO-PH idêntico ao keyframe_2 (pose, apontar, expressão).
- Pulso laranja SUAVE só se existir no PNG (onda, NÃO lightning).

────────────────────────────────────────
SEGUNDO 5,0 – 8,0 → = keyframe_3.png (COPIAR COMPOSIÇÃO)

Transição morph de keyframe_2 → keyframe_3. No pico, igualar keyframe_3.png:
- Linhas: "${scenes.c3a}" / "${scenes.c3b}"
- CUBO-PH idêntico ao PNG (feliz, bounce leve no máximo).
- Badges/resultado/trilha: só o que estiver desenhado no keyframe_3.png.

────────────────────────────────────────
SEGUNDO 8,0 – 10,0 → = keyframe_4.png (COPIAR COMPOSIÇÃO)

Transição morph para assinatura. Frame final = keyframe_4.png:
- CUBO-PH centralizado como no PNG.
- Textos inferiores EXATOS:
  "${productDisplay}"
  "PH3A" (sem "by")
  "${tagline}"
- Mini-elementos de fundo só se estiverem no PNG.

Últimos 0,3s: quase freeze no layout do keyframe_4.

────────────────────────────────────────
NARRAÇÃO PT-BR OPCIONAL (10s):

"${narration}"

────────────────────────────────────────
REGRAS (OBRIGATÓRIO):

- Português nos textos on-screen. Zero inglês. Sem "by PH3A".
- Zero PII real. Zero rostos fotorealistas.
- CUBO-PH = o dos PNGs, não uma nova versão 3D/metálica/redesenhada.
- ${meta.not}

NEGATIVE PROMPT (V2 — reforço anti-reinvenção):
${buildNegativePrompt(profile)}, new mascot design, redesigned CUBO-PH, different cube robot, different proportions, generic tech mascot, invented UI layout not in keyframes, replace PNG composition, creative reinterpretation, 3D metallic cube, realistic robot, chibi redesign, alternate character

────────────────────────────────────────
MOVIMENTO (campo curto — cole se o Flow separar):

10s 16:9 morph keyframe_1→2→3→4 in order. Match each attached PNG exactly — same mascot drawing and layout as images. Micro-motion only. Do not invent new character. Smooth transitions. No lightning.`;
}

function findOutputTab(name) {
  return outputFiles.findIndex((f) => f.name === name);
}

function switchToOutputTab(name) {
  const i = findOutputTab(name);
  if (i < 0) return false;
  activeTab = i;
  renderOutput();
  return true;
}

function buildSplit1Scene1(n) {
  const { scenes, profile } = n;
  let right = sceneVisualHints(profile, scenes).k1;
  if (profile === "datafraud") {
    right = `À direita: 4 ícones de canais digitais (site, pagamento, app, cadastro) com badges de alerta (!) laranja — fraude em todos os canais; linhas tracejadas leves. NÃO usar diagrama de sistemas legados nem texto "REGRAS GENÉRICAS" se não estiver no PNG.
- Card cream com glow laranja: "Tentativa suspeita" + ícone ! (sem dados reais)`;
  } else if (profile === "datatag") {
    right = `Muitos cards cinza de leads; poucos laranja. Silhuetas saindo do site. Rótulos mock CPL/CAC opcionais (sem números reais).`;
  }

  return `────────────────────────────────────────
SEGUNDO 0,0 – 4,0 → REPRODUZIR keyframe_1.png

Textos e elementos EXATOS como no PNG aprovado:
- Título superior branco/cream bold: "${scenes.c1t}"
- Subtítulo cinza/cream menor: "${scenes.c1s}"
- CUBO-PH à esquerda na nuvem cream, expressão PREOCUPADA
- ${right}

Movimento leve: elementos do problema pulsam/flutuam; CUBO-PH olha para a direita.`;
}

function buildSplit1Scene2(n) {
  const { scenes, profile } = n;
  const meta = productMeta(profile, n.productDisplay);
  const numbered = flowNumbered(scenes.c2f);

  let transition = "Os elementos da cena 1 recuam ou desvanecem;";
  if (profile === "datafraud") {
    transition = "Os alertas dos canais dão lugar ao controle. ";
  } else if (profile === "datatag") {
    transition = "A pilha de leads cinza recua; ";
  }

  return `────────────────────────────────────────
SEGUNDO 4,0 – 8,0 → TRANSITAR PARA keyframe_2.png

${transition}composição final DEVE COINCIDIR com keyframe_2.png:

- Título topo: "${scenes.c2t}"
- CUBO-PH feliz/focado, nuvem cream, dedo direito apontando; pulso/ondas concêntricas laranja SUAVES (NÃO lightning)
- ${meta.flow} horizontal com 4 caixas numeradas e setas laranja brilhantes:
  ${numbered}
- ${meta.scene2Extra}

Movimento: ${meta.flow} aparece da esquerda para direita; pulso laranja percorre os primeiros nós (resultado completo da cena 3 fica no clip 2).

ÚLTIMO FRAME (~8s): congelar visualmente alinhado ao keyframe_2.png — CUBO-PH apontando, ${meta.split1End}. Este frame será o ponto de continuidade para EXTEND.`;
}

function buildRoteiroSplit1(n) {
  const { productDisplay, scenes, narration, profile } = n;
  const folder = productFolder(profile);

  return `================================================================================
${productDisplay} — Google Flow / Omni · PARTE 1 de 2
Duração: 8 segundos · 16:9 · 30 fps
Keyframes anexados: keyframe_1.png (início) + keyframe_2.png (fim)
Pasta: video-novo/${folder}/
Narrativa: ${n.label}
Próximo passo: gerar este clipe → clicar EXTEND → usar roteiro-flow-split-2.txt
================================================================================

PROJETO: ${productDisplay} · PH3A · CLIP 1/2 · 8 segundos · 16:9.

ARQUIVOS DE REFERÊNCIA ANEXADOS:
- keyframe_1.png → composição alvo do início (segundos 0 a ~4)
- keyframe_2.png → composição alvo do final deste clipe (segundos ~4 a 8)

O vídeo DEVE COMEÇAR igual ao keyframe_1.png e TERMINAR igual ao keyframe_2.png, com transição suave entre os dois estados. Não pular para cenas 3 ou 4 — isso fica no extend.

${CUBO_PH_VIDEO_SHORT}

${buildSplit1Scene1(n)}

${buildSplit1Scene2(n)}

────────────────────────────────────────
NARRAÇÃO PT-BR OPCIONAL (clip 1, ~8s):

"${narration}"

CÂMERA: estática ou push-in muito lento. Sem cortes secos.

Manter textos on-screen idênticos aos keyframes, ortografia pt-BR correta, sem reescrever palavras.

NEGATIVE: ${buildNegativePrompt(profile)}

CAMPO MOVIMENTO (se separado):
8s 16:9 from keyframe_1.png to keyframe_2.png. Match both PNGs. Same CUBO-PH. End on keyframe_2 composition for seamless extend. Soft orange pulse. No lightning.`;
}

function buildRoteiroSplit2(n) {
  const { productDisplay, tagline, scenes, profile } = n;
  const folder = productFolder(profile);
  const meta = productMeta(profile, productDisplay);
  const numbered = flowNumbered(scenes.c2f);
  const narr2 = `${scenes.c3a}. ${scenes.c3b}. ${productDisplay} — ${tagline}`;

  let split2Scene3Extra = meta.scene3Extra;
  if (profile === "datafraud") {
    split2Scene3Extra = `Após o passo 4, ramificar para duas caixas de resultado:
- "Aprovado" — borda verde, círculo verde com check branco
- "Bloqueado" — borda laranja/vermelha, escudo com cadeado

Faixa inferior cream/laranja:
- Ícone documento + "Trilha auditável"
- Texto: "Cada decisão registrada com transparência." (se no PNG)
- Timeline: pontos laranja em linha tracejada + ícone documento/relógio`;
  }

  return `================================================================================
${productDisplay} — Google Flow / Omni · PARTE 2 de 2 (EXTEND)
Duração: +8 segundos (extend) · 16:9 · 30 fps
Keyframes anexados: keyframe_3.png + keyframe_4.png
Pré-requisito: clipe da PARTE 1 já gerado (roteiro-flow-split-1.txt) terminando em keyframe_2.png
Pasta: video-novo/${folder}/
Ação no Flow: EXTEND no clipe anterior → anexar keyframes 3 e 4 → colar este prompt
================================================================================

PROJETO: ${productDisplay} · PH3A · CLIP 2/2 · EXTENSÃO de +8 segundos · 16:9.

MODO: EXTEND — continuar o vídeo anterior SEM reiniciar. O primeiro frame desta extensão deve ser visualmente CONTÍNUO com o último frame do clip 1 (${meta.split2Start}).

ARQUIVOS DE REFERÊNCIA ANEXADOS (além do clipe já gerado):
- keyframe_3.png → composição alvo do meio desta extensão (segundos ~0 a ~4 do extend)
- keyframe_4.png → composição alvo do final (segundos ~4 a ~8 do extend)

NÃO voltar ao keyframe_1.png. NÃO reintroduzir cena de problema da abertura.

CUBO-PH: mesmo personagem 2D flat do clip anterior — charcoal, laranja #E94E1B, olhos kawaii, antena. Não redesenhar mascote.

────────────────────────────────────────
INÍCIO DO EXTEND (frame 0 do clip 2) — CONTINUIDADE

Começar exatamente onde o clip 1 parou:
- ${meta.split2Start}
- Manter paleta charcoal e blobs laranja nos cantos

────────────────────────────────────────
SEGUNDO 0,0 – 4,0 (extend) → EVOLUIR PARA keyframe_3.png

Transição suave. Composição deve convergir para keyframe_3.png:

Textos topo esquerdo (duas linhas brancas/cream bold):
"${scenes.c3a}"
"${scenes.c3b}"

${meta.flow} horizontal (mesmos 4 passos numerados):
  ${numbered}

${split2Scene3Extra}

CUBO-PH: expressão FELIZ, aponta para o fluxo; hover-bounce leve; faíscas laranja discretas na antena/mão.

Movimento: pulso percorre os nós finais; badges/resultado aparecem; elementos de benefício fazem fade-in.

────────────────────────────────────────
SEGUNDO 4,0 – 8,0 (extend) → REPRODUZIR keyframe_4.png

Transição suave para fechamento. Composição final = keyframe_4.png:

- Fundo charcoal com blobs laranja; partículas laranja sutis
- CUBO-PH centralizado, flutuando na nuvem cream, feliz, antena com glow
- ${meta.scene4Mini}
- Texto inferior centralizado:
  "${productDisplay}" (branco/cream, grande)
  "PH3A" (laranja, somente "PH3A" — sem "by")
  linha laranja fina
  "${tagline}"

Movimento: elementos da cena 3 recuam ou simplificam; texto de marca faz fade-in; antena pulsa uma vez; últimos 0,5s quase estático.

────────────────────────────────────────
NARRAÇÃO PT-BR OPCIONAL (clip 2 / extend, ~8s):

"${narr2}"

Tom consultivo. Música contínua do clip 1.

Manter textos on-screen idênticos aos keyframes aprovados, ortografia pt-BR correta, sem typos.

NEGATIVE: restart from scratch, keyframe_1 problem scene, hard cut discontinuity, ${buildNegativePrompt(profile)}

CAMPO MOVIMENTO (se separado):
Extend +8s 16:9 continuing from previous clip end (keyframe_2 state). Animate toward keyframe_3.png then keyframe_4.png. Same CUBO-PH. Match PNG text exactly. End on ${productDisplay} signature. No lightning. Seamless continuity.`;
}

function renderNarrativeList() {
  const list = $("narrativeList");
  list.innerHTML = "";
  if (!narratives.length) return;

  narratives.forEach((n, i) => {
    const el = document.createElement("div");
    el.className = "narrative-item" + (i === selectedIndex ? " selected" : "");
    el.innerHTML = `<h3>${i + 1}. ${n.label}</h3>
      <p><strong>1:</strong> ${n.scenes.c1t} · <strong>2:</strong> ${n.scenes.c2t} · <strong>4:</strong> ${n.tagline}</p>`;
    el.addEventListener("click", () => {
      selectedIndex = i;
      renderNarrativeList();
      $("btnExport").disabled = false;
    });
    list.appendChild(el);
  });
  $("narrativeHint").textContent = `${narratives.length} opções — clique para selecionar.`;
}

function getVertente() {
  return document.querySelector('input[name="vertente"]:checked').value;
}

function buildOutputs() {
  const n = narratives[selectedIndex];
  if (!n) return;

  outputFiles = [
    { name: "prompts-chatgpt-keyframes.txt", content: buildPromptsFile(n) },
    { name: "roteiro-flow.txt", content: buildRoteiroOmni(n) },
    { name: "roteiro-flow-v2.txt", content: buildRoteiroOmniV2(n) },
  ];
  if (getVertente() === "extend") {
    outputFiles.push(
      { name: "roteiro-flow-split-1.txt", content: buildRoteiroSplit1(n) },
      { name: "roteiro-flow-split-2.txt", content: buildRoteiroSplit2(n) }
    );
  }
}

function setCopyStatus(msg) {
  const el = $("copyStatus");
  if (el) el.textContent = msg || "";
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = $("outputText");
  ta.removeAttribute("readonly");
  ta.select();
  document.execCommand("copy");
  ta.setAttribute("readonly", "");
}

function renderOutput() {
  const ready = $("outputReady");
  const emptyHint = $("outputEmptyHint");
  const tabs = $("outputTabs");
  const textArea = $("outputText");
  const fileName = $("outputFileName");

  if (!outputFiles.length) {
    ready.hidden = true;
    emptyHint.hidden = false;
    return;
  }

  emptyHint.hidden = true;
  ready.hidden = false;
  setCopyStatus("");

  tabs.innerHTML = "";
  outputFiles.forEach((f, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (i === activeTab ? " active" : "");
    b.textContent = f.name;
    b.addEventListener("click", () => {
      activeTab = i;
      renderOutput();
    });
    tabs.appendChild(b);
  });

  const current = outputFiles[activeTab];
  textArea.value = current?.content || "";
  fileAreaHint(current);
  fileName.textContent = current ? `Arquivo: ${current.name}` : "";

  const btnV2 = $("btnOpenV2");
  if (btnV2) btnV2.hidden = findOutputTab("roteiro-flow-v2.txt") < 0;

  $("outputSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function fileAreaHint(current) {
  const label = document.querySelector(".output-view-label span");
  if (!label) return;
  if (current?.name === "roteiro-flow-v2.txt") {
    label.textContent =
      "Roteiro v2 — prioriza copiar os 4 PNGs (teste no Omni se o v1 inventar mascote novo)";
  } else {
    label.textContent = "Pré-visualização (copie ou baixe o .txt da aba ativa)";
  }
}

function downloadFile(name, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadBaseFromInputs() {
  const text = $("baseText").value.trim();
  const profileSelect = $("productProfile").value;
  const profile =
    profileSelect === "auto" ? detectProfile(text) : profileSelect;
  const productDisplay = displayName(
    $("productName").value.trim() || extractProductName(text, "")
  );
  let tagline = $("tagline").value.trim() || extractTagline(text);
  if (!tagline) tagline = DEFAULT_TAGLINES[profile] || DEFAULT_TAGLINES.generic;
  $("productName").value = productDisplay;
  $("tagline").value = tagline;
  return { text, profile, productDisplay, tagline };
}

$("fileBase").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  $("baseText").value = text;
  const { profile, productDisplay, tagline } = loadBaseFromInputs();
  $("productProfile").value =
    $("productProfile").value === "auto" ? profile : $("productProfile").value;
  if (!$("productName").value) $("productName").value = productDisplay;
  if (!$("tagline").value) $("tagline").value = tagline;
});

function getTextSource() {
  const el = document.querySelector('input[name="textSource"]:checked');
  return el ? el.value : "local";
}

function setGeminiStatus(msg, isError) {
  const el = $("geminiStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("is-error", Boolean(isError && msg));
  if (isError && msg) {
    try {
      sessionStorage.setItem("ph3a_gemini_quota_fail", "1");
    } catch {
      /* ignore */
    }
  }
}

function updateModeUi() {
  const isLocal = getTextSource() === "local";
  $("modeLocalLabel")?.classList.toggle("selected", isLocal);
  $("modeGeminiLabel")?.classList.toggle("selected", !isLocal);
  const details = $("geminiDetails");
  if (details && !isLocal) details.open = true;
}

function initGeminiUi() {
  const keyInput = $("geminiApiKey");
  if (!keyInput || !window.Ph3aGemini) return;
  const saved = Ph3aGemini.loadGeminiKey();
  keyInput.value =
    saved || (typeof window.PH3A_GEMINI_KEY_DEFAULT === "string" ? window.PH3A_GEMINI_KEY_DEFAULT : "");
  if (keyInput.value && !saved) Ph3aGemini.saveGeminiKey(keyInput.value);
  updateSourceHint();
  updateModeUi();
  document.querySelectorAll('input[name="textSource"]').forEach((r) => {
    r.addEventListener("change", () => {
      updateSourceHint();
      updateModeUi();
      if (getTextSource() === "local") setGeminiStatus("");
    });
  });

  try {
    if (sessionStorage.getItem("ph3a_gemini_quota_fail") === "1") {
      setGeminiStatus(
        "Sua chave está sem cota free (429 / limit: 0). Use «Templates locais» acima — já funciona. Para tentar Gemini de novo: nova chave AIza… no AI Studio.",
        true
      );
    }
  } catch {
    /* ignore */
  }
}

$("btnClearGeminiStatus")?.addEventListener("click", () => {
  setGeminiStatus("");
  try {
    sessionStorage.removeItem("ph3a_gemini_quota_fail");
  } catch {
    /* ignore */
  }
});

/** @type {{ id: string, file: string, label: string, profile: string }[]} */
let baseCatalog = [];

async function initBaseCatalog() {
  const select = $("basePreset");
  const btn = $("btnLoadPreset");
  const hint = $("basePresetHint");
  if (!select) return;

  const fallback = [
    { id: "databusca", file: "databusca-base.txt", label: "DataBusca", profile: "databusca" },
    { id: "datatag", file: "datatag-base.txt", label: "DataTag", profile: "datatag" },
    { id: "datafraud", file: "datafraud-base.txt", label: "DataFraud", profile: "datafraud" },
    { id: "datadossie", file: "datadossie-base.txt", label: "DataDossiê", profile: "datadossie" },
    { id: "datacob", file: "datacob-base.txt", label: "DataCob", profile: "datacob" },
    { id: "datarc6", file: "datarc6-base.txt", label: "DataRC6", profile: "datarc6" },
  ];

  try {
    const res = await fetch("base-txt/bases-manifest.json");
    if (res.ok) {
      const data = await res.json();
      baseCatalog = (data.bases || []).filter((b) => b.status === "ready");
    } else {
      baseCatalog = fallback;
    }
  } catch {
    baseCatalog = fallback;
    if (hint) {
      hint.textContent =
        "Abra via http://localhost:8080 para listar bases automaticamente — ou envie o .txt de base-txt/ manualmente.";
    }
  }

  select.innerHTML = '<option value="">— escolha o produto —</option>';
  baseCatalog.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.label + " (" + b.file + ")";
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    if (btn) btn.disabled = !select.value;
  });
}

async function loadPresetBase(id) {
  const item = baseCatalog.find((b) => b.id === id);
  if (!item) return;
  const hint = $("basePresetHint");
  try {
    const res = await fetch("base-txt/" + item.file);
    if (!res.ok) throw new Error("Arquivo não encontrado: base-txt/" + item.file);
    const text = await res.text();
    $("baseText").value = text;
    $("productProfile").value = item.profile;
    loadBaseFromInputs();
    if (hint) hint.textContent = "Base carregada: " + item.label + " — " + item.file;
  } catch (e) {
    if (hint) hint.textContent = e.message || String(e);
    alert(
      (e.message || String(e)) +
        "\n\nUse: python -m http.server 8080 nesta pasta,\nou envie o arquivo de base-txt/ manualmente."
    );
  }
}

$("btnLoadPreset")?.addEventListener("click", () => {
  const id = $("basePreset").value;
  if (id) loadPresetBase(id);
});

function updateSourceHint() {
  const hint = $("narrativeSourceHint");
  if (!hint) return;
  hint.textContent =
    getTextSource() === "gemini"
      ? "Próximo passo: carregue a base (§1) e clique em Gerar 5 narrativas — usa a API Gemini."
      : "Próximo passo: carregue a base (§1) e clique em Gerar 5 narrativas — usa templates prontos, sem API.";
}

$("btnSaveKey")?.addEventListener("click", () => {
  const key = $("geminiApiKey").value.trim();
  if (!key) {
    setGeminiStatus("Cole a chave antes de salvar.", true);
    return;
  }
  Ph3aGemini.saveGeminiKey(key);
  setGeminiStatus("Chave salva neste navegador (não vai para o disco do projeto).");
});

$("btnTestKey")?.addEventListener("click", async () => {
  const key = $("geminiApiKey").value.trim();
  if (!key) {
    setGeminiStatus("Informe a chave.", true);
    return;
  }
  $("btnTestKey").disabled = true;
  setGeminiStatus("Testando…");
  try {
    const reply = await Ph3aGemini.testGeminiKey(key);
    Ph3aGemini.saveGeminiKey(key);
    setGeminiStatus("OK — Gemini respondeu: " + reply);
  } catch (e) {
    setGeminiStatus(e.message || String(e), true);
  } finally {
    $("btnTestKey").disabled = false;
  }
});

$("btnNarratives").addEventListener("click", async () => {
  const { text, profile, productDisplay, tagline } = loadBaseFromInputs();
  if (!text || text.length < 80) {
    alert("Cole ou envie a base .txt (mínimo ~80 caracteres).");
    return;
  }

  const btn = $("btnNarratives");
  const isReroll = narrativeBatchCount > 0;
  btn.disabled = true;
  selectedIndex = -1;
  $("btnExport").disabled = true;
  outputFiles = [];
  renderOutput();

  try {
    if (getTextSource() === "gemini") {
      if (!window.Ph3aGemini) throw new Error("gemini.js não carregou.");
      const key = $("geminiApiKey").value.trim() || Ph3aGemini.loadGeminiKey();
      if (!key) {
        alert("Cole sua chave Gemini, clique em Salvar chave e tente de novo.");
        return;
      }
      $("narrativeHint").textContent = isReroll
        ? "Gerando outras 5 com Gemini…"
        : "Gerando 5 narrativas com Gemini…";
      narratives = await Ph3aGemini.fetchNarrativesFromGemini(key, {
        baseText: text,
        profile,
        productDisplay,
        tagline,
        variationId: narrativeBatchCount + 1,
      });
      Ph3aGemini.saveGeminiKey(key);
    } else {
      $("narrativeHint").textContent = isReroll
        ? "Sorteando outras 5 opções…"
        : "Montando 5 opções…";
      narratives = buildNarratives(profile, productDisplay, tagline);
    }
    narrativeBatchCount += 1;
    updateNarrativesButton();
    const src = getTextSource() === "gemini" ? "Gemini" : "local";
    $("narrativeHint").textContent =
      "Lote " +
      narrativeBatchCount +
      " — " +
      narratives.length +
      " opções (" +
      src +
      "). Clique na que preferir. Não gostou? Clique em «Gerar outras 5 narrativas».";
    renderNarrativeList();
    $("narrativeList")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (e) {
    const msg = e.message || String(e);
    const quota = window.Ph3aGemini && Ph3aGemini.isQuotaErrorMessage(msg);
    narratives = buildNarratives(profile, productDisplay, tagline);
    narrativeBatchCount += 1;
    if (quota) {
      document.querySelector('input[name="textSource"][value="local"]').checked = true;
      updateSourceHint();
      updateModeUi();
      setGeminiStatus(
        "Gemini sem cota — geramos com templates locais. Mantenha «Templates locais» selecionado.",
        true
      );
      $("narrativeHint").textContent =
        "Lote " +
        narrativeBatchCount +
        " — " +
        narratives.length +
        " opções (local). Clique de novo para outras 5.";
    } else {
      setGeminiStatus(msg, true);
      $("narrativeHint").textContent =
        "Lote " +
        narrativeBatchCount +
        " — " +
        narratives.length +
        " opções (fallback local).";
    }
    updateNarrativesButton();
    renderNarrativeList();
  } finally {
    btn.disabled = false;
  }
});

$("btnExport").addEventListener("click", () => {
  if (selectedIndex < 0) {
    alert("Selecione uma narrativa.");
    return;
  }
  buildOutputs();
  activeTab = 0;
  renderOutput();
});

$("btnCopyActive").addEventListener("click", async () => {
  const c = $("outputText").value;
  if (!c) return;
  try {
    await copyToClipboard(c);
    setCopyStatus("Copiado para a área de transferência.");
    $("btnCopyActive").textContent = "Copiado!";
    setTimeout(() => {
      $("btnCopyActive").textContent = "Copiar texto";
      setCopyStatus("");
    }, 2000);
  } catch {
    setCopyStatus("Não foi possível copiar — selecione o texto na caixa e use Ctrl+C.");
  }
});

$("btnDownloadActive").addEventListener("click", () => {
  const f = outputFiles[activeTab];
  if (f) downloadFile(f.name, f.content);
});

$("btnOpenV2")?.addEventListener("click", () => {
  if (!switchToOutputTab("roteiro-flow-v2.txt")) return;
  $("outputText")?.focus();
});

initGeminiUi();
initBaseCatalog();
updateNarrativesButton();
renderOutput();
