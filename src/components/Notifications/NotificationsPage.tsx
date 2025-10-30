// NotificationsPage has been deprecated/removed.
// The application now surfaces notifications via the sidebar badges.
// This file remains as a no-op placeholder to avoid import-time errors in older branches.

import React from "react";

const NotificationsPage: React.FC = () => {
  // Intentionally render nothing — notifications are handled in the sidebar
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "NotificationsPage is deprecated; use sidebar badges instead."
      );
    }
  }, []);

  return null;
};

export default NotificationsPage;
