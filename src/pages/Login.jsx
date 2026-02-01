import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login", { email, password });
      const loggedUser = res.data.user;
      setUser(loggedUser);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError("⚠️ Invalid email or password.");
    }
  };

  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }

        * {
          box-sizing: border-box;
        }

        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .login-box {
          width: 460px !important;
          padding: 55px 70px !important;
        }

        @media (max-width: 1100px) {
          .login-right {
            padding: 40px !important;
          }
          .login-box {
            width: 430px !important;
            padding: 50px 60px !important;
          }
        }

        @media (max-width: 850px) {
          .login-container {
            flex-direction: column;
          }
          .login-left {
            display: none;
          }
          .login-right {
            padding: 30px !important;
          }
          .login-box {
            width: 100% !important;
            max-width: 440px !important;
            padding: 45px 28px !important;
          }
        }

        @media (max-width: 420px) {
          .login-right {
            padding: 18px !important;
          }
          .login-box {
            padding: 38px 18px !important;
          }
        }
      `}</style>

      <div
        className="login-container"
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          fontFamily: "'Poppins', sans-serif",
          background:
            "linear-gradient(135deg, #0b1220 0%, #0a3d62 55%, #16a34a 100%)",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <div
          className="login-left"
          style={{
            flex: 1.2,
            background:
              "url('https://cdn.dribbble.com/users/1044993/screenshots/17100036/media/020d17662e4460e820b28d5f8e23021c.png?compress=1&resize=1200x900&vertical=top') center/cover no-repeat",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            textAlign: "center",
            padding: "40px",
          }}
        >
          <h1 style={{ fontSize: "40px", marginBottom: "15px" }}>
            Welcome Back 👋
          </h1>
          <p style={{ fontSize: "18px", maxWidth: "400px", lineHeight: "1.5" }}>
            Manage your expenses easily and stay financially organized with your
            groups.
          </p>
        </div>

        <div
          className="login-right"
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px",
            overflow: "visible",
          }}
        >
          <div
            className="login-box"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: "16px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "0px solid transparent",
              outline: "none",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              maxWidth: "95vw",
              color: "#fff",
              animation: "floatUp 0.6s ease-out",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: "28px",
                marginBottom: "25px",
              }}
            >
              Login to Your Account
            </h2>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="submit" style={buttonStyle}>
                Login
              </button>
            </form>

            {error && (
              <p style={{ color: "#ffbaba", marginTop: "15px" }}>{error}</p>
            )}

            <p style={{ marginTop: "25px", fontSize: "14px", color: "#eaeaea" }}>
              Don’t have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{
                  color: "#00e0ff",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Register here
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "none",
  fontSize: "15px",
  outline: "none",
  background: "rgba(255,255,255,0.85)",
  color: "#333",
  boxSizing: "border-box",
  boxShadow: "none",
};

const buttonStyle = {
  width: "100%",
  background: "linear-gradient(90deg, #43cea2, #185a9d)",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.3s ease",
  boxSizing: "border-box",
};
