import { table, currentEditingRow } from './init.js';
import { finalizeRow } from './utils.js';
import { groupByFields } from './group.js';

function addRow() {
    if (currentEditingRow.row) {
        // If there's already a temporary row, focus it
        currentEditingRow.row.getCells()[0].edit(true);
        return;
    }

    const newRow = {
        id: Date.now(), // Use a unique ID based on the current timestamp
        date: luxon.DateTime.now().toFormat("MM/dd/yyyy"),
        item: '',
        category: '',
        amount: '',
        isTemporary: true // Mark as temporary
    };

    table.addRow(newRow, true).then(row => {
        currentEditingRow.row = row;
        if (groupByFields.length > 0) {
            const groupField = groupByFields[0];
            const value = newRow[groupField];
            table.getGroups().forEach(group => {
                if (group.getKey() === value) {
                    group.show();
                }
            });
        }
        // Force edit on first cell
        setTimeout(() => {
            row.getCells()[0].edit(true);
        }, 10);
    });
}

function addAddRowEventListeners() {
    table.on("rowAdded", function(row) {
        const data = row.getData();
        if (data.isTemporary) {
            currentEditingRow.row = row;

            if (groupByFields.length > 0) {
                const groupField = groupByFields[0];
                const value = data[groupField];
                table.getGroups().forEach(group => {
                    if (group.getKey() === value) {
                        group.show();
                    }
                });
            }
            // Force edit on first cell
            setTimeout(() => {
                row.getCells()[0].edit(true);
            }, 10);
        }
    });

    document.getElementById('addRow').addEventListener("click", addRow);
    document.addEventListener("click", (e) => {
        if (currentEditingRow.row && 
            !e.target.closest(".tabulator-row") && 
            !e.target.matches("#addRow")) {
            // Cancel editing and remove temporary row
            if (currentEditingRow.row.getData().isTemporary) {
                currentEditingRow.row.delete();
            }
            currentEditingRow.row = null;
        }
    });
    document.addEventListener("keydown", (e) => {
        if(currentEditingRow.row) {
            if (e.key === "Escape") {
                if (currentEditingRow.row.getData().isTemporary) {
                    currentEditingRow.row.delete();
                }
                currentEditingRow.row = null;
            } else if (e.key === "Enter") {
                finalizeRow(currentEditingRow.row);
            }
        }
    });
}

export { addRow, addAddRowEventListeners };
