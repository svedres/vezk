// ============================================================
// Vezetői Válságstáb — játékadatok
// ------------------------------------------------------------
// Fordulónként csapatonként 5 AKTÍV ügy (reserve nélkül) + 3
// TARTALÉK ügy (reserve: true). Az 5 aktív ügy teljes megoldásának
// összköltsége szándékosan meghaladja a fordulókeretet, ezért
// valódi kompromisszumot kell kötni.
//
// Rotáció: amikor a játékmester eseményt alkalmaz, a rendszer
// csapatonként 2 aktív ügyet lecserél a tartalékból (a lecserélt
// ügy döntése inaktívvá válik), és az új helyzetet az esemény
// fényében kell újraértékelni.
//
// Egy eset mezői:
//   id, round (1-3), reserve (opcionális, alapból false),
//   name, capacity (1-5), description,
//   urgency/fairness/systemic/coordination (1-3), focus
// ============================================================

export const GAME_TITLE = "Vezetői Válságstáb";
export const TOTAL_ROUNDS = 3;
export const ROUND_CAPACITY = { 1: 12, 2: 10, 3: 8 };
export const SWAP_ON_EVENT = 2; // hány aktív ügyet cserél egy esemény csapatonként

export const METRIC_LABELS = {
  trust: "Hallgatói bizalom",
  fairness: "Méltányosság",
  stability: "Működési stabilitás",
  learning: "Szervezeti tanulás",
  risk: "Felhalmozott kockázat",
};

export const ROLE_LABELS = [
  { id: "leader", label: "Döntéshozó", hint: "Összefoglalja és véglegesíti a döntést." },
  { id: "student", label: "Hallgatói szempont", hint: "Az érintettek és a méltányosság hangja." },
  { id: "rules", label: "Szabályossági felelős", hint: "Eljárási, jogorvoslati és határidős kockázatokat figyel." },
  { id: "system", label: "Rendszerfelelős", hint: "A hosszú távú működést és a kiváltó okokat keresi." },
  { id: "comms", label: "Kommunikációs vezető", hint: "Megfogalmazza, hogyan indokolható és közölhető a döntés." },
];

export const DECISION_MODES = [
  {
    id: "resolve",
    label: "Azonnal megoldjuk",
    short: "Érdemi kezelés",
    icon: "✓",
    description: "Teljes kapacitást fordítotok az ügyre, és tartós megoldásra törekedtek.",
  },
  {
    id: "stabilize",
    label: "Stabilizáljuk",
    short: "Időt nyerünk",
    icon: "⏱",
    description: "Csökkentitek az azonnali kárt, de a gyökérok vagy a végleges döntés későbbre marad.",
  },
  {
    id: "delegate",
    label: "Delegáljuk",
    short: "Partnert vonunk be",
    icon: "⇄",
    description: "Más egységre, szakértőre vagy partnerségre támaszkodtok; koordinációs kockázattal.",
  },
  {
    id: "defer",
    label: "Vállaljuk a kockázatot",
    short: "Most nem kezeljük",
    icon: "!",
    description: "Nem fordítotok rá kapacitást ebben a körben, és tudatosan vállaljátok a következményt.",
  },
];

export const EVENTS = [
  {
    id: "none",
    name: "Nyugodt működési hét",
    description: "Nincs rendkívüli külső esemény. A csapat a normál körülmények között dönt.",
    effect: "Nincs módosító hatás, és nincs kártyacsere.",
    capacityModifier: 0,
  },
  {
    id: "capacity_cut",
    name: "Váratlan kapacitáscsökkentés",
    description: "Két munkatárs sürgős más feladatot kap. Kevesebb idő marad az ügyekre.",
    effect: "A kör kapacitása 2 ponttal csökken.",
    capacityModifier: -2,
  },
  {
    id: "public_attention",
    name: "Nyilvánossági nyomás",
    description: "Az ügyekről hallgatói posztok és sajtómegkeresések jelennek meg.",
    effect: "A halasztott ügyek további bizalomvesztést és kockázatot okoznak.",
    capacityModifier: 0,
  },
  {
    id: "deadline_wave",
    name: "Határidőhullám",
    description: "Több jogorvoslati és tanulmányi határidő egyszerre közeleg.",
    effect: "A magas sürgősségű, nem érdemben kezelt ügyek kockázata nő.",
    capacityModifier: 0,
  },
  {
    id: "partner_offer",
    name: "Partnerségi ajánlat",
    description: "Egy társegység ideiglenesen segítséget ajánl a koordinációhoz.",
    effect: "A delegált ügyek koordinációs kockázata kisebb ebben a körben.",
    capacityModifier: 0,
  },
  {
    id: "system_window",
    name: "Rendszerfejlesztési ablak",
    description: "Informatikai és folyamatfejlesztési szakértők egy rövid időre elérhetők.",
    effect: "A rendszerszintű ügyek érdemi kezelése több szervezeti tanulást hoz.",
    capacityModifier: 0,
  },
  {
    id: "legal_review",
    name: "Fokozott jogi kontroll",
    description: "Minden méltányossági és jogorvoslati ügyet részletesebben kell dokumentálni.",
    effect: "A méltányossági és jogorvoslati ügyek kezelése jobb méltányossági eredményt ad.",
    capacityModifier: 0,
  },
  {
    id: "staff_absence",
    name: "Kulcsember kiesése",
    description: "A csapat egyik tapasztalt tagja a teljes körben nem elérhető.",
    effect: "A kör kapacitása 1 ponttal csökken.",
    capacityModifier: -1,
  },
];

export const TEAMS = [
  { id: "team1", name: "Kurzusok és előrehaladás", short: "Kurzusok", color: "#f97316" },
  { id: "team2", name: "Vizsgák és értékelés", short: "Vizsgák", color: "#38bdf8" },
  { id: "team3", name: "Méltányosság és szakdolgozat", short: "Méltányosság", color: "#34d399" },
  { id: "team4", name: "Rendszerszintű és finanszírozási ügyek", short: "Rendszerszint", color: "#c084fc" },
];

