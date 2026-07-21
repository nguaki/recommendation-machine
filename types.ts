import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  File,
  Trash2,
  LogOut,
  User,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ExternalLink,
  Eye,
  Check,
  Database,
  ArrowRight,
  ShieldCheck,
  Activity,
  UserPlus
} from "lucide-react";
import { isFirebaseConfigured, auth, storage, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { UploadedFile, UserSession } from "./types";
import { generateSmartRecommendation } from "./utils/recommendations";

export default function App() {
  // Authentication state
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Files & Dashboard state
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tosAgreed, setTosAgreed] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample data if empty
  const initializeSampleFiles = () => {
    const samples: UploadedFile[] = [
      {
        id: "sample-1",
        name: "Q2_Performance_Review_James.pdf",
        size: 1258291, // ~1.2 MB
        date: "2026-07-15T14:30:00Z",
        type: "application/pdf",
        status: "analyzed",
        recommendation: generateSmartRecommendation("Q2_Performance_Review_James.pdf", 1258291)
      },
      {
        id: "sample-2",
        name: "Financial_Forecast_Q3_Q4.xlsx",
        size: 430080, // ~420 KB
        date: "2026-07-18T10:15:00Z",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        status: "pending"
      },
      {
        id: "sample-3",
        name: "Design_System_Asset_Specs.png",
        size: 870400, // ~850 KB
        date: "2026-07-19T09:00:00Z",
        type: "image/png",
        status: "pending"
      }
    ];
    setFiles(samples);
    localStorage.setItem("rm_files", JSON.stringify(samples));
  };

  // Sync state with Firebase Auth if available, otherwise read guest session from localStorage
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const session: UserSession = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            isGuest: false,
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User"
          };
          setUser(session);
          await loadUserFiles(fbUser.uid);
        } else {
          setUser(null);
          setFiles([]);
        }
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local simulation session lookup
      const savedSession = localStorage.getItem("rm_session");
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          setUser(parsedSession);
          const savedFiles = localStorage.getItem("rm_files");
          if (savedFiles) {
            setFiles(JSON.parse(savedFiles));
          } else {
            initializeSampleFiles();
          }
        } catch (e) {
          localStorage.removeItem("rm_session");
        }
      }
      setAuthLoading(false);
    }
  }, []);

  // Load files for specific user (Firebase Mode)
  const loadUserFiles = async (uid: string) => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const q = collection(db, "users", uid, "files");
      const querySnapshot = await getDocs(q);
      const fetchedFiles: UploadedFile[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedFiles.push({
          id: docSnap.id,
          ...docSnap.data()
        } as UploadedFile);
      });
      
      if (fetchedFiles.length === 0) {
        // Init default sample files for new Firebase user too so they see how it looks
        const samples: UploadedFile[] = [
          {
            id: `${uid}-sample-1`,
            name: "Q2_Performance_Review_James.pdf",
            size: 1258291,
            date: "2026-07-15T14:30:00Z",
            type: "application/pdf",
            status: "analyzed",
            recommendation: generateSmartRecommendation("Q2_Performance_Review_James.pdf", 1258291)
          },
          {
            id: `${uid}-sample-2`,
            name: "Financial_Forecast_Q3_Q4.xlsx",
            size: 430080,
            date: "2026-07-18T10:15:00Z",
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            status: "pending"
          }
        ];
        
        for (const item of samples) {
          await setDoc(doc(db, "users", uid, "files", item.id), item);
        }
        setFiles(samples);
      } else {
        setFiles(fetchedFiles);
      }
    } catch (e) {
      console.error("Error loading user files from Firestore:", e);
    }
  };

  // Authenticate Actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError("Please fill in all credentials.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log("Account created:", userCredential.user.email);
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log("Logged in:", userCredential.user.email);
        }
      } catch (err: any) {
        let msg = err.message;
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
          msg = "Invalid email or password.";
        } else if (err.code === "auth/email-already-in-use") {
          msg = "This email is already in use.";
        } else if (err.code === "auth/invalid-email") {
          msg = "Please enter a valid email address.";
        }
        setAuthError(msg);
      }
    } else {
      // Local Simulation Sign In
      const mockSession: UserSession = {
        uid: "guest-" + Date.now(),
        email: email,
        isGuest: false,
        displayName: email.split("@")[0]
      };
      localStorage.setItem("rm_session", JSON.stringify(mockSession));
      setUser(mockSession);
      
      const savedFiles = localStorage.getItem("rm_files");
      if (savedFiles) {
        setFiles(JSON.parse(savedFiles));
      } else {
        initializeSampleFiles();
      }
    }
  };

  // Continue as Guest (Local Sandbox Mode)
  const handleGuestLogin = () => {
    const mockSession: UserSession = {
      uid: "guest-temp",
      email: "guest@recommendationmachine.com",
      isGuest: true,
      displayName: "Guest Reviewer"
    };
    localStorage.setItem("rm_session", JSON.stringify(mockSession));
    setUser(mockSession);
    
    const savedFiles = localStorage.getItem("rm_files");
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    } else {
      initializeSampleFiles();
    }
  };

  // Sign out
  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem("rm_session");
      setUser(null);
      setFiles([]);
    }
  };

  // Drag over handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // File Select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Process and upload file
  const processSelectedFile = async (file: File) => {
    setUploadError(null);

    // Terms of Service check
    if (!tosAgreed) {
      setUploadError("⚠️ You must agree to the Terms of Service before uploading files.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("⚠️ File size exceeds maximum limit of 10MB.");
      return;
    }

    const fileId = "file-" + Date.now();
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      date: new Date().toISOString(),
      type: file.type || "application/octet-stream",
      status: "pending"
    };

    if (isFirebaseConfigured && storage && db && user) {
      // Real Firebase Upload
      try {
        const storageRef = ref(storage, `users/${user.uid}/files/${fileId}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            console.error("Firebase Storage Upload Error:", error);
            setUploadError(`Storage Error: ${error.message}`);
            setUploadProgress(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const finalFile: UploadedFile = {
              ...newFile,
              url: downloadURL
            };

            // Save to Firestore
            await setDoc(doc(db, "users", user.uid, "files", fileId), finalFile);
            setFiles((prev) => [finalFile, ...prev]);
            setUploadProgress(null);
            // Auto select newly uploaded file for analysis
            setSelectedFile(finalFile);
          }
        );
      } catch (err: any) {
        setUploadError(`Failed to save file metadata: ${err.message}`);
        setUploadProgress(null);
      }
    } else {
      // Local simulation upload progress bar animation
      let currentProgress = 0;
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        currentProgress += 20;
        setUploadProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const updatedList = [newFile, ...files];
            setFiles(updatedList);
            localStorage.setItem("rm_files", JSON.stringify(updatedList));
            setUploadProgress(null);
            setSelectedFile(newFile);
          }, 400);
        }
      }, 150);
    }
  };

  // Trigger Analyze file action
  const handleAnalyzeFile = async (fileId: string) => {
    setIsAnalyzingId(fileId);
    
    // Simulate analyze time
    setTimeout(async () => {
      const fileToUpdate = files.find(f => f.id === fileId);
      if (!fileToUpdate) return;

      const recommendationText = generateSmartRecommendation(fileToUpdate.name, fileToUpdate.size);
      
      const updatedFiles = files.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            status: "analyzed" as const,
            recommendation: recommendationText
          };
        }
        return f;
      });

      setFiles(updatedFiles);

      // Save updated state
      if (isFirebaseConfigured && db && user) {
        try {
          await setDoc(doc(db, "users", user.uid, "files", fileId), {
            ...fileToUpdate,
            status: "analyzed",
            recommendation: recommendationText
          });
        } catch (e) {
          console.error("Firestore update failed:", e);
        }
      } else {
        localStorage.setItem("rm_files", JSON.stringify(updatedFiles));
      }

      // Update current selection if opened
      if (selectedFile?.id === fileId) {
        setSelectedFile({
          ...fileToUpdate,
          status: "analyzed",
          recommendation: recommendationText
        });
      }

      setIsAnalyzingId(null);
    }, 1200);
  };

  // Delete file action
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${fileName}"?`);
    if (!confirmDelete) return;

    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);

    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }

    if (isFirebaseConfigured && storage && db && user) {
      try {
        // Delete metadata
        await deleteDoc(doc(db, "users", user.uid, "files", fileId));
        
        // Try deleting from storage too (silent if fails/doesn't exist)
        try {
          const storageRef = ref(storage, `users/${user.uid}/files/${fileId}_${fileName}`);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn("Storage deletion skipped or failed (perhaps mock url):", storageErr);
        }
      } catch (err) {
        console.error("Firebase deletion failed:", err);
      }
    } else {
      localStorage.setItem("rm_files", JSON.stringify(updatedFiles));
    }
  };

  // Helper formatting size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper formatting date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Helper getting file icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="w-8 h-8 text-rose-500" />;
      case "xlsx":
      case "xls":
      case "csv":
        return <FileText className="w-8 h-8 text-emerald-500" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "svg":
        return <FileText className="w-8 h-8 text-sky-500" />;
      default:
        return <File className="w-8 h-8 text-slate-500" />;
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200 font-sans" id="loading-screen">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" id="loading-spinner"></div>
        <p className="text-lg font-medium animate-pulse">Initializing Recommendation Engine...</p>
      </div>
    );
  }

  // --- LOGIN PAGE ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden" id="auth-page">
        {/* Background blobs for premium depth */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10" id="auth-card">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans text-center">
              Recommendation Machine
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Upload, analyze, and generate professional insights
            </p>
          </div>

          {/* Tab Selector for Sign In / Sign Up */}
          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800" id="auth-tab-selector">
            <button
              onClick={() => {
                setIsSignUp(false);
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-signin-btn"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="tab-signup-btn"
            >
              Sign Up
            </button>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800 rounded-xl flex items-start space-x-2.5 text-red-200 text-sm" id="auth-error-alert">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4" id="auth-form">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 mt-6 cursor-pointer"
              id="auth-submit-btn"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500">
                Or explore instantly
              </span>
            </div>

            <button
              onClick={handleGuestLogin}
              className="w-full bg-slate-950 hover:bg-slate-800 active:bg-slate-950 text-slate-300 font-medium py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              id="guest-login-btn"
            >
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Continue as Guest (Demo)</span>
            </button>

            <div className="text-center mt-2">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium transition-colors cursor-pointer"
                id="toggle-auth-mode-btn"
              >
                {isSignUp ? "Already have an account? Sign in" : "New to Recommendation Machine? Create account"}
              </button>
            </div>
          </div>
        </div>

        {/* Informational footer about connection */}
        <div className="absolute bottom-4 text-center text-xs text-slate-600 flex items-center space-x-1.5" id="auth-footer">
          <Database className="w-4 h-4" />
          <span>
            {isFirebaseConfigured
              ? "Firebase Auth is ready and connected."
              : "Using Local Sandbox Mode. No Cloud setup required to test."}
          </span>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD PAGE ---
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800" id="dashboard-layout">
      
      {/* 1. DARK NAVY SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-850 shrink-0 self-stretch" id="sidebar">
        
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3" id="sidebar-brand">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/10">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Rec Machine
            </h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              Recommendation Engine
            </p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5" id="sidebar-nav">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
          <button
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl bg-slate-800/60 text-white font-medium border-l-4 border-indigo-500 transition-all text-left cursor-pointer"
            id="nav-dashboard-tab"
          >
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Dashboard</span>
          </button>
          
          <div className="pt-4 px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Database Status
          </div>
          <div className="px-3.5 py-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseConfigured ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              <span className="font-semibold text-slate-300">
                {isFirebaseConfigured ? "Firebase Mode" : "Sandbox Mode"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {isFirebaseConfigured
                ? "Files are stored in real Firebase Storage & metadata is saved in Firestore."
                : "Simulation Active. Uploaded files persist in local sandbox memory."}
            </p>
          </div>
        </nav>

        {/* User profile & footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-3" id="sidebar-footer">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-sm font-semibold uppercase">
              {user.email.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user.displayName || "Active User"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-slate-700/50"
            id="sidebar-logout-btn"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. WHITE/LIGHT GRAY MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0" id="main-content">
        
        {/* Upper Header Row */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between" id="header-bar">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-900">
              Analytics Workspace
            </h2>
            <span className="hidden md:inline px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              Status: Operational
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            System Local Time: <span className="font-mono text-slate-700">2026-07-20 15:50</span>
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8" id="scroll-content">
          
          {/* Welcome and stats panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="welcome-header">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Welcome back, {user.displayName || "User"}!
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Upload business reports, resumes, or financial spreadsheets to generate smart recommendations.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">Terms Consent:</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${tosAgreed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                <ShieldCheck className="w-4 h-4" />
                <span>{tosAgreed ? "Agreed" : "Action Required"}</span>
              </span>
            </div>
          </div>

          {/* Quick Stats Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="stats-grid">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <File className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Uploads</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{files.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Usage</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analyzed Files</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {files.filter((f) => f.status === "analyzed").length}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Rate</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {files.length > 0
                    ? `${Math.round((files.filter((f) => f.status === "analyzed").length / files.length) * 100)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Workspace Section: File Upload & Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="workspace-grid">
            
            {/* File Upload Section - Left Column (5/12 grid span) */}
            <div className="xl:col-span-5 space-y-6" id="upload-panel">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    File Ingestion Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select or drop any document up to 10MB to load into the machine database.
                  </p>
                </div>

                {/* TOS Checklist Agreement Requirement */}
                <div 
                  className={`p-4 rounded-xl border transition-all ${
                    tosAgreed 
                      ? "bg-slate-50 border-slate-200" 
                      : "bg-amber-50/50 border-amber-200"
                  }`} 
                  id="tos-box"
                >
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tosAgreed}
                      onChange={(e) => {
                        setTosAgreed(e.target.checked);
                        if (e.target.checked) setUploadError(null);
                      }}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-1 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        Agree to Recommendation Terms of Service
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        I authorize the Recommendation Machine to process, store, and analyze the uploaded files to produce smart business and career recommendations.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Drag and Drop Zone Container */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-50/20"
                      : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/30"
                  }`}
                  id="dropzone"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.csv,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.json"
                  />
                  
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  <p className="text-sm font-bold text-slate-800">
                    Drag and drop file here, or <span className="text-indigo-600 hover:text-indigo-500">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF, CSV, Excel sheets, DOCX, or PNG up to 10MB
                  </p>
                </div>

                {/* Upload Status displays */}
                {uploadProgress !== null && (
                  <div className="space-y-2" id="upload-progress-container">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>Sending to storage bucket...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center space-x-2" id="upload-error-alert">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Informational Guidelines card */}
              <div className="bg-slate-900 text-slate-300 rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Info className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">How it works</h4>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Recommendation Machine parses the documents you upload. Click the <span className="text-indigo-300 font-semibold">"Analyze File"</span> button in the table list to initiate file parsing. Our rules and heuristics look at metadata size, format, and keywords to produce action-oriented advice cards.
                </p>
              </div>
            </div>

            {/* Uploaded Files Table Section - Right Column (7/12 grid span) */}
            <div className="xl:col-span-7 space-y-6" id="files-table-panel">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Recommendation Machine Database
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Showing {files.length} active documents in your storage scope.
                    </p>
                  </div>
                </div>

                {files.length === 0 ? (
                  <div className="p-12 text-center" id="empty-table-state">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                      <File className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No documents found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Check terms and upload a file to start getting automated suggestions.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" id="files-table-container">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                          <th className="px-6 py-4">Document Details</th>
                          <th className="px-4 py-4">Size</th>
                          <th className="px-4 py-4">Upload Date</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-sm">
                        {files.map((file) => (
                          <tr
                            key={file.id}
                            className={`hover:bg-slate-50/50 transition-colors ${
                              selectedFile?.id === file.id ? "bg-indigo-50/20" : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="shrink-0">{getFileIcon(file.name)}</div>
                                <div className="min-w-0">
                                  <button
                                    onClick={() => setSelectedFile(file)}
                                    className="font-semibold text-slate-900 text-left hover:text-indigo-600 block truncate cursor-pointer hover:underline"
                                  >
                                    {file.name}
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    ID: {file.id.substring(0, 12)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-slate-600">
                              {formatFileSize(file.size)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                              {formatDate(file.date)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs">
                              {file.status === "analyzed" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  Ready
                                </span>
                              ) : isAnalyzingId === file.id ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping mr-1.5"></span>
                                  Scanning
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                              <div className="flex items-center justify-end space-x-2">
                                {file.status === "pending" && isAnalyzingId !== file.id && (
                                  <button
                                    onClick={() => handleAnalyzeFile(file.id)}
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 rounded-lg font-bold transition-all flex items-center space-x-1 cursor-pointer"
                                    title="Analyze this file to generate recommendations"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Analyze</span>
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => setSelectedFile(file)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="View File Insights"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteFile(file.id, file.name)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Selected File Recommendation Inspector Panel */}
              {selectedFile && (
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 animate-fadeIn" id="inspector-panel">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        {getFileIcon(selectedFile.name)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white block">
                          {selectedFile.name}
                        </h4>
                        <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                          Size: {formatFileSize(selectedFile.size)} | {formatDate(selectedFile.date)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Dismiss View
                    </button>
                  </div>

                  <hr className="border-slate-800" />

                  {selectedFile.status === "analyzed" && selectedFile.recommendation ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                          Smart Recommendation Engine Findings
                        </span>
                      </div>
                      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
                        {selectedFile.recommendation}
                      </div>
                    </div>
                  ) : isAnalyzingId === selectedFile.id ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-medium">
                        Running structural heuristic analysis...
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                      <p className="text-xs text-slate-400 max-w-sm">
                        This document has not been parsed by the machine yet. Analyze this document to generate optimization recommendations.
                      </p>
                      <button
                        onClick={() => handleAnalyzeFile(selectedFile.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-lg shadow-indigo-600/10"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Run Full Engine Analysis</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
