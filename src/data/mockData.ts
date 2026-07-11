import { Book, User } from '../types';

export const MOCK_BOOKS: Book[] = [
  // Physics (الفيزياء)
  {
    id: '1',
    title: 'أساسيات الفيزياء الحديثة',
    author: 'أحمد كمال',
    category: 'فيزياء',
    shelf: 'A-1',
    section: 'A',
    description: 'كتاب شامل يغطي قوانين الحركة والطاقة بأسلوب مبسط للمبتدئين.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '4',
    title: 'ميكانيكا الكم للجميع',
    author: 'ياسر العلي',
    category: 'فيزياء',
    shelf: 'A-2',
    section: 'A',
    description: 'رحلة في عالم الذرة والجسيمات دون الذرية.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '7',
    title: 'الكون الأنيق',
    author: 'براين غرين',
    category: 'فيزياء',
    shelf: 'A-3',
    section: 'A',
    description: 'استعراض لنظرية الأوتار الفائقة وهيكل الزمكان.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '8',
    title: 'تاريخ موجز للزمن',
    author: 'ستيفن هوكينج',
    category: 'فيزياء',
    shelf: 'A-4',
    section: 'A',
    description: 'شرح مبسط لأصل الكون والمادة والطاقة.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '9',
    title: 'الفيزياء الكلاسيكية',
    author: 'د. ليلى حسن',
    category: 'فيزياء',
    shelf: 'A-5',
    section: 'A',
    description: 'مرجع شامل في الميكانيكا والحرارة والصوت.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?auto=format&fit=crop&w=300&q=80'
  },
  // Engineering (هندسة)
  {
    id: '2',
    title: 'مبادئ الهندسة المدنية',
    author: 'سارة محمود',
    category: 'هندسة',
    shelf: 'B-2',
    section: 'B',
    description: 'دليل عملي للمهندسين المبتدئين في تصميم المنشآت.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '5',
    title: 'الذكاء الاصطناعي في حياتنا',
    author: 'مريم سعيد',
    category: 'هندسة',
    shelf: 'B-3',
    section: 'B',
    description: 'استعراض لتطبيقات الذكاء الاصطناعي وكيف تغير العالم.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '10',
    title: 'هندسة البرمجيات المعاصرة',
    author: 'علي ناصر',
    category: 'هندسة',
    shelf: 'B-4',
    section: 'B',
    description: 'منهجيات التطوير الحديثة وإدارة المشاريع التقنية.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '11',
    title: 'الإلكترونيات الرقمية',
    author: 'فهد الغامدي',
    category: 'هندسة',
    shelf: 'B-5',
    section: 'B',
    description: 'تصميم الدوائر المتكاملة والأنظمة المدمجة.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '12',
    title: 'هندسة الروبوتات',
    author: 'سامي الخالدي',
    category: 'هندسة',
    shelf: 'B-6',
    section: 'B',
    description: 'أساسيات الحركة والتحكم في الأنظمة الروبوتية.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80'
  },
  // Psychology (علم نفس)
  {
    id: '3',
    title: 'علم النفس السلوكي',
    author: 'د. خالد إبراهيم',
    category: 'علم نفس',
    shelf: 'C-1',
    section: 'C',
    description: 'دراسة في السلوك البشري وكيفية تحليل الدوافع النفسية.',
    status: 'borrowed',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '13',
    title: 'الذكاء العاطفي',
    author: 'دانيال غولمان',
    category: 'علم نفس',
    shelf: 'C-2',
    section: 'C',
    description: 'كيف يغير الذكاء العاطفي مسار النجاح المهني والشخصي.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '14',
    title: 'لغة الجسد',
    author: 'ألان بيز',
    category: 'علم نفس',
    shelf: 'C-3',
    section: 'C',
    description: 'فهم الإشارات غير اللفظية وتعزيز مهارات التواصل.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '15',
    title: 'قوة العادات',
    author: 'تشارلز دوهيج',
    category: 'علم نفس',
    shelf: 'C-4',
    section: 'C',
    description: 'لماذا نفعل ما نفعله في الحياة والعمل وكيفية تغييره.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '16',
    title: 'التفكير السريع والبطيء',
    author: 'دانيال كانيمان',
    category: 'علم نفس',
    shelf: 'C-5',
    section: 'C',
    description: 'تحليل للنظامين اللذين يقودان طريقتنا في التفكير.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=300&q=80'
  },
  // General (عام)
  {
    id: '6',
    title: 'تاريخ الفلسفة اليونانية',
    author: 'جمال زيدان',
    category: 'عام',
    shelf: 'D-3',
    section: 'D',
    description: 'نظرة معمقة للفكر الفلسفي منذ سقراط.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '17',
    title: 'مقدمة في علم الاجتماع',
    author: 'د. منيرة عبدالله',
    category: 'عام',
    shelf: 'D-1',
    section: 'D',
    description: 'دراسة النظم الاجتماعية وتفاعل الأفراد داخل المجتمع.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1529148482759-b35b25c5f217?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '18',
    title: 'أساسيات الاقتصاد',
    author: 'محمد الراجحي',
    category: 'عام',
    shelf: 'D-2',
    section: 'D',
    description: 'شرح لمبادئ الاقتصاد الكلي والجزئي بأسلوب معاصر.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1611974714652-32135689592f?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '19',
    title: 'إدارة الوقت والإنتاجية',
    author: 'سلمى العيسى',
    category: 'عام',
    shelf: 'D-4',
    section: 'D',
    description: 'استراتيجيات عملية لرفع الكفاءة وتنظيم المهام اليومية.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '20',
    title: 'فن الخطابة والإقناع',
    author: 'يوسف منصور',
    category: 'عام',
    shelf: 'D-5',
    section: 'D',
    description: 'مهارات التحدث أمام الجمهور وفنون التأثير القيادي.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=300&q=80'
  },
  // Mechanical Engineering (هندسة ميكانيكية)
  {
    id: '21',
    title: 'مبادئ محركات الاحتراق الداخلي',
    author: 'د. سامي يوسف',
    category: 'هندسة',
    shelf: 'E-1',
    section: 'E',
    description: 'دليل شامل حول كيفية عمل وتركيب محركات السيارات والآلات الثقيلة.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '22',
    title: 'صيانة السيارات الحديثة',
    author: 'المهندس رامي حسن',
    category: 'هندسة',
    shelf: 'E-2',
    section: 'E',
    description: 'شرح مفصل لأنظمة الميكانيكا والكهرباء في السيارات الحديثة وطرق إصلاحها.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1487750148642-2662911a369c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: '23',
    title: 'تكنولوجيا محركات الهايبرد',
    author: 'د. مناد العتيبي',
    category: 'هندسة',
    shelf: 'E-3',
    section: 'E',
    description: 'استكشاف شامل للأنظمة الهجينة والكهربائية في السيارات الحديثة.',
    status: 'available',
    coverUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=300&q=80'
  }
];

export const MOCK_USER: User = {
  id: 'u1',
  name: 'فاطمة المعمري',
  email: 'fatima@example.com',
  role: 'admin', // Changed to admin for the new features
  borrowedBooks: ['3', '1'],
  totalReadCount: 12,
  points: 450,
  badges: ['باحث', 'متميز']
};

export const MOCK_USERS: User[] = [
  MOCK_USER,
  {
    id: 'u2',
    name: 'سارة أحمد',
    email: 'sarah@example.com',
    role: 'student',
    borrowedBooks: ['2'],
    totalReadCount: 5,
    points: 200,
    badges: ['باحث']
  },
  {
    id: 'u3',
    name: 'محمد علي',
    email: 'mohamed@example.com',
    role: 'student',
    borrowedBooks: [],
    totalReadCount: 20,
    points: 800,
    badges: ['باحث', 'متميز', 'قارئ الشهر']
  }
];
