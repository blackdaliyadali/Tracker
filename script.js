// ** IMPORTANT: Replace this entire object with your Firebase project's config **
const firebaseConfig = {
    apiKey: "AIzaSyDxvV4eWqEtyCMMzQX_dd-gT4bhwxbqXUM",
  authDomain: "moneytrackerapp-8c001.firebaseapp.com",
  projectId: "moneytrackerapp-8c001",
  storageBucket: "moneytrackerapp-8c001.firebasestorage.app",
  messagingSenderId: "1087886753321",
  appId: "1:1087886753321:web:0f5c92bcdace0589776638"
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
const accountsList = document.getElementById('accounts-list');
const addAccountBtn = document.getElementById('add-account-btn');
const addAccountModal = document.getElementById('add-account-modal');
const closeButtons = document.querySelectorAll('.close-btn');
const accountNameInput = document.getElementById('account-name-input');
const accountLimitInput = document.getElementById('account-limit-input');
const accountBalanceInput = document.getElementById('account-balance-input');
const saveAccountBtn = document.getElementById('save-account-btn');
const addTransactionModal = document.getElementById('add-transaction-modal');
const transactionTitle = document.getElementById('transaction-title');
const transactionDescriptionInput = document.getElementById('transaction-description-input');
const transactionAmountInput = document.getElementById('transaction-amount-input');
const saveTransactionBtn = document.getElementById('save-transaction-btn');

let currentAccountId = null;

// --- Authentication Logic ---

auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userEmailSpan.textContent = user.email;
        fetchAccounts(user.uid);
    } else {
        // User is signed out
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
    }
});

loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => console.log('Logged in successfully'))
        .catch(error => alert(error.message));
});

registerLink.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert('Account created successfully! You can now log in.'))
        .catch(error => alert(error.message));
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- Account Management ---

addAccountBtn.addEventListener('click', () => {
    addAccountModal.style.display = 'flex';
});

closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        addAccountModal.style.display = 'none';
        addTransactionModal.style.display = 'none';
    });
});

saveAccountBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;

    const name = accountNameInput.value;
    const limit = parseFloat(accountLimitInput.value) || 0;
    const balance = parseFloat(accountBalanceInput.value) || 0;

    db.collection('users').doc(user.uid).collection('accounts').add({
        name: name,
        limit: limit,
        balance: balance,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        addAccountModal.style.display = 'none';
        alert('Account saved!');
        accountNameInput.value = '';
        accountLimitInput.value = '';
        accountBalanceInput.value = '';
    })
    .catch(error => console.error("Error saving account: ", error));
});

function fetchAccounts(userId) {
    db.collection('users').doc(userId).collection('accounts').orderBy('createdAt').onSnapshot(snapshot => {
        accountsList.innerHTML = '';
        snapshot.forEach(doc => {
            const account = doc.data();
            const accountId = doc.id;
            const card = document.createElement('div');
            card.className = 'account-card';
            card.innerHTML = `
                <h3>${account.name}</h3>
                <p>Balance: <span class="balance">${account.balance} AED</span></p>
                <p>Limit: ${account.limit} AED</p>
            `;
            card.addEventListener('click', () => {
                showTransactionModal(accountId, account.name);
            });
            accountsList.appendChild(card);
        });
    });
}

// --- Transaction Management ---

function showTransactionModal(accountId, accountName) {
    currentAccountId = accountId;
    transactionTitle.textContent = accountName;
    addTransactionModal.style.display = 'flex';
}

saveTransactionBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user || !currentAccountId) return;

    const amount = parseFloat(transactionAmountInput.value);
    const description = transactionDescriptionInput.value;

    if (isNaN(amount) || amount === 0) {
        alert('Please enter a valid amount.');
        return;
    }

    const accountRef = db.collection('users').doc(user.uid).collection('accounts').doc(currentAccountId);
    
    // Update account balance
    db.runTransaction(transaction => {
        return transaction.get(accountRef).then(doc => {
            if (!doc.exists) {
                throw "Document does not exist!";
            }
            const newBalance = doc.data().balance + amount;
            transaction.update(accountRef, { balance: newBalance });
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