import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { Container as DockerContainer } from './types';

const App: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<DockerContainer[]>([]);
  const [hostname, setHostname] = useState<string>('localhost');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContainers(containers);
    } else {
      const filtered = containers.filter(container => 
        container.Names.some(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredContainers(filtered);
    }
  }, [searchTerm, containers]);

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
            onChange={(e) => setHostname(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Search Containers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
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
            {filteredContainers.map((container) => (
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
                  
                  <List dense>
                    {container.Ports.map((port, index) => (
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