import React from 'react';
import VintedStudio from './components/VintedStudio';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex justify-center">
      <main className="w-full max-w-7xl relative">
        <VintedStudio />
      </main>
    </div>
  );
};

export default App;