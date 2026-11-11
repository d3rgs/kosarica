// n = ime živila v aplikaciji, b = osnovna enota, q = iskalni nizi.
// inc/exc se preverjata na imenu izdelka (del pred prvo vejico), need na celotnem imenu.
export const FOODS = [
  { n: "Banane", b: "kg", q: ["banane"], inc: /banan/i, exc: /kaš|keks|muesli|müsli|frutolino|vitamin|jogurt|sok|čips|kosmič|kruh|torta|piškot|smoothie|ploščic|sladoled/i },
  { n: "Skuta 0 %", b: "kg", q: ["skuta 0"], inc: /skuta/i, need: /0\s?%|posneta|pusta/i, exc: /torta|sirov/i },
  { n: "Goveje mleto meso", b: "kg", q: ["goveje mleto meso"], inc: /mlet/i, need: /govej/i, exc: /mešan|svinjsk|burger|polpet/i },
  { n: "Drugo mleto meso", b: "kg", q: ["mleto meso"], inc: /mlet/i, need: /svinjsk|mešan|piščanč|puranj/i, exc: /burger|polpet/i },
  { n: "Kakav", b: "kg", q: ["kakav v prahu"], inc: /kakav/i, exc: /napitek|čokol|namaz|keks|torta|kosmič|puding|kaš|krem|jogurt|sladoled|mleko/i },
  { n: "Ovseni kosmiči", b: "kg", q: ["ovseni kosmiči"], inc: /ovsen/i, need: /kosmič/i, exc: /musli|granola|palačink|ploščic|keks|kaš/i },
  { n: "Zamrznjena zelenjava z brokolijem", b: "kg", q: ["zamrznjena zelenjava brokoli"], inc: /brokoli/i, need: /zamrz|globoko|mešan/i, exc: /juha|omaka/i },
  { n: "Mleko 1,5 %", b: "l", q: ["mleko 1,5"], inc: /mleko/i, need: /1[,.]5\s?%/, exc: /čokolad|kokos|ovsen|sojin|mandlj|jogurt|kisl|kondenz|v prahu|laktoz|napitek/i },
  { n: "Proteinske tortilije", b: "kg", q: ["proteinske tortilje"], inc: /tortilj/i, need: /protein/i },
  { n: "Bučke", b: "kg", q: ["bučke"], inc: /bučk/i, exc: /polnjen|čips|sir|juha|krem/i },
  { n: "Kumare", b: "kg", q: ["kumare"], inc: /kumar/i, exc: /kumaric|kisl|vlož|sok|polnjen|solat|jogurt/i },
  { n: "Maline", b: "kg", q: ["maline"], inc: /malin/i, exc: /keks|kosmič|kaš|jogurt|skyr|sladoled|sok|marmelad|džem|čaj|sirup|torta|čokol|bonbon|ploščic/i },
  { n: "Kaki", b: "kg", q: ["kaki"], inc: /\bkaki\b/i },
  { n: "Provansalske začimbe", b: "kg", q: ["provansalske začimbe"], inc: /provansal/i },
  { n: "Curry", b: "kg", q: ["curry"], inc: /curry|kari/i, exc: /piščanč|puran|perfect|riž|omaka|juha|pasta|testenin/i },
  { n: "Fino mleta sol", b: "kg", q: ["fino mleta sol"], inc: /\bsol\b/i, need: /fino/i, exc: /kopel/i },
  { n: "Začimbe za solato", b: "kg", q: ["začimba za solato"], inc: /začimb/i, need: /solat/i },
  { n: "Kajenski poper", b: "kg", q: ["kajenski poper"], inc: /kajensk/i, exc: /ocvirk|klobas|sir|čips|omaka|arašid|oreh/i },
  { n: "Tuna v lastnem soku (odcejena masa)", b: "kg", q: ["tuna v lastnem soku"], inc: /\btun/i, need: /lastn|v soku|naravn/i, exc: /olj|solat|pašteta|omaka/i },
  { n: "Jajca", b: "kos", q: ["jajca"], inc: /\bjajc/i, exc: /testenin|tortelin|rezanc|namaz|liker|sladoled/i },
];
