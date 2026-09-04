import MenuIcon from "@mui/icons-material/Menu"
import StyleIcon from "@mui/icons-material/Style"
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { openAuthDialog, signOut } from "../features/auth/authSlice"
import { useAppDispatch, useAppSelector } from "../store/hooks"

const navItems = [
  { label: "Home", to: "/" },
  { label: "Statistics", to: "/statistics" },
  { label: "Settings", to: "/settings" },
  { label: "About", to: "/about" },
]

export function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down("md"))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const user = useAppSelector((state) => state.auth.user)

  const closeDrawer = () => setDrawerOpen(false)

  const authButtons = isAuthenticated ? (
    <Stack alignItems="center" gap={0.25}>
      {user && (
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, lineHeight: 1.2 }} noWrap>
          {user.email}
        </Typography>
      )}
      <Button color="inherit" size="small" onClick={() => dispatch(signOut())}>
        Sign Out
      </Button>
    </Stack>
  ) : (
    <>
      <Button color="inherit" onClick={() => dispatch(openAuthDialog("signUp"))}>
        Sign Up
      </Button>
      <Button variant="contained" onClick={() => dispatch(openAuthDialog("signIn"))}>
        Sign In
      </Button>
    </>
  )

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2, minHeight: { xs: 64, md: 72 }, position: "relative" }}>
          <Stack
            component={NavLink}
            to="/"
            direction="row"
            alignItems="center"
            gap={1.25}
            sx={{
              textDecoration: "none",
              color: "text.primary",
              flex: isCompact ? "1 1 auto" : "1 1 0",
              minWidth: 0,
            }}
          >
            <Box
              aria-hidden
              sx={{
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <StyleIcon fontSize="small" />
            </Box>
            <Typography variant="h6" component="span" sx={{ letterSpacing: "-0.01em" }}>
              Flashcard Trainer
            </Typography>
          </Stack>

          {isCompact ? (
            <>
              {!isAuthenticated && (
                <Button variant="contained" size="small" onClick={() => dispatch(openAuthDialog("signIn"))}>
                  Sign In
                </Button>
              )}
              <IconButton edge="end" aria-label="Open navigation menu" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            </>
          ) : (
            <>
              {/* Absolutely centered so the nav stays in the middle of the toolbar
                  no matter how wide the logo or the auth controls become. */}
              <Stack
                component="nav"
                direction="row"
                gap={0.5}
                aria-label="Main navigation"
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {navItems.map((item) => {
                  const active = location.pathname === item.to
                  return (
                    <Button
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      color={active ? "primary" : "inherit"}
                      sx={{ fontWeight: active ? 700 : 500 }}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Button>
                  )
                })}
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                gap={1}
                sx={{ flex: "1 1 0", minWidth: 0 }}
              >
                {authButtons}
              </Stack>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 260, pt: 1 }} role="presentation">
          <List component="nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                selected={location.pathname === item.to}
                onClick={() => {
                  navigate(item.to)
                  closeDrawer()
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            {isAuthenticated ? (
              <Stack gap={1}>
                {user && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    dispatch(signOut())
                    closeDrawer()
                  }}
                >
                  Sign Out
                </Button>
              </Stack>
            ) : (
              <Stack gap={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    dispatch(openAuthDialog("signIn"))
                    closeDrawer()
                  }}
                >
                  Sign In
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    dispatch(openAuthDialog("signUp"))
                    closeDrawer()
                  }}
                >
                  Sign Up
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}
