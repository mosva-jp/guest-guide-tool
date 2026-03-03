"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";

/* ═══════════════ Helpers ═══════════════ */
const mapUrl = (a) => a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` : "";
const mapMd = (a) => a ? `[📍 地図](${mapUrl(a)})` : "";

/* ═══════════════ Design tokens ═══════════════ */
const C = {
  bg: "#0b0f14", surface: "rgba(255,255,255,0.028)", surfaceHover: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.07)", borderFocus: "#3b82f6",
  inputBg: "rgba(255,255,255,0.045)", inputBorder: "rgba(255,255,255,0.10)",
  accent: "#3b82f6", accentSoft: "rgba(59,130,246,0.12)", accentGlow: "rgba(59,130,246,0.25)",
  green: "#22c55e", greenSoft: "rgba(34,197,94,0.12)",
  red: "#ef4444", redSoft: "rgba(239,68,68,0.08)",
  amber: "#f59e0b",
  text: "#d4dce8", dim: "#7a8da2", faint: "#4a5a6e", white: "#f0f4f8",
};

/* ═══════════════ CSS-in-JS with focus states ═══════════════ */
const focusRing = `
  input:focus, textarea:focus, select:focus {
    border-color: ${C.borderFocus} !important;
    box-shadow: 0 0 0 3px ${C.accentSoft} !important;
  }
  input::placeholder, textarea::placeholder { color: ${C.faint}; }
  *::-webkit-scrollbar { width: 6px; height: 6px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  @media (max-width: 640px) {
    .grid2 { grid-template-columns: 1fr !important; }
    .spot-grid { grid-template-columns: 1fr !important; }
  }
`;

const inp = {
  width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 13.5,
  background: C.inputBg, border: `1px solid ${C.inputBorder}`,
  color: C.text, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s",
};
const txta = { ...inp, resize: "vertical", lineHeight: 1.65 };

/* ═══════════════ Atoms ═══════════════ */
function Field({ label: l, hint, required, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 5 }}>
        {l}{required && <span style={{ color: C.accent, marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.faint, marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function Btn({ children, onClick, v = "primary", disabled, style: ex = {} }) {
  const base = {
    padding: "9px 20px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 600,
    cursor: disabled ? "default" : "pointer", transition: "all 0.2s", opacity: disabled ? 0.3 : 1,
    fontFamily: "inherit",
  };
  const vs = {
    primary: { ...base, background: C.accent, color: "#fff", ...ex },
    outline: { ...base, background: "transparent", border: `1px solid ${C.border}`, color: C.dim, ...ex },
    ghost: { ...base, background: C.accentSoft, color: C.accent, padding: "8px 16px", fontSize: 12.5, borderRadius: 8, ...ex },
    danger: { ...base, background: "transparent", color: C.red, padding: "5px 12px", fontSize: 11, ...ex },
    success: { ...base, background: C.green, color: "#fff", ...ex },
  };
  return <button onClick={onClick} disabled={disabled} style={vs[v] || vs.primary}>{children}</button>;
}

function Toggle({ id, label, enabled, toggle, children }) {
  return (
    <div style={{
      marginBottom: 12, borderRadius: 12, transition: "background 0.2s",
      background: enabled ? "rgba(59,130,246,0.04)" : "transparent",
      border: `1px solid ${enabled ? "rgba(59,130,246,0.1)" : "transparent"}`,
      padding: enabled ? "14px 16px" : "6px 0",
    }}>
      <div onClick={() => toggle(id)} style={{
        display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none",
        padding: enabled ? 0 : "0 2px",
      }}>
        <div style={{
          width: 42, height: 24, borderRadius: 12, position: "relative", transition: "background 0.25s",
          background: enabled ? C.accent : "rgba(255,255,255,0.1)", flexShrink: 0,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 9, background: "#fff",
            position: "absolute", top: 3, left: enabled ? 21 : 3, transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }} />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: enabled ? C.white : C.dim }}>{label}</span>
      </div>
      {enabled && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

function Card({ children, style: ex }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 26px", ...ex }}>{children}</div>;
}

/* ═══════════════ Spot entry ═══════════════ */
function SpotList({ spots, setSpots, fields, addLabel = "＋ 追加" }) {
  const empty = Object.fromEntries(fields.map(f => [f.key, ""]));
  const add = () => setSpots([...spots, { ...empty }]);
  const upd = (i, k, v) => { const n = [...spots]; n[i] = { ...n[i], [k]: v }; setSpots(n); };
  const del = (i) => setSpots(spots.filter((_, j) => j !== i));
  return (
    <div>
      {spots.map((s, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.02)", borderRadius: 11, padding: "14px 16px",
          border: `1px solid rgba(255,255,255,0.04)`, marginBottom: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.faint, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>#{i + 1}</span>
            <Btn v="danger" onClick={() => del(i)}>✕ 削除</Btn>
          </div>
          <div className="spot-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {fields.filter(f => !f.full).map(f => (
              <input key={f.key} style={inp} placeholder={f.ph} value={s[f.key] || ""} onChange={e => upd(i, f.key, e.target.value)} />
            ))}
          </div>
          {fields.filter(f => f.full).map(f => (
            <input key={f.key} style={{ ...inp, marginTop: 8 }} placeholder={f.ph} value={s[f.key] || ""} onChange={e => upd(i, f.key, e.target.value)} />
          ))}
        </div>
      ))}
      <Btn v="ghost" onClick={add}>{addLabel}</Btn>
    </div>
  );
}

const SHOP_F = [
  { key: "name", ph: "店名・施設名" }, { key: "address", ph: "住所（Mapリンク自動生成）" },
  { key: "hours", ph: "営業時間" }, { key: "detail", ph: "詳細・特徴", full: true },
];
const SIMPLE_F = [{ key: "name", ph: "場所名" }, { key: "address", ph: "住所" }, { key: "detail", ph: "詳細", full: true }];
const SENTO_F = [
  { key: "name", ph: "施設名" }, { key: "address", ph: "住所" },
  { key: "hours", ph: "営業時間" }, { key: "extra", ph: "料金（例：¥520）" },
  { key: "detail", ph: "詳細（サウナあり等）", full: true },
];
const LAUNDRY_F = [
  { key: "name", ph: "施設名" }, { key: "address", ph: "住所" },
  { key: "hours", ph: "営業時間" }, { key: "extra", ph: "料金目安" },
  { key: "detail", ph: "詳細", full: true },
];

/* ═══════════════ Appliance ═══════════════ */
function ApplianceList({ items, setItems }) {
  const add = () => setItems([...items, { name: "", howTo: "", driveLink: "" }]);
  const upd = (i, k, v) => { const n = [...items]; n[i] = { ...n[i], [k]: v }; setItems(n); };
  const del = (i) => setItems(items.filter((_, j) => j !== i));
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 11, padding: 16, marginBottom: 10, border: `1px solid rgba(255,255,255,0.04)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.faint, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>家電 #{i + 1}</span>
            <Btn v="danger" onClick={() => del(i)}>✕ 削除</Btn>
          </div>
          <input style={{ ...inp, marginBottom: 8 }} placeholder="家電名（例：洗濯機、給湯器）" value={it.name} onChange={e => upd(i, "name", e.target.value)} />
          <textarea style={{ ...txta, marginBottom: 8 }} rows={3} placeholder={"操作方法\n1. 電源を入れる\n2. スタートを押す"} value={it.howTo} onChange={e => upd(i, "howTo", e.target.value)} />
          <Field label="📷 Google Drive リンク（操作写真）" hint="Google Driveで画像を「リンクを取得」してペースト">
            <input style={inp} placeholder="https://drive.google.com/file/d/xxxxx/view" value={it.driveLink} onChange={e => upd(i, "driveLink", e.target.value)} />
          </Field>
        </div>
      ))}
      <Btn v="ghost" onClick={add}>＋ 家電を追加</Btn>
    </div>
  );
}

