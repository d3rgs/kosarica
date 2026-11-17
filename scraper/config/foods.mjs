// n = ime živila v aplikaciji, b = osnovna enota, q = iskalni nizi.
// inc/exc se preverjata na imenu izdelka (del pred prvo vejico), need na celotnem imenu.
const FOOD_LIST = [
  { n: "Banane", b: "kg", lead: true, q: ["banane", "banane bio"], inc: /banan/i, rng: [0.7, 3.2], exc: /kaš|keks|muesli|müsli|frutolino|vitamin|jogurt|sok|čips|kosmič|kruh|torta|piškot|smoothie|ploščic|sladoled|bananic|čokolad|sirup|žele/i },
  { n: "Skuta 0 %", b: "kg", q: ["skuta 0", "pusta skuta", "skuta posneta"], inc: /skuta/i, need: /(?<![\d.,])0\s?%|posneta|pusta/i, exc: /torta|sirov/i },
  { n: "Goveje mleto meso", b: "kg", q: ["goveje mleto meso", "mleto goveje meso"], inc: /mlet/i, need: /govej/i, exc: /mešan|svinjsk|burger|polpet/i },
  { n: "Drugo mleto meso", b: "kg", q: ["mleto meso", "mleto mešano meso", "mleto svinjsko meso"], inc: /mlet/i, need: /svinjsk|mešan|piščanč|puranj/i, exc: /burger|polpet/i },
  { n: "Kakav", b: "kg", lead: true, q: ["kakav v prahu", "kakav"], inc: /kakav/i, exc: /napitek|čokol|namaz|keks|torta|kosmič|puding|kaš|krem|jogurt|sladoled|mleko|rogljič|penice|preliv|rezine|lešnik|bonbon/i },
  { n: "Ovseni kosmiči", b: "kg", q: ["ovseni kosmiči"], inc: /ovsen/i, need: /kosmič/i, exc: /musli|granola|palačink|ploščic|keks|kaš/i },
  { n: "Zamrznjena zelenjava z brokolijem", b: "kg", q: ["zamrznjena zelenjava brokoli", "brokoli zamrznjen", "zamrznjena zelenjava", "mešanica zelenjave zamrznjena"], inc: /brokoli/i, need: /zamrz|globoko|mešan/i, exc: /juha|omaka/i },
  { n: "Mleko 1,5 %", b: "l", q: ["mleko 1,5", "polposneto mleko", "trajno mleko", "sveže mleko"], inc: /mleko/i, need: /1[,.]5\s?%/, exc: /čokolad|kokos|ovsen|sojin|mandlj|jogurt|kisl|kondenz|v prahu|laktoz|napitek/i },
  { n: "Proteinske tortilije", b: "kg", q: ["proteinske tortilje", "tortilje protein", "tortilja"], inc: /tortilj/i, need: /protein/i },
  { n: "Bučke", b: "kg", lead: true, q: ["bučke", "bučka"], inc: /bučk/i, rng: [0.8, 6], exc: /polnjen|čips|sir|juha|krem/i },
  { n: "Kumare", b: "kg", lead: true, q: ["kumare", "kumara"], inc: /kumar/i, rng: [0.8, 6], exc: /kumaric|kisl|vlož|sok|polnjen|solat|jogurt/i },
  { n: "Maline", b: "kg", lead: true, q: ["maline", "malina"], inc: /malin/i, rng: [5, 40], exc: /keks|kosmič|kaš|jogurt|skyr|sladoled|sok|marmelad|džem|čaj|sirup|torta|čokol|bonbon|ploščic/i },
  { n: "Kaki", b: "kg", lead: true, q: ["kaki", "kaki sadež"], inc: /\bkaki\b/i, rng: [1, 7] },
  { n: "Provansalske začimbe", b: "kg", q: ["provansalske začimbe", "provansalska mešanica"], inc: /provansal/i },
  { n: "Curry", b: "kg", q: ["curry", "curry v prahu", "karri"], inc: /curry|kari/i, exc: /piščanč|puran|perfect|riž|omaka|juha|pasta|testenin/i },
  { n: "Fino mleta sol", b: "kg", q: ["fino mleta sol", "sol fina", "jodirana sol"], inc: /\bsol\b/i, need: /fin[aoe]/i, exc: /kopel/i },
  { n: "Začimbe za solato", b: "kg", q: ["začimba za solato", "mešanica začimb za solato", "solata začimbe"], inc: /začimb/i, need: /solat/i },
  { n: "Kajenski poper", b: "kg", q: ["kajenski poper", "cayenne"], inc: /kajensk/i, exc: /ocvirk|klobas|sir|čips|omaka|arašid|oreh/i },
  { n: "Tuna v lastnem soku (odcejena masa)", b: "kg", q: ["tuna v lastnem soku", "tunina v lastnem soku", "tuna"], inc: /\btun/i, need: /lastn|v soku|naravn/i, exc: /olj|solat|pašteta|omaka/i },
  { n: "Jajca", b: "kos", q: ["jajca"], inc: /\bjajc/i, exc: /testenin|tortelin|rezanc|namaz|liker|sladoled|podstavek|stojalo|barv|kuhal|hladilnik|absorb|rezalnik|prepeli|magic/i },
];

