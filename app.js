// ******************************************************
// ** ملف app.js (واجهة المستخدم الأمامية)          **
// ** تم تنظيفه من جميع أكواد Firebase Firestore/Auth       **
// ******************************************************

// متغيرات عامة
let currentUser = null; 
const BASE_API_URL = 'http://localhost:3000/api'; // 🚨 هذا هو رابط السيرفر الخلفي في Termux 🚨

// بيانات المنتجات (تبقى في الأمامي للعرض)
const productsData = [
    { id: 1, name: "Arvex 1", cost: 105.00, durationDays: 60, dailyEarning: 35.00, img: "https://i.postimg.cc/CxL870Z/health-and-safety.jpg" },
    { id: 2, name: "Arvex 2", cost: 205.00, durationDays: 60, dailyEarning: 70.00, img: "https://i.postimg.cc/SRCPg88G/diversity-saped.jpg" },
    { id: 3, name: "Arvex 3", cost: 405.00, durationDays: 60, dailyEarning: 150.00, img: "https://i.postimg.cc/Zn2QcHCn/q3-earnings-web.jpg" },
    { id: 4, name: "Arvex 4", cost: 1000.00, durationDays: 60, dailyEarning: 320.00, img: "https://i.postimg.cc/NjpzCQyZ/2016c1163-1-1-mjk-207.jpg" },
    { id: 5, name: "Arvex 5", cost: 2000.00, durationDays: 60, dailyEarning: 750.00, img: "https://i.postimg.cc/R0SBgLD7/01-hero-img-circulareconomy.webp" },
];

// ******************** 1. وظائف واجهة المستخدم العامة ********************
        
function showTab(tabId, buttonElement = null) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // إخفاء أقسام "حسابي" الفرعية عند الانتقال لتبويب آخر
    if (tabId !== 'ont' && tabId !== 'team-details') {
        document.getElementById("settings-menu-main").classList.remove('hidden');
        document.getElementById("back-button-account").classList.add('hidden');
        document.getElementById("back-to-team-btn").classList.add('hidden');
        document.querySelectorAll('.setting-section').forEach(el => el.classList.add('hidden'));
    }
    
    // 🚨 تفعيل جلب بيانات الإدمن عند الحاجة (سيتم برمجته لاحقاً)
    if (tabId === 'admin-panel' && currentUser && currentUser.isAdmin) {
         // adminFetchTransactions(); 
    }

    document.querySelectorAll('.bottom-nav button').forEach(btn => {
        btn.classList.remove('active-tab');
        btn.querySelector('.icon-bg').classList.remove('bg-yellow-100');
        btn.querySelector('.icon-bg').classList.add('bg-gray-100');
    });

    const activeBtn = buttonElement || document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('active-tab');
        activeBtn.querySelector('.icon-bg').classList.remove('bg-gray-100');
        activeBtn.querySelector('.icon-bg').classList.add('bg-yellow-100');
    }
    window.scrollTo(0, 0);
}

function showFancyToast(message, type = 'error') {
    const toast = document.getElementById('fancy-toast');
    const text = document.getElementById('fancy-toast-text');
    text.textContent = message;

    toast.style.backgroundColor = type === 'success' ? '#10b981' : (type === 'info' ? '#3b82f6' : '#ff3b30');
    
    toast.style.top = '30px';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.top = '-100px';
        toast.style.opacity = '0';
    }, 3000);
}

function formatCurrency(amount) {
    // تنسيق العملة مع فاصل الآلاف
    return `${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ج.م`;
}

