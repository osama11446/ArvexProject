// ******************************************************
// ** السيرفر الخلفي (Backend) - Node.js و Express        **
// ** يحتوي على منطق الـ Mock DB، التسجيل، الدخول، المنتجات، المعاملات **
// ******************************************************

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 

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
// 2. بيانات المنتجات
// **********************************************
const productsData = [
    { id: 1, name: "Arvex 1", cost: 105.00, durationDays: 60, dailyEarning: 35.00, img: "img/product1.png" },
    { id: 2, name: "Arvex 2", cost: 205.00, durationDays: 60, dailyEarning: 70.00, img: "img/product2.png" },
    { id: 3, name: "Arvex 3", cost: 405.00, durationDays: 60, dailyEarning: 150.00, img: "img/product3.png" },
    { id: 4, name: "Arvex 4", cost: 1000.00, durationDays: 60, dailyEarning: 320.00, img: "img/product4.png" },
    { id: 5, name: "Arvex 5", cost: 2000.00, durationDays: 60, dailyEarning: 750.00, img: "img/product5.png" },
];


// **********************************************
// 3. قاعدة بيانات مؤقتة (في الذاكرة - In-Memory DB)
// **********************************************
// تُستخدم للاختبار والنموذج الأولي. سيتم مسحها عند إيقاف تشغيل السيرفر.
let users = {
    "test@example.com": {
        password: "123", 
        uid: "user-12345", 
        email: "test@example.com",
        phone: "01012345678",
        balance: 500.00,
        referralCode: "ARVEX1",
        referredBy: null,
        isAdmin: true, 
        lastClaimTime: 0, 
        wheelSpins: 3, 
        myProducts: [
             { instanceId: 101, productId: 1, name: "Arvex 1", cost: 105.00, dailyEarning: 35.00, durationDays: 60, purchasedAt: Date.now() - (3 * 24 * 60 * 60 * 1000), lastRevenueCollection: Date.now() - (2 * 24 * 60 * 60 * 1000), totalRevenueCollected: 70.00 },
        ],
        transactions: [
            { type: "إيداع", name: "رصيد ابتدائي", amount: 500.00, date: new Date().toLocaleString(), isRevenue: false, status: 'completed' },
        ],
        team: [] 
    }
};

// **********************************************
// 4. دالة حماية الـ API (Middleware)
// **********************************************
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({ success: false, message: 'مطلوب رمز توثيق (Token).' });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token || !token.startsWith("fake-jwt-token-for-")) {
        return res.status(401).json({ success: false, message: 'رمز توثيق غير صالح.' });
    }
    
    const uid = token.replace("fake-jwt-token-for-", "");
    const user = users[uid];
    if (!user) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });
    }

    req.user = user; 
    req.uid = uid; 
    
    next();
};


// **********************************************
// 5. نقاط النهاية (API Endpoints)
// **********************************************

// 5.1. تسجيل حساب جديد
app.post('/api/register', (req, res) => {
    const { email, phone, password, referral } = req.body;

    if (users[email]) {
        return res.status(409).json({ success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل.' });
    }
    // ... باقي منطق التسجيل ...

    const newUID = `user-${Date.now()}`;
    const newReferralCode = newUID.toUpperCase().substring(5, 11);
    const initialBalance = 10.00;

    const newUser = {
        password: password,
        uid: newUID,
        email: email,
        phone: phone,
        balance: initialBalance,
        referralCode: newReferralCode,
        referredBy: referral || null,
        isAdmin: false,
        myProducts: [],
        transactions: [
             { type: "مكافأة", name: "هدية التسجيل", amount: initialBalance, date: new Date().toLocaleString(), isRevenue: true, status: 'completed' },
        ],
        team: [],
        lastClaimTime: 0,
        wheelSpins: 0,
    };

    users[email] = newUser;

    res.json({ 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح.'
    });
});


// 5.2. تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const user = users[email];

    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة.' });
    }

    const fakeToken = "fake-jwt-token-for-" + email; 

    res.json({ 
        success: true, 
        message: 'تم تسجيل الدخول بنجاح!',
        user: { uid: user.uid, phone: user.phone, email: user.email },
        token: fakeToken 
    });
});


