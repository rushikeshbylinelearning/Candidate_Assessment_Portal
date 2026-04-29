import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { ArrowLeft, Zap, Plus, Trash2, Info } from "lucide-react";
import toast from "react-hot-toast";

const CAT_COLORS = {
  aptitude:      "#2563eb",
  technical:     "#7c3aed",
  reasoning:     "#16a34a",
  communication: "#ea580c",
};

export default function AssessmentBuilderAdaptive() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [questionCounts, setQuestionCounts] = useState({});
  const [form, setForm] = useState({ roleId: "", title: "", description: "", duration: 60, passThreshold: 60, allowBacktrack: true, randomizeQuestions: true, randomizeOptions: true });
  const [sections, setSections] = useState([
    { name: "Aptitude",      category: "aptitude",      questionCount: 3, difficulty: "mixed", weight: 20 },
    { name: "Technical",     category: "technical",     questionCount: 5, difficulty: "mixed", weight: 50 },
    { name: "Reasoning",     category: "reasoning",     questionCount: 3, difficulty: "mixed", weight: 20 },
    { name: "Communication", category: "communication", questionCount: 2, difficulty: "mixed", weight: 10 },
  ]);

  useEffect(() => {
    api.get("/roles?active=true").then(r => setRoles(r.data));
    ["aptitude", "technical", "reasoning", "communication"].forEach(cat => {
      api.get(`/questions?category=${cat}&limit=1`).then(r => {
        setQuestionCounts(prev => ({ ...prev, [cat]: r.data.total }));
      });
    });
  }, []);

  const totalWeight = sections.reduce((s, sec) => s + (parseInt(sec.weight) || 0), 0);
  const totalQuestions = sections.reduce((s, sec) => s + (parseInt(sec.questionCount) || 0), 0);
  const updateSection = (i, key, value) => setSections(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  const addSection = () => setSections(prev => [...prev, { name: "", category: "technical", questionCount: 3, difficulty: "mixed", weight: 10 }]);
  const removeSection = (i) => setSections(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roleId) return toast.error("Please select a role");
    if (sections.length === 0) return toast.error("Add at least one section");
    if (totalWeight !== 100) return toast.error(`Weights must total 100% (currently ${totalWeight}%)`);
    setSaving(true);
    try {
      await api.post("/assessments", { ...form, totalQuestions, sections, mode: "adaptive" });
      toast.success("Assessment created!");
      navigate("/hr/questions");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate("/hr/assessments/create")} style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 14, marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Mode Selection
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={22} color="#2563eb" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Adaptive Mode Assessment</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>Define sections — questions selected dynamically from the bank</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 10, padding: "12px 16px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe", marginBottom: 20 }}>
              <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>Questions are randomly selected from the bank at runtime based on each section category and difficulty. Candidates may receive different questions.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {sections.map((sec, i) => {
                const cc = CAT_COLORS[sec.category] || "#475569";
                const available = questionCounts[sec.category] || 0;
                const insufficient = available > 0 && available < sec.questionCount;
                return (
                  <Card key={i} style={{ padding: 20, border: `1px solid ${insufficient ? "#fca5a5" : "#e2e8f0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cc}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: cc }}>{i + 1}</div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Section {i + 1}</span>
                        {insufficient && <span style={{ fontSize: 11, color: "#e11d48", background: "#fef2f2", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Only {available} available</span>}
                      </div>
                      {sections.length > 1 && (
                        <button type="button" onClick={() => removeSection(i)} style={{ padding: "5px 10px", borderRadius: 6, background: "#fef2f2", color: "#e11d48", border: "1px solid #fecdd3", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Section Name</label>
                        <input value={sec.name} onChange={e => updateSection(i, "name", e.target.value)} placeholder="e.g. Technical" style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Category</label>
                        <select value={sec.category} onChange={e => updateSection(i, "category", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff" }}>
                          {["aptitude", "technical", "reasoning", "communication"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Difficulty</label>
                        <select value={sec.difficulty} onChange={e => updateSection(i, "difficulty", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff" }}>
                          {["mixed", "easy", "medium", "hard"].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 5 }}>Questions</label>
                        <input type="number" min="1" value={sec.questionCount} onChange={e => updateSection(i, "questionCount", parseInt(e.target.value) || 1)} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${insufficient ? "#fca5a5" : "#e2e8f0"}`, fontSize: 13, outline: "none" }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Section Weight</label>
                        <span style={{ fontSize: 13, fontWeight: 700, color: cc }}>{sec.weight}%</span>
                      </div>
                      <input type="range" min="5" max="80" step="5" value={sec.weight} onChange={e => updateSection(i, "weight", parseInt(e.target.value))} style={{ width: "100%", accentColor: cc }} />
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{available} questions available in bank</div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <button type="button" onClick={addSection} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "2px dashed #e2e8f0", background: "transparent", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", justifyContent: "center" }}>
              <Plus size={16} /> Add Section
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Weight Summary</div>
              {sections.map((sec, i) => {
                const cc = CAT_COLORS[sec.category] || "#475569";
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#334155", textTransform: "capitalize" }}>{sec.name || sec.category}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cc }}>{sec.weight}%</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${sec.weight}%`, background: cc, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: totalWeight === 100 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${totalWeight === 100 ? "#86efac" : "#fca5a5"}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: totalWeight === 100 ? "#16a34a" : "#e11d48" }}>Total Weight</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: totalWeight === 100 ? "#16a34a" : "#e11d48" }}>{totalWeight}%</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                <span>Total questions</span><strong style={{ color: "#0f172a" }}>{totalQuestions}</strong>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Assessment Config</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Role *</label>
                  <select required value={form.roleId} onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff" }}>
                    <option value="">Select role...</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.title} - {r.department}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Title *</label>
                  <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Software Engineer Assessment" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", resize: "vertical" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Duration (min)</label>
                    <input type="number" min="5" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Pass Threshold %</label>
                    <input type="number" min="1" max="100" value={form.passThreshold} onChange={e => setForm(p => ({ ...p, passThreshold: parseInt(e.target.value) || 60 }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["allowBacktrack", "Allow backtracking"], ["randomizeQuestions", "Randomize question order"], ["randomizeOptions", "Shuffle answer options"]].map(([key, label]) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#334155", fontWeight: 500 }}>
                      <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#e11d48" }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </Card>
            <Button type="submit" disabled={saving || totalWeight !== 100} style={{ width: "100%", justifyContent: "center" }}>
              {saving ? "Creating..." : "Create Assessment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
