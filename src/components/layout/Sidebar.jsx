import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Home, ThreeDRotation, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <Drawer variant="permanent" sx={{ width: 240 }}>
      <List>
        <ListItem button onClick={() => navigate('/')}>
          <ListItemIcon><Home /></ListItemIcon>
          <ListItemText primary="Ana Sayfa" />
        </ListItem>
        <ListItem button onClick={() => navigate('/project')}>
          <ListItemIcon><ThreeDRotation /></ListItemIcon>
          <ListItemText primary="Proje" />
        </ListItem>
        <ListItem button onClick={() => navigate('/report')}>
          <ListItemIcon><Assessment /></ListItemIcon>
          <ListItemText primary="Rapor" />
        </ListItem>
      </List>
    </Drawer>
  );
}