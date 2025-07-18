// ==UserScript==
// @name         Agile Cat – Reception Module
// @namespace    http://tampermonkey.net/
// @version      1.504
// @description  Adds a floating toolbar for scanning on Brightpearl template_print.php pages
// @include      https://*.brightpearlapp.com/template_print.php*
// @grant        none
// ==/UserScript==
// 19/06 Module, save and formatting integrated
//  Base report module added
//  402B fixed text
//  410  Added basic sounds
// 411   fixed save
//421  export added
// 422 fixing missing notes when okay
// 423 adding logo
//501  save system reworked
//502 detele button
// 503 delete button 2
// 504 tweaks

(function () {
    'use strict';

    // Definitions

    const scanHistory = [];
    let lastFailedScan = null;
    let lastFailedScanCount = 0;


    // Preload the audio
    const scanSuccessAudio = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
    const scanFailAudio = new Audio('https://www.myinstants.com/media/sounds/sound-effect-cat-meow-04.mp3');
    scanSuccessAudio.preload = 'auto';
    scanFailAudio.preload = 'auto';
    scanSuccessAudio.load();
    scanFailAudio.load();

    function playScanSound(success = true) {
    const audio = success ? scanSuccessAudio : scanFailAudio;
    audio.currentTime = 0; // rewind if already playing
    audio.play().catch(err => console.warn('🔇 Sound playback blocked:', err));
    }

    function createToolbar() {
    const headerLine = document.createElement('div');
        headerLine.style.display = 'flex';
        headerLine.style.alignItems = 'center';
        headerLine.style.gap = '10px';
        headerLine.style.marginBottom = '5px';

// Example: AgileCat logo + title
      /*  const logo = document.createElement('img');
        logo.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Cat_poster_1.jpg/80px-Cat_poster_1.jpg'; // Replace with your preferred logo
        logo.alt = 'AgileCat';
        logo.style.height = '20px';
        logo.style.width = '20px';
      */
        const title = document.createElement('div');
        title.innerHTML = '<strong>AgileCat – Reception Module</strong>';
        title.style.fontSize = '12px';
        title.style.fontWeight = 'bold';
        title.style.fontFamily = 'Arial, sans-serif';

    //    headerLine.appendChild(logo);
        headerLine.appendChild(title);

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = '0';
        container.style.zIndex = '9999';
        container.style.backgroundColor = '#fff';
        container.style.borderBottom = '1px solid #ccc';
        container.style.padding = '5px';
        container.style.fontFamily = 'Arial, sans-serif';

        const line1 = document.createElement('div');
         const line2 = document.createElement('div');
         line2.style.display = 'flex';
         line2.style.flexWrap = 'wrap';
         line2.style.alignItems = 'center';
         line2.style.gap = '10px';

        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.id = 'qtyInput';
        qtyInput.value = '1';
    qtyInput.style.width = '40px';
    qtyInput.style.marginRight = '10px';

    const scanInput = document.createElement('input');
    scanInput.type = 'text';
    scanInput.placeholder = 'Scan or enter reference';
    scanInput.id = 'scanRefInput';
    scanInput.style.marginRight = '10px';
    scanInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            handleScan(scanInput.value.trim());
            scanInput.value = ''; // Clear after scan
        }
    });

    const staffLabel = document.createElement('label');
    staffLabel.innerHTML = '😺 Staff: ';
    staffLabel.style.marginRight = '10px';

    const staffInput = document.createElement('input');
    staffInput.type = 'text';
    staffInput.placeholder = 'Your name';
    staffInput.id = 'staffInput';
    staffInput.style.marginLeft = '5px';
    staffInput.addEventListener('input', saveState);
    staffLabel.appendChild(staffInput);

    const parcelLabel = document.createElement('label');
    parcelLabel.innerHTML = '📦 Parcels: ';
    parcelLabel.style.marginRight = '10px';

    const parcelInput = document.createElement('input');
    parcelInput.type = 'number';
    parcelInput.placeholder = 'Qty';
    parcelInput.id = 'parcelInput';
    parcelInput.style.width = '60px';
    parcelInput.style.marginLeft = '5px';
    parcelInput.addEventListener('input', saveState);
    parcelLabel.appendChild(parcelInput);

    const invoiceCheck = document.createElement('input');
    invoiceCheck.type = 'checkbox';
    invoiceCheck.id = 'invoiceCheck';
    invoiceCheck.style.marginRight = '5px';
    invoiceCheck.addEventListener('change', saveState);

    const invoiceLabel = document.createElement('label');
    invoiceLabel.textContent = 'Invoiced?';
    invoiceLabel.appendChild(invoiceCheck);

    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '⏪ Cancel Last';
    cancelBtn.onclick = cancelLastEntry;

    const addBtn = document.createElement('button');
    addBtn.innerHTML = '➕ Add Product';
    addBtn.onclick = () => promptAddProduct();

    const dmgBtn = document.createElement('button');
    dmgBtn.innerHTML = '💥 Damaged Product';
    dmgBtn.onclick = () => promptDamagedProduct();

    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '💾 Save Data';
    saveBtn.onclick = () => {
        saveState();
        alert('Data saved');
    };

    const loadBtn = document.createElement('button');
    loadBtn.innerHTML = '📂 Load Data';
    loadBtn.onclick = loadSavedState;

    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '🗑️ Reset Data';
    resetBtn.onclick = () => {
        localStorage.removeItem(getStorageKey());
        alert('Data reset');
    };

         const reportBtn = document.createElement('button');
