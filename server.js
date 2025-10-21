// ******************************************************
// ** السيرفر الخلفي (Backend) - Node.js و Express        **
// ** يحتوي على منطق الـ Mock DB، التسجيل، الدخول، المنتجات، المعاملات **
// ******************************************************

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 
const path = require('path'); // ✅ إضافة جديدة: لاستخدام مسارات الملفات

const app = express();
// Railway ستحدد البورت تلقائيًا، لكن نستخدم 3000 للتطوير المحلي
const PORT = process.env.PORT || 3000; 

// **********************************************
// 1. التجهيزات الأساسية
// **********************************************

// السماح بجميع الطلبات من الواجهة الأمامية
app.use(cors()); 

// لاستخدام الـ JSON في الطلبات
app.use(bodyParser.json()); 

// **********************************************
// 🌟🌟🌟 إضافة جديدة لخدمة الملفات الثابتة 🌟🌟🌟
// **********************************************

// هذا السطر يخبر Express بأن يعرض الملفات الثابتة (مثل app.js و styles.css) 
// الموجودة في نفس المجلد الذي يوجد به server.js
app.use(express.static(path.join(__dirname, '')));

// هذا السطر يوجه طلب المسار الأساسي (/) ليعرض ملف index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// **********************************************
// 2. بيانات المنتجات
// **********************************************
const productsData = [
    { id: 1, name: "Arvex 1", cost: 105.00, durationDays: 60, dailyEarning: 35.00, img: "https://i.postimg.cc/CxL870Z/health-and-safety.jpg" },
    { id: 2, name: "Arvex 2", cost: 205.00, durationDays: 60, dailyEarning: 70.00, img: "https://i.postimg.cc/SRCPg88G/diversity-saped.jpg" },
    { id: 3, name: "Arvex 3", cost: 405.00, durationDays: 60, dailyEarning: 150.00, img: "https://i.postimg.cc/Zn2QcHCn/q3-earnings-web.jpg" },
    { id: 4, name: "Arvex 4", cost: 1000.00, durationDays: 60, dailyEarning: 320.00, img: "https://i.postimg.cc/mD8X0q9j/a25e6ffc-6d80-4963-a212-e5c70e4e5971.jpg" },
    { id: 5, name: "Arvex 5", cost: 2500.00, durationDays: 60, dailyEarning: 900.00, img: "https://i.postimg.cc/L4hF1v8g/business-growth.jpg" },
    { id: 6, name: "Arvex 6", cost: 5000.00, durationDays: 60, dailyEarning: 2000.00, img: "https://i.postimg.cc/QtxK54R8/47a2e7c4-0699-4d9f-9721-c426a8d8174f.jpg" }
];


// **********************************************
// 3. قاعدة البيانات الوهمية (Mock Database)
// **********************************************
const mockDB = {
    users: {
        'test-uid-12345': {
            uid: 'test-uid-12345',
            name: 'تجريبي',
            email: 'test@example.com',
            phone: '01000000000',
            password: '123', // يتم استخدامها للتسجيل فقط في هذا الـ mock
            balance: 500.00,
            totalDeposit: 100.00,
            totalEarnings: 25.00,
            activeInvestments: [
                { id: 101, productId: 1, cost: 105, dailyEarning: 35.00, startDate: new Date('2024-01-01').toLocaleString(), endDate: new Date('2024-03-01').toLocaleString() }
            ],
            transactions: [
                { type: "إيداع", name: "إيداع أولي", amount: 100.00, date: new Date('2024-01-01').toLocaleString(), isRevenue: true, status: 'completed' },
                { type: "استثمار", name: "استثمار Arvex 1", amount: -105.00, date: new Date('2024-01-01').toLocaleString(), isRevenue: false, status: 'completed' },
                { type: "ربح", name: "ربح يومي", amount: 35.00, date: new Date('2024-01-02').toLocaleString(), isRevenue: true, status: 'completed' }
            ]
        }
    }
};

// **********************************************
// 4. وظائف المساعدة والمصادقة (Auth & Helpers)
// **********************************************

// محاكاة لإنشاء JWT (توكن بسيط)
function generateToken(uid) {
    return `mock-token-${uid}-${Date.now()}`;
}

// Middleware للتحقق من التوكن
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'مطلوب رمز مصادقة (Token is missing).' });
    }
    
    // محاكاة للتحقق من التوكن واستخراج الـ UID
    const token = authHeader.split(' ')[1];
    const uid = token.split('-')[2]; // استخراج الـ UID من التوكن الوهمي

    const user = Object.values(mockDB.users).find(u => u.uid === uid);
    
    if (!user) {
        return res.status(401).json({ success: false, message: 'رمز مصادقة غير صالح.' });
    }
    
    req.user = user;
    next();
}


// **********************************************
// 5. مسارات الـ API (Routes)
// **********************************************

