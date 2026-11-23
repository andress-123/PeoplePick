# Genera data/seed.json: una "base de arranque" de votos simulados para que la web no
# parezca vacía al principio. La app la SUMA a los votos reales de Firestore.
#
#   python3 scripts/seed-base.py            → regenera data/seed.json
#
# · Es una estimación de cómo votaría el público (sobre todo español): no son votos reales.
# · Política, realeza, activismo, religión y periodistas/opinadores con perfil político
#   quedan a 0 a propósito: ahí deciden solo los votos reales (p. ej. Elecciones 29N).
# · El bot de X NO usa esta base: sus puestos salen solo de los votos reales.
# · Para retirarla poco a poco, baja SCALE (0.5, 0.25…) o borra data/seed.json.
import json, random, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCALE = 1.0
rng = random.Random(29)

people = json.loads((ROOT / "data/people.json").read_text())
ids = {p["id"]: p for p in people}

SKIP_CATS = {"Politics", "Royalty", "Activism", "Religion"}
SKIP_IDS = set("""
elon-musk peter-thiel alex-karp rupert-murdoch federico-jimenez-losantos antonio-garcia-ferreras
el-gran-wyoming ana-rosa-quintana iker-jimenez jordi-evole vicente-valles javier-ruiz inaki-lopez
carlos-herrera carlos-alsina angels-barcelo pepa-bueno inaki-gabilondo ana-pastor susanna-griso
joe-rogan hasan-piker theo-von noam-chomsky karl-marx slavoj-zizek
""".split())