// 5.3. جلب بيانات المستخدم
app.get('/api/user/data', authMiddleware, (req, res) => {
    const user = req.user; 
    // حذف كلمة المرور قبل الإرسال
    const { password, ...userData } = user;
    
    // إرجاع البيانات المطلوبة للواجهة الأمامية
    res.json({
        success: true,
        data: userData
    });
});

// 5.4. شراء منتج
app.post('/api/products/buy', authMiddleware, (req, res) => {
    const { productId } = req.body;
    const user = req.user; 

    const productToBuy = productsData.find(p => p.id === productId);

    if (!productToBuy) {
        return res.status(404).json({ success: false, message: 'المنتج غير موجود.' });
    }

    if (user.balance < productToBuy.cost) {
        return res.status(402).json({ success: false, message: 'رصيدك الحالي غير كافٍ لشراء هذا المنتج.' });
    }

    // خصم الرصيد
    user.balance -= productToBuy.cost;

    // تسجيل المعاملة
    user.transactions.push({
        type: "شراء منتج",
        name: productToBuy.name,
        amount: -productToBuy.cost,
        date: new Date().toLocaleString(),
        isRevenue: false,
        status: 'completed'
    });

    // إضافة المنتج للمستخدم
    const newProductInstance = {
        instanceId: Date.now() + Math.random(), 
        productId: productToBuy.id,
        name: productToBuy.name,
        cost: productToBuy.cost,
        durationDays: productToBuy.durationDays,
        dailyEarning: productToBuy.dailyEarning,
        purchasedAt: Date.now(), 
        lastRevenueCollection: Date.now(), 
        totalRevenueCollected: 0.00
    };
    user.myProducts.push(newProductInstance);

    res.json({ 
        success: true, 
        message: `✅ تم شراء منتج ${productToBuy.name} بنجاح!`,
        newBalance: user.balance,
        myProducts: user.myProducts,
        transactions: user.transactions
    });
});

// 5.5. جمع الأرباح المتاحة
const oneDay = 86400000; // 24 ساعة بالمللي ثانية
app.post('/api/products/collect', authMiddleware, (req, res) => {
    const user = req.user; 
    let totalCollectedAmount = 0;
    const now = Date.now();
    
    // منطق جمع الأرباح (كما شرحناه سابقاً)
    user.myProducts.forEach(product => {
        const lastCollectionTime = product.lastRevenueCollection || product.purchasedAt;
        // 🚨 هنا للـ **اختبار السريع** سنعتبر الدورة 10 ثواني (10000 مللي ثانية)
        // قم بتغيير 'oneDay' إلى '10000' للاختبار السريع، ثم أعدها لـ 'oneDay' قبل النشر
        const availableCycles = Math.floor((now - lastCollectionTime) / oneDay); // استخدم oneDay للنشر الحقيقي
        
        if (availableCycles >= 1) {
            const amountToCollect = availableCycles * product.dailyEarning;
            user.balance += amountToCollect;
            totalCollectedAmount += amountToCollect;
            product.lastRevenueCollection = now;
            product.totalRevenueCollected += amountToCollect;

            if (amountToCollect > 0) {
                 user.transactions.push({
                    type: "أرباح يومية",
                    name: product.name,
                    amount: amountToCollect,
                    date: new Date().toLocaleString(),
                    isRevenue: true,
                    status: 'completed'
                });
            }
        }
    });

    if (totalCollectedAmount === 0) {
        return res.json({ 
            success: false, 
            message: 'لا توجد أرباح متاحة للجمع حالياً.'
        });
    }

    res.json({ 
        success: true, 
        message: `✅ تم جمع إجمالي: ${totalCollectedAmount.toFixed(2)} ج.م`,
        newBalance: user.balance,
        myProducts: user.myProducts,
        transactions: user.transactions
    });
});

// 5.6. طلب الإيداع (Mocked)
app.post('/api/transactions/deposit', authMiddleware, (req, res) => {
    const { amount, method } = req.body;
    const user = req.user; 
    
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'المبلغ غير صالح.' });
    }
    
    user.balance += amount;

    user.transactions.push({
        type: "إيداع",
        name: `إيداع آلي عبر ${method}`,
        amount: amount,
        date: new Date().toLocaleString(),
        isRevenue: false,
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
    console.log(`\n=================================================`);
    console.log(`✅ السيرفر شغال دلوقتي على البورت: ${PORT}`);
    console.log(`🔑 مستخدم تجريبي: test@example.com / 123`);
    console.log(`=================================================`);
});