/* ═══════════════ QA ═══════════════ */
function QAList({ items, setItems }) {
  const add = () => setItems([...items, { q: "", a: "" }]);
  const upd = (i, k, v) => { const n = [...items]; n[i] = { ...n[i], [k]: v }; setItems(n); };
  const del = (i) => setItems(items.filter((_, j) => j !== i));
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 11, padding: 16, marginBottom: 10, border: `1px solid rgba(255,255,255,0.04)` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.faint, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>Q&A #{i + 1}</span>
            <Btn v="danger" onClick={() => del(i)}>✕ 削除</Btn>
          </div>
          <input style={{ ...inp, marginBottom: 8 }} placeholder="質問（Q）" value={it.q} onChange={e => upd(i, "q", e.target.value)} />
          <textarea style={txta} rows={2} placeholder="回答（A）" value={it.a} onChange={e => upd(i, "a", e.target.value)} />
        </div>
      ))}
      <Btn v="ghost" onClick={add}>＋ Q&A を追加</Btn>
    </div>
  );
}

/* ═══════════════ Markdown generation ═══════════════ */
function spotsTable(spots, cols) {
  const valid = spots.filter(s => s.name);
  if (!valid.length) return "";
  const h = cols.map(c => c.label);
  let t = `| ${h.join(" | ")} |\n|${h.map(() => "------").join("|")}|\n`;
  valid.forEach(s => {
    const cells = cols.map(c => c.key === "address" ? `${s.address}　${mapMd(s.address)}` : (s[c.key] || ""));
    t += `| ${cells.join(" | ")} |\n`;
  });
  return t;
}

