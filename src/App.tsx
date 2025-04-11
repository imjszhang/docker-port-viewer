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
          return new Date(a.Created).getTime() - new Date(b.Created).getTime();
        case 'created-desc':
          return new Date(b.Created).getTime() - new Date(a.Created).getTime();
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
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Docker Port Viewer
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Hostname"
            value={hostname}
            onChange={handleHostnameChange}
            margin="normal"
            helperText="Hostname will be saved and persist across container restarts"
          />
          <TextField
            fullWidth
            label="Search Containers"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth margin="normal">
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
        </Box>

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
          <List>
            {filteredContainers.map((container: DockerContainer) => (
              <Card key={container.Id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {container.Names[0].replace(/^\//, '')}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {container.Image}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Status: {container.State}
                  </Typography>
                  <Typography color="textSecondary" variant="caption" display="block">
                    Created: {new Date(container.Created).toLocaleString()}
                  </Typography>
                  
                  <List dense>
                    {container.Ports.map((port: Port, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={
                            port.PublicPort ? (
                              <Link
                                href={generateLink(port.PublicPort)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {generateLink(port.PublicPort)}
                              </Link>
                            ) : (
                              `Private Port: ${port.PrivatePort}`
                            )
                          }
                          secondary={`${port.Type} - Internal Port: ${port.PrivatePort}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            ))}
            {filteredContainers.length === 0 && searchTerm && (
              <Alert severity="info">
                No containers found matching "{searchTerm}"
              </Alert>
            )}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default App; 