// 5.1. مسار التسجيل
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول المطلوبة.' });
    }
    
    // التحقق من وجود المستخدم بالفعل
    if (Object.values(mockDB.users).some(user => user.email === email)) {
        return res.status(409).json({ success: false, message: 'هذا البريد الإلكتروني مستخدم بالفعل.' });
    }
    
    // إنشاء UID عشوائي بسيط
    const newUid = `user-${Date.now()}`;
    
    const newUser = {
        uid: newUid,
        name,
        email,
        phone,
        password, // ملاحظة: في بيئة حقيقية يجب أن تكون مشفرة
        balance: 0.00,
        totalDeposit: 0.00,
        totalEarnings: 0.00,
        activeInvestments: [],
        transactions: [
            { type: "تسجيل", name: "حساب جديد", amount: 0.00, date: new Date().toLocaleString(), isRevenue: true, status: 'completed' }
        ]
    };

    mockDB.users[newUid] = newUser;
    
    const token = generateToken(newUid);

    res.status(201).json({ 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح.', 
        user: newUser,
        token 
    });
});


// 5.2. مسار تسجيل الدخول
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const user = Object.values(mockDB.users).find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        return res.status(401).json({ success: false, message: 'بيانات الاعتماد غير صحيحة.' });
    }

    const token = generateToken(user.uid);
    
    res.json({ 
        success: true, 
        message: 'تم تسجيل الدخول بنجاح.', 
        user,
        token 
    });
});

// 5.3. مسار جلب بيانات المستخدم
app.get('/api/users/:uid', authMiddleware, (req, res) => {
    // تم جلب بيانات المستخدم بالفعل من الـ Middleware
    res.json({ 
        success: true, 
        user: req.user
    });
});

// 5.4. مسار شراء منتج (استثمار)
app.post('/api/transactions/invest', authMiddleware, (req, res) => {
    const { productId } = req.body; 
    const user = req.user; 
    
    const product = productsData.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ success: false, message: 'المنتج غير موجود.' });
    }
    
    if (user.balance < product.cost) {
        return res.status(402).json({ success: false, message: 'رصيدك غير كافٍ لشراء هذا المنتج.' });
    }
    
    user.balance -= product.cost;

    // إضافة الاستثمار النشط
    user.activeInvestments.push({
        id: Date.now(),
        productId: product.id,
        cost: product.cost,
        dailyEarning: product.dailyEarning,
        startDate: new Date().toLocaleString(),
        durationDays: product.durationDays
    });

    // إضافة معاملة الاستثمار
    user.transactions.push({
        type: "استثمار",
        name: `استثمار ${product.name}`,
        amount: -product.cost,
        date: new Date().toLocaleString(),
        isRevenue: false,
        status: 'completed'
    });
    
    res.json({ 
        success: true, 
        message: `✅ تم الاستثمار في ${product.name} بنجاح!`,
        newBalance: user.balance,
        transactions: user.transactions,
        activeInvestments: user.activeInvestments 
    });
});

// 5.5. مسار جلب بيانات الاستثمارات النشطة
app.get('/api/investments', authMiddleware, (req, res) => {
    res.json({ 
        success: true, 
        investments: req.user.activeInvestments
    });
});


// 5.6. طلب الإيداع (Mocked)
app.post('/api/transactions/deposit', authMiddleware, (req, res) => {
    const { amount } = req.body; 
    const user = req.user; 

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'الرجاء إدخال مبلغ صحيح.' });
    }
    
    user.balance += amount;
    
    user.transactions.push({
        type: "إيداع",
        name: `إيداع عبر فودافون كاش`,
        amount: amount,
        date: new Date().toLocaleString(),
        isRevenue: true,
        status: 'completed'
    });

    res.json({ 
        success: true, 
        message: `✅ تم تأكيد إيداع مبلغ ${amount.toFixed(2)} ج.م بنجاح!`,
        newBalance: user.balance,
        transactions: user.transactions
    });
});


// 5.7. طلب السحب (Mocked)
app.post('/api/transactions/withdraw', authMiddleware, (req, res) => {
    const { amount, method, destination } = req.body; 
    const user = req.user; 

    if (typeof amount !== 'number' || amount <= 50) {
        return res.status(400).json({ success: false, message: 'الحد الأدنى للسحب هو 50 ج.م' });
    }
    
    if (user.balance < amount) {
        return res.status(402).json({ success: false, message: 'رصيدك غير كافٍ لإتمام عملية السحب.' });
    }
    
    user.balance -= amount;

    user.transactions.push({
        type: "سحب",
        name: `سحب آلي إلى ${destination}`,
        amount: -amount,
        date: new Date().toLocaleString(),
        isRevenue: false,
        status: 'completed'
    });
    
    res.json({ 
        success: true, 
        message: `✅ تم معالجة طلب سحب ${amount.toFixed(2)} ج.م بنجاح!`,
        newBalance: user.balance,
        transactions: user.transactions
    });
});


// **********************************************
// 6. تشغيل السيرفر
// **********************************************

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
