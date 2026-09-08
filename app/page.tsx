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
  const [range, setRange] = useState('TODAY');
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());
  const historical = data.historical;
  const forward = data.forward;
  const wallet = data.paper_wallet;
  const rangeSize: Record<string, number> = { TODAY: 1, '7D': 7, '30D': 30 };
  const forwardSeries = useMemo(() => data.forward_daily.slice(-rangeSize[range]), [data, range]);
  const drawdown = useMemo(() => data.drawdown_curve.slice(-rangeSize[range]), [data, range]);
  const latestDay = data.forward_daily.at(-1);
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
            <MetricCard label="今日模擬盈虧" value={latestDay ? pct(latestDay.net) : '等待日結'} detail={latestDay?.date ?? '尚未產完整 Forward 日'} tone={latestDay && latestDay.net >= 0 ? 'green' : latestDay ? 'red' : 'neutral'} /><MetricCard label="今日模擬淨值" value={`${wallet.current_balance.toFixed(2)} U`} detail="500 USDT 起始資金" /><MetricCard label="今日調倉" value={String(latestDay?.adjustments ?? 0)} detail="Shadow accounting only" /><MetricCard label="最新觀察日" value={forward.latest_observation?.slice(0, 10) ?? '等待資料'} detail="UTC 已完成日線" /><MetricCard label="Forward 進度" value={`${forward.days} 日`} detail={`${forward.adjustments} 次調整`} /><MetricCard label="真實訂單" value={String(data.orders_submitted)} detail={`promoted = ${data.promoted}`} />
          </section>
          <div className="dashboard-grid">
            <section id="research" className="panel equity-panel">
              <div className="panel-head"><div><span>每日 Forward Shadow</span><h3>500 USDT 模擬淨值</h3></div><div className="range-tabs" aria-label="圖表時間範圍">{[['TODAY','今日'],['7D','7日'],['30D','30日']].map(([key,label]) => <button key={key} className={range === key ? 'selected' : ''} onClick={() => setRange(key)}>{label}</button>)}</div></div>
              <div className="chart-value"><strong>{wallet.current_balance.toFixed(2)} USDT</strong><span>{latestDay ? `${latestDay.net >= 0 ? '+' : ''}${pct(latestDay.net)} 今日` : '等待首個完整交易日'}</span></div>
              <div className="main-chart" aria-label="每日 Forward 模擬淨值曲線">{forwardSeries.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={forwardSeries} margin={{ top:8,right:8,left:-18,bottom:0 }}><defs><linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#41e6a6" stopOpacity={0.24}/><stop offset="100%" stopColor="#41e6a6" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#18382d" vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={['auto','auto']} tick={{fill:'#71877e',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#0b1b16',border:'1px solid #23533f',borderRadius:10}} labelStyle={{color:'#8ea79d'}}/><Area type="monotone" dataKey="equity" stroke="#41e6a6" strokeWidth={2.5} fill="url(#equityFill)"/></AreaChart></ResponsiveContainer> : <div className="empty-chart"><Activity/><b>今日尚未產生完整日結</b><span>每日資料完成後，Shadow 日結會自動顯示。</span></div>}</div>
              <p className="chart-note">只顯示 V37.3 凍結後嘅每日 Shadow 結果；唔混入歷史回測，亦唔會假造即時盈虧。</p>
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
