import React from 'react';
import { PaperProvider } from './context/PaperContext';
import Layout from './components/layout/Layout';
import PaperList from './components/papers/PaperList';
import './App.css';

function App() {
  return (
    <PaperProvider>
      <Layout>
        <PaperList />
      </Layout>
    </PaperProvider>
  );
}

export default App;
