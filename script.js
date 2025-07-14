// ** IMPORTANT: Replace this entire object with your Firebase project's config **
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const registerLink = document.getElementById('register-link');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const monthListContainer = document.getElementById('month-list-container');
const monthList = document.getElementById('month-list');
const accountsSection = document.getElementById('accounts-section');
const backToMonthsBtn = document.getElementById('back-to-months-btn');
const accountsList = document.getElementById('accounts-list');
const addAccountBtn = document.getElementById('add-account-btn');
const addAccountModal = document.getElementById('add-account-modal');
const closeButtons = document.querySelectorAll('.close-btn');
const accountNameInput = document.getElementById('account-name-input');
const accountBalanceInput = document.getElementById('account-balance-input');
const saveAccountBtn = document.getElementById('save-account-btn');
const transactionSection = document.getElementById('transaction-section');
const backToAccountsBtn = document.getElementById('back-to-accounts-btn');
const transactionTitle = document.getElementById('transactions-title');
const transactionTbody = document.getElementById('transaction-tbody');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const addTransactionModal = document.getElementById('add-transaction-modal');
const transactionModalTitle = document.getElementById('transaction-modal-title');
const transactionDescriptionInput = document.getElementById('transaction-description-input');
const transactionAmountInput = document.getElementById('transaction-amount-input');
const saveTransactionBtn = document.getElementById('save-transaction-btn');

let currentAccountId = null;
let currentMonth = null;
let currentYear = null;

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// --- Authentication Logic ---

auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userEmailSpan.textContent = user.email;
        fetchMonths(user.uid);
    } else {
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => alert(error.message));
});

registerLink.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert('Account created! Log in now.'))
        .catch(error => alert(error.message));
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- Main Navigation ---

function showMonths() {
    monthListContainer.style.display = 'block';
    accountsSection.style.display = 'none';
    transactionSection.style.display = 'none';
    fetchMonths(auth.currentUser.uid);
}

function showAccounts() {
    monthListContainer.style.display = 'none';
    accountsSection.style.display = 'block';
    transactionSection.style.display = 'none';
    fetchAccounts(auth.currentUser.uid);
}

function showTransactions(accountId, accountName) {
    transactionTitle.textContent = `${accountName} - ${monthNames[currentMonth]} ${currentYear}`;
    monthListContainer.style.display = 'none';
    accountsSection.style.display = 'none';
    transactionSection.style.display = 'block';
    currentAccountId = accountId;
    fetchTransactions(auth.currentUser.uid, accountId, currentMonth, currentYear);
}

backToMonthsBtn.addEventListener('click', showMonths);
backToAccountsBtn.addEventListener('click', showAccounts);

// --- Fetching Data from Firebase ---

function fetchMonths(userId) {
    db.collection('users').doc(userId).collection('accounts').get().then(snapshot => {
        const months = new Set();
        snapshot.forEach(doc => {
            db.collection('users').doc(userId).collection('accounts').doc(doc.id).collection('transactions').get().then(transSnapshot => {
                transSnapshot.forEach(transDoc => {
                    const transDate = transDoc.data().date.toDate();
                    const monthKey = `${transDate.getMonth()}-${transDate.getFullYear()}`;
                    months.add(monthKey);
                });
                renderMonths(Array.from(months));
            });
        });
    });
}

function renderMonths(monthsArray) {
    monthList.innerHTML = '';
    const uniqueMonths = new Set();
    monthsArray.sort((a,b) => {
        const [monthA, yearA] = a.split('-').map(Number);
        const [monthB, yearB] = b.split('-').map(Number);
        return new Date(yearA, monthA) - new Date(yearB, monthB);
    });

    monthsArray.forEach(monthKey => {
        if (!uniqueMonths.has(monthKey)) {
            const [month, year] = monthKey.split('-');
            const button = document.createElement('button');
            button.className = 'month-btn';
            button.textContent = `${monthNames[parseInt(month)]} ${year}`;
            button.addEventListener('click', () => {
                currentMonth = parseInt(month);
                currentYear = parseInt(year);
                showAccounts();
            });
            monthList.appendChild(button);
            uniqueMonths.add(monthKey);
        }
    });

    // Add button for the current month if no data exists
    const today = new Date();
    const currentMonthKey = `${today.getMonth()}-${today.getFullYear()}`;
    if (!uniqueMonths.has(currentMonthKey)) {
        const button = document.createElement('button');
        button.className = 'month-btn';
        button.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
        button.addEventListener('click', () => {
            currentMonth = today.getMonth();
            currentYear = today.getFullYear();
            showAccounts();
        });
        monthList.appendChild(button);
    }
}

