import { Locale } from './translations';

export interface PortfolioProject {
  id: string;
  slug: string;
  title: Record<Locale, string>;
  category: 'weddings' | 'editorials' | 'portraits' | 'details';
  categoryLabel: Record<Locale, string>;
  location: Record<Locale, string>;
  season: string;
  coverImage: string;
  aspectRatio: 'landscape' | 'portrait';
  objectPosition?: string;
  aspectClass?: string;
  colSpan?: string;
  camera: string;
  description: Record<Locale, string>;
  featured: boolean;
  gallery: string[];
}

export const portfolioProjects: PortfolioProject[] = [
  // ==========================================
  // WEDDINGS & CELEBRATIONS
  // ==========================================
  {
    id: "mariage-celebration-nocturne",
    slug: "mariage-celebration-nocturne-france",
    title: {
      fr: "Éclats de Joie & Soirée sous les Guirlandes",
      en: "Twinkling Nights & Heartfelt Celebration",
      pt: "Celebração Iluminada & Emoções Autênticas",
    },
    category: "weddings",
    categoryLabel: {
      fr: "Mariage & Réception",
      en: "Wedding & Celebration",
      pt: "Casamento & Celebração",
    },
    location: {
      fr: "Domaine Privé & Soirée Festive, France",
      en: "Private Estate & Festivity, France",
      pt: "Propriedade Privada & Noite Festiva, França",
    },
    season: "Été",
    coverImage: "/images/real/32772.jpg.jpeg",
    aspectRatio: "landscape",
    aspectClass: "aspect-[3/2]",
    objectPosition: "object-[center_20%]",
    colSpan: "lg:col-span-8",
    camera: "Leica SL2 · Summilux 50mm f/1.4 · Lumière Ambiante & Guirlandes",
    description: {
      fr: "Une soirée de mariage où l'émotion et la spontanéité priment. Le toast et la découpe du gâteau sous un ciel de guirlandes scintillantes, des embrassades complices et la chaleur d'une nuit de fête inoubliable.",
      en: "A heartfelt wedding celebration where genuine emotion and spontaneous joy take center stage. The cake cutting beneath twinkling fairy lights, tender embraces, and the electric warmth of an open-air celebration.",
      pt: "Uma recepção de casamento onde a espontaneidade e os sentimentos verdadeiros brilham. O corte do bolo sob guirlandas iluminadas, abraços afetuosos e o calor de uma festa inesquecível ao ar livre.",
    },
    featured: true,
    gallery: [
      "/images/real/32772.jpg.jpeg",
      "/images/real/32788.jpg.jpeg",
      "/images/real/32790.jpg.jpeg",
      "/images/real/32784.jpg.jpeg",
      "/images/real/32794.jpg.jpeg",
      "/images/real/32796.jpg.jpeg",
      "/images/real/32800.jpg.jpeg",
    ],
  },
  {
    id: "douceur-voile-crepuscule",
    slug: "portrait-mariee-voile-jardin",
    title: {
      fr: "Douceur & Voile au Crépuscule",
      en: "Twilight Grace & Bridal Veil",
      pt: "Suavidade & Véu ao Entardecer",
    },
    category: "weddings",
    categoryLabel: {
      fr: "Portrait de Mariée",
      en: "Bridal Portrait",
      pt: "Retrato da Noiva",
    },
    location: {
      fr: "Jardins du Domaine, France",
      en: "Estate Gardens, France",
      pt: "Jardins da Propriedade, França",
    },
    season: "Été",
    coverImage: "/images/real/32790.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-4",
    camera: "Canon EOS R5 · RF 85mm f/1.2 L USM · Twilight Ambient Light",
    description: {
      fr: "La mariée immortalisée dans la quiétude du crépuscule. La dentelle délicate du voile et la lueur tamisée des lampions créent une atmosphère intime et profondément romantique.",
      en: "The bride captured in the serene quietude of dusk. The intricate lace of her veil and the soft amber glow of garden lights create an atmosphere of pure, timeless romanticism.",
      pt: "A noiva eternizada na serenidade do entardecer. A delicadeza da renda do véu e o brilho suave das luzes do jardim criam um cenário íntimo e profundamente romântico.",
    },
    featured: true,
    gallery: [
      "/images/real/32790.jpg.jpeg",
      "/images/real/32784.jpg.jpeg",
      "/images/real/32788.jpg.jpeg",
      "/images/real/32772.jpg.jpeg",
    ],
  },
  {
    id: "emotions-vraies-tendresse",
    slug: "emotions-sinceres-mariage",
    title: {
      fr: "Émotions Vraies & Tendresse Complice",
      en: "Sincere Joy & Heartfelt Embraces",
      pt: "Emoções Reais & Abraços Afetuosos",
    },
    category: "weddings",
    categoryLabel: {
      fr: "Moments Spontanés",
      en: "Candid Moments",
      pt: "Momentos Espontâneos",
    },
    location: {
      fr: "Parc Privé, France",
      en: "Private Parkland, France",
      pt: "Parque Privado, França",
    },
    season: "Été",
    coverImage: "/images/real/32788.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · 50mm f/1.2 GM · Natural Emotion",
    description: {
      fr: "L'essence même du reportage de mariage : des larmes de joie, des étreintes chaleureuses et la beauté brute d'un amour partagé entre proches.",
      en: "The pure essence of documentary wedding storytelling: tears of joy, heartfelt embraces, and the unscripted beauty of genuine human warmth.",
      pt: "A verdadeira essência da fotografia documental de casamento: lágrimas de alegria, abraços calorosos e a beleza pura do afeto compartilhado.",
    },
    featured: true,
    gallery: [
      "/images/real/32788.jpg.jpeg",
      "/images/real/32794.jpg.jpeg",
      "/images/real/32796.jpg.jpeg",
      "/images/real/32800.jpg.jpeg",
    ],
  },
  {
    id: "elegance-mariee-en-jardin",
    slug: "elegance-mariee-robe-couture",
    title: {
      fr: "L'Élégance de la Mariée en Jardin",
      en: "Bridal Elegance in the Garden",
      pt: "A Elegância da Noiva no Jardim",
    },
    category: "weddings",
    categoryLabel: {
      fr: "Portrait Couture",
      en: "Couture Portrait",
      pt: "Retrato Couture",
    },
    location: {
      fr: "Allée des Marronniers, France",
      en: "Chestnut Tree Alley, France",
      pt: "Alameda Histórica, França",
    },
    season: "Été",
    coverImage: "/images/real/32784.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[2/3]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Contax 645 · Carl Zeiss 80mm f/2 · Kodak Portra 400",
    description: {
      fr: "Silhouette impériale au cœur de la verdure. Le mouvement fluide de la robe de mariée et le port de tête gracieux soulignent une sophistication naturelle.",
      en: "An imperial silhouette enveloped by lush summer greenery. The fluid movement of the couture gown and her poised stance reveal effortless grace.",
      pt: "Silhueta deslumbrante em meio ao verde dos jardins. O movimento fluido do vestido de noiva e a postura elegante transmitem sofisticação e leveza.",
    },
    featured: true,
    gallery: [
      "/images/real/32784.jpg.jpeg",
      "/images/real/32790.jpg.jpeg",
      "/images/real/32788.jpg.jpeg",
      "/images/real/32772.jpg.jpeg",
    ],
  },

  // ==========================================
  // DESTINATION SESSIONS (ÉTRETAT & COAST)
  // ==========================================
  {
    id: "etretat-falaises-cote-normande",
    slug: "etretat-falaises-normandie-destination",
    title: {
      fr: "Brise d'Étretat & Falaises Sauvages",
      en: "Breeze of Étretat & Dramatic Sea Cliffs",
      pt: "Brisa de Étretat & Falésias Esculpidas",
    },
    category: "editorials",
    categoryLabel: {
      fr: "Destination Session",
      en: "Destination Session",
      pt: "Ensaio Destination",
    },
    location: {
      fr: "Falaises d'Étretat, Côte d'Albâtre, Normandie",
      en: "Étretat Cliffs, Alabaster Coast, Normandy",
      pt: "Falésias de Étretat, Costa de Alabastro, Normandia",
    },
    season: "Automne",
    coverImage: "/images/real/39777.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[3/4]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · 85mm f/1.4 GM · Lumière Océanique Naturelle",
    description: {
      fr: "Une escapade romantique face à l'immensité des falaises de craie blanche d'Étretat. La force des éléments marins sublime l'intimité du couple dans un souffle d'éternité cinématographique.",
      en: "A cinematic destination couple session framed by the dramatic chalk cliffs and wild waters of Étretat. Coastal sea winds, poetic silhouettes, and untamed romance on Normandy's coastline.",
      pt: "Um ensaio de casal cinematográfico emoldurado pelas monumentais falésias brancas de Étretat. O vento costeiro, silhuetas poéticas e o romantismo eterno na costa da Normandia.",
    },
    featured: true,
    gallery: [
      "/images/real/39777.jpg.jpeg",
      "/images/real/39779.jpg.jpeg",
      "/images/real/39781.jpg.jpeg",
    ],
  },
  {
    id: "etretat-promenade-coitiere",
    slug: "etretat-promenade-sentier-coitier",
    title: {
      fr: "Promenade Côtière & Horizon d'Albâtre",
      en: "Coastal Trail & Ocean Horizon",
      pt: "Trilha Costeira & Horizonte de Alabastro",
    },
    category: "editorials",
    categoryLabel: {
      fr: "Destination Session",
      en: "Destination Session",
      pt: "Ensaio Destination",
    },
    location: {
      fr: "Sentier des Douaniers, Étretat, Normandie",
      en: "Customs Trail, Étretat, Normandy",
      pt: "Trilha dos Pescadores, Étretat, Normandia",
    },
    season: "Automne",
    coverImage: "/images/real/39779.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[3/4]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · 35mm f/1.4 GM · Lumière du Large",
    description: {
      fr: "Marcher main dans la main le long des sentiers vertigineux dominant l'océan. La Manche scintille sous le soleil normand tandis que le couple savoure un instant hors du temps.",
      en: "Walking hand in hand along soaring clifftop paths overlooking the Atlantic. The sea sparkles beneath the northern sun while the couple enjoys an intimate, timeless escape.",
      pt: "Caminhando de mãos dadas pelas trilhas nas alturas com vista panorâmica para o oceano. O mar brilha sob o sol suave da Normandia em um instante inesquecível.",
    },
    featured: true,
    gallery: [
      "/images/real/39779.jpg.jpeg",
      "/images/real/39777.jpg.jpeg",
      "/images/real/39781.jpg.jpeg",
    ],
  },
  {
    id: "etretat-etreinte-oceanique",
    slug: "etretat-etreinte-oceanique-intime",
    title: {
      fr: "L'Étreinte Océanique & Vent Marin",
      en: "Oceanic Embrace & Sea Winds",
      pt: "Abraço Oceânico & Vento do Mar",
    },
    category: "editorials",
    categoryLabel: {
      fr: "Portrait de Couple",
      en: "Couple Editorial",
      pt: "Editorial de Casal",
    },
    location: {
      fr: "Belvédère d'Amont, Étretat, Normandie",
      en: "Amont Viewpoint, Étretat, Normandy",
      pt: "Mirante de Amont, Étretat, Normandia",
    },
    season: "Automne",
    coverImage: "/images/real/39781.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-[center_15%]",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · 85mm f/1.4 GM · Natural Atlantic Breeze",
    description: {
      fr: "Un regard complice face à l'immensité bleutée de la mer. Les textures douces des vêtements et le vent dans les cheveux traduisent un amour libre et vibrant.",
      en: "An intimate, tender glance set against the boundless blue expanse of the ocean. Soft textures and sea-blown hair evoke a spirit of freedom and deep connection.",
      pt: "Um olhar cúmplice e sereno diante da imensidão azul do mar. O vento suave nos cabelos e as texturas leves transmitem afeto, liberdade e conexão genuína.",
    },
    featured: true,
    gallery: [
      "/images/real/39781.jpg.jpeg",
      "/images/real/39777.jpg.jpeg",
      "/images/real/39779.jpg.jpeg",
    ],
  },

  // ==========================================
  // FINE ART PORTRAITS & FRENCH LIFESTYLE
  // ==========================================
  {
    id: "golden-hour-fine-art-portrait",
    slug: "portrait-fine-art-lumiere-doree",
    title: {
      fr: "Lumière Dorée & Douceur Poétique",
      en: "Golden Hour Glow & Poetic Grace",
      pt: "Luz Dourada & Poesia Visual",
    },
    category: "portraits",
    categoryLabel: {
      fr: "Portrait d'Art",
      en: "Fine Art Portrait",
      pt: "Retrato Fine Art",
    },
    location: {
      fr: "Parc Historique & Jardins Secrets, France",
      en: "Historic Parkland & Secret Gardens, France",
      pt: "Parque Histórico & Jardins Secretos, França",
    },
    season: "Fin d'Été",
    coverImage: "/images/real/49390.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Canon EOS R5 · RF 85mm f/1.2 L USM · Golden Hour Backlight",
    description: {
      fr: "La douceur d'une fin d'après-midi où la lumière dorée filtre à travers les arbres, enveloppant le regard d'un halo chaleureux et transformant l'instant fugace en une œuvre intemporelle.",
      en: "The ethereal serenity of a late golden afternoon where setting sun rays filter through woodland boughs, enveloping every glance in a warm halo and rendering fleeting minutes into heirloom art.",
      pt: "A serenidade mágica de um fim de tarde dourado onde os raios solares filtram pela vegetação, envolvendo o olhar em uma aura calorosa e transformando o instante em poesia atemporal.",
    },
    featured: true,
    gallery: [
      "/images/real/49390.jpg.jpeg",
      "/images/real/49012.jpg.jpeg",
      "/images/real/49029.jpg.jpeg",
    ],
  },
  {
    id: "art-de-vivre-village-francais",
    slug: "art-de-vivre-village-francais-lifestyle",
    title: {
      fr: "Art de Vivre & Ruelles Fleuries",
      en: "French Heritage & Sunlit Alleys",
      pt: "Art de Vivre & Charme das Ruas Floridas",
    },
    category: "portraits",
    categoryLabel: {
      fr: "Portrait d'Art",
      en: "Fine Art Portrait",
      pt: "Retrato Fine Art",
    },
    location: {
      fr: "Village Pittoresque de Caractère, France",
      en: "Picturesque French Heritage Village, France",
      pt: "Vilarejo Pitoresco na França",
    },
    season: "Été",
    coverImage: "/images/real/19229.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · 35mm f/1.4 GM · Lumière Naturelle",
    description: {
      fr: "La douceur de vivre française à travers les ruelles pavées d'un village historique. Une lumière franche, des pierres séculaires et un sourire spontané capturé avec authenticité.",
      en: "The timeless charm of French provincial life through historic stone streets. Bright ambient light, ancient masonry, and spontaneous joy captured with effortless elegance.",
      pt: "O encanto acolhedor dos vilarejos franceses com suas ruelas de pedra e flores. Uma luz viva, arquitetura secular e um retrato espontâneo cheio de vida e autenticidade.",
    },
    featured: true,
    gallery: [
      "/images/real/19229.jpg.jpeg",
      "/images/real/49029.jpg.jpeg",
      "/images/real/49390.jpg.jpeg",
    ],
  },
  {
    id: "poesie-canopee-arbres",
    slug: "portrait-nature-poesie-arbres",
    title: {
      fr: "Éveil & Poésie dans la Canopée",
      en: "Canopy Light & Woodland Poetry",
      pt: "Luz na Copa & Poesia na Natureza",
    },
    category: "portraits",
    categoryLabel: {
      fr: "Portrait d'Art",
      en: "Fine Art Portrait",
      pt: "Retrato Fine Art",
    },
    location: {
      fr: "Forêt & Sous-Bois Ensoleillés, France",
      en: "Sunlit Woodland & Grove, France",
      pt: "Bosque Iluminado & Natureza, França",
    },
    season: "Été",
    coverImage: "/images/real/49012.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Canon EOS R5 · RF 85mm f/1.2 L USM · Diffused Foliage Light",
    description: {
      fr: "Perchée délicatement parmi les branches, la jeune modèle semble flotter dans un écrin de chlorophylle. Une composition picturale inspirée des contes bucoliques.",
      en: "Gently perched amidst leafy tree branches, the young model is framed by emerald foliage. A painterly, contemplative portrait reminiscent of classical storybooks.",
      pt: "Empoleirada suavemente entre os galhos, a jovem modelo é emoldurada pelas folhas verdes. Um retrato artístico e sensível com inspiração bucólica.",
    },
    featured: true,
    gallery: [
      "/images/real/49012.jpg.jpeg",
      "/images/real/49029.jpg.jpeg",
      "/images/real/49390.jpg.jpeg",
    ],
  },

  // ==========================================
  // STUDIO BRANDING, SPA & WELLNESS
  // ==========================================
  {
    id: "studio-beaute-portrait-pro",
    slug: "studio-beaute-portrait-professionnel",
    title: {
      fr: "L'Élégance du Regard & Portrait Studio",
      en: "Studio Poise & Executive Beauty Branding",
      pt: "Elegância do Olhar & Branding em Estúdio",
    },
    category: "details",
    categoryLabel: {
      fr: "Branding Studio",
      en: "Studio Branding",
      pt: "Branding em Estúdio",
    },
    location: {
      fr: "Studio Créatif & Maison de Soin, France",
      en: "Creative Studio & Beauty Atelier, France",
      pt: "Estúdio Criativo & Maison de Beleza, França",
    },
    season: "Printemps",
    coverImage: "/images/real/42722.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[4/5]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · 50mm f/1.2 GM · Softbox Octa Studio",
    description: {
      fr: "Portrait signature pour créatrice et praticienne du bien-être. Une lumière douce sculptant les traits, un chemisier en soie texturé et un regard franc qui inspire confiance et raffinement.",
      en: "Signature executive portrait for an aesthetician and wellness entrepreneur. Flawless soft lighting, silk textures, and a calm, authoritative gaze conveying elegance and prestige.",
      pt: "Retrato de branding pessoal para esteticista e empreendedora da beleza. Luz suave esculpindo as feições, blusa de seda elegante e um olhar seguro que transmite acolhimento e sofisticação.",
    },
    featured: true,
    gallery: [
      "/images/real/42722.jpg.jpeg",
      "/images/real/42677.jpg.jpeg",
      "/images/real/42679.jpg.jpeg",
      "/images/real/42692.jpg.jpeg",
      "/images/real/42710.jpg.jpeg",
      "/images/real/42740.jpg.jpeg",
    ],
  },
  {
    id: "studio-bougie-massage-rituel",
    slug: "bougie-massage-soin-spa-rituel",
    title: {
      fr: "La Bougie de Massage & Rituels Sensoriels",
      en: "Massage Candle Ritual & Sensory Care",
      pt: "Vela de Massagem & Rituais Sensoriais",
    },
    category: "details",
    categoryLabel: {
      fr: "Rituels Sensoriels",
      en: "Sensory Rituals",
      pt: "Rituais Sensoriais",
    },
    location: {
      fr: "Atelier Spa & Espace Soin, France",
      en: "Spa Atelier & Wellness Sanctuary, France",
      pt: "Ateliê Spa & Espaço de Cuidados, França",
    },
    season: "Printemps",
    coverImage: "/images/real/42838.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[3/4]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · FE 90mm f/2.8 Macro · Studio Ambient Glow",
    description: {
      fr: "L'art délicat de verser la cire chaude parfumée pour un massage régénérant. Des gestes mesurés, des vapeurs aromatiques et un hommage tactile à l'artisanat du bien-être.",
      en: "The mindful ritual of pouring warm, aromatic wax for a restorative massage. Focused hand gestures, golden drops, and tactile textures celebrating holistic wellness.",
      pt: "O ritual cuidadoso de verter a cera quente e perfumada para uma massagem relaxante. Gestos precisos, luz acolhedora e uma valorização estética dos rituais de autocuidado.",
    },
    featured: true,
    gallery: [
      "/images/real/42838.jpg.jpeg",
      "/images/real/42705.jpg.jpeg",
      "/images/real/43239.jpg.jpeg",
      "/images/real/42742.jpg.jpeg",
      "/images/real/42799.jpg.jpeg",
      "/images/real/43241.jpg.jpeg",
    ],
  },
  {
    id: "studio-gestuelle-haute-precision",
    slug: "gestuelle-soin-visage-precision",
    title: {
      fr: "L'Art du Soin & Gestuelle Haute Précision",
      en: "Facial Artistry & Precise Handcraft",
      pt: "A Arte do Cuidado & Gestos de Precisão",
    },
    category: "details",
    categoryLabel: {
      fr: "Savoir-Faire Esthétique",
      en: "Skincare Artistry",
      pt: "Técnica & Precisão",
    },
    location: {
      fr: "Cabine de Soin Privée, France",
      en: "Private Treatment Suite, France",
      pt: "Cabine Privada de Estética, França",
    },
    season: "Printemps",
    coverImage: "/images/real/42759.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[3/4]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · FE 50mm f/1.2 GM · Studio Diffused Lighting",
    description: {
      fr: "Immersion au cœur de la cabine de soin. La concentration de la praticienne, la précision des instruments et la sérénité des protocoles de beauté sur-mesure.",
      en: "An intimate glimpse into the bespoke treatment suite. The practitioner's unwavering focus, ergonomic precision, and the tranquility of elevated beauty rituals.",
      pt: "Uma imersão na cabine de atendimento. O foco da profissional, a precisão milimétrica dos instrumentos e a calma que envolve cada procedimento de estética.",
    },
    featured: true,
    gallery: [
      "/images/real/42759.jpg.jpeg",
      "/images/real/42751.jpg.jpeg",
      "/images/real/42733.jpg.jpeg",
      "/images/real/42676.jpg.jpeg",
      "/images/real/42791.jpg.jpeg",
      "/images/real/42796.jpg.jpeg",
    ],
  },
  {
    id: "studio-esthetique-mains-artisanat",
    slug: "esthetique-mains-onglerie-fine",
    title: {
      fr: "L'Esthétique des Mains & Soin Signature",
      en: "Manicure Artistry & Signature Details",
      pt: "Estética das Mãos & Detalhes Signature",
    },
    category: "details",
    categoryLabel: {
      fr: "Haute Précision",
      en: "Precision Details",
      pt: "Alta Precisão",
    },
    location: {
      fr: "Espace Beauté des Mains, France",
      en: "Bespoke Nail Studio, France",
      pt: "Estúdio de Nail Care, França",
    },
    season: "Printemps",
    coverImage: "/images/real/42716.jpg.jpeg",
    aspectRatio: "portrait",
    aspectClass: "aspect-[3/4]",
    objectPosition: "object-top",
    colSpan: "lg:col-span-6",
    camera: "Sony A7 IV · FE 90mm f/2.8 Macro · Studio Macro Detail",
    description: {
      fr: "Gros plan sur la beauté des mains, la texture des vernis et la minutie d'un soin signature. Un univers visuel léché pensé pour sublimer une marque haut de gamme.",
      en: "Close-up macro study of delicate hand care, fine lacquer finishes, and pristine craftsmanship designed to elevate luxury beauty brand storytelling.",
      pt: "Detalhe em macro da beleza das mãos, texturas dos esmaltes e a delicadeza de um tratamento de manicure de alto nível para marcas refinadas.",
    },
    featured: true,
    gallery: [
      "/images/real/42716.jpg.jpeg",
      "/images/real/42731.jpg.jpeg",
      "/images/real/42735.jpg.jpeg",
      "/images/real/42781.jpg.jpeg",
      "/images/real/42789.jpg.jpeg",
      "/images/real/43243.jpg.jpeg",
    ],
  },
];
