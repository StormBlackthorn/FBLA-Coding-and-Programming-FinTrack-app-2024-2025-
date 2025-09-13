import { openDatabase, loadTransactions } from './table/db.js';

let db;
openDatabase(() => {
    loadTransactions((transactions) => {
        const totalBalance = transactions.reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0);
        const totalBalanceElement = document.getElementById('total-balance');
        totalBalanceElement.innerText = `$${totalBalance.toFixed(2)}`;
        totalBalanceElement.className = totalBalance >= 0 ? 'positive' : 'negative';

        const dailyData = {};
        transactions.forEach(transaction => {
            const date = transaction.date;
            if (!dailyData[date]) {
                dailyData[date] = { income: 0, expenses: 0, runningTotal: 0 };
            }
            const amount = parseFloat(transaction.amount);
            if (amount > 0) {
                dailyData[date].income += amount;
            } else {
                dailyData[date].expenses += Math.abs(amount);
            }
            dailyData[date].runningTotal += amount;
        });

        const dates = Object.keys(dailyData).sort(); // Sort dates from smallest to greatest
        const incomeData = dates.map(date => dailyData[date].income);
        const expensesData = dates.map(date => dailyData[date].expenses);
        const runningTotalData = dates.map(date => dailyData[date].runningTotal);

        const lineChartCtx = document.getElementById('line-chart').getContext('2d');
        const lineChart = new Chart(lineChartCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    { label: 'Income', data: incomeData, borderColor: 'green', fill: false },
                    { label: 'Expenses', data: expensesData, borderColor: 'red', fill: false },
                    { label: 'Running Total', data: runningTotalData, borderColor: 'blue', fill: false }
                ]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                },
                scales: {
                    y: {
                        ticks: {
                            color: function(context) {
                                return context.tick.value >= 0 ? 'green' : 'red';
                            }
                        }
                    }
                }
            }
        });

        document.querySelectorAll('#line-chart-buttons button').forEach(button => {
            button.addEventListener('click', () => {
                const dataset = lineChart.data.datasets.find(ds => ds.label.toLowerCase() === button.dataset.line);
                dataset.hidden = !dataset.hidden;
                lineChart.update();
            });
        });

        const categoryData = {};
        const incomeCategoryData = {};
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            const category = transaction.category;
            if (amount < 0) {
                if (!categoryData[category]) {
                    categoryData[category] = 0;
                }
                categoryData[category] += Math.abs(amount);
            } else {
                if (!incomeCategoryData[category]) {
                    incomeCategoryData[category] = 0;
                }
                incomeCategoryData[category] += amount;
            }
        });

        const categories = Object.keys(categoryData);
        const categoryAmounts = categories.map(category => categoryData[category]);

        const pieChartCtx = document.getElementById('pie-chart').getContext('2d');
        new Chart(pieChartCtx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryAmounts,
                    backgroundColor: categories.map((_, i) => `hsl(${i * 360 / categories.length}, 70%, 50%)`)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const value = context.raw;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        const incomeCategories = Object.keys(incomeCategoryData);
        const incomeCategoryAmounts = incomeCategories.map(category => incomeCategoryData[category]);

        const incomePieChartCtx = document.getElementById('income-pie-chart').getContext('2d');
        new Chart(incomePieChartCtx, {
            type: 'pie',
            data: {
                labels: incomeCategories,
                datasets: [{
                    data: incomeCategoryAmounts,
                    backgroundColor: incomeCategories.map((_, i) => `hsl(${i * 360 / incomeCategories.length}, 70%, 50%)`)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const value = context.raw;
                                const percentage = ((value / total) * 100).toFixed(2);
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    });
});
