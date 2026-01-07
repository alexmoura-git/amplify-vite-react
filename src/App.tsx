import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import PromptLibrary from './pages/PromptLibrary';
import Onboarding from './pages/Onboarding';

function App() {
  const { user } = useAuthenticator();

  if (!user) {
    return <Onboarding />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/prompts" element={<PromptLibrary />} />
        <Route path="/project/:projectId/*" element={<ProjectWorkspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
