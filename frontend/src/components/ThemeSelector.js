import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Box,
  Divider
} from '@mui/material';
import {
  Palette,
  DarkMode,
  LightMode,
  GitHub,
  Water,
  GraphicEq,
  Check
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const themeIcons = {
  dark: <DarkMode />,
  light: <LightMode />,
  github: <GitHub />,
  ocean: <Water />,
  synthwave: <GraphicEq />
};

const ThemeSelector = () => {
  const { currentTheme, changeTheme, availableThemes } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (themeKey) => {
    changeTheme(themeKey);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Change Theme">
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.selected',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <Palette />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 200,
            mt: 1,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Choose Theme
          </Typography>
        </Box>
        <Divider />
        
        {availableThemes.map((theme) => (
          <MenuItem
            key={theme.key}
            onClick={() => handleThemeChange(theme.key)}
            selected={currentTheme === theme.key}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', color: 'inherit' }}>
              {themeIcons[theme.key] || <Palette />}
            </ListItemIcon>
            <ListItemText primary={theme.name} />
            {currentTheme === theme.key && (
              <Check color="primary" sx={{ fontSize: 20 }} />
            )}
          </MenuItem>
        ))}
        
        <Divider sx={{ my: 1 }} />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Theme preference is saved locally
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default ThemeSelector;