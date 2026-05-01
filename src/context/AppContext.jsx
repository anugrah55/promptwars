import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [prospectMirror, setProspectMirror] = useState(null);
  const [hallOfFame, setHallOfFame] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('empathy_hof') || '[]');
    } catch { return []; }
  });
  const [activeModule, setActiveModule] = useState('mirror');

  const saveToHallOfFame = useCallback((entry) => {
    const newEntry = {
      id: Date.now(),
      ...entry,
      savedAt: new Date().toISOString(),
    };
    setHallOfFame(prev => {
      const updated = [newEntry, ...prev].slice(0, 20);
      localStorage.setItem('empathy_hof', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHallOfFame = useCallback((id) => {
    setHallOfFame(prev => {
      const updated = prev.filter(e => e.id !== id);
      localStorage.setItem('empathy_hof', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      prospectMirror,
      setProspectMirror,
      hallOfFame,
      saveToHallOfFame,
      removeFromHallOfFame,
      activeModule,
      setActiveModule,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
