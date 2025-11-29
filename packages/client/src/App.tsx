import { Container } from '@gravity-ui/uikit';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import './App.css';

function App() {
  return (
    <Container className="app">
      <h1>AI BI Analyst</h1>
      <div className="layout">
        <Dashboard />
        <Chat />
      </div>
    </Container>
  );
}

export default App;
