import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import axios from 'axios';
import { Container as DockerContainer, Port } from './types';

const HOSTNAME_STORAGE_KEY = 'docker-port-viewer-hostname';
const SORT_OPTION_STORAGE_KEY = 'docker-port-viewer-sort-option';

type SortOption = 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc';

const App: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<DockerContainer[]>([]);
  const [hostname, setHostname] = useState<string>(() => {
    // Initialize hostname from localStorage or default to 'localhost'
    return localStorage.getItem(HOSTNAME_STORAGE_KEY) || 'localhost';
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    return (localStorage.getItem(SORT_OPTION_STORAGE_KEY) as SortOption) || 'name-asc';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    let filtered = containers;
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = containers.filter((container: DockerContainer) => 
        container.Names.some((name: string) => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a: DockerContainer, b: DockerContainer) => {
      switch (sortOption) {
        case 'name-asc':
          return a.Names[0].localeCompare(b.Names[0]);
        case 'name-desc':
          return b.Names[0].localeCompare(a.Names[0]);
        case 'created-asc':
          return Number(b.Created) - Number(a.Created);
        case 'created-desc':
          return Number(a.Created) - Number(b.Created);
        default:
          return 0;
      }
    });

    setFilteredContainers(filtered);
  }, [searchTerm, containers, sortOption]);

  const handleHostnameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newHostname = e.target.value;
    setHostname(newHostname);
    localStorage.setItem(HOSTNAME_STORAGE_KEY, newHostname);
  };

  const handleSortChange = (e: SelectChangeEvent<SortOption>) => {
    const newSortOption = e.target.value as SortOption;
    setSortOption(newSortOption);
    localStorage.setItem(SORT_OPTION_STORAGE_KEY, newSortOption);
  };

  const fetchContainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/v1.41/containers/json', {
        socketPath: '/var/run/docker.sock'
      });
      console.log('Container data:', response.data[0]); // Log first container for inspection
      setContainers(response.data);
      setFilteredContainers(response.data);
    } catch (err) {
      setError('Failed to fetch container information. Make sure the Docker socket is accessible.');
      console.error('Error fetching containers:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = (port: number): string => {
    return `http://${hostname}:${port}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Docker Port Viewer
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Hostname"
              value={hostname}
              onChange={handleHostnameChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Containers"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortOption}
                onChange={handleSortChange}
                label="Sort By"
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem value="created-asc">Created (Oldest First)</MenuItem>
                <MenuItem value="created-desc">Created (Newest First)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
            {filteredContainers.map((container: DockerContainer) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={container.Id} sx={{ display: 'flex' }}>
                <Card sx={{ 
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 3,
                  }
                }}>
                  <CardContent sx={{ 
                    flexGrow: 1,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}>
                    <Typography variant="subtitle1" noWrap gutterBottom>
                      {container.Names[0].replace(/^\//, '')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap gutterBottom>
                      {container.Image}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Status: {container.State}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                      Started: {container.State === 'running' ? new Date(Number(container.Created) * 1000).toLocaleString() : 'Not started'}
                    </Typography>
                    
                    <List dense sx={{ mt: 'auto' }}>
                      {container.Ports.map((port: Port, index: number) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              port.PublicPort ? (
                                <Link
                                  href={generateLink(port.PublicPort)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ fontSize: '0.875rem' }}
                                >
                                  {generateLink(port.PublicPort)}
                                </Link>
                              ) : (
                                <Typography variant="body2">
                                  Private Port: {port.PrivatePort}
                                </Typography>
                              )
                            }
                            secondary={
                              <Typography variant="caption" color="textSecondary">
                                {port.Type} - Internal Port: {port.PrivatePort}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filteredContainers.length === 0 && searchTerm && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No containers found matching "{searchTerm}"
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default App; 