export const CASES = {
  team1: [
    // ---- 1. forduló · aktív (5) ----
    { id: "t1_capacity_115", round: 1, name: "A 115%-os kapacitás sem volt elég", capacity: 4, urgency: 3, fairness: 3, systemic: 2, coordination: 2, focus: "Kapacitástervezés, érintetti hatás és gyors döntés.", description: "Egy kötelező kurzus létszámkeretét a kari szabályok szerint megemelték, ennek ellenére több hallgató továbbra sem tudta felvenni a tárgyat. A kurzus évente egyszer indul, ezért a kimaradók tanulmányai akár egy teljes félévvel is csúszhatnak." },
    { id: "t1_low_enrollment", round: 1, name: "Minimumlétszám alatt maradt specializációs kurzus", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 2, focus: "Gazdaságosság és egyéni szakmai utak egyensúlya.", description: "Egy specializációhoz kapcsolódó kurzusra a meghirdetett minimumlétszámnál kevesebben jelentkeztek, ezért a szervezeti egység a tárgy törlését tervezi. A hallgatók más tárggyal teljesíthetik a kreditet, de többük szakmai terve közvetlenül ehhez a kurzushoz kapcsolódik." },
    { id: "t1_module_collision", round: 1, name: "Két választható modul kötelező órái ütköznek", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 3, focus: "Egységek közötti koordináció és ütemezési felelősség.", description: "A hallgatók két különböző választható modul közül szeretnének tárgyakat teljesíteni, de a modulok kötelező óráit ugyanarra az időpontra hirdették meg. Az ütközés miatt az egyik modul elvégzése kerülhet veszélybe." },
    { id: "t1_waitlist_fairness", round: 1, name: "Vitatott várólista-sorrend", capacity: 4, urgency: 3, fairness: 3, systemic: 1, coordination: 2, focus: "Átlátható, igazolható rangsorolás szűkös helyen.", description: "Egy népszerű, korlátozott helyű kurzus várólistáján a hallgatók nem értik, milyen elv szerint kerültek sorra. Néhány magasabb évfolyamos, végzéshez közeli hallgató a lista végére került, ezért méltánytalanságot kifogásol." },
    { id: "t1_room_clash", round: 1, name: "Terembeosztási ütközés a hét felében", capacity: 3, urgency: 2, fairness: 1, systemic: 2, coordination: 3, focus: "Logisztikai gyökérok és gyors átszervezés.", description: "Két kötelező kurzust adminisztrációs hiba miatt ugyanabba a terembe és időpontba osztottak be. A hiba minden héten megismétlődik, és a hallgatók fele rendszeresen nem fér be a terembe." },
    // ---- 1. forduló · tartalék (3) ----
    { id: "t1_prereq_block", round: 1, reserve: true, name: "Előfeltétel hiánya zárja ki a kötelező tárgyat", capacity: 3, urgency: 3, fairness: 2, systemic: 2, coordination: 2, focus: "Formai akadály és tényleges felkészültség.", description: "A rendszer előfeltétel hiányára hivatkozva nem engedi felvenni egy hallgatónak a kötelező tárgyat, pedig az előfeltételt egy párhuzamosan futó, még nem lezárt kurzuson teljesíti. A felvételi időszak két nap múlva zárul." },
    { id: "t1_language_group", round: 1, reserve: true, name: "Nyelvi csoportba sorolás vitája", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 2, focus: "Besorolási elv következetessége.", description: "Több hallgató úgy érzi, a szintfelmérő alapján rossz nyelvi csoportba került, és emiatt vagy túl könnyű, vagy teljesíthetetlen a kurzus. Az átsorolás felborítaná a csoportlétszámokat." },
    { id: "t1_lab_shortage", round: 1, reserve: true, name: "Kevés laborhely a kötelező gyakorlaton", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 3, focus: "Erőforráskorlát és biztonságos ütemezés.", description: "Egy kötelező laborgyakorlaton a munkaállomások száma feleannyi, mint a jelentkezőké. A megosztott használat rontja a gyakorlat minőségét, a plusz alkalmak beütemezése viszont több egység egyeztetését igényli." },

    // ---- 2. forduló · aktív (5) ----
    { id: "t1_dual_program_collision", round: 2, name: "Két ELTE-s képzés kötelező órái ütköznek", capacity: 3, urgency: 2, fairness: 3, systemic: 1, coordination: 3, focus: "Egyéni méltányosság és szervezeti felelősségi határok.", description: "Egy hallgató párhuzamosan két ELTE-s képzésben vesz részt, és mindkét szakon kötelező tárgyakat kell teljesítenie. Két olyan kurzusa ütközik, amelyeket egyik képzésen sem tud másik időpontban felvenni." },
    { id: "t1_late_registration", round: 2, name: "Utólagos kurzusfelvételi kérelem", capacity: 2, urgency: 3, fairness: 2, systemic: 1, coordination: 1, focus: "Hiányos információ melletti gyors és arányos döntés.", description: "A hallgató a kurzusfelvételi időszak lezárása után szeretne felvenni egy kötelező tárgyat. A kurzuson még van férőhely, de a kérelemben pontatlan kurzuskód és hiányos indokolás szerepel, miközben a pótlási határidő közeledik." },
    { id: "t1_illness_course", round: 2, name: "Betegség miatt teljesíthetetlen kurzus", capacity: 3, urgency: 3, fairness: 3, systemic: 1, coordination: 2, focus: "Méltányosság, teljesíthetőség és követelmények integritása.", description: "A hallgató a félév közepén súlyosan megbetegszik, ezért nem tud részt venni egy kötelező, jelenléthez kötött gyakorlati kurzuson. Igazolással rendelkezik, de a rendes kurzusleadási időszak már lezárult." },
    { id: "t1_credit_overload", round: 2, name: "Kreditkeret fölötti felvételi kérelem", capacity: 3, urgency: 2, fairness: 2, systemic: 1, coordination: 2, focus: "Támogató rugalmasság és a hallgató túlterhelése.", description: "Egy jó tanulmányi eredményű hallgató a szabályzatban rögzített maximális kreditkeret fölött venne fel tárgyakat, hogy hamarabb végezzen. A kérés indokolt, de precedenst teremthet és túlterheléshez is vezethet." },
    { id: "t1_instructor_gap", round: 2, name: "Oktató tartós távolléte miatt elmaradó órák", capacity: 4, urgency: 3, fairness: 2, systemic: 2, coordination: 3, focus: "Folytonosság biztosítása és helyettesítés szervezése.", description: "Egy kötelező kurzus oktatója váratlanul, hosszabb időre kiesik, és több hét óra marad el. Helyettesítő bevonható, de csak a tematika egy részét vállalná, a pótlás pedig több csoport órarendjét érinti." },
    // ---- 2. forduló · tartalék (3) ----
    { id: "t1_schedule_shift", round: 2, reserve: true, name: "Félév közbeni órarendváltozás", capacity: 2, urgency: 3, fairness: 2, systemic: 1, coordination: 2, focus: "Kiszámíthatóság és a már megtervezett félév.", description: "Egy kötelező kurzus időpontját a félév közepén áthelyezik, ami több tucat hallgató munkarendjével és másik órájával ütközik. A változtatás szervezési okból indokolt, de sok érintettet készületlenül ér." },
    { id: "t1_all_groups_full", round: 2, reserve: true, name: "Egy kötelező tárgy minden csoportja betelt", capacity: 3, urgency: 3, fairness: 3, systemic: 2, coordination: 2, focus: "Hozzáférés biztosítása a végzés érdekében.", description: "Egy végzéshez szükséges kötelező tárgy összes csoportja megtelt, több hallgató pedig nem fért be egyikbe sem. Új csoport indítása oktatói és termi kapacitást igényel, amit gyorsan kellene előteremteni." },
    { id: "t1_transfer_recognition", round: 2, reserve: true, name: "Átvett hallgató kurzusbeszámítása", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 3, focus: "Következetes beszámítás és tanulmányi út védelme.", description: "Egy másik intézményből átvett hallgató korábban teljesített kurzusainak beszámítása vitatott. A tárgyak tartalma részben fedi egymást, és a döntés több tanszék szakmai véleményét igényli." },

    // ---- 3. forduló · aktív (5) ----
    { id: "t1_absence_dispute", round: 3, name: "Vita a megengedett hiányzásról", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Szabályértelmezés, arányosság és konfliktuskezelés.", description: "Egy hallgató a foglalkozások pontosan egynegyedéről hiányzott. Az oktató kizárólag erre hivatkozva nem kíván gyakorlati jegyet adni, a hallgató viszont azt állítja, hogy minden beadandót és számonkérést teljesített." },
    { id: "t1_forty_questions", round: 3, name: "Negyven azonos hallgatói kérdés", capacity: 1, urgency: 2, fairness: 1, systemic: 3, coordination: 1, focus: "Tűzoltás helyett világos, skálázható kommunikáció.", description: "Egy fontos tanulmányi határidőről több tucat hallgató kérdez egyszerre. A hivatalos információ elérhető, de egy hosszú szabályzatban és nehezen megtalálható kari tájékoztatóban szerepel, ezért a hallgatók bizonytalanok." },
    { id: "t1_last_offering", round: 3, name: "Utoljára induló kötelező tárgy kimarad", capacity: 3, urgency: 3, fairness: 3, systemic: 2, coordination: 2, focus: "Visszafordíthatatlan következmény és pályavédelem.", description: "Egy kifutó képzés utolsó alkalommal induló kötelező tárgya a jelentkezők alacsony száma miatt elmaradna. Az érintett hallgatóknak nem lesz több lehetőségük a kredit megszerzésére, ami a végzésüket akadályozza." },
    { id: "t1_split_unfair", round: 3, name: "Méltánytalannak érzett csoportbontás", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Igazságosság érzete és átlátható szabály.", description: "Egy nagy létszámú kurzust két csoportra bontottak, de a hallgatók szerint az egyik csoport lényegesen szigorúbb oktatót és nehezebb számonkérést kapott. Azonos tárgyból eltérő esélyt kifogásolnak." },
    { id: "t1_repeat_funding", round: 3, name: "Ismételt tárgyfelvétel finanszírozási határon", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 2, focus: "Szabály betűje és a hallgató továbbhaladása.", description: "Egy hallgató egy tárgyat többedszer venne fel, ami a finanszírozási és kreditszabályok határát súrolja. A továbbhaladása múlik rajta, de a kivétel pénzügyi és precedenskérdéseket is felvet." },
    // ---- 3. forduló · tartalék (3) ----
    { id: "t1_attendance_rules", round: 3, reserve: true, name: "Eltérő jelenléti követelmények", capacity: 2, urgency: 2, fairness: 2, systemic: 2, coordination: 2, focus: "Egységes elvárás azonos képzésen belül.", description: "Ugyanazon tárgy két oktatója eltérő jelenléti követelményt támaszt, ezért a hallgatók más-más feltétellel teljesíthetik a kurzust. A különbség a félév vége felé válik igazán feszültté." },
    { id: "t1_late_drop_req", round: 3, reserve: true, name: "Késői tárgyleadási kérelem", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 1, focus: "Határidőn túli méltányosság mértéke.", description: "Egy hallgató a leadási időszak után szeretne leadni egy tárgyat, mert időközben világossá vált, hogy nem tudja teljesíteni. A késés részben a saját mulasztása, részben rossz tájékoztatás következménye." },
    { id: "t1_curriculum_gap", round: 3, reserve: true, name: "Tantervi hiány miatt nem teljesíthető kredit", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Rendszerhiba és egyéni kártalanítás.", description: "Egy tantervi hiány miatt egy kötelező kredit egyetlen meghirdetett tárggyal sem szerezhető meg a hallgatók egy csoportjának. Az egyedi mentesítés gyors, de a tanterv javítása több egység közös munkája." },
  ],

  team2: [
    // ---- 1. forduló · aktív (5) ----
    { id: "t2_oral_exam", round: 1, name: "Vitatott szóbeli vizsgáztatás", capacity: 4, urgency: 3, fairness: 3, systemic: 2, coordination: 2, focus: "Bizonytalanság, több érintetti narratíva és tisztességes eljárás.", description: "Több hallgató egymástól függetlenül jelzi, hogy az oktató a szóbeli vizsgán megalázó hangnemben beszélt velük, illetve nehezebb kérdéseket kaptak, mint mások. Az oktató szerint kizárólag szakmai visszakérdezéseket tett fel, és nincs hangfelvétel vagy jegyzőkönyv." },
    { id: "t2_ai_group", round: 1, name: "Egy csoporttag tiltott MI-használata", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Egyéni és kollektív felelősség elkülönítése.", description: "Egy csoportos beadandó egyik tagja a többiek tudta nélkül tiltott módon generatív mesterséges intelligenciát használt. Az oktató az egész csoport munkáját elégtelenre értékelné, miközben a többi hallgató azt állítja, hogy nem ismerte a szabálytalanságot." },
    { id: "t2_online_disconnect", round: 1, name: "Online vizsgahiba dokumentált kapcsolatmegszakadással", capacity: 2, urgency: 3, fairness: 3, systemic: 1, coordination: 1, focus: "Bizonyítékok, gyors korrekció és eljárási biztonság.", description: "Egy hallgató online írásbeli vizsgája közben megszakad az internetkapcsolat, ezért nem tudja beadni a válaszait. Képernyőképpel és szolgáltatói hibajelzéssel rendelkezik, a tanulmányi rendszer azonban már sikertelen teljesítést rögzített." },
    { id: "t2_grading_scale", round: 1, name: "Utólag módosított pontozási kulcs", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 2, focus: "Kiszámíthatóság és a már megírt dolgozat.", description: "Egy zárthelyi kijavítása után az oktató módosítja a ponthatárokat, mert szerinte a feladatsor túl nehéz volt. Egyes hallgatók így jobb, mások rosszabb helyzetbe kerülnek a meghirdetett kulcshoz képest." },
    { id: "t2_seating_shortage", round: 1, name: "Kevés vizsgahely a vizsgaidőszakban", capacity: 4, urgency: 3, fairness: 2, systemic: 2, coordination: 3, focus: "Hozzáférés és tervezési kapacitás.", description: "Egy nagy létszámú tárgy vizsgáira lényegesen kevesebb hely jut, mint amennyi hallgató vizsgázni szeretne a határidő előtt. A pótalkalmak megszervezése terem- és felügyelőkapacitást igényel több egységtől." },
    // ---- 1. forduló · tartalék (3) ----
    { id: "t2_proctoring_flag", round: 1, reserve: true, name: "Felügyeleti csalásgyanú bizonyíték nélkül", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Gyanú és ártatlanság vélelme.", description: "Egy online felügyeleti rendszer csalásgyanúsként jelöl meg több hallgatót, de a jelzések önmagukban nem bizonyítanak szabálytalanságot. Az automatikus elutasítás igazságtalan lehet, a jelzés figyelmen kívül hagyása viszont kockázatos." },
    { id: "t2_retake_fee", round: 1, reserve: true, name: "Vitatott ismétlővizsga-díj", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 1, focus: "Szabály és méltányosság a díjaknál.", description: "Egy hallgató szerint jogtalanul számoltak fel ismétlővizsga-díjat, mert az első alkalom intézményi hiba miatt maradt el. A díj összege kicsi, de az elv több hallgatót is érint." },
    { id: "t2_question_leak", round: 1, reserve: true, name: "Kiszivárgott tételsor gyanúja", capacity: 3, urgency: 3, fairness: 3, systemic: 2, coordination: 2, focus: "Integritás és arányos reakció.", description: "A vizsga előtt felmerül, hogy a feladatsor egy része kiszivárgott, és néhány hallgató előnyhöz juthatott. A vizsga törlése mindenkit büntetne, a figyelmen kívül hagyás viszont aláásná az értékelés hitelét." },

    // ---- 2. forduló · aktív (5) ----
    { id: "t2_failure_rates", round: 2, name: "Három ZH-n 64–66% a sikertelenség", capacity: 4, urgency: 2, fairness: 2, systemic: 3, coordination: 2, focus: "Küszöbértékek mögötti trendek és vezetői felelősség.", description: "Egy kötelező tárgy három egymást követő zárthelyijén 64%, 65% és 66% a sikertelen dolgozatok aránya. Egyetlen alkalom sem éri el a kötelező intézményi vizsgálat küszöbét, de a tartósan magas bukási arány rendszerszintű problémát jelez." },
    { id: "t2_late_results", round: 2, name: "Szabályos, de késői eredményközlés", capacity: 3, urgency: 3, fairness: 2, systemic: 2, coordination: 2, focus: "Formális megfelelés és tényleges hallgatói hatás különbsége.", description: "Egy nagy létszámú vizsga eredményeit az oktató a megengedett határidőn belül, de csak közvetlenül a következő vizsgaalkalom előtt teszi közzé. A hallgatók alig kapnak időt a felkészülésre, a következő alkalom férőhelyei pedig gyorsan betelnek." },
    { id: "t2_wrong_grade", round: 2, name: "A Neptunban más jegy szerepel", capacity: 2, urgency: 3, fairness: 3, systemic: 1, coordination: 2, focus: "Határidővédelem és adatkorrekció több szereplő között.", description: "A hallgató dolgozatán jó érdemjegy szerepel, a Neptunban azonban ennél rosszabb eredményt rögzítettek. A kifogás benyújtására nyitva álló időből már csak két nap maradt, az oktató pedig egyelőre nem válaszol." },
    { id: "t2_group_grade", round: 2, name: "Egységes csoportjegy eltérő teljesítmény mellett", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Egyéni hozzájárulás és közös értékelés.", description: "Egy csoportmunkára az oktató mindenkinek azonos jegyet ad, több hallgató viszont jelzi, hogy egy-két társuk alig vett részt a munkában. Az egyéni értékelés igazságosabb, de nehezen dokumentálható." },
    { id: "t2_exam_overlap", round: 2, name: "Két kötelező vizsga ütközése", capacity: 3, urgency: 3, fairness: 2, systemic: 1, coordination: 3, focus: "Ütemezés és hallgatói teljesíthetőség.", description: "Két kötelező tárgy egyetlen meghirdetett vizsgaidőpontja egybeesik, így az érintett hallgatók egyik vizsgáról szükségszerűen lemaradnak. A pótidőpont több oktató és a tanulmányi osztály egyeztetését igényli." },
    // ---- 2. forduló · tartalék (3) ----
    { id: "t2_appeal_deadline", round: 2, reserve: true, name: "Jogorvoslati határidő az utolsó pillanatban", capacity: 2, urgency: 3, fairness: 3, systemic: 1, coordination: 1, focus: "Határidővédelem és gyors ügyintézés.", description: "Egy hallgató kifogásának jogorvoslati határideje néhány órán belül lejár, de a döntéshez szükséges egyik dokumentum még hiányzik. A késedelem elzárná a hallgatót a jogorvoslattól." },
    { id: "t2_rubric_missing", round: 2, reserve: true, name: "Hiányzó értékelési szempontrendszer", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 2, focus: "Átlátható értékelés és utólagos pótlás.", description: "Egy beadandóhoz nem hirdettek meg előre értékelési szempontokat, ezért a hallgatók nem tudják, mi alapján kaptak jegyet. Az utólagos szempontrendszer segíthet, de vitatható, hogy visszamenőleg alkalmazható-e." },
    { id: "t2_makeup_exam", round: 2, reserve: true, name: "Pótvizsga megszervezése rövid idő alatt", capacity: 3, urgency: 2, fairness: 2, systemic: 1, coordination: 3, focus: "Erőforrás-szervezés és egyenlő esély.", description: "Több igazoltan távol maradt hallgatónak kellene pótvizsgát biztosítani a vizsgaidőszak vége előtt. Az új alkalomhoz oktatót, termet és feladatsort kell szervezni, miközben az egyenlő feltételt is tartani kell." },

    // ---- 3. forduló · aktív (5) ----
    { id: "t2_new_examiner", round: 3, name: "Újabb ismétlővizsga más oktató előtt", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 3, focus: "Pártatlanság és megvalósítható erőforrás-szervezés.", description: "A hallgató ismétlővizsgája sikertelen lett, ezért írásban kéri, hogy a következő alkalommal másik oktató vagy vizsgabizottság előtt vizsgázhasson. Az intézet szerint rövid idő alatt nehéz másik vizsgáztatót biztosítani." },
    { id: "t2_exam_slots", round: 3, name: "Nem megfelelő vizsgaalkalmak", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 3, focus: "Tervezési minimumok és hallgatói hozzáférés.", description: "Egy írásbeli vizsgából csak két időpontot hirdettek meg, és az alkalmak elosztása sem biztosít megfelelő felkészülési lehetőséget. Több hallgató számára az egyik időpont másik kötelező vizsgával is ütközik." },
    { id: "t2_last_attempt", round: 3, name: "Utolsó vizsgalehetőség egy tárgyból", capacity: 3, urgency: 3, fairness: 3, systemic: 1, coordination: 2, focus: "Visszafordíthatatlan tét és tisztességes feltétel.", description: "Egy hallgatónak ez az utolsó megengedett vizsgalehetősége egy kötelező tárgyból; sikertelenség esetén elveszíti a jogviszonyát. A vizsga körülményeivel kapcsolatban méltányossági kifogást emel." },
    { id: "t2_plagiarism_soft", round: 3, name: "Bizonytalan plágiumgyanú a záródolgozatban", capacity: 2, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Gyanú súlya és tisztességes eljárás.", description: "Egy hasonlóságvizsgálat közepes egyezést jelez egy záródolgozatnál, de nem egyértelmű, hogy szándékos plágiumról vagy szabályos hivatkozásról van szó. A döntés a hallgató végzését befolyásolja." },
    { id: "t2_grade_delay_close", round: 3, name: "Késői jegybeírás a záróvizsga előtt", capacity: 1, urgency: 2, fairness: 2, systemic: 1, coordination: 1, focus: "Skálázható emlékeztetés és határidő.", description: "Több oktató a záróvizsga-jelentkezési határidő előtti napokban sem írta be az érdemjegyeket, ezért hallgatók tucatjai nem tudnak jelentkezni. Az egyedi sürgetés lassú, kell egy gyors, egységes megoldás." },
    // ---- 3. forduló · tartalék (3) ----
    { id: "t2_oral_bias", round: 3, reserve: true, name: "Elfogultsági kifogás a szóbelin", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Pártatlanság látszata és bizonyíthatóság.", description: "Egy hallgató szerint a vizsgáztató személyes elfogultsága miatt kapott rosszabb jegyet. Konkrét bizonyíték nincs, de a helyzet a vizsgáztatás hitelét is érinti." },
    { id: "t2_scan_error", round: 3, reserve: true, name: "Beolvasási hiba a dolgozatnál", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 1, focus: "Adatkorrekció és bizonyíték.", description: "Egy optikailag kiértékelt teszt egy hallgatónál technikai beolvasási hiba miatt kevesebb pontot rögzített. A javítás egyszerű, de precedenst teremthet más, nehezebben ellenőrizhető esetekre." },
    { id: "t2_committee_conflict", round: 3, reserve: true, name: "Vizsgabizottsági összeférhetetlenség", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 3, focus: "Összeférhetetlenség és pótlás.", description: "Kiderül, hogy egy vizsgabizottság egyik tagja közeli kapcsolatban áll a vizsgázóval. A csere pártatlanabb, de rövid idő alatt nehéz megfelelő pótlást szervezni." },
  ],

  team3: [
    // ---- 1. forduló · aktív (5) ----
    { id: "t3_accommodation_tech", round: 1, name: "Vizsgakedvezmény technikai akadállyal", capacity: 3, urgency: 3, fairness: 3, systemic: 2, coordination: 3, focus: "Jogosultság gyakorlati biztosítása és technikai felelősség.", description: "Három hallgató hivatalosan megállapított többletidőre jogosult egy online vizsgán. A vizsgafelület azonban minden résztvevőnél egyszerre zár le, és az első vizsga egy héten belül esedékes." },
    { id: "t3_six_extensions", round: 1, name: "Hat egyéni beadási haladékkérelem", capacity: 2, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Következetesség és egyéni mérlegelés egyensúlya.", description: "Hat hallgató eltérő személyes és egészségi körülményekre hivatkozva kéri ugyanannak a nagy beadandónak a későbbi leadását. Az oktató egységes eljárást szeretne, de az esetek súlya és igazolhatósága jelentősen különbözik." },
    { id: "t3_supervisor_leaves", round: 1, name: "Témavezető távozása", capacity: 4, urgency: 3, fairness: 3, systemic: 2, coordination: 3, focus: "Kríziskoordináció, veszteségmegosztás és hallgatói pályák védelme.", description: "Hat végzős hallgató témavezetője váratlanul távozik az egyetemről három hónappal a szakdolgozati határidő előtt. Új témavezetők bevonhatók, de többen csak a témák jelentős módosításával vállalnák a hallgatókat." },
    { id: "t3_disability_support", round: 1, name: "Fogyatékossággal élő hallgató észszerű alkalmazkodása", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 3, focus: "Jogosultság és a követelmények lényege.", description: "Egy fogyatékossággal élő hallgató több kurzuson kér segédeszközt és módosított számonkérést. A kedvezmények egy része könnyen biztosítható, másoknál a tárgy lényegi követelménye a kérdés, és több oktatót érint." },
    { id: "t3_grief_leave", round: 1, name: "Gyász miatti méltányossági kérelem", capacity: 3, urgency: 3, fairness: 3, systemic: 1, coordination: 2, focus: "Emberi helyzet és a követelmények tartása.", description: "Egy hallgató közeli hozzátartozója elvesztése miatt kér haladékot és mentesítést több számonkérés alól a vizsgaidőszak közepén. A helyzet emberileg egyértelmű, a méltányosság mértéke és formája viszont nem." },
    // ---- 1. forduló · tartalék (3) ----
    { id: "t3_language_barrier", round: 1, reserve: true, name: "Nyelvi akadály a nemzetközi hallgatónál", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Hozzáférés és egyenlő feltétel.", description: "Egy nemzetközi hallgató jelzi, hogy a magyar nyelvű vizsgaanyag miatt hátrányba került egy egyébként angol nyelvűként hirdetett kurzuson. A fordítás időigényes, a vizsga viszont közeleg." },
    { id: "t3_financial_hardship", round: 1, reserve: true, name: "Anyagi nehézség miatti kérelem", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Szociális méltányosság és keretek.", description: "Egy hallgató anyagi ellehetetlenülésre hivatkozva kér halasztást és díjmentességet. A helyzet valós, de a rendelkezésre álló méltányossági keret szűkös, és több hasonló kérelem is érkezik." },
    { id: "t3_caregiver", round: 1, reserve: true, name: "Ápolási kötelezettség melletti tanulás", capacity: 3, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Rugalmasság és teljesíthetőség.", description: "Egy hallgató tartósan beteg hozzátartozóját ápolja, ezért több jelenléti órán nem tud részt venni. Kivételes rendet kér, amit egyes gyakorlati tárgyaknál nehéz biztosítani." },

    // ---- 2. forduló · aktív (5) ----
    { id: "t3_topic_six_weeks", round: 2, name: "Hat hete nincs döntés a szakdolgozati témáról", capacity: 2, urgency: 3, fairness: 2, systemic: 2, coordination: 2, focus: "Döntési késedelem és láthatatlan időveszteség.", description: "Egy hallgató hat hete benyújtotta a szakdolgozati témabejelentését, de sem elfogadó, sem elutasító döntést nem kapott. A kutatáshoz szükséges adatfelvételt csak a téma jóváhagyása után kezdhetné meg." },
    { id: "t3_health_exception", round: 2, name: "Egészségi okból kért kivételes tanulmányi rend", capacity: 3, urgency: 2, fairness: 3, systemic: 1, coordination: 3, focus: "Észszerű alkalmazkodás és képzési követelmények.", description: "Egy hallgató tartós egészségi állapotára és rendszeres kezeléseire hivatkozva kivételes tanulmányi rendet kér. Igazolásai rendelkezésre állnak, de több kurzus követelménye jelenléti vagy gyakorlati jellegű." },
    { id: "t3_work_exception", round: 2, name: "Munkavégzés miatt kért kivételes tanulmányi rend", capacity: 1, urgency: 1, fairness: 2, systemic: 1, coordination: 1, focus: "Sürgősségérzet és tényleges megalapozottság szétválasztása.", description: "Egy hallgató teljes munkaidős foglalkoztatása miatt szeretne mentesülni több kötelező óra látogatása alól. A kérelem sürgősnek tűnik, de az indok önmagában nem feltétlenül alapozza meg a kért kedvezményt." },
    { id: "t3_thesis_data_delay", round: 2, name: "Adatfelvétel csúszása a szakdolgozatnál", capacity: 3, urgency: 3, fairness: 2, systemic: 2, coordination: 3, focus: "Külső függőség és határidő.", description: "Egy hallgató szakdolgozati adatfelvétele egy külső partner engedélyének csúszása miatt hetekkel elmarad. A leadási határidő fix, és a helyzet több hasonló témájú hallgatót is érint." },
    { id: "t3_supervisor_conflict", round: 2, name: "Témavezetői konfliktus a szakdolgozatban", capacity: 4, urgency: 2, fairness: 3, systemic: 2, coordination: 3, focus: "Kapcsolati kockázat és pártatlan segítség.", description: "Egy hallgató és témavezetője között elmérgesedett a viszony, a hallgató szerint a témavezető akadályozza a haladását. A témavezető-váltás megoldás lehet, de késői, és a tanszék belső egyeztetését igényli." },
    // ---- 2. forduló · tartalék (3) ----
    { id: "t3_second_supervisor", round: 2, reserve: true, name: "Társtémavezető bevonása", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 3, focus: "Szakértelem és felelősségi határok.", description: "Egy interdiszciplináris szakdolgozathoz társtémavezetőt kellene bevonni egy másik tanszékről. A megoldás javítaná a minőséget, de a felelősség és az értékelés megosztása nem tisztázott." },
    { id: "t3_extension_precedent", round: 2, reserve: true, name: "Precedensértékű haladékkérelem", capacity: 2, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Egyedi méltányosság és általános elv.", description: "Egy méltányossági haladék megadása egy jól dokumentált esetben precedenst teremthet több, kevésbé egyértelmű kérelemhez. A következetesség és az egyedi mérlegelés feszül egymásnak." },
    { id: "t3_remote_defense", round: 2, reserve: true, name: "Távoli szakdolgozatvédés kérése", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 2, focus: "Hozzáférés és eljárási biztonság.", description: "Egy külföldön tartózkodó hallgató online szakdolgozatvédést kér. A technikai megvalósítás lehetséges, de az azonosítás és az egyenlő feltétel biztosítása kérdéseket vet fel." },

    // ---- 3. forduló · aktív (5) ----
    { id: "t3_three_deadlines", round: 3, name: "Három eltérő szakdolgozati határidő", capacity: 3, urgency: 3, fairness: 3, systemic: 3, coordination: 3, focus: "Intézményi felelősség, egységes kommunikáció és méltányosság.", description: "A kari honlapon, a tanszéki tájékoztatóban és a Neptun-üzenetben három különböző szakdolgozati leadási határidő szerepel. Több hallgató a későbbi dátummal számol, miközben a rendszerben a legkorábbi határidő van beállítva." },
    { id: "t3_five_year_exam", round: 3, name: "Az ötéves záróvizsga-határidő vége", capacity: 3, urgency: 3, fairness: 2, systemic: 1, coordination: 2, focus: "Visszafordíthatatlan határidő és pontos tájékoztatás.", description: "Egy hallgató jogviszonya közel öt éve szűnt meg, és még nem tette le a záróvizsgát. A következő vizsgaidőszak még beleférhet a határidőbe, a rákövetkező azonban már nem, ezért az ügy gyors és pontos tájékoztatást igényel." },
    { id: "t3_thesis_similarity", round: 3, name: "Vitatott hasonlóságvizsgálat", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Módszer megbízhatósága és méltányos elbírálás.", description: "Egy szakdolgozat hasonlóságvizsgálata magas értéket mutat, de nagyrészt szabályos idézetek és kötelező jogszabályi szövegek miatt. Az automatikus elutasítás igazságtalan lenne, a figyelmen kívül hagyás viszont kockázatos." },
    { id: "t3_late_medical", round: 3, name: "Késői orvosi igazolás benyújtása", capacity: 2, urgency: 3, fairness: 3, systemic: 1, coordination: 2, focus: "Igazolhatóság és arányos méltányosság.", description: "Egy hallgató a vizsgáról való távolmaradását igazoló orvosi papírt csak jóval a határidő után nyújtja be, kórházi kezelésre hivatkozva. Az igazolás valódinak tűnik, de a késés eljárási kérdéseket vet fel." },
    { id: "t3_defense_slot", round: 3, name: "Nincs elérhető védési időpont", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 3, focus: "Ütemezés és egyenlő hozzáférés.", description: "Több végzős hallgatónak nem jut szakdolgozatvédési időpont a meghirdetett napokon, ami a diplomaszerzésüket csúsztatja. A pótalkalom bizottsági tagok és termek egyeztetését igényli." },
    // ---- 3. forduló · tartalék (3) ----
    { id: "t3_appeal_committee", round: 3, reserve: true, name: "Méltányossági bizottság elé vitt ügy", capacity: 3, urgency: 2, fairness: 3, systemic: 2, coordination: 3, focus: "Testületi döntés és időigény.", description: "Egy összetett méltányossági ügyet a hallgató a bizottság elé vinne, de a legközelebbi ülés csak a határidő után lenne. A gyors egyedi döntés és a testületi legitimáció feszül egymásnak." },
    { id: "t3_equity_precedent", round: 3, reserve: true, name: "Egyenlő bánásmód korábbi döntés fényében", capacity: 2, urgency: 2, fairness: 3, systemic: 2, coordination: 2, focus: "Következetesség és egyedi körülmény.", description: "Egy hallgató arra hivatkozik, hogy egy társa hasonló helyzetben kedvezményt kapott, ezért ő is ugyanazt kéri. A két eset lényegi körülményei azonban részben eltérnek." },
    { id: "t3_reentry_request", round: 3, reserve: true, name: "Visszavételi kérelem méltányosságból", capacity: 2, urgency: 2, fairness: 2, systemic: 1, coordination: 2, focus: "Második esély és feltételek.", description: "Egy elbocsátott hallgató méltányosságból kéri a tanulmányai folytatását, javuló élethelyzetére hivatkozva. A visszavétel lehetséges, de feltételekhez kötése és a precedens kezelése mérlegelést igényel." },
  ],

  team4: [
    // ---- 1. forduló · aktív (5) ----
    { id: "t4_curriculum_change", round: 1, name: "Felmenő rendszerű tantervi módosítás", capacity: 5, urgency: 2, fairness: 3, systemic: 3, coordination: 3, focus: "Változásvezetés, átmeneti szabályok és valódi bevonás.", description: "A kar jelentősen átalakítaná egy szak előfeltételi rendszerét. A változtatás szakmailag indokolható, de még nincs kidolgozva, hogyan érinti a már tanulmányaikat folytató hallgatókat, a véleményezésre pedig két hét áll rendelkezésre." },
    { id: "t4_pending_data", round: 1, name: "Átsorolás előtt függő tanulmányi adatok", capacity: 4, urgency: 3, fairness: 3, systemic: 3, coordination: 3, focus: "Adatminőség, határidő és nagy tétű döntések.", description: "Az állami ösztöndíjas és önköltséges finanszírozási forma közötti átsorolás előtt több hallgatónál nincs rögzítve minden külföldön vagy más karon szerzett kredit. Ha az adatok nem kerülnek be időben, a döntés hiányos teljesítmény alapján születhet meg." },
    { id: "t4_disputed_reclassification", round: 1, name: "Vitatott átsorolási döntés", capacity: 4, urgency: 3, fairness: 3, systemic: 2, coordination: 3, focus: "Jogorvoslat, adatellenőrzés és több egység összehangolása.", description: "Egy hallgató önköltséges átsorolásról kapott döntést, de állítása szerint az alapul szolgáló félév több eredménye hibásan szerepel a rendszerben. A jogorvoslati határidő rövid, az ellenőrzés több egységet érint." },
    { id: "t4_scholarship_glitch", round: 1, name: "Ösztöndíj-számítási hiba", capacity: 3, urgency: 3, fairness: 2, systemic: 2, coordination: 3, focus: "Pénzügyi hatás és gyors korrekció.", description: "Egy számítási hiba miatt több hallgató a járó összegnél kevesebb ösztöndíjat kapott, néhányan pedig többet. A korrekció pénzügyi és kommunikációs kockázatot hordoz, és a következő utalás közeleg." },
    { id: "t4_data_migration", round: 1, name: "Rendszermigráció adatvesztéssel", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Technikai gyökérok és adatintegritás.", description: "Egy rendszermigráció során bizonyos kurzus- és kreditadatok hibásan vagy hiányosan kerültek át. Az egyedi javítás gyors, de a migrációs folyamat hibája további adatokat is veszélyeztet." },
    // ---- 1. forduló · tartalék (3) ----
    { id: "t4_double_funding", round: 1, reserve: true, name: "Kettős finanszírozás gyanúja", capacity: 4, urgency: 3, fairness: 3, systemic: 3, coordination: 3, focus: "Szabályszerűség és a hallgató jóhiszeműsége.", description: "Kiderül, hogy néhány hallgató két jogcímen is támogatásban részesült, valószínűleg rendszerhiba miatt. A visszakövetelés szabályos, de ha a hallgató jóhiszemű volt, a mód és az arányosság kérdéses." },
    { id: "t4_policy_gap", round: 1, reserve: true, name: "Szabályozási rés az új helyzetre", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Hiányzó szabály és átmeneti gyakorlat.", description: "Egy új típusú kérelemre nincs egyértelmű szabály, ezért az egységek eltérően döntenek. A hiányzó szabályozás rendszerszintű bizonytalanságot okoz, a rendezés viszont több fórumot érint." },
    { id: "t4_vendor_delay", round: 1, reserve: true, name: "Szolgáltatói késés a rendszernél", capacity: 3, urgency: 2, fairness: 1, systemic: 2, coordination: 3, focus: "Külső függőség és folytonosság.", description: "Egy külső szolgáltató a szerződött határidőn túl szállítja a tanulmányi rendszer egy frissítését, ami több folyamatot akadályoz. A megoldás a szolgáltatóval és több belső egységgel közös." },

    // ---- 2. forduló · aktív (5) ----
    { id: "t4_credit_changed", round: 2, name: "Korábbi kreditelismerés, megváltozott tematika", capacity: 4, urgency: 2, fairness: 2, systemic: 2, coordination: 2, focus: "Következetesség, precedens és aktuális szakmai tartalom.", description: "Egy hallgató ugyanannak a külföldi intézménynek ugyanazon tárgyát szeretné elismertetni, amelyet egy másik hallgatónál évekkel ezelőtt már elfogadtak. A tantárgy neve és kódja változatlan, de a tematika részben módosult." },
    { id: "t4_import_error", round: 2, name: "Harmadik féléve ismétlődő adatimporthiba", capacity: 2, urgency: 2, fairness: 1, systemic: 3, coordination: 3, focus: "Tűzoltás és gyökérok-megszüntetés közötti választás.", description: "Ugyanaz a tantervi adatimporthiba harmadik féléve akadályozza bizonyos kurzusok és előfeltételek helyes megjelenítését. Az egyedi ügyeket minden alkalommal kijavítják, de a probléma rendszerszintű oka nem szűnt meg." },
    { id: "t4_three_requirements", round: 2, name: "Három eltérő értékelési követelmény", capacity: 3, urgency: 3, fairness: 3, systemic: 3, coordination: 3, focus: "Információs felelősség és egységes intézményi álláspont.", description: "Ugyanazon kurzus Neptun-leírásában, Moodle-felületén és az oktató dokumentumában eltérő beadási határidők és értékelési súlyok szerepelnek. A hallgatók különböző információk alapján készültek, ezért az egységes számonkérés vitathatóvá válik." },
    { id: "t4_budget_freeze", round: 2, name: "Váratlan költségvetési zárolás", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Szűkülő keret és prioritások.", description: "Egy évközi költségvetési zárolás miatt több tervezett fejlesztést és pótalkalmat vissza kell fogni. A döntés arról szól, mely hallgatói szolgáltatások maradnak, és melyek csúsznak." },
    { id: "t4_cross_faculty", round: 2, name: "Karok közötti elszámolási vita", capacity: 3, urgency: 2, fairness: 2, systemic: 2, coordination: 3, focus: "Együttműködés és felelősségmegosztás.", description: "Egy közösen oktatott kurzus költségeinek és bevételeinek elszámolásán két kar nem tud megegyezni, ami a kurzus jövőjét veszélyezteti. A hallgatók előrehaladása múlhat a megállapodáson." },
    // ---- 2. forduló · tartalék (3) ----
    { id: "t4_audit_finding", round: 2, reserve: true, name: "Belső ellenőrzési megállapítás", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Megfelelés és fenntartható folyamat.", description: "Egy belső ellenőrzés eljárási hiányosságokat tár fel egy tanulmányi folyamatban. A gyors formai javítás megnyugtatja az ellenőrzést, de a tartós megoldás mélyebb folyamat-átalakítást igényel." },
    { id: "t4_grant_deadline", round: 2, reserve: true, name: "Pályázati elszámolási határidő", capacity: 3, urgency: 3, fairness: 2, systemic: 2, coordination: 3, focus: "Határidő és több egység adata.", description: "Egy pályázat elszámolási határideje közeleg, de több egységtől hiányoznak adatok. A késedelem forrásvesztést okozhat, ami hallgatói programokat is érint." },
    { id: "t4_system_outage", round: 2, reserve: true, name: "Tanulmányi rendszer kiesése csúcsidőben", capacity: 2, urgency: 3, fairness: 1, systemic: 2, coordination: 2, focus: "Üzemfolytonosság és tájékoztatás.", description: "A tanulmányi rendszer a tárgyfelvételi csúcsidőszakban órákra elérhetetlenné válik. A gyors helyreállítás és a méltányos pótlási lehetőség egyszerre szükséges." },

    // ---- 3. forduló · aktív (5) ----
    { id: "t4_ai_rules", round: 3, name: "Közös kurzus eltérő MI-szabályokkal", capacity: 2, urgency: 3, fairness: 3, systemic: 3, coordination: 3, focus: "Szabályütközés, közös felelősség és gyors tisztázás.", description: "Egy több kar hallgatói számára meghirdetett közös kurzuson az egyik kar tájékoztatója engedélyezi bizonyos mesterségesintelligencia-eszközök használatát, a másiké viszont tiltja. A beadandó határideje közeleg, de a hallgatók nem tudják, melyik szabály az irányadó." },
    { id: "t4_partner_withdraws", round: 3, name: "Visszalépett szakmai gyakorlati partner", capacity: 4, urgency: 3, fairness: 3, systemic: 2, coordination: 3, focus: "Krízispartnerség, gyors átszervezés és felelősségvállalás.", description: "Egy vállalat három héttel a kötelező szakmai gyakorlat kezdete előtt visszalép az együttműködéstől. Tizenkét hallgató marad gyakorlati hely nélkül, és a teljesítés hiánya többük végzését is veszélyeztetheti." },
    { id: "t4_reporting_error", round: 3, name: "Kötelező adatszolgáltatás hibája", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Megfelelés és adatminőség.", description: "Egy kötelező felsőoktatási adatszolgáltatásban rendszerszintű hiba miatt téves számok kerültek be. A javítás határidős, és több egység összehangolt adatellenőrzését igényli." },
    { id: "t4_fee_dispute", round: 3, name: "Önköltségi díj vitatott kiszabása", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Méltányos díj és átlátható számítás.", description: "Egy hallgató szerint tévesen szabtak ki rá magasabb önköltségi díjat egy félreszámolt kreditszám miatt. A díj tétje jelentős, és a hallgató a befizetési határidő előtt vár választ." },
    { id: "t4_deadline_conflict_sys", round: 3, name: "Rendszerszintű határidő-ütközés", capacity: 2, urgency: 3, fairness: 2, systemic: 2, coordination: 3, focus: "Ütemezés és egységes naptár.", description: "Több kötelező adminisztratív határidő egyetlen napra esik, ami a hallgatók és az egységek számára is kezelhetetlen torlódást okoz. A naptár rendezése több szereplő gyors egyeztetését igényli." },
    // ---- 3. forduló · tartalék (3) ----
    { id: "t4_compliance_review", round: 3, reserve: true, name: "Megfelelőségi felülvizsgálat", capacity: 3, urgency: 2, fairness: 2, systemic: 3, coordination: 3, focus: "Szabálykövetés és működőképesség.", description: "Egy külső megfelelőségi felülvizsgálat több folyamat átalakítását javasolja, amelyek egy része rövid távon lassítaná a hallgatói ügyintézést. A megfelelés és a gyakorlati működés egyensúlya a kérdés." },
    { id: "t4_refund_case", round: 3, reserve: true, name: "Díjvisszatérítési ügy", capacity: 2, urgency: 2, fairness: 3, systemic: 1, coordination: 2, focus: "Méltányos visszatérítés és szabály.", description: "Egy hallgató a befizetett díj visszatérítését kéri egy elmaradt szolgáltatásra hivatkozva. A visszatérítés méltányos lenne, de a szabály szigorú értelmezése ezt nem tenné lehetővé." },
    { id: "t4_integration_bug", round: 3, reserve: true, name: "Rendszerintegrációs hiba két felület között", capacity: 2, urgency: 2, fairness: 1, systemic: 2, coordination: 3, focus: "Technikai gyökérok és ideiglenes megoldás.", description: "Két informatikai rendszer közötti hibás adatcsere miatt egyes hallgatói adatok nem szinkronizálódnak. Az ideiglenes kézi javítás működik, de a tartós megoldás fejlesztői kapacitást igényel." },
  ],
};

export const ALL_CASES = Object.fromEntries(
  Object.values(CASES).flat().map((item) => [item.id, item]),
);
