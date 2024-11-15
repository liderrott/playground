import { ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import Layout from './components/layout/Layout';
import theme from './theme';
import store from './store/store';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;