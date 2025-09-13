let db;

function openDatabase(callback) {
    const request = indexedDB.open('transactionsDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('item', 'item', { unique: false });
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('amount', 'amount', { unique: false });
        objectStore.createIndex('runningTotal', 'runningTotal', { unique: false });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        callback();
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };
}

function loadTransactions(callback) {
    const transaction = db.transaction(['transactions'], 'readonly');
    const objectStore = transaction.objectStore('transactions');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const transactions = event.target.result;
        callback(transactions.reverse().sort((a, b) => new Date(b.date) - new Date(a.date)));
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };
}

function saveTransaction(transactionData) {
    const transaction = db.transaction(['transactions'], 'readwrite');
    const objectStore = transaction.objectStore('transactions');
    objectStore.put(transactionData);
}

function deleteTransaction(id) {
    const transaction = db.transaction(['transactions'], 'readwrite');
    const objectStore = transaction.objectStore('transactions');
    objectStore.delete(id);
}

export { openDatabase, loadTransactions, saveTransaction, deleteTransaction };
