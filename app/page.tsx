'use client';

import { Activity, BarChart3, Bot, CheckCircle2, ChevronRight, CircleGauge, Database, Eye, FileClock, LockKeyhole, Menu, Radar, Server, ShieldCheck, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const equity = [
  { date: '2025-08', value: 500 }, { date: '2025-10', value: 528 },
  { date: '2025-12', value: 502 }, { date: '2026-02', value: 571 },
  { date: '2026-04', value: 632 }, { date: '2026-06', value: 714 },
  { date: '2026-08', value: 791 }, { date: '2026-09', value: 829.4 },
];
const drawdown = [
  { date: '2025-08', value: 0 }, { date: '2025-10', value: -2.1 },
  { date: '2025-12', value: -8.5 }, { date: '2026-02', value: -1.8 },
  { date: '2026-04', value: -4.6 }, { date: '2026-06', value: -2.2 },
  { date: '2026-08', value: -6.1 }, { date: '2026-09', value: -0.8 },
];
const navItems = [
  { label: '策略總覽', icon: BarChart3, active: true }, { label: 'Forward 觀察', icon: Eye },
  { label: '組合風險', icon: ShieldCheck }, { label: '系統狀態', icon: Activity },
  { label: '數據狀態', icon: Database }, { label: '研究紀錄', icon: FileClock },
];

function MetricCard({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail: string; tone?: 'green' | 'red' | 'neutral' }) {
  return <article className="metric-card"><p>{label}</p><strong className={tone === 'green' ? 'positive' : tone === 'red' ? 'negative' : ''}>{value}</strong><span>{detail}</span></article>;
}
function StatusRow({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return <div className="status-row"><span>{label}</span><b className={good ? 'positive' : ''}>{value}</b></div>;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState('ALL');
  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><TrendingUp size={19} /></div><div><b>AlphaDesk</b><span>QUANT WORKSPACE</span></div><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="關閉選單"><X /></button></div>
        <nav aria-label="主要導覽">{navItems.map(({ label, icon: Icon, active }) => <button key={label} className={active ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Icon size={17} /><span>{label}</span>{active && <ChevronRight size={14} />}</button>)}</nav>
        <div className="safety-card"><LockKeyhole size={18} /><div><b>安全鎖已啟用</b><span>只讀監控 · 禁止交易</span></div></div>
        <div className="sidebar-foot"><span>資料來源</span><b>本機策略檔案</b></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="開啟選單"><Menu /></button><div><h1>策略控制台</h1><p>V37.3 永續合約研究系統</p></div><div className="top-actions"><span className="online"><i />資料已同步</span><span className="utc">UTC · 09/07 00:01</span><div className="avatar">L</div></div></header>
        <div className="content">
          <section className="strategy-banner"><div className="strategy-icon"><Bot /></div><div className="strategy-copy"><span>目前候選策略</span><h2>V37.3 · 比例資金配置</h2><p>USDT 永續合約 · 多資產 Long / Short · 每日再平衡</p></div><div className="banner-badges"><span className="badge shadow"><Eye size={14} /> SHADOW ONLY</span><span className="badge frozen"><LockKeyhole size={14} /> 規則已凍結</span></div></section>
          <section className="metrics-grid">
            <MetricCard label="歷史 OOS 回報" value="+32.94%" detail="379 日獨立測試" tone="green" /><MetricCard label="OOS Profit Factor" value="1.309" detail="門檻 > 1.25" tone="green" /><MetricCard label="OOS Sharpe" value="1.604" detail="門檻 > 0.75" tone="green" /><MetricCard label="OOS 最大回撤" value="8.48%" detail="上限 < 15%" /><MetricCard label="Forward 進度" value="0 / 180" detail="V37.3 新資料日數" /><MetricCard label="真實訂單" value="0" detail="promoted = false" />
          </section>
          <div className="dashboard-grid">
            <section className="panel equity-panel">
              <div className="panel-head"><div><span>歷史 OOS 模擬</span><h3>500 USDT 模擬淨值</h3></div><div className="range-tabs" aria-label="圖表時間範圍">{['3M','6M','1Y','ALL'].map(item => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div>
              <div className="chart-value"><strong>829.40</strong><span>+32.94% OOS</span></div>
              <div className="main-chart" aria-label="歷史 OOS 模擬淨值曲線"><ResponsiveContainer width="100%" height="100%"><AreaChart data={equity} margin={{ top:8,right:8,left:-18,bottom:0 }}><defs><linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#41e6a6" stopOpacity={0.24}/><stop offset="100%" stopColor="#41e6a6" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#18382d" vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={[450,900]} tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#0b1b16',border:'1px solid #23533f',borderRadius:10}} labelStyle={{color:'#8ea79d'}}/><Area type="monotone" dataKey="value" stroke="#41e6a6" strokeWidth={2.5} fill="url(#equityFill)"/></AreaChart></ResponsiveContainer></div>
              <p className="chart-note">歷史模擬結果並非實盤收益；交易成本已按 VIP 2 taker 0.06% 單邊計入。</p>
            </section>
            <section className="panel status-panel"><div className="panel-title"><h3>策略運行狀態</h3><span className="healthy"><i />安全</span></div><StatusRow label="執行模式" value="SHADOW ONLY" good/><StatusRow label="升級狀態" value="promoted = false"/><StatusRow label="Forward readiness" value="NOT READY"/><StatusRow label="最後排程" value="成功" good/><StatusRow label="真實訂單送出" value="0" good/><div className="progress-block"><div><span>Forward 驗證</span><b>0%</b></div><div className="progress-track"><i style={{width:'0%'}}/></div><p>需要 180 日及最少 150 次調整後再作人工審核</p></div></section>
            <section className="panel drawdown-panel"><div className="panel-title"><div><span>歷史 OOS 模擬</span><h3>回撤曲線</h3></div><b className="negative">最低 -8.48%</b></div><div className="drawdown-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={drawdown} margin={{top:8,right:8,left:-18,bottom:0}}><defs><linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff667d" stopOpacity={0.05}/><stop offset="100%" stopColor="#ff667d" stopOpacity={0.24}/></linearGradient></defs><CartesianGrid stroke="#2b2429" vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" hide/><YAxis domain={[-10,0]} tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#0b1b16',border:'1px solid #4b2931',borderRadius:10}}/><Area type="monotone" dataKey="value" stroke="#ff667d" strokeWidth={2} fill="url(#ddFill)"/></AreaChart></ResponsiveContainer></div></section>
            <section className="panel guard-panel"><div className="panel-title"><h3>安全防線</h3><ShieldCheck className="positive" size={20}/></div><div className="guard-list"><div><CheckCircle2/><span><b>交易執行鎖</b><small>未升級策略不可下單</small></span></div><div><CheckCircle2/><span><b>資料隔離</b><small>網站不載入 API 憑證</small></span></div><div><CheckCircle2/><span><b>只讀介面</b><small>沒有下單或取消操作</small></span></div></div></section>
          </div>
          <section className="bottom-grid"><article className="mini-panel"><Server/><div><span>排程服務</span><b>最近一次成功</b><small>2026-09-07 00:01 UTC</small></div><i className="status-dot"/></article><article className="mini-panel"><Database/><div><span>合約資料宇宙</span><b>1,011 個可用規格</b><small>公開市場資料</small></div><i className="status-dot"/></article><article className="mini-panel"><Radar/><div><span>目標覆蓋率</span><b>83.02%</b><small>OOS 平均值</small></div><i className="status-dot"/></article><article className="mini-panel"><CircleGauge/><div><span>資金配置</span><b>500 USDT 基準</b><small>50% gross target</small></div><i className="status-dot amber"/></article></section>
        </div>
      </section>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="關閉選單背景"/>}
    </main>
  );
}
