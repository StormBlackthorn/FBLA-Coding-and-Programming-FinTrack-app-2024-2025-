import { addAddRowEventListeners } from './addRow.js';
import { addGroupEventListeners, groupByFields } from './group.js';
import { currentEditingRow, table } from './init.js';
import { saveTransaction } from './db.js';

function showTooltip(element, message) {
    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
    }
    tooltip.innerText = message;
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.display = 'block';
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function updateRunningTotal() {
    const allData = table.getData();
    allData.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date in descending order
    let runningTotal = 0;
    for (let i = allData.length - 1; i >= 0; i--) {
        runningTotal += parseFloat(allData[i].amount) || 0;
        table.updateRow(allData[i].id, { runningTotal: runningTotal.toFixed(2) });
        saveTransaction(allData[i]);
    }
}

function finalizeRow(row) {
    if (!row) return false;
    
    const data = row.getData();
    const isValid = data.date && data.item && data.category && 
                   data.amount && !isNaN(parseFloat(data.amount));
    
    if (!isValid) {
        const cells = row.getCells();
        const firstEmptyCell = cells.slice(0, -1).find(cell => !cell.getValue());
        const lastCell = cells.indexOf(firstEmptyCell) === 0 ? null : cells[cells.indexOf(firstEmptyCell)-1];
        if (firstEmptyCell) {
            firstEmptyCell.edit(true);
            firstEmptyCell.getElement().classList.add("shake", "invalid");
            setTimeout(() => {
                firstEmptyCell?.getElement()?.classList?.remove("shake");
            }, 500);
            if (lastCell && lastCell.getElement().classList.contains("invalid")) {
                lastCell.getElement().classList.remove("invalid");
            }
        }

        return false;
    }

    // Close the group if the row was temporary
    if (data.isTemporary && groupByFields.length > 0) {
        const groupField = groupByFields[0];
        const value = data[groupField];
        table.getGroups().forEach(group => {
            if (group.getKey() === value) {
                group.hide();
            }
        });
    }

    row.getCells().forEach(cell => cell.getElement().classList.remove("invalid"));
    // Remove temporary flag and update transactions
    delete data.isTemporary;
    saveTransaction(data);
    currentEditingRow.row = null;
    
    return true;
}

function addAllEventListeners() {
    addAddRowEventListeners();
    addGroupEventListeners();
}

export { showTooltip, hideTooltip, updateRunningTotal, finalizeRow, addAllEventListeners };