// دالة التحكم في أقسام صفحة "حسابي"
function showAccountSection(id) {
    if (id !== 'team-details') {
        document.getElementById("settings-menu-main").classList.add('hidden');
        document.getElementById("back-button-account").classList.remove('hidden');
    } 
    
    if (id === 'team-details') {
         showTab('team-details', document.getElementById('nav-team'));
         document.getElementById("back-to-team-btn").classList.add('hidden');
    } else {
        document.querySelectorAll('.setting-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }
}

function backToAccountMenu() {
    document.getElementById("settings-menu-main").classList.remove('hidden');
    document.getElementById("back-button-account").classList.add('hidden');
    document.querySelectorAll('.setting-section').forEach(el => el.classList.add('hidden'));
}


// ******************** 2. منطق تسجيل الدخول والتسجيل (استدعاء API) ********************
        
function generateReferralCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
        
// 🚨 هذه الدالة تم تعديلها لاستدعاء السيرفر الخلفي بدلاً من Firebase 🚨
async function userRegister() {
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const pass = document.getElementById('register-password').value;
    const passConfirm = document.getElementById('register-password-confirm').value;
    const referral = document.getElementById('register-referral').value.toUpperCase();

    if (!email || !phone || pass.length < 6 || pass !== passConfirm) {
         return showFancyToast('يرجى ملء جميع الحقول بشكل صحيح. كلمة السر يجب أن تكون 6 أحرف على الأقل، والبريد وتأكيده متطابقين.');
    }
    if (phone.length < 8) {
         return showFancyToast('يجب أن لا يقل رقم الهاتف عن 8 أرقام.');
    }

    try {
        const response = await fetch(`${BASE_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email, 
                phone: phone, 
                password: pass, 
                referral: referral,
                // نرسل كود إحالة مبدئي، لكن السيرفر هو من سيتحقق ويخزنه
                initialReferralCode: generateReferralCode() 
            })
        });
        
        const result = await response.json();

        if (result.success) {
            showFancyToast('✅ تم تسجيل الحساب بنجاح! رصيدك الآن 10.00 ج.م', 'success');
             // العودة إلى شاشة تسجيل الدخول
            document.getElementById('register-form').classList.add('hidden-form');
            document.getElementById('login-form').classList.remove('hidden-form');
        } else {
            showFancyToast(`❌ خطأ في التسجيل: ${result.message}`);
        }

    } catch (error) {
        console.error("Registration Error:", error);
        showFancyToast(`❌ خطأ في الاتصال بالسيرفر: ${error.message}`); 
    }
}

// 🚨 هذه الدالة تم تعديلها لاستدعاء السيرفر الخلفي بدلاً من Firebase 🚨
async function userLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (!email || pass.length < 6) {
         return showFancyToast('يرجى إدخال البريد وكلمة المرور بشكل صحيح.');
    }

    try {
        const response = await fetch(`${BASE_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: pass })
        });
        
        const result = await response.json();

        if (result.success) {
            // تخزين بيانات المستخدم والتوكن (للاستخدام في الطلبات اللاحقة)
            // نستخدم localStorage لتخزين حالة الجلسة
            localStorage.setItem('userToken', result.token); 
            localStorage.setItem('userUID', result.user.uid);
            
            // استدعاء جلب البيانات بعد النجاح (لبناء كائن currentUser)
            await fetchUserData(result.user.uid);
            loginSuccess(); 
        } else {
            showFancyToast(`❌ خطأ في تسجيل الدخول: ${result.message}`); 
        }

    } catch (error) {
        console.error("Login Error:", error);
        showFancyToast(`❌ خطأ في الاتصال بالسيرفر: ${error.message}`); 
    }
}

/**
 * جلب بيانات المستخدم من السيرفر.
 * @param {string} uid - معرّف المستخدم.
 */
// 🚨 هذه الدالة تم تعديلها لاستدعاء السيرفر الخلفي بدلاً من Firestore 🚨
async function fetchUserData(uid) {
     const token = localStorage.getItem('userToken');
     if (!token) return;

     try {
        // نستخدم GET بـ Query Parameter لإرسال الـ UID 
        const response = await fetch(`${BASE_API_URL}/user/data?uid=${uid}`, { 
             headers: { 
                 'Authorization': `Bearer ${token}` 
             }
        });
        
        const result = await response.json();

        if (result.success) {
            // تهيئة الكائن العام للمستخدم
            currentUser = { 
                id: uid, 
                ...result.data, 
                // يجب أن تكون هذه البيانات موجودة في الـ result.data
                myProducts: result.data.myProducts || [], 
                transactions: result.data.transactions || [],
                isAdmin: result.data.isAdmin || false,
                lastClaimTime: result.data.lastClaimTime || 0,
                wheelSpins: result.data.wheelSpins || 0,
                team: result.data.team || [],
            };
            
            return true;
        } else {
            console.error("Error fetching user data:", result.message);
             // في حالة فشل التوكن أو الجلب، نسجل خروج
            userLogout();
            return false;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        userLogout();
        return false;
    }
}


function loginSuccess() {
    document.getElementById('login-register-overlay').style.display = 'none';
    updateUI(); 
    showTab('settings');
}
        
function userLogout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userUID');
    currentUser = null;
    document.getElementById('login-register-overlay').style.display = 'flex';
    showFancyToast('تم تسجيل الخروج بنجاح!', 'info');
    updateUI(); // لتصفير الواجهة
} 


// ******************** 3. منطق الشراء وتحديث الأرباح (كلها تحتاج تحديث إلى API) ********************

// 🚨 جميع هذه الدوال ستحتاج إلى إرسال طلب (POST/GET) إلى السيرفر الخلفي (BASE_API_URL) 🚨

