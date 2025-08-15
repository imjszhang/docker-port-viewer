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
  Paper,
  IconButton,
  Menu,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WebIcon from '@mui/icons-material/Web';
import axios from 'axios';
import { Container as DockerContainer, Port } from './types';

const HOSTNAME_STORAGE_KEY = 'docker-port-viewer-hostname';
const SORT_OPTION_STORAGE_KEY = 'docker-port-viewer-sort-option';

type SortOption = 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc';

const App: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<DockerContainer[]>([]);
  const [hostname, setHostname] = useState<string>(() => {
    return localStorage.getItem(HOSTNAME_STORAGE_KEY) || 'localhost';
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    return (localStorage.getItem(SORT_OPTION_STORAGE_KEY) as SortOption) || 'name-asc';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeHistory, setIframeHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    let filtered = containers;
    
    if (searchTerm.trim() !== '') {
      filtered = containers.filter((container: DockerContainer) => 
        container.Names.some((name: string) => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

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

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    setCurrentUrl(url);
    setIframeKey(prev => prev + 1);
    setIframeHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(iframeHistory[newIndex]);
      setIframeKey(prev => prev + 1);
    }
  };

  const handleForward = () => {
    if (historyIndex < iframeHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(iframeHistory[newIndex]);
      setIframeKey(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, url: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUrl(url);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUrl(null);
  };

  const handleOpenInIframe = () => {
    if (selectedUrl) {
      handleLinkClick(new MouseEvent('click') as any, selectedUrl);
    }
    handleMenuClose();
  };

  const handleOpenInNewTab = () => {
    if (selectedUrl) {
      window.open(selectedUrl, '_blank', 'noopener,noreferrer');
    }
    handleMenuClose();
  };

  return (
    <Container maxWidth={false} sx={{ py: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
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
      </Box>

      <Box sx={{ display: 'flex', flex: 1, gap: 2, overflow: 'hidden' }}>
        {/* Left Column - Container List */}
        <Paper 
          elevation={3} 
          sx={{ 
            flex: '0 0 400px', 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {filteredContainers.map((container: DockerContainer) => (
                <ListItem 
                  key={container.Id} 
                  sx={{ 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" noWrap>
                        {container.Names[0].replace(/^\//, '')}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {container.Image}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Status: {container.State}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Started: {container.State === 'running' ? new Date(Number(container.Created) * 1000).toLocaleString() : 'Not started'}
                        </Typography>
                        <List dense>
                          {(container.Ports || [])
                            .filter((port, index, self) => 
                              index === self.findIndex(p => 
                                p.PublicPort === port.PublicPort && 
                                p.PrivatePort === port.PrivatePort
                              )
                            )
                            .map((port: Port, index: number) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={
                                  port.PublicPort ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Link
                                        href={generateLink(port.PublicPort)}
                                        onClick={(e) => handleLinkClick(e, generateLink(port.PublicPort))}
                                        sx={{ fontSize: '0.875rem', flex: 1 }}
                                      >
                                        {generateLink(port.PublicPort)}
                                      </Link>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, generateLink(port.PublicPort))}
                                      >
                                        <MoreVertIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
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
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {filteredContainers.length === 0 && searchTerm && (
                <ListItem>
                  <Alert severity="info">
                    No containers found matching "{searchTerm}"
                  </Alert>
                </ListItem>
              )}
            </List>
          )}
        </Paper>

        {/* Right Column - Iframe */}
        <Paper 
          elevation={3} 
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 1, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <IconButton 
              onClick={handleBack} 
              disabled={historyIndex <= 0}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
            <IconButton 
              onClick={handleForward} 
              disabled={historyIndex >= iframeHistory.length - 1}
              size="small"
            >
              <ArrowForwardIcon />
            </IconButton>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 1,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentUrl || 'No URL selected'}
            </Typography>
          </Box>
          
          {currentUrl ? (
            <iframe
              key={iframeKey}
              src={currentUrl}
              style={{
                flex: 1,
                border: 'none',
                width: '100%',
                height: '100%'
              }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              title="Container Content"
            />
          ) : (
            <Box 
              sx={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary'
              }}
            >
              <Typography>Select a container port to view its content</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenInIframe}>
          <WebIcon fontSize="small" sx={{ mr: 1 }} />
          Open in iframe
        </MenuItem>
        <MenuItem onClick={handleOpenInNewTab}>
          <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} />
          Open in new tab
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default App; 