import React from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { useDenimNotifications } from 'denim/forms';

const CopyLink = () => {
  const url = 'https://airtable.com/shrMs1b9PvJW0F6D0';
  const notifications = useDenimNotifications();

  const copy = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();

    copyToClipboard(url);
    notifications.notify({
      type: 'success',
      message: 'Link copied to clipboard.',
      code: 1003,
    });
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={copy}
        style={{
          textAlign: 'center',
          fontFamily: 'Open Sans',
          fontSize: 18,
          textDecoration: 'none',
          color: '#555555',
        }}
      >
        💡 Click this to get the link off Employee Information Form
      </a>
    </div>
  );
};

export default CopyLink;
