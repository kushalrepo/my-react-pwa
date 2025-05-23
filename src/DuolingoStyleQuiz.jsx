import React, { useState, useEffect } from "react";
import phrases from "./data/phrases.json"; // <-- make sure the path matches your project

/*****************************************
 * 1. CONSTANTS & HELPERS                *
 *****************************************/

const LANGS = [
  { key: "nagamese", label: "Nagamese" },
  { key: "wanchoLower", label: "Wancho‑Lower" },
  { key: "wanchoUpper", label: "Wancho‑Upper" },
  { key: "konyak", label: "Konyak" },
  { key: "english", label: "English" },
];

const MAX_LEVEL = 56;
const LS_KEY = "quizUsersProgress";
const loadUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
};
const saveUsers = (u) => localStorage.setItem(LS_KEY, JSON.stringify(u));
const EVERY_ITEM = Object.values(phrases.levels).flat();

/*****************************************
 * 2. APP COMPONENT                      *
 *****************************************/
export default function App() {
  const [users, setUsers] = useState(loadUsers());
  const [stage, setStage] = useState("login");
  const [username, setUsername] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [lang, setLang] = useState(null);
  const [level, setLevel] = useState(1);
  const [qs, setQs] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [answered, setAnswered] = useState(false);

  const doLogin = () => {
    const name = username.trim();
    if (!name) return alert("Enter username");
    if (!users[name]) users[name] = { scores: {}, level: {} };
    setUsers({ ...users });
    saveUsers({ ...users });
    setCurrentUser(name);
    setStage("selectLang");
  };

  const logout = () => {
    setCurrentUser(null);
    setUsername("");
    setStage("login");
  };

  useEffect(() => {
    if (!lang || !currentUser) return;

    const userLvl = users[currentUser].level[lang] || 1;
    setLevel(userLvl);
    const levelItems = phrases.levels[userLvl.toString()] || [];
    const selectedItems = levelItems.filter((row) => row[lang]).slice(0, 2);
    const questions = selectedItems.map((row) => {
      const correct = row[lang];
      const wrong = EVERY_ITEM
        .filter((r) => r !== row && r[lang])
        .map((r) => r[lang])
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      return {
        prompt: `Translate “${row.hindi}” into ${LANGS.find((l) => l.key === lang).label}:`,
        correct,
        options: [correct, ...wrong].sort(() => Math.random() - 0.5),
      };
    });

    setQs(questions);
    setIdx(0);
    setScore(0);
    setChosen(null);
    setAnswered(false);
    setStage("quiz");
  }, [level, lang, currentUser]);

  const pick = (opt) => {
    if (answered) return;
    setChosen(opt);
    setAnswered(true);
    if (opt === qs[idx].correct) setScore((s) => s + 1);
  };

  const next = () => {
    setChosen(null);
    setAnswered(false);
    if (idx + 1 < qs.length) setIdx((i) => i + 1);
    else finish();
  };

  const finish = () => {
    const u = { ...users };
    const best = u[currentUser].scores[lang] || 0;
    if (score > best) u[currentUser].scores[lang] = score;
    if (score === qs.length && (u[currentUser].level[lang] || 1) < MAX_LEVEL) {
      u[currentUser].level[lang] = (u[currentUser].level[lang] || 1) + 1;
    } else if (u[currentUser].level[lang] === undefined) {
      u[currentUser].level[lang] = 1;
    }
    setUsers(u);
    saveUsers(u);
    setStage("results");
  };

  const leaderboard = Object.entries(users)
    .map(([name, data]) => ({ name, total: Object.values(data.scores).reduce((a, b) => a + b, 0) }))
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const baseStyle = {
    backgroundColor: "#121212",
    color: "#fff",
    minHeight: "100vh",
    padding: 24,
    fontFamily: "system-ui",
    maxWidth: 560,
    margin: "40px auto",
  };

  const inputStyle = {
    padding: 10,
    fontSize: 16,
    width: "100%",
    marginBottom: 12,
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: 6,
  };

  const btnStyle = {
    padding: "10px 18px",
    background: "#6200ea",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
  };

  return (
    <div style={baseStyle}>
      {stage === "login" && (
        <>
          <h2>Language Quiz – Login</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
          />
          <button onClick={doLogin} style={btnStyle}>Start</button>

          <h3 style={{ marginTop: 28 }}>🏆 Leaderboard</h3>
          {leaderboard.length ? (
            <ol style={{ paddingLeft: 20 }}>
              {leaderboard.map((e, i) => (
                <li key={i}><strong>{e.name}</strong>: {e.total}</li>
              ))}
            </ol>
          ) : (
            <p>No scores yet.</p>
          )}
        </>
      )}

      {stage === "selectLang" && (
        <>
          <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <span>User: {currentUser}</span>
            <button onClick={logout} style={{ ...btnStyle, background: "#b00020" }}>Logout</button>
          </header>
          <h2>Select language to learn</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {LANGS.map((l) => (
              <button
                key={l.key}
                onClick={() => {
                  setLang(l.key);
                  setLevel(users[currentUser].level[l.key] || 1);
                }}
                style={{ flex: "1 0 45%", padding: 14, border: "1px solid #6200ea", borderRadius: 8, background: "#1f1f1f", color: "#fff" }}>
                {l.label}
                <br />
                <small>Level: {users[currentUser].level[l.key] || 1}/{MAX_LEVEL}</small>
              </button>
            ))}
          </div>
        </>
      )}

      {stage === "quiz" && (
        <>
          <div style={{ marginBottom: 10, fontSize: 14, color: "#ccc" }}>
            User: {currentUser} | {LANGS.find((l) => l.key === lang).label} | Level {level}
          </div>
          <h3>{qs[idx].prompt}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {qs[idx].options.map((opt) => {
              let bg = "#333";
              if (answered) {
                if (opt === qs[idx].correct) bg = "#388e3c";
                else if (opt === chosen) bg = "#d32f2f";
              }
              return (
                <button
                  key={opt}
                  disabled={answered}
                  onClick={() => pick(opt)}
                  style={{ padding: 14, border: 0, borderRadius: 8, background: bg, textAlign: "left", color: "#fff" }}>
                  {opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <button onClick={next} style={{ ...btnStyle, marginTop: 24 }}>
              {idx + 1 === qs.length ? "Finish" : "Next"}
            </button>
          )}
          <div style={{ marginTop: 12, fontSize: 14 }}>Q {idx + 1} / {qs.length}</div>
        </>
      )}

      {stage === "results" && (
        <div style={{ textAlign: "center" }}>
          <h2>Level {level} complete</h2>
          <p style={{ fontSize: 18 }}>Score: {score} / {qs.length}</p>
          {score === qs.length ? <p>Perfect! Level up unlocked 🎉</p> : <p>Answer both correctly to progress.</p>}
          <button onClick={() => setStage("quiz")} style={btnStyle}></button>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => setStage("selectLang")} style={{ ...btnStyle, background: "#555", marginTop: 10 }}>Back to languages</button>
          </div>
        </div>
      )}
    </div>
  );
}
