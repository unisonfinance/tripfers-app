
import React from 'react';

// NOTE: Currently the AdminDashboard.tsx handles its own layout (Sidebar + Content). 
// This file is reserved for future separation if the Admin panel grows into multiple routes.
export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="admin-layout-root">
      {children}
    </div>
  );
};