// تم ترك الدوال كما هي حالياً، لكنها سترسل رسالة "يرجى تسجيل الدخول" حتى يتم تحديثها.

async function buyProduct(productId) {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً لإتمام عملية الشراء.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/products/buy
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}

function collectAllRevenue() {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/products/collect
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}

function claimDaily() {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/bonus/claim
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}

function spinWheel() {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/bonus/spin
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}

async function changePassword() {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/user/change-password
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}

function oldSimulateDeposit() {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/transaction/deposit-request
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}

function oldSimulateWithdraw() {
    if (!currentUser) return showFancyToast('يرجى تسجيل الدخول أولاً.');
    // 🚨 استدعاء: POST ${BASE_API_URL}/transaction/withdraw-request
    showFancyToast('⚠️ هذه الدالة تحتاج للتحديث لاستدعاء سيرفرك الخاص.');
}


// ******************** 4. وظائف تحديث الواجهة (UI) ********************
        
function updateUI() {
    if (!currentUser) {
        // حالة عدم تسجيل الدخول
        document.getElementById('account-balance').textContent = formatCurrency(0);
        document.getElementById('account-name-display').textContent = 'زائر';
        document.getElementById('home-username').textContent = 'زائر';
        // إخفاء زر الإدمن
        document.getElementById('nav-admin').classList.add('hidden');
        return;
    }
    
    // حساب إجمالي الدخل
    const grandTotalRevenue = (currentUser.transactions || []).filter(t => t.isRevenue).reduce((sum, t) => sum + t.amount, 0);

    // تحديث الرصيد والأسماء 
    document.getElementById('account-balance').textContent = formatCurrency(currentUser.balance);
    document.getElementById('account-name-display').textContent = currentUser.phone || currentUser.id;
    document.getElementById('home-username').textContent = currentUser.phone || currentUser.id;
    
    // تحديث كود الإحالة
    document.getElementById('my-referral-code').value = currentUser.referralCode || 'N/A';
    document.getElementById('team-referral-code').textContent = currentUser.referralCode || 'N/A';

    // تحديث سجلات المعاملات
    updateTransactionsUI();
    
    // تحديث المنتجات الخاصة بي
    updateMyProductsUI();
    
    // تحديث الإحصائيات (الرئيسية والمتجر)
    const activeProductsCount = (currentUser.myProducts || []).length;
    const totalRevenueFromProducts = (currentUser.myProducts || []).reduce((sum, p) => sum + (p.totalRevenueCollected || 0), 0);

    document.getElementById('main-devices-count').textContent = activeProductsCount; 
    document.getElementById('main-total-revenue').textContent = formatCurrency(grandTotalRevenue);
    
    document.getElementById('shop-my-devices-count').textContent = activeProductsCount;
    document.getElementById('shop-total-revenue').textContent = formatCurrency(totalRevenueFromProducts);
    
    // تحديث حالة الحضور اليومي
    // updateDailyStatus();
    // تحديث حالة عجلة الحظ
    // updateWheelUI();
    
    // تحديث بيانات الفريق
    // updateTeamUI();
    
    // إظهار زر الإدمن
    const adminNavBtn = document.getElementById('nav-admin');
    if (currentUser.isAdmin) {
        adminNavBtn.classList.remove('hidden');
    } else {
        adminNavBtn.classList.add('hidden');
    }
}

// دالة تحديث المنتجات الخاصة بي (تحتاج إلى بيانات myProducts من السيرفر)
const oneDay = 86400000;
function updateMyProductsUI() {
    if (!currentUser) return;
    
    const listContainer = document.getElementById('my-products-list');
    const noProductsMsg = document.getElementById('no-products-message');
    let productCardsHTML = '';
    
    if ((currentUser.myProducts || []).length === 0) {
         noProductsMsg.classList.remove('hidden');
         listContainer.innerHTML = '';
         document.getElementById('total-daily-earn').textContent = formatCurrency(0);
         return;
    } else {
         noProductsMsg.classList.add('hidden');
    }
    
    // 🚨 ملاحظة: هذا الكود سيعمل فقط إذا كانت البيانات المُعادَة من السيرفر مُنظمة بنفس طريقة Firebase 🚨
    // في هذه المرحلة سنعتمد على أن السيرفر يُعيد منتجات مُحَسّبة.
    let totalDailyEarn = 0;
    const now = Date.now();

    currentUser.myProducts.forEach(prod => {
        const elapsedDays = Math.floor((now - prod.purchasedAt) / oneDay);
        const remainingDays = prod.durationDays - elapsedDays;
        
        // حساب الأرباح المتاحة
        const availableRevenueCycles = Math.floor((now - (prod.lastRevenueCollection || prod.purchasedAt)) / oneDay);
        const availableRevenue = availableRevenueCycles * prod.dailyEarning;
        
        const totalRevenue = prod.dailyEarning * prod.durationDays;
        const progressPercent = (elapsedDays / prod.durationDays) * 100;
        
        totalDailyEarn += prod.dailyEarning;

        productCardsHTML += `
            <div class="my-product-card" data-id="${prod.id}">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-xl font-black text-gray-800">${prod.name}</h4>
                    <span class="text-sm font-bold text-gray-500">الأيام المتبقية: ${Math.max(0, remainingDays)}</span>
                </div>
                <button onclick="collectRevenue(${prod.id})">جمع الأرباح</button>
            </div>
        `;
    });
    
     listContainer.innerHTML = productCardsHTML;
     document.getElementById('total-daily-earn').textContent = formatCurrency(totalDailyEarn);
}

