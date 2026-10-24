import MenuIcon from "@mui/icons-material/Menu";
import StyleIcon from "@mui/icons-material/Style";
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
} from "@mui/material";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LanguagePicker } from "./LanguagePicker";
import { openAuthDialog, signOut } from "../features/auth/authSlice";
import { cleanTrainingSlice } from "../features/training/trainingSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AppStorage } from "@/utils/AppStorage";
import { cleanSettingsSlice } from "@/features/settings/settingsSlice";
import { cleanSetsSlice } from "@/features/sets/setsSlice";
import { cleanStatisticsSlice } from "@/features/statistics/statisticsSlice";

const navItems = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.statistics", to: "/statistics" },
  { labelKey: "nav.settings", to: "/settings" },
  { labelKey: "nav.about", to: "/about" },
];

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const brandRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);
  const signInSlotRef = useRef(0);
  const hideCompactSignInRef = useRef(false);
  const [hideCompactSignIn, setHideCompactSignIn] = useState(false);

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const closeDrawer = () => setDrawerOpen(false);

  useLayoutEffect(() => {
    const setHidden = (hidden: boolean) => {
      if (hideCompactSignInRef.current === hidden) return;
      hideCompactSignInRef.current = hidden;
      setHideCompactSignIn(hidden);
    };

    if (!isCompact || isAuthenticated) {
      setHidden(false);
      return;
    }

    const brand = brandRef.current;
    const title = titleRef.current;
    if (!brand || !title) return;

    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
      const wrapped = Number.isFinite(lineHeight) && title.offsetHeight > lineHeight * 1.4;
      const button = signInRef.current;
      if (button && button.offsetWidth > 0) {
        signInSlotRef.current = button.offsetWidth + 30;
      }

      // Hide only after a real wrap. Bring the button back only when the
      // single-line title has room for it, otherwise resize flips forever.
      if (!hideCompactSignInRef.current) {
        if (wrapped) setHidden(true);
        return;
      }
      if (wrapped) return;

      const iconWidth = 36;
      const gap = parseFloat(getComputedStyle(brand).columnGap || getComputedStyle(brand).gap) || 10;
      const spare = brand.clientWidth - iconWidth - gap - title.scrollWidth;
      const slot = signInSlotRef.current;
      if (slot > 0 && spare >= slot + 16) setHidden(false);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(brand);
    return () => observer.disconnect();
  }, [i18n.language, isAuthenticated, isCompact]);

  function performSignOut() {
    AppStorage.setAuthToken(null)
    AppStorage.clearTrainingProgress()
    dispatch(signOut())
    dispatch(cleanTrainingSlice())
    dispatch(cleanSettingsSlice())
    dispatch(cleanStatisticsSlice())
    dispatch(cleanSetsSlice())

    navigate("/")
  }

  const authButtons = isAuthenticated ? (
    <Stack alignItems="center" gap={0.25}>
      {user && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ maxWidth: 200, lineHeight: 1.2 }}
          noWrap
        >
          {user.email}
        </Typography>
      )}
      <Button color="inherit" size="small" onClick={() => performSignOut()}>
        {t("nav.signOut")}
      </Button>
    </Stack>
  ) : (
    <>
      <Button
        color="inherit"
        variant="outlined"
        onClick={() => dispatch(openAuthDialog("signUp"))}
      >
        {t("nav.signUp")}
      </Button>
      <Button
        color="inherit"
        variant="outlined"
        onClick={() => dispatch(openAuthDialog("signIn"))}
      >
        {t("nav.signIn")}
      </Button>
    </>
  );

  return (
    <>
      <AppBar position="sticky">
        <Toolbar
          sx={{ gap: 2, minHeight: { xs: 64, md: 72 }, position: "relative" }}
        >
          <Stack
            ref={brandRef}
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
            <Typography
              ref={titleRef}
              variant="h6"
              component="span"
              sx={{ letterSpacing: "-0.01em" }}
            >
              {t("app.name")}
            </Typography>
          </Stack>

          {isCompact ? (
            <Stack direction="row" alignItems="center">
              <LanguagePicker />
              {!isAuthenticated && !hideCompactSignIn && (
                <Button
                  ref={signInRef}
                  variant="outlined"
                  size="small"
                  onClick={() => dispatch(openAuthDialog("signIn"))}
                  sx={{ ml: "30px", whiteSpace: "nowrap" }}
                >
                  {t("nav.signIn")}
                </Button>
              )}
              <IconButton
                edge="end"
                aria-label={t("nav.openMenu")}
                onClick={() => setDrawerOpen(true)}
                sx={{ ml: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
          ) : (
            <>
              {/* Absolutely centered so the nav stays in the middle of the toolbar
                  no matter how wide the logo or the auth controls become. */}
              <Stack
                component="nav"
                direction="row"
                gap={0.5}
                aria-label={t("nav.main")}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  whiteSpace: "nowrap",
                }}
              >
                {navItems.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Button
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      color={active ? "primary" : "inherit"}
                      sx={{ fontWeight: active ? 700 : 500 }}
                      aria-current={active ? "page" : undefined}
                    >
                      {t(item.labelKey)}
                    </Button>
                  );
                })}
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                sx={{ flex: "1 1 0", minWidth: 0 }}
              >
                <LanguagePicker />
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ ml: "30px" }}>
                  {authButtons}
                </Stack>
              </Stack>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 260, pt: 1 }} role="presentation">
          <List component="nav" aria-label={t("nav.main")}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                selected={location.pathname === item.to}
                onClick={() => {
                  navigate(item.to);
                  closeDrawer();
                }}
              >
                <ListItemText primary={t(item.labelKey)} />
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
                    performSignOut();
                    closeDrawer();
                  }}
                >
                  {t("nav.signOut")}
                </Button>
              </Stack>
            ) : (
              <Stack gap={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    dispatch(openAuthDialog("signIn"));
                    closeDrawer();
                  }}
                >
                  {t("nav.signIn")}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    dispatch(openAuthDialog("signUp"));
                    closeDrawer();
                  }}
                >
                  {t("nav.signUp")}
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
