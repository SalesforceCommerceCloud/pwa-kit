import React from 'react';

export function withComponentTag(Component) {
  const displayName = Component.displayName || Component.name || 'Unknown';

  const Wrapped = (props) => {
    return (
      <div data-component={displayName}>
        <Component {...props} />
      </div>
    );
  };

  Wrapped.displayName = `WithComponentTag(${displayName})`;
  return Wrapped;
}