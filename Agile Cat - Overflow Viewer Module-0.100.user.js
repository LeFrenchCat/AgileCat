// ==UserScript==
// @name         Agile Cat - Overflow Viewer Module
// @namespace    http://tampermonkey.net/
// @version      0.100
// @description  Overflow inventory viewer overlay for Agile Cat – send and retrieve are functionnal.
// @author       Pierre & Cat GPT
// @match        https://*.brightpearlapp.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
// Early Access
// Colour for overflow
// definitions for address
// Initial Deployment - 8 functions operationnal.


(function () {
  'use strict';

//Definitions

const serverAddress = "https://lechatagile.loca.lt";

  function renderTable(container, entries, withCheckbox = false) {
    const tableWrapper = document.createElement('div');
    tableWrapper.style.maxHeight = '350px';
    tableWrapper.style.overflowY = 'auto';
    tableWrapper.style.border = '1px solid #ccc';
    tableWrapper.style.borderRadius = '6px';

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.marginTop = '5px';

    const header = document.createElement('tr');
    if (withCheckbox) {
      const th = document.createElement('th');
      th.innerText = '✔';
      th.style.border = '1px solid #aaa';
      th.style.padding = '4px';
      header.appendChild(th);
    }
    ['SKU', 'Name', 'Option', 'Qty'].forEach(h => {
      const th = document.createElement('th');
      th.innerText = h;
      th.style.border = '1px solid #aaa';
      th.style.padding = '4px';
      header.appendChild(th);
    });
    table.appendChild(header);

    entries.forEach(item => {
      const tr = document.createElement('tr');
      if (withCheckbox) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.dataset.sku = item.sku;
        const td = document.createElement('td');
        td.appendChild(cb);
        td.style.border = '1px solid #ccc';
        td.style.padding = '4px';
        tr.appendChild(td);
      }
      [item.sku, item.name, item.p_option, item.qty].forEach(val => {
        const td = document.createElement('td');
        td.innerText = val;
        td.style.border = '1px solid #ccc';
        td.style.padding = '4px';
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    tableWrapper.innerHTML = '';
    tableWrapper.appendChild(table);
    container.innerHTML = '';
    container.appendChild(tableWrapper);
  }

  function positionDropdown(inputEl, dropdown) {
    const rect = inputEl.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.style.zIndex = 10002;
  }

  function loadInventoryForMove(locId, target, withCheckbox) {
    if (locId === 'main') {
      target.innerHTML = '<i>📦 Main Inventory is dynamically resolved when retrieved</i>';
      return;
    }

    fetch(`${serverAddress}/inventory/by-location?loc_id=${encodeURIComponent(locId)}`)
      .then(res => res.json())
      .then(data => {
        console.log('[Inventory Fetched]', data);

        if (!Array.isArray(data) || data.length === 0) {
          target.innerHTML = '<i>⚠️ No inventory found at this location.</i>';
          return;
        }

        const rows = data.map(r => ({
          sku: r.sku || r.p_sku || 'N/A',
          name: r.name || r.p_name || '',
          p_option: r.p_option || '',
          qty: r.qty ?? '0'
        }));

        renderTable(target, rows, withCheckbox);
      })
      .catch(err => {
        console.error('[Move Load Error]', err);
        target.innerHTML = '<div style="color:red;">❌ Failed to load inventory</div>';
      });
  }

  function renderMovePalletOverlay() {
    if (document.getElementById('agc-move-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'agc-move-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '1200px', maxHeight: '90%', overflow: 'auto', position: 'relative'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '❌';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer'
    });
    closeBtn.onclick = () => overlay.remove();

    const title = document.createElement('h2');
    title.innerText = 'Move / Merge Overflow Pallet';
    title.style.textAlign = 'center';

    const locationWrapper = document.createElement('div');
    locationWrapper.style.marginBottom = '15px';
    locationWrapper.style.display = 'flex';
    locationWrapper.style.alignItems = 'center';
    locationWrapper.style.justifyContent = 'space-between';
    locationWrapper.style.gap = '10px';

        const originInput = document.createElement('input');
    originInput.placeholder = 'Select origin location...';
    originInput.style.marginRight = '10px';
    originInput.style.padding = '6px';
    originInput.style.width = '100%';

    const destInput = document.createElement('input');
    destInput.placeholder = 'Select destination location or "Main Inventory"...';
    destInput.style.padding = '6px';
    destInput.style.width = '100%';

    const loadBtn = document.createElement('button');
    loadBtn.innerText = '📥 Load';
    loadBtn.style.marginLeft = '10px';
    loadBtn.style.padding = '6px';
    loadBtn.style.cursor = 'pointer';

    const originWrapper = document.createElement('div');
    originWrapper.style.flex = '1';
    const destWrapper = document.createElement('div');
    destWrapper.style.flex = '1';

    originWrapper.appendChild(originInput);
    destWrapper.appendChild(destInput);

    locationWrapper.appendChild(originWrapper);
    locationWrapper.appendChild(destWrapper);
    locationWrapper.appendChild(loadBtn);

    const contentWrapper = document.createElement('div');
    Object.assign(contentWrapper.style, {
      display: 'flex', gap: '20px', justifyContent: 'space-between'
    });

    const originTableWrap = document.createElement('div');
    const destTableWrap = document.createElement('div');
    originTableWrap.style.flex = '1';
    destTableWrap.style.flex = '1';
    originTableWrap.innerHTML = '<h3>Origin Contents</h3>';
    destTableWrap.innerHTML = '<h3>Destination Contents</h3>';

    const moveBtn = document.createElement('button');
    moveBtn.innerText = '🚚 Move / Merge';
    moveBtn.onclick = async () => {
      if (!originLoc || !originLoc.loc_id || originLoc.loc_id === destLoc?.loc_id) {
        alert('Please select different valid origin and destination locations.');
        return;
      }

      const checkboxes = originTableWrap.querySelectorAll('input[type="checkbox"]:checked');
      if (!checkboxes.length) {
        alert('Please select at least one item to move.');
        return;
      }

      const itemsToMove = Array.from(checkboxes).map(cb => cb.dataset.sku);

      const confirmMsg = destLoc.loc_id === 'main'
        ? `Move selected items back to Main Inventory?`
        : `Merge ${itemsToMove.length} SKU(s) into ${destLoc.loc_name}?`;

      if (!confirm(confirmMsg)) return;

      try {
        const response = await fetch(`${serverAddress}/move-pallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: originLoc.loc_id,
            destination: destLoc.loc_id,
            items: itemsToMove,
            user: (document.getElementById('profile-user-name')?.innerText.trim() || 'unlisted')
          })
        });

        const result = await response.json();
        if (result.success) {
          alert('✅ Pallet moved successfully.');
          overlay.remove();
        } else {
          alert('❌ Move failed: ' + result.error);
        }
      } catch (err) {
        console.error('[Move Error]', err);
        alert('❌ Network or server error while moving pallet.');
      }
    };
    Object.assign(moveBtn.style, {
      display: 'block', margin: '15px auto 0', padding: '10px 20px', fontSize: '16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
    });

    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(locationWrapper);
    panel.appendChild(contentWrapper);
    contentWrapper.appendChild(originTableWrap);
    contentWrapper.appendChild(destTableWrap);
    panel.appendChild(moveBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    let allLocations = [];
    let originLoc = null;
    let destLoc = null;

    function createDropdownFilter(inputEl, onSelect) {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.style.width = inputEl.style.width || '100%';
      inputEl.parentElement.replaceChild(wrapper, inputEl);
      wrapper.appendChild(inputEl);

      const dropdown = document.createElement('div');
      Object.assign(dropdown.style, {
        position: 'absolute',
        top: '100%',
        left: '0',
        background: 'white',
        border: '1px solid #ccc',
        maxHeight: '150px',
        overflowY: 'auto',
        zIndex: 10002,
        display: 'none',
        width: '100%',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.15)'
      });
      wrapper.appendChild(dropdown);

      let lastSelected = null;

      inputEl.addEventListener('input', () => {
        const query = inputEl.value.toLowerCase();
        dropdown.innerHTML = '';
        const matches = allLocations.filter(loc => loc.loc_name.toLowerCase().includes(query));
        matches.forEach(loc => {
          const item = document.createElement('div');
          item.textContent = loc.loc_name;
          item.style.padding = '5px';
          item.style.cursor = 'pointer';
          item.addEventListener('mousedown', e => {
            e.preventDefault();
            inputEl.value = loc.loc_name;
            dropdown.style.display = 'none';
            lastSelected = loc;
            onSelect(loc);
          });
          dropdown.appendChild(item);
        });
        positionDropdown(inputEl, dropdown);
        dropdown.style.display = matches.length > 0 ? 'block' : 'none';
      });

      inputEl.addEventListener('blur', () => {
        setTimeout(() => {
          dropdown.style.display = 'none';
          const match = allLocations.find(loc => loc.loc_name === inputEl.value);
          if (match && (!lastSelected || match.loc_id !== lastSelected.loc_id)) {
            onSelect(match);
          }
        }, 150);
      });
    }

    fetch(`${serverAddress}/locations`)
      .then(res => res.json())
      .then(data => {
        allLocations = data;
        allLocations.unshift({ loc_id: 'main', loc_name: '📦 Main Inventory' });
        createDropdownFilter(originInput, loc => originLoc = loc);
        createDropdownFilter(destInput, loc => destLoc = loc);
      })
      .catch(err => {
        console.error('[Location Fetch Failed]', err);
        originInput.placeholder = '⚠️ Failed to load locations';
        destInput.placeholder = '⚠️ Failed to load locations';
      });

    loadBtn.onclick = () => {
      if (!originLoc) {
        alert('Please select a valid origin location');
        return;
      }
      AGC_loadInventoryForMove(originLoc.loc_id, originTableWrap, true);

      if (destInput.value === '📦 Main Inventory') {
        destLoc = { loc_id: 'main', loc_name: '📦 Main Inventory' };
        destTableWrap.innerHTML = '<i>📦 Main Inventory is dynamically resolved when retrieved</i>';
      } else if (destLoc?.loc_id) {
        AGC_loadInventoryForMove(destLoc.loc_id, destTableWrap, false);
      } else {
        destLoc = null;
        destTableWrap.innerHTML = '<i>⚠️ Invalid destination location</i>';
      }
    };
  }



      window.AGC_openMovePalletOverlay = renderMovePalletOverlay;
  window.AGC_loadInventoryForMove = loadInventoryForMove;


async function findHomeLocationFromBrightpearl(sku) {
  const loader = document.createElement('img');
  loader.src = 'https://media.tenor.com/I6kN-6X7nhAAAAAj/cat-running.gif';
  loader.alt = 'Loading...';
  Object.assign(loader.style, {
    width: '48px',
    margin: '10px auto',
    display: 'block'
  });
  document.body.appendChild(loader);
  const url = `https://euw1.brightpearlapp.com/report.php?output-old=screen&report_type=product_list&report_submit=1&contact_id=0&invoice_ref=&contact_name_id=&contact_company_id=&sortby=&sort_dir=&isBundle=&isFeatured=&productGroupId=&search_products=${encodeURIComponent(sku)}&product_type_id=&multiselect_product_type_id=&brand_id=&multiselect_brand_id=&product_option=&multiselect_product_option=&productStatusId%5B%5D=DISCONTINUED&productStatusId%5B%5D=LIVE&multiselect_productStatusId=DISCONTINUED&multiselect_productStatusId=LIVE&suppliers_id=&multiselect_suppliers_id=&collectionId=&multiselect_collectionId=&warehouse_id=4&multiselect_warehouse_id=4&channel_is_connected=1&channel_id=&multiselect_channel_id=&price_lists%5B%5D=3&multiselect_price_lists=3&preset-name=&submit2=Filter&limit=50&results_from=1&results_to=6&output=screen`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const table = doc.querySelector('#product_list');
    if (!table) throw new Error('No table found');

    const headers = Array.from(table.querySelectorAll('thead tr th')).map(th =>
      th.textContent.trim().toLowerCase()
    );
console.log('[🐾 HEADER MAP]');
headers.forEach((text, i) => {
  console.log(`→ [${i}] "${text}"`);
});
      const locIndex = headers.findIndex(h => h.replace(/\s+/g, '').includes('location'));

    const skuIndex = headers.findIndex(h => h.includes('sku'));

    if (locIndex === -1 || skuIndex === -1) throw new Error('Missing headers');

    const rows = table.querySelectorAll('tbody tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      const rowSku = cells[skuIndex]?.textContent?.trim().replace(/\u00A0/g, '');
      if (rowSku === sku) {
        const location = cells[locIndex]?.textContent?.trim().replace(/\u00A0/g, '');
        loader.remove();
        return location || null;
      }
    }

    loader.remove();
    return null;
  } catch (err) {
    console.error('[Home Location Fetch Error]', err);
    loader.remove();
    return null;
  }
}

  function renderMovementLogOverlay(sku) {
    if (document.getElementById('agc-log-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'agc-log-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '1100px', maxHeight: '90%', overflow: 'auto', position: 'relative'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '❌';
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer'
    });
    closeBtn.onclick = () => overlay.remove();

    const title = document.createElement('h2');
    title.innerText = `Movement Log for SKU: ${sku}`;
    title.style.textAlign = 'center';

    const controls = document.createElement('div');
    controls.style.marginBottom = '10px';

    const actionSelect = document.createElement('select');
    const staffSelect = document.createElement('select');
    ['All', 'send', 'retrieve'].forEach(action => {
      const opt = document.createElement('option');
      opt.value = action;
      opt.innerText = action;
      actionSelect.appendChild(opt);
    });

    controls.appendChild(document.createTextNode('Action: '));
    controls.appendChild(actionSelect);
    controls.appendChild(document.createTextNode(' Staff: '));
    controls.appendChild(staffSelect);

    const tableContainer = document.createElement('div');
    tableContainer.style.marginTop = '10px';

    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(controls);
    panel.appendChild(tableContainer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    fetch(`${serverAddress}/movements?sku=${encodeURIComponent(sku)}`)
      .then(res => res.json())
      .then(data => {
        const uniqueStaff = [...new Set(data.map(entry => entry.staff || 'unlisted'))];
        staffSelect.innerHTML = '<option value="All">All</option>';
        uniqueStaff.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.innerText = name;
          staffSelect.appendChild(opt);
        });

        function renderTable() {
          const filtered = data.filter(entry => {
            const actionMatch = actionSelect.value === 'All' || entry.action === actionSelect.value;
            const staffMatch = staffSelect.value === 'All' || entry.staff === staffSelect.value;
            return actionMatch && staffMatch;
          });

          const table = document.createElement('table');
          table.style.borderCollapse = 'collapse';
          table.style.width = '100%';

          const headerRow = document.createElement('tr');
          ['Timestamp', 'Action', 'SKU', 'Name', 'Option', 'Location', 'Qty', 'Staff', 'Note'].forEach(h => {
            const th = document.createElement('th');
            th.innerText = h;
            Object.assign(th.style, { border: '1px solid #aaa', padding: '6px', background: '#eee' });
            headerRow.appendChild(th);
          });
          table.appendChild(headerRow);

          filtered.forEach(entry => {
            const tr = document.createElement('tr');
            [entry.timestamp, entry.action, entry.p_sku, entry.p_name, entry.p_option, entry.location, entry.qty, entry.staff, entry.note || ''].forEach(val => {
              const td = document.createElement('td');
              td.innerText = val;
              td.style.border = '1px solid #ccc';
              td.style.padding = '5px';
              tr.appendChild(td);
            });
            table.appendChild(tr);
          });

          tableContainer.innerHTML = '';
          tableContainer.appendChild(table);
        }

        actionSelect.onchange = renderTable;
        staffSelect.onchange = renderTable;
        renderTable();
      })
      .catch(err => {
        console.error('[Log Viewer Error]', err);
        tableContainer.innerHTML = '<div style="color:red;">❌ Failed to load log data</div>';
      });
  }

function handleProductListPage() {
    const url = window.location.href;
    if (!url.includes('report_type=product_list')) return;

    const table = document.querySelector('table#product_list');
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    if (headerRow && !headerRow.querySelector('th:last-child').innerText.includes('Overflow')) {
      const th = document.createElement('th');
      th.innerText = 'Overflow';
      th.style.background = '#f6f6f6';
      th.style.borderLeft = '1px solid #ddd';
      headerRow.appendChild(th);
    }

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    for (let i = 0; i < rows.length; i += 2) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');

      const sku = cells[1]?.innerText.replace(/ /g, '').trim();
      const name = cells[2]?.querySelector('a')?.innerText.trim() || '';
      // Clean up the option field to remove GUI artifacts
      // Clean up the option field to remove GUI artifacts
      let option = cells[3]?.innerText.trim() || '';
      option = option.replace(/edit variants.*$/i, '').trim();
      option = option.replace(/create variants.*$/i, '').trim();
      option = option.replace(/Option*$/i, '').trim();
      const btnTd = document.createElement('td');
      btnTd.style.borderLeft = '1px solid #ddd';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerText = '📦';
      btn.title = 'Open Overflow Panel';
      Object.assign(btn.style, {
        padding: '1px 6px',
        fontSize: '14px',
        background: '#ff9800',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer'
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Overflow Trigger - product_list]', { sku, name, option });
        showOverflowOverlay(sku, name, option);
      });

      btnTd.appendChild(btn);
      row.appendChild(btnTd);
fetch(`${serverAddress}/inventory?sku=${encodeURIComponent(sku)}`)
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      // SKU exists in overflow – turn green
      btn.style.background = '#4caf50';
    } else {
      // SKU not found – keep original or dim
      btn.style.background = '#aaa';
    }
  })
  .catch(err => {
    console.error('[Overflow Button] Failed to check inventory:', err);
    // Optional: mark as unavailable
    btn.style.background = '#999';
  });

      const additionalRow = rows[i + 1];
      if (additionalRow) {
        const emptyTd = document.createElement('td');
        emptyTd.style.borderLeft = '1px solid #ddd';
        additionalRow.appendChild(emptyTd);
      }
    }
  }
function renderServerOfflineOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'agc-overflow-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    color: '#eee',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    textAlign: 'center'
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerText = '❌';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'transparent',
    color: '#ccc',
    fontSize: '20px',
    border: 'none',
    cursor: 'pointer'
  });
  closeBtn.onclick = () => overlay.remove();

  const img = document.createElement('img');
  img.src = 'https://media1.tenor.com/m/Vyg73kR334sAAAAC/jurassic-park-ah.gif'; // Cute sleeping cat
  img.alt = 'Sleeping cat';
  img.style.width = '128px';
  img.style.marginBottom = '20px';

  const msg = document.createElement('div');
  msg.innerText = 'Server Offline 💤\nPlease check your connection.';
  msg.style.fontSize = '18px';
  msg.style.whiteSpace = 'pre-line';

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  overlay.appendChild(msg);
  document.body.appendChild(overlay);
}

