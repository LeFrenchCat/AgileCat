// ==UserScript==
// @name         Agile Cat - Next Gen Picking Module
// @namespace    http://tampermonkey.net/
// @version      0.508
// @description  Brightpearl picking parser with rendered overlay table, Qty Picked input, quick flag (🚩) and placeholder (❓) buttons; structured for Agile Cat Picking Tool ongoing development.
// @author       Pierre & ChatGPT
// @match        https://*.brightpearlapp.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
// Cause gifs are the way to go
//  504 - function rework with timeout
// 507 -  fitted filter.
//edited position of button
// refixed barcode missing

(function() {
  'use strict';

  if (window.self === window.top) {
    console.log("🔧 [Agile Cat Picking Module] Aborted – top window has no picking tables.");
    return;
  }

  console.log("🔧 [Agile Cat Picking Module] Running inside iframe – parsing picking tables.");
function agcShowLoaderWithFetch({ url, sku, timeout = 8000, gifUrl = "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif" }) {
    return new Promise(async (resolve, reject) => {
        // Create loader
        const loader = document.createElement('div');
        loader.id = 'agc-loader';
        Object.assign(loader.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10010,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #999',
            padding: '10px 20px',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
        });

        loader.innerHTML = `
            <div>🔍 Looking up SKU <b>${sku}</b>...</div>
            <img src="${gifUrl}" alt="Loading..." style="margin-top:5px;width:80px;">
        `;

        document.body.appendChild(loader);

        // Wrap fetch with timeout
        function fetchWithTimeout(url, timeout) {
            return Promise.race([
                fetch(url),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("⏱️ Timed out while loading")), timeout)
                )
            ]);
        }

        try {
            const response = await fetchWithTimeout(url, timeout);
            const text = await response.text();
            loader.remove();
            resolve(text);
        } catch (err) {
            loader.remove();
            alert(`❌ Failed to fetch SKU ${sku}: ${err.message}`);
            reject(err);
        }
    });
}
async function agcFetchAndShowQuantity(sku) {
    const url = `https://euw1.brightpearlapp.com/report.php?output-old=screen&report_type=product_list&report_submit=1&search_products=${encodeURIComponent(sku)}`;

    try {
        const html = await agcShowLoaderWithFetch({ url, sku });

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const rows = doc.querySelectorAll('table#product_list tbody tr');
        let found = false;

        rows.forEach(r => {
            const cells = r.querySelectorAll('td');
            const rowSkuRaw = cells[1]?.textContent || '';
            const rowSku = rowSkuRaw.replace(/\u00A0/g, '').trim();

            if (rowSku === sku) {
                const inStock = cells[4]?.textContent.trim();
                const allocated = cells[5]?.textContent.trim();
                alert(`SKU: ${sku}\nIn Stock: ${inStock}\nAllocated: ${allocated}`);
                found = true;
            }
        });

        if (!found) {
            alert(`⚠️ SKU ${sku} not found in product list.`);
        }

    } catch (error) {
        console.warn(`AgileCat: Error loading SKU ${sku}`, error);
        // already alerted from within agcShowLoaderWithFetch
    }
}


  function appendBasketLabelToTables(basketAssignments) {
    const tables = document.querySelectorAll('table.items');
    tables.forEach((table, index) => {
      const label = document.createElement('div');
      label.textContent = `🧺 Assigned to Basket ${basketAssignments[index] || 'N/A'}`;
      Object.assign(label.style, {
        fontWeight: 'bold', fontSize: '10px', margin: '10px 0', color: '#444'
      });
      table.parentElement.insertBefore(label, table.nextSibling);
    });
    console.log("✅ Basket assignment labels added.");
  }

  function addParserAndGuiButtons() {
    const parserBtn = document.createElement('button');
    parserBtn.innerText = '▶️ Generate Picking ticket';
    Object.assign(parserBtn.style, {
      position: 'fixed', top: '10px', right: '10px', padding: '8px 12px', fontSize: '14px',
      zIndex: 9999, background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
    });
    parserBtn.addEventListener('click', () => { runParser(); });
    document.body.appendChild(parserBtn);
    console.log("✅ Picking Ticket Button Created.");
  }

  let overlayInputRefs = {};

