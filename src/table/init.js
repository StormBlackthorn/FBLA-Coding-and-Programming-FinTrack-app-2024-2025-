import { showTooltip, hideTooltip, updateRunningTotal, finalizeRow, addAllEventListeners } from './utils.js';
import { openDatabase, loadTransactions, deleteTransaction } from './db.js';
import { showFilterModal } from './filter.js';
import { addSearchEventListeners } from './search.js';

let currentEditingRow = { //so ES6 doesn't make it immutable
    row: null,
};
let table;

document.addEventListener('DOMContentLoaded', function() {

    // Custom date editor
    var dateEditor = function(cell, onRendered, success, cancel) {
        // Create and style input
        var cellValue = cell.getValue() ? luxon.DateTime.fromFormat(cell.getValue(), "MM/dd/yyyy").toFormat("yyyy-MM-dd") : "",
            input = document.createElement("input");

        input.setAttribute("type", "date");
        input.style.width = "100%";
        input.style.boxSizing = "border-box";
        input.value = cellValue;

        onRendered(function() {
            input.focus();
            input.style.height = "100%";
        });

        function onChange() {
            if (input.value) {
                const date = luxon.DateTime.fromFormat(input.value, "yyyy-MM-dd");
                if (date.isValid) {
                    input.classList.remove("invalid");
                    hideTooltip();
                    success(luxon.DateTime.fromFormat(input.value, "yyyy-MM-dd").toFormat("MM/dd/yyyy"));
                } else {
                    input.classList.add("shake", "invalid");
                    showTooltip(input, "Invalid date format");
                    setTimeout(() => {
                        input.classList.remove("shake");
                    }, 500);
                }
            } else {
                cancel();
            }
        }

        // Submit new value on blur or change
        input.addEventListener("blur", onChange);

        // Submit new value on enter
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                onChange();
            }

            if (e.key === "Escape") {
                cancel();
            }
        });

        return input;
    };

    // Initialize Tabulator
    openDatabase(() => {
        loadTransactions((transactions) => {
            table = new Tabulator("#transactions-table", {
                data: transactions, //sort by date
                layout: "fitColumns",
                history: true,
                initialSort: [
                    { column: "date", dir: "desc" }
                ],
                groupStartOpen: false,
                groupToggleElement: "header",
                headerSortClickElement:"icon",
                groupHeader: function(value, count, data, group) {
                    return `<div style="height: 40px; display: flex; align-items: center;">${value} (${count} items)</div>`;
                },
                columns: [
                    {
                        title: "Date",
                        field: "date",
                        editor: dateEditor,
                        validator: ["required"],
                        formatter: function(cell) {
                            const value = cell.getValue();
                            if (!value) return '';
                            return value;
                        },
                        sorter: "date",
                        sorterParams: { format: "MM/dd/yyyy" },
                    },
                    {
                        title: "Item",
                        field: "item",
                        editor: "input",
                        validator: ["required"],
                        editorParams: {
                            elementAttributes: {
                                required: "required"
                            }
                        },
                        sorter: "string",
                    },
                    {
                        title: "Category",
                        field: "category",
                        editor: "input",
                        validator: ["required"],
                        editorParams: {
                            elementAttributes: {
                                required: "required"
                            }
                        },
                        sorter: "string",
                    },
                    {
                        title: "Amount",
                        field: "amount",
                        editor: "number",
                        validator: ["required", "numeric"],
                        editorParams: {
                            elementAttributes: {
                                required: "required",
                                step: "0.01"
                            }
                        },
                        formatter: function(cell) {
                            const value = parseFloat(cell.getValue());
                            const formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
                            return `<span style="color: ${value < 0 ? 'red' : 'green'};">${formattedValue}</span>`;
                        },
                        sorter: "number",
                    },
                    {
                        title: "Running Total",
                        field: "runningTotal",
                        formatter: function(cell) {
                            const value = parseFloat(cell.getValue());
                            const formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
                            return `<span style="color: ${value < 0 ? 'red' : 'green'};">${formattedValue}</span>`;
                        }
                    }
                ],
                rowContextMenu: [
                    {
                        label: `<img src="../assets/trashcanIcon.png" class="context-menu-icon"> Delete Row`,
                        action: function(e, row) {
                            const showModal = !getCookie("dontShowDeleteModal");
                            if (showModal) {
                                openDeleteModal(row);
                            } else {
                                deleteRow(row);
                            }
                        }
                    }
                ]
            });

            table.on("tableBuilt", () => {
                // Add filter icons and containers to column headers
                table.getColumns().forEach(column => {
                    const headerElement = column.getElement();
                    const headerContent = headerElement.querySelector('.tabulator-col-content');
                    const headerTitle = headerContent.querySelector('.tabulator-col-title');
                    
                    // Create title holder div
                    const titleHolder = document.createElement('div');
                    titleHolder.className = 'tabulator-col-title-holder';
                    
                    // Add filter icon
                    const filterIcon = document.createElement('img');
                    filterIcon.src = '../assets/filterIcon.png';
                    filterIcon.className = 'filter-icon';
                    filterIcon.addEventListener('click', () => showFilterModal(column.getField()));
                    
                    // Create filter container
                    const filterContainer = document.createElement('div');
                    filterContainer.className = 'filter-container';
                    filterContainer.id = `filter-${column.getField()}`;
                    
                    // Move the title text to the holder
                    while (headerTitle.firstChild) {
                        titleHolder.appendChild(headerTitle.firstChild);
                    }
                    
                    // Assemble the header
                    titleHolder.insertBefore(filterIcon, titleHolder.firstChild); // Add icon at the start
                    headerTitle.appendChild(titleHolder);
                    headerContent.appendChild(filterContainer);
                });

                // Add event listeners
                addAllEventListeners();
                addSearchEventListeners();

                // Handle cell edited event
                table.on("cellEdited", function(cell) {
                    const row = cell.getRow();
                    const allCells = row.getCells();
                    const currentIndex = allCells.findIndex(c => c === cell);
                    
                    // Move to next cell or validate row
                    if(currentIndex === 3 || currentIndex === 0) updateRunningTotal();
                    if (finalizeRow(row)) table.setData(table.getData());
                });

                // Update running total on table initialization
                updateRunningTotal();
            })

        });
    });
});

function openDeleteModal(row) {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    const dontShowCheckbox = document.getElementById('dontShowDeleteModal');

    modal.style.display = 'block';

    confirmBtn.onclick = function() {
        if (dontShowCheckbox.checked) {
            setCookie("dontShowDeleteModal", true, 365);
        }
        deleteRow(row);
        modal.style.display = 'none';
    };

    cancelBtn.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function deleteRow(row) {
    const rowData = row.getData();
    deleteTransaction(rowData.id);
    row.delete();
    updateRunningTotal();
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) == 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

export { table, currentEditingRow };