function gen(d) {
  const addr = d.basic.address;
  const gMap = d.basic.googleMapUrl || (addr ? mapUrl(addr) : "");
  let m = `# 🏠 ${d.basic.facilityName || "【施設名】"} ゲストガイド\n\n---\n\n`;

  m += `## 📋 基本情報\n\n| 項目 | 詳細 |\n|------|------|\n`;
  m += `| **施設名** | ${d.basic.facilityName} |\n| **住所** | ${addr} |\n`;
  if (gMap) m += `| **Google Map** | [📍 地図を開く](${gMap}) |\n`;
  m += `| **建物タイプ** | ${d.basic.buildingType} |\n| **最大宿泊人数** | ${d.basic.maxGuests} |\n| **ベッド数** | ${d.basic.beds} |\n\n---\n\n`;

  m += `## 🔑 チェックイン・チェックアウト\n\n| 項目 | 詳細 |\n|------|------|\n`;
  m += `| **チェックイン時間** | ${d.checkin.checkinTime} |\n| **チェックアウト時間** | ${d.checkin.checkoutTime} |\n`;
  if (d.checkin.lateCheckin) m += `| **深夜チェックイン** | ${d.checkin.lateCheckin} |\n`;
  if (d.checkin.earlyCheckin) m += `| **アーリーチェックイン** | ${d.checkin.earlyCheckin} |\n`;
  if (d.checkin.lateCheckout) m += `| **レイトチェックアウト** | ${d.checkin.lateCheckout} |\n`;
  m += `\n### 🔐 鍵について\n- **鍵の受け渡し方法**: ${d.checkin.keyMethod}\n`;
  if (d.checkin.keyCode) m += `- **鍵の暗証番号**: ${d.checkin.keyCode}\n`;
  m += `- **鍵紛失時の請求額**: ${d.checkin.keyLostFee}\n`;
  m += `\n### 🚪 チェックアウト時のお願い\n1. エアコンをオフにしてください\n2. 電気を消してください\n3. 鍵をロックしてご退出ください\n\n---\n\n`;

  m += `## 🌐 Wi-Fi\n\n| 項目 | 詳細 |\n|------|------|\n`;
  m += `| **SSID** | ${d.wifi.ssid} |\n| **パスワード** | ${d.wifi.password} |\n`;
  if (d.wifi.speed) m += `| **速度** | ${d.wifi.speed} |\n`;
  m += `\n---\n\n`;

  m += `## 🚃 アクセス\n\n`;
  if (d.on.narita) m += `### ✈️ 成田空港から\n- ${d.access.fromNarita}\n- 所要時間：${d.access.naritaTime}\n- 料金目安：${d.access.naritaCost}\n\n`;
  if (d.on.haneda) m += `### ✈️ 羽田空港から\n- ${d.access.fromHaneda}\n- 所要時間：${d.access.hanedaTime}\n- 料金目安：${d.access.hanedaCost}\n\n`;
  m += `### 🚉 最寄駅\n- **最寄駅**: ${d.access.nearestStation}\n- **徒歩**: ${d.access.walkMinutes}\n`;
  if (d.access.nearestStation && addr) m += `- **ルート**: [📍 駅→施設](https://www.google.com/maps/dir/${encodeURIComponent(d.access.nearestStation)}/${encodeURIComponent(addr)})\n`;
  m += `\n---\n\n`;

  m += `## 🛋 設備・アメニティ\n\n### 設備\n`;
  d.equip.facilities.split(/[,、\n]/).map(s => s.trim()).filter(Boolean).forEach(s => { m += `- ${s}\n`; });
  m += `\n### アメニティ\n`;
  d.equip.amenities.split(/[,、\n]/).map(s => s.trim()).filter(Boolean).forEach(s => { m += `- ${s}\n`; });
  m += `- 歯ブラシ：${d.equip.toothbrush}\n`;
  if (d.equip.washerDryer) m += `\n**洗濯機・乾燥機**: ${d.equip.washerDryer}\n`;
  m += `\n---\n\n`;

  const va = d.appliances.filter(a => a.name);
  if (va.length) { m += `## 📖 家電の操作方法\n\n`; va.forEach(a => { m += `### ${a.name}\n${a.howTo}\n`; if (a.driveLink) m += `\n📷 操作写真: ${a.driveLink}\n`; m += `\n`; }); m += `---\n\n`; }

  if (d.on.pet) m += `## 🐾 ペット\n\n${d.opt.petPolicy}\n\n---\n\n`;
  m += `## 🗑 ゴミの捨て方\n\n${d.rules.garbageRules}\n\n---\n\n`;
  if (d.on.cleaning) m += `## 🧹 清掃\n\n- **滞在中の追加清掃**: ${d.opt.cleaningFee}\n\n---\n\n`;
  if (d.on.luggage) m += `## 🧳 荷物預かり\n\n${d.opt.luggageStorage}\n\n---\n\n`;
  if (d.on.taxi) m += `## 🚕 タクシー\n\n${d.opt.taxiInfo}\n\n---\n\n`;

  const RC = [["ramen","🍜 ラーメン"],["sushi","🍣 寿司"],["vegan","🌱 ヴィーガン対応"],["smokingRest","🚬 喫煙可能な飲食店"],["lateNight","🌙 夜遅くまで営業"],["morning","☀️ モーニング"],["lunch","🍱 ランチ"],["otherRest","⭐ その他おすすめ"]];
  const sc = [{key:"name",label:"店名"},{key:"address",label:"住所 / Google Map"},{key:"hours",label:"営業時間"},{key:"detail",label:"詳細"}];
  if (RC.some(([k]) => d.on[k] && d.rest[k]?.some(s => s.name))) {
    m += `## 🍽 周辺の飲食店\n\n`;
    RC.forEach(([k, t]) => { if (d.on[k]) { const tb = spotsTable(d.rest[k] || [], sc); if (tb) m += `### ${t}\n\n${tb}\n`; }});
    m += `---\n\n`;
  }

  if (d.on.smokingArea) { const t = spotsTable(d.smokingAreas, [{key:"name",label:"場所名"},{key:"address",label:"住所 / Google Map"},{key:"detail",label:"詳細"}]); if (t) m += `## 🚬 喫煙可能場所\n\n${t}\n---\n\n`; }
  if (d.on.sento) { const t = spotsTable(d.sentos, [{key:"name",label:"施設名"},{key:"address",label:"住所 / Google Map"},{key:"hours",label:"営業時間"},{key:"extra",label:"料金"},{key:"detail",label:"詳細"}]); if (t) m += `## ♨️ 銭湯\n\n${t}\n---\n\n`; }
  if (d.on.laundry) { const t = spotsTable(d.laundries, [{key:"name",label:"施設名"},{key:"address",label:"住所 / Google Map"},{key:"hours",label:"営業時間"},{key:"extra",label:"料金目安"},{key:"detail",label:"詳細"}]); if (t) m += `## 👕 コインランドリー\n\n${t}\n---\n\n`; }

  // FAQ: 3 fixed only
  m += `## ❓ よくある質問（FAQ）\n\n`;
  m += `### Q. 支払いリクエスト（追加請求）はどこで確認できますか？\n\n**A.** 以下のURLから「問題解決センター」をクリックしてご確認ください。\n🔗 https://www.airbnb.jp/help/article/3590\n\n---\n\n`;
  m += `### Q. 日本に入国するためのデータを入力するために電話番号が必要です。\n\n**A.** 以下の番号をご利用ください：\n📞 090-4400-9698\n\n---\n\n`;
  m += `### Q. チェックアウト時、エアコンをオフにする必要がありますか？\n\n**A.** はい。エアコンをオフにして電気を切り、鍵をロックしてご退出ください。\n\n`;
  d.customQA.filter(qa => qa.q).forEach(qa => { m += `---\n\n### Q. ${qa.q}\n\n**A.** ${qa.a}\n\n`; });
  m += `---\n\n`;

  const ex = [];
  if (d.on.emergency && d.opt.emergency) ex.push(`### 🏥 緊急連絡先\n${d.opt.emergency}\n- 警察: 110\n- 救急: 119`);
  if (d.on.convenience) { const t = spotsTable(d.convStores, sc); if (t) ex.push(`### 🏪 コンビニ・スーパー\n\n${t}`); }
  if (d.on.pharmacy && d.opt.pharmacy) ex.push(`### 💊 薬局\n${d.opt.pharmacy}`);
  if (d.on.atm && d.opt.atm) ex.push(`### 🏧 ATM・両替所\n${d.opt.atm}`);
  if (d.on.sightseeing) { const t = spotsTable(d.sightseeing, sc); if (t) ex.push(`### 🚌 観光スポット\n\n${t}`); }
  if (d.on.houseRules && d.opt.houseRules) ex.push(`### 🎌 ハウスルール\n${d.opt.houseRules}`);
  if (d.on.quietHours && d.opt.quietHours) ex.push(`### 🔇 静粛時間\n${d.opt.quietHours}`);
  if (ex.length) m += `## 💡 追加情報\n\n${ex.join("\n\n---\n\n")}\n\n---\n\n`;

  m += `*最終更新日: ${new Date().toLocaleDateString("ja-JP")}*\n*管理: MOSVA*\n`;
  return m;
}