function fetchAccounts(userId) {
    accountsList.innerHTML = '';
    db.collection('users').doc(userId).collection('accounts').get().then(snapshot => {
        snapshot.forEach(doc => {
            const account = doc.data();
            const accountId = doc.id;
            const card = document.createElement('div');
            card.className = 'account-card';
            card.innerHTML = `
                <h3>${account.name}</h3>
                <p>Current Balance: <span class="balance">${account.balance} AED</span></p>
            `;
            card.addEventListener('click', () => {
                showTransactions(accountId, account.name);
            });
            accountsList.appendChild(card);
        });
    });
}

function fetchTransactions(userId, accountId, month, year) {
    transactionTbody.innerHTML = '';
    db.collection('users').doc(userId).collection('accounts').doc(accountId).collection('transactions')
        .where('month', '==', month)
        .where('year', '==', year)
        .orderBy('date', 'desc')
        .onSnapshot(snapshot => {
            transactionTbody.innerHTML = '';
            snapshot.forEach(doc => {
                const trans = doc.data();
                const amountClass = trans.amount < 0 ? 'expense' : 'income';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${trans.date.toDate().toLocaleDateString()}</td>
                    <td>${trans.description}</td>
                    <td class="${amountClass}">${trans.amount > 0 ? '+' : ''}${trans.amount} AED</td>
                `;
                transactionTbody.appendChild(row);
            });
        });
}

// --- Modals and Buttons ---

addAccountBtn.addEventListener('click', () => {
    addAccountModal.style.display = 'flex';
});

saveAccountBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;

    const name = accountNameInput.value;
    const balance = parseFloat(accountBalanceInput.value) || 0;

    db.collection('users').doc(user.uid).collection('accounts').add({
        name: name,
        balance: balance,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        addAccountModal.style.display = 'none';
        alert('Account saved!');
        accountNameInput.value = '';
        accountBalanceInput.value = '';
        fetchAccounts(user.uid);
    })
    .catch(error => console.error("Error saving account: ", error));
});

addTransactionBtn.addEventListener('click', () => {
    addTransactionModal.style.display = 'flex';
    if (currentAccountId) {
        // You can add logic to populate the modal if needed
    }
});

saveTransactionBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user || !currentAccountId) return;

    const amount = parseFloat(transactionAmountInput.value);
    const description = transactionDescriptionInput.value;
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    if (isNaN(amount) || amount === 0) {
        alert('Please enter a valid amount.');
        return;
    }

    const accountRef = db.collection('users').doc(user.uid).collection('accounts').doc(currentAccountId);

    db.runTransaction(transaction => {
        return transaction.get(accountRef).then(doc => {
            if (!doc.exists) throw "Account does not exist!";
            const newBalance = doc.data().balance + amount;
            transaction.update(accountRef, { balance: newBalance });
            transaction.set(accountRef.collection('transactions').doc(), {
                description,
                amount,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                month,
                year
            });
        });
    }).then(() => {
        addTransactionModal.style.display = 'none';
        transactionDescriptionInput.value = '';
        transactionAmountInput.value = '';
        alert('Transaction added!');
    }).catch(error => {
        console.error("Transaction failed: ", error);
        alert('Transaction failed. Please try again.');
    });
});

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        addAccountModal.style.display = 'none';
        addTransactionModal.style.display = 'none';
    });
});
