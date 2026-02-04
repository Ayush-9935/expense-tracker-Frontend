import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

/* ======= Small chart (no external library) ======= */
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
            <span style={{ opacity: 0.88, color: theme.text }}>{d.label}</span>
            <span style={{ opacity: 0.92, color: theme.text }}>₹ {d.value}</span>
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

export default function Dashboard() {
  const nav = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [groupName, setGroupName] = useState("");

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [view, setView] = useState("grid");

  // ✅ View Groups MODAL like Add Expense
  const [viewGroupsModalOpen, setViewGroupsModalOpen] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [showMoreActivity, setShowMoreActivity] = useState(false);

  // ✅ Recent Activity modal
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // ✅ Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: "", name: "" });
  const [deleting, setDeleting] = useState(false);

  // ✅ Rename modal
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState({ id: "", oldName: "" });
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // ✅ Choose group modal for Add Expense + Pending Settlement
  const [chooseGroupOpen, setChooseGroupOpen] = useState(false);

  // ✅ Toast Modal (No alert())
  const [toast, setToast] = useState({ open: false, msg: "", type: "good" });

  const openToast = (msg, type = "good") => setToast({ open: true, msg, type });
  const closeToast = () => setToast({ open: false, msg: "", type: "good" });

  // ✅ Hide scrollbars (sidebar + recent activity + groups)
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      html, body { margin:0; padding:0; background:#000; }
      .smart-sidebar-hide-scrollbar::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-sidebar-hide-scrollbar{ scrollbar-width:none; -ms-overflow-style:none; }

      .smart-activity-hide-scrollbar::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-activity-hide-scrollbar{ scrollbar-width:none; -ms-overflow-style:none; }

      .smart-groups-hide-scrollbar::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-groups-hide-scrollbar{ scrollbar-width:none; -ms-overflow-style:none; }

      .smart-modal-scroll::-webkit-scrollbar{ width:0px; height:0px; }
      .smart-modal-scroll{ scrollbar-width:none; -ms-overflow-style:none; }

      /* ✅ Responsive layout */
     @media (max-width: 980px){
  .smart-layout-grid{ grid-template-columns: 1fr !important; }
  .smart-sidebar-sticky{ position: relative !important; top: auto !important; height:auto !important; }
  .smart-section-grid{ grid-template-columns: 1fr !important; }

  /* ✅ Navbar mobile fix */
  header{
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 10px !important;
  }

  header > div:last-child{
    width: 100% !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
  }

  /* ✅ Show hamburger in mobile */
  button[style*="hamburger"]{
    display: block !important;
  }

  /* ✅ View groups modal mobile fit */
  .smart-modal-scroll{
    max-height: 65vh !important;
    overflow-y: auto !important;
  }
}

    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ✅ protect
  useEffect(() => {
    if (!user) nav("/");
  }, [user, nav]);

  // ✅ load groups
  useEffect(() => {
    if (user?.id) loadGroups();
    // eslint-disable-next-line
  }, [user?.id]);

  // ✅ when user starts searching -> open view group modal automatically
  useEffect(() => {
    if (query.trim()) setViewGroupsModalOpen(true);
  }, [query]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups?userId=${user?.id}`);
      setGroups(res.data || []);
    } catch (e) {
      console.log(e);
      setGroups([]);
      openToast("❌ Failed to load groups", "bad");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refresh EXACTLY like Browser refresh (Reload page)
  const refreshDashboard = () => {
    window.location.reload();
  };

  // ✅ logout
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    nav("/");
  };

  // ✅ create group
  const createGroup = async () => {
    if (!groupName.trim()) return;

    try {
      await api.post("/groups", {
        name: groupName.trim(),
        createdBy: user?.id,
      });

      setGroupName("");
      setPanelOpen(false);
      await loadGroups();
      openToast("✅ Group created successfully!");
    } catch {
      openToast("❌ Failed to create group", "bad");
    }
  };

  // ✅ rename group modal open
  const askRenameGroup = (groupId, oldName) => {
    setRenameTarget({ id: groupId, oldName });
    setRenameName(oldName || "");
    setRenameModalOpen(true);
  };

  const confirmRenameGroup = async () => {
    if (!renameTarget?.id || !renameName.trim()) return;

    try {
      setRenaming(true);
      await api.put(`/groups/${renameTarget.id}`, {
        name: renameName.trim(),
        userId: user?.id,
      });

      setRenameModalOpen(false);
      setRenameTarget({ id: "", oldName: "" });
      setRenameName("");
      await loadGroups();
      openToast("✅ Group renamed successfully!");
    } catch {
      openToast("❌ Rename failed", "bad");
    } finally {
      setRenaming(false);
    }
  };

  // ✅ delete group modal open
  const askDeleteGroup = (groupId, gname) => {
    setDeleteTarget({ id: groupId, name: gname });
    setDeleteModalOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!deleteTarget?.id) return;

    try {
      setDeleting(true);
      await api.delete(`/groups/${deleteTarget.id}?userId=${user?.id}`);
      setDeleteModalOpen(false);
      setDeleteTarget({ id: "", name: "" });
      await loadGroups();
      openToast("✅ Group deleted successfully!");
    } catch {
      openToast("❌ Delete failed", "bad");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ THEME
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  /* =====================================================
     ✅ DASHBOARD DATA
  ===================================================== */
  const allExpenses = useMemo(() => {
    const list = [];
    groups.forEach((g) => {
      (g.expenses || []).forEach((ex) => {
        list.push({
          ...ex,
          groupId: g._id,
          groupName: g.name,
        });
      });
    });

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [groups]);

  const analytics = useMemo(() => {
    const totalGroups = groups.length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.members?.length || 0), 0);
    const totalSpent = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpenses = allExpenses.length;
    return { totalGroups, totalMembers, totalExpenses, totalSpent };
  }, [groups, allExpenses]);

  /* =====================================================
     ✅ FIXED: BALANCE SUMMARY (includes settlements)
  ===================================================== */
  const balanceSummary = useMemo(() => {
    const myId = user?.id;
    if (!myId) return { get: 0, owe: 0, net: 0 };

    let net = 0;

    groups.forEach((g) => {
      const members = g.members || [];
      const userExists = members.some((m) => String(m._id || m.id) === String(myId));
      if (!userExists) return;

      const memberCount = members.length || 1;

      const total = (g.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      const myShare = total / memberCount;

      const paid = (g.expenses || []).reduce((s, e) => {
        const pid = e.payer?._id || e.payer;
        return String(pid) === String(myId) ? s + (e.amount || 0) : s;
      }, 0);

      let groupNet = paid - myShare;

      const settlements = g.settledPayments || [];
      const settledOut = settlements.reduce(
        (s, sp) => (String(sp.fromUserId) === String(myId) ? s + (sp.amount || 0) : s),
        0
      );
      const settledIn = settlements.reduce(
        (s, sp) => (String(sp.toUserId) === String(myId) ? s + (sp.amount || 0) : s),
        0
      );

      groupNet += settledOut - settledIn;
      net += groupNet;
    });

    return {
      get: Math.round(net > 0 ? net : 0),
      owe: Math.round(net < 0 ? Math.abs(net) : 0),
      net: Math.round(net),
    };
  }, [groups, user?.id]);

  /* =====================================================
     ✅ FIXED: PENDING SETTLEMENT (includes settlements)
  ===================================================== */
  const pendingSettlements = useMemo(() => {
    const myId = user?.id;
    if (!myId) return { count: 0, amount: 0 };

    let count = 0;
    let amount = 0;

    groups.forEach((g) => {
      const members = g.members || [];
      const userExists = members.some((m) => String(m._id || m.id) === String(myId));
      if (!userExists) return;

      const memberCount = members.length || 1;

      const total = (g.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
      const myShare = total / memberCount;

      const paid = (g.expenses || []).reduce((s, e) => {
        const pid = e.payer?._id || e.payer;
        return String(pid) === String(myId) ? s + (e.amount || 0) : s;
      }, 0);

      let net = paid - myShare;

      const settlements = g.settledPayments || [];
      const settledOut = settlements.reduce(
        (s, sp) => (String(sp.fromUserId) === String(myId) ? s + (sp.amount || 0) : s),
        0
      );
      const settledIn = settlements.reduce(
        (s, sp) => (String(sp.toUserId) === String(myId) ? s + (sp.amount || 0) : s),
        0
      );

      net += settledOut - settledIn;

      if (net < 0) {
        count++;
        amount += Math.abs(net);
      }
    });

    return { count, amount: Math.round(amount) };
  }, [groups, user?.id]);

  const expenseSummaryChart = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label, value: 0 });
    }

    allExpenses.forEach((ex) => {
      const date = new Date(ex.createdAt || 0);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const match = months.find((m) => m.key === key);
      if (match) match.value += ex.amount || 0;
    });

    return months.map((m) => ({ label: m.label, value: Math.round(m.value) }));
  }, [allExpenses]);

  const notifications = useMemo(() => {
    const noExpenseGroups = groups.filter((g) => (g.expenses || []).length === 0).length;
    const activeGroups = groups.filter((g) => (g.expenses || []).length > 0).length;

    const msg = [];
    if (activeGroups > 0) msg.push({ type: "good", text: `✅ ${activeGroups} group(s) have active expenses.` });
    if (noExpenseGroups > 0) msg.push({ type: "warn", text: `⚠️ ${noExpenseGroups} group(s) have no expenses yet.` });
    if (groups.length === 0) msg.push({ type: "warn", text: `⚠️ You haven’t created any group yet.` });

    return msg.slice(0, 4);
  }, [groups]);

  /* =====================================================
     ✅ UPDATED: RECENT ACTIVITY (includes settlements)
  ===================================================== */
  const recentActivity = useMemo(() => {
    const activity = [];

    groups.forEach((g) => {
      if (g.createdAt) activity.push({ type: "group", text: `📌 Group created: ${g.name}`, date: g.createdAt });
    });

    allExpenses.forEach((ex) => {
      activity.push({
        type: "expense",
        text: `💸 Expense added in ${ex.groupName}: ₹${ex.amount} (${ex.description || "Expense"})`,
        date: ex.createdAt,
      });
    });

    groups.forEach((g) => {
      (g.settledPayments || []).forEach((sp) => {
        activity.push({
          type: "settle",
          text: `✅ Settlement in ${g.name}: ${sp.from} paid ${sp.to} ₹${sp.amount}`,
          date: sp.paidAt,
        });
      });
    });

    activity.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return activity.slice(0, 10);
  }, [groups, allExpenses]);

  const filteredGroups = useMemo(() => {
    let list = [...groups];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((g) => (g.name || "").toLowerCase().includes(q));
    }

    if (sort === "az") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "za") list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    if (sort === "latest") list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return list;
  }, [groups, query, sort]);

  const STYLES = theme === "dark" ? dark : light;

  // ✅ Google style highlight in results
  const highlightMatch = (text, q) => {
    if (!q?.trim()) return text;
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text || "").split(new RegExp(`(${safeQ})`, "ig"));

    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} style={{ ...STYLES.mark, color: STYLES.text }}>
              {p}
            </mark>
          ) : (
            <span key={i} style={{ color: STYLES.text }}>
              {p}
            </span>
          )
        )}
      </>
    );
  };

  const openActivityModal = () => {
    setActivityModalOpen(true);
    setShowMoreActivity(true);
  };

  return (
    <div style={STYLES.page}>
      <div style={STYLES.bgBlob1} />
      <div style={STYLES.bgBlob2} />
      <div style={STYLES.bgGrid} />

      {/* Navbar */}
      <header style={STYLES.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={STYLES.hamburger} onClick={() => setDrawerOpen(true)}>
            ☰
          </button>

          <div style={STYLES.brand}>
            <div style={STYLES.logo}>₹</div>
            <div>
              <div style={{ fontWeight: 900, color: STYLES.text }}>Smart Expense Splitter</div>
              <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>Dashboard</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={STYLES.themeBtn} onClick={toggleTheme}>
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <div style={STYLES.profileChip}>
            <div style={STYLES.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ fontWeight: 900, fontSize: 13, color: STYLES.text }}>{user?.name}</div>
          </div>

          <button style={STYLES.btnDangerTop} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="smart-layout-grid" style={STYLES.layout}>
        {/* Sidebar */}
        <aside className="smart-sidebar-hide-scrollbar smart-sidebar-sticky" style={STYLES.sidebar}>
          <div style={STYLES.sidebarCard}>
            <div style={STYLES.sideTitle}>Quick Actions</div>

            <button style={STYLES.btnPrimary} onClick={() => setPanelOpen(true)}>
              + Create Group
            </button>

            {/* ✅ Browser reload refresh */}
            <button style={STYLES.btnGhost} onClick={refreshDashboard}>
              Refresh
            </button>

            <button
              style={STYLES.btnGhost}
              onClick={() => {
                if (filteredGroups.length === 0) return openToast("⚠️ Create a group first!", "warn");
                setChooseGroupOpen(true);
              }}
            >
              ➕ Add Expense (Choose Group)
            </button>
          </div>

          {/* Pending Settlements */}
          <div style={STYLES.sidebarCard}>
            <div style={STYLES.sideTitle}>Pending Settlement</div>

            {pendingSettlements.count === 0 ? (
              <div style={{ opacity: 0.9, color: STYLES.mutedText, fontWeight: 900 }}>
                ✅ No pending settlements
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 900, fontSize: 14, color: STYLES.text }}>
                  You have {pendingSettlements.count} pending payments
                </div>
                <div style={{ marginTop: 8, fontWeight: 900, color: STYLES.warnText }}>
                  Total Due: ₹ {pendingSettlements.amount}
                </div>

                <button
                  style={{ ...STYLES.btnPrimary, marginTop: 12 }}
                  onClick={() => {
                    if (filteredGroups.length === 0) return openToast("⚠️ No groups found!", "warn");
                    setChooseGroupOpen(true);
                  }}
                >
                  View Settlement →
                </button>
              </>
            )}
          </div>

          {/* Notifications */}
          <div style={STYLES.sidebarCard}>
            <div style={STYLES.sideTitle}>Notifications</div>

            <div style={{ display: "grid", gap: 10 }}>
              {notifications.map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    ...STYLES.note,
                    color: STYLES.text,
                    border:
                      n.type === "good"
                        ? `1px solid ${STYLES.goodBorder}`
                        : `1px solid ${STYLES.warnBorder}`,
                    background: n.type === "good" ? STYLES.goodBg : STYLES.warnBg,
                  }}
                >
                  {n.text}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={STYLES.main}>
          <div style={STYLES.statsGrid}>
            <StatCard theme={STYLES} title="You Get" value={`₹ ${balanceSummary.get}`} icon="🟢" />
            <StatCard theme={STYLES} title="You Owe" value={`₹ ${balanceSummary.owe}`} icon="🔴" />
            <StatCard
              theme={STYLES}
              title="Net Balance"
              value={`${balanceSummary.net >= 0 ? "+" : "-"} ₹ ${Math.abs(balanceSummary.net)}`}
              icon="⚖️"
            />
          </div>

          {/* ✅ controls */}
          <div style={STYLES.controls}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups..."
              style={STYLES.search}
            />

            <button style={STYLES.viewGroupBtn} onClick={() => setViewGroupsModalOpen(true)} title="View Groups">
              👥 View Groups
            </button>
          </div>

          {/* ✅ Expense Summary + Recent Activity */}
          <div className="smart-section-grid" style={STYLES.sectionGrid}>
            <section style={STYLES.panel}>
              <div style={STYLES.panelHeader}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: STYLES.text }}>Expense Summary</div>
                  <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>
                    Total spending (last 6 months)
                  </div>
                </div>
              </div>

              <BarChart data={expenseSummaryChart} theme={STYLES} />

              <div style={STYLES.divider} />
              <div style={{ fontSize: 13, fontWeight: 900, color: STYLES.text }}>
                Total Spent: ₹ {analytics.totalSpent}
              </div>
            </section>

            {/* ✅ FIXED: View More not collapsing (button is outside scroll area) */}
            <section style={{ ...STYLES.panel, display: "flex", flexDirection: "column" }}>
              <div style={STYLES.panelHeader}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: STYLES.text }}>Recent Activity</div>
                  <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>
                    Latest updates in your account
                  </div>
                </div>
              </div>

              <div
                className="smart-activity-hide-scrollbar"
                style={{ ...STYLES.activityPanel, flex: 1, overflowY: "auto" }}
              >
                {recentActivity.slice(0, 4).length === 0 ? (
                  <div style={{ opacity: 0.82, color: STYLES.mutedText }}>No activity yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {recentActivity.slice(0, 4).map((a, idx) => (
                      <div key={idx} style={STYLES.expRow}>
                        <div>
                          <div style={{ fontWeight: 900, color: STYLES.text }}>{a.text}</div>
                          <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>
                            {a.date ? new Date(a.date).toLocaleString() : "-"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {recentActivity.length > 4 && (
                <button style={STYLES.viewMoreBtn} onClick={openActivityModal}>
                  View More →
                </button>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* ✅ VIEW GROUPS MODAL */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: viewGroupsModalOpen ? 1 : 0,
          pointerEvents: viewGroupsModalOpen ? "auto" : "none",
        }}
        onClick={() => setViewGroupsModalOpen(false)}
      >
        <div style={STYLES.viewGroupsModal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>
                {query.trim() ? "Search Groups" : "View Groups"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>
                {query.trim()
                  ? `Showing results for "${query.trim()}"`
                  : "Manage your groups (open, rename, delete)"}
              </div>
            </div>

            <button style={STYLES.xBtn} onClick={() => setViewGroupsModalOpen(false)}>
              ✕
            </button>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups..."
            style={STYLES.modalInput}
          />

          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={STYLES.select}>
              <option value="latest" style={STYLES.optionStyle}>
                Sort: Latest
              </option>
              <option value="az" style={STYLES.optionStyle}>
                Sort: A-Z
              </option>
              <option value="za" style={STYLES.optionStyle}>
                Sort: Z-A
              </option>
            </select>

            <div style={STYLES.toggleWrap}>
              <button
                style={{ ...STYLES.toggleBtn, ...(view === "grid" ? STYLES.toggleActive : {}) }}
                onClick={() => setView("grid")}
              >
                Grid
              </button>
              <button
                style={{ ...STYLES.toggleBtn, ...(view === "list" ? STYLES.toggleActive : {}) }}
                onClick={() => setView("list")}
              >
                List
              </button>
            </div>
          </div>

          <div style={STYLES.resultMeta}>
            {query.trim() ? (
              <>
                Search results for <b style={{ color: STYLES.text }}>"{query.trim()}"</b> —{" "}
                <b style={{ color: STYLES.text }}>{filteredGroups.length}</b> group(s)
              </>
            ) : (
              <>
                Total Groups: <b style={{ color: STYLES.text }}>{filteredGroups.length}</b>
              </>
            )}
          </div>

          <div className="smart-modal-scroll" style={STYLES.modalListWrap}>
            <div style={view === "grid" ? STYLES.grid : STYLES.list}>
              {loading ? (
                <>
                  <SkeletonCard theme={STYLES} />
                  <SkeletonCard theme={STYLES} />
                  <SkeletonCard theme={STYLES} />
                </>
              ) : filteredGroups.length === 0 ? (
                <EmptyState theme={STYLES} onCreate={() => setPanelOpen(true)} />
              ) : (
                filteredGroups.map((g) => (
                  <GroupCard
                    key={g._id}
                    theme={STYLES}
                    g={g}
                    view={view}
                    highlight={(name) => highlightMatch(name, query)}
                    onOpen={() => nav(`/group/${g._id}`)}
                    onEdit={() => askRenameGroup(g._id, g.name)}
                    onDelete={() => askDeleteGroup(g._id, g.name)}
                  />
                ))
              )}
            </div>
          </div>

          <button style={{ ...STYLES.btnGhostFull, marginTop: 14 }} onClick={() => setViewGroupsModalOpen(false)}>
            Close
          </button>
        </div>
      </div>

      {/* ✅ Recent Activity Modal */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: activityModalOpen ? 1 : 0,
          pointerEvents: activityModalOpen ? "auto" : "none",
        }}
        onClick={() => setActivityModalOpen(false)}
      >
        <div style={STYLES.activityModal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Recent Activity</div>
              <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>All latest updates</div>
            </div>

            <button style={STYLES.xBtn} onClick={() => setActivityModalOpen(false)}>
              ✕
            </button>
          </div>

          <div className="smart-modal-scroll" style={{ marginTop: 14, maxHeight: 420, overflowY: "auto" }}>
            {recentActivity.length === 0 ? (
              <div style={{ opacity: 0.9, color: STYLES.mutedText, fontWeight: 900 }}>No activity yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {recentActivity.map((a, idx) => (
                  <div key={idx} style={STYLES.expRow}>
                    <div>
                      <div style={{ fontWeight: 900, color: STYLES.text }}>{a.text}</div>
                      <div style={{ fontSize: 12, opacity: 0.82, color: STYLES.mutedText }}>
                        {a.date ? new Date(a.date).toLocaleString() : "-"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button style={{ ...STYLES.btnGhostFull, marginTop: 14 }} onClick={() => setActivityModalOpen(false)}>
            Close
          </button>
        </div>
      </div>

      {/* ✅ Choose Group Modal */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: chooseGroupOpen ? 1 : 0,
          pointerEvents: chooseGroupOpen ? "auto" : "none",
        }}
        onClick={() => setChooseGroupOpen(false)}
      >
        <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Choose Group</div>
            <button style={STYLES.xBtn} onClick={() => setChooseGroupOpen(false)}>
              ✕
            </button>
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {filteredGroups.map((g) => (
              <button
                key={g._id}
                style={STYLES.btnGhostFull}
                onClick={() => {
                  setChooseGroupOpen(false);
                  nav(`/group/${g._id}`);
                }}
              >
                ➜ {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Rename Modal */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: renameModalOpen ? 1 : 0,
          pointerEvents: renameModalOpen ? "auto" : "none",
        }}
        onClick={() => setRenameModalOpen(false)}
      >
        <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Rename Group</div>
            <button style={STYLES.xBtn} onClick={() => setRenameModalOpen(false)}>
              ✕
            </button>
          </div>

          <input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Enter new group name..."
            style={STYLES.modalInput}
          />

          <button
            style={{ ...STYLES.btnPrimaryFull, marginTop: 12, opacity: renaming ? 0.7 : 1 }}
            onClick={confirmRenameGroup}
            disabled={renaming}
          >
            {renaming ? "Saving..." : "Save"}
          </button>

          <button style={{ ...STYLES.btnGhostFull, marginTop: 10 }} onClick={() => setRenameModalOpen(false)}>
            Cancel
          </button>
        </div>
      </div>

      {/* ✅ Delete Modal */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: deleteModalOpen ? 1 : 0,
          pointerEvents: deleteModalOpen ? "auto" : "none",
        }}
        onClick={() => setDeleteModalOpen(false)}
      >
        <div style={STYLES.confirmModal} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Delete Group?</div>

          <div style={{ marginTop: 8, opacity: 0.85, color: STYLES.mutedText }}>
            Are you sure you want to delete <b style={{ color: STYLES.text }}>{deleteTarget?.name}</b>? This cannot be
            undone.
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={STYLES.btnGhostFull} onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>

            <button
              style={{ ...STYLES.btnDangerFull, opacity: deleting ? 0.7 : 1 }}
              onClick={confirmDeleteGroup}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
        }}
        onClick={() => setDrawerOpen(false)}
      >
        <div style={STYLES.drawer} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontWeight: 900, fontSize: 16, color: STYLES.text }}>Menu</div>

          <button style={STYLES.btnPrimaryFull} onClick={() => setPanelOpen(true)}>
            + Create Group
          </button>

          <button style={STYLES.btnGhostFull} onClick={refreshDashboard}>
            Refresh
          </button>

          <button style={STYLES.btnDangerFull} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: panelOpen ? 1 : 0,
          pointerEvents: panelOpen ? "auto" : "none",
        }}
        onClick={() => setPanelOpen(false)}
      >
        <div style={STYLES.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: STYLES.text }}>Create New Group</div>
            <button style={STYLES.xBtn} onClick={() => setPanelOpen(false)}>
              ✕
            </button>
          </div>

          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            style={STYLES.modalInput}
          />

          <button style={STYLES.btnPrimaryFull} onClick={createGroup}>
            + Create
          </button>

          <button style={STYLES.btnGhostFull} onClick={() => setPanelOpen(false)}>
            Cancel
          </button>
        </div>
      </div>

      {/* ✅ Toast Modal */}
      <div
        style={{
          ...STYLES.overlay,
          opacity: toast.open ? 1 : 0,
          pointerEvents: toast.open ? "auto" : "none",
        }}
        onClick={closeToast}
      >
        <div style={STYLES.toastBox} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontWeight: 900, color: STYLES.text }}>
            {toast.type === "good" ? "✅ Success" : toast.type === "warn" ? "⚠️ Warning" : "❌ Error"}
          </div>
          <div style={{ marginTop: 8, opacity: 0.92, color: STYLES.mutedText }}>{toast.msg}</div>

          <button style={{ ...STYLES.btnPrimaryFull, marginTop: 14 }} onClick={closeToast}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== UI Components ================== */

function StatCard({ theme, title, value, icon }) {
  return (
    <div style={theme.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 900, color: theme.mutedText }}>{title}</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8, color: theme.text }}>{value}</div>
        </div>
        <div style={theme.statIcon}>{icon}</div>
      </div>
    </div>
  );
}

function GroupCard({ theme, g, onOpen, view, onEdit, onDelete, highlight }) {
  const cardStyle = view === "list" ? theme.listCard : theme.groupCard;
  const createdText = g.createdAt ? new Date(g.createdAt).toLocaleString() : "-";

  return (
    <div style={cardStyle} onClick={onOpen}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15, color: theme.text }}>
            {highlight ? highlight(g.name) : g.name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, color: theme.mutedText }}>
            Created: {createdText}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, color: theme.mutedText }}>
            Members: {g.members?.length || 0} • Expenses: {g.expenses?.length || 0}
          </div>
        </div>
        <div style={theme.tag}>GROUP</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          style={theme.openBtn}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Open →
        </button>

        <button
          style={theme.editBtn}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Rename"
        >
          ✏️
        </button>

        <button
          style={theme.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function SkeletonCard({ theme }) {
  return <div style={{ ...theme.groupCard, opacity: 0.7, color: theme.text, fontWeight: 900 }}>Loading...</div>;
}

function EmptyState({ theme, onCreate }) {
  return (
    <div style={{ ...theme.groupCard, gridColumn: "1 / -1", textAlign: "center" }}>
      <h2 style={{ margin: 0, fontWeight: 900, color: theme.text }}>No groups found</h2>
      <p style={{ opacity: 0.88, marginTop: 10, color: theme.mutedText }}>
        Create your first group to start splitting expenses.
      </p>
      <button style={theme.btnPrimaryFull} onClick={onCreate}>
        + Create Group
      </button>
    </div>
  );
}

/* ================== THEMES ================== */

const dark = {
  text: "#ffffff",
  mutedText: "rgba(255,255,255,0.84)",
  trackBg: "rgba(255,255,255,0.14)",
  optionStyle: { background: "#0B1026", color: "#ffffff" },

  warnText: "#fbbf24",
  goodBorder: "rgba(34,197,94,0.28)",
  warnBorder: "rgba(251,191,36,0.28)",
  goodBg: "rgba(34,197,94,0.12)",
  warnBg: "rgba(251,191,36,0.12)",

  viewGroupsModal: {
    width: 860,
    maxWidth: "96vw",
    padding: 18,
    borderRadius: 18,
    background: "rgba(10,14,28,0.98)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 70px rgba(0,0,0,0.50)",
    overflow: "hidden",
  },

  modalListWrap: { marginTop: 14, maxHeight: 420, overflowY: "auto" },

  mark: {
    padding: "0px 6px",
    borderRadius: 8,
    background: "rgba(251,191,36,0.24)",
    border: "1px solid rgba(251,191,36,0.28)",
    fontWeight: 1000,
  },

  resultMeta: {
    fontSize: 12,
    opacity: 0.9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.82)",
    textAlign: "right",
    width: "100%",
    marginTop: 6,
  },

  viewGroupBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    whiteSpace: "nowrap",
  },

  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Poppins, sans-serif",
    color: "#ffffff",
    background: "linear-gradient(135deg,#070A14,#0B1026,#0F172A)",
  },

  bgBlob1: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: "50%",
    background: "radial-gradient(circle,#3b82f6,transparent 70%)",
    top: -170,
    left: -140,
    filter: "blur(40px)",
    opacity: 0.42,
    zIndex: 0,
  },

  bgBlob2: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: "50%",
    background: "radial-gradient(circle,#22c55e,transparent 70%)",
    bottom: -200,
    right: -180,
    filter: "blur(50px)",
    opacity: 0.34,
    zIndex: 0,
  },

  bgGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
    backgroundSize: "70px 70px",
    opacity: 0.2,
    zIndex: 0,
  },

  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    background: "rgba(10,14,28,0.55)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
  },

  brand: { display: "flex", alignItems: "center", gap: 12 },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    background: "linear-gradient(135deg,#22c55e,#3b82f6)",
    color: "#0b1220",
  },

  themeBtn: {
    padding: "10px 12px",
    borderRadius: 14,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontWeight: 900,
  },

  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg,#22c55e,#3b82f6)",
    color: "#0b1220",
    fontWeight: 900,
  },

  btnDangerTop: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(239,68,68,0.18)",
    color: "#ffffff",
  },

  layout: {
    padding: 18,
    display: "grid",
    gap: 16,
    gridTemplateColumns: "320px 1fr",
    position: "relative",
    zIndex: 1,
    alignItems: "start",
  },

  sidebar: {
    display: "grid",
    gap: 14,
    position: "sticky",
    top: 92,
    height: "calc(100vh - 110px)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    msOverflowStyle: "none",
    scrollbarWidth: "none",
    paddingRight: 6,
  },

  sidebarCard: {
    borderRadius: 18,
    background: "rgba(10,14,28,0.55)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: 16,
    boxShadow: "0 16px 50px rgba(0,0,0,0.28)",
    backdropFilter: "blur(18px)",
  },

  confirmModal: {
    width: 430,
    maxWidth: "92vw",
    padding: 18,
    borderRadius: 18,
    background: "rgba(10,14,28,0.98)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.40)",
  },

  activityModal: {
    width: 540,
    maxWidth: "94vw",
    padding: 18,
    borderRadius: 18,
    background: "rgba(10,14,28,0.98)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 70px rgba(0,0,0,0.50)",
  },

  sideTitle: { fontSize: 13, fontWeight: 900, opacity: 0.9, marginBottom: 10, color: "#ffffff" },

  btnPrimary: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    background: "linear-gradient(90deg,#22c55e,#3b82f6)",
    color: "#0b1220",
    marginBottom: 10,
  },

  btnGhost: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    marginBottom: 10,
  },

  divider: { height: 1, background: "rgba(255,255,255,0.12)", margin: "14px 0" },

  note: { padding: 12, borderRadius: 14, fontWeight: 900, fontSize: 13 },

  main: {
    borderRadius: 18,
    background: "rgba(10,14,28,0.40)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: 16,
    boxShadow: "0 16px 50px rgba(0,0,0,0.28)",
    backdropFilter: "blur(18px)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
    marginBottom: 14,
  },

  statCard: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.22)",
  },

  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 18,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
  },

  sectionGrid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr 1fr",
    marginBottom: 14,
  },

  panel: {
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
  },

  activityPanel: { maxHeight: 420 },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
    flexWrap: "wrap",
  },

  expRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  viewMoreBtn: {
    marginTop: 12,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
  },

  controls: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 14,
  },

  search: {
    flex: 1,
    minWidth: 240,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    outline: "none",
    color: "#ffffff",
    boxSizing: "border-box",
  },

  select: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    outline: "none",
    color: "#ffffff",
    fontWeight: 900,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  },

  toggleWrap: {
    display: "flex",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.16)",
  },

  toggleBtn: {
    padding: "12px 14px",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(255,255,255,0.10)",
    color: "#ffffff",
  },

  toggleActive: { background: "linear-gradient(90deg,#22c55e,#3b82f6)", color: "#0b1220" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 },
  list: { display: "grid", gridTemplateColumns: "1fr", gap: 14 },

  groupCard: {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(0,0,0,0.22)",
  },

  listCard: {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(0,0,0,0.22)",
  },

  tag: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: "#0b1220",
    height: "fit-content",
    background: "linear-gradient(90deg,#22c55e,#3b82f6)",
  },

  openBtn: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    border: "none",
    fontWeight: 900,
    background: "linear-gradient(90deg,#22c55e,#3b82f6)",
    color: "#0b1220",
  },

  editBtn: {
    width: 46,
    borderRadius: 14,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontWeight: 900,
  },

  deleteBtn: {
    width: 46,
    borderRadius: 14,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(239,68,68,0.22)",
    color: "#ffffff",
    fontWeight: 900,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    transition: "0.25s",
    zIndex: 50,
  },

  drawer: {
    width: 320,
    maxWidth: "90vw",
    padding: 16,
    borderRadius: 18,
    background: "rgba(10,14,28,0.96)",
    border: "1px solid rgba(255,255,255,0.14)",
    display: "grid",
    gap: 10,
  },

  modal: {
    width: 420,
    maxWidth: "92vw",
    padding: 18,
    borderRadius: 18,
    background: "rgba(10,14,28,0.96)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },

  toastBox: {
    width: 420,
    maxWidth: "92vw",
    padding: 18,
    borderRadius: 18,
    background: "rgba(10,14,28,0.96)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  },

  modalInput: {
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    outline: "none",
    color: "#ffffff",
    boxSizing: "border-box",
    display: "block",
  },

  xBtn: {
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.10)",
    color: "#ffffff",
  },

  btnPrimaryFull: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    background: "linear-gradient(90deg,#22c55e,#3b82f6)",
    color: "#0b1220",
  },

  btnGhostFull: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
  },

  btnDangerFull: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(239,68,68,0.18)",
    color: "#ffffff",
  },

  hamburger: {
    display: "none",
    width: 42,
    height: 42,
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 900,
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
  },
};

const light = {
  ...dark,
  text: "#0b1220",
  mutedText: "rgba(2,6,23,0.82)",
  trackBg: "rgba(2,6,23,0.14)",
  optionStyle: { background: "#ffffff", color: "#0b1220" },

  warnText: "#b45309",

  page: { ...dark.page, color: "#0b1220", background: "linear-gradient(135deg,#f8fafc,#eef2ff,#ecfeff)" },
  navbar: { ...dark.navbar, background: "rgba(255,255,255,0.78)", borderBottom: "1px solid rgba(2,6,23,0.08)" },

  sidebarCard: {
    ...dark.sidebarCard,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(2,6,23,0.12)",
    boxShadow: "0 16px 40px rgba(2,6,23,0.08)",
  },

  main: { ...dark.main, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(2,6,23,0.12)" },

  panel: { ...dark.panel, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(2,6,23,0.10)" },

  statCard: { ...dark.statCard, background: "rgba(255,255,255,0.96)", border: "1px solid rgba(2,6,23,0.10)" },
  groupCard: { ...dark.groupCard, background: "rgba(255,255,255,0.96)", border: "1px solid rgba(2,6,23,0.10)" },
  listCard: { ...dark.listCard, background: "rgba(255,255,255,0.96)", border: "1px solid rgba(2,6,23,0.10)" },

  expRow: { ...dark.expRow, background: "rgba(255,255,255,0.96)", border: "1px solid rgba(2,6,23,0.10)" },

  viewGroupsModal: {
    ...dark.viewGroupsModal,
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(2,6,23,0.14)",
    boxShadow: "0 18px 60px rgba(2,6,23,0.16)",
  },

  activityModal: {
    ...dark.activityModal,
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(2,6,23,0.14)",
    boxShadow: "0 18px 60px rgba(2,6,23,0.16)",
  },

  confirmModal: {
    ...dark.confirmModal,
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(2,6,23,0.14)",
    boxShadow: "0 18px 60px rgba(2,6,23,0.16)",
  },

  modal: { ...dark.modal, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)" },
  toastBox: { ...dark.toastBox, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)" },
  drawer: { ...dark.drawer, background: "rgba(255,255,255,0.98)", border: "1px solid rgba(2,6,23,0.14)" },

  btnGhost: { ...dark.btnGhost, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },
  btnGhostFull: { ...dark.btnGhostFull, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  search: { ...dark.search, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },
  select: { ...dark.select, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  themeBtn: { ...dark.themeBtn, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },
  btnDangerTop: { ...dark.btnDangerTop, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#0b1220" },

  profileChip: { ...dark.profileChip, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)" },

  editBtn: { ...dark.editBtn, border: "1px solid rgba(2,6,23,0.14)", background: "rgba(2,6,23,0.06)", color: "#0b1220" },
  deleteBtn: { ...dark.deleteBtn, color: "#0b1220", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.12)" },

  xBtn: { ...dark.xBtn, background: "rgba(2,6,23,0.08)", color: "#0b1220" },

  modalInput: { ...dark.modalInput, border: "1px solid rgba(2,6,23,0.18)", background: "rgba(2,6,23,0.06)", color: "#0b1220" },

  viewMoreBtn: { ...dark.viewMoreBtn, border: "1px solid rgba(2,6,23,0.14)", background: "rgba(2,6,23,0.06)", color: "#0b1220" },

  viewGroupBtn: { ...dark.viewGroupBtn, background: "rgba(2,6,23,0.06)", border: "1px solid rgba(2,6,23,0.14)", color: "#0b1220" },

  resultMeta: { ...dark.resultMeta, color: "rgba(2,6,23,0.78)" },

  sideTitle: { ...dark.sideTitle, color: "#0b1220" },
  note: { ...dark.note, color: "#0b1220" },

  toggleBtn: {
    ...dark.toggleBtn,
    background: "rgba(2,6,23,0.08)",
    color: "#0b1220",
  },

  hamburger: { ...dark.hamburger, color: "#0b1220", border: "1px solid rgba(2,6,23,0.12)", background: "rgba(255,255,255,0.88)" },
};
