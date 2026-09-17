/**
 * The application shell: the header the whole family carries, and the path
 * routing that makes every page a shareable link.
 *
 * The page a visitor is on is state, not a prop — `state.view.activeTab` — and
 * the address is a mirror of it. `useRouteSync` keeps the two in step in both
 * directions: the address is applied to the state on load and on every
 * back/forward, and any state change is written back to it. What the two carry
 * is `src/share/route.ts`, so this file stays the shell.
 *
 * A link carrying `?embed` drops the header, its page bar and the footer, and
 * the shell renders the tool alone — which is what an embedded frame loads.
 */

import { effect } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { Suspense, lazy, useEffect } from 'react';
import { startDocumentMeta } from 'react-cheminfo/core';
import {
  CiteButton,
  EcosystemButton,
  HiddenPartsProvider,
  NavLink,
  SiteFooter,
  SiteHeader,
  SiteTheme,
} from 'react-cheminfo/ui';

import { ABOUT } from './about.ts';
import { Explorer } from './pages/Explorer.tsx';
import { PAGE_ROUTES } from './seo/routes.ts';
import { ShareButton } from './share/ShareButton.tsx';
import { applyRoute, currentRoute } from './share/route.ts';
import type { TabId } from './state/index.ts';
import {
  DEFAULT_TAB,
  NAV_TAB_IDS,
  TAB_LABELS,
  absoluteUrl,
  setActiveTab,
  state,
  withBase,
} from './state/index.ts';
import {
  formatRoute,
  pathOf,
  readRoute,
  subscribeToRoute,
  writeRoute,
} from './utils/router.ts';

/**
 * The whole application: the header, the page the address names, and the
 * footer under it.
 * @returns The shell, with exactly one page mounted.
 */
export function App(): ReactElement {
  useSignals();
  const activeTab = state.view.activeTab.value;

  useRouteSync();

  const framed = state.view.embedded.value;
  const hidden = state.view.hidden.value;
  const navItems = NAV_TAB_IDS.map((tab) => ({
    id: tab,
    label: TAB_LABELS[tab],
    href: withBase(pathOf(tab)),
    onSelect: () => {
      setActiveTab(tab);
    },
  }));

  return (
    <>
      <SiteTheme siteId="osiris" />
      <div className="app-screen">
        <SiteHeader
          siteId="osiris"
          width="full"
          embedded={framed}
          nav={navItems}
          activeId={activeTab}
          homeHref={withBase('/')}
          onHome={() => {
            setActiveTab(DEFAULT_TAB);
          }}
          markSize={24}
          actions={
            <>
              <NavLink
                item={{
                  id: 'about',
                  label: 'About',
                  href: withBase('/about'),
                  icon: 'info-sign',
                  title: 'What this tool predicts, and what it borrows',
                  onSelect: () => {
                    setActiveTab('about');
                  },
                }}
                active={activeTab === 'about'}
              />
              <CiteButton works={ABOUT.cite ?? []} />
              <EcosystemButton currentSiteId="osiris" />
              <ShareButton />
            </>
          }
        />

        {/*
          The one `page-<tab>` marker the end-to-end tests locate a page by. It
          lives on the shell, where exactly one exists at a time — a page adding
          its own would make the locator ambiguous and fail Playwright's strict
          mode.
        */}
        <main className="app-main" data-testid={`page-${activeTab}`}>
          <HiddenPartsProvider hidden={hidden}>
            <PageBody tab={activeTab} />
          </HiddenPartsProvider>
        </main>
      </div>

      <SiteFooter siteId="osiris" width="full" embedded={framed} />
    </>
  );
}

/*
  Only the Explorer is in the first chunk, because `/` is the tool and a
  visitor who typed the address is waiting for it. Compare carries the table
  and the figure, Method carries a Markdown renderer, and About carries the
  credits registry — none of which the Explorer needs, and all of which it paid
  for while they were imported here.
*/
const Compare = lazy(async () => {
  const page = await import('./pages/Compare.tsx');
  return { default: page.Compare };
});
const Method = lazy(async () => {
  const page = await import('./pages/Method.tsx');
  return { default: page.Method };
});
const About = lazy(async () => {
  const page = await import('./pages/About.tsx');
  return { default: page.About };
});

function PageBody(props: { tab: TabId }): ReactElement {
  const { tab } = props;
  if (tab === 'explorer') return <Explorer />;
  return (
    // No spinner: these arrive in a few hundred milliseconds on the link that
    // opened them, and a flash of chrome that then moves reads worse than the
    // header alone for that moment. `.app-screen > main` already holds the
    // height, so the footer does not jump while one loads.
    <Suspense fallback={<div aria-busy="true" />}>
      {tab === 'compare' ? <Compare /> : null}
      {tab === 'method' ? <Method /> : null}
      {tab === 'about' ? <About /> : null}
    </Suspense>
  );
}

/**
 * Two-way binding between the address and the view state.
 *
 * The signal `effect` is created *after* the initial route has been applied, so
 * it runs with the state the address just set and can never overwrite a deep
 * link with the defaults it captured a render earlier — the classic bug of a
 * `useEffect` whose dependencies are one render behind the signals.
 */
function useRouteSync(): void {
  useEffect(() => {
    function follow(): void {
      applyRoute(readRoute());
    }
    follow();
    const stopFollowing = subscribeToRoute(follow);
    const stopWriting = effect(() => {
      writeRoute(currentRoute());
    });
    const stopTitling = startDocumentMeta({
      site: 'osiris',
      routes: PAGE_ROUTES,
      url: () => formatRoute(currentRoute()),
      // Read off the page rather than off the build: the origin is whichever
      // host answered and the mount is the one stamped into the page, so a
      // deployment under `/osiris` describes itself instead of claiming an
      // address it does not serve.
      origin: absoluteUrl('/'),
      follow: effect,
    });
    return () => {
      stopFollowing();
      stopWriting();
      stopTitling();
    };
  }, []);
}