/* ═══════════════ Simple MD renderer ═══════════════ */
function MdPreview({ text }) {
  const html = useMemo(() => {
    let h = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:800;margin:0 0 8px;color:#111">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:700;margin:24px 0 8px;color:#1a1a2e;padding-bottom:6px;border-bottom:2px solid #e5e7eb">$2</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:14.5px;font-weight:700;margin:18px 0 6px;color:#1a1a2e">$3</h3>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:none" target="_blank">$1</a>')
      .replace(/^- (.+)$/gm, '<div style="padding-left:16px;position:relative;margin:2px 0"><span style="position:absolute;left:4px;color:#94a3b8">•</span>$1</div>')
      .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:20px;margin:2px 0"><span style="color:#94a3b8;margin-right:4px">$1.</span>$2</div>');
    // Tables
    h = h.replace(/((?:\|.+\|\n)+)/g, (match) => {
      const rows = match.trim().split("\n").filter(r => !r.match(/^\|[\s\-|]+\|$/));
      if (rows.length === 0) return match;
      const parse = (r) => r.split("|").slice(1, -1).map(c => c.trim());
      const hdr = parse(rows[0]);
      const body = rows.slice(1).map(parse);
      let t = '<div style="overflow-x:auto;margin:8px 0"><table style="width:100%;border-collapse:collapse;font-size:12.5px">';
      t += '<thead><tr>' + hdr.map(c => `<th style="text-align:left;padding:8px 10px;background:#f8fafc;border:1px solid #e5e7eb;font-weight:600;color:#374151">${c}</th>`).join('') + '</tr></thead>';
      t += '<tbody>' + body.map(r => '<tr>' + r.map(c => `<td style="padding:8px 10px;border:1px solid #e5e7eb;color:#4b5563">${c}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
      return t;
    });
    h = h.replace(/\n\n+/g, '<br>').replace(/\n/g, '<br>');
    return h;
  }, [text]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ═══════════════ Main ═══════════════ */
export default function App() {
  const [view, setView] = useState("form");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);

  const [basic, setBasic] = useState({ facilityName: "", address: "", googleMapUrl: "", buildingType: "", maxGuests: "", beds: "" });
  const [checkin, setCheckin] = useState({ checkinTime: "", checkoutTime: "", lateCheckin: "", earlyCheckin: "", lateCheckout: "", keyMethod: "", keyCode: "", keyLostFee: "" });
  const [wifi, setWifi] = useState({ ssid: "", password: "", speed: "" });
  const [access, setAccess] = useState({ fromNarita: "", naritaTime: "", naritaCost: "", fromHaneda: "", hanedaTime: "", hanedaCost: "", nearestStation: "", walkMinutes: "" });
  const [equip, setEquip] = useState({ facilities: "", amenities: "", toothbrush: "あり", washerDryer: "" });
  const [rules, setRules] = useState({ garbageRules: "" });
  const [opt, setOpt] = useState({ petPolicy: "", cleaningFee: "", luggageStorage: "", taxiInfo: "", emergency: "", pharmacy: "", atm: "", houseRules: "", quietHours: "" });
  const [appliances, setAppliances] = useState([{ name: "", howTo: "", driveLink: "" }]);
  const [customQA, setCustomQA] = useState([]);
  const [rest, setRest] = useState({ ramen: [], sushi: [], vegan: [], smokingRest: [], lateNight: [], morning: [], lunch: [], otherRest: [] });
  const [smokingAreas, setSmokingAreas] = useState([]);
  const [sentos, setSentos] = useState([]);
  const [laundries, setLaundries] = useState([]);
  const [convStores, setConvStores] = useState([]);
  const [sightseeing, setSightseeing] = useState([]);
  const [on, setOn] = useState({
    narita: false, haneda: false, pet: false, cleaning: false, luggage: false, taxi: false,
    ramen: false, sushi: false, vegan: false, smokingRest: false, lateNight: false,
    morning: false, lunch: false, otherRest: false,
    smokingArea: false, sento: false, laundry: false,
    emergency: false, convenience: false, pharmacy: false, atm: false,
    sightseeing: false, houseRules: false, quietHours: false,
  });
  const tog = useCallback((k) => setOn(p => ({ ...p, [k]: !p[k] })), []);
  const ub = (k, v) => setBasic(p => ({ ...p, [k]: v }));
  const uc = (k, v) => setCheckin(p => ({ ...p, [k]: v }));
  const uw = (k, v) => setWifi(p => ({ ...p, [k]: v }));
  const ua = (k, v) => setAccess(p => ({ ...p, [k]: v }));
  const ue = (k, v) => setEquip(p => ({ ...p, [k]: v }));
  const uo = (k, v) => setOpt(p => ({ ...p, [k]: v }));
  const ur = (k, v) => setRest(p => ({ ...p, [k]: v }));

  const allData = { basic, checkin, wifi, access, equip, rules, opt, appliances, customQA, rest, smokingAreas, sentos, laundries, convStores, sightseeing, on };
  const handleCopy = () => { navigator.clipboard.writeText(gen(allData)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }); };

  // Step completion calc
  const stepCompletion = useMemo(() => {
    const req = (vals) => vals.filter(v => v && v.trim()).length;
    const tot = (vals) => vals.length;
    const pct = (vals) => tot(vals) === 0 ? 100 : Math.round((req(vals) / tot(vals)) * 100);
    return [
      pct([basic.facilityName, basic.address, basic.buildingType, basic.maxGuests, basic.beds]),
      pct([checkin.checkinTime, checkin.checkoutTime, checkin.keyMethod, checkin.keyLostFee]),
      pct([wifi.ssid, wifi.password]),
      pct([access.nearestStation, access.walkMinutes]),
      pct([equip.facilities, equip.amenities]),
      appliances.some(a => a.name) ? 100 : 0,
      pct([rules.garbageRules]),
      Object.entries(rest).some(([k, v]) => on[k] && v.some(s => s.name)) ? 100 : 0,
      [smokingAreas, sentos, laundries].some((arr, i) => on[["smokingArea","sento","laundry"][i]] && arr.some(s => s.name)) ? 100 : 0,
      100,
      100,
    ];
  }, [basic, checkin, wifi, access, equip, appliances, rules, rest, on, smokingAreas, sentos, laundries]);

  const STEPS = [
    { icon: "📋", title: "基本情報" }, { icon: "🔑", title: "チェックイン" },
    { icon: "🌐", title: "Wi-Fi" }, { icon: "🚃", title: "アクセス" },
    { icon: "🛋", title: "設備" }, { icon: "📖", title: "家電操作" },
    { icon: "🗑", title: "ゴミ・ルール" }, { icon: "🍽", title: "飲食店" },
    { icon: "🗺", title: "周辺施設" }, { icon: "❓", title: "Q&A" },
    { icon: "💡", title: "追加情報" },
  ];

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step, view]);

  const gap = { display: "flex", flexDirection: "column", gap: 16 };
  const grid2 = "grid2";

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div style={gap}>
          <Field label="施設名" required><input style={inp} value={basic.facilityName} onChange={e => ub("facilityName", e.target.value)} placeholder="ZenAbode Kamata 303" /></Field>
          <Field label="住所" required><input style={inp} value={basic.address} onChange={e => ub("address", e.target.value)} placeholder="東京都大田区蒲田5-1-1" /></Field>
          <Field label="Google Map リンク" hint={!basic.googleMapUrl && basic.address ? "💡 未入力の場合は住所から自動生成されます" : "Google Mapで「共有 → リンクをコピー」したURLを貼り付け"}>
            <input style={inp} value={basic.googleMapUrl} onChange={e => ub("googleMapUrl", e.target.value)} placeholder="https://maps.app.goo.gl/xxxxx" />
          </Field>
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="建物タイプ" required><input style={inp} value={basic.buildingType} onChange={e => ub("buildingType", e.target.value)} placeholder="マンション / 一軒家" /></Field>
            <Field label="最大宿泊人数" required><input style={inp} value={basic.maxGuests} onChange={e => ub("maxGuests", e.target.value)} placeholder="6名" /></Field>
          </div>
          <Field label="ベッド数" required><input style={inp} value={basic.beds} onChange={e => ub("beds", e.target.value)} placeholder="シングル2台、ダブル1台、布団2組" /></Field>
        </div>
      );
      case 1: return (
        <div style={gap}>
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="チェックイン時間" required><input style={inp} value={checkin.checkinTime} onChange={e => uc("checkinTime", e.target.value)} placeholder="15:00〜22:00" /></Field>
            <Field label="チェックアウト時間" required><input style={inp} value={checkin.checkoutTime} onChange={e => uc("checkoutTime", e.target.value)} placeholder="10:00" /></Field>
          </div>
          <Field label="深夜チェックイン"><input style={inp} value={checkin.lateCheckin} onChange={e => uc("lateCheckin", e.target.value)} placeholder="可。24:00まで。追加料金 ¥2,000" /></Field>
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="アーリーチェックイン"><input style={inp} value={checkin.earlyCheckin} onChange={e => uc("earlyCheckin", e.target.value)} placeholder="可。最早13:00〜。¥1,000/h" /></Field>
            <Field label="レイトチェックアウト"><input style={inp} value={checkin.lateCheckout} onChange={e => uc("lateCheckout", e.target.value)} placeholder="可。最遅14:00。¥1,500/h" /></Field>
          </div>
          <Field label="鍵の受け渡し方法" required><input style={inp} value={checkin.keyMethod} onChange={e => uc("keyMethod", e.target.value)} placeholder="スマートロック（暗証番号式）" /></Field>
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="鍵の暗証番号"><input style={inp} value={checkin.keyCode} onChange={e => uc("keyCode", e.target.value)} placeholder="前日にお知らせ" /></Field>
            <Field label="鍵紛失時の請求額" required><input style={inp} value={checkin.keyLostFee} onChange={e => uc("keyLostFee", e.target.value)} placeholder="¥30,000" /></Field>
          </div>
        </div>
      );
      case 2: return (
        <div style={gap}>
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="SSID" required><input style={inp} value={wifi.ssid} onChange={e => uw("ssid", e.target.value)} placeholder="ZenAbode-Guest" /></Field>
            <Field label="パスワード" required><input style={inp} value={wifi.password} onChange={e => uw("password", e.target.value)} placeholder="welcome2024" /></Field>
          </div>
          <Field label="インターネット速度"><input style={inp} value={wifi.speed} onChange={e => uw("speed", e.target.value)} placeholder="約100Mbps" /></Field>
        </div>
      );
      case 3: return (
        <div style={gap}>
          <Toggle id="narita" label="✈️ 成田空港からのアクセス" enabled={on.narita} toggle={tog}>
            <div style={gap}>
              <Field label="ルート"><textarea style={txta} rows={2} value={access.fromNarita} onChange={e => ua("fromNarita", e.target.value)} placeholder="成田エクスプレスで品川駅→京急線で蒲田駅" /></Field>
              <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="所要時間"><input style={inp} value={access.naritaTime} onChange={e => ua("naritaTime", e.target.value)} placeholder="約90分" /></Field>
                <Field label="料金目安"><input style={inp} value={access.naritaCost} onChange={e => ua("naritaCost", e.target.value)} placeholder="約¥3,500" /></Field>
              </div>
            </div>
          </Toggle>
          <Toggle id="haneda" label="✈️ 羽田空港からのアクセス" enabled={on.haneda} toggle={tog}>
            <div style={gap}>
              <Field label="ルート"><textarea style={txta} rows={2} value={access.fromHaneda} onChange={e => ua("fromHaneda", e.target.value)} placeholder="京急線で蒲田駅" /></Field>
              <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="所要時間"><input style={inp} value={access.hanedaTime} onChange={e => ua("hanedaTime", e.target.value)} placeholder="約15分" /></Field>
                <Field label="料金目安"><input style={inp} value={access.hanedaCost} onChange={e => ua("hanedaCost", e.target.value)} placeholder="約¥300" /></Field>
              </div>
            </div>
          </Toggle>
          <div style={{ height: 1, background: C.border, margin: "4px 0 8px" }} />
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="最寄駅" required><input style={inp} value={access.nearestStation} onChange={e => ua("nearestStation", e.target.value)} placeholder="蒲田駅（JR京浜東北線）" /></Field>
            <Field label="徒歩時間" required><input style={inp} value={access.walkMinutes} onChange={e => ua("walkMinutes", e.target.value)} placeholder="約5分" /></Field>
          </div>
        </div>
      );
      case 4: return (
        <div style={gap}>
          <Field label="設備一覧" required hint="カンマまたは改行で区切り"><textarea style={txta} rows={3} value={equip.facilities} onChange={e => ue("facilities", e.target.value)} placeholder="キッチン（IHコンロ、電子レンジ、冷蔵庫）、エアコン、テレビ" /></Field>
          <Field label="アメニティ一覧" required hint="カンマまたは改行で区切り"><textarea style={txta} rows={3} value={equip.amenities} onChange={e => ue("amenities", e.target.value)} placeholder="シャンプー、コンディショナー、ボディソープ、タオル" /></Field>
          <div className={grid2} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="歯ブラシ" required>
              <select style={inp} value={equip.toothbrush} onChange={e => ue("toothbrush", e.target.value)}>
                <option value="あり">あり</option><option value="なし">なし</option>
              </select>
            </Field>
            <Field label="洗濯機・乾燥機"><input style={inp} value={equip.washerDryer} onChange={e => ue("washerDryer", e.target.value)} placeholder="洗濯機あり（乾燥機能付き）" /></Field>
          </div>
        </div>
      );
      case 5: return (
        <div>
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 16, lineHeight: 1.65 }}>操作説明が必要な家電を追加してください。<br />Google Driveの写真リンクも添付できます。</p>
          <ApplianceList items={appliances} setItems={setAppliances} />
        </div>
      );
      case 6: return (
        <div style={gap}>
          <Field label="ゴミの捨て方" required><textarea style={txta} rows={4} value={rules.garbageRules} onChange={e => setRules({ garbageRules: e.target.value })} placeholder={"燃えるゴミ：白い袋に入れてキッチン横のゴミ箱へ\n缶・ビン・ペットボトル：分別して玄関横の箱へ"} /></Field>
          <div style={{ height: 1, background: C.border }} />
          <Toggle id="pet" label="🐾 ペット同伴" enabled={on.pet} toggle={tog}><Field label="ペットポリシー"><textarea style={txta} rows={2} value={opt.petPolicy} onChange={e => uo("petPolicy", e.target.value)} placeholder="ペット同伴OK（小型犬のみ。追加清掃料金¥3,000）" /></Field></Toggle>
          <Toggle id="cleaning" label="🧹 滞在中の追加清掃" enabled={on.cleaning} toggle={tog}><Field label="清掃料金"><input style={inp} value={opt.cleaningFee} onChange={e => uo("cleaningFee", e.target.value)} placeholder="可（料金：¥5,000）" /></Field></Toggle>
          <Toggle id="luggage" label="🧳 荷物預かり" enabled={on.luggage} toggle={tog}><Field label="詳細"><textarea style={txta} rows={2} value={opt.luggageStorage} onChange={e => uo("luggageStorage", e.target.value)} placeholder="チェックイン前・チェックアウト後対応可能" /></Field></Toggle>
          <Toggle id="taxi" label="🚕 タクシー" enabled={on.taxi} toggle={tog}><Field label="タクシー情報"><textarea style={txta} rows={2} value={opt.taxiInfo} onChange={e => uo("taxiInfo", e.target.value)} placeholder='配車アプリ「GO」をご利用ください' /></Field></Toggle>
        </div>
      );
      case 7: return (
        <div style={gap}>
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 4, lineHeight: 1.65 }}>必要なカテゴリをONにしてお店を追加。<br />住所入力でGoogle Mapリンク自動生成。</p>
          {[["ramen","🍜 ラーメン"],["sushi","🍣 寿司"],["vegan","🌱 ヴィーガン対応"],["smokingRest","🚬 喫煙可能な飲食店"],["lateNight","🌙 夜遅くまで営業"],["morning","☀️ モーニング"],["lunch","🍱 ランチ"],["otherRest","⭐ その他おすすめ"]].map(([k, l]) => (
            <Toggle key={k} id={k} label={l} enabled={on[k]} toggle={tog}>
              <SpotList spots={rest[k]} setSpots={v => ur(k, v)} fields={SHOP_F} addLabel={`＋ ${l.split(" ").pop()}を追加`} />
            </Toggle>
          ))}
        </div>
      );
      case 8: return (
        <div style={gap}>
          <Toggle id="smokingArea" label="🚬 喫煙可能場所" enabled={on.smokingArea} toggle={tog}><SpotList spots={smokingAreas} setSpots={setSmokingAreas} fields={SIMPLE_F} /></Toggle>
          <Toggle id="sento" label="♨️ 銭湯" enabled={on.sento} toggle={tog}><SpotList spots={sentos} setSpots={setSentos} fields={SENTO_F} /></Toggle>
          <Toggle id="laundry" label="👕 コインランドリー" enabled={on.laundry} toggle={tog}><SpotList spots={laundries} setSpots={setLaundries} fields={LAUNDRY_F} /></Toggle>
        </div>
      );
      case 9: return (
        <div style={gap}>
          <div style={{ background: C.accentSoft, borderRadius: 12, padding: "16px 20px", border: `1px solid rgba(59,130,246,0.15)` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 8 }}>📌 自動FAQ（3件）</div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 2 }}>
              • 支払いリクエスト（追加請求）の確認方法<br />
              • 日本入国用の電話番号<br />
              • チェックアウト時のエアコンについて
            </div>
          </div>
          <div style={{ height: 1, background: C.border }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>追加のQ&A</div>
          <QAList items={customQA} setItems={setCustomQA} />
        </div>
      );
      case 10: return (
        <div style={gap}>
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 4 }}>必要な項目をONにして入力してください。</p>
          <Toggle id="emergency" label="🏥 緊急連絡先" enabled={on.emergency} toggle={tog}><Field label="連絡先" hint="警察110・救急119は自動追加"><textarea style={txta} rows={2} value={opt.emergency} onChange={e => uo("emergency", e.target.value)} placeholder="ホスト: 090-XXXX-XXXX、最寄り病院：○○病院" /></Field></Toggle>
          <Toggle id="convenience" label="🏪 コンビニ・スーパー" enabled={on.convenience} toggle={tog}><SpotList spots={convStores} setSpots={setConvStores} fields={SHOP_F} /></Toggle>
          <Toggle id="pharmacy" label="💊 薬局" enabled={on.pharmacy} toggle={tog}><Field label="最寄りの薬局"><textarea style={txta} rows={2} value={opt.pharmacy} onChange={e => uo("pharmacy", e.target.value)} placeholder="マツモトキヨシ蒲田店" /></Field></Toggle>
          <Toggle id="atm" label="🏧 ATM・両替所" enabled={on.atm} toggle={tog}><Field label="ATM情報"><textarea style={txta} rows={2} value={opt.atm} onChange={e => uo("atm", e.target.value)} placeholder="セブンイレブンATM（海外カード対応）" /></Field></Toggle>
          <Toggle id="sightseeing" label="🚌 観光スポット" enabled={on.sightseeing} toggle={tog}><SpotList spots={sightseeing} setSpots={setSightseeing} fields={SHOP_F} addLabel="＋ スポットを追加" /></Toggle>
          <Toggle id="houseRules" label="🎌 ハウスルール" enabled={on.houseRules} toggle={tog}><Field label="ハウスルール"><textarea style={txta} rows={3} value={opt.houseRules} onChange={e => uo("houseRules", e.target.value)} placeholder="室内は靴を脱いでください。22:00以降は静かに。" /></Field></Toggle>
          <Toggle id="quietHours" label="🔇 静粛時間" enabled={on.quietHours} toggle={tog}><Field label="静粛時間"><input style={inp} value={opt.quietHours} onChange={e => uo("quietHours", e.target.value)} placeholder="22:00〜8:00" /></Field></Toggle>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(165deg, ${C.bg} 0%, #131b28 40%, ${C.bg} 100%)`, fontFamily: "'Noto Sans JP','Hiragino Sans',sans-serif", color: C.text }}>
      <style>{focusRing}</style>

      {/* Header */}
      <div style={{ background: "rgba(11,15,20,0.94)", borderBottom: `1px solid ${C.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontSize: 16 }}>🏠</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white }}>ゲストガイド生成ツール</div>
              <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.04em" }}>MOSVA</div>
            </div>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
            {[["form", "✏️ 入力"], ["preview", "👁 プレビュー"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "7px 16px", borderRadius: 8, border: "none", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", transition: "all 0.25s", fontFamily: "inherit",
                background: view === v ? C.accent : "transparent", color: view === v ? "#fff" : C.faint,
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 16px 100px" }}>
        {view === "form" ? (
          <>
            {/* Step tabs with completion dots */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 12, marginBottom: 12, scrollbarWidth: "none" }}>
              {STEPS.map((s, i) => {
                const pct = stepCompletion[i];
                const done = pct === 100 && i < 7;
                return (
                  <button key={i} onClick={() => setStep(i)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit",
                    transition: "all 0.2s", position: "relative",
                    background: step === i ? C.accent : "rgba(255,255,255,0.04)",
                    color: step === i ? "#fff" : done ? C.green : C.faint,
                    boxShadow: step === i ? `0 2px 12px ${C.accentGlow}` : "none",
                  }}>
                    {done && step !== i && <span style={{ fontSize: 11 }}>✓</span>}
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2, transition: "all 0.4s",
                  background: i < step ? C.accent : i === step ? `linear-gradient(90deg, ${C.accent}, ${C.accent}88)` : "rgba(255,255,255,0.06)",
                }} />
              ))}
            </div>

            {/* Form */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: C.accentSoft, fontSize: 22 }}>
                  {STEPS[step].icon}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.white }}>{STEPS[step].title}</div>
                  <div style={{ fontSize: 11, color: C.faint }}>ステップ {step + 1} / {STEPS.length}</div>
                </div>
              </div>
              <div style={{ minHeight: 180 }}>{renderStep()}</div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                <Btn v="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>← 前へ</Btn>
                <div style={{ display: "flex", gap: 4 }}>
                  {STEPS.map((_, i) => (
                    <div key={i} onClick={() => setStep(i)} style={{
                      width: 8, height: 8, borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
                      background: i === step ? C.accent : i < step ? C.dim : "rgba(255,255,255,0.1)",
                    }} />
                  ))}
                </div>
                {step < STEPS.length - 1 ? (
                  <Btn onClick={() => setStep(step + 1)}>次へ →</Btn>
                ) : (
                  <Btn onClick={() => setView("preview")} style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", padding: "10px 24px" }}>👁 プレビューへ</Btn>
                )}
              </div>
            </Card>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <Btn onClick={handleCopy} v={copied ? "success" : "primary"} style={{
                padding: "12px 28px", fontWeight: 700, fontSize: 14,
                background: copied ? C.green : "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                boxShadow: copied ? `0 2px 16px ${C.greenSoft}` : `0 2px 16px ${C.accentGlow}`,
              }}>
                {copied ? "✅ コピーしました！" : "📋 Googleドキュメントにコピー"}
              </Btn>
              <Btn v="outline" onClick={() => setView("form")}>✏️ 編集に戻る</Btn>
            </div>

            <Card style={{ background: C.accentSoft, border: `1px solid rgba(59,130,246,0.12)`, marginBottom: 14, padding: "12px 18px" }}>
              <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.7 }}>
                💡 上のボタンでコピーし、Googleドキュメントに貼り付けてください。
              </div>
            </Card>

            <div style={{
              background: "#fff", borderRadius: 14, padding: "28px 32px",
              fontSize: 13.5, lineHeight: 1.8, maxHeight: "75vh", overflow: "auto",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)", color: "#1a1a2e",
            }}>
              <MdPreview text={gen(allData)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
