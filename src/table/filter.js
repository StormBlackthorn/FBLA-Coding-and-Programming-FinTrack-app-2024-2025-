import { table } from './init.js';
import { showTooltip, hideTooltip } from './utils.js';

let activeFilters = new Map(); // Map to store filters by column

function updateFilterBoxes(column, filterInfo) {
    const filterContainer = document.getElementById(`filter-${column}`);
    filterContainer.innerHTML = '';
    
    if (!activeFilters.has(column)) return;
    
    const filterElement = document.createElement('div');
    filterElement.className = 'filter-box';
    filterElement.style.maxWidth = `${filterContainer.offsetWidth}px`; // Set max width to the width of the header column container
    
    switch (column) {
        case 'date':
            filterElement.innerText = `${filterInfo.filterType}: ${filterInfo.filterDate1.toFormat("MM/dd/yyyy")}`;
            if (filterInfo.filterDate2) filterElement.innerText += ` ~ ${filterInfo.filterDate2.toFormat("MM/dd/yyyy")}`;
            break;
        case 'amount':
            filterElement.innerText = `${filterInfo.filterType} ${filterInfo.amountValue1}`;
            if (filterInfo.filterType === 'range') filterElement.innerText += ` ~ ${filterInfo.amountValue2}`;
            break;
        case 'item':
        case 'category':
            filterElement.innerText = filterInfo.selectedValues.join(', ');
            break;
    }
    
    const removeButton = document.createElement('span');
    removeButton.className = 'remove-filter';
    removeButton.innerText = 'x';
    removeButton.addEventListener('click', () => {
        activeFilters.delete(column);
        updateFilterBoxes(column);
        applyAllFilters();
    });
    
    filterElement.appendChild(removeButton);
    filterContainer.appendChild(filterElement);
}

function applyAllFilters() {
    table.clearFilter();
    
    activeFilters.forEach((filterInfo, column) => {
        switch (column) {
            case 'date':
                table.addFilter(data => {
                    const rowDate = luxon.DateTime.fromFormat(data.date, "MM/dd/yyyy");
                    if (filterInfo.filterType === 'before') {
                        return rowDate < filterInfo.filterDate1;
                    } else if (filterInfo.filterType === 'after') {
                        return rowDate > filterInfo.filterDate1;
                    } else if (filterInfo.filterType === 'during') {
                        if (filterInfo.filterDate2) return rowDate >= filterInfo.filterDate1 && rowDate <= filterInfo.filterDate2;
                         else return rowDate.hasSame(filterInfo.filterDate1, 'day');
                    }
                    return true;
                });
                break;
            case 'amount':
                table.addFilter(data => {
                    const amount = parseFloat(data.amount);
                    if (filterInfo.filterType === 'range') return amount >= filterInfo.amountValue1 && amount <= filterInfo.amountValue2;
                    else {
                        const operators = {
                            '>': (a, b) => a > b,
                            '>=': (a, b) => a >= b,
                            '<': (a, b) => a < b,
                            '<=': (a, b) => a <= b,
                            '==': (a, b) => a === b,
                            '!=': (a, b) => a !== b
                        };
                        return operators[filterInfo.filterType](amount, filterInfo.amountValue1);
                    }
                });
            break;
            case "category":
            case "item":
                table.addFilter(column, "in", filterInfo.selectedValues);
                break;
        }
    });
}

function showFilterModal(column) {
    const modal = document.getElementById('filterModal');
    const modalContent = document.querySelector('.filter-modal-content');

    switch (column) {
        case 'date':
            modalContent.innerHTML = `
                <h2>Filter by Date</h2>
                <div class="modal-input-group row">
                    <select id="dateFilterType" required>
                        <option value="">Please select a value</option>
                        <option value="before">Before</option>
                        <option value="after">After</option>
                        <option value="during">During</option>
                    </select>
                    <input type="date" id="dateFilterValue1" required>
                    <input type="date" id="dateFilterValue2" style="display: none;">
                </div>
                <div class="modal-buttons">
                    <button id="applyDateFilter">Apply</button>
                    <button id="cancelFilter" class="cancel">Cancel</button>
                </div>
            `;

            const dateFilterType = document.getElementById('dateFilterType');
            const dateFilterValue2 = document.getElementById('dateFilterValue2');
            dateFilterType.addEventListener('change', () => {
                dateFilterValue2.style.display = dateFilterType.value === 'during' ? 'block' : 'none';
                document.querySelector('.modal-input-group').classList.toggle('range', dateFilterType.value === 'during');
            });

            modalContent.querySelector(`#applyDateFilter`).addEventListener('click', applyFilters);
            break;
        case 'item':
        case 'category':
            const uniqueValues = [...new Set(table.getData().map(row => row[column]))];
            modalContent.innerHTML = `
                <h2>Filter by ${column.charAt(0).toUpperCase() + column.slice(1)}</h2>
                <div class="modal-input-group row">
                    <div id="selectAllContainer">
                        <input type="checkbox" id="selectAll">
                        <label for="selectAll">Select all</label>
                    </div>
                    <input type="text" id="filterSearch" placeholder="Search...">
                </div>
                <div id="filterOptions">
                    ${uniqueValues.map(value => `
                        <div>
                            <input type="checkbox" value="${value}"> ${value}
                        </div>
                    `).join('')}
                </div>
                <div class="modal-buttons">
                    <button id="applyTextFilter">Apply</button>
                    <button id="cancelFilter" class="cancel">Cancel</button>
                </div>
            `;

            const filterSearch = document.getElementById('filterSearch');
            filterSearch.addEventListener('input', () => {
                const options = document.querySelectorAll('#filterOptions div');
                options.forEach(option => {
                    option.style.display = option.textContent.toLowerCase().trim().startsWith(filterSearch.value.toLowerCase()) ? 'block' : 'none';
                });
            });

            const selectAll = document.getElementById('selectAll');
            selectAll.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('#filterOptions input[type="checkbox"]');
                checkboxes.forEach(checkbox => checkbox.checked = selectAll.checked);
            });

            modalContent.querySelector(`#applyTextFilter`).addEventListener('click', applyFilters);
            break;
        case 'amount':
            modalContent.innerHTML = `
                <h2>Filter by Amount</h2>
                <div class="modal-input-group row">
                    <select id="amountFilterType" required>
                        <option value="">Please select a value</option>
                        <option value=">">></option>
                        <option value=">=">>=</option>
                        <option value="<"><</option>
                        <option value="<="><=</option>
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value="range">a <= x <= b</option>
                    </select>
                    <input type="number" id="amountFilterValue1" required>
                    <input type="number" id="amountFilterValue2" style="display: none;">
                </div>
                <div class="modal-buttons">
                    <button id="applyAmountFilter">Apply</button>
                    <button id="cancelFilter" class="cancel">Cancel</button>
                </div>
            `;

            const amountFilterType = document.getElementById('amountFilterType');
            const amountFilterValue2 = document.getElementById('amountFilterValue2');
            amountFilterType.addEventListener('change', () => {
                amountFilterValue2.style.display = amountFilterType.value === 'range' ? 'block' : 'none';
                document.querySelector('.modal-input-group').classList.toggle('range', amountFilterType.value === 'range');
            });

            modalContent.querySelector(`#applyAmountFilter`).addEventListener('click', applyFilters);
            break;
    }

    modal.style.display = 'block';
    modalContent.querySelector('#cancelFilter')?.addEventListener('click', hideFilterModal);
}

