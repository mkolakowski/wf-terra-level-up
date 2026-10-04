(() => {
  'use strict';

  const CDN = 'https://cdn.warframestat.us/img/';
  const MARKET = 'https://warframe.market/items/';
  const TIER_ORDER = { Lith: 0, Meso: 1, Neo: 2, Axi: 3, Requiem: 4 };
  const RARITY_ORDER = { Rare: 0, Uncommon: 1, Common: 2 };
  const REFINES = ['Intact', 'Exceptional', 'Flawless', 'Radiant'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');

  let tracker, data, gear, nodes;
  const state = { filter: 'all', sort: 'default', q: '', tier: 'all' };

  // ---------- helpers ----------
  function img(d, cls = '') {
    if (!d || !d.image) return `<div class="ph">${esc(d ? d.name : '?')}</div>`;
    const fb = d.wikiImage ? ` data-fallback="${esc(d.wikiImage)}"` : '';
    return `<img class="${cls}" loading="lazy" alt="${esc(d.name)}" src="${CDN}${encodeURIComponent(d.image)}"${fb}>`;
  }
  // Image fallback: warframestat CDN -> wiki thumbnail -> text placeholder
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (el.tagName !== 'IMG') return;
    if (el.dataset.fallback) {
      el.src = el.dataset.fallback;
      delete el.dataset.fallback;
    } else {
      el.replaceWith(Object.assign(document.createElement('div'), { className: 'ph', textContent: el.alt }));
    }
  }, true);

  const remainingXP = (g) => Math.max(0, g.d.masteryXP - (g.rank || 0) * g.d.xpPerRank);
  const needsParts = (g) => !g.owned && !g.done;
  const kind = (d) => {
    if (d.category === 'Warframes') return 'Warframe';
    if (d.type === 'K-Drive Component') return 'K-Drive';
    if (d.category === 'Arch-Gun' || d.category === 'Arch-Melee') return d.category;
    return d.category === 'Melee' ? 'Melee' : d.category;
  };
  const relicLabel = (r) => {
    const title = REFINES.filter((k) => r.chances[k] != null).map((k) => `${k}: ${r.chances[k]}%`).join(' · ');
    return `<span class="relic r-${esc(r.rarity)}" title="${esc(title)}">${esc(r.relic)} · ${esc(r.rarity)}</span>`;
  };
  const marketLink = (p) => p.market ? `<a href="${MARKET}${esc(p.market)}" target="_blank" rel="noopener">trade</a>` : '';
  const buildTime = (s) => {
    if (!s) return '';
    const h = Math.round(s / 3600);
    return h >= 24 ? `${Math.round(h / 24)}d` : `${h}h`;
  };

  function autoTip(g) {
    const d = g.d;
    if (g.owned) return '';
    if (d.isPrime && d.vaulted) {
      return 'Vaulted: its relics no longer drop. Grab the relics or parts from Varzia\'s Prime Resurgence (Maroo\'s Bazaar, Mars) when it rotates in, or trade for the parts/set on warframe.market.';
    }
    if (d.isPrime) {
      const hasRelics = d.parts.some((p) => p.relics.length);
      if (hasRelics) {
        const rare = d.parts.filter((p) => p.relics.length && p.relics.every((r) => r.rarity === 'Rare')).map((p) => p.name);
        return 'Not vaulted, so the relics below are farmable now.' + (rare.length ? ` ${rare.join(' & ')} ${rare.length > 1 ? 'are' : 'is'} Rare-only: refine those relics to Radiant (100 Void Traces) for a 10% chance and crack them in a squad.` : ' Crack relics in a 4-player squad to get 4 shots at the part.');
      }
      const loc = d.parts.flatMap((p) => p.otherDrops).map((o) => o.location)[0];
      return loc ? `Parts don't come from relics - they drop from ${loc} and similar missions (see parts below).` : '';
    }
    return '';
  }

  // ---------- render: overview ----------
  function renderOverview() {
    const p = tracker.player;
    const todo = gear.filter((g) => !g.done);
    const nodesLeft = nodes.filter((n) => !n.done);
    const xpLeft = todo.reduce((s, g) => s + remainingXP(g), 0);
    const primeParts = primePartRows();
    const relicsNeeded = new Set(primeParts.flatMap((r) => r.part.relics.map((x) => x.relic)));
    const owned = todo.filter((g) => g.owned);

    let progress;
    if (p.currentXP != null) {
      const pct = Math.min(100, (p.currentXP / p.goalXP) * 100);
      const left = Math.max(0, p.goalXP - p.currentXP);
      progress = `
        <div class="bar" role="progressbar" aria-valuenow="${pct.toFixed(1)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
        <div class="hero-top small"><span>${fmt(p.currentXP)} / ${fmt(p.goalXP)} mastery XP${p.currentRankLabel ? ` · currently ${esc(p.currentRankLabel)}` : ''}</span><span>${pct.toFixed(1)}%</span></div>
        <div class="notice">${left === 0 ? 'Goal reached!' : `<b>${fmt(left)}</b> XP to go. The gear on this list is worth <b>${fmt(xpLeft)}</b> XP${xpLeft >= left ? ' - enough to get there.' : ' - star chart / Steel Path nodes and intrinsics make up the rest.'}`}</div>`;
    } else {
      progress = `<div class="notice">Current mastery XP hasn't been entered yet. Once it's added, this shows a progress bar toward ${fmt(p.goalXP)} XP (Legendary 6).</div>`;
    }

    $('#overview').innerHTML = `
      <div class="hero">
        <div class="hero-top">
          <div>
            <div class="muted small">${esc(p.name)} · ${esc(p.founder)} Founder</div>
            <div class="hero-goal">${esc(p.goal)}</div>
          </div>
          <div class="muted small">Updated ${esc(tracker.lastUpdated)}</div>
        </div>
        ${progress}
      </div>
      <div class="stats">
        <div class="stat"><b>${todo.length}</b><span>items left to master</span></div>
        <div class="stat"><b>${fmt(xpLeft)}</b><span>mastery XP in those items</span></div>
        <div class="stat"><b>${nodesLeft.length}</b><span>star chart nodes left</span></div>
        <div class="stat"><b>${primeParts.length}</b><span>prime parts to collect</span></div>
        <div class="stat"><b>${relicsNeeded.size}</b><span>different relics involved</span></div>
        <div class="stat"><b>${gear.filter((g) => g.done).length + nodes.filter((n) => n.done).length}</b><span>mastered since tracking</span></div>
      </div>

      <h2>Quick wins</h2>
      <div class="quick">
        <div class="q"><h3>Already owned - just level</h3>
          ${owned.length ? `<ol>${owned.map((g) => `<li>${esc(g.name)} <span class="muted">(${fmt(remainingXP(g))} XP)</span></li>`).join('')}</ol>` : '<p class="muted small">Nothing owned and unranked right now.</p>'}
        </div>
        <div class="q"><h3>Star chart nodes</h3>
          <ol>${nodesLeft.filter((n) => !n.locked).map((n) => `<li>${esc(n.name)}, ${esc(n.planet)} <span class="muted">(${esc(n.d ? n.d.mission : '')})</span></li>`).join('')}</ol>
          <p class="muted small">Then ${nodesLeft.filter((n) => n.locked).map((n) => esc(n.name)).join(' & ')} unlock.</p>
        </div>
        <div class="q"><h3>Biggest XP left</h3>
          <ol>${[...todo].sort((a, b) => remainingXP(b) - remainingXP(a)).slice(0, 6).map((g) => `<li>${esc(g.name)} <span class="muted">(${fmt(remainingXP(g))})</span></li>`).join('')}</ol>
        </div>
      </div>`;
  }

  // ---------- render: gear ----------
  const FILTERS = [
    ['all', 'All'], ['owned', 'Owned'], ['prime', 'Prime'], ['vaulted', 'Vaulted'], ['nonprime', 'Non-prime'],
    ['frame', 'Warframes'], ['weapon', 'Weapons'], ['arch', 'Arch / K-Drive'],
  ];
  function gearMatches(g) {
    const d = g.d;
    const k = kind(d);
    switch (state.filter) {
      case 'owned': if (!g.owned) return false; break;
      case 'prime': if (!d.isPrime) return false; break;
      case 'vaulted': if (!d.vaulted) return false; break;
      case 'nonprime': if (d.isPrime) return false; break;
      case 'frame': if (k !== 'Warframe') return false; break;
      case 'weapon': if (!['Primary', 'Secondary', 'Melee'].includes(k)) return false; break;
      case 'arch': if (!['Arch-Gun', 'Arch-Melee', 'K-Drive'].includes(k)) return false; break;
    }
    if (state.q) {
      const hay = [g.name, d.type, d.category, ...d.parts.flatMap((p) => p.relics.map((r) => r.relic))].join(' ').toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    return true;
  }

  function partsHTML(g) {
    const d = g.d;
    // When every non-relic part shares the same drop list, show it once instead of per part
    const dropKey = (p) => p.otherDrops.map((o) => o.location).join('|');
    const shared = d.parts.length > 1 && d.parts.every((p) => !p.relics.length && p.otherDrops.length && dropKey(p) === dropKey(d.parts[0]));
    const sharedHTML = shared ? `<div class="part"><div class="part-name"><span>All parts drop from</span></div><ul class="drops">${d.parts[0].otherDrops.slice(0, 4).map((o) => `<li>${esc(o.location)} <span>(${o.chance}% each)</span></li>`).join('')}</ul></div>` : '';
    const parts = sharedHTML + d.parts.map((p) => shared ? `
      <div class="part"><div class="part-name"><span>${esc(p.name)}${p.count > 1 ? ` ×${p.count}` : ''}</span><span class="muted small">${p.ducats ? `${p.ducats} ducats ` : ''}${marketLink(p)}</span></div></div>` : `
      <div class="part">
        <div class="part-name"><span>${esc(p.name)}${p.count > 1 ? ` ×${p.count}` : ''}</span><span class="muted small">${p.ducats ? `${p.ducats} ducats ` : ''}${marketLink(p)}</span></div>
        ${p.relics.length ? `<div class="relics">${p.relics.map(relicLabel).join('')}</div>` : ''}
        ${!p.relics.length && p.otherDrops.length ? `<ul class="drops">${p.otherDrops.slice(0, 4).map((o) => `<li>${esc(o.location)} <span>(${o.chance}%)</span></li>`).join('')}</ul>` : ''}
        ${!p.relics.length && !p.otherDrops.length ? '<div class="muted small">Market / quest / vendor - see tip or wiki.</div>' : ''}
      </div>`).join('');
    const req = d.requiresItems.length ? `<p><b>Also needs:</b> ${d.requiresItems.map((r) => `${r.count}× ${esc(r.name)}`).join(', ')}</p>` : '';
    const res = d.resources.length || d.buildPrice ? `<div><b>Resources</b><div class="res-list">
        ${d.buildPrice ? `<span class="res">${fmt(d.buildPrice)} credits</span>` : ''}
        ${d.resources.map((r) => `<span class="res">${fmt(r.count)}× ${esc(r.name)}</span>`).join('')}
        ${d.buildTime ? `<span class="res">${buildTime(d.buildTime)} build</span>` : ''}
      </div></div>` : '';
    return `${parts}${req}${res}<p class="small"><a href="${esc(d.wiki)}" target="_blank" rel="noopener">Wiki page →</a></p>`;
  }

  function gearCard(g) {
    const d = g.d;
    const k = kind(d);
    const tip = g.tip || autoTip(g);
    const rank = g.rank != null ? `
      <div class="bar thin"><span style="width:${(g.rank / d.maxRank) * 100}%"></span></div>
      <div class="rankline"><span>Rank ${g.rank} / ${d.maxRank}</span><span>${fmt(remainingXP(g))} XP left</span></div>` : '';
    const showParts = needsParts(g) && (d.parts.length || d.resources.length);
    return `
      <article class="card">
        <div class="card-head">
          <div class="thumb">${img(d)}</div>
          <div class="card-title">
            <h3><a href="${esc(d.wiki)}" target="_blank" rel="noopener">${esc(d.name)}</a></h3>
            <div class="meta">${esc(k)}${d.type && d.type !== k && d.type !== 'Warframe' ? ` · ${esc(d.type)}` : ''}${d.masteryReq ? ` · MR ${d.masteryReq}` : ''}</div>
            <div class="badges">
              <span class="badge xp">${fmt(remainingXP(g))} XP</span>
              ${d.isPrime ? '<span class="badge prime">Prime</span>' : ''}
              ${d.vaulted ? '<span class="badge vaulted">Vaulted</span>' : ''}
              ${g.owned ? '<span class="badge owned">Owned</span>' : ''}
              ${d.maxRank > 30 ? `<span class="badge">Rank ${d.maxRank}</span>` : ''}
            </div>
            ${rank}
          </div>
        </div>
        ${tip ? `<div class="tip">${esc(tip)}</div>` : ''}
        ${showParts ? `<details class="more"><summary>${d.isPrime ? 'Parts & relics' : 'How to get it'}</summary><div class="more-body">${partsHTML(g)}</div></details>` : ''}
      </article>`;
  }

  function renderGear() {
    const panel = $('#gear');
    if (!panel.dataset.ready) {
      panel.innerHTML = `
        <div class="toolbar">
          <input type="search" id="gearSearch" placeholder="Search items or relics (e.g. Axi C12)…" aria-label="Search gear">
          <select class="chip" id="gearSort" aria-label="Sort">
            <option value="default">Screenshot order</option>
            <option value="xp">Most XP first</option>
            <option value="name">Name</option>
            <option value="mr">Mastery requirement</option>
          </select>
        </div>
        <div class="toolbar" id="gearFilters">${FILTERS.map(([v, l]) => `<button class="chip${v === state.filter ? ' on' : ''}" data-f="${v}">${l}</button>`).join('')}</div>
        <div class="grid" id="gearGrid"></div>`;
      $('#gearSearch').addEventListener('input', (e) => { state.q = e.target.value.trim(); drawGear(); });
      $('#gearSort').addEventListener('change', (e) => { state.sort = e.target.value; drawGear(); });
      $('#gearFilters').addEventListener('click', (e) => {
        const b = e.target.closest('[data-f]');
        if (!b) return;
        state.filter = b.dataset.f;
        panel.querySelectorAll('#gearFilters .chip').forEach((c) => c.classList.toggle('on', c === b));
        drawGear();
      });
      panel.dataset.ready = '1';
    }
    drawGear();
  }
  function drawGear() {
    let list = gear.filter((g) => !g.done && gearMatches(g));
    if (state.sort === 'xp') list.sort((a, b) => remainingXP(b) - remainingXP(a));
    if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === 'mr') list.sort((a, b) => a.d.masteryReq - b.d.masteryReq);
    $('#gearGrid').innerHTML = list.length ? list.map(gearCard).join('') : '<div class="empty">Nothing matches.</div>';
  }

  // ---------- render: star chart ----------
  function renderStarChart() {
    const left = nodes.filter((n) => !n.done);
    const planets = [...new Set(left.map((n) => n.planet))];
    $('#starchart').innerHTML = left.length ? `
      <p class="muted">Incomplete nodes from the star chart screenshots. Finishing a node once gives its mastery XP; each node gives the same XP again on the Steel Path.</p>
      ${planets.map((pl) => `
        <div class="planet">
          <h2>${esc(pl)} <span class="muted small">(${left.filter((n) => n.planet === pl).length} left)</span></h2>
          <div class="nodes">${left.filter((n) => n.planet === pl).map((n) => `
            <div class="node${n.locked ? ' locked' : ''}">
              <h3>${n.locked ? '<svg width="12" height="14" viewBox="0 0 12 14" aria-label="Locked"><rect x="1" y="6" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' : ''}${esc(n.name)}</h3>
              <div class="meta">${esc(n.d ? n.d.mission : '')}${n.d && n.d.faction ? ` · ${esc(n.d.faction)}` : ''}${n.d ? ` · Lv ${esc(n.d.levels)}` : ''}</div>
              <div class="badges">${n.d && n.d.darkSector ? '<span class="badge ds">Dark Sector</span>' : ''}${n.locked ? '<span class="badge locked">Locked</span>' : ''}</div>
              ${n.tip ? `<p class="small muted" style="margin:6px 0 0">${esc(n.tip)}</p>` : ''}
            </div>`).join('')}
          </div>
        </div>`).join('')}` : '<div class="empty">Star chart complete!</div>';
  }

  // ---------- render: prime parts ----------
  function primePartRows() {
    const rows = [];
    gear.filter((g) => g.d.isPrime && needsParts(g)).forEach((g) => {
      g.d.parts.forEach((p) => rows.push({ g, part: p }));
    });
    return rows;
  }
  function resourceTotals(list) {
    const totals = new Map();
    let credits = 0;
    list.forEach((g) => {
      credits += g.d.buildPrice || 0;
      g.d.resources.forEach((r) => totals.set(r.name, (totals.get(r.name) || 0) + r.count));
      g.d.requiresItems.forEach((r) => totals.set(r.name + ' (built item)', (totals.get(r.name + ' (built item)') || 0) + r.count));
    });
    return { credits, totals: [...totals.entries()].sort((a, b) => b[1] - a[1]) };
  }
  function renderPrimes() {
    const rows = primePartRows();
    const primeItems = gear.filter((g) => g.d.isPrime && needsParts(g));
    const { credits, totals } = resourceTotals(primeItems);
    const ducats = rows.reduce((s, r) => s + (r.part.ducats || 0) * r.part.count, 0);
    const all = resourceTotals(gear.filter(needsParts));

    $('#primes').innerHTML = `
      <p class="muted">Every prime part still needed, which relic it comes from and at what rarity. Hover a relic for the drop chance at each refinement. Items already owned are left out.</p>
      <div class="stats" style="margin-top:0;margin-bottom:18px">
        <div class="stat"><b>${primeItems.length}</b><span>prime items to build</span></div>
        <div class="stat"><b>${rows.length}</b><span>parts to collect</span></div>
        <div class="stat"><b>${fmt(credits)}</b><span>credits to build them</span></div>
        <div class="stat"><b>${fmt(ducats)}</b><span>ducats if sold instead</span></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Item</th><th>Part</th><th>Relics (Intact rarity)</th><th class="num">Ducats</th><th>Trade</th></tr></thead>
        <tbody>${rows.map((r, i) => `
          <tr>
            <td>${i === 0 || rows[i - 1].g !== r.g ? `<div class="item-cell">${img(r.g.d)}<span><b>${esc(r.g.name)}</b>${r.g.d.vaulted ? ' <span class="badge vaulted">Vaulted</span>' : ''}</span></div>` : ''}</td>
            <td>${esc(r.part.name)}${r.part.count > 1 ? ` ×${r.part.count}` : ''}</td>
            <td>${r.part.relics.length ? `<div class="relics">${r.part.relics.map(relicLabel).join('')}</div>` : `<span class="muted small">${esc(r.part.otherDrops[0] ? r.part.otherDrops[0].location : 'not from relics')}</span>`}</td>
            <td class="num">${r.part.ducats ?? '-'}</td>
            <td>${marketLink(r.part)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>

      <h2>Resources for the prime builds</h2>
      <div class="res-list">
        <span class="res">${fmt(credits)} credits</span>
        ${totals.map(([n, c]) => `<span class="res">${fmt(c)}× ${esc(n)}</span>`).join('')}
      </div>
      <p class="muted small">Warframe component blueprints (Neuroptics, Chassis, Systems) also need their own resources once crafted - check the item's wiki page.</p>

      <h2>Resources for everything still to build</h2>
      <div class="res-list">
        <span class="res">${fmt(all.credits)} credits</span>
        ${all.totals.map(([n, c]) => `<span class="res">${fmt(c)}× ${esc(n)}</span>`).join('')}
      </div>`;
  }

  // ---------- render: relic planner ----------
  function renderRelics() {
    const map = new Map();
    primePartRows().forEach(({ g, part }) => {
      part.relics.forEach((r) => {
        if (!map.has(r.relic)) map.set(r.relic, { relic: r.relic, tier: r.tier, rewards: [] });
        map.get(r.relic).rewards.push({ item: g.name, part: part.name, rarity: r.rarity, vaulted: g.d.vaulted, chances: r.chances });
      });
    });
    const relics = [...map.values()].sort((a, b) => (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || a.relic.localeCompare(b.relic, undefined, { numeric: true }));
    relics.forEach((r) => r.rewards.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]));
    const tiers = ['all', ...Object.keys(TIER_ORDER).filter((t) => relics.some((r) => r.tier === t))];
    const panel = $('#relics');
    const draw = () => {
      const list = relics.filter((r) => state.tier === 'all' || r.tier === state.tier);
      $('#relicGrid').innerHTML = list.map((r) => `
        <div class="relic-card">
          <h3><span class="tier-${esc(r.tier)}">${esc(r.relic)}</span><span class="muted small">${r.rewards.length} wanted</span></h3>
          <ul>${r.rewards.map((w) => `<li><span>${esc(w.item)} ${esc(w.part)}${w.vaulted ? ' <span class="badge vaulted">V</span>' : ''}</span><span class="r-${esc(w.rarity)}" title="Radiant: ${w.chances.Radiant ?? '?'}%">${esc(w.rarity)}</span></li>`).join('')}</ul>
        </div>`).join('') || '<div class="empty">No relics needed.</div>';
    };
    panel.innerHTML = `
      <p class="muted">Relics grouped so you can see which ones pay off for several parts at once. Rare rewards: 2% Intact → 10% Radiant. Uncommon: 11% → 20%. Common: 25% → 17%.</p>
      <div class="toolbar" id="tierFilters">${tiers.map((t) => `<button class="chip${t === state.tier ? ' on' : ''}" data-t="${t}">${t === 'all' ? 'All tiers' : t}</button>`).join('')}</div>
      <div class="relic-grid" id="relicGrid"></div>`;
    $('#tierFilters').addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      state.tier = b.dataset.t;
      panel.querySelectorAll('#tierFilters .chip').forEach((c) => c.classList.toggle('on', c === b));
      draw();
    });
    draw();
  }

  // ---------- render: mastered ----------
  function renderMastered() {
    const doneGear = gear.filter((g) => g.done).sort((a, b) => String(b.done).localeCompare(String(a.done)));
    const doneNodes = nodes.filter((n) => n.done).sort((a, b) => String(b.done).localeCompare(String(a.done)));
    if (!doneGear.length && !doneNodes.length) {
      $('#mastered').innerHTML = '<div class="empty">Nothing logged yet - gear and nodes move here as they get mastered.</div>';
      return;
    }
    const xp = doneGear.reduce((s, g) => s + remainingXP({ ...g, done: false }), 0);
    $('#mastered').innerHTML = `
      <p class="muted">${doneGear.length} items (${fmt(xp)} XP) and ${doneNodes.length} nodes mastered since tracking started.</p>
      ${doneGear.length ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Type</th><th class="num">XP</th><th>Date</th></tr></thead><tbody>
        ${doneGear.map((g) => `<tr><td><div class="item-cell">${img(g.d)}<b>${esc(g.name)}</b></div></td><td>${esc(kind(g.d))}</td><td class="num">${fmt(remainingXP({ ...g, done: false }))}</td><td>${esc(g.done === true ? '' : g.done)}</td></tr>`).join('')}
      </tbody></table></div>` : ''}
      ${doneNodes.length ? `<h2>Nodes</h2><div class="table-wrap"><table><thead><tr><th>Node</th><th>Planet</th><th>Date</th></tr></thead><tbody>
        ${doneNodes.map((n) => `<tr><td>${esc(n.name)}</td><td>${esc(n.planet)}</td><td>${esc(n.done === true ? '' : n.done)}</td></tr>`).join('')}
      </tbody></table></div>` : ''}`;
  }

  // ---------- render: tips ----------
  function renderTips() {
    const p = tracker.player;
    $('#tips').innerHTML = `
      <div class="tips-list">
        <div class="q"><h3>How mastery adds up</h3><ul>
          <li>Weapons give 100 XP per rank (3,000 at rank 30). Warframes, K-Drives, companions and Archwings give 200 per rank (6,000).</li>
          <li>Kuva / Tenet / Coda weapons and Necramechs go to rank 40 (4,000 / 8,000 XP) - it takes Forma to unlock ranks 31-40.</li>
          <li>Legendary 1 starts at 2,397,500 XP and each Legendary rank costs another 147,500. Legendary 6 = ${fmt(p.goalXP)}.</li>
          <li>Each star chart node gives XP the first time it's finished, and again on the Steel Path. Railjack / Drifter intrinsics give 1,500 XP per rank.</li>
        </ul></div>
        <div class="q"><h3>Farming relics</h3><ul>
          <li>Lith: Hepit (Void, Capture) - fast rotation.</li>
          <li>Meso: Io (Jupiter, Defense). Neo: Ukko (Void, Capture).</li>
          <li>Axi: Apollo (Lua, Disruption) or Xini (Eris, Interception).</li>
          <li>Drop tables change with every Prime Access - the Warframe Wiki relic page lists the current best spot.</li>
        </ul></div>
        <div class="q"><h3>Cracking relics</h3><ul>
          <li>Run fissures in a 4-player squad where everyone brings the same relic ("radshare") - 4 chances at the part per run.</li>
          <li>For a Rare part, refine to Radiant (100 Void Traces): 2% → 10%.</li>
          <li>For Common parts, Intact is best - refining actually lowers Common odds.</li>
          <li>Extra parts sell to Baro Ki'Teer for ducats, or trade for platinum.</li>
        </ul></div>
        <div class="q"><h3>Vaulted primes</h3><ul>
          <li>Vaulted relics stop dropping. Varzia (Maroo's Bazaar, Mars) sells rotating vaulted relics for Aya or Regal Aya during Prime Resurgence.</li>
          <li>Buying the finished parts from players on warframe.market is often quicker.</li>
        </ul></div>
        <div class="q"><h3>Fast leveling</h3><ul>
          <li>Steel Path survival / defense, Void Cascade and Netracells level gear quickly. Weapons get full shared affinity when they're the only one equipped.</li>
          <li>Use an Affinity Booster on busy days and level several weak items at once in a group with a nuke frame.</li>
          <li>Arch-guns level with the Archgun Deployer on the open worlds; arch-melee needs Archwing missions.</li>
        </ul></div>
        <div class="q"><h3>${esc(p.founder)} Founder</h3><ul>
          <li>Founder-exclusive gear from the Founders pack is already in the arsenal and isn't on this list.</li>
          <li>Founder items can't be re-obtained, so everything on this tracker uses gear anyone can still get.</li>
        </ul></div>
      </div>`;
  }

  // ---------- tabs / theme ----------
  function selectTab(name) {
    document.querySelectorAll('#tabs [role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === name));
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
  }
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) selectTab(b.dataset.tab);
  });
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
  });

  // ---------- boot ----------
  async function load() {
    const get = (u) => fetch(u, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
    try {
      [tracker, data] = await Promise.all([get('data/tracker.json'), get('data/items.json')]);
    } catch (err) {
      $('#overview').innerHTML = `<div class="empty">Couldn't load tracker data (${esc(err.message)}).</div>`;
      return;
    }
    gear = tracker.items.filter((e) => data.items[e.name]).map((e) => ({ ...e, d: data.items[e.name] }));
    nodes = tracker.nodes.map((n) => ({ ...n, d: data.nodes[`${n.name} (${n.planet})`] }));

    $('#title').textContent = `${tracker.player.name}'s Road to ${tracker.player.goal}`;
    $('#subtitle').textContent = `Warframe mastery tracker · updated ${tracker.lastUpdated}`;
    document.title = `${tracker.player.name} → ${tracker.player.goal}`;
    $('#dataDate').textContent = data.generated;

    renderOverview();
    renderGear();
    renderStarChart();
    renderPrimes();
    renderRelics();
    renderMastered();
    renderTips();

    const hash = location.hash.slice(1);
    if (hash && document.getElementById(hash)) selectTab(hash);
  }
  load();
})();
