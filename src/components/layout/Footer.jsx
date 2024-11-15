import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
      <Typography variant="body2" align="center">
        © 2023 Playground Safety
      </Typography>
    </Box>
  );
}