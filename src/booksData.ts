import { Book, Badge } from './types';

export const BOOKS: Book[] = [
  {
    id: 'relativity-01',
    title: 'The General Theory of Relativity Explained',
    titleArabic: 'النظرية العامة للنسبية المبسطة',
    author: 'Albert Einstein',
    genre: 'Science',
    genreArabic: 'علوم',
    year: 1916,
    pages: 180,
    coverColor: 'from-blue-600 to-indigo-900',
    description: 'A comprehensive yet accessible guide to Einstein’s revolutionary theory explaining gravity as curvature in the space-time fabric.',
    summary: 'This book presents the fundamental principles of special and general relativity, tracing the journey from Newton’s absolute space to Einstein’s curved space-time continuum. It explores concepts such as time dilation, length contraction, energy-mass equivalence (E=mc²), gravitational lensing, and the warping of space-time around massive stars.',
    location: {
      floor: 1,
      aisle: 'A',
      shelf: 1,
      section: 'Physics & General Science'
    },
    chapters: [
      {
        number: 1,
        title: 'The Illusion of Absolute Time',
        content: 'For centuries, classical physics assumed that time ticks at a constant, immutable rate everywhere in the universe. Einstein challenged this by showing that time is personal and relative. A clock in high-velocity flight ticks slower compared to a stationary one—a phenomenon called time dilation. Space and time are not independent backdrops but are linked together as a four-dimensional coordinate frame called Space-Time.'
      },
      {
        number: 2,
        title: 'Gravity as Fabric Curvature',
        content: 'Isaac Newton described gravity as an invisible pulling force. Einstein realized gravity is instead a geometric effect. Massive objects like the Sun do not pull Earth directly via stringy lines; they warp and dimple the four-dimensional elastic fabric of Space-Time around them. Earth moves in a curved path because it is simply following the natural contours of this warped sheet, similar to a marble rolling around a heavy bowling ball.'
      },
      {
        number: 3,
        title: 'Bending Light & Black Holes',
        content: 'Since space-time itself is curved, light beams traveling through space must also curve as they pass near supermassive objects. This was famously confirmed during a solar eclipse in 1919. If mass becomes dense enough, the warping becomes infinite, creating a boundary called the event horizon. Beyond this horizon, nothing—not even light—can escape. These remnants are known as black holes.'
      }
    ],
    quizzes: [
      {
        question: 'How did Einstein define Earth orbiting the Sun?',
        options: [
          'A simple rope-like physical force pulling the planet inward.',
          'Earth following the warped space-time curvature created by the Sun.',
          'An electrostatic attraction due to magnetic waves.',
          'Centrifugal escape velocity pushing Earth into a friction-less orbit.'
        ],
        answerIndex: 1,
        explanation: 'In general relativity, earth orbits the sun because the sun’s huge mass curves the space-time fabric around it, and the earth follows its geodesic line.'
      },
      {
        question: 'Under time dilation, what happens to a fast-moving clock relative to a stationary observer?',
        options: [
          'It continues ticking identically.',
          'It ticks faster.',
          'It ticks slower.',
          'It stops ticking completely.'
        ],
        answerIndex: 2,
        explanation: 'Time dilation means that moving clocks tick slower relative to a stationary frame of reference.'
      }
    ]
  },
  {
    id: 'ai-01',
    title: 'Computational Intellect: Foundations of AI',
    titleArabic: 'الذكاء الحاسوبي: أسس ومناهج الذكاء الاصطناعي',
    author: 'Dr. Layth Al-Karimi',
    genre: 'Computer Science',
    genreArabic: 'علوم الحاسوب',
    year: 2024,
    pages: 350,
    coverColor: 'from-purple-600 to-indigo-900',
    description: 'A study on algorithmic paradigms, neural networks, machine learning, and the philosophical inquiries into artificial consciousness.',
    summary: 'A pristine textbook outlining modern AI systems, beginning from symbolic search systems and moving into deep neural learning, gradient descent optimization, transformers, reinforcement learning models, and ethical AI policy frameworks.',
    location: {
      floor: 2,
      aisle: 'B',
      shelf: 3,
      section: 'Artificial Intelligence & Robotics'
    },
    chapters: [
      {
        number: 1,
        title: 'From Rules to Representation',
        content: 'The earliest AI systems were symbolic expert engines, relying on programmed logical rules. If-then arrays could diagnose simple illnesses or play chess poorly, but they failed at recognizing a cats face or translating human context. Traditional systems were fragile because real-world variables are too noisy to write direct conditional code for.'
      },
      {
        number: 2,
        title: 'Neural Networks & Gradient Descent',
        content: 'Artificial Neural Networks mimic the interconnected network of human neurons. By passing input vectors through layers of nodes, the system makes predictions. Calculating the discrepancy (loss) between the prediction and the ground truth allows the system to adjust internal weights. The mechanism to tune weights toward lower loss is called Gradient Descent.'
      },
      {
        number: 3,
        title: 'The Transformer Revolution',
        content: 'Transformers introduced the attention mechanism, allowing neural networks to focus intensely on specific words of a sentence regardless of distance. Rather than reading texts sequentially, transformers process speech in parallel, enabling rapid scaling of context windows, powering Large Language Models like the Gemini series.'
      }
    ],
    quizzes: [
      {
        question: 'Which mechanism is responsible for tuning internal weights to minimize model predictions error?',
        options: [
          'Binary Tree traversal',
          'Heuristic Depth First search',
          'Gradient Descent',
          'CPU cache pipelines'
        ],
        answerIndex: 2,
        explanation: 'Gradient descent computes gradients of the loss function with respect to weights, adjusting them iteratively in the opposite direction.'
      },
      {
        question: 'What revolutionary architecture introduced the self-attention mechanism?',
        options: [
          'Recurrent Neural Networks (RNN)',
          'Convolutional Neural Networks (CNN)',
          'The Transformer',
          'Rule-based Prolog compiler'
        ],
        answerIndex: 2,
        explanation: 'Transformers introduced attention blocks, bypassing sequential recurrences for faster parallel context modeling.'
      }
    ]
  },
  {
    id: 'history-golden-science',
    title: 'Islamic Golden Age Science & Discoveries',
    titleArabic: 'العلوم والاكتشافات في العصر الذهبي الإسلامي',
    author: 'Fatima Al-Hassan',
    genre: 'History',
    genreArabic: 'تاريخ',
    year: 2018,
    pages: 280,
    coverColor: 'from-amber-600 to-amber-900',
    description: 'An extensive historical examination of scientific breakthroughs in medieval Baghdad, Cordoba, and Cairo, paving the way for the Renaissance.',
    summary: 'Relive the legacy of House of Wisdom (Bayt al-Hikmah) in Baghdad. Discover the foundational contributions of Al-Khwarizmi, Alhazen (Ibn al-Haytham), Ibn Sina (Avicenna), and Fatima al-Fihriya. It covers astronomy, optics, algebra, surgical innovations, and general mechanics.',
    location: {
      floor: 1,
      aisle: 'C',
      shelf: 2,
      section: 'Islamic History & Arab Sciences'
    },
    chapters: [
      {
        number: 1,
        title: 'Bayt al-Hikmah (The House of Wisdom)',
        content: 'Baghdad during the Abbasid Caliphate became the intellectual capital of the planet. Caliphs sponsored scholars to gather, translate, and synthesize all Sanskrit, Greek, and Persian scrolls into Arabic. This initiated the translation movement, preserving global intellect while fostering independent creative breakthroughs under royal academies.'
      },
      {
        number: 2,
        title: 'Al-Jabr (The Al-Gebra of Khwarizmi)',
        content: 'Muhammad ibn Musa al-Khwarizmi invented the mathematical logic of Algebra (Al-Jabr), which literally means the reunion of broken parts. He structured the concepts of utilizing equations, variables, and balancing operations. His Arabic treatise also introduced the Hindu-Arabic numeral system, including the crucial placeholder zero, to Europe; the term "algorithm" is derived from his name.'
      },
      {
        number: 3,
        title: 'Optics and the Empirical Method',
        content: 'Ibn al-Haytham (Alhazen) revolutionized the understanding of how we see. Ancient thinkers believed the eyes shoot lasers out in active emission. By building a camera obscura (Al-Bayt Al-Muzlim), Alhazen proved that light instead enters the eye, formulating the scientific method based on testing, mathematical proof, and physical evidence.'
      }
    ],
    quizzes: [
      {
        question: 'From whose name is the word "algorithm" derived?',
        options: [
          'Plato',
          'Ibn Sina (Avicenna)',
          'Al-Khwarizmi',
          'Leonardo da Vinci'
        ],
        answerIndex: 2,
        explanation: "Al-Khwarizmi (Muhammad ibn Musa al-Khwarizmi) authored the fundamental works on Algebra and numerals, and his name anglicized gave rise to the word 'algorithm'."
      },
      {
        question: 'How did Ibn al-Haytham prove visual ray absorption instead of active emission?',
        options: [
          'By pointing magnifying lenses at solar eclipses.',
          'By using a dark room apparatus (camera obscura) to show light beams traveling through apertures.',
          'By anatomical dissection of a hawk’s lens only.',
          'By inventing the first wearable refractive reading spectacles.'
        ],
        answerIndex: 1,
        explanation: 'Ibn al-Haytham used his camera obscura to demonstrate that light travel in straight lines, refuting emission theories empirically.'
      }
    ]
  },
  {
    id: 'math-finance',
    title: 'Stochastic Calculus & Financial Mechanics',
    titleArabic: 'الحسبان العشوائي وميكانيكا الهندسة المالية',
    author: 'Dr. Samer Mansour',
    genre: 'Math',
    genreArabic: 'رياضيات',
    year: 2021,
    pages: 220,
    coverColor: 'from-emerald-700 to-teal-950',
    description: 'An advanced treatise on random walks, probability density functions, Markov chains, and mathematical equations modeling stochastic behavior.',
    summary: 'A deep dive into Brownian motion, martingale pathways, Ito’s Lemma, and the integration of probability into modern trading systems, derivative models, and physical dispersion predictions.',
    location: {
      floor: 2,
      aisle: 'A',
      shelf: 4,
      section: 'Advanced Mathematics & Statistics'
    },
    chapters: [
      {
        number: 1,
        title: 'Random Walks & Brownian Motion',
        content: 'A random walk represents a path consisting of a succession of random steps. In continuous mathematical time, this leads directly to Brownian Motion—the random erratic movement of particles suspended in a fluid. It serves as the mathematical foundation for any unpredictable time-series model.'
      },
      {
        number: 2,
        title: 'Ito’s Calculus and Taylor Expansions',
        content: 'Standard calculus does not apply to Brownian pathways because they are highly non-differentiable. Ito’s Lemma provides an elegant stochastic counterpart to the chain rule, utilizing secondary Taylor series extensions to account for continuous volatility parameters.'
      }
    ],
    quizzes: [
      {
        question: 'What physical system formulates the mathematical model of Brownian Motion?',
        options: [
          'Gravity curves around celestial objects.',
          'Random erratic motion of microscopic particles suspended in fluids.',
          'The magnetic spin of subatomic quarks.',
          'The refraction of light beams in silica glasses.'
        ],
        answerIndex: 1,
        explanation: 'Brownian motion is historically inspired by Robert Brown’s look at pollen grains erratic movement, modeled mathematically by Louis Bachelier and Albert Einstein.'
      }
    ]
  },
  {
    id: 'lit-epic',
    title: 'An Odyssey into Classical Epic Poetry',
    titleArabic: 'أوديسة الشعر الملحمي الكلاسيكي',
    author: 'Homer / Classical scholars',
    genre: 'Literature',
    genreArabic: 'أدب',
    year: -800,
    pages: 310,
    coverColor: 'from-red-600 to-rose-950',
    description: 'An in-depth translation and cultural commentary of ancient Greek epic narratives, tracking Odysseus’ ten-year return home.',
    summary: 'A definitive literary analysis of Greek epic mythologies, examining recurring tropes, tragic hubris, structural epic poetry styles, hospitality (Xenia) guidelines, and the journey as a metaphor for structural human psychological growth.',
    location: {
      floor: 3,
      aisle: 'D',
      shelf: 1,
      section: 'World Classics & Ancient Lit'
    },
    chapters: [
      {
        number: 1,
        title: 'The Concept of Hubris and Wrath',
        content: 'Greek folklore constantly warns against "hubris"—excessive, self-destructive pride. Odysseus constantly triggers the anger of gods by boasting about his intellect and taking credit for accomplishments that actually belong to divine interventions, leading to his heavy trials.'
      }
    ],
    quizzes: [
      {
        question: 'Which Greek concept is defined as excessive, self-defeating arrogance that offends the gods?',
        options: [
          'Nostos',
          'Aristeia',
          'Hubris',
          'Catharsis'
        ],
        answerIndex: 2,
        explanation: 'Hubris is defining excessive pride, fatal for classic tragic figures.'
      }
    ]
  },
  {
    id: 'art-calligraphy',
    title: 'Arabic Calligraphy & Geometric Artistry',
    titleArabic: 'الخط العربي والزخرفة الهندسية الإسلامية',
    author: 'Mustafa El-Sayed',
    genre: 'Art',
    genreArabic: 'فنون',
    year: 2019,
    pages: 150,
    coverColor: 'from-amber-500 to-teal-800',
    description: 'An exquisite study of Thuluth, Naskh, and Kufic calligraphy fonts, alongside mathematical principles of repeating geometric art (Arabesque).',
    summary: 'A visual manual detailing the development of abstract geometrical patterns in Cairo, Andalusia, and Samarkand. It highlights the use of mathematics (tessellations, compass-and-straightedge patterns) to construct breathtaking mosaics.',
    location: {
      floor: 3,
      aisle: 'C',
      shelf: 2,
      section: 'Fine Arts & Architecture'
    },
    chapters: [
      {
        number: 1,
        title: 'The Proportions of Al-Khatt',
        content: 'Unlike contemporary illustration, classic Arabic calligraphy is purely scientific. The weight, angle, and curvature of letterings are carefully calculated using a standard unit metric—the geometric "point" created by the tip of the reed pen (Qalam).'
      }
    ],
    quizzes: [
      {
        question: 'What primary tool defines the foundational dot measurement in Arabic calligraphy?',
        options: [
          'A circular glass compass.',
          'The ink dot made from the standard reed pen (Qalam) tip.',
          'An ivory measurement ruler.',
          'A geometric grid computed by optical ratios.'
        ],
        answerIndex: 1,
        explanation: 'The standard dimensions of Thuluth or Naskh letters are proportioned entirely in terms of points made by the reed pen.'
      }
    ]
  }
];

export const BADGES: Badge[] = [
  {
    id: 'badge-welcome',
    title: 'First Expedition',
    titleArabic: 'الرحلة الأولى',
    description: 'Unlocked by starting your customized Smart Library session.',
    iconName: 'Compass',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
  },
  {
    id: 'badge-science-quiz',
    title: 'Einstein Protégé',
    titleArabic: 'تلميذ آينشتاين',
    description: 'Scored 100% on the Special Relativity physics quiz.',
    iconName: 'Atom',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
  },
  {
    id: 'badge-ai-quiz',
    title: 'Algorithmic Virtuoso',
    titleArabic: 'أستاذ الخوارزميات',
    description: 'Scored 100% on the Foundations of AI quiz.',
    iconName: 'Cpu',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
  },
  {
    id: 'badge-streak-3',
    title: 'Dedicated Thinker',
    titleArabic: 'المفكر الملتزم',
    description: 'Maintained an active 3-day book-reading streak.',
    iconName: 'Flame',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
  },
  {
    id: 'badge-all-genres',
    title: 'Polymath Reader',
    titleArabic: 'القارئ الموسوعي',
    description: 'Logged reading times across 3 distinct intellectual genres.',
    iconName: 'BookOpen',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  }
];
