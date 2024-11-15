import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import Home from '../../pages/Home';
import Project from '../../pages/Project';
import Report from '../../pages/Report';

export default function Layout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project" element={<Project />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}