function showOverflowOverlay(sku = '', name = '', option = '') {
  const existing = document.getElementById('agc-overflow-overlay');
  if (existing) existing.remove();



  // First: Check server status
  fetch(`${serverAddress}/ping`, { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error('Ping failed');
      return res.json();
    })
    .then(() => {
      renderOverflowOverlayMain(sku, name, option);
    })
    .catch(() => {
      renderServerOfflineOverlay();
    });

  }


function renderOverflowOverlayMain(sku, name, option){

        console.log('[Overlay Opened] Showing options for', { sku, name, option });

    const overlay = document.createElement('div');
    overlay.id = 'agc-overflow-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      width: '600px',
      minHeight: '300px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      position: 'relative'
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.innerText = '❌';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      border: 'none',
      background: 'transparent',
      fontSize: '18px',
      cursor: 'pointer'
    });
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.remove();
    });



    const title = document.createElement('h2');
    title.innerText = 'Agile Cat Overflow System';
    title.style.marginBottom = '20px';
    title.style.textAlign = 'center';

    const subtitle = document.createElement('div');
    subtitle.innerText = `SKU: ${sku} | Name: ${name} | Option: ${option}`;
    subtitle.style.textAlign = 'center';
    subtitle.style.marginBottom = '15px';
    subtitle.style.fontSize = '14px';
    subtitle.style.color = '#555';

    const buttonGrid = document.createElement('div');
    Object.assign(buttonGrid.style, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px'
    });

    const buttons = [
      'Send to',
      'Retrieve',
      'Search by Location',
      'Search by Item',
      'Move Pallet',
      'Movements Log'
    ];

