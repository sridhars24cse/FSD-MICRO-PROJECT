import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const API = 'https://fsd-micro-project.onrender.com';

const CAT_COLORS = [
  { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-500/50', hex: '#f43f5e' },
  { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-500/50', hex: '#3b82f6' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-500/50', hex: '#f59e0b' },
  { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-500/50', hex: '#a855f7' },
  { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-300 dark:border-teal-500/50', hex: '#14b8a6' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-300 dark:border-indigo-500/50', hex: '#6366f1' },
  { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-300 dark:border-pink-500/50', hex: '#ec4899' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-300 dark:border-cyan-500/50', hex: '#06b6d4' }
];

const getCatColor = (cat) => {
  if (!cat) return CAT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return CAT_COLORS[Math.abs(hash) % CAT_COLORS.length];
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [lcUser, setLcUser] = useState(localStorage.getItem('lcUser') || '');
  const [loggedUser, setLoggedUser] = useState(localStorage.getItem('loggedUser') || '');
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lcInput, setLcInput] = useState('');
  const [lcStats, setLcStats] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [filter, setFilter] = useState('All');
  const [currentView, setCurrentView] = useState('dashboard');
  const [tempLcUser, setTempLcUser] = useState(lcUser || '');
  const [authError, setAuthError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('categories')) || ['Work', 'Study', 'Personal']);
  const [newCat, setNewCat] = useState('');
  const [category, setCategory] = useState(() => {
    const cats = JSON.parse(localStorage.getItem('categories')) || ['Work', 'Study', 'Personal'];
    return cats.length > 0 ? cats[0] : '';
  });
  const [editingTask, setEditingTask] = useState(null); // task object being edited
  const [calendarModal, setCalendarModal] = useState(null); // { task, x, y }

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
    if (!categories.includes(category) && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const addCategory = (e) => {
    e.preventDefault();
    if (!newCat.trim() || categories.includes(newCat.trim())) return;
    setCategories([...categories, newCat.trim()]);
    setNewCat('');
    showMsg('Category added!');
  };

  const deleteCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
    showMsg('Category removed!');
  };

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
      if (lcUser) fetchLeetcode();
    }
  }, [token, lcUser]);

  const savePlatformSettings = async (e) => {
    e.preventDefault();
    setLcUser(tempLcUser);
    localStorage.setItem('lcUser', tempLcUser);
    setCurrentView('dashboard');
    if (tempLcUser) {
      try {
        const res = await axios.get(`${API}/leetcode/${tempLcUser}`);
        setLcStats(res.data.data?.matchedUser?.submitStats?.acSubmissionNum);
      } catch (err) {}
    } else {
      setLcStats(null);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`, { headers: { Authorization: token } });
      setTasks(res.data);
    } catch (e) { if(e.response?.status === 401) logout(); }
  };

  const fetchLeetcode = async () => {
    try {
      const res = await axios.get(`${API}/leetcode/${lcUser}`);
      setLcStats(res.data.data?.matchedUser?.submitStats?.acSubmissionNum);
    } catch (e) {}
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isLoginMode ? 'login' : 'signup';
      const res = await axios.post(`${API}/auth/${endpoint}`, { username, password });
      if (isLoginMode) {
        setToken(res.data.token);
        setLcUser(res.data.leetcodeUsername || '');
        setLoggedUser(username);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('lcUser', res.data.leetcodeUsername || '');
        localStorage.setItem('loggedUser', username);
      } else {
        setAuthError('');
        setIsLoginMode(true);
        alert('Signup success! Please login.');
      }
    } catch (err) { setAuthError(err.response?.data || 'Authentication failed. Please check credentials.'); }
  };

  const addTask = async (e) => {
    e?.preventDefault();
    if (!title.trim()) return;
    try {
      if (editingTask) {
        // Edit mode — update existing task
        await axios.put(`${API}/tasks/${editingTask._id}`, { title, description, category, date }, { headers: { Authorization: token } });
        showMsg('Task updated!');
      } else {
        // Create mode — new task
        await axios.post(`${API}/tasks`, { title, description, category, date }, { headers: { Authorization: token } });
        showMsg('Task added successfully!');
      }
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setEditingTask(null);
      fetchTasks();
      setCurrentView('dashboard');
    } catch(err) { showMsg('Failed to save task.'); }
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setDate(new Date(task.date).toISOString().split('T')[0]);
    setCalendarModal(null);
    setCurrentView('addTask');
  };

  const postponeTask = async (taskId, newDate) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { date: newDate }, { headers: { Authorization: token } });
      fetchTasks();
      setCalendarModal(null);
      showMsg('Task postponed!');
    } catch(err) { showMsg('Failed to postpone task.'); }
  };

  const handleSelectEvent = (event, e) => {
    const rect = e?.target?.getBoundingClientRect?.() || { top: 200, left: 200, width: 0, height: 0 };
    const task = tasks.find(t => t._id === event.taskId);
    if (task) setCalendarModal({ task, x: rect.left + window.scrollX, y: rect.top + rect.height + window.scrollY + 8 });
  };

  const toggleTask = async (task) => {
    try {
      await axios.put(`${API}/tasks/${task._id}`, { completed: !task.completed }, { headers: { Authorization: token } });
      fetchTasks();
    } catch(err) {}
  };

  const deleteTask = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/tasks/${id}`, { headers: { Authorization: token } });
      fetchTasks();
      showMsg('Task deleted.');
    } catch (err) { console.error('Failed to delete task', err); }
  };

  const logout = () => {
    setToken(null);
    setLcUser('');
    setLoggedUser('');
    setTasks([]);
    localStorage.removeItem('token');
    localStorage.removeItem('lcUser');
    localStorage.removeItem('loggedUser');
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-600 dark:from-emerald-400 dark:to-indigo-500 mb-2">⚡ Sprint Tracker</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">{isLoginMode ? 'Welcome back! Log in to continue.' : 'Create a new account to start tracking.'}</p>
        
        <form onSubmit={handleAuth} className="space-y-5">
          {authError && <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 text-sm text-center font-medium">{authError}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Username</label>
            <input className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 ring-emerald-500 outline-none transition dark:text-white" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Password</label>
            <input className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 ring-emerald-500 outline-none transition dark:text-white" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="w-full bg-emerald-600 py-3.5 mt-2 rounded-xl font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]">
            {isLoginMode ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-500 dark:hover:text-emerald-300 hover:underline transition">
            {isLoginMode ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );

  if (currentView === 'platformSettings') return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans flex items-center justify-center transition-colors duration-300">
      <div className="max-w-md w-full">
        <button onClick={() => setCurrentView('dashboard')} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-6 flex items-center gap-2 font-medium">
          <span className="text-xl leading-none">←</span> Back to Dashboard
        </button>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-600 dark:from-emerald-400 dark:to-indigo-500 mb-2">User Platform</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">Connect your coding platforms to track your progress.</p>
          
          <form onSubmit={savePlatformSettings} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">LeetCode Username</label>
              <input 
                value={tempLcUser} 
                onChange={e => setTempLcUser(e.target.value)} 
                placeholder="e.g. neetcode" 
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 ring-emerald-500 outline-none transition dark:text-white" 
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]">
              Save Connection
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (currentView === 'settings') return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans flex items-center justify-center transition-colors duration-300">
      {actionMsg && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-in slide-in-from-top-4 fade-in duration-300 z-50">
          {actionMsg}
        </div>
      )}
      <div className="max-w-md w-full">
        <button onClick={() => setCurrentView('dashboard')} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-6 flex items-center gap-2 font-medium">
          <span className="text-xl leading-none">←</span> Back to Dashboard
        </button>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 space-y-8">
          
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-4">🎨 Appearance</h2>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-medium text-slate-700 dark:text-slate-300">Theme</span>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
              >
                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-4">🗂️ Categories</h2>
            <form onSubmit={addCategory} className="flex gap-2 mb-4">
              <input 
                value={newCat} 
                onChange={e => setNewCat(e.target.value)} 
                placeholder="New category..." 
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 ring-emerald-500 outline-none transition dark:text-white" 
              />
              <button type="submit" className="bg-emerald-600 px-5 rounded-xl font-bold text-white hover:bg-emerald-500 transition">Add</button>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {categories.map(c => {
                const colors = getCatColor(c);
                return (
                  <div key={c} className={`flex items-center justify-between p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-current ${colors.text}`}></div>
                      <span className={`font-bold tracking-wide ${colors.text}`}>{c}</span>
                    </div>
                    <button onClick={() => deleteCategory(c)} className={`${colors.text} opacity-60 hover:opacity-100 transition px-2`}>✕</button>
                  </div>
                );
              })}
              {categories.length === 0 && <p className="text-center text-slate-500 text-sm mt-4">No categories left.</p>}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );

  if (currentView === 'addTask') return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans transition-colors duration-300 flex justify-center">
      <div className="w-full max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => { setCurrentView('dashboard'); setEditingTask(null); setTitle(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]); }} className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold flex items-center gap-2 transition">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            {editingTask && <span className="text-xs font-bold text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-700">✏️ Editing Task</span>}
            <button onClick={addTask} className="bg-emerald-600 px-6 py-2 rounded-xl font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-500/20">
              {editingTask ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="Task Title" 
            className="w-full px-8 pt-8 pb-4 text-3xl font-extrabold text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
            autoFocus
          />
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Start typing your notes here..." 
            className="flex-1 w-full px-8 py-4 text-lg text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 leading-relaxed"
          />
          <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 px-8 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</span>
                <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none cursor-pointer">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (currentView === 'profile') {
    const profileDone = tasks.filter(t => t.completed).length;
    const profileProgress = tasks.length ? Math.round((profileDone / tasks.length) * 100) : 0;
    const catStats = tasks.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = { total: 0, done: 0 };
      acc[t.category].total++;
      if (t.completed) acc[t.category].done++;
      return acc;
    }, {});
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans transition-colors duration-300">
        {actionMsg && <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold z-50">{actionMsg}</div>}
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setCurrentView('dashboard')} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-6 flex items-center gap-2 font-medium">
            <span className="text-xl leading-none">←</span> Back to Dashboard
          </button>
          <div className="space-y-5">

            {/* ── Hero Card ── */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600"></div>
              <div className="px-8 pb-8 -mt-12 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-4 border-white dark:border-slate-800 mb-4">
                  <span className="text-4xl font-black text-white">{loggedUser.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{loggedUser}</h2>
                <p className="text-emerald-500 dark:text-emerald-400 font-semibold text-sm mt-1">⚡ Task Master</p>
                <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-6"></div>
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-3xl font-black text-slate-800 dark:text-white">{tasks.length}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{profileDone}</p>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mt-1">Done</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{profileProgress}%</p>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Category Breakdown ── */}
            {Object.keys(catStats).length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-5">🗂️ Category Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(catStats).map(([cat, stats]) => {
                    const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
                    const colors = getCatColor(cat);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-sm font-bold ${colors.text}`}>{cat}</span>
                          <span className="text-xs text-slate-400">{stats.done}/{stats.total} · {pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: colors.hex }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LeetCode ── */}
            {lcStats && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-500/30 p-6">
                <h3 className="text-lg font-extrabold text-yellow-600 dark:text-yellow-400 mb-4">🏆 LeetCode — @{lcUser}</h3>
                <div className="grid grid-cols-3 gap-3">
                  {lcStats.filter(s => s.difficulty !== 'All').map(s => (
                    <div key={s.difficulty} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                      <p className={`text-xs font-black uppercase tracking-wider mb-2 ${s.difficulty==='Easy'?'text-emerald-500':s.difficulty==='Medium'?'text-yellow-500':'text-rose-500'}`}>{s.difficulty}</p>
                      <p className="text-3xl font-black text-slate-800 dark:text-slate-200">{s.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Quick Actions ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setCurrentView('settings')} className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition group">
                  <span className="text-2xl">⚙️</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">Settings</p>
                    <p className="text-xs text-slate-400">Manage theme & categories</p>
                  </div>
                  <span className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-emerald-400 transition text-lg">→</span>
                </button>
                <button onClick={() => { setTempLcUser(lcUser || ''); setCurrentView('platformSettings'); }} className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-yellow-400/50 hover:bg-yellow-50 dark:hover:bg-yellow-500/5 transition group">
                  <span className="text-2xl">🔗</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition">Connect Platform</p>
                    <p className="text-xs text-slate-400">{lcUser ? `Connected as @${lcUser}` : 'Link your LeetCode account'}</p>
                  </div>
                  <span className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-yellow-400 transition text-lg">→</span>
                </button>
              </div>
            </div>

            {/* ── Danger Zone ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-rose-200 dark:border-rose-500/20 p-6">
              <h3 className="text-lg font-extrabold text-rose-500 mb-4">🚨 Danger Zone</h3>
              <button onClick={logout} className="w-full bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 border border-rose-200 dark:border-rose-500/30 hover:border-rose-500 text-rose-500 hover:text-white font-bold py-3.5 rounded-xl transition-all duration-200">
                Sign Out of Account
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const completed = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const chartData = Object.values(tasks.reduce((acc, t) => {
    const d = new Date(t.date).toLocaleDateString();
    if (!acc[d]) acc[d] = { date: d, total: 0, completed: 0 };
    acc[d].total++; if (t.completed) acc[d].completed++;
    return acc;
  }, {})).reverse();

  const barData = Object.values(tasks.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { category: t.category, count: 0 };
    acc[t.category].count++; return acc;
  }, {}));

  const events = tasks.map(t => ({
    title: t.title,
    taskId: t._id,
    start: new Date(t.date),
    end: new Date(t.date),
    allDay: true,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans transition-colors duration-300">
      {actionMsg && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-in slide-in-from-top-4 fade-in duration-300 z-50">
          {actionMsg}
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-indigo-600 dark:from-emerald-400 dark:to-indigo-500">⚡ TASK-MASTER</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView('settings')} className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition font-semibold flex items-center gap-2">
              ⚙️ <span className="hidden md:inline">Settings</span>
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              title={loggedUser || 'Profile'}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/20 hover:scale-110 hover:shadow-emerald-500/40 transition-all duration-200 border-2 border-white dark:border-slate-700 shrink-0"
            >
              {loggedUser.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">📝 Tasks</h2>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                {['All', 'Active', 'Completed'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-md transition ${filter === f ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('addTask')}
              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 mb-6 transition flex items-center justify-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl group-hover:bg-emerald-500 group-hover:text-white transition">
                +
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">Create New Task</span>
            </button>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2" style={{maxHeight: '400px'}}>
              {tasks.filter(t => filter === 'All' ? true : filter === 'Active' ? !t.completed : t.completed).map(t => (
                <div key={t._id} onClick={() => toggleTask(t)} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition group ${t.completed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-emerald-500/50 shadow-sm hover:shadow-md'}`}>
                  <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border shrink-0 transition ${t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-400 group-hover:border-emerald-400'}`}>
                    {t.completed && <span className="text-white dark:text-slate-900 text-xs font-bold">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate transition text-base ${t.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{t.title}</p>
                    {t.description && <p className={`text-sm mt-1 line-clamp-2 ${t.completed ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>{t.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md border ${getCatColor(t.category).bg} ${getCatColor(t.category).text} ${getCatColor(t.category).border}`}>{t.category}</span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      📅 {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <button onClick={(e) => deleteTask(e, t._id)} className="text-slate-400 hover:text-rose-500 md:opacity-0 group-hover:opacity-100 transition p-1 shrink-0 ml-1" title="Delete Task">✕</button>
                </div>
              ))}
              {!tasks.filter(t => filter === 'All' ? true : filter === 'Active' ? !t.completed : t.completed).length && <p className="text-slate-400 dark:text-slate-500 text-center py-8">No tasks found. {filter !== 'All' ? 'Try changing the filter.' : 'Start sprinting!'}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">📈 Progress</h2>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-slate-500 dark:text-slate-400">Completion</span>
                <span className="text-emerald-600 dark:text-emerald-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-r from-emerald-400 to-indigo-500 dark:from-emerald-500 dark:to-indigo-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-4">{completed} of {tasks.length} tasks done</p>
            </div>

            {!lcStats && (
              <div 
                onClick={() => { setTempLcUser(lcUser || ''); setCurrentView('platformSettings'); }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition cursor-pointer group flex flex-col items-center justify-center text-center h-40"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-3 group-hover:scale-110 transition border border-slate-200 dark:border-slate-700 group-hover:border-emerald-500/50">
                  <span className="text-xl">🔗</span>
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition">Connect Platform</h3>
                <p className="text-xs text-slate-400 mt-1">Track LeetCode</p>
              </div>
            )}

            {lcStats && (
              <div 
                onClick={() => { setTempLcUser(lcUser || ''); setCurrentView('platformSettings'); }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-500/30 cursor-pointer hover:border-yellow-400 transition group"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-2">🏆 LeetCode</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-yellow-500 transition">Edit ⚙️</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {lcStats.map(s => (
                    <div key={s.difficulty} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className={`text-xs font-bold mb-1 ${s.difficulty==='Easy'?'text-emerald-500 dark:text-emerald-400':s.difficulty==='Medium'?'text-yellow-500 dark:text-yellow-400':'text-rose-500 dark:text-rose-400'}`}>{s.difficulty}</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{s.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 h-80">
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">📊 Activity Trend</h2>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="date" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', color: theme === 'dark' ? '#fff' : '#000', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 h-80">
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">🗂️ Tasks by Category</h2>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="category" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', color: theme === 'dark' ? '#fff' : '#000', borderRadius: '12px', cursor: 'transparent' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCatColor(entry.category).hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-8" style={{ height: '600px' }}>
          <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">📅 Calendar</h2>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month', 'week', 'day']}
            className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}
            style={{ height: 'calc(100% - 60px)' }}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Calendar Task Modal */}
        {calendarModal && (
          <div className="fixed inset-0 z-40" onClick={() => setCalendarModal(null)}>
            <div
              className="absolute bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 w-80 z-50"
              style={{ top: Math.min(calendarModal.y, window.innerHeight - 280), left: Math.min(calendarModal.x, window.innerWidth - 340) }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">{calendarModal.task.title}</p>
                  {calendarModal.task.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{calendarModal.task.description}</p>}
                </div>
                <button onClick={() => setCalendarModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition shrink-0">✕</button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md border ${getCatColor(calendarModal.task.category).bg} ${getCatColor(calendarModal.task.category).text} ${getCatColor(calendarModal.task.category).border}`}>{calendarModal.task.category}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">📅 {new Date(calendarModal.task.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>

              <button
                onClick={() => openEditTask(calendarModal.task)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition mb-3 flex items-center justify-center gap-2"
              >
                ✏️ Edit Task
              </button>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📅 Postpone to</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    defaultValue={new Date(calendarModal.task.date).toISOString().split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
                    id="postpone-date-input"
                    className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      const val = document.getElementById('postpone-date-input').value;
                      if (val) postponeTask(calendarModal.task._id, val);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 rounded-xl transition"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