function runParser() {
  const items = [];
  const tables = document.querySelectorAll('table.items');

  tables.forEach((table, tableIndex) => {
    const basketNumber = tableIndex + 1;
    const rows = table.querySelectorAll('tr.inventory');

    rows.forEach(row => {
      const cells = row.cells;
      const sku = cells[0]?.innerText.trim();
      const nameCell = cells[1];
      const productName = nameCell?.childNodes[0]?.textContent.trim() || '';
      let options = '';
      const optionsDiv = nameCell?.querySelector('.product-options');
      if (optionsDiv) {
        options = Array.from(optionsDiv.querySelectorAll('.product-option')).map(opt => opt.innerText.trim()).join(', ');
      }
        // Skip if "fitted" is present but not "cap" or "hat"
        const fullText = `${productName} ${options}`.toLowerCase();
        if (fullText.includes("fitted") && !fullText.includes("cap") && !fullText.includes("hat")) {
          console.log(`⛔ Skipped item with 'fitted': ${productName}`);
          return;
        }

      const barcode = cells[2]?.innerText.trim() || " unknown " ;
      const location = cells[3]?.innerText.trim();
      const qtyNeeded = cells[5]?.innerText.trim();
      const isQtyValid = qtyNeeded && !isNaN(parseInt(qtyNeeded)) && parseInt(qtyNeeded) > 0;
      if (sku && productName && barcode && location && isQtyValid) {
        items.push({ basket: basketNumber, sku, productName, options, barcode, location, qtyNeeded });
      } else {
        console.warn("⚠️ Skipping row due to missing or invalid data:", {
          sku, productName, barcode, location, qtyNeeded
        });
      }
    });
  });

  items.sort((a, b) => a.location.localeCompare(b.location, undefined, { numeric: true }));
  console.log("✅ Parsed items:", items);
  renderOverlay(items);

  const basketAssignments = Array.from(tables).map((_, idx) => idx + 1);
  appendBasketLabelToTables(basketAssignments);
}


  function renderOverlay(items) {
    overlayInputRefs = {}; // Reset map

    const existing = document.getElementById('picking-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'picking-overlay';
    Object.assign(overlay.style, {
      background: 'white', border: '2px solid black', padding: '10px', marginBottom: '20px', pageBreakAfter: 'always', zIndex: 1
    });

    const heading = document.createElement('h2');
    heading.innerText = 'Picking Summary Ticket';
    heading.style.textAlign = 'center';
    heading.style.marginBottom = '10px';
    overlay.appendChild(heading);

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const headerRow = document.createElement('tr');
    ['Location','Qty Needed','Qty Picked','Basket','SKU','Product Name','Options','Barcode','🚩','❓'].forEach(h => {
      const th = document.createElement('th');
      th.innerText = h;
      Object.assign(th.style, { border: '1px solid black', padding: '4px', background: '#ddd' });
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    items.forEach(item => {
      const tr = document.createElement('tr');

      [item.location, item.qtyNeeded].forEach(val => {
        const td = document.createElement('td');
        td.innerText = val;
        Object.assign(td.style, { border: '1px solid black', padding: '4px' });
        tr.appendChild(td);
      });

      const qtyInputTd = document.createElement('td');
      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '0';
      qtyInput.style.width = '60px';
      qtyInput.style.padding = '2px';
      qtyInputTd.appendChild(qtyInput);
      Object.assign(qtyInputTd.style, { border: '1px solid black', padding: '4px' });
      tr.appendChild(qtyInputTd);

      const refKey = item.basket ? `${item.sku}|${item.basket}` : item.sku;
      overlayInputRefs[refKey] = qtyInput;

      qtyInput.addEventListener('input', () => {
        const picked = parseInt(qtyInput.value);
        const needed = parseInt(item.qtyNeeded);
        if (picked === needed) tr.style.backgroundColor = '#ccffcc';
        else if (picked > needed) tr.style.backgroundColor = '#ff9999';
        else if (picked > 0 && picked < needed) tr.style.backgroundColor = '#ffe599';
        else tr.style.backgroundColor = '';
      });

      const basketTd = document.createElement('td');
      basketTd.innerText = `Basket ${item.basket}`;
      Object.assign(basketTd.style, { border: '1px solid black', padding: '4px' });
      tr.appendChild(basketTd);

      [item.sku, item.productName, item.options, item.barcode || ''].forEach(val => {
        const td = document.createElement('td');
        td.innerText = val;
        Object.assign(td.style, { border: '1px solid black', padding: '4px' });
        tr.appendChild(td);
      });

      const flagTd = document.createElement('td');
      const flagBtn = document.createElement('button');
      flagBtn.innerText = '🚩';
      flagBtn.style.padding = '2px 5px';
      flagBtn.addEventListener('click', () => {
        tr.style.backgroundColor = '#ffcccc';
        console.log(`🔴 Flagged SKU: ${item.sku}`);
      });
      flagTd.appendChild(flagBtn);
      Object.assign(flagTd.style, { border: '1px solid black', padding: '4px' });
      tr.appendChild(flagTd);

      const questionTd = document.createElement('td');
      const questionBtn = document.createElement('button');
      questionBtn.innerText = '❓';
      questionBtn.style.padding = '2px 5px';
      questionBtn.addEventListener('click', () => {
        if (typeof agcFetchAndShowQuantity === 'function') {
          agcFetchAndShowQuantity(item.sku);
        }
      });
      questionTd.appendChild(questionBtn);
      Object.assign(questionTd.style, { border: '1px solid black', padding: '4px' });
      tr.appendChild(questionTd);

      table.appendChild(tr);
    });

    overlay.appendChild(table);
    document.body.insertBefore(overlay, document.body.firstChild);
    console.log("✅ [Agile Cat Picking Module] Overlay rendered with input refs.");
  }

  addParserAndGuiButtons();
})();
