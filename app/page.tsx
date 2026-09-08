'use client';

import { Activity, BarChart3, Bot, CheckCircle2, ChevronRight, CircleGauge, Database, Eye, FileClock, LockKeyhole, Menu, Radar, RefreshCw, Server, ShieldCheck, TrendingUp, WalletCards, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dashboardData from '../public/dashboard-data.json';

const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
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
  const [data, setData] = useState(dashboardData);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());
  const historical = data.historical;
  const forward = data.forward;
  const wallet = data.paper_wallet;
  const rangeSize: Record<string, number> = { '3M': 10, '6M': 20, '1Y': 40, ALL: 9999 };
  const equity = useMemo(() => data.equity_curve.slice(-rangeSize[range]), [data, range]);
  const drawdown = useMemo(() => data.drawdown_curve.slice(-rangeSize[range]), [data, range]);
  const generatedAt = new Date(data.generated_at);
  const ageHours = Math.max(0, (lastChecked.getTime() - generatedAt.getTime()) / 3_600_000);
  const freshness = ageHours <= 30 ? '最新' : '資料延遲';

  const refresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`./dashboard-data.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('snapshot unavailable');
      setData(await response.json());
      setLastChecked(new Date());
    } catch {
      setLastChecked(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };
  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><TrendingUp size={19} /></div><div><b>AlphaDesk</b><span>QUANT WORKSPACE</span></div><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="關閉選單"><X /></button></div>
        <nav aria-label="主要導覽">{navItems.map(({ label, icon: Icon, active }, index) => <button key={label} className={active ? 'active' : ''} onClick={() => goTo(['overview','forward','risk','system','data','research'][index])}><Icon size={17} /><span>{label}</span>{active && <ChevronRight size={14} />}</button>)}</nav>
        <div className="safety-card"><LockKeyhole size={18} /><div><b>安全鎖已啟用</b><span>只讀監控 · 禁止交易</span></div></div>
        <div className="sidebar-foot"><span>資料來源</span><b>本機策略檔案</b></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="開啟選單"><Menu /></button><div><h1>策略控制台</h1><p>V37.3 · 500 USDT 模擬運行</p></div><div className="top-actions"><span className={`online ${ageHours > 30 ? 'delayed' : ''}`}><i />{freshness}</span><span className="utc">資料：{generatedAt.toLocaleString('zh-HK', { hour12: false })}</span><button className="refresh-button" onClick={() => void refresh()} disabled={refreshing} aria-label="立即刷新"><RefreshCw size={15} className={refreshing ? 'spinning' : ''}/></button><div className="avatar">L</div></div></header>
        <div className="content">
          <section id="overview" className="strategy-banner"><div className="strategy-icon"><Bot /></div><div className="strategy-copy"><span>目前候選策略</span><h2>V37.3 · 比例資金配置</h2><p>USDT 永續合約 · 多資產 Long / Short · 每日再平衡</p></div><div className="banner-badges"><span className="badge paper"><WalletCards size={14}/> 500 USDT PAPER</span><span className="badge shadow"><Eye size={14} /> SHADOW ONLY</span><span className="badge frozen"><LockKeyhole size={14} /> 實盤鎖定</span></div></section>
          <section className="paper-strip" aria-label="模擬資金摘要"><div><span>模擬初始資金</span><strong>{wallet.starting_balance.toFixed(2)} USDT</strong></div><div><span>模擬目前淨值</span><strong>{wallet.current_balance.toFixed(2)} USDT</strong></div><div><span>Forward 模擬回報</span><strong>{wallet.net_return == null ? '等待首個完整交易日' : pct(wallet.net_return)}</strong></div><div><span>真實資金曝險</span><strong className="positive">{wallet.real_exposure.toFixed(2)} USDT</strong></div></section>
          <section className="metrics-grid">
            <MetricCard label="歷史 OOS 回報" value={`+${pct(historical.oos_return)}`} detail={`${historical.oos_days} 日獨立測試`} tone="green" /><MetricCard label="OOS Profit Factor" value={historical.oos_pf.toFixed(3)} detail="門檻 > 1.25" tone="green" /><MetricCard label="OOS Sharpe" value={historical.oos_sharpe.toFixed(3)} detail="門檻 > 0.75" tone="green" /><MetricCard label="OOS 最大回撤" value={pct(historical.oos_max_drawdown)} detail="上限 < 15%" /><MetricCard label="Forward 進度" value={`${forward.days} / ${forward.minimum_days}`} detail={`${forward.adjustments} / ${forward.minimum_adjustments} 次調整`} /><MetricCard label="真實訂單" value={String(dashboardData.orders_submitted)} detail={`promoted = ${dashboardData.promoted}`} />
          </section>
          <div className="dashboard-grid">
            <section id="research" className="panel equity-panel">
              <div className="panel-head"><div><span>歷史 OOS 模擬</span><h3>OOS 模擬淨值</h3></div><div className="range-tabs" aria-label="圖表時間範圍">{['3M','6M','1Y','ALL'].map(item => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div>
              <div className="chart-value"><strong>{historical.ending_equity.toFixed(2)}</strong><span>+{pct(historical.oos_return)} OOS</span></div>
              <div className="main-chart" aria-label="歷史 OOS 模擬淨值曲線"><ResponsiveContainer width="100%" height="100%"><AreaChart data={equity} margin={{ top:8,right:8,left:-18,bottom:0 }}><defs><linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#41e6a6" stopOpacity={0.24}/><stop offset="100%" stopColor="#41e6a6" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#18382d" vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={[450,900]} tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#0b1b16',border:'1px solid #23533f',borderRadius:10}} labelStyle={{color:'#8ea79d'}}/><Area type="monotone" dataKey="value" stroke="#41e6a6" strokeWidth={2.5} fill="url(#equityFill)"/></AreaChart></ResponsiveContainer></div>
              <p className="chart-note">歷史模擬結果並非實盤收益；交易成本已按 VIP 2 taker 0.06% 單邊計入。</p>
            </section>
            <section id="forward" className="panel status-panel"><div className="panel-title"><h3>Forward 模擬狀態</h3><span className="healthy"><i />實盤隔離</span></div><StatusRow label="執行模式" value={data.mode} good/><StatusRow label="策略升級" value={`promoted = ${data.promoted}`}/><StatusRow label="Forward readiness" value={forward.ready_for_review ? 'REVIEW REQUIRED' : 'NOT READY'}/><StatusRow label="最近一次排程" value={data.cron.state === 'healthy' ? '成功' : '失敗／待修復'} good={data.cron.state === 'healthy'}/><StatusRow label="真實持倉／訂單" value={`${wallet.real_positions} / ${data.orders_submitted}`} good/><div className="progress-block"><div><span>Forward 驗證</span><b>{Math.min(100, Math.round(forward.days / forward.minimum_days * 100))}%</b></div><div className="progress-track"><i style={{width:`${Math.min(100, forward.days / forward.minimum_days * 100)}%`}}/></div><p>完成度只代表觀察樣本累積，不代表已批准實盤。</p></div></section>
            <section id="risk" className="panel drawdown-panel"><div className="panel-title"><div><span>歷史 OOS 模擬</span><h3>風險與回撤</h3></div><b className="negative">最大 {pct(historical.oos_max_drawdown)}</b></div><div className="drawdown-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={drawdown} margin={{top:8,right:8,left:-18,bottom:0}}><defs><linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff667d" stopOpacity={0.05}/><stop offset="100%" stopColor="#ff667d" stopOpacity={0.24}/></linearGradient></defs><CartesianGrid stroke="#2b2429" vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" hide/><YAxis domain={[-10,0]} tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#0b1b16',border:'1px solid #4b2931',borderRadius:10}}/><Area type="monotone" dataKey="value" stroke="#ff667d" strokeWidth={2} fill="url(#ddFill)"/></AreaChart></ResponsiveContainer></div></section>
            <section id="system" className="panel guard-panel"><div className="panel-title"><h3>網站安全防線</h3><ShieldCheck className="positive" size={20}/></div><div className="guard-list"><div><CheckCircle2/><span><b>實盤執行鎖</b><small>promoted=false，網站無交易接口</small></span></div><div><CheckCircle2/><span><b>公開資料白名單</b><small>只同步統計結果，不含 Vault 或 API 憑證</small></span></div><div><CheckCircle2/><span><b>自動刷新</b><small>頁面每 60 秒檢查最新已發布快照</small></span></div></div></section>
          </div>
          <section id="data" className="bottom-grid"><article className="mini-panel"><Server/><div><span>每日自動管線</span><b>{data.cron.state === 'healthy' ? '最近成功' : '需要修復'}</b><small>{data.cron.last_success_utc ?? '尚未有紀錄'}</small></div><i className={`status-dot ${data.cron.state === 'healthy' ? '' : 'red'}`}/></article><article className="mini-panel"><Database/><div><span>合約資料宇宙</span><b>{historical.current_weex_specs.toLocaleString()} 個規格</b><small>公開市場資料</small></div><i className="status-dot"/></article><article className="mini-panel"><Radar/><div><span>歷史目標覆蓋率</span><b>{pct(historical.oos_target_coverage)}</b><small>OOS 平均值</small></div><i className="status-dot"/></article><article className="mini-panel"><CircleGauge/><div><span>網站模擬本金</span><b>{wallet.starting_balance.toFixed(0)} USDT</b><small>不連接交易帳戶</small></div><i className="status-dot amber"/></article></section>
          <footer>此網站只作策略研究與模擬監控。歷史績效不保證未來收益；目前不具備下單、撤單或存取交易帳戶能力。</footer>
        </div>
      </section>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="關閉選單背景"/>}
    </main>
  );
}
