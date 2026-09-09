'use client';

import { Activity, BarChart3, Bot, BriefcaseBusiness, CheckCircle2, ChevronRight, CircleGauge, Database, Eye, FileClock, History, LockKeyhole, Menu, Radar, RefreshCw, Server, ShieldCheck, TrendingUp, WalletCards, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dashboardData from '../public/dashboard-data.json';

const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
const actionLabels: Record<string, string> = { OPEN: '新開', HOLD: '維持', INCREASE: '加倉', DECREASE: '減倉', FLIP: '反向' };
const navItems = [
  { id: 'overview', label: '策略總覽', icon: BarChart3 },
  { id: 'positions', label: '模擬持倉', icon: BriefcaseBusiness },
  { id: 'forward', label: 'Forward 觀察', icon: Eye },
  { id: 'risk', label: '組合風險', icon: ShieldCheck },
  { id: 'system', label: '系統狀態', icon: Activity },
  { id: 'data', label: '數據狀態', icon: Database },
  { id: 'research', label: '研究紀錄', icon: FileClock },
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
  const [activeSection, setActiveSection] = useState('overview');
  const [positionView, setPositionView] = useState<'current' | 'history'>('current');
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
  const displayedPositions = positionView === 'current' ? data.shadow_portfolio.positions : [...data.position_history].reverse();
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
    setActiveSection(id);
    window.history.replaceState(null, '', `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };
  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><TrendingUp size={19} /></div><div><b>AlphaDesk</b><span>QUANT WORKSPACE</span></div><button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="關閉選單"><X /></button></div>
        <nav aria-label="主要導覽">{navItems.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className={activeSection === id ? 'active' : ''} aria-current={activeSection === id ? 'location' : undefined} onClick={(event) => { event.preventDefault(); goTo(id); }}><Icon size={17} /><span>{label}</span>{activeSection === id && <ChevronRight size={14} />}</a>)}</nav>
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
          <section id="positions" className="panel positions-panel">
            <div className="panel-head"><div><span>每日 Shadow 倉位帳本</span><h3>模擬持倉與歷史配置</h3></div><div className="position-tabs" aria-label="持倉檢視"><button className={positionView === 'current' ? 'selected' : ''} onClick={() => setPositionView('current')}><BriefcaseBusiness size={14}/>目前持倉</button><button className={positionView === 'history' ? 'selected' : ''} onClick={() => setPositionView('history')}><History size={14}/>歷史倉位</button></div></div>
            <div className="position-summary"><div><span>可執行模擬倉</span><b>{data.shadow_portfolio.position_count}</b></div><div><span>Long / Short</span><b><em className="positive">{data.shadow_portfolio.long_count}</em> / <em className="negative">{data.shadow_portfolio.short_count}</em></b></div><div><span>Gross 名義值</span><b>{data.shadow_portfolio.gross_notional_usdt.toFixed(2)} U</b></div><div><span>Net 名義值</span><b>{data.shadow_portfolio.net_notional_usdt.toFixed(2)} U</b></div><div><span>當日倉位損益</span><b className={data.shadow_portfolio.daily_net_pnl_usdt >= 0 ? 'positive' : 'negative'}>{data.shadow_portfolio.daily_net_pnl_usdt >= 0 ? '+' : ''}{data.shadow_portfolio.daily_net_pnl_usdt.toFixed(2)} U</b></div><div><span>當日模擬成本</span><b>{data.shadow_portfolio.daily_cost_usdt.toFixed(3)} U</b></div></div>
            <div className="exposure-bars"><div><span>LONG {data.shadow_portfolio.long_notional_usdt.toFixed(2)} U</span><i><b style={{width:`${data.shadow_portfolio.gross_notional_usdt ? data.shadow_portfolio.long_notional_usdt / data.shadow_portfolio.gross_notional_usdt * 100 : 0}%`}}/></i></div><div className="short"><span>SHORT {data.shadow_portfolio.short_notional_usdt.toFixed(2)} U</span><i><b style={{width:`${data.shadow_portfolio.gross_notional_usdt ? data.shadow_portfolio.short_notional_usdt / data.shadow_portfolio.gross_notional_usdt * 100 : 0}%`}}/></i></div><time>倉位日期：{data.shadow_portfolio.as_of?.slice(0, 10) ?? '等待日結'}</time></div>
            <div className="position-table-wrap"><table className="position-table detailed"><thead><tr><th>#</th><th>日期／合約</th><th>方向</th><th>動作</th><th>目標／執行權重</th><th>參考價 → 日結價</th><th>模擬名義值</th><th>淨損益</th></tr></thead><tbody>{displayedPositions.length ? displayedPositions.map((position, index) => <tr key={`${position.date}-${position.symbol}-${index}`}><td>{index + 1}</td><td><strong>{position.symbol.replace('/USDT:USDT','')}</strong><small>{position.date.slice(0,10)} · USDT PERP</small></td><td><span className={`side-badge ${position.side.toLowerCase()}`}>{position.side}</span></td><td><span className="action-badge">{actionLabels[position.action] ?? position.action}</span></td><td><strong>{(Math.abs(Number(position.target_weight)) * 100).toFixed(2)}%</strong><small>執行 {(Math.abs(Number(position.executed_weight)) * 100).toFixed(2)}%</small></td><td><strong>{Number(position.reference_price).toLocaleString()}</strong><small>→ {Number(position.mark_price).toLocaleString()}</small></td><td>{Number(position.shadow_notional_usdt).toFixed(2)} U</td><td className={Number(position.net_pnl_usdt) >= 0 ? 'positive' : 'negative'}>{Number(position.net_pnl_usdt) >= 0 ? '+' : ''}{Number(position.net_pnl_usdt).toFixed(3)} U<small>成本 {Number(position.cost_usdt).toFixed(3)} U</small></td></tr>) : <tr><td colSpan={8} className="empty-row">尚未有完成日嘅 Shadow 倉位。</td></tr>}</tbody></table></div>
            <p className="chart-note">只列出通過WEEX公開最小下單量及精度限制後嘅可執行模擬倉位；目標但被限制擋住嘅配置唔會冒充持倉。數據按完成日線每日更新，並無提交訂單。</p>
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
          <section className="detail-grid">
            <article className={`panel operations-panel ${data.cron.state === 'error' ? 'has-error' : ''}`}>
              <div className="panel-title"><div><span>今日運行</span><h3>自動化健康狀態</h3></div><b className={data.cron.state === 'healthy' ? 'positive' : 'negative'}>{data.cron.state === 'healthy' ? '正常' : '需要處理'}</b></div>
              <div className="incident"><Activity/><div><b>{data.cron.message}</b><span>最後嘗試：{data.cron.last_attempt_utc ?? '未有紀錄'}</span></div></div>
              <div className="event-list">{data.cron.recent_events.length ? data.cron.recent_events.map((event, index) => <div key={`${event.time}-${index}`}><i className={event.kind}/><time>{event.time}</time><span>{event.message}</span></div>) : <p>尚未有系統事件。</p>}</div>
            </article>
            <article className="panel risk-policy-panel">
              <div className="panel-title"><div><span>凍結規則</span><h3>500 USDT 模擬風險框架</h3></div><LockKeyhole size={18} className="positive"/></div>
              <div className="policy-grid"><div><span>目標 Gross</span><b>{pct(data.risk_policy.gross_target)}</b></div><div><span>單一資產上限</span><b>{pct(data.risk_policy.asset_cap)}</b></div><div><span>回撤門檻</span><b>&lt; {pct(data.risk_policy.max_drawdown_gate)}</b></div><div><span>交易成本</span><b>VIP {historical.vip_level} · {(historical.taker_fee_rate * 100).toFixed(3)}%</b></div></div>
              <p>以上係研究與 Shadow 計算規則；網站本身冇交易執行權限。</p>
            </article>
          </section>
          <section className="panel gates-panel">
            <div className="panel-title"><div><span>歷史獨立樣本</span><h3>候選策略 Gate 審核</h3></div><span className="gate-count">{Object.values(data.historical_gates).filter(Boolean).length}/{Object.keys(data.historical_gates).length} 歷史門檻通過</span></div>
            <div className="gate-table">{Object.entries(data.historical_gates).map(([name, passed]) => <div key={name}><span>{name}</span><b className={passed ? 'positive' : 'negative'}>{passed ? 'PASS' : 'FAIL'}</b></div>)}</div>
            <p>歷史 Gate 全通過仍不等於可實盤；必須另外累積未曝光 Forward 證據並經人工審核。</p>
          </section>
          <footer>此網站只作策略研究與模擬監控。歷史績效不保證未來收益；目前不具備下單、撤單或存取交易帳戶能力。</footer>
        </div>
      </section>
      {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="關閉選單背景"/>}
    </main>
  );
}