buttons.forEach(label => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.innerText = label;

  const isEnabled = ['Search by Location', 'Search by Item', 'Send to','Retrieve','Movements Log','Move Pallet'].includes(label);
  btn.disabled = !isEnabled;

  Object.assign(btn.style, {
    padding: '10px',
    fontSize: '14px',
    cursor: isEnabled ? 'pointer' : 'not-allowed',
    background: isEnabled ? '#2196f3' : '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '4px'
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`[Viewer Triggered] ${label}`);

    if (label === 'Search by Item') {
      renderSearchByItemViewer();
    } else if (label === 'Search by Location') {
      renderSearchByLocationViewer();
    } else if (label === 'Send to') {
      renderSendToOverlay(sku, name, option);
    } else if (label === 'Retrieve') {
  renderRetrieveOverlay(sku, name, option);
    } else if (label === 'Movements Log') {
   renderMovementLogOverlay(sku);
    } else if (label === 'Move Pallet') {
   renderMovePalletOverlay();

    }else {
      alert(`coming soon!`);
    }
  });

  buttonGrid.appendChild(btn);
});


    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(buttonGrid);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // 👉 Immediately load related inventory data for the clicked SKU
fetch(`${serverAddress}/inventory?sku=${encodeURIComponent(sku)}`)
  .then(res => res.json())
  .then(data => {
    console.log('[MySQL Fetch Success]', data);
    const table = renderInventoryTable(data);
    const panel = document.querySelector('#agc-overflow-overlay > div');
    const existing = panel.querySelector('.agc-sku-table');
    if (existing) existing.remove();
    panel.appendChild(table);
  })
  .catch(err => {
    console.error('[MySQL Fetch Error]', err);
    const failMsg = [{ sku, name, p_option: option, location: '⚠️', qty: 'Connection failed' }];
    const table = renderInventoryTable(failMsg);
    const panel = document.querySelector('#agc-overflow-overlay > div');
    const existing = panel.querySelector('.agc-sku-table');
    if (existing) existing.remove();
    panel.appendChild(table);
  });

};

