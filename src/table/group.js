import { showTooltip, hideTooltip } from './utils.js';
import { table } from './init.js';

let currentSuggestionIndex = -1;
let groupByFields = [];
const groupByInput = document.getElementById('group-by-input');
const validColumns = ["date", "item", "category", "amount", "date range"];

function handleGroupSelection(suggestion) {
    if (groupByFields.length >= 5) {
        groupByInput.classList.add('shake', 'invalid');
        showTooltip(groupByInput, 'You can only group by up to 5 fields');
        setTimeout(() => {
            groupByInput.classList.remove('shake');
        }, 500);
        groupByInput.focus();
        return false;
    }

    // Check if this field is already in the grouping
    if (groupByFields.includes(suggestion)) {
        groupByInput.classList.add('shake', 'invalid');
        showTooltip(groupByInput, 'This field is already being used for grouping');
        setTimeout(() => {
            groupByInput.classList.remove('shake');
        }, 500);
        groupByInput.focus();
        return false;
    }

    // Check if it's the same date range and already included in the grouping
    if (suggestion.startsWith('date range(') && groupByFields.some(field => field === suggestion)) {
        groupByInput.classList.add('shake', 'invalid');
        showTooltip(groupByInput, 'Cannot apply the same date range grouping'); //currently does not work as hide modal hides all tooltip.
        setTimeout(() => { 
            groupByInput.classList.remove('shake');
        }, 500);
        groupByInput.focus();
        return false;
    }

    return true;
}

function showSuggestions(suggestions) {
    const suggestionBox = document.getElementById('suggestion-box');
    suggestionBox.innerHTML = '';
    suggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerText = suggestion;
        suggestionItem.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent the blur event from hiding the suggestion box
        });
        suggestionItem.addEventListener('click', function() {

            if (handleGroupSelection(suggestion)) {
                if (suggestion === 'date range') {
                    showModal();
                } else {
                    groupByFields.push(suggestion);
                    updateGroupByFields();
                }
                groupByInput.value = '';
                hideSuggestions();
                groupByInput.blur(); // Focus out
            }
        });
        suggestionBox.appendChild(suggestionItem);
    });
    suggestionBox.style.display = 'block';
    currentSuggestionIndex = -1;
}

function hideSuggestions() {
    const suggestionBox = document.getElementById('suggestion-box');
    suggestionBox.style.display = 'none';
}

function updateSuggestionHighlight(suggestionItems) {
    suggestionItems.forEach((item, index) => {
        if (index === currentSuggestionIndex) {
            item.classList.add('highlight');
        } else {
            item.classList.remove('highlight');
        }
    });
}

function updateGroupByFields() {
    const groupByContainer = document.querySelector('.group-by-container');
    groupByContainer.innerHTML = '';
    groupByFields.forEach((field, index) => {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'group-by-field';
        fieldElement.innerText = field;
        const removeButton = document.createElement('span');
        removeButton.className = 'remove-group-by';
        removeButton.innerText = 'x';
        removeButton.addEventListener('click', function() {
            groupByFields = groupByFields.filter(f => f !== field);
            updateGroupByFields();
        });
        fieldElement.appendChild(removeButton);
        groupByContainer.appendChild(fieldElement);
        if (index < groupByFields.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'group-by-arrow';
            arrow.innerText = '>';
            groupByContainer.appendChild(arrow);
        }
    });

    // Apply grouping to table
    applyGrouping();
}

function applyGrouping() {
    if (groupByFields.length === 0) {
        table.setGroupBy(false);
        return;
    }

    const groupFunctions = groupByFields.map(field => {
        if (field.startsWith('date range(')) {
            const match = field.match(/date range\((\d+) (\w+)\)/);
            if (match) {
                const [_, value, unit] = match;
                return function(data) {
                    const date = luxon.DateTime.fromFormat(data.date, "MM/dd/yyyy");
                    if (!date.isValid) return "Invalid Date";

                    // Calculate the range start based on the unit
                    let rangeStart;
                    switch(unit) {
                        case 'days':
                            rangeStart = date.startOf('day');
                            rangeStart = rangeStart.minus({ days: date.day % value });
                            break;
                        case 'weeks':
                            rangeStart = date.startOf('week');
                            rangeStart = rangeStart.minus({ weeks: date.weekNumber % value });
                            break;
                        case 'months':
                            rangeStart = date.startOf('month');
                            rangeStart = rangeStart.minus({ months: (date.month - 1) % value });
                            break;
                        case 'years':
                            rangeStart = date.startOf('year');
                            rangeStart = rangeStart.minus({ years: (date.year) % value });
                            break;
                        default:
                            return "Invalid Unit";
                    }

                    // Calculate range end
                    const rangeEnd = rangeStart.plus({ [unit]: value }).minus({ days: 1 });
                    
                    return `${rangeStart.toFormat('MM/dd/yyyy')} ~ ${rangeEnd.toFormat('MM/dd/yyyy')}`;
                };
            }
        }
        return field;
    });

    table.setGroupBy(groupFunctions);

}