reportBtn.innerHTML = '📝 Generate Report';
reportBtn.onclick = () => generatereport();

const exportBtn = document.createElement('button');
exportBtn.innerHTML = '📤 Export Data';
exportBtn.onclick = () => exportData();

const rightSideGroup = document.createElement('div');
rightSideGroup.style.marginLeft = 'auto';
rightSideGroup.style.display = 'flex';
rightSideGroup.style.gap = '10px';

rightSideGroup.appendChild(reportBtn);
rightSideGroup.appendChild(exportBtn);

    line1.appendChild(qtyInput);
    line1.appendChild(scanInput);

    line1.appendChild(staffLabel);
    line1.appendChild(parcelLabel);
    line1.appendChild(invoiceLabel);
    line1.appendChild(cancelBtn);

    line2.appendChild(addBtn);
    line2.appendChild(dmgBtn);
    line2.appendChild(saveBtn);
    line2.appendChild(loadBtn);
    line2.appendChild(resetBtn);
    line2.appendChild(rightSideGroup);
container.appendChild(headerLine);
container.appendChild(line1);
container.appendChild(line2);
    document.body.prepend(container);

    const style = document.createElement('style');
    style.textContent = `
    .agile-highlight-scan {
        animation: agilePulseBlue 1.5s ease-out;
    }
    .agile-highlight-cancel {
        animation: agilePulseYellow 1.5s ease-out;
    }
    @keyframes agilePulseBlue {
        0% { background-color: #cce5ff; }
        50% { background-color: #99ccff; }
        100% { background-color: transparent; }
    }
    @keyframes agilePulseYellow {
        0% { background-color: #fff3cd; }
        50% { background-color: #ffeeba; }
        100% { background-color: transparent; }
    }
    `;
    document.head.appendChild(style);
}
function applyColoring(table) {
  'use strict';
  const tbody = table.tBodies[0];
  if (!tbody) return;

  Array.from(tbody.rows).forEach(row => {
    const c = row.cells;
    // Column 8: Weight (idx 7)
    const weightCell = c[7];
    const weightInput = weightCell.querySelector('.ac-weight-input');
    let w = 0;
    if (weightInput) {
      w = parseFloat(weightInput.value) || 0;
    } else {
      w = parseFloat(weightCell.textContent) || 0;
    }
    weightCell.style.backgroundColor = (w === 0 ? 'red' : '');

    // Columns 9–12: Expected (8), Scanned (9), Missing (10), Extra (11)
    const [expectedCell, scannedCell, missingCell, extraCell] = [c[8], c[9], c[10], c[11]];
    const expected = parseInt(expectedCell.textContent, 10) || 0;
    const scanned  = parseInt(scannedCell.textContent,  10) || 0;
    const missing  = parseInt(missingCell.textContent,  10) || 0;
    const extra    = parseInt(extraCell.textContent,    10) || 0;

    // expected & scanned green if equal and >0
    if (expected === scanned && expected > 0) {
      expectedCell.style.backgroundColor = 'lightgreen';
      scannedCell.style.backgroundColor  = 'lightgreen';
    } else {
      expectedCell.style.backgroundColor = '';
      scannedCell.style.backgroundColor  = '';
    }
    // missing >0 orange
    missingCell.style.backgroundColor = (missing > 0 ? 'orange' : '');
    // extra >0 orange
    extraCell.style.backgroundColor   = (extra   > 0 ? 'orange' : '');
  });
}

