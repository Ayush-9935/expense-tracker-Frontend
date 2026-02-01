import React, { useEffect, useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/* ======================
   Small Chart Component
====================== */
function BarChart({ data, theme }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              fontWeight: 900,
              color: theme.text,
            }}
          >
            <span style={{ opacity: 0.85 }}>{d.label}</span>
            <span style={{ opacity: 0.9 }}>₹ {d.value}</span>
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: theme.trackBg,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(d.value / max) * 100}%`,
                borderRadius: 999,
                background: "linear-gradient(90deg,#22c55e,#3b82f6)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ======================
   Main Group Page
====================== */
export default function GroupPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };
  const STYLES = theme === "dark" ? dark : light;

  // Tabs
  const [tab, setTab] = useState("expenses");

  // expense modal
  const [expenseModal, setExpenseModal] = useState(false);

  // add expense states
  const [payerId, setPayerId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ members (name only)
  const [memberName, setMemberName] = useState("");
  const [removeName, setRemoveName] = useState("");

  // expenses filter
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");

  // ✅ list/grid for expenses
  const [expenseView, setExpenseView] = useState("list"); // "list" | "grid"

  // ✅ Recent activity modal
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // ✅ Search modal
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // ✅ Delete Expense modal
  const [deleteExpenseOpen, setDeleteExpenseOpen] = useState(false);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState({ id: "", title: "" });
  const [deletingExpense, setDeletingExpense] = useState(false);

  // ✅ Remove member modal
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState({ name: "" });
  const [removingMember, setRemovingMember] = useState(false);

  /* =====================================================
      ✅ EDIT EXPENSE FEATURE STATES
  ===================================================== */
  const [editExpenseOpen, setEditExpenseOpen] = useState(false);
  const [editExpenseTarget, setEditExpenseTarget] = useState(null);
  const [editPayerId, setEditPayerId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editingExpense, setEditingExpense] = useState(false);
  const [editError, setEditError] = useState("");

  // ✅ Toast modal (NO alert / NO localhost popup)
  const [toast, setToast] = useState({ open: false, msg: "", type: "good" });
  const openToast = (msg, type = "good") => setToast({ open: true, msg, type });
  const closeToast = () => setToast({ open: false, msg: "", type: "good" });

  // ✅ Hide scrollbars + remove border flash
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      html,body,#root{ margin:0; padding:0; background:#070A14; }

      .smart-activity-hide-scrollbar::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-activity-hide-scrollbar{ scrollbar-width:none; -ms-overflow-style:none; }

      .smart-expenses-hide-scrollbar::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-expenses-hide-scrollbar{ scrollbar-width:none; -ms-overflow-style:none; }

      .smart-card-scroll::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-card-scroll{ scrollbar-width:none; -ms-overflow-style:none; }

      /* ✅ mobile tweaks */
      @media (max-width: 900px){
        .gp_topPanels{ grid-template-columns: 1fr !important; }
        .gp_actions{ width: 100%; justify-content: center; }
        .gp_headerMid{ width: 100%; order: 3; }
        .gp_tabWrap{ padding: 0 14px 26px !important; }
        .gp_tabs{ padding: 0 14px 16px !important; }
        .gp_statGrid{ padding: 18px 14px !important; }
        .gp_topPanelsPad{ padding: 0 14px 16px !important; }
        .gp_header{ padding: 18px 14px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);

      if (res.data?.members?.length && !payerId) {
        const myId = user?.id;
        const found = res.data.members.find((m) => String(m._id || m.id) === String(myId));
        setPayerId(found ? found._id || found.id : res.data.members[0]._id);
      }
    } catch (e) {
      console.error(e);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, [id]);

  // ✅ search behaves like dashboard (open modal on typing)
  useEffect(() => {
    if (query.trim()) setSearchModalOpen(true);
  }, [query]);

  const expenses = useMemo(() => group?.expenses || [], [group]);
  const history = useMemo(() => group?.settledPayments || [], [group]);

  /* =====================================================
     Paid map + Equal Share
  ===================================================== */
  const paidMap = useMemo(() => {
    const map = {};
    if (!group?.members?.length) return map;
    group.members.forEach((m) => (map[String(m._id)] = 0));

    expenses.forEach((ex) => {
      const pid = ex.payer?._id || ex.payer;
      if (!pid) return;
      const key = String(pid);
      map[key] = (map[key] || 0) + (ex.amount || 0);
    });

    return map;
  }, [group?.members, expenses]);

  const totalExpenseAmount = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);

  const equalShare = useMemo(() => {
    const membersCount = group?.members?.length || 0;
    return membersCount ? +(totalExpenseAmount / membersCount).toFixed(2) : 0;
  }, [group?.members?.length, totalExpenseAmount]);

  /* =====================================================
     FIXED BALANCES (apply settlements)
  ===================================================== */
  const balances = useMemo(() => {
    if (!group?.members?.length) return [];

    const members = group.members;
    const perHead = members.length ? totalExpenseAmount / members.length : 0;

    let list = members.map((m) => {
      const paid = paidMap[String(m._id)] || 0;
      return {
        userId: m._id,
        name: m.name,
        paid: +paid.toFixed(2),
        share: +perHead.toFixed(2),
        balance: +(paid - perHead).toFixed(2),
      };
    });

    (history || []).forEach((sp) => {
      const amt = Number(sp.amount || 0);
      if (!amt) return;

      if (sp.fromUserId) {
        list = list.map((x) =>
          String(x.userId) === String(sp.fromUserId) ? { ...x, balance: +(x.balance - amt).toFixed(2) } : x
        );
      }

      if (sp.toUserId) {
        list = list.map((x) =>
          String(x.userId) === String(sp.toUserId) ? { ...x, balance: +(x.balance + amt).toFixed(2) } : x
        );
      }
    });

    return list;
  }, [group?.members, paidMap, totalExpenseAmount, history]);

  /* =====================================================
     Suggested settlements
  ===================================================== */
  const settlements = useMemo(() => {
    const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ ...b, balance: Math.abs(b.balance) }));
    const creditors = balances.filter((b) => b.balance > 0);

    const result = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const pay = Math.min(debtor.balance, creditor.balance);

      if (pay > 0.01) result.push({ from: debtor.name, to: creditor.name, amount: +pay.toFixed(2) });

      debtor.balance -= pay;
      creditor.balance -= pay;

      if (debtor.balance <= 0.01) i++;
      if (creditor.balance <= 0.01) j++;
    }

    return result;
  }, [balances]);

  /* ======================
     Stats cards
  ====================== */
  const stats = useMemo(() => {
    const totalMembers = group?.members?.length || 0;
    const totalExpenses = expenses.length;
    const totalAmount = totalExpenseAmount;

    const myId = user?.id;
    const perHead = totalMembers ? totalAmount / totalMembers : 0;

    const paidByMe = expenses.reduce((sum, e) => {
      const pid = e.payer?._id || e.payer;
      return String(pid) === String(myId) ? sum + (e.amount || 0) : sum;
    }, 0);

    const settleOut = history.reduce((s, h) => (String(h.fromUserId) === String(myId) ? s + (h.amount || 0) : s), 0);
    const settleIn = history.reduce((s, h) => (String(h.toUserId) === String(myId) ? s + (h.amount || 0) : s), 0);

    const net = paidByMe - perHead + settleOut - settleIn;
    return { totalMembers, totalExpenses, totalAmount, net };
  }, [group, expenses, user?.id, history, totalExpenseAmount]);

  /* ======================
     Expense Filter + Sort
  ====================== */
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) => (e.description || "").toLowerCase().includes(q));
    }

    if (sort === "latest") list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (sort === "high") list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
    if (sort === "low") list.sort((a, b) => (a.amount || 0) - (b.amount || 0));

    return list;
  }, [expenses, query, sort]);

  /* ======================
     Expense Summary Graph
  ====================== */
  const expenseChartData = useMemo(() => {
    const list = [...expenses].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6).reverse();
    return list.map((e) => ({ label: (e.description || "Expense").slice(0, 10), value: e.amount || 0 }));
  }, [expenses]);

  const recentActivity = useMemo(() => {
    const acts = [];
    expenses.forEach((e) =>
      acts.push({
        type: "expense",
        text: `💸 ${e.payer?.name || "Someone"} added ₹${e.amount} (${e.description || "Expense"})`,
        at: e.createdAt,
      })
    );
    history.forEach((h) => acts.push({ type: "settle", text: `✅ ${h.from} paid ${h.to} ₹${h.amount}`, at: h.paidAt }));
    return acts.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  }, [expenses, history]);

  /* ======================
     Actions
  ====================== */
  const addExpense = async (e) => {
    e.preventDefault();
    setError("");
    if (!payerId || !amount || Number(amount) <= 0) return setError("Please select payer and enter valid amount.");

    try {
      setSaving(true);
      await api.post(`/groups/${id}/expenses`, { payerId, amount: Number(amount), description: desc || "Expense" });
      setAmount("");
      setDesc("");
      setExpenseModal(false);
      await fetchGroup();
      openToast("✅ Expense added successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to add expense.");
    } finally {
      setSaving(false);
    }
  };

  const askDeleteExpense = (expenseId, title) => {
    setDeleteExpenseTarget({ id: expenseId, title: title || "Expense" });
    setDeleteExpenseOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseTarget?.id) return;

    try {
      setDeletingExpense(true);
      await api.delete(`/groups/${id}/expenses/${deleteExpenseTarget.id}`);
      setDeleteExpenseOpen(false);
      setDeleteExpenseTarget({ id: "", title: "" });
      await fetchGroup();
      openToast("✅ Expense deleted successfully!");
    } catch {
      openToast("❌ Delete expense failed", "bad");
    } finally {
      setDeletingExpense(false);
    }
  };

  const addMember = async () => {
    const name = memberName.trim();
    if (!name) return;

    try {
      await api.post(`/groups/${id}/members`, { memberName: name });
      setMemberName("");
      await fetchGroup();
      openToast("✅ Member added!");
    } catch (e) {
      openToast(e?.response?.data?.error || "❌ Add member failed", "bad");
    }
  };

  const askRemoveMember = () => {
    const name = removeName.trim();
    if (!name) return;
    setRemoveMemberTarget({ name });
    setRemoveMemberOpen(true);
  };

  const confirmRemoveMember = async () => {
    const name = removeMemberTarget?.name?.trim();
    if (!name) return;

    try {
      setRemovingMember(true);
      await api.delete(`/groups/${id}/members/by-name/${encodeURIComponent(name)}`);
      setRemoveName("");
      setRemoveMemberOpen(false);
      setRemoveMemberTarget({ name: "" });
      await fetchGroup();
      openToast("✅ Member removed!");
    } catch (e) {
      openToast(e?.response?.data?.error || "❌ Remove member failed", "bad");
    } finally {
      setRemovingMember(false);
    }
  };

  const settleUp = async (from, to, amount) => {
    try {
      await api.post(`/groups/${id}/settle`, { from, to, amount });
      openToast("✅ Settlement recorded!");
      await fetchGroup();
    } catch {
      openToast("❌ Settle failed", "bad");
    }
  };

  const askEditExpense = (ex) => {
    setEditError("");
    setEditExpenseTarget(ex);
    setEditPayerId(ex?.payer?._id || ex?.payer || "");
    setEditAmount(String(ex?.amount ?? ""));
    setEditDesc(ex?.description || "");
    setEditExpenseOpen(true);
  };

  const confirmEditExpense = async (e) => {
    e.preventDefault();
    setEditError("");

    if (!editExpenseTarget?._id) return;
    if (!editPayerId || !editAmount || Number(editAmount) <= 0) return setEditError("Please select payer and enter valid amount.");

    try {
      setEditingExpense(true);
      await api.put(`/groups/${id}/expenses/${editExpenseTarget._id}`, { payerId: editPayerId, amount: Number(editAmount), description: editDesc || "Expense" });
      setEditExpenseOpen(false);
      setEditExpenseTarget(null);
      await fetchGroup();
      openToast("✅ Updated successfully!");
    } catch (err) {
      console.error(err);
      setEditError(err?.response?.data?.error || "Failed to update expense.");
    } finally {
      setEditingExpense(false);
    }
  };

  const refreshPage = () => window.location.reload();

  /* ======================
     Loading / Not found
  ====================== */
  if (loading) {
    return (
      <PageShell theme={STYLES}>
        <div style={{ padding: 30, color: STYLES.text, opacity: 0.8 }}>Loading group...</div>
      </PageShell>
    );
  }

  if (!group) {
    return (
      <PageShell theme={STYLES}>
        <div style={{ padding: 30, color: STYLES.text }}>
          <h2>Group not found</h2>
          <button style={STYLES.btnPrimaryFull} onClick={() => nav("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell theme={STYLES}>
      <div style={STYLES.bgBlob1} />
      <div style={STYLES.bgBlob2} />
      <div style={STYLES.bgGrid} />

      {/* Header */}
      <header className="gp_header" style={STYLES.topHeader}>
        <button onClick={() => nav("/dashboard")} style={STYLES.btnGhost}>
          ← Dashboard
        </button>

        <div className="gp_headerMid" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.75, color: STYLES.mutedText }}>Group</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: STYLES.text }}>{group.name}</h1>
        </div>

        <div className="gp_actions" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button style={STYLES.themeBtn} onClick={toggleTheme}>
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <button style={STYLES.btnGhost} onClick={refreshPage}>
            Refresh
          </button>

          <button style={STYLES.btnPrimaryMini} onClick={() => setExpenseModal(true)}>
            + Add Expense
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="gp_statGrid" style={STYLES.statGrid}>
        <StatCard theme={STYLES} title="Members" value={stats.totalMembers} icon="👥" />
        <StatCard theme={STYLES} title="Expenses" value={stats.totalExpenses} icon="💸" />
        <StatCard theme={STYLES} title="Total Amount" value={`₹ ${stats.totalAmount}`} icon="₹" />
        <StatCard theme={STYLES} title="Your Net" value={`${stats.net >= 0 ? "Gets" : "Owes"} ₹ ${Math.abs(Math.round(stats.net))}`} icon="⚖️" />
      </div>

      {/* Graph + Activity */}
      <div className="gp_topPanels gp_topPanelsPad" style={STYLES.topPanels}>
        <section style={STYLES.panel}>
          <div style={{ fontWeight: 900, marginBottom: 12, color: STYLES.text }}>Expense Summary</div>
          {expenseChartData.length === 0 ? <div style={{ opacity: 0.75, color: STYLES.mutedText }}>No expenses yet.</div> : <BarChart data={expenseChartData} theme={STYLES} />}
        </section>

        <section className="smart-activity-hide-scrollbar" style={{ ...STYLES.panel, ...STYLES.activityPanel }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900, color: STYLES.text }}>Recent Activity</div>
            <button style={STYLES.miniGhost} onClick={() => setActivityModalOpen(true)}>
              View More →
            </button>
          </div>

          {recentActivity.slice(0, 4).length === 0 ? (
            <div style={{ opacity: 0.75, color: STYLES.mutedText, marginTop: 12 }}>No activity yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {recentActivity.slice(0, 4).map((a, idx) => (
                <div key={idx} style={STYLES.activityCard}>
                  <div style={{ fontWeight: 900, color: STYLES.text }}>{a.text}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, color: STYLES.mutedText }}>{a.at ? new Date(a.at).toLocaleString() : "-"}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Tabs */}
      <div className="gp_tabs" style={STYLES.tabs}>
        <TabBtn theme={STYLES} active={tab === "expenses"} onClick={() => setTab("expenses")}>
          Expenses
        </TabBtn>
        <TabBtn theme={STYLES} active={tab === "balances"} onClick={() => setTab("balances")}>
          Balances
        </TabBtn>
        <TabBtn theme={STYLES} active={tab === "settlements"} onClick={() => setTab("settlements")}>
          Settlements
        </TabBtn>
        <TabBtn theme={STYLES} active={tab === "members"} onClick={() => setTab("members")}>
          Members
        </TabBtn>
        <TabBtn theme={STYLES} active={tab === "history"} onClick={() => setTab("history")}>
          History
        </TabBtn>
      </div>

      {/* Content */}
      <div className="gp_tabWrap" style={STYLES.tabWrap}>
        {/* EXPENSES */}
        {tab === "expenses" && (
          <Card
            theme={STYLES}
            title="Expenses"
            right={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input placeholder="Search expense..." value={query} onChange={(e) => setQuery(e.target.value)} style={STYLES.search} />
                <select value={sort} onChange={(e) => setSort(e.target.value)} style={STYLES.select}>
                  <option value="latest" style={STYLES.optionStyle}>
                    Latest
                  </option>
                  <option value="high" style={STYLES.optionStyle}>
                    Amount High
                  </option>
                  <option value="low" style={STYLES.optionStyle}>
                    Amount Low
                  </option>
                </select>

                <div style={STYLES.toggleWrap}>
                  <button style={{ ...STYLES.toggleBtn, ...(expenseView === "list" ? STYLES.toggleActive : {}) }} onClick={() => setExpenseView("list")}>
                    List
                  </button>
                  <button style={{ ...STYLES.toggleBtn, ...(expenseView === "grid" ? STYLES.toggleActive : {}) }} onClick={() => setExpenseView("grid")}>
                    Grid
                  </button>
                </div>
              </div>
            }
          >
            {filteredExpenses.length === 0 ? (
              <div style={{ opacity: 0.75, color: STYLES.mutedText }}>No expenses found.</div>
            ) : (
              <div className="smart-expenses-hide-scrollbar" style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 6 }}>
                <div style={expenseView === "grid" ? STYLES.expenseGrid : { display: "flex", flexDirection: "column", gap: 12 }}>
                  {filteredExpenses.map((ex) => (
                    <div key={ex._id} style={STYLES.expenseCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 900, color: STYLES.text }}>{ex.description || "Expense"}</div>
                          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, color: STYLES.mutedText }}>
                            Paid by <b>{ex.payer?.name || "Unknown"}</b> • {ex.createdAt ? new Date(ex.createdAt).toLocaleString() : ""}
                          </div>
                        </div>

                        <div style={{ display: "grid", justifyItems: "end", gap: 10 }}>
                          <div style={{ fontWeight: 900, color: STYLES.text }}>₹ {ex.amount}</div>

                          <div style={{ display: "flex", gap: 10 }}>
                            <button style={STYLES.smallEditBtn} onClick={() => askEditExpense(ex)}>
                              ✏️ Edit
                            </button>

                            <button style={STYLES.smallDangerBtn} onClick={() => askDeleteExpense(ex._id, ex.description)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ✅ BALANCES (ONLY NAME SCROLL FIXED) */}
        {tab === "balances" && (
          <Card
            theme={STYLES}
            title="Balance Summary"
            right={
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.85, color: STYLES.mutedText }}>
                Equal Share / Person: ₹ {equalShare}
              </div>
            }
          >
            {balances.length === 0 ? (
              <div style={{ opacity: 0.75, color: STYLES.mutedText }}>No balance data available.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {/* ✅ header not scroll */}
                <div style={STYLES.balanceTableHeader}>
                  <div>Member</div>
                  <div style={{ textAlign: "right" }}>Paid</div>
                  <div style={{ textAlign: "right" }}>Share</div>
                  <div style={{ textAlign: "right" }}>Net</div>
                </div>

                {/* ✅ ONLY rows scroll */}
                <div className="smart-card-scroll" style={{ maxHeight: "52vh", overflowY: "auto", paddingRight: 6 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    {balances.map((b) => {
                      const net = +(b.paid - b.share).toFixed(2);
                      const finalBal = b.balance;
                      const good = finalBal >= 0;

                      return (
                        <div key={String(b.userId)} style={STYLES.balanceTableRow}>
                          <div style={{ fontWeight: 900, color: STYLES.text }}>{b.name}</div>

                          <div style={{ textAlign: "right", fontWeight: 900, color: STYLES.text }}>₹ {b.paid}</div>
                          <div style={{ textAlign: "right", fontWeight: 900, color: STYLES.text }}>₹ {b.share}</div>

                          <div style={{ textAlign: "right", fontWeight: 900, color: net >= 0 ? "#22c55e" : "#ef4444" }}>
                            {net >= 0 ? `+₹ ${net}` : `-₹ ${Math.abs(net)}`}
                          </div>

                          <div style={STYLES.balanceStatusPill}>
                            <span
                              style={{
                                ...STYLES.balancePill,
                                background: good ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
                                border: `1px solid ${good ? "rgba(34,197,94,0.30)" : "rgba(239,68,68,0.30)"}`,
                                color: STYLES.text,
                              }}
                            >
                              {good ? `Gets ₹${finalBal}` : `Owes ₹${Math.abs(finalBal)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, color: STYLES.mutedText, fontWeight: 800 }}>
                  * “Net” is calculated from expenses only (Paid − Share). “Gets/Owes” shows final balance after settlements.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* SETTLEMENTS (scroll) */}
        {tab === "settlements" && (
          <Card theme={STYLES} title="Suggested Settlements">
            <div className="smart-card-scroll" style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 6 }}>
              {settlements.length === 0 ? (
                <div style={{ opacity: 0.75, color: STYLES.mutedText }}>🎉 Everyone settled!</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {settlements.map((s, idx) => (
                    <div key={idx} style={STYLES.settlementRow}>
                      <div style={{ fontWeight: 800, color: STYLES.text }}>
                        {s.from} → {s.to}
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <b style={{ color: STYLES.text }}>₹ {s.amount}</b>
                        <button style={STYLES.settleBtn} onClick={() => settleUp(s.from, s.to, s.amount)}>
                          Settle ✅
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* MEMBERS */}
        {tab === "members" && (
          <Card theme={STYLES} title="Members">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Enter member name to add" style={{ ...STYLES.input, flex: 1, minWidth: 240 }} />
              <button style={{ ...STYLES.btnPrimaryMini, minWidth: 130 }} onClick={addMember}>
                + Add Member
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <input value={removeName} onChange={(e) => setRemoveName(e.target.value)} placeholder="Enter member name to remove" style={{ ...STYLES.input, flex: 1, minWidth: 240 }} />
              <button
                style={{
                  ...STYLES.btnGhost,
                  minWidth: 160,
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.10)",
                }}
                onClick={askRemoveMember}
              >
                Remove Member
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {group.members?.map((m) => (
                <span key={m._id} style={STYLES.chip}>
                  {m.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* HISTORY (scroll) */}
        {tab === "history" && (
          <Card theme={STYLES} title="Settlement History">
            <div className="smart-card-scroll" style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: 6 }}>
              {history.length === 0 ? (
                <div style={{ opacity: 0.75, color: STYLES.mutedText }}>No settlements recorded yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {[...history]
                    .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))
                    .map((h, idx) => (
                      <div key={idx} style={STYLES.historyRow}>
                        <div style={{ fontWeight: 900, color: STYLES.text }}>
                          {h.from} → {h.to}
                        </div>
                        <div style={{ fontWeight: 900, color: STYLES.text }}>₹ {h.amount}</div>
                        <div style={{ fontSize: 12, opacity: 0.75, color: STYLES.mutedText }}>
                          {h.paidAt ? new Date(h.paidAt).toLocaleString() : "-"}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* ✅ Activity Modal */}
      <div style={{ ...STYLES.overlay, opacity: activityModalOpen ? 1 : 0, pointerEvents: activityModalOpen ? "auto" : "none" }} onClick={() => setActivityModalOpen(false)}>
        <div style={STYLES.modalWide} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Recent Activity</div>
            <button style={STYLES.xBtn} onClick={() => setActivityModalOpen(false)}>
              ✕
            </button>
          </div>

          <div className="smart-activity-hide-scrollbar" style={{ marginTop: 14, maxHeight: "70vh", overflowY: "auto" }}>
            {recentActivity.length === 0 ? (
              <div style={{ opacity: 0.75, color: STYLES.mutedText }}>No activity yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {recentActivity.slice(0, 30).map((a, idx) => (
                  <div key={idx} style={STYLES.activityCard}>
                    <div style={{ fontWeight: 900, color: STYLES.text }}>{a.text}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, color: STYLES.mutedText }}>{a.at ? new Date(a.at).toLocaleString() : "-"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button style={{ ...STYLES.btnGhostFull, marginTop: 12 }} onClick={() => setActivityModalOpen(false)}>
            Close
          </button>
        </div>
      </div>

      {/* ✅ Search Modal */}
      <div style={{ ...STYLES.overlay, opacity: searchModalOpen ? 1 : 0, pointerEvents: searchModalOpen ? "auto" : "none" }} onClick={() => setSearchModalOpen(false)}>
        <div style={STYLES.modalWide} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Search Results</div>
            <button style={STYLES.xBtn} onClick={() => setSearchModalOpen(false)}>
              ✕
            </button>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Search expense..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ ...STYLES.search, flex: 1, minWidth: 240 }} />
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.8, color: STYLES.mutedText }}>{query.trim() ? `${filteredExpenses.length} match(es)` : "Type to search"}</div>
          </div>

          <div className="smart-expenses-hide-scrollbar" style={{ marginTop: 14, maxHeight: "70vh", overflowY: "auto" }}>
            {filteredExpenses.length === 0 ? (
              <div style={{ opacity: 0.75, color: STYLES.mutedText }}>No expenses found.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredExpenses.slice(0, 50).map((ex) => (
                  <div key={ex._id} style={STYLES.expenseCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 900, color: STYLES.text }}>{ex.description || "Expense"}</div>
                        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, color: STYLES.mutedText }}>
                          Paid by <b>{ex.payer?.name || "Unknown"}</b> • {ex.createdAt ? new Date(ex.createdAt).toLocaleString() : ""}
                        </div>
                      </div>

                      <div style={{ display: "grid", justifyItems: "end", gap: 10 }}>
                        <div style={{ fontWeight: 900, color: STYLES.text }}>₹ {ex.amount}</div>
                        <button style={STYLES.smallEditBtn} onClick={() => askEditExpense(ex)}>
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button style={{ ...STYLES.btnGhostFull, marginTop: 12 }} onClick={() => setSearchModalOpen(false)}>
            Close
          </button>
        </div>
      </div>

      {/* Add Expense Modal */}
      <div style={{ ...STYLES.overlay, opacity: expenseModal ? 1 : 0, pointerEvents: expenseModal ? "auto" : "none" }} onClick={() => setExpenseModal(false)}>
        <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Add Expense</div>
            <button style={STYLES.xBtn} onClick={() => setExpenseModal(false)}>
              ✕
            </button>
          </div>

          <form onSubmit={addExpense}>
            <div style={STYLES.formRow}>
              <label style={STYLES.label}>Paid By</label>
              <select value={payerId} onChange={(e) => setPayerId(e.target.value)} style={STYLES.input}>
                {group.members?.map((m) => (
                  <option key={m._id} value={m._id} style={STYLES.optionStyle}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={STYLES.formRow}>
              <label style={STYLES.label}>Amount</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" style={STYLES.input} />
            </div>

            <div style={STYLES.formRow}>
              <label style={STYLES.label}>Description</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Dinner, Petrol..." style={STYLES.input} />
            </div>

            {error && <div style={{ color: "#ef4444", marginTop: 12 }}>{error}</div>}

            <button type="submit" style={{ ...STYLES.btnPrimaryFull, marginTop: 14, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? "Adding..." : "+ Add Expense"}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Expense Modal */}
      <div style={{ ...STYLES.overlay, opacity: editExpenseOpen ? 1 : 0, pointerEvents: editExpenseOpen ? "auto" : "none" }} onClick={() => setEditExpenseOpen(false)}>
        <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Edit Expense</div>
            <button style={STYLES.xBtn} onClick={() => setEditExpenseOpen(false)}>
              ✕
            </button>
          </div>

          <form onSubmit={confirmEditExpense}>
            <div style={STYLES.formRow}>
              <label style={STYLES.label}>Paid By</label>
              <select value={editPayerId} onChange={(e) => setEditPayerId(e.target.value)} style={STYLES.input}>
                {group.members?.map((m) => (
                  <option key={m._id} value={m._id} style={STYLES.optionStyle}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={STYLES.formRow}>
              <label style={STYLES.label}>Amount</label>
              <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="e.g. 500" style={STYLES.input} />
            </div>

            <div style={STYLES.formRow}>
              <label style={STYLES.label}>Description</label>
              <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Dinner, Petrol..." style={STYLES.input} />
            </div>

            {editError && <div style={{ color: "#ef4444", marginTop: 12 }}>{editError}</div>}

            <button type="submit" style={{ ...STYLES.btnPrimaryFull, marginTop: 14, opacity: editingExpense ? 0.7 : 1 }} disabled={editingExpense}>
              {editingExpense ? "Updating..." : "✅ Update Expense"}
            </button>

            <button type="button" style={{ ...STYLES.btnGhostFull, marginTop: 10 }} onClick={() => setEditExpenseOpen(false)}>
              Cancel
            </button>
          </form>
        </div>
      </div>

      {/* Delete Expense Modal */}
      <div style={{ ...STYLES.overlay, opacity: deleteExpenseOpen ? 1 : 0, pointerEvents: deleteExpenseOpen ? "auto" : "none" }} onClick={() => setDeleteExpenseOpen(false)}>
        <div style={STYLES.confirmModal} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Delete Expense?</div>
          <div style={{ marginTop: 8, opacity: 0.8, color: STYLES.mutedText }}>
            Are you sure you want to delete <b>{deleteExpenseTarget?.title}</b> ?
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={STYLES.btnGhostFull} onClick={() => setDeleteExpenseOpen(false)}>
              Cancel
            </button>

            <button style={{ ...STYLES.btnDangerFull, opacity: deletingExpense ? 0.7 : 1 }} onClick={confirmDeleteExpense} disabled={deletingExpense}>
              {deletingExpense ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Remove Member Modal */}
      <div style={{ ...STYLES.overlay, opacity: removeMemberOpen ? 1 : 0, pointerEvents: removeMemberOpen ? "auto" : "none" }} onClick={() => setRemoveMemberOpen(false)}>
        <div style={STYLES.confirmModal} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Remove Member?</div>

          <div style={{ marginTop: 8, opacity: 0.8, color: STYLES.mutedText }}>
            Are you sure you want to remove <b>{removeMemberTarget?.name}</b> from this group?
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={STYLES.btnGhostFull} onClick={() => setRemoveMemberOpen(false)}>
              Cancel
            </button>

            <button style={{ ...STYLES.btnDangerFull, opacity: removingMember ? 0.7 : 1 }} onClick={confirmRemoveMember} disabled={removingMember}>
              {removingMember ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Toast Modal */}
      <div style={{ ...STYLES.overlay, opacity: toast.open ? 1 : 0, pointerEvents: toast.open ? "auto" : "none" }} onClick={closeToast}>
        <div style={STYLES.toastBox} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontWeight: 900, color: STYLES.text }}>{toast.type === "good" ? "✅ Success" : toast.type === "warn" ? "⚠️ Warning" : "❌ Error"}</div>
          <div style={{ marginTop: 8, opacity: 0.85, color: STYLES.mutedText }}>{toast.msg}</div>

          <button style={{ ...STYLES.btnPrimaryFull, marginTop: 14 }} onClick={closeToast}>
            OK
          </button>
        </div>
      </div>
    </PageShell>
  );
}

/* -------------------------- UI -------------------------- */
function PageShell({ children, theme }) {
  return <div style={theme.page}>{children}</div>;
}

function Card({ title, right, children, theme }) {
  return (
    <div style={theme.card}>
      <div style={theme.cardHeader}>
        <div style={{ fontWeight: 900, color: theme.text }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, icon, theme }) {
  return (
    <div style={theme.statCardUI}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900, color: theme.mutedText }}>{title}</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: theme.text }}>{value}</div>
        </div>
        <div style={theme.statIcon}>{icon}</div>
      </div>
    </div>
  );
}

function TabBtn({ theme, active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...theme.tabBtn,
        ...(active ? theme.tabBtnActive : {}),
        color: active ? theme.tabActiveText : theme.tabText,
      }}
    >
      {children}
    </button>
  );
}

/* -------------------------- THEMES -------------------------- */
const dark = {
  text: "#fff",
  mutedText: "rgba(255,255,255,0.75)",
  trackBg: "rgba(255,255,255,0.12)",
  optionStyle: { background: "#0B1026", color: "#fff" },

  tabText: "#fff",
  tabActiveText: "#0b1220",

  toggleWrap: { display: "flex", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)" },
  toggleBtn: { padding: "10px 12px", border: "none", cursor: "pointer", fontWeight: 900, background: "transparent", color: "#fff" },
  toggleActive: { background: "linear-gradient(90deg,#22c55e,#3b82f6)", color: "#0b1220" },

  expenseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 },

  miniGhost: { padding: "8px 10px", borderRadius: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 900, whiteSpace: "nowrap" },

  modalWide: { width: 720, maxWidth: "94vw", padding: 18, borderRadius: 18, background: "rgba(10,14,28,0.96)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.35)", overflow: "hidden" },

  page: { minHeight: "100vh", position: "relative", overflow: "hidden", color: "#fff", fontFamily: "Poppins, sans-serif", paddingBottom: 50, background: "linear-gradient(135deg,#070A14,#0B1026,#0F172A)" },

  toastBox: { width: 420, maxWidth: "92vw", padding: 18, borderRadius: 18, background: "rgba(10,14,28,0.96)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" },

  activityPanel: { maxHeight: 360, overflowY: "auto" },
  activityCard: { padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" },

  bgBlob1: { position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,#3b82f6,transparent 70%)", top: -170, left: -140, filter: "blur(40px)", opacity: 0.42, zIndex: 0 },
  bgBlob2: { position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,#22c55e,transparent 70%)", bottom: -200, right: -180, filter: "blur(50px)", opacity: 0.34, zIndex: 0 },
  bgGrid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "70px 70px", opacity: 0.2, zIndex: 0 },

  topHeader: { zIndex: 2, position: "sticky", top: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(10,14,28,0.55)", backdropFilter: "blur(18px)" },

  themeBtn: { padding: "10px 12px", borderRadius: 14, cursor: "pointer", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 900 },

  statGrid: { zIndex: 2, position: "relative", display: "grid", gap: 14, padding: "18px 22px", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" },

  statCardUI: { borderRadius: 18, padding: 16, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 12px 35px rgba(0,0,0,0.22)" },

  statIcon: { width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", fontSize: 18, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)" },

  topPanels: { zIndex: 2, position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 22px 16px" },

  panel: { padding: 18, borderRadius: 18, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 14px 40px rgba(0,0,0,0.30)" },

  tabs: { zIndex: 2, position: "relative", display: "flex", gap: 10, flexWrap: "wrap", padding: "0 22px 16px" },

  tabBtn: { padding: "10px 12px", borderRadius: 999, cursor: "pointer", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", fontWeight: 900 },

  tabBtnActive: { background: "linear-gradient(90deg,#22c55e,#3b82f6)", border: "none" },

  tabWrap: { zIndex: 2, position: "relative", padding: "0 22px 30px" },

  card: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 18, padding: 18, boxShadow: "0 10px 35px rgba(0,0,0,0.25)" },

  cardHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" },

  chip: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800, background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.32)", color: "#fff" },

  search: { padding: "10px 12px", borderRadius: 12, outline: "none", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff" },

  select: { padding: "10px 12px", borderRadius: 12, outline: "none", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 800, appearance: "none" },

  expenseCard: { padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" },

  smallEditBtn: { padding: "8px 10px", borderRadius: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(59,130,246,0.18)", color: "#fff", fontWeight: 900 },

  smallDangerBtn: { padding: "8px 10px", borderRadius: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(239,68,68,0.16)", color: "#fff", fontWeight: 900 },

  settlementRow: { display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", color: "#fff" },

  historyRow: { padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", display: "grid", gap: 6 },

  settleBtn: { padding: "8px 10px", borderRadius: 12, cursor: "pointer", border: "none", fontWeight: 900, background: "linear-gradient(90deg,#22c55e,#3b82f6)", color: "#0b1220" },

  input: { padding: "11px 12px", borderRadius: 12, outline: "none", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", boxSizing: "border-box" },

  btnGhost: { padding: "10px 14px", borderRadius: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 800 },

  btnPrimaryMini: { padding: "12px 14px", borderRadius: 14, cursor: "pointer", border: "none", fontWeight: 900, background: "linear-gradient(90deg,#22c55e,#3b82f6)", color: "#0b1220" },

  btnPrimaryFull: { width: "100%", padding: "12px 16px", borderRadius: 14, cursor: "pointer", border: "none", fontWeight: 900, color: "#0b1220", background: "linear-gradient(90deg,#22c55e,#3b82f6)" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", transition: "0.25s", zIndex: 50 },

  modal: { width: 460, maxWidth: "92vw", padding: 18, borderRadius: 18, background: "rgba(10,14,28,0.96)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" },

  confirmModal: { width: 430, maxWidth: "92vw", padding: 18, borderRadius: 18, background: "rgba(10,14,28,0.98)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 18px 60px rgba(0,0,0,0.40)" },

  xBtn: { border: "none", cursor: "pointer", fontWeight: 900, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.08)", color: "#fff" },

  btnGhostFull: { width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", fontWeight: 900, background: "rgba(255,255,255,0.06)", color: "#fff" },

  btnDangerFull: { width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", fontWeight: 900, background: "rgba(239,68,68,0.16)", color: "#fff" },

  formRow: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  label: { fontSize: 13, opacity: 0.85, fontWeight: 700, color: "#fff" },

  balanceTableHeader: { display: "grid", gridTemplateColumns: "1.2fr 0.7fr 0.7fr 0.7fr", gap: 10, padding: "10px 12px", borderRadius: 14, fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" },

  balanceTableRow: { display: "grid", gridTemplateColumns: "1.2fr 0.7fr 0.7fr 0.7fr", gap: 10, alignItems: "center", padding: "12px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" },

  balanceStatusPill: { gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: 8 },
  balancePill: { padding: "8px 12px", borderRadius: 999, fontWeight: 900, fontSize: 12 },
};

const light = {
  ...dark,
  text: "#0b1220",
  mutedText: "rgba(2,6,23,0.75)",
  trackBg: "rgba(2,6,23,0.12)",
  optionStyle: { background: "#ffffff", color: "#0b1220" },

  tabText: "#0b1220",
  tabActiveText: "#0b1220",

  toggleWrap: { ...dark.toggleWrap, border: "1px solid rgba(2,6,23,0.18)", background: "rgba(255,255,255,0.92)" },
  toggleBtn: { ...dark.toggleBtn, color: "#0b1220" },
  toggleActive: { ...dark.toggleActive, color: "#0b1220" },

  page: { ...dark.page, color: "#0b1220", background: "linear-gradient(135deg,#f8fafc,#eef2ff,#ecfeff)" },

  modalWide: { ...dark.modalWide, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)", boxShadow: "0 18px 60px rgba(2,6,23,0.16)" },

  toastBox: { ...dark.toastBox, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)", boxShadow: "0 18px 60px rgba(2,6,23,0.16)" },

  miniGhost: { ...dark.miniGhost, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  topHeader: { ...dark.topHeader, borderBottom: "1px solid rgba(2,6,23,0.08)", background: "rgba(255,255,255,0.75)" },

  panel: { ...dark.panel, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(2,6,23,0.10)" },

  activityCard: { ...dark.activityCard, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.10)" },

  tabBtn: { ...dark.tabBtn, border: "1px solid rgba(2,6,23,0.18)", background: "rgba(255,255,255,0.92)", color: "#0b1220" },

  card: { ...dark.card, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.10)" },

  statCardUI: { ...dark.statCardUI, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.10)" },

  expenseCard: { ...dark.expenseCard, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.10)" },

  settlementRow: { ...dark.settlementRow, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", color: "#0b1220" },

  historyRow: { ...dark.historyRow, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.10)" },

  chip: { ...dark.chip, color: "#0b1220", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.20)" },

  search: { ...dark.search, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  select: { ...dark.select, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  input: { ...dark.input, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  btnGhost: { ...dark.btnGhost, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  themeBtn: { ...dark.themeBtn, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  smallDangerBtn: { ...dark.smallDangerBtn, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: "#0b1220" },

  smallEditBtn: { ...dark.smallEditBtn, background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.20)", color: "#0b1220" },

  modal: { ...dark.modal, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)" },

  confirmModal: { ...dark.confirmModal, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)", boxShadow: "0 18px 60px rgba(2,6,23,0.16)" },

  xBtn: { ...dark.xBtn, background: "rgba(2,6,23,0.08)", color: "#0b1220" },

  btnGhostFull: { ...dark.btnGhostFull, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  btnDangerFull: { ...dark.btnDangerFull, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: "#0b1220" },

  balanceTableHeader: { ...dark.balanceTableHeader, background: "rgba(2,6,23,0.04)", border: "1px solid rgba(2,6,23,0.10)", color: "rgba(2,6,23,0.75)" },

  balanceTableRow: { ...dark.balanceTableRow, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(2,6,23,0.10)" },
};