function hideFilterModal() {
    const modal = document.getElementById('filterModal');
    const modalContent = document.querySelector('.filter-modal-content');
    modalContent.innerHTML = ''; // Clear the modal content
    modal.style.display = 'none';
    const inputs = modal.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'text' || input.type === 'number' || input.type === 'date') {
            input.value = '';
        } else if (input.type === 'select-one') {
            input.selectedIndex = 0;
        }
    });
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    hideTooltip();
}

function applyFilters() {
    const modalContent = document.querySelector('.filter-modal-content');
    const column = modalContent.querySelector('h2').innerText.split(' ')[2].toLowerCase();

    switch (column) {
        case 'date': {
            const filterType = document.getElementById('dateFilterType').value;
            const dateValue1 = document.getElementById('dateFilterValue1').value;
            const dateValue2 = document.getElementById('dateFilterValue2').value;

            if (!filterType) {
                const filterTypeElement = document.getElementById('dateFilterType');
                filterTypeElement.classList.add('shake', 'invalid');
                showTooltip(filterTypeElement, 'This is a required field');
                setTimeout(() => {
                    filterTypeElement.classList.remove('shake');
                }, 500);
                filterTypeElement.focus();
                return;
            }

            if (!dateValue1) {
                const dateValue1Element = document.getElementById('dateFilterValue1');
                dateValue1Element.classList.add('shake', 'invalid');
                showTooltip(dateValue1Element, 'This is a required field');
                setTimeout(() => {
                    dateValue1Element.classList.remove('shake');
                }, 500);
                dateValue1Element.focus();
                return;
            }

            const filterDate1 = luxon.DateTime.fromFormat(dateValue1, "yyyy-MM-dd");
            const filterDate2 = dateValue2 ? luxon.DateTime.fromFormat(dateValue2, "yyyy-MM-dd") : null;

            activeFilters.set(column, {
                filterType,
                filterDate1,
                filterDate2: filterDate2 || null
            });

            break;
        }
        case 'item':
        case 'category': 
            activeFilters.set(column, {
                selectedValues: Array.from(document.querySelectorAll('#filterOptions input:checked')).map(input => input.value)
            });

            break;
        case 'amount': {
            const filterType = document.getElementById('amountFilterType').value;
            const amountValue1 = parseFloat(document.getElementById('amountFilterValue1').value);
            const amountValue2 = parseFloat(document.getElementById('amountFilterValue2').value);
    
            if (!filterType) {
                const filterTypeElement = document.getElementById('amountFilterType');
                filterTypeElement.classList.add('shake', 'invalid');
                showTooltip(filterTypeElement, 'This is a required field');
                setTimeout(() => {
                    filterTypeElement.classList.remove('shake');
                }, 500);
                filterTypeElement.focus();
                return;
            }

            if (isNaN(amountValue1)) {
                const amountValue1Element = document.getElementById('amountFilterValue1');
                amountValue1Element.classList.add('shake', 'invalid');
                showTooltip(amountValue1Element, 'This is a required field');
                setTimeout(() => {
                    amountValue1Element.classList.remove('shake');
                }, 500);
                amountValue1Element.focus();
                return;
            }
    
            if (filterType === 'range' && isNaN(amountValue2)) {
                const amountValue2Element = document.getElementById('amountFilterValue2');
                amountValue2Element.classList.add('shake', 'invalid');
                showTooltip(amountValue2Element, 'This is a required field');
                setTimeout(() => {
                    amountValue2Element.classList.remove('shake');
                }, 500);
                amountValue2Element.focus();
                return;
            }
    
            activeFilters.set(column, {
                filterType,
                amountValue1,
                amountValue2: filterType === 'range' ? amountValue2 : null
            });
            
            break;
        }
    }

    updateFilterBoxes(column, activeFilters.get(column));
    applyAllFilters();
    hideFilterModal();
}

export { showFilterModal, hideFilterModal, applyFilters };
