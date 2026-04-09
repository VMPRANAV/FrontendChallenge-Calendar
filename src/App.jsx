import CalendarRoot from './components/Calendar/CalendarRoot';
import './App.css';

function App() {
  return (
    <main className="min-h-screen w-full bg-[var(--bg)] transition-colors lg:h-screen">
      <div className="relative z-10 w-full lg:h-full">
        <CalendarRoot />
      </div>
    </main>
  );
}

export default App;