function formatTable() {
  'use strict';

  // 0. Locate wrapper & table
  const wrapper = document.querySelector('.letterWrp');
  if (!wrapper) return;
  const table = wrapper.querySelector('table');
  if (!table) return;
  const tbody = table.tBodies[0];
  if (!tbody) return;

  // 1. Detach & collect rows
  const rows = Array.from(tbody.rows);
  tbody.innerHTML = '';

  // 2. Compute max original line
  let maxOriginal = rows.reduce((max, row) => {
    const v = row.dataset.originalLine ? parseInt(row.dataset.originalLine, 10) : 0;
    return v > max ? v : max;
  }, 0);

  // 3. Process each data row
  rows.forEach(row => {
    const c = row.cells;

    // — Assign original line if missing —
    if (!row.dataset.originalLine) {
      row.dataset.originalLine = String(++maxOriginal);
    }
    c[0].textContent = row.dataset.originalLine;

    // — Only format new or outdated rows —
    if (row.dataset.formatted !== '1.3.3') {
      // Col 4: Barcode
      if (!c[3].textContent.trim()) {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'ac-barcode-input';
        c[3].textContent = '';
        c[3].appendChild(inp);
      }

      // Col 5: Label required?
      if (!c[4].querySelector('input[type=checkbox]') && !c[4].textContent.trim()) {
        const chk = document.createElement('input');
        chk.type = 'checkbox'; chk.className = 'ac-label-checkbox';
        c[4].textContent = '';
        c[4].appendChild(chk);
      }

      // Col 6: Location
      if (!c[5].textContent.trim()) {
        const locInp = document.createElement('input');
        locInp.type = 'text'; locInp.className = 'ac-location-input';
        c[5].textContent = '';
        c[5].appendChild(locInp);
      }

      // Col 7: Notes
      const noteTxt = c[6].textContent.trim();
      c[6].textContent = '';
      const noteInp = document.createElement('input');
      noteInp.type = 'text'; noteInp.value = noteTxt;
      noteInp.className = 'ac-notes-input';
      c[6].appendChild(noteInp);

      // Col 8: Weight
      const weightCell = c[7];
      // set fixed column width
      weightCell.style.width = '4ch';
      const w = parseFloat(weightCell.textContent) || 0;
      if (w === 0) {
        weightCell.textContent = '';
        const wInp = document.createElement('input');
        wInp.type = 'text'; wInp.className = 'ac-weight-input';
        wInp.style.width = '100%';
        weightCell.appendChild(wInp);
        weightCell.style.backgroundColor = 'red';
      } else {
        weightCell.style.backgroundColor = '';
      }

      // Cols 9–12: Scanning highlights
      const [expC, scanC, missC, extraC] = [c[8], c[9], c[10], c[11]];
      const [exp, scan, miss, extra] = [expC, scanC, missC, extraC].map(cell =>
        parseInt(cell.textContent, 10) || 0
      );
      if (exp === scan && exp > 0) {
        expC.style.backgroundColor = 'lightgreen';
        scanC.style.backgroundColor = 'lightgreen';
      } else {
        expC.style.backgroundColor = '';
        scanC.style.backgroundColor = '';
      }
      missC.style.backgroundColor = (miss > 0 ? 'orange' : '');
      extraC.style.backgroundColor = (extra > 0 ? 'orange' : '');

      row.dataset.formatted = '1.3.3';
    }

    tbody.appendChild(row);
  });

  // 4. Footer rows: only EXTRA and DMG
  function makeFooterRow({ label, description }) {
    const tr = document.createElement('tr');
    tr.appendChild(document.createElement('td')); // col1 blank
    const td2 = document.createElement('td');
    td2.textContent = label;
    td2.style.color = 'white';
    tr.appendChild(td2);
    const td3 = document.createElement('td');
    const b = document.createElement('b');
    b.textContent = description;
    td3.appendChild(b);
    tr.appendChild(td3);
    const totalCols = rows[0]?.cells.length || table.rows[0].cells.length;
    for (let i = 3; i < totalCols; i++) tr.appendChild(document.createElement('td'));
    return tr;
  }

  const footers = [
    { label: 'EXTRA', description: 'Extra Products' },
    { label: 'DMG',   description: 'Damaged Products' }
  ];

  let tfoot = table.tFoot;
  if (!tfoot) { tfoot = document.createElement('tfoot'); table.appendChild(tfoot); }
  tfoot.innerHTML = '';
  footers.forEach(cfg => tfoot.appendChild(makeFooterRow(cfg)));

  // 5. External report notes textarea
 if (!document.getElementById('Reportnotes')) {
    // --- Title above the textarea ---
    const notesTitle = document.createElement('h3');
    notesTitle.textContent = 'Notes & Comments';
    wrapper.appendChild(notesTitle);

    // --- The textarea itself, wider by default ---
    const ta = document.createElement('textarea');
    ta.id = 'Reportnotes';
    ta.rows = 6;
    ta.style.width = '100%';                   // ← make it span full width
    ta.placeholder = 'Enter report notes here...';
    wrapper.appendChild(ta);
  }

  // 6. Re-enable header-based sorting
  enableColumnSorting(table);
}

