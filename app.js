// ******************************************************
// ** ملف app.js (واجهة المستخدم الأمامية)          **
// ** تم تنظيفه من جميع أكواد Firebase Firestore/Auth       **
// ******************************************************

// متغيرات عامة
let currentUser = null; 
// ✅✅✅ تم تحديث رابط السيرفر إلى رابط Railway العام ✅✅✅
const BASE_API_URL = 'https://arvexproject-production.up.railway.app/api'; 

// بيانات المنتجات (تبقى في الأمامي للعرض)
const productsData = [
    { id: 1, name: "Arvex 1", cost: 105.00, durationDays: 60, dailyEarning: 35.00, img: "https://i.postimg.cc/CxL870Z/health-and-safety.jpg" },
    { id: 2, name: "Arvex 2", cost: 205.00, durationDays: 60, dailyEarning: 70.00, img: "https://i.postimg.cc/SRCPg88G/diversity-saped.jpg" },
    { id: 3, name: "Arvex 3", cost: 405.00, durationDays: 60, dailyEarning: 150.00, img: "https://i.postimg.cc/Zn2QcHCn/q3-earnings-web.jpg" },
    { id: 4, name: "Arvex 4", cost: 1000.00, durationDays: 60, dailyEarning: 320.00, img: "https://i.postimg.cc/mD8X0q9j/a25e6ffc-6d80-4963-a212-e5c70e4e5971.jpg" },
    { id: 5, name: "Arvex 5", cost: 2500.00, durationDays: 60, dailyEarning: 900.00, img: "https://i.postimg.cc/L4hF1v8g/business-growth.jpg" },
    { id: 6, name: "Arvex 6", cost: 5000.00, durationDays: 60, dailyEarning: 2000.00, img: "https://i.postimg.cc/QtxK54R8/47a2e7c4-0699-4d9f-9721-c426a8d8174f.jpg" }
];


// ******************************************************
// 1. وظائف المساعدة (Helpers)
// ******************************************************

// دالة عامة لإظهار الرسائل (بديل لـ alert)
function showMessage(msg, type = 'success') {
    const msgBox = document.getElementById('message-box');
    const msgText = document.getElementById('message-text');
    msgText.textContent = msg;
    
    // إزالة جميع ألوان الخلفية المحتملة
    msgBox.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500');
    
    // تعيين اللون المناسب
    if (type === 'success') {
        msgBox.classList.add('bg-green-500');
    } else if (type === 'error') {
        msgBox.classList.add('bg-red-500');
    } else {
        msgBox.classList.add('bg-yellow-500');
    }

    msgBox.classList.remove('hidden', 'opacity-0', 'translate-y-full');
    msgBox.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        msgBox.classList.remove('opacity-100', 'translate-y-0');
        msgBox.classList.add('opacity-0', 'translate-y-full');
        setTimeout(() => {
             msgBox.classList.add('hidden');
        }, 300); // انتظر حتى ينتهي التحريك ليصبح مخفيًا
    }, 4000);
}

