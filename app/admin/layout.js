import { isAdminAuthed } from '@/lib/adminAuth';
import LogoutButton from './LogoutButton';
import SidebarNav from './SidebarNav';

// WordPress-style admin shell (Phase 4): a fixed left sidebar
// wraps every /admin page. The sidebar is defined ONCE here;
// each page only renders its own content inside .admin-main.
// When logged out, children render bare (the login page is a
// standalone card and must not show the sidebar).
export default async function AdminLayout({ children }) {
  const authed = await isAdminAuthed();
  if (!authed) {
    return <>{children}</>;
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          SHERA IT
          <span>অ্যাডমিন প্যানেল</span>
        </div>
        <SidebarNav />
        <div className="sidebar-footer">
          <LogoutButton />
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