# Saldo neto aproximado (votos a favor − en contra). Se le añade algo de ruido.
BASE = {
  # ── Deporte ──
  "rafael-nadal": 18400, "lionel-messi": 15100, "carlos-alcaraz": 14800, "fernando-alonso": 13200,
  "lamine-yamal": 12600, "andres-iniesta": 11300, "pau-gasol": 9800, "cristiano-ronaldo": 9100,
  "iker-casillas": 8300, "aitana-bonmati": 8000, "alexia-putellas": 7200, "marc-marquez": 7600,
  "pedri": 7400, "xavi-hernandez": 6100, "michael-jordan": 6900, "roger-federer": 6600,
  "carlos-sainz": 6300, "ilia-topuria": 6800, "zinedine-zidane": 5900, "valentino-rossi": 4800,
  "kylian-mbappe": 4200, "vinicius-junior": 1300, "jude-bellingham": 3100, "federico-valverde": 3900,
  "thibaut-courtois": 3300, "luka-modric": 6200, "nico-williams": 4600, "rodri": 4100,
  "fernando-torres": 5200, "david-villa": 3400, "carles-puyol": 4900, "vicente-del-bosque": 5600,
  "luis-de-la-fuente": 3600, "luis-aragones": 4400, "diego-maradona": 5100, "pele": 4300,
  "ronaldinho": 6400, "ronaldo-nazario": 5300, "johan-cruyff": 4700, "novak-djokovic": 2900,
  "jannik-sinner": 2400, "lebron-james": 3200, "stephen-curry": 3300, "kobe-bryant": 5400,
  "luka-doncic": 3500, "marc-gasol": 3700, "sergio-llull": 2600, "usain-bolt": 4200,
  "michael-phelps": 3100, "simone-biles": 3600, "carolina-marin": 4100, "mireia-belmonte": 3300,
  "miguel-indurain": 4600, "alberto-contador": 2800, "tadej-pogacar": 2600, "seve-ballesteros": 3600,
  "jon-rahm": 1900, "lewis-hamilton": 2700, "max-verstappen": -900, "michael-schumacher": 3400,
  "ayrton-senna": 3900, "muhammad-ali": 3600, "mike-tyson": 1300, "conor-mcgregor": -2100,
  "khabib-nurmagomedov": 1500, "jose-mourinho": 800, "diego-simeone": 2300, "pep-guardiola": 2500,
  "carlo-ancelotti": 4300, "xabi-alonso": 3800, "hansi-flick": 2600, "luis-enrique": 1200,
  "sergio-ramos": 1100, "gerard-pique": -2600, "neymar": -700, "robert-lewandowski": 2100,
  "antoine-griezmann": 2400, "raphinha": 2200, "gavi": 2900, "pau-cubarsi": 2300, "dani-olmo": 1400,
  "erling-haaland": 2300, "harry-kane": 1100, "mohamed-salah": 1800, "julian-alvarez": 1700,
  "koke": 1500, "jan-oblak": 1900, "unai-simon": 1800, "inaki-williams": 2000, "iago-aspas": 2400,
  "isco": 1300, "dani-carvajal": 1600, "alvaro-morata": -400, "joselu": 1700, "arda-guler": 1600,
  "rodrygo": 900, "eduardo-camavinga": 800, "aurelien-tchouameni": 600, "antonio-rudiger": -300,
  "dean-huijsen": 1100, "trent-alexander-arnold": 700, "endrick": 500, "franco-mastantuono": 600,
  "florentino-perez": -1300, "joan-laporta": -1100, "javier-tebas": -2400, "nasser-al-khelaifi": -900,
  "raul-gonzalez": 3100, "emilio-butragueno": 1200, "alfredo-di-stefano": 2200, "david-beckham": 2300,
  "thierry-henry": 1500, "zlatan-ibrahimovic": 1700, "kaka": 1800, "paolo-maldini": 1600,
  "andrea-pirlo": 1400, "gianluigi-buffon": 1500, "francesco-totti": 1200, "gareth-bale": 900,
  "karim-benzema": 1600, "luis-suarez": 300, "sergio-busquets": 1900, "jordi-alba": 700,
  "rudy-fernandez": 1400, "ricky-rubio": 1900, "juan-carlos-navarro": 1300, "facundo-campazzo": 1100,
  "victor-wembanyama": 1300, "nikola-jokic": 1100, "shohei-ohtani": 500, "tom-brady": 600,
  "tiger-woods": 900, "serena-williams": 1900, "maria-sharapova": 600, "aryna-sabalenka": 700,
  "iga-swiatek": 600, "coco-gauff": 500, "paula-badosa": 900, "garbine-muguruza": 1100,
  "arantxa-sanchez-vicario": 1300, "juan-carlos-ferrero": 1700, "lando-norris": 900,
  "charles-leclerc": 1300, "franco-colapinto": 1100, "jorge-martin": 1600, "pedro-acosta": 1900,
  "alex-marquez": 1400, "jorge-lorenzo": 1100, "dani-pedrosa": 1300, "angel-nieto": 1500,
  "carlos-sainz-sr": 1800, "floyd-mayweather": -600, "canelo-alvarez": 800, "jake-paul": -2300,
  "salma-paralluelo": 1400, "cata-coll": 900, "irene-paredes": 900, "olga-carmona": 1300,
  "saul-craviotto": 1200, "david-cal": 700, "fernando-romay": 900, "teddy-riner": 200,
  "lionel-scaloni": 1400, "jurgen-klopp": 2100, "mikel-arteta": 1300, "unai-emery": 1500,
  "marcelo-bielsa": 1600, "rafa-benitez": 700, "alex-ferguson": 1300, "manuel-pellegrini": 1500,
  "jose-bordalas": -500, "enrique-cerezo": -300, "eden-hazard": -500, "marcus-rashford": 200,
  "kevin-de-bruyne": 1300, "virgil-van-dijk": 900, "jamal-musiala": 1000, "florian-wirtz": 700,
  "cole-palmer": 800, "bukayo-saka": 700, "ousmane-dembele": 1400, "achraf-hakimi": 900,
  "marc-andre-ter-stegen": 600, "frenkie-de-jong": 800, "fermin-lopez": 1500, "joan-garcia": 1600,
  "jules-kounde": 900, "alejandro-balde": 700, "marcos-llorente": 1200, "giuliano-simeone": 1100,
  "mikel-oyarzabal": 1700, "takefusa-kubo": 1300, "brahim-diaz": 900, "ferran-adria": 0,
  # ── Música ──
  "rosalia": 12100, "bad-bunny": 9800, "taylor-swift": 6100, "shakira": 7900, "alejandro-sanz": 8400,
  "quevedo": 7300, "aitana": 5200, "freddie-mercury": 8900, "michael-jackson": 7800,
  "joaquin-sabina": 7100, "camaron-de-la-isla": 6600, "paco-de-lucia": 6400, "rocio-jurado": 5300,
  "lola-flores": 5800, "raphael": 4900, "julio-iglesias": 2600, "enrique-iglesias": 3600,
  "david-bisbal": 4100, "pablo-alboran": 4600, "dani-martin": 3300, "melendi": 2100,
  "manuel-carrasco": 3200, "malu": 3500, "vanesa-martin": 2400, "estopa": 0,
  "c-tangana": 4700, "rels-b": 2700, "bizarrap": 4300, "duki": 2200, "karol-g": 3600,
  "feid": 2100, "rauw-alejandro": 2500, "daddy-yankee": 2600, "j-balvin": 900, "maluma": 300,
  "anuel-aa": -800, "ozuna": 900, "peso-pluma": 300, "morad": 1100, "bad-gyal": 1400, "saiko": 1300,
  "lola-indigo": 1500, "ana-mena": 1100, "omar-montes": 600, "dellafuente": 2300, "mora": 1200,
  "yung-beef": 400, "nathy-peluso": 1900, "trueno": 1600, "tini": 900, "emilia-mernes": 1300,
  "ca7riel": 1700, "paco-amoroso": 1700, "milo-j": 1500, "chanel": 2500, "blanca-paloma": 1900,
  "rigoberta-bandini": 2300, "melody": 1100, "amaia": 2600, "ana-guerra": 900, "chenoa": 1400,
  "david-bustamante": 1300, "fito-cabrales": 3900, "robe-iniesta": 4800, "enrique-bunbury": 2600,
  "leiva": 2700, "rozalen": 2400, "antonio-orozco": 1300, "pablo-lopez": 1900, "miguel-bose": -400,
  "miguel-rios": 1900, "joan-manuel-serrat": 3800, "ana-belen": 1600, "monica-naranjo": 2100,
  "marta-sanchez": 900, "nino-bravo": 2900, "camilo-sesto": 3100, "rocio-durcal": 3400,
  "isabel-pantoja": -1700, "estrella-morente": 1900, "nina-pastori": 1300, "loquillo": 1100,
  "manolo-garcia": 1700, "rosendo-mercado": 1600, "nacho-cano": 300, "ana-torroja": 1300,
  "beyonce": 2900, "rihanna": 3800, "lady-gaga": 4700, "ariana-grande": 2600, "billie-eilish": 3300,
  "dua-lipa": 3900, "olivia-rodrigo": 2100, "sabrina-carpenter": 2400, "harry-styles": 2700,
  "ed-sheeran": 2600, "bruno-mars": 3700, "the-weeknd": 3100, "justin-bieber": -600,
  "miley-cyrus": 1400, "selena-gomez": 1500, "katy-perry": 500, "adele": 3600, "madonna": 2100,
  "britney-spears": 1300, "jennifer-lopez": 700, "chappell-roan": 1300, "charli-xcx": 1600,
  "lana-del-rey": 2300, "sza": 1200, "doja-cat": 500, "kendrick-lamar": 2800, "eminem": 3600,
  "drake": -500, "kanye-west": -4800, "jay-z": 700, "travis-scott": -300, "nicki-minaj": -200,
  "cardi-b": -300, "tupac-shakur": 2600, "snoop-dogg": 1700, "50-cent": 800, "post-malone": 1500,
  "tyler-the-creator": 1300, "residente": 2300, "ricky-martin": 2700, "marc-anthony": 1600,
  "luis-miguel": 3100, "juan-gabriel": 2200, "vicente-fernandez": 1900, "gloria-estefan": 1900,
  "celia-cruz": 2600, "juanes": 2100, "carlos-vives": 1800, "romeo-santos": 1700,
  "juan-luis-guerra": 2900, "gustavo-cerati": 3800, "charly-garcia": 1900, "mercedes-sosa": 1600,
  "john-lennon": 4200, "paul-mccartney": 3700, "david-bowie": 4300, "bob-marley": 4100,
  "kurt-cobain": 3500, "elvis-presley": 2900, "amy-winehouse": 4400, "prince": 2600,
  "jimi-hendrix": 2700, "bob-dylan": 2300, "mick-jagger": 2100, "bruce-springsteen": 2600,
  "elton-john": 2900, "stevie-wonder": 2700, "aretha-franklin": 2400, "tina-turner": 2600,
  "whitney-houston": 3300, "frank-sinatra": 2100, "johnny-cash": 1700, "dolly-parton": 1600,
  "ozzy-osbourne": 2300, "dave-grohl": 2400, "thom-yorke": 1900, "alex-turner": 2700,
  "liam-gallagher": 900, "noel-gallagher": 1200, "chris-martin": 1500, "bono": 700,
  "rosalia-x": 0, "jungkook": 2100, "lisa": 1900, "jennie": 1600, "rose": 1700, "jisoo": 1300,
  "v": 1500, "jimin": 1600, "rm": 900, "psy": 200, "david-guetta": 1300, "calvin-harris": 1400,
  "avicii": 3200, "martin-garrix": 1100, "fred-again": 1200, "peggy-gou": 900, "hans-zimmer": 4100,
  "john-williams": 3400, "ennio-morricone": 3600, "ludwig-van-beethoven": 3900,
  "wolfgang-amadeus-mozart": 4000, "johann-sebastian-bach": 3100, "stromae": 2200, "bjork": 1100,
  "rose-x": 0,
  # ── Cine ──
  "penelope-cruz": 6700, "antonio-banderas": 7100, "javier-bardem": 4300, "pedro-almodovar": 3900,
  "luis-tosar": 4800, "javier-camara": 4200, "mario-casas": 3100, "ursula-corbero": 3300,
  "alvaro-morte": 3600, "pedro-alonso": 2100, "itziar-ituno": 2600, "jaime-lorente": 1700,
  "miguel-herran": 2300, "ester-exposito": 1300, "blanca-suarez": 2200, "belen-rueda": 2900,
  "maribel-verdu": 2900, "carmen-maura": 2600, "rossy-de-palma": 2100, "elsa-pataky": 900,
  "santiago-segura": 3800, "dani-rovira": 2400, "karra-elejalde": 2300, "antonio-resines": 3300,
  "jose-sacristan": 2300, "imanol-arias": 300, "paco-martinez-soria": 2100, "alfredo-landa": 2600,
  "fernando-fernan-gomez": 2400, "j-a-bayona": 4100, "alejandro-amenabar": 3400,
  "rodrigo-sorogoyen": 2300, "carla-simon": 1600, "oliver-laxe": 1400, "alex-de-la-iglesia": 2600,
  "fernando-leon-de-aranoa": 1500, "javier-ambrossi": 1900, "javier-calvo": 1900, "paco-leon": 2100,
  "luis-garcia-berlanga": 2300, "luis-bunuel": 2100, "carlos-saura": 1300, "candela-pena": 1700,
  "carmen-machi": 2600, "eduard-fernandez": 2300, "antonio-de-la-torre": 2500, "raul-arevalo": 1900,
  "najwa-nimri": 1400, "paz-vega": 900, "elena-anaya": 900, "laia-costa": 1000,
  "patricia-lopez-arnaiz": 1300, "victoria-abril": 1100, "ricardo-darin": 4400,
  "gael-garcia-bernal": 1900, "diego-luna": 1700, "salma-hayek": 2200, "eva-longoria": 900,
  "sofia-vergara": 1100, "pedro-pascal": 5800, "inde-navarrette": 900,
  "leonardo-dicaprio": 5600, "brad-pitt": 3200, "tom-cruise": 2700, "tom-hanks": 4600,
  "denzel-washington": 4100, "robert-de-niro": 3700, "al-pacino": 4400, "jack-nicholson": 3100,
  "morgan-freeman": 3600, "anthony-hopkins": 4200, "joaquin-phoenix": 3300, "christian-bale": 2800,
  "cillian-murphy": 3600, "timothee-chalamet": 2300, "zendaya": 3700, "florence-pugh": 1900,
  "margot-robbie": 3100, "jennifer-lawrence": 2100, "scarlett-johansson": 2300, "meryl-streep": 3900,
  "cate-blanchett": 1900, "nicole-kidman": 1700, "julia-roberts": 2200, "angelina-jolie": 1900,
  "natalie-portman": 2300, "emma-stone": 2900, "anne-hathaway": 2600, "sydney-sweeney": 600,
  "jenna-ortega": 2300, "anya-taylor-joy": 2100, "keanu-reeves": 6100, "ryan-gosling": 3900,
  "ryan-reynolds": 2900, "hugh-jackman": 3100, "robert-downey-jr": 3700, "chris-evans": 1900,
  "chris-hemsworth": 1700, "dwayne-johnson": 1300, "will-smith": -1400, "johnny-depp": 2900,
  "george-clooney": 2100, "matthew-mcconaughey": 2200, "adam-driver": 1100, "jacob-elordi": 1300,
  "paul-mescal": 900, "henry-cavill": 2400, "idris-elba": 1300, "benedict-cumberbatch": 1600,
  "tom-hardy": 1800, "heath-ledger": 4300, "jim-carrey": 3800, "robin-williams": 5200,
  "eddie-murphy": 1900, "adam-sandler": 1500, "samuel-l-jackson": 2100, "harrison-ford": 2900,
  "sylvester-stallone": 1700, "arnold-schwarzenegger": 2100, "clint-eastwood": 1900,
  "jared-leto": -400, "jennifer-aniston": 2100, "mark-hamill": 1300, "daniel-craig": 1500,
  "sean-connery": 1900, "tom-holland": 2200, "andrew-garfield": 1800, "chadwick-boseman": 2400,
  "marilyn-monroe": 2300, "audrey-hepburn": 2600, "charlie-chaplin": 3300, "marlon-brando": 1900,
  "steven-spielberg": 3600, "martin-scorsese": 2900, "christopher-nolan": 4400,
  "quentin-tarantino": 3100, "stanley-kubrick": 3300, "alfred-hitchcock": 2600,
  "francis-ford-coppola": 2100, "denis-villeneuve": 2300, "greta-gerwig": 1300, "david-fincher": 2100,
  "james-cameron": 2200, "george-lucas": 2400, "tim-burton": 2800, "wes-anderson": 1900,
  "hayao-miyazaki": 4600, "guillermo-del-toro": 3700, "alfonso-cuaron": 1600,
  "alejandro-gonzalez-inarritu": 1500, "david-lynch": 2100, "bong-joon-ho": 1700,
  "yorgos-lanthimos": 1100, "akira-kurosawa": 1300, "federico-fellini": 1200, "kevin-spacey": 0,
  # ── TV ──
  "david-broncano": 5900, "pablo-motos": 1400, "andreu-buenafuente": 3600, "jorge-javier-vazquez": -700,
  "risto-mejide": -1100, "cristina-pedroche": 1300, "alberto-chicote": 3300, "carlos-sobera": 2100,
  "arturo-valls": 2600, "paz-padilla": 300, "lalachus": 2700, "silvia-abril": 2100, "berto-romero": 3700,
  "jose-mota": 3400, "florentino-fernandez": 2300, "joaquin-reyes": 2100, "ernesto-sevilla": 2300,
  "leo-harlem": 2600, "goyo-jimenez": 2100, "ignatius-farray": 1700, "queque": 1100, "dani-mateo": 900,
  "eva-hache": 1300, "chiquito-de-la-calzada": 6200, "miguel-gila": 4100, "eugenio": 3600,
  "jesus-calleja": 3300, "jesus-vazquez": 1400, "mercedes-mila": 300, "manu-carreno": 800,
  "josep-pedrerol": -1600, "tomas-roncero": -1900, "edu-aguirre": -1300, "belen-esteban": -900,
  "kiko-matamoros": -2700, "isabel-preysler": -400, "tamara-falco": 700, "ana-obregon": -300,
  "paula-echevarria": 500, "maria-pombo": -600, "georgina-rodriguez": -800, "oprah-winfrey": 1300,
  "jimmy-fallon": 700, "jimmy-kimmel": 900, "stephen-colbert": 800, "john-oliver": 900,
  "kim-kardashian": -1600, "kylie-jenner": -900, "kendall-jenner": 200, "paris-hilton": -300,
  "gordon-ramsay": 2400, "david-attenborough": 4100, "bryan-cranston": 3100, "bella-ramsey": 300,
  "millie-bobby-brown": 900, "emilia-clarke": 1700, "kit-harington": 1300, "ricky-gervais": 1900,
  "dave-chappelle": 700, "kevin-hart": 300, "jerry-seinfeld": 900, "bill-burr": 1100,
  # ── Internet ──
  "ibai-llanos": 7400, "thegrefg": 2300, "illojuan": 3700, "auronplay": 3900, "rubius": 4300,
  "vegetta777": 2100, "willyrex": 1500, "spreen": 1900, "plex": 900, "fernanfloo": 1100,
  "juan-guarnizo": 1300, "westcol": -900, "coscu": 1100, "luzu": 1500, "lolito-fdez": 1300,
  "german-garmendia": 1600, "luisito-comunica": 1900, "dalas-review": -3100, "djmariio": 1700,
  "spursito": 900, "perxitaa": 1300, "jordi-wild": 1100, "carolina-iglesias": 1400,
  "victoria-martin": 1300, "kidd-keo": -600, "lit-killah": 600, "gaston-edul": 700, "marta-diaz": 300,
  "samy-rivers": 700, "roro": -700, "dulceida": 100, "laura-escanes": -200, "violeta-mangrinan": 300,
  "mrbeast": 1900, "pewdiepie": 1700, "kai-cenat": 400, "ishowspeed": 2100, "xqc": 200,
  "ninja": 300, "ksi": 300, "logan-paul": -2200, "khaby-lame": 1300, "charli-d-amelio": -100,
  "markiplier": 500, "marques-brownlee": 700, "lex-fridman": 200, "andrew-huberman": -300,
  "michael-stevens": 600,
  # ── Tecnología y empresa ──
  "steve-jobs": 4600, "bill-gates": 900, "mark-zuckerberg": -2400, "jeff-bezos": -1900,
  "sam-altman": -600, "dario-amodei": 400, "demis-hassabis": 1100, "jensen-huang": 1300,
  "tim-cook": 200, "linus-torvalds": 1900, "tim-berners-lee": 2300, "steve-wozniak": 1700,
  "geoffrey-hinton": 900, "pavel-durov": 600, "vitalik-buterin": 300, "changpeng-zhao": -500,
  "travis-kalanick": -400, "jack-ma": 300, "thomas-edison": 700, "alan-kay": 200,
  "amancio-ortega": 6300, "juan-roig": 3100, "marta-ortega": 900, "ana-botin": -300,
  "ignacio-sanchez-galan": -1300, "warren-buffett": 1100, "walt-disney": 2100, "henry-ford": 600,
  "richard-branson": 400, "bernard-arnault": -300, "jose-elias": 300, "pablo-isla": 600,
  # ── Ciencia ──
  "albert-einstein": 8800, "nikola-tesla": 7600, "marie-curie": 7100, "stephen-hawking": 6300,
  "isaac-newton": 5400, "charles-darwin": 4700, "santiago-ramon-y-cajal": 5900, "alan-turing": 4800,
  "galileo-galilei": 4300, "alexander-fleming": 4100, "richard-feynman": 2900, "ada-lovelace": 2600,
  "carl-sagan": 3800, "margarita-salas": 3300, "severo-ochoa": 2700, "francis-mojica": 2100,
  "pedro-duque": 2600, "sara-garcia-alonso": 1700, "neil-armstrong": 3100, "yuri-gagarin": 1600,
  "jane-goodall": 3100, "katalin-kariko": 1900, "jennifer-doudna": 1100, "rosalind-franklin": 1900,
  "louis-pasteur": 2100, "robert-oppenheimer": 1300, "sigmund-freud": 600, "carl-jung": 1500,
  "neil-degrasse-tyson": 900, "isaac-peral": 1900, "leonardo-torres-quevedo": 1600,
  "juan-de-la-cierva": 1100, "max-planck": 900, "niels-bohr": 800, "erwin-schrodinger": 1100,
  "gregor-mendel": 700, "dmitri-mendeleev": 900, "archimedes": 1200, "srinivasa-ramanujan": 1300,
  "michio-kaku": 600, "jonas-salk": 900, "edward-jenner": 800,
  # ── Literatura ──
  "miguel-de-cervantes": 6600, "federico-garcia-lorca": 7300, "gabriel-garcia-marquez": 6900,
  "william-shakespeare": 4900, "antonio-machado": 4800, "jorge-luis-borges": 4300,
  "julio-cortazar": 3900, "pablo-neruda": 3600, "mario-vargas-llosa": 1100, "isabel-allende": 2300,
  "arturo-perez-reverte": 1900, "carlos-ruiz-zafon": 4600, "almudena-grandes": 2100,
  "javier-marias": 1900, "eduardo-mendoza": 2100, "javier-cercas": 1100, "rosa-montero": 1500,
  "fernando-aramburu": 1700, "irene-vallejo": 2900, "dolores-redondo": 2300, "javier-castillo": 1900,
  "juan-gomez-jurado": 2600, "elisabet-benavent": 1100, "gustavo-adolfo-becquer": 3100,
  "francisco-de-quevedo": 2300, "lope-de-vega": 1700, "miguel-de-unamuno": 2100,
  "benito-perez-galdos": 2300, "miguel-delibes": 2600, "camilo-jose-cela": 700,
  "ana-maria-matute": 1300, "carmen-laforet": 1100, "j-r-r-tolkien": 5100, "j-k-rowling": -1800,
  "stephen-king": 3100, "george-r-r-martin": 1300, "george-orwell": 4400, "franz-kafka": 3300,
  "fyodor-dostoevsky": 3600, "leo-tolstoy": 2300, "jane-austen": 2600, "oscar-wilde": 3100,
  "edgar-allan-poe": 3300, "agatha-christie": 2900, "ernest-hemingway": 1900, "albert-camus": 2300,
  "haruki-murakami": 2600, "yuval-noah-harari": 1700, "sally-rooney": 900, "paulo-coelho": -300,
  "victor-hugo": 1900, "homer": 1600, "dante-alighieri": 1400, "charles-dickens": 1300,
  "virginia-woolf": 1700, "mikhail-bulgakov": 1100, "arthur-conan-doyle": 1600, "hermann-hesse": 1300,
  "stefan-zweig": 1700, "juan-rulfo": 1100, "octavio-paz": 900, "han-kang": 600,
  # ── Arte ──
  "pablo-picasso": 5300, "salvador-dali": 5900, "diego-velazquez": 4900, "francisco-goya": 4700,
  "vincent-van-gogh": 6400, "leonardo-da-vinci": 7700, "antoni-gaudi": 6800, "joaquin-sorolla": 3600,
  "joan-miro": 2600, "el-greco": 2300, "michelangelo": 4100, "frida-kahlo": 3900, "banksy": 2900,
  "claude-monet": 2700, "andy-warhol": 1600, "jean-michel-basquiat": 1700, "caravaggio": 2100,
  "gustav-klimt": 1900, "edvard-munch": 1300, "rembrandt": 1500, "johannes-vermeer": 1300,
  "yayoi-kusama": 900, "santiago-calatrava": 300, "eduardo-chillida": 1300, "zaha-hadid": 900,
  "david-hockney": 700, "jeff-koons": -400, "damien-hirst": -200, "hokusai": 1300,
  "rafael-sanzio": 1100, "sandro-botticelli": 1300, "edward-hopper": 1500, "marina-abramovic": 300,
  # ── Filosofía e historia ──
  "socrates": 3300, "plato": 2100, "aristotle": 2600, "marcus-aurelius": 3100, "seneca": 2600,
  "friedrich-nietzsche": 2900, "immanuel-kant": 1300, "rene-descartes": 1500, "confucius": 1100,
  "sun-tzu": 1700, "jose-ortega-y-gasset": 1500, "maria-zambrano": 900, "simone-de-beauvoir": 1300,
  "hannah-arendt": 1100, "jean-paul-sartre": 900, "byung-chul-han": 1300, "voltaire": 1100,
  "epicurus": 900, "baruch-spinoza": 1000, "averroes": 700,
  "julius-caesar": 2100, "alexander-the-great": 2600, "cleopatra": 1700, "napoleon-bonaparte": 1500,
  "trajan": 1300, "isabella-i-of-castile": 1300, "charles-v": 1100, "christopher-columbus": 300,
  "juan-sebastian-elcano": 2400, "blas-de-lezo": 3100, "el-cid": 2300, "hernan-cortes": -600,
  "joan-of-arc": 1300, "genghis-khan": 200, "teresa-of-avila": 600, "hannibal": 1100,
  # ── Gastronomía y moda ──
  "dabiz-munoz": 2900, "karlos-arguinano": 6100, "jose-andres": 4900, "ferran-adria": 3600,
  "martin-berasategui": 3300, "jordi-cruz": 1300, "pepe-rodriguez": 1900,
  "samantha-vallejo-nagera": 600, "juan-mari-arzak": 2100, "joan-roca": 2100, "angel-leon": 1900,
  "anthony-bourdain": 2600, "jamie-oliver": 900, "nusret-gokce": -900, "elena-arzak": 900,
  "eneko-atxa": 1100, "quique-dacosta": 900, "jordi-roca": 1100,
  "cristobal-balenciaga": 2900, "amancio-ortega-x": 0, "coco-chanel": 1900, "karl-lagerfeld": 1100,
  "giorgio-armani": 1600, "paco-rabanne": 1300, "agatha-ruiz-de-la-prada": 700, "palomo-spain": 600,
  "virgil-abloh": 900, "anna-wintour": -300, "naomi-campbell": 400, "kate-moss": 600,
  "nieves-alvarez": 700, "vivienne-westwood": 900, "alexander-mcqueen": 1100,
}

def skip(pid):
    p = ids.get(pid)
    return (not p) or p["category"] in SKIP_CATS or pid in SKIP_IDS

seed = {}
for pid, v in BASE.items():
    if v == 0 or skip(pid):
        continue
    noisy = v * rng.uniform(0.88, 1.12) + rng.randint(-37, 37)
    seed[pid] = int(round(noisy * SCALE))

# Cola larga: parte del resto recibe unos pocos votos, como en cualquier web con tráfico.
for p in people:
    pid = p["id"]
    if pid in seed or pid in BASE or skip(pid):
        continue
    r = rng.random()
    if r < 0.42:
        n = int(rng.paretovariate(1.6) * 45) + rng.randint(1, 30)
        n = min(n, 1400)
        if rng.random() < 0.12:
            n = -int(n * rng.uniform(0.2, 0.7))
        seed[pid] = int(n * SCALE)

seed = {k: v for k, v in sorted(seed.items(), key=lambda kv: -kv[1]) if v != 0}
missing = [k for k in BASE if k not in ids]
(ROOT / "data/seed.json").write_text(json.dumps(seed, ensure_ascii=False, indent=0) + "\n")
print(f"{len(seed)} personas con base · ids desconocidos ignorados: {missing}")