// دالة لجلب البيانات من السيرفر
async function fetchAPI(endpoint, method = 'GET', data = null) {
    const url = `${BASE_API_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };
    
    const token = localStorage.getItem('userToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers,
        // لا نرسل body مع طلبات GET
        body: data ? JSON.stringify(data) : null, 
    };
    
    try {
        const response = await fetch(url, config);
        const result = await response.json();
        
        if (response.ok) {
            return { success: true, data: result };
        } else {
            // معالجة الأخطاء من السيرفر (مثل 401 Unauthorized)
            if (response.status === 401) {
                userLogout();
                showMessage('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.', 'error');
            }
            return { success: false, message: result.message || 'حدث خطأ غير معروف.' };
        }
    } catch (error) {
        console.error('API Fetch Error:', error);
        showMessage('فشل الاتصال بالسيرفر. تأكد من أن السيرفر يعمل.', 'error');
        return { success: false, message: 'فشل في الاتصال بالسيرفر.' };
    }
}

// دالة تحديث حالة الواجهة (بعد تسجيل الدخول/الخروج)
function updateUI() {
    const isLoggedIn = currentUser !== null;
    document.getElementById('login-register-overlay').style.display = isLoggedIn ? 'none' : 'flex';
    document.getElementById('main-app-container').classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn) {
        // تحديث جميع بيانات المستخدم في الواجهة
        document.getElementById('user-balance').textContent = parseFloat(currentUser.balance).toFixed(2);
        document.getElementById('user-name-profile').textContent = currentUser.name || 'مستخدم جديد';
        document.getElementById('user-id').textContent = currentUser.uid;
        document.getElementById('user-total-earnings').textContent = parseFloat(currentUser.totalEarnings).toFixed(2);
        document.getElementById('user-total-deposit').textContent = parseFloat(currentUser.totalDeposit).toFixed(2);
        
        // تحديث جدول المعاملات
        updateTransactionsTable(currentUser.transactions);

        // إظهار زر لوحة التحكم للمشرف فقط (بناءً على UID ثابت)
        const isAdmin = currentUser.uid === 'admin-uid-12345';
        document.getElementById('nav-admin').classList.toggle('hidden', !isAdmin);

    } else {
        // إذا كان المستخدم غير مسجل دخول، قم بإظهار علامة التبويب "الرئيسية" الافتراضية
        showTab('home', document.getElementById('nav-home'));
    }
    
    // إعادة تهيئة أيقونات lucide بعد تحديث الـ DOM
    lucide.createIcons();
}

// دالة لجلب بيانات المستخدم بعد تسجيل الدخول أو عند تحميل الصفحة
async function fetchUserData(uid) {
    const response = await fetchAPI(`/users/${uid}`, 'GET');

    if (response.success) {
        currentUser = response.data.user;
        updateUI();
        showMessage('تم تحميل بياناتك بنجاح.');
    } else {
        showMessage(response.message || 'فشل تحميل بيانات المستخدم.', 'error');
        userLogout();
    }
}


// ******************************************************
// 2. وظائف المصادقة (Auth Functions)
// ******************************************************

async function userLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const response = await fetchAPI('/auth/login', 'POST', { email, password });

    if (response.success) {
        const { user, token } = response.data;
        localStorage.setItem('userUID', user.uid);
        localStorage.setItem('userToken', token);
        currentUser = user;
        updateUI();
        showMessage(`مرحبًا بعودتك يا ${user.name}!`);
    } else {
        showMessage(response.message || 'فشل تسجيل الدخول. تأكد من البيانات.', 'error');
    }
}

async function userRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const phone = document.getElementById('register-phone').value;

    const response = await fetchAPI('/auth/register', 'POST', { name, email, password, phone });

    if (response.success) {
        const { user, token } = response.data;
        localStorage.setItem('userUID', user.uid);
        localStorage.setItem('userToken', token);
        currentUser = user;
        updateUI();
        showMessage('✅ تم التسجيل بنجاح! مرحباً بك.');
    } else {
        showMessage(response.message || 'فشل التسجيل. ربما البريد الإلكتروني مستخدم بالفعل.', 'error');
    }
}

function userLogout() {
    localStorage.removeItem('userUID');
    localStorage.removeItem('userToken');
    currentUser = null;
    updateUI();
    showMessage('تم تسجيل الخروج بنجاح.');
}

// ******************************************************
// 3. وظائف التعامل مع المنتجات والمعاملات
// ******************************************************

async function userInvest(productId) {
    if (!currentUser) return showMessage('الرجاء تسجيل الدخول أولاً.', 'error');

    const product = productsData.find(p => p.id === productId);
    if (!product) return showMessage('المنتج غير موجود.', 'error');

    const response = await fetchAPI('/transactions/invest', 'POST', { productId });

    if (response.success) {
        currentUser.balance = response.data.newBalance;
        currentUser.transactions = response.data.transactions;
        currentUser.activeInvestments = response.data.activeInvestments; 
        updateUI();
        showMessage(response.message);
    } else {
        showMessage(response.message, 'error');
    }
}


async function submitDeposit() {
    if (!currentUser) return showMessage('الرجاء تسجيل الدخول أولاً.', 'error');
    const amount = parseFloat(document.getElementById('deposit-amount').value);

    if (isNaN(amount) || amount <= 0) {
        return showMessage('الرجاء إدخال مبلغ صحيح.', 'error');
    }
    
    // إخفاء نافذة الإيداع
    closeModal('deposit-modal');

    const response = await fetchAPI('/transactions/deposit', 'POST', { amount });

    if (response.success) {
        currentUser.balance = response.data.newBalance;
        currentUser.transactions = response.data.transactions;
        currentUser.totalDeposit = (currentUser.totalDeposit || 0) + amount; // تحديث إجمالي الإيداعات
        updateUI();
        showMessage(response.message);
    } else {
        showMessage(response.message, 'error');
    }
}


async function submitWithdraw() {
    if (!currentUser) return showMessage('الرجاء تسجيل الدخول أولاً.', 'error');
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const method = document.getElementById('withdraw-method').value;
    const destination = document.getElementById('withdraw-destination').value;

    if (isNaN(amount) || amount <= 50) {
        return showMessage('الحد الأدنى للسحب هو 50 ج.م.', 'error');
    }
    
    // إخفاء نافذة السحب
    closeModal('withdraw-modal');

    const response = await fetchAPI('/transactions/withdraw', 'POST', { amount, method, destination });

    if (response.success) {
        currentUser.balance = response.data.newBalance;
        currentUser.transactions = response.data.transactions;
        updateUI();
        showMessage(response.message);
    } else {
        showMessage(response.message, 'error');
    }
}


// ******************************************************
// 4. وظائف تحديث الواجهة والـ DOM
// ******************************************************

function updateTransactionsTable(transactions) {
    const tableBody = document.getElementById('transactions-table-body');
    tableBody.innerHTML = ''; // تفريغ الجدول

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">لا توجد معاملات مسجلة بعد.</td></tr>';
        return;
    }

    // عرض آخر 5 معاملات فقط
    const latestTransactions = transactions.slice(-5).reverse();

    latestTransactions.forEach(tx => {
        const amountClass = tx.isRevenue ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
        const sign = tx.amount > 0 ? '+' : '';
        const statusText = tx.status === 'completed' ? 'مكتملة' : 'قيد الانتظار';
        const statusClass = tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4 font-semibold">${tx.name}</td>
            <td class="py-3 px-4 ${amountClass}">${sign}${tx.amount.toFixed(2)} ج.م</td>
            <td class="py-3 px-4 text-sm">${tx.date.split(',')[0]}</td>
            <td class="py-3 px-4 text-center">
                <span class="inline-block px-3 py-1 text-xs rounded-full ${statusClass}">
                    ${statusText}
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function makeProductCard(product, isHome = false) {
    const actionButton = isHome ? 
        `<button class="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold transition-colors" onclick="showTab('shop')">
            <i data-lucide="shopping-cart" class="w-5 h-5 inline-block ml-2"></i> شاهد جميع المنتجات
        </button>`
        :
        `<button class="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors" onclick="userInvest(${product.id})">
            <i data-lucide="trending-up" class="w-5 h-5 inline-block ml-2"></i> استثمر الآن
        </button>`;

    return `
        <div class="product-card bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between">
            <div>
                <img src="${product.img}" alt="${product.name}" class="w-full h-auto rounded-xl mb-4 object-cover">
                <h3 class="text-xl font-black text-gray-900">${product.name}</h3>
                <p class="text-gray-500 text-sm mt-1">مدة العقد: ${product.durationDays} يوم</p>
                <div class="mt-3 flex flex-col gap-2">
                    <div class="flex items-center justify-between text-lg font-bold text-gray-700">
                        <span>قيمة الاستثمار:</span>
                        <span class="text-yellow-600">${product.cost.toFixed(2)} ج.م</span>
                    </div>
                    <div class="flex items-center justify-between text-lg font-bold text-gray-700 border-t pt-2">
                        <span>الربح اليومي:</span>
                        <span class="text-green-600">${product.dailyEarning.toFixed(2)} ج.م</span>
                    </div>
                </div>
            </div>
            ${actionButton}
        </div>
    `;
}

// ******************************************************
// 5. وظائف التحكم في الواجهة (UI Controls)
// ******************************************************

function showTab(tabId, element) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // إظهار التبويب المطلوب
    document.getElementById(tabId).classList.add('active');
    
    // إزالة حالة التفعيل من جميع أزرار التنقل
    document.querySelectorAll('.bottom-nav button').forEach(btn => btn.classList.remove('active-tab'));
    
    // تفعيل الزر الحالي
    if (element) {
        element.classList.add('active-tab');
    }
    
    // تحديث أيقونات lucide
    lucide.createIcons();
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    // لضمان عمل animation
    setTimeout(() => {
        document.getElementById(modalId).classList.add('opacity-100');
    }, 10);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('opacity-100');
    // لضمان عمل animation
    setTimeout(() => {
        document.getElementById(modalId).classList.add('hidden');
    }, 300);
}


// ******************************************************
// 6. تهيئة التطبيق (Initialization)
// ******************************************************

function initApp() {
    // ربط الدوال بأزرار Modal
    document.getElementById('deposit-submit-btn').onclick = submitDeposit;
    document.getElementById('withdraw-submit-btn').onclick = submitWithdraw;
    document.getElementById('deposit-open-btn').onclick = () => openModal('deposit-modal');
    document.getElementById('withdraw-open-btn').onclick = () => openModal('withdraw-modal');
    document.getElementById('logout-btn').onclick = userLogout;
    
    // ربط إغلاق الـ Modal بالخلفية
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.onclick = (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeModal(overlay.id);
            }
        };
    });
    
    // عرض المنتجات في المتجر والصفحة الرئيسية
    const shopContainer = document.getElementById("products-grid");
    productsData.forEach(p => shopContainer.innerHTML += makeProductCard(p));
    const homeContainer = document.getElementById("home-products-container");
    productsData.slice(0, 3).forEach(p => homeContainer.innerHTML += makeProductCard(p, true));
    
    // ربط أزرار تسجيل الدخول والتسجيل
    document.getElementById('login-btn').onclick = userLogin;
    document.getElementById('register-btn').onclick = userRegister;
    const loginFormEl = document.getElementById('login-form');
    const registerFormEl = document.getElementById('register-form');
    document.getElementById('show-register').onclick = () => { loginFormEl.classList.add('hidden-form'); registerFormEl.classList.remove('hidden-form'); };
    document.getElementById('show-login').onclick = () => { registerFormEl.classList.add('hidden-form'); loginFormEl.classList.remove('hidden-form'); };
    
    // التحقق من حالة الجلسة عند بدء التطبيق
    const storedUID = localStorage.getItem('userUID');
    const storedToken = localStorage.getItem('userToken');
    if (storedUID && storedToken) {
        // إذا كان هناك توكن مخزن، حاول جلب البيانات
        fetchUserData(storedUID);
    } else {
        // إظهار شاشة تسجيل الدخول
         document.getElementById('login-register-overlay').style.display = 'flex';
         updateUI(); 
    }
}
        
document.addEventListener("DOMContentLoaded", initApp);