/* sorting helpers unchanged */
function enableColumnSorting(table) {
  const thead = table.tHead;
  if (!thead) return;
  Array.from(thead.rows[0].cells).forEach((th, colIdx) => {
    th.style.cursor = 'pointer';
    let asc = true;
    th.addEventListener('click', () => {
      sortByColumn(table, colIdx, asc);
      asc = !asc;
      th.dataset.sortDir = asc ? 'asc' : 'desc';
    });
  });
}
function sortByColumn(table, colIdx, ascending = true) {
  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);
  rows.sort((a, b) => {
    const A = a.cells[colIdx].textContent.trim().toLowerCase();
    const B = b.cells[colIdx].textContent.trim().toLowerCase();
    if (A < B) return ascending ? -1 : 1;
    if (A > B) return ascending ?  1 : -1;
    return 0;
  });
  tbody.innerHTML = '';
  rows.forEach(r => tbody.appendChild(r));
}






    function readCell(cell) {
    const input = cell.querySelector('input, textarea');
    return input ? input.value.trim() : cell.textContent.trim();
  }
    function getStorageKey() {
        const ref = document.querySelector('.letterWrp')?.firstChild?.textContent?.trim();
        return `agilecat_${ref}`;
    }
    function exportData() {
  const existing = document.getElementById('agc-barcode');
  if (existing) existing.remove();

  const table = document.querySelector('.letterWrp table');
  const rows = [
    ...table.tBodies[0].rows,
    ...(table.tFoot ? Array.from(table.tFoot.rows) : [])
  ];
  const entries = [];
  rows.forEach(r => {
    const cell = r.cells[3];
    const input = cell.querySelector('input, textarea');
    if (input && input.value.trim()) {
      entries.push({ sku: readCell(r.cells[1]), code: input.value.trim() });
    }
  });

  const win = document.createElement('div');
  win.id = 'agc-barcode';
  Object.assign(win.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    background: '#f9f9f9',
    borderTop: '2px solid #333',
    maxHeight: '40%',
    overflowY: 'auto',
    zIndex: '9998',
    padding: '10px',
    boxSizing: 'border-box'
  });

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
  const title = document.createElement('h3');
  title.innerText = 'Barcode Entries';
  title.style.margin = '0';
  const minBtn = document.createElement('button');
  minBtn.innerText = '_';
  minBtn.onclick = () => {
    const c = win.querySelector('.agc-barcode-content');
    c.style.display = c.style.display === 'none' ? '' : 'none';
  };
  header.append(title, minBtn);
  win.appendChild(header);

  const content = document.createElement('div');
  content.className = 'agc-barcode-content';

  if (!entries.length) {
    const p = document.createElement('p');
    p.innerText = 'No barcode inputs detected.';
    // Add four line breaks after the message
    for (let i = 0; i < 4; i++) {
      p.appendChild(document.createElement('br'));
    }
    content.appendChild(p);
  } else {
    const bt = document.createElement('table');
    bt.style.cssText = 'width:100%;border-collapse:collapse;';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>SKU</th><th>Barcode</th><th>UPC</th></tr>';
    bt.appendChild(thead);

    const tbody = document.createElement('tbody');
    entries.forEach(e => {
      const tr = document.createElement('tr');
      ['sku', 'code', 'code'].forEach(k => {
        const td = document.createElement('td');
        td.innerText = e[k];
        td.style.cssText = 'border:1px solid #ccc;padding:4px;';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    bt.appendChild(tbody);
    content.appendChild(bt);

    // Add four line breaks after the table
    for (let i = 0; i < 4; i++) {
      content.appendChild(document.createElement('br'));
    }
  }

  win.appendChild(content);
  document.body.appendChild(win);
}
    
    function promptAddProduct(prefill = '') {
        const sku = prompt('Enter SKU:', prefill);
        const barcode = prompt('Enter Barcode:');
        const name = prompt('Enter Product Name:');
        if (!name) return alert('Name is required');
        const qty = parseInt(prompt('Enter Quantity:', '1') || '1');
        if (isNaN(qty) || qty <= 0) return alert('Invalid quantity');

        const table = document.querySelector('.letterWrp table');
        const tfoot = table?.tFoot;
        const rows = Array.from(tfoot?.rows || []);
        const dmgRow = rows.find(r => r.cells[1]?.textContent === 'DMG');
        if (!dmgRow) return alert('DMG row not found');

        const newRow = document.createElement('tr');
        const colCount = table.rows[0].cells.length;
        newRow.appendChild(document.createElement('td')).textContent = '';
        const td2 = document.createElement('td'); td2.textContent = sku || ''; newRow.appendChild(td2);
        const td3 = document.createElement('td'); td3.textContent = name; newRow.appendChild(td3);
        const td4 = document.createElement('td'); td4.textContent = barcode || ''; newRow.appendChild(td4);
        for (let i = 4; i < colCount - 1; i++) {
            const cell = document.createElement('td');
            if (i === 8) cell.textContent = qty;
            newRow.appendChild(cell);
        }

        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.style.padding = '2px 5px';
        deleteBtn.onclick = () => {
            if (confirm('Delete this row?')) {
                newRow.remove();
                saveState();
            }
        };
        deleteCell.appendChild(deleteBtn);
        newRow.appendChild(deleteCell);

        tfoot.insertBefore(newRow, dmgRow);
        highlightRow(newRow, 'blue');
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        saveState();
        applyColoring(table);
    }

    function promptDamagedProduct() {
        const ref = prompt('Enter SKU or Barcode of damaged product:');
        const qty = parseInt(prompt('How many units are damaged?') || '0');
        const damage = prompt('Describe the damage:');
        if (!ref || !qty || !damage) return alert('All fields are required.');

        const table = document.querySelector('.letterWrp table');
        const tfoot = table?.tFoot;
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const dmgRow = Array.from(tfoot?.rows || []).find(r => r.cells[1]?.textContent === 'DMG');
        if (!dmgRow) return alert('DMG row not found');

        const matchedRow = rows.find(r => {
            const cells = r.querySelectorAll('td');
            return ref === cells[1]?.textContent.trim() || ref === cells[3]?.textContent.trim();
        });

        const name = matchedRow?.querySelectorAll('td')[2]?.textContent || 'Unknown';

        const newRow = document.createElement('tr');
        const colCount = table.rows[0].cells.length;
        newRow.appendChild(document.createElement('td')).textContent = '';
        const td2 = document.createElement('td'); td2.textContent = ref; newRow.appendChild(td2);
        const td3 = document.createElement('td'); td3.textContent = name; newRow.appendChild(td3);
        const td4 = document.createElement('td'); td4.textContent = ''; newRow.appendChild(td4);
        for (let i = 4; i < colCount - 1; i++) {
            const cell = document.createElement('td');
            if (i === 6) cell.textContent = damage;
            if (i === 8) cell.textContent = qty;
            newRow.appendChild(cell);
        }

        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.style.padding = '2px 5px';
        deleteBtn.onclick = () => {
            if (confirm('Delete this row?')) {
                newRow.remove();
                saveState();
            }
        };
        deleteCell.appendChild(deleteBtn);
        newRow.appendChild(deleteCell);

        tfoot.insertBefore(newRow, dmgRow.nextSibling);
        highlightRow(newRow, 'yellow');
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        saveState();
        applyColoring(table);
    }
    
    function handleScan(ref) {
  // Auto-save on each scan
        const qty = parseInt(document.getElementById('qtyInput').value) || 1;
        const inputField = document.getElementById('scanRefInput');
        const table = document.querySelector('.letterWrp table');
        if (!table) return alert('Table not found!');

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        let matched = false;

        for (let row of rows) {
            const cells = row.querySelectorAll('td');
            const sku = cells[1]?.textContent.trim();
            const barcode = cells[3]?.textContent.trim();
            const expected = parseInt(cells[8]?.textContent) || 0;
            const countedCell = cells[9];
            const missingCell = cells[10];
            const extraCell = cells[11];

            if (ref === sku || ref === barcode) {
  let counted = parseInt(countedCell.textContent) || 0;
let newCount = counted + qty;
countedCell.textContent = newCount;
playScanSound(true);
const diff = newCount - expected;
if (diff < 0) {
    missingCell.textContent = Math.abs(diff);
    extraCell.textContent = '';
} else if (diff > 0) {
    missingCell.textContent = '';
    extraCell.textContent = diff;
} else {
    missingCell.textContent = '';
    extraCell.textContent = '';
}

                highlightRow(row, 'blue');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('qtyInput').value = 1;

                scanHistory.push({ row, qty });
                matched = true;
                break;
            }
        }

        if (!matched) {
            playScanSound(false);
            if (ref === lastFailedScan) {
                lastFailedScanCount++;
            } else {
                lastFailedScan = ref;
                lastFailedScanCount = 1;
            }

            if (lastFailedScanCount >= 2) {
                const confirmAdd = confirm(`${ref} not found. Do you want to add it as an extra product?`);
                if (confirmAdd) promptAddProduct(ref);
            } else {
                alert(`Reference ${ref} not found in table.`);
            }
        }
         saveState();
        applyColoring(table);
    }

    function highlightRow(row, color) {
        const original = row.style.backgroundColor;
        row.style.backgroundColor = color === 'blue' ? '#add8e6' : color === 'yellow' ? '#ffff99' : '#ffffff';
        setTimeout(() => {
            row.style.backgroundColor = original;
        }, 1500);
    }

    function cancelLastEntry() {
        if (!scanHistory.length) return alert('Nothing to undo.');
        const last = scanHistory.pop();
        const cells = last.row.querySelectorAll('td');
        const expected = parseInt(cells[8]?.textContent) || 0;
        const countedCell = cells[9];
        const missingCell = cells[10];
        const extraCell = cells[11];

        let counted = parseInt(countedCell.textContent) || 0;
        let extra = parseInt(extraCell.textContent) || 0;
        let qty = last.qty;

        if (extra >= qty) {
            extraCell.textContent = extra - qty;
        } else {
            qty -= extra;
            extraCell.textContent = 0;
            countedCell.textContent = Math.max(counted - qty, 0);
            missingCell.textContent = Math.max(expected - (counted - qty), 0);
        }

        highlightRow(last.row, 'yellow');
        last.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        saveState();
        const table = document.querySelector('.letterWrp table');
        applyColoring(table);
    }

    function promptAddProduct(prefill = '') {
        const sku = prompt('Enter SKU:', prefill);
        const barcode = prompt('Enter Barcode:');
        const name = prompt('Enter Product Name:');
        if (!name) return alert('Name is required');
        const qty = parseInt(prompt('Enter Quantity:', '1') || '1');
        if (isNaN(qty) || qty <= 0) return alert('Invalid quantity');

        const table = document.querySelector('.letterWrp table');
        const tfoot = table?.tFoot;
        const rows = Array.from(tfoot?.rows || []);
        const dmgRow = rows.find(r => r.cells[1]?.textContent === 'DMG');
        if (!dmgRow) return alert('DMG row not found');

        const newRow = document.createElement('tr');
        const colCount = table.rows[0].cells.length;
        newRow.appendChild(document.createElement('td')).textContent = '';
        const td2 = document.createElement('td'); td2.textContent = sku || ''; newRow.appendChild(td2);
        const td3 = document.createElement('td'); td3.textContent = name; newRow.appendChild(td3);
        const td4 = document.createElement('td'); td4.textContent = barcode || ''; newRow.appendChild(td4);
        for (let i = 4; i < colCount; i++) {
            const cell = document.createElement('td');
            if (i === 8) cell.textContent = qty;
            newRow.appendChild(cell);
        }

        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.style.padding = '2px 5px';
        deleteBtn.onclick = () => {
            if (confirm('Delete this row?')) {
                newRow.remove();
                saveState();
            }
        };
        deleteCell.appendChild(deleteBtn);
        newRow.appendChild(deleteCell);

        tfoot.insertBefore(newRow, dmgRow);
        highlightRow(newRow, 'blue');
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        saveState();
        applyColoring(table);
    }

    function promptDamagedProduct() {
        const ref = prompt('Enter SKU or Barcode of damaged product:');
        const qty = parseInt(prompt('How many units are damaged?') || '0');
        const damage = prompt('Describe the damage:');
        if (!ref || !qty || !damage) return alert('All fields are required.');

        const table = document.querySelector('.letterWrp table');
        const tfoot = table?.tFoot;
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const dmgRow = Array.from(tfoot?.rows || []).find(r => r.cells[1]?.textContent === 'DMG');
        if (!dmgRow) return alert('DMG row not found');

        const matchedRow = rows.find(r => {
            const cells = r.querySelectorAll('td');
            return ref === cells[1]?.textContent.trim() || ref === cells[3]?.textContent.trim();
        });

        const name = matchedRow?.querySelectorAll('td')[2]?.textContent || 'Unknown';

        const newRow = document.createElement('tr');
        const colCount = table.rows[0].cells.length;
        newRow.appendChild(document.createElement('td')).textContent = '';
        const td2 = document.createElement('td'); td2.textContent = ref; newRow.appendChild(td2);
        const td3 = document.createElement('td'); td3.textContent = name; newRow.appendChild(td3);
        const td4 = document.createElement('td'); td4.textContent = ''; newRow.appendChild(td4);
        for (let i = 4; i < colCount; i++) {
            const cell = document.createElement('td');
            if (i === 6) cell.textContent = damage;
            if (i === 8) cell.textContent = qty;
            newRow.appendChild(cell);
        }

        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.style.padding = '2px 5px';
        deleteBtn.onclick = () => {
            if (confirm('Delete this row?')) {
                newRow.remove();
                saveState();
            }
        };
        deleteCell.appendChild(deleteBtn);
        newRow.appendChild(deleteCell);

        tfoot.insertBefore(newRow, dmgRow.nextSibling);
        highlightRow(newRow, 'yellow');
        newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        saveState();
        applyColoring(table);
    }

    function addCountButtonsToRows() {
    const table = document.querySelector('.letterWrp table');
    if (!table) return;

    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(
        tr =>
            tr.querySelectorAll('td').length >= 12 &&
            !['EXTRA', 'DMG'].includes(tr.cells[1]?.textContent.trim())
    );

    rows.forEach((row) => {
        const btnCell = document.createElement('td');

        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.style.margin = '0 4px';
        plusBtn.onclick = () => adjustRowCount(row, 1);

        const minusBtn = document.createElement('button');
        minusBtn.textContent = '−';
        minusBtn.style.margin = '0 4px';
        minusBtn.onclick = () => adjustRowCount(row, -1);

        btnCell.appendChild(plusBtn);
        btnCell.appendChild(minusBtn);
        row.appendChild(btnCell);
    });
}

    function adjustRowCount(row, delta) {
    const countedCell = row.cells[9];
    const expectedCell = row.cells[8];
    const missingCell = row.cells[10];
    const extraCell = row.cells[11];

    const counted = parseInt(countedCell.textContent || '0', 10);
    const expected = parseInt(expectedCell.textContent || '0', 10);
    let newCount = counted + delta;
    if (newCount < 0) newCount = 0;

    countedCell.textContent = newCount;

    const diff = newCount - expected;
    if (diff < 0) {
        missingCell.textContent = Math.abs(diff);
        extraCell.textContent = '';
    } else if (diff > 0) {
        missingCell.textContent = '';
        extraCell.textContent = diff;
    } else {
        missingCell.textContent = '';
        extraCell.textContent = '';
    }

    animateRow(row, 'blue');
     saveState();
        const table = document.querySelector('.letterWrp table');
        applyColoring(table);
}

    function animateRow(row, color) {
    const className = color === 'yellow' ? 'agile-highlight-cancel' : 'agile-highlight-scan';
    row.classList.add(className);
    setTimeout(() => row.classList.remove(className), 1500);
}


  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${mins}`;
  }

  function generatereport() {
    const existing = document.getElementById('agc-report');
    if (existing) existing.remove();

    const docRef    = document.querySelector('.letterWrp')?.firstChild?.textContent.trim() || '';
    const timestamp = formatDate(new Date());
    const staff     = document.querySelector('#staffInput').value.trim();
    const parcels   = document.querySelector('#parcelInput').value.trim();
    const invoiced  = document.querySelector('#invoiceCheck').checked ? 'Yes' : 'No';

    const win = document.createElement('div');
    win.id = 'agc-report';
    Object.assign(win.style, {
      position: 'fixed',
      bottom: '0', left: '0',
      width: '50%',
      background: '#fff', borderTop: '2px solid #000',
      maxHeight: '50%', overflowY: 'auto', zIndex: '9999',
      padding: '10px', boxSizing: 'border-box'
    });

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';
    const title  = document.createElement('h3'); title.innerText = 'Purchase Order Report'; title.style.margin = '0';
    const minBtn = document.createElement('button'); minBtn.innerText = '_';
    minBtn.onclick = () => {
      const content = win.querySelector('.agc-content');
      content.style.display = content.style.display === 'none' ? '' : 'none';
    };
    header.append(title, minBtn);
    win.appendChild(header);

    const content = document.createElement('div'); content.className = 'agc-content';

    const pre = document.createElement('pre');
    pre.innerText =
`-------------------------------------------------------------
Purchase order Report :
${docRef}
${timestamp}
Received by: ${staff}
Parcel received: ${parcels}
Invoiced: ${invoiced}
-------------------------------------------------------------`;
    content.appendChild(pre);

    // Source table rows
    const table    = document.querySelector('.letterWrp table');
    const bodyRows = Array.from(table.tBodies[0].rows);
    const footRows = table.tFoot ? Array.from(table.tFoot.rows) : [];

    // --- Missing items ---
    const missingDiv = document.createElement('div'); missingDiv.innerHTML = '<h4>Missing items:</h4>';
    bodyRows.forEach(r => {
      const exp = parseInt(readCell(r.cells[8])) || 0;
      const cnt = parseInt(readCell(r.cells[9])) || 0;
      if (cnt < exp) {
        const line = readCell(r.cells[0]), sku = readCell(r.cells[1]), name = readCell(r.cells[2]);
        const p    = document.createElement('p'); p.innerText = `${line} - ${sku} - ${name} - missing ${exp-cnt} of ${exp}`;
        missingDiv.appendChild(p);
        const note = readCell(r.cells[6]);
        if (note) { const ni = document.createElement('p'); ni.innerHTML = `<i>${note}</i>`; missingDiv.appendChild(ni); }
      }
    });
    content.appendChild(missingDiv);

    // --- Extra items ---
    const extraDiv = document.createElement('div'); extraDiv.innerHTML = '<h4>Extra items:</h4>';
    bodyRows.forEach(r => {
      const exp = parseInt(readCell(r.cells[8])) || 0;
      const cnt = parseInt(readCell(r.cells[9])) || 0;
      if (cnt > exp) {
        const line = readCell(r.cells[0]), sku = readCell(r.cells[1]), name = readCell(r.cells[2]);
        const p    = document.createElement('p'); p.innerText = `${line} - ${sku} - ${name} - extra ${cnt-exp} of ${exp}`;
        extraDiv.appendChild(p);
        const note = readCell(r.cells[6]);
        if (note) { const ni = document.createElement('p'); ni.innerHTML = `<i>${note}</i>`; extraDiv.appendChild(ni); }
      }
    });
    const extraIdx = footRows.findIndex(r => readCell(r.cells[1]) === 'EXTRA');
    const dmgIdx   = footRows.findIndex(r => readCell(r.cells[1]) === 'DMG');
    if (extraIdx > -1 && dmgIdx > -1) {
      footRows.slice(extraIdx+1, dmgIdx).forEach(r => {
        const line = readCell(r.cells[0]), sku = readCell(r.cells[1]), name = readCell(r.cells[2]);
        const cnt  = parseInt(readCell(r.cells[8])) || 0;
        const p    = document.createElement('p'); p.innerText = `${line} - ${sku} - ${name} - extra ${cnt}`;
        extraDiv.appendChild(p);
        const note = readCell(r.cells[6]); if (note) { const ni = document.createElement('p'); ni.innerHTML = `<i>${note}</i>`; extraDiv.appendChild(ni); }
      });
    }
    content.appendChild(extraDiv);

    // --- Damaged items ---
    const dmgDiv = document.createElement('div'); dmgDiv.innerHTML = '<h4>Damaged items:</h4>';
    if (dmgIdx > -1) footRows.slice(dmgIdx+1).forEach(r => {
      const line = readCell(r.cells[0]), sku = readCell(r.cells[1]), name = readCell(r.cells[2]);
      const cnt  = parseInt(readCell(r.cells[8])) || 0;
      const p    = document.createElement('p'); p.innerText = `${line} - ${sku} - ${name} - ${cnt}`;
      dmgDiv.appendChild(p);
      const note = readCell(r.cells[6]); if (note) { const ni = document.createElement('p'); ni.innerHTML = `<i>${note}</i>`; dmgDiv.appendChild(ni); }
    });
    content.appendChild(dmgDiv);

    // --- Lines with any notes ---
    const noteDiv = document.createElement('div'); noteDiv.innerHTML = '<h4>Lines with notes:</h4>';
    [...bodyRows, ...footRows].forEach(r => {
      const note = readCell(r.cells[6]);
      if (note) {
        const line = readCell(r.cells[0]), sku = readCell(r.cells[1]), name = readCell(r.cells[2]);
        const p    = document.createElement('p'); p.innerText = `${line} - ${sku} - ${name} - ${note}`;
        noteDiv.appendChild(p);
      }
    });
    content.appendChild(noteDiv);

    // --- General report notes ---
    const notesEl = document.querySelector('#Reportnotes');
    if (notesEl && notesEl.value.trim()) {
      const dn = document.createElement('div'); dn.innerHTML = `<h4>Notes:</h4><p>${notesEl.value.trim()}</p>`;
      content.appendChild(dn);
    }

    win.appendChild(content);
    document.body.appendChild(win);
  }


window.addEventListener('load', () => {
    formatTable();
    addCountButtonsToRows();
    createToolbar();
    loadSavedState();
    setTimeout(() => {
    const notesBox = document.getElementById('Reportnotes');
    if (notesBox) {
        notesBox.addEventListener('input', saveState);
    }
}, 1000);

});

})();