const modal = document.getElementById('dateRangeModal');
const applyBtn = document.getElementById('applyDateRange');
const cancelBtn = document.getElementById('cancelDateRange');
const rangeValueInput = document.getElementById('rangeValue');
const rangeUnitSelect = document.getElementById('rangeUnit');

function showModal() {
    modal.style.display = 'block';
    rangeValueInput.focus();
}

function hideModal() {
    modal.style.display = 'none';
    hideTooltip();
    // Reset modal inputs
    rangeValueInput.value = '';
    rangeUnitSelect.value = '';
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function applyDateRange() {
    const value = document.getElementById('rangeValue').value;
    const unit = document.getElementById('rangeUnit').value;
    
    if (!value || value < 1 || !Number.isInteger(Number(value)) || !unit) {
        if (!unit) {
            rangeUnitSelect.classList.add('shake', 'invalid');
            showTooltip(rangeUnitSelect, 'Please select a date unit');
            setTimeout(() => {
                rangeUnitSelect.classList.remove('shake');
            }, 500);
            return;
        }
        // ...existing validation code...
        return;
    }

    const newDateRange = `date range(${value} ${unit})`;
    if (handleGroupSelection(newDateRange)) {
        groupByFields.push(newDateRange);
        updateGroupByFields();
    }
    hideModal();
}

function addGroupEventListeners() {
    groupByInput.addEventListener('focus', function() {
        showSuggestions(validColumns);
    });

    groupByInput.addEventListener('input', function() {
        const value = groupByInput.value.toLowerCase();
        const suggestions = validColumns.filter(col => col.startsWith(value));
        showSuggestions(suggestions);
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        if (suggestionItems.length > 0) {
            currentSuggestionIndex = 0;
            updateSuggestionHighlight(suggestionItems);
        }
    });

    groupByInput.addEventListener('keydown', function(e) {
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        if (e.key === 'Enter') {
            if (currentSuggestionIndex >= 0 && currentSuggestionIndex < suggestionItems.length) {
                if(groupByFields.length >= 5) {
                    groupByInput.classList.add('shake', 'invalid');
                    showTooltip(groupByInput, 'You can only group by up to 5 fields');
                    setTimeout(() => {
                        groupByInput.classList.remove('shake');
                    }, 500);
                    groupByInput.focus();
                    return;
                }
                const suggestion = suggestionItems[currentSuggestionIndex].innerText;
                groupByInput.value = suggestion;
                groupByFields.push(suggestion);
                updateGroupByFields();
                groupByInput.value = '';
                hideSuggestions();
                groupByInput.blur(); // Focus out
            } else {
                const value = groupByInput.value.toLowerCase();
                if (validColumns.includes(value) && !groupByFields.includes(value)) {
                    groupByFields.push(value);
                    updateGroupByFields();
                    groupByInput.value = '';
                    hideSuggestions();
                } else {
                    groupByInput.classList.add('shake', 'invalid');
                    showTooltip(groupByInput, 'Please select a valid column to group by');
                    setTimeout(() => {
                        groupByInput.classList.remove('shake');
                    }, 500);
                    groupByInput.focus();
                }
            }
        } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
            e.preventDefault();
            currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestionItems.length;
            updateSuggestionHighlight(suggestionItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentSuggestionIndex = (currentSuggestionIndex - 1 + suggestionItems.length) % suggestionItems.length;
            updateSuggestionHighlight(suggestionItems);
        }
    });

    groupByInput.addEventListener('blur', function() {
        hideSuggestions();
        hideTooltip();
        groupByInput.classList.remove('invalid');
    });

    
    // Add keyboard support for modal
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            applyDateRange();
        } else if (e.key === 'Escape') {
            hideModal();
        }
    });

    // Add input validation
    rangeValueInput.addEventListener('input', function() {
        const maxValues = {
            'days': 365,   
            'weeks': 52,    
            'months': 12,   
            'years': 10 
        };
        
        const value = parseInt(this.value);
        const maxValue = maxValues[rangeUnitSelect.value];
        
        if (value > maxValue) {
            this.value = maxValue;
        }
    });

    // Add modal event listeners
    applyBtn.addEventListener('click', applyDateRange);
    cancelBtn.addEventListener('click', hideModal);
    window.addEventListener('mousedown', (e) => {
        if (e.target === modal) hideModal();
    });
}

export { updateGroupByFields, addGroupEventListeners, groupByFields };