function renderRetrieveOverlay(sku, name, option) {
  if (document.getElementById('agc-retrieve-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'agc-retrieve-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '650px',
    minHeight: '300px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    position: 'relative'
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.innerText = '❌';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer'
  });
  closeBtn.onclick = () => overlay.remove();

  const title = document.createElement('h2');
  title.innerText = 'Retrieve from Overflow';
  title.style.textAlign = 'center';

  const info = document.createElement('div');
  info.innerText = `SKU: ${sku} | Name: ${name} | Option: ${option}`;
  info.style.textAlign = 'center';
  info.style.marginBottom = '5px';

  const homeLoc = document.createElement('div');
homeLoc.innerText = '📦 Home Location: (loading...)';
findHomeLocationFromBrightpearl(sku).then(location => {
  homeLoc.innerText = `📦 Home Location: ${location || 'Not found'}`;
}).catch(err => {
  homeLoc.innerText = '📦 Home Location: ❌ Error';
});


  const tableContainer = document.createElement('div');
  tableContainer.style.marginTop = '10px';

  // Load data
function loadRetrieveTable() {
  fetch(`${serverAddress}/inventory?sku=${encodeURIComponent(sku)}`)
    .then(res => res.json())
    .then(data => {
      console.log('[Reloaded inventory]', data);

      if (!Array.isArray(data) || data.length === 0) {
        tableContainer.innerHTML = '<div style="color:red;">❌ No overflow inventory found</div>';
        return;
      }

      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';

      const header = document.createElement('tr');
      ['Location', 'Qty', 'Retrieve', ''].forEach(h => {
        const th = document.createElement('th');
        th.innerText = h;
        Object.assign(th.style, {
          border: '1px solid #aaa',
          padding: '6px',
          background: '#eee'
        });
        header.appendChild(th);
      });
      table.appendChild(header);

      data.forEach(entry => {
        console.log('[Entry]', entry);  // 🔍 log each entry with loc_id

        const row = document.createElement('tr');

        ['location', 'qty'].forEach(key => {
          const td = document.createElement('td');
          td.innerText = entry[key];
          td.style.border = '1px solid #ccc';
          td.style.padding = '5px';
          row.appendChild(td);
        });

        const inputTd = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 1;
        input.style.width = '60px';
        input.style.padding = '3px';
        inputTd.appendChild(input);
        inputTd.style.border = '1px solid #ccc';
        row.appendChild(inputTd);

        const btnTd = document.createElement('td');
        const btn = document.createElement('button');
        btn.innerText = 'Collect';
        Object.assign(btn.style, {
          padding: '4px 8px',
          background: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        });

        btn.onclick = () => {
          const qty = parseInt(input.value);
          if (isNaN(qty) || qty <= 0) {
            alert('Enter a valid quantity to retrieve.');
            return;
          }

          console.log('[Retrieve Submit]', {
            sku: sku,
            loc_id: entry.loc_id,
            qty
          });

          if (!confirm(`Retrieve ${qty} from ${entry.location}?`)) return;
          let currentUser = document.querySelector('#profile-user-name')?.innerText.trim() || 'unlisted';
          fetch(`${serverAddress}/retrieve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            sku: sku,
                loc_id: entry.loc_id,
                qty: qty,
                staff: currentUser
})
          })
            .then(res => res.json())
            .then(result => {
              if (result.success) {
                alert(result.message);
                loadRetrieveTable(); // refresh
              } else {
                alert('❌ ' + (result.error || 'Unknown error'));
              }
            })
            .catch(err => {
              console.error('[Retrieve Error]', err);
              alert('❌ Retrieve request failed.');
            });
        };

        btnTd.appendChild(btn);
        btnTd.style.border = '1px solid #ccc';
        row.appendChild(btnTd);
        table.appendChild(row);
      });

      tableContainer.innerHTML = '';
      tableContainer.appendChild(table);
    })
    .catch(err => {
      console.error('[Inventory Fetch Error]', err);
      tableContainer.innerHTML = '<div style="color:red;">❌ Failed to load inventory</div>';
    });
}


  loadRetrieveTable();

  panel.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(info);
  panel.appendChild(homeLoc);
  panel.appendChild(tableContainer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}






function renderSearchByItemViewer() {
  if (document.getElementById('agc-item-overlay')) return;

  console.log('[Search by Item] Initializing viewer overlay...');

  const overlay = document.createElement('div');
  overlay.id = 'agc-item-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '600px',
    minHeight: '300px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    position: 'relative'
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.innerText = '❌';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer'
  });
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    overlay.remove();
  });

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Enter SKU or Product Name';
  searchInput.style.marginRight = '10px';
  searchInput.style.padding = '5px';
  searchInput.style.width = '60%';

  const searchBtn = document.createElement('button');
  searchBtn.innerText = 'Search';
  searchBtn.style.padding = '6px 12px';
  searchBtn.style.background = '#4caf50';
  searchBtn.style.color = 'white';
  searchBtn.style.border = 'none';
  searchBtn.style.borderRadius = '4px';
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    console.log(`[Search by Item] Searching for: '${query}'`);

    // Placeholder for now — replace with fetch() to backend later
 const existing = panel.querySelector('.agc-item-table');
if (existing) existing.remove();

fetch(`${serverAddress}/search?q=${encodeURIComponent(query)}`)
  .then(res => res.json())
  .then(data => {
    const results = Array.isArray(data) && data.length > 0 ? data : [{
      sku: '⚠️', name: '-', p_option: '-', location: '-', qty: 'No match'
    }];

    const table = renderInventoryTableWithActions(results);
    table.classList.add('agc-item-table');
    panel.appendChild(table);
  })
  .catch(err => {
    console.error('[Search by Item] Fetch error', err);
    const failMsg = [{
      sku: '⚠️', name: '-', p_option: '-', location: '-', qty: 'Connection failed'
    }];
    const table = renderInventoryTableWithActions(failMsg);
    table.classList.add('agc-item-table');
    panel.appendChild(table);
  });

  });

  panel.appendChild(closeBtn);
  panel.appendChild(searchInput);
  panel.appendChild(searchBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}


  function renderInventoryTable(entries) {
    const target = document.querySelector('#agc-overflow-overlay > div');
    if (!target) return;
    if (!Array.isArray(entries)) {
      console.warn('[renderInventoryTable] Expected array but got:', entries);
      entries = [{ sku: '⚠️', name: '-', p_option: '-', location: '-', qty: 'No data' }];
    }
    console.log('[Search by Item] Rendering table for entries:', entries);

    const existing = target.querySelector('.agc-sku-table');
    if (existing) existing.remove();

const scrollWrapper = document.createElement('div');
Object.assign(scrollWrapper.style, {
  maxHeight: '250px',
  overflowY: 'auto',
  marginTop: '15px'
});

const table = document.createElement('table');
table.className = 'agc-sku-table';
table.style.borderCollapse = 'collapse';
table.style.width = '100%';

    const headerRow = document.createElement('tr');
    ['SKU', 'Name', 'Option', 'Location', 'Qty'].forEach(label => {
      const th = document.createElement('th');
      th.innerText = label;
      Object.assign(th.style, {
        border: '1px solid #aaa',
        padding: '6px',
        background: '#eee'
      });
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    entries.forEach(entry => {
      const tr = document.createElement('tr');
      [entry.sku, entry.name, entry.p_option, entry.location, entry.qty].forEach(value => {
        const td = document.createElement('td');
        td.innerText = value;
        td.style.border = '1px solid #ddd';
        td.style.padding = '5px';
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

scrollWrapper.appendChild(table);
return scrollWrapper;
  }

  function renderSearchByLocationViewer() {
    if (document.getElementById('agc-location-overlay')) return;

    console.log('[Search by Location] Initializing viewer overlay...');

    const overlay = document.createElement('div');
    overlay.id = 'agc-location-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10001
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      width: '600px',
      minHeight: '300px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      position: 'relative'
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.innerText = '❌';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '10px',
      right: '10px',
      border: 'none',
      background: 'transparent',
      fontSize: '18px',
      cursor: 'pointer'
    });
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.remove();
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Enter location (e.g. A.5.R.2)';
    searchInput.style.marginRight = '10px';
    searchInput.style.padding = '5px';
    searchInput.style.width = '60%';

    const searchBtn = document.createElement('button');
    searchBtn.innerText = 'Search';
    searchBtn.style.padding = '6px 12px';
    searchBtn.style.background = '#4caf50';
    searchBtn.style.color = 'white';
    searchBtn.style.border = 'none';
    searchBtn.style.borderRadius = '4px';
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      console.log(`[Search by Location] Searching for: '${query}'`);

 const existing = panel.querySelector('.agc-location-table');
if (existing) existing.remove();

fetch(`${serverAddress}/location?loc=${encodeURIComponent(query)}`)
  .then(res => res.json())
  .then(data => {
    const results = Array.isArray(data) && data.length > 0 ? data : [{
      sku: '⚠️', name: '-', p_option: '-', location: query, qty: 'No match'
    }];
    const table = renderInventoryTableWithActions(results);
    table.classList.add('agc-location-table');
    panel.appendChild(table);
  })
  .catch(err => {
    console.error('[Search by Location] Fetch error', err);
    const failMsg = [{
      sku: '⚠️', name: '-', p_option: '-', location: query, qty: 'Connection failed'
    }];
    const table = renderInventoryTableWithActions(failMsg);
    table.classList.add('agc-location-table');
    panel.appendChild(table);
  });
    });

    panel.appendChild(closeBtn);
    panel.appendChild(searchInput);
    panel.appendChild(searchBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function renderInventoryTableWithActions(entries) {
    if (!Array.isArray(entries)) {
      console.warn('[renderInventoryTableWithActions] Expected array but got:', entries);
      entries = [{ sku: '⚠️', name: '-', p_option: '-', location: '-', qty: 'No data' }];
    }

    console.log('[Search by Location] Rendering table for entries:', entries);

const scrollWrapper = document.createElement('div');
Object.assign(scrollWrapper.style, {
  maxHeight: '250px',
  overflowY: 'auto',
  marginTop: '15px'
});

const table = document.createElement('table');



    const headerRow = document.createElement('tr');
    ['SKU', 'Name', 'Option', 'Location', 'Qty', 'Retrieve'].forEach(label => {
      const th = document.createElement('th');
      th.innerText = label;
      Object.assign(th.style, {
        border: '1px solid #aaa',
        padding: '6px',
        background: '#eee'
      });
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    entries.forEach(entry => {
      const tr = document.createElement('tr');

      [entry.sku, entry.name, entry.p_option, entry.location, entry.qty].forEach(value => {
        const td = document.createElement('td');
        td.innerText = value;
        td.style.border = '1px solid #ddd';
        td.style.padding = '5px';
        tr.appendChild(td);
      });

      const actionTd = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.style.width = '50px';
      input.style.marginRight = '5px';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerText = 'Retrieve';
      btn.disabled = true;
      Object.assign(btn.style, {
        padding: '4px 8px',
        background: '#999',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed'
      });

      actionTd.appendChild(input);
      actionTd.appendChild(btn);
      tr.appendChild(actionTd);
      table.appendChild(tr);
    });

scrollWrapper.appendChild(table);
return scrollWrapper;
  }

function renderSendToOverlay(sku, name, option) {
  if (document.getElementById('agc-send-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'agc-send-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '650px',
    minHeight: '300px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
    position: 'relative'
  });

  const closeBtn = document.createElement('button');
  closeBtn.innerText = '❌';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'transparent',
    color: '#000',
    fontSize: '18px',
    border: 'none',
    cursor: 'pointer'
  });
  closeBtn.onclick = () => overlay.remove();

  const title = document.createElement('h2');
  title.innerText = 'Send to Overflow';
  title.style.textAlign = 'center';

  const info = document.createElement('div');
  info.innerText = `SKU: ${sku} | Name: ${name} | Option: ${option}`;
  info.style.textAlign = 'center';
  info.style.marginBottom = '15px';

  const formRow = document.createElement('div');
  Object.assign(formRow.style, {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    position: 'relative',
    flexWrap: 'wrap'
  });

  const locationInput = document.createElement('input');
  locationInput.type = 'text';
  locationInput.placeholder = 'Search location';
  locationInput.style.flex = '2';
  locationInput.style.padding = '5px';

  const dropdown = document.createElement('div');
  Object.assign(dropdown.style, {
    position: 'absolute',
    top: '42px',
    left: '0',
    right: '0',
    background: 'white',
    border: '1px solid #ccc',
    maxHeight: '150px',
    overflowY: 'auto',
    zIndex: 10002,
    display: 'none'
  });

  let selectedLocId = null;
  let allLocations = [];

  locationInput.addEventListener('input', () => {
    const query = locationInput.value.toLowerCase();
    dropdown.innerHTML = '';
    selectedLocId = null;

    const filtered = allLocations.filter(loc => loc.loc_name.toLowerCase().includes(query));
    filtered.forEach(loc => {
      const item = document.createElement('div');
      item.textContent = loc.loc_name;
      item.style.padding = '5px';
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        locationInput.value = loc.loc_name;
        selectedLocId = loc.loc_id;
        dropdown.style.display = 'none';
      });
      dropdown.appendChild(item);
    });

    dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
  });

  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.min = 1;
  qtyInput.placeholder = 'Qty';
  qtyInput.style.flex = '1';
  qtyInput.style.padding = '5px';

  const sendBtn = document.createElement('button');
  sendBtn.innerText = 'Send to Overflow';
  Object.assign(sendBtn.style, {
    padding: '6px 12px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  });

  formRow.appendChild(locationInput);
  formRow.appendChild(qtyInput);
  formRow.appendChild(sendBtn);
  formRow.appendChild(dropdown);

  const tableContainer = document.createElement('div');
  tableContainer.style.marginTop = '20px';

  fetch(`${serverAddress}/locations`)
    .then(res => res.json())
    .then(data => {
      allLocations = data;
      dropdown.innerHTML = ''; // prepared but hidden until typed
    })
    .catch(err => {
      console.error('[Location Load Error]', err);
      locationInput.placeholder = '⚠️ Location load failed';
    });

  sendBtn.onclick = () => {
    const loc_id = selectedLocId;
    const qty = parseInt(qtyInput.value);

    if (!loc_id || isNaN(qty) || qty <= 0) {
      alert('Please select a location and enter a valid quantity.');
      return;
    }

    const loc_name = locationInput.value;
    if (!confirm(`Send ${qty} units of ${sku} to ${loc_name}?`)) return;
    let currentUser = document.querySelector('#profile-user-name')?.innerText.trim() || 'unlisted';

    fetch(`${serverAddress}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, loc_id, qty, name, option, staff: currentUser })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          alert(result.message);
          loadInventoryTableForSend(tableContainer, sku);
        } else {
          alert('❌ Error: ' + (result.error || 'Unknown failure'));
        }
      })
      .catch(err => {
        console.error('[Send Error]', err);
        alert('❌ Failed to send item.');
      });
  };

  function loadInventoryTableForSend(container, sku) {
    fetch(`${serverAddress}/inventory?sku=${encodeURIComponent(sku)}`)
      .then(res => res.json())
      .then(data => {
        const table = renderInventoryTableWithActions(data);
        container.innerHTML = '';
        container.appendChild(table);
      })
      .catch(err => {
        container.innerHTML = '<div style="color:red;">❌ Failed to load inventory</div>';
        console.error('[Inventory Fetch Error]', err);
      });
  }

  loadInventoryTableForSend(tableContainer, sku);

  panel.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(info);
  panel.appendChild(formRow);
  panel.appendChild(tableContainer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}





  handleProductListPage();
})();