// Neživilski izdelki (poseben razdelek v aplikaciji). Iskalna pravila so pripravljena po tipičnih imenih in jih je treba po prvem zagonu preveriti.
const nf = (n, b, grp, q, inc, o = {}) => ({ n, b, nf: true, grp, q, inc, ...o });
const NONFOOD_LIST = [
  nf("Pralni prašek", "kg", "Čistila", ["pralni prašek"], /pralni\s+prašek|prašek\s+za\s+pranje/i, { exc: /pomival|kopel/i }),
  nf("Pralni gel", "l", "Čistila", ["pralni gel", "tekoče pralno sredstvo"], /pralni\s+gel|tekoče\s+pralno|pralno\s+sredstvo|gel\s+za\s+pranje/i, { exc: /prašek|tablet|kapsul|pomival/i }),
  nf("Tablete za pomivalni stroj", "kos", "Čistila", ["tablete za pomivalni stroj"], /tablet|kapsul/i, { need: /pomival/i }),
  nf("Pomivalno sredstvo za posodo", "l", "Čistila", ["pomivalno sredstvo"], /pomivaln/i, { need: /posod|ročno|gel/i, exc: /tablet|kapsul|stroj|sijal|\bsol\b/i }),
  nf("Univerzalno čistilo", "l", "Čistila", ["univerzalno čistilo"], /čistilo/i, { need: /univerzal|površin/i, exc: /wc|kopalnic|steklo|pečic|\btla\b/i }),
  nf("Toaletni papir", "kos", "Papir in higiena", ["toaletni papir"], /toaletni\s+papir/i, { exc: /vlažn|držalo|stojalo/i }),
  nf("Papirnate brisače", "kos", "Papir in higiena", ["papirnate brisače", "kuhinjske brisače"], /brisač/i, { need: /papir|kuhinjsk/i, exc: /vlažn|kopalnic|mikrovlakn/i }),
  nf("Šampon", "l", "Osebna nega", ["šampon"], /šampon/i, { exc: /\bpse?\b|psov|živali|balzam|za avto/i, dp: true }),
  nf("Gel za prhanje", "l", "Osebna nega", ["gel za prhanje", "tuš gel"], /gel\s+za\s+(prhanje|tuširanje)|tuš\s+gel/i, { dp: true }),
  nf("Tekoče milo", "l", "Osebna nega", ["tekoče milo"], /tekoče\s+milo/i, { dp: true }),
  nf("Zobna pasta", "l", "Osebna nega", ["zobna pasta"], /zobna\s+(pasta|krema)/i, { dp: true }),
  nf("Vrečke za smeti", "kos", "Gospodinjstvo", ["vrečke za smeti"], /vrečk/i, { need: /smeti|odpadk/i, exc: /zamrz|sendvič/i }),
  nf("Aluminijasta folija", "m", "Gospodinjstvo", ["aluminijasta folija", "alu folija"], /alu(minijast\w*)?\s+folij/i),
  nf("Peki papir", "m", "Gospodinjstvo", ["peki papir"], /peki\s+papir|papir\s+za\s+peko/i),
  nf("Prozorna folija za živila", "m", "Gospodinjstvo", ["prozorna folija"], /folij/i, { need: /prozorn|živil/i, exc: /alu/i }),
  nf("Baterije AA", "kos", "Gospodinjstvo", ["baterije aa"], /baterij/i, { need: /\bAA\b|LR6/i, exc: /polnilnik|akumulator/i }),
];
export const NONFOODS = NONFOOD_LIST;
// Največ iskanj na izdelek v spletnih trgovinah: živila 3, neživila 1 (čas zagona je omejen).
export const queriesFor = (f) => f.q.slice(0, f.nf ? 1 : 3);
export const FOODS = [...FOOD_LIST, ...NONFOOD_LIST];