// دالة تحديث سجلات العمليات (تحتاج إلى بيانات transactions من السيرفر)
function updateTransactionsUI() {
     const container = document.getElementById('transaction-records');
     const noRecordsMsg = document.getElementById('no-records-message');
     
     if (!currentUser || (currentUser.transactions || []).length === 0) {
         container.innerHTML = '';
         noRecordsMsg.classList.remove('hidden');
         return;
     }
     
     noRecordsMsg.classList.add('hidden');
     const lastTen = currentUser.transactions.slice().reverse().slice(0, 10);
     
     container.innerHTML = lastTen.map(t => {
         const isPositive = t.amount > 0;
         const isPending = t.type.includes('طلب');

         let amountDisplay = t.amount > 0 ? '+' : '';
         amountDisplay += formatCurrency(Math.abs(t.amount));
         
         let colorClass = isPositive ? 'text-green-600' : 'text-red-600';
         if (isPending) colorClass = 'text-yellow-600';

         let detailText = t.name ? `(${t.name})` : '';
         if (isPending) detailText = `(${t.name.includes('رقم') ? t.name : formatCurrency(Math.abs(t.amount))})`;


         return `
             <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 ${isPending ? 'border-yellow-400' : ''}">
                 <div>
                     <p class="font-bold text-sm">${t.type} <span class="text-gray-500">${detailText}</span></p>
                     <p class="text-xs text-gray-500">${t.date}</p>
                 </div>
                 <span class="font-black text-base ${colorClass}">
                    ${isPending ? 'قيد المراجعة' : amountDisplay}
                 </span>
             </div>
         `;
     }).join('');
}

// دالة بناء بطاقة المنتج
function makeProductCard(product, isHome = false) {
    const totalRevenue = product.dailyEarning * product.durationDays;
    const containerClass = isHome ? 'bg-white p-4 rounded-xl shadow-md flex items-center border border-gray-100' : 'bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100';
    const imageStyle = isHome ? 'w-24 h-24 object-cover rounded-lg ml-4 flex-shrink-0' : 'w-full h-40 object-cover';
    const buttonText = isHome ? 'شراء' : 'شراء الآن';
    const buttonClass = isHome ? 'bg-yellow-500 text-black font-bold py-2 px-4 rounded-full mt-2 hover:bg-yellow-600 transition' : 'w-full bg-yellow-500 text-black font-bold py-3 hover:bg-yellow-600 transition duration-200 text-lg';

    return `
        <div class="product-card ${containerClass}">
            ${isHome ? `<img src="${product.img}" alt="${product.name}" class="${imageStyle}">` : `<img src="${product.img}" alt="${product.name}" class="${imageStyle}">`}
            <div class="${isHome ? 'flex-grow' : 'p-4'}">
                <h3 class="text-lg font-extrabold text-gray-800 mb-1">${product.name}</h3>
                <div class="space-y-1 text-xs text-gray-600">
                    <p>السعر: <b class="text-yellow-600">${formatCurrency(product.cost)}</b></p>
                    <p>الدخل اليومي: <b class="text-green-600">${formatCurrency(product.dailyEarning)}</b></p>
                    <p>إجمالي الدخل: <b class="text-indigo-600">${formatCurrency(totalRevenue)}</b></p>
                    <p>مدة العقد: <b>${product.durationDays} يوم</b></p>
                </div>
                 <button class="${buttonClass}" onclick="buyProduct(${product.id})">
                    ${buttonText}
                </button>
            </div>
        </div>
    `;
}

// ******************** 5. التمهيد (Initialization) ********************
        
function initApp() {
    lucide.createIcons();
